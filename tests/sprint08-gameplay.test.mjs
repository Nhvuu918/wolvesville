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
 const created=await c.request('POST','/api/rooms',{name:'Sprint 08 gameplay confirmed',capacity:ids.length},host.token);
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

test('S08-G01 NEW official #8/#28 closed deck commits real night elimination and legitimate knight win, not hanged-jester win',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c,[8,28]);const {command}=await nightAttack(c,m,28);
  for(const u of m.users){const early=(await view(c,m,u)).game;assert.equal(early.completed,false);assert.equal(early.winnerIds,undefined);}
  const resolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  assert.equal(resolved.http,200,JSON.stringify(resolved));assert.equal(resolved.resolution.phase,'GAME_COMPLETED');
  for(const u of m.users){const after=(await view(c,m,u)).game;assert.equal(after.completed,true);assert.deepEqual(after.winnerIds,[m.byRole[8].profile.id]);
   assert.equal(after.players.find(p=>p.playerId===m.byRole[28].profile.id).publicReportedDead,true);
   const ev=(await events(c,m,u)).events;
   assert.equal(ev.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);assert.deepEqual(ev.find(e=>e.eventType==='PLAYER_ELIMINATED').payload,{playerId:m.byRole[28].profile.id});
   assert.equal(ev.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);
   assert.equal(ev.some(e=>['VERIFIED_ELIMINATION_AUDIT','POST_ELIMINATION_CHAIN_CLOSED','MATCH_COMPLETION_AUDIT'].includes(e.eventType)),false);
   assert.equal((await replay(c,m,u)).replay.verified,true);
  }
  assert.equal((await c.request('POST',`/api/games/${m.id}/actions`,command,m.byRole[8].token)).action.status,'RESOLVED');
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,409);
 }finally{await c.app.close();}
});

test('S08-G02 elimination + victory decisions survive SQLite restart with private role and event ACL',{timeout:40000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s08g-elim-')),db=join(dir,'run.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,[8,28]);await nightAttack(c,m,28);
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,200);
  const old=(await view(c,m,m.byRole[8])).game;
  const internal=withKernel((await c.store.gameById(m.id)).archive,false,(engine,repo)=>({
   chain:repo.events(m.id).filter(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'),
   match:repo.events(m.id).filter(e=>e.eventType==='MATCH_COMPLETION_AUDIT'),
   states:engine.getInternalState(m.id)
  }),true).value;
  assert.equal(internal.chain.length,1);assert.deepEqual(internal.chain[0].payload.sourceRules,['character.json#8','character.json#28','VH03','L02']);
  assert.equal(internal.match.length,1);assert.deepEqual(internal.states.winnerIds,[m.byRole[8].profile.id]);
  await c.app.close();c=null;d=await setup(db);
  assert.deepEqual((await view(d,m,m.byRole[8])).game,old);
  assert.equal((await replay(d,m,m.byRole[28])).replay.verified,true);
  const outsider=await d.user();assert.equal((await view(d,m,outsider)).http,403);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S08-G03 PH-02 cannot be stranded by closing voting while an accepted day skill is queued',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c,[25,74,79]);
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).resolution.phase,'DAY_DISCUSS');
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token)).http,200);
  const ballot={targetId:m.byRole[25].profile.id,ballotId:`b-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`};
  assert.equal((await c.request('POST',`/api/games/${m.id}/votes`,ballot,m.byRole[74].token)).http,200);
  const skill={skillId:'official.79.cancel-vote-reveal',targetIds:[m.byRole[25].profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`k-${randomUUID()}`};
  assert.equal((await c.request('POST',`/api/games/${m.id}/actions`,skill,m.byRole[79].token)).http,200);
  const saved=(await view(c,m,m.host)).game.revision;
  const rejected=await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.host.token);
  assert.equal(rejected.http,409);assert.equal(rejected.error.code,'PENDING_ACTIONS');
  assert.equal((await view(c,m,m.host)).game.revision,saved,'failed vote closure must not commit');
  const resolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  assert.equal(resolved.http,200,JSON.stringify(resolved));
  assert.equal(resolved.resolution.phase,'NIGHT_COLLECT');
  const own=(await view(c,m,m.byRole[79])).game,foreign=(await view(c,m,m.byRole[25])).game;
  assert.equal(own.round,2);assert.equal(own.voting.outcome,'CANCELLED_NO_ELIMINATION');
  assert.equal(foreign.voting.outcome,'CANCELLED_NO_ELIMINATION');assert.equal(foreign.voting.ownBallot,undefined);
  assert.equal(own.completed,false);assert.ok(own.players.every(p=>!p.publicReportedDead));
  for(const u of m.users){const ev=(await events(c,m,u)).events;
   assert.equal(ev.filter(e=>e.eventType==='VOTE_OUTCOME_CONFIRMED').length,1);
   assert.deepEqual(ev.find(e=>e.eventType==='VOTE_OUTCOME_CONFIRMED').payload,{round:1,outcome:'CANCELLED_NO_ELIMINATION'});
   assert.equal(ev.some(e=>e.eventType==='PLAYER_ELIMINATED'||e.eventType==='MATCH_COMPLETED'),false);
   assert.equal((await replay(c,m,u)).replay.verified,true);
  }
 }finally{await c.app.close();}
});

test('S08-G04 vote-close with unique raw leader stays unresolved; no winner, no public tally or elimination',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c,[25,74]);await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token);
  const target=m.users[0].profile.id;
  for(const u of m.users){assert.equal((await c.request('POST',`/api/games/${m.id}/votes`,{targetId:target,ballotId:`b-${randomUUID()}`,idempotencyKey:`k-${randomUUID()}`},u.token)).http,200);}
  const c1=await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.host.token);assert.equal(c1.http,200);
  const sv=(await view(c,m,m.users[1])).game;
  assert.equal(sv.voting.outcome,'ADJUDICATION_UNRESOLVED');assert.equal(sv.completed,false);assert.equal(sv.phase,'DAY_RESOLVE');
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,409);
  assert.ok(!JSON.stringify(sv).includes('counts'));assert.ok(!JSON.stringify(sv).includes('leaders'));
  const internal=withKernel((await c.store.gameById(m.id)).archive,false,engine=>engine.getInternalState(m.id),true).value;
  assert.equal(internal.voting.review.highest,2);
  assert.equal(internal.voting.outcome.noElimination,false);
  assert.equal((await replay(c,m,m.host)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S08-G05 source-grounded vote adjudicator never promotes raw votes to an official hanging target',{timeout:15000},()=>{
 const voting={round:1,status:'CLOSED_UNRESOLVED',intents:[{voterId:'a',targetId:'b',ballotId:'x',idempotencyKey:'y'}]};
 assert.throws(()=>certifiedVoteEliminationTarget(voting),e=>e.code==='RULE_UNRESOLVED');
 assert.equal(certifiedVoteEliminationTarget({...voting,status:'CANCELLED',outcome:{kind:'CANCELLED_NO_ELIMINATION',noElimination:true}}),null);
 assert.throws(()=>certifiedVoteEliminationTarget({...voting,status:'CANCELLED'}),e=>e.code==='OUT_OF_PHASE');
 const fake={phase:'DAY_RESOLVE',round:1,participants:[{playerId:'wolf',currentCharacterId:79}],voting:{round:1,status:'CLOSED_UNRESOLVED',intents:[]}};
 assert.throws(()=>resolveCertifiedCancellation(fake,'wolf'),e=>e.code==='RULE_UNRESOLVED');
});

test('S08-G06 death chain and match winner cannot be certified without exact deck and valid source-specific audit',{timeout:15000},()=>{
 const state={completed:false,phase:'NIGHT_FINALIZE',participants:[{playerId:'knight',currentCharacterId:8,initialCharacterId:8,life:'ALIVE',winLinks:[],effects:[]},{playerId:'seer',currentCharacterId:25,initialCharacterId:25,life:'DEAD_FINAL',publicReportedDead:true,winLinks:[],effects:[]}],links:[],round:1};
 assert.equal(resolveCertifiedVictory(state,[],0).kind,'NOT_YET');
 assert.equal(resolveCertifiedVictory(state,[],1).blocker,'PENDING_ACCEPTED_ACTIONS');
 assert.equal(certifyKnightPostElimination(state,'seer').pendingEffects,0);
 const poisoned={...state,participants:state.participants.map(p=>p.playerId==='seer'?{...p,effects:[{kind:'UNVERIFIED_PROTECTION'}]}:p)};
 assert.throws(()=>certifyKnightPostElimination(poisoned,'seer'),e=>e.code==='RULE_UNRESOLVED');
 const other={...state,participants:[...state.participants,{playerId:'third',currentCharacterId:31,initialCharacterId:31,life:'ALIVE',winLinks:[],effects:[]}]};
 assert.throws(()=>certifyKnightPostElimination(other,'seer'),e=>e.code==='RULE_UNRESOLVED');
});

test('S08-G07 concurrency: one voter cannot submit two independent ballots, no double events or uncommitted winner',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c,[25,74]);await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token);
  const all=await Promise.all([0,1].map(i=>c.request('POST',`/api/games/${m.id}/votes`,{
   targetId:m.users[i].profile.id,ballotId:`g07-b-${i}-${randomUUID()}`,idempotencyKey:`g07-key-${i}-${randomUUID()}`},m.users[0].token)));
  assert.deepEqual(all.map(x=>x.http).sort(),[200,409]);
  const result=(await view(c,m,m.host)).game;assert.equal(result.voting.submittedCount,1);
  assert.equal((await events(c,m,m.host)).events.filter(e=>e.eventType==='VOTE_INTENT_RECORDED').length,1);
  assert.equal((await replay(c,m,m.host)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S08-G08 cancelled day flows to round two, skill #79 never becomes available again, no fabricated elimination',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c,[25,74,79]);await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token);
  assert.equal((await c.request('POST',`/api/games/${m.id}/actions`,{skillId:'official.79.cancel-vote-reveal',targetIds:[m.byRole[25].profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`},m.byRole[79].token)).http,200);
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).resolution.phase,'NIGHT_COLLECT');
  assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).resolution.phase,'DAY_DISCUSS');
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token)).http,200);
  const next=(await view(c,m,m.byRole[79])).game;
  assert.equal(next.round,2);assert.equal(next.capabilities.find(s=>s.skillId==='official.79.cancel-vote-reveal').available,false);
  const retry=await c.request('POST',`/api/games/${m.id}/actions`,{skillId:'official.79.cancel-vote-reveal',targetIds:[m.byRole[25].profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`},m.byRole[79].token);
  assert.equal(retry.http,409);assert.equal(retry.error.code,'RESOURCE_INSUFFICIENT');
  const close=await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.host.token);
  assert.equal(close.http,200);assert.equal(close.voting.status,'RULE_UNRESOLVED');
  assert.equal((await replay(c,m,m.host)).replay.verified,true);
 }finally{await c.app.close();}
});
