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
async function hang(c,m,role,voterRole){
 const target=m.byRole[role].profile.id;assert.equal((await post(c,m,'voting-open')).http,200);
 assert.equal((await post(c,m,'votes',vote(target),m.byRole[voterRole])).http,200);
 const r=await post(c,m,'voting-close');assert.equal(r.http,200,JSON.stringify(r));return (await view(c,m,m.host)).game;
}

// Each distinct deck must prove actual vote, death, victory and durable multi-client state.
for(const ids of [[8,25],[8,28],[8,9,25],[8,9,28],[8,25,28],[8,9,25,28]])test(`S12 durable metric evidence ${ids.join(',')}`,async t=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s12-metric-')),db=join(dir,'run.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,ids);
 if(ids.includes(9)&&ids.includes(25))assert.equal((await protect(c,m,25)).http,200);
 if(ids.includes(9)&&ids.includes(25)){await nightAttack(c,m,9);await resolve(c,m);await next(c,m);await nightAttack(c,m,25);await resolve(c,m);if(ids.includes(28)){await next(c,m);await nightAttack(c,m,25);await resolve(c,m);}}
 else if(ids.length===3){await nightAttack(c,m,ids.includes(9)?9:25);await resolve(c,m);}
 else await resolve(c,m);
 const victim=ids.includes(28)?28:25;
 await hang(c,m,victim,8);
 const x=await internal(c,m);assert.equal(x.state.completed,true);
 assert.equal(x.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);
 const expected=[m.byRole[8].profile.id,...(ids.includes(28)?[m.byRole[28].profile.id]:[])];
 assert.deepEqual(new Set(x.state.winnerIds),new Set(expected));
 const voteEvidence=x.events.some(e=>e.eventType==='HANGING_AUTHORIZED')&&x.events.some(e=>e.eventType==='OFFICIAL_VOTE_RESULT'&&e.payload.outcome==='HANGING_COMPLETED')&&x.events.some(e=>e.eventType==='VICTORY_EVALUATED');
 assert.equal(voteEvidence,true);assert.ok(x.events.some(e=>e.eventType==='PLAYER_ELIMINATED'));
 for(const p of x.state.participants.filter(p=>p.life==='DEAD_FINAL'))assert.ok(x.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0));
 const saved=[];for(const u of m.users){const g=(await view(c,m,u)).game;assert.equal(g.completed,true);assert.deepEqual(new Set(g.winnerIds),new Set(expected));assert.equal(JSON.stringify(g).includes('officialAudit'),false);assert.equal((await events(c,m,u)).events.some(e=>['HANGING_AUTHORIZED','VICTORY_EVALUATED','OFFICIAL_ATTACK_BLOCKED','POST_ELIMINATION_CHAIN_CLOSED','RESOLUTION_GATE'].includes(e.eventType)),false);assert.equal((await replay(c,m,u)).replay.verified,true);saved.push(g);}
 await c.app.close();c=null;d=await setup(db);for(const [i,u] of m.users.entries()){assert.deepEqual((await view(d,m,u)).game,saved[i]);assert.equal((await replay(d,m,u)).replay.verified,true);}
 t.diagnostic('METRIC_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain:voteEvidence,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
