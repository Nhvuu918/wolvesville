import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {certifiedVoteEliminationTarget,resolveCertifiedCancellation} from '../dist/backend/src/engine/vote-adjudicator.js';
import {certifyKnightPostElimination} from '../dist/backend/src/engine/elimination-chain.js';
import {resolveCertifiedVictory} from '../dist/backend/src/official/victory-resolver.js';
const PASS='S08GameplayProof-9@Password';
async function setup(db=':memory:'){
 const store=new SqliteMultiplayerStore(db),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start();const root=`http://127.0.0.1:${port}`;
 const request=async(method,path,body,token)=>{
  const response=await fetch(root+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {http:response.status,...await response.json()};
 };
 const user=async()=>{const username=`g8${randomUUID().replaceAll('-','').slice(0,15)}`;
  assert.equal((await request('POST','/api/auth/register',{username,password:PASS})).http,201);
  const u=await request('POST','/api/auth/login',{username,password:PASS});assert.equal(u.http,200);return u;};
 return {store,app,request,user,root};
}
async function match(c,ids){
 const users=await Promise.all(ids.map(()=>c.user())),host=users[0];
 const created=await c.request('POST','/api/rooms',{name:'Sprint 12 gameplay verification',capacity:ids.length},host.token);
 assert.equal(created.http,201,JSON.stringify(created));const room=created.room;
 for(const u of users.slice(1))assert.equal((await c.request('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.request('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const started=await c.request('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(started.http,201,JSON.stringify(started));const id=started.game.gameId,byRole={};
 for(const u of users){const view=(await c.request('GET',`/api/games/${id}`,undefined,u.token)).game;
  const me=view.players.find(p=>p.playerId===u.profile.id).self;
  assert.ok(me);assert.equal(view.players.filter(p=>p.self).length,1);
  byRole[me.currentCharacterId]=u;
 }
 return {users,byRole,host,id,room};
}
const view=(c,m,u)=>c.request('GET',`/api/games/${m.id}`,undefined,u.token);
const events=(c,m,u)=>c.request('GET',`/api/games/${m.id}/events`,undefined,u.token);
const replay=(c,m,u)=>c.request('GET',`/api/games/${m.id}/replay`,undefined,u.token);
async function nightAttack(c,m,targetRole){
 const a={skillId:'official.8.night-kill',targetIds:[m.byRole[targetRole].profile.id],actionId:`attack-${randomUUID()}`,idempotencyKey:`idem-${randomUUID()}`};
 const first=await c.request('POST',`/api/games/${m.id}/actions`,a,m.byRole[8].token);assert.equal(first.http,200,JSON.stringify(first));
 assert.equal(first.action.status,'ACCEPTED');
 return {command:a,first};
}


const post=(c,m,path,body={},u=m.host)=>c.request('POST',`/api/games/${m.id}/${path}`,body,u.token);
const vote=(targetId,revision)=>({targetId,ballotId:`b-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`,expectedRevision:revision});
async function open(c,m){assert.equal((await post(c,m,'resolve')).resolution.phase,'DAY_DISCUSS');assert.equal((await post(c,m,'voting-open')).http,200);}
const internal=async(c,m)=>withKernel((await c.store.gameById(m.id)).archive,false,(e,r)=>({state:e.getInternalState(m.id),events:r.events(m.id)}),true).value;
const shield=(s,id)=>s.participants.find(p=>p.playerId===id).effects.filter(e=>e.kind==='OFFICIAL_9_SNOW_PROTECTION');
const protect=(c,m,role)=>post(c,m,'actions',{skillId:'official.9.snow-protection',targetIds:[m.byRole[role].profile.id],actionId:`p-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`},m.byRole[9]);
async function next(c,m){assert.equal((await post(c,m,'voting-open')).http,200);assert.equal((await post(c,m,'voting-close')).http,200);}
async function resolve(c,m){const r=await post(c,m,'resolve');assert.equal(r.http,200,JSON.stringify(r));return r;}
test('S12 real HTTP: shield absorbs once, retry, next attack kills, restart replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s12-')),db=join(dir,'run.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,[8,9,25]),t=m.byRole[25].profile.id;
 assert.equal((await protect(c,m,25)).http,200);const a=await nightAttack(c,m,25);assert.equal((await post(c,m,'actions',a.command,m.byRole[8])).http,200);await resolve(c,m);
 let x=await internal(c,m);assert.equal(shield(x.state,t).length,0);assert.equal(x.state.participants.find(p=>p.playerId===t).life,'ALIVE');assert.equal(x.events.filter(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED').length,1);
 for(const u of m.users){assert.equal((await events(c,m,u)).events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'),false);assert.equal((await replay(c,m,u)).replay.verified,true);}
 await next(c,m);assert.equal((await post(c,m,'actions',a.command,m.byRole[8])).http,200);await nightAttack(c,m,25);await resolve(c,m);x=await internal(c,m);assert.equal(x.state.participants.find(p=>p.playerId===t).life,'DEAD_FINAL');assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);
 const saved=(await view(c,m,m.host)).game;await c.app.close();c=null;d=await setup(db);assert.deepEqual((await view(d,m,m.host)).game,saved);assert.equal((await replay(d,m,m.host)).replay.verified,true);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S12 shield survives creator death and absorbs in following night; knight wins after hanging',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s12-win-')),db=join(dir,'run.sqlite');let c=await setup(db),d;try{const m=await match(c,[8,9,25]),t=m.byRole[25].profile.id;
 assert.equal((await protect(c,m,25)).http,200);await nightAttack(c,m,9);await resolve(c,m);let x=await internal(c,m);assert.equal(shield(x.state,t).length,1);assert.equal(x.state.participants.find(p=>p.currentCharacterId===9).life,'DEAD_FINAL');
 await next(c,m);await nightAttack(c,m,25);await resolve(c,m);x=await internal(c,m);assert.equal(shield(x.state,t).length,0);assert.equal(x.state.participants.find(p=>p.playerId===t).life,'ALIVE');
 await post(c,m,'voting-open');assert.equal((await post(c,m,'votes',vote(t),m.byRole[8])).http,200);assert.equal((await post(c,m,'voting-close')).http,200);for(const u of m.users){const g=(await view(c,m,u)).game;assert.equal(g.completed,true);assert.deepEqual(g.winnerIds,[m.byRole[8].profile.id]);assert.equal((await replay(c,m,u)).replay.verified,true);}
 const saved=(await view(c,m,m.host)).game;await c.app.close();c=null;d=await setup(db);assert.deepEqual((await view(d,m,m.host)).game,saved);assert.equal((await replay(d,m,m.host)).replay.verified,true);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S12 shield expires after two nights without attack',async()=>{
 const c=await setup();try{const m=await match(c,[8,9,28]),t=m.byRole[28].profile.id;assert.equal((await protect(c,m,28)).http,200);await resolve(c,m);await next(c,m);await resolve(c,m);await next(c,m);await nightAttack(c,m,28);await resolve(c,m);const x=await internal(c,m);assert.equal(x.state.participants.find(p=>p.playerId===t).life,'DEAD_FINAL');assert.equal(x.events.filter(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED').length,0);
 }finally{await c.app.close();}
});

async function hang(c,m,role,voterRole){
 const target=m.byRole[role].profile.id;assert.equal((await post(c,m,'voting-open')).http,200);
 assert.equal((await post(c,m,'votes',vote(target),m.byRole[voterRole])).http,200);
 const r=await post(c,m,'voting-close');assert.equal(r.http,200,JSON.stringify(r));return (await view(c,m,m.host)).game;
}
test('S12 [8,9,28] knight hanging continues with a living independent contender, Jester hanging completes',async()=>{
 const c=await setup();try{const m=await match(c,[8,9,28]);await resolve(c,m);let g=await hang(c,m,8,9);assert.equal(g.resolutionStatus,'CONTINUE');assert.equal(g.phase,'NIGHT_COLLECT');assert.equal(g.round,2);assert.equal(g.completed,false);await resolve(c,m);g=await hang(c,m,28,9);assert.equal(g.completed,true);assert.deepEqual(g.winnerIds,[m.byRole[28].profile.id]);assert.equal(g.resolutionStatus,'GAME_COMPLETED');for(const u of m.users)assert.equal((await replay(c,m,u)).replay.verified,true);
 }finally{await c.app.close();}
});
test('S12 [8,9,25] knight hanging blocks missing faction predicate, no artificial winner, retry rollback',async()=>{
 const c=await setup();try{const m=await match(c,[8,9,25]);await resolve(c,m);const g=await hang(c,m,8,9);assert.equal(g.resolutionStatus,'BLOCKED_BY_RULE');assert.equal(g.phase,'DAY_RESOLVE');assert.equal(g.completed,false);assert.equal(g.winnerIds,undefined);assert.equal((await post(c,m,'resolve')).http,409);assert.equal((await post(c,m,'voting-close')).http,409);assert.deepEqual((await view(c,m,m.host)).game,g);const x=await internal(c,m);assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);assert.equal(x.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,0);assert.equal((await replay(c,m,m.host)).replay.verified,true);
 }finally{await c.app.close();}
});
test('S12 [8,25,28] night attack then hanging: simultaneous winners',async()=>{
 const c=await setup();try{const m=await match(c,[8,25,28]);await nightAttack(c,m,25);await resolve(c,m);const g=await hang(c,m,28,8);assert.equal(g.completed,true);assert.deepEqual(new Set(g.winnerIds),new Set([m.byRole[8].profile.id,m.byRole[28].profile.id]));for(const u of m.users)assert.equal((await replay(c,m,u)).replay.verified,true);
 }finally{await c.app.close();}
});
test('S12 [8,9,25,28] multi-round night deaths and hanging, closed chains and private events',async()=>{
 const c=await setup();try{const m=await match(c,[8,9,25,28]);await protect(c,m,25);await nightAttack(c,m,9);await resolve(c,m);await next(c,m);await nightAttack(c,m,25);await resolve(c,m);await next(c,m);await nightAttack(c,m,25);await resolve(c,m);const g=await hang(c,m,28,8);assert.equal(g.completed,true);assert.deepEqual(new Set(g.winnerIds),new Set([m.byRole[8].profile.id,m.byRole[28].profile.id]));const x=await internal(c,m);assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,3);assert.equal(x.events.filter(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED').length,3);assert.equal(x.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);for(const u of m.users){assert.equal((await replay(c,m,u)).replay.verified,true);assert.equal((await events(c,m,u)).events.some(e=>['OFFICIAL_ATTACK_BLOCKED','POST_ELIMINATION_CHAIN_CLOSED','RESOLUTION_GATE'].includes(e.eventType)),false);}
 }finally{await c.app.close();}
});
import {classifyS12Resolution} from '../dist/backend/src/official/victory-resolver.js';
test('S12 pending chain / pending actions cannot be classified as continuation (unit, no gameplay metric)',()=>{
 for(const blocker of ['PENDING_ACCEPTED_ACTIONS','POST_ELIMINATION_CHAIN_UNVERIFIED'])assert.equal(classifyS12Resolution({round:2},{kind:'NOT_YET',winnerIds:[],blocker}).status,'PENDING_EFFECT');
});
