import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {SqliteRepository} from '../dist/backend/src/persistence/sqlite.js';
import {EngineService} from '../dist/backend/src/engine/service.js';
import {RuleRegistry} from '../dist/backend/src/engine/rules.js';
import {auditCertifiedCoercion} from '../dist/backend/src/engine/vote-control-review.js';
import {auditRawBallots} from '../dist/backend/src/engine/vote-review.js';
const PASS='S09Test-Password-123';
async function setup(db=':memory:'){
 const store=new SqliteMultiplayerStore(db),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),url=`http://127.0.0.1:${port}`;
 const call=async(method,path,body,token)=>{
  const res=await fetch(url+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {http:res.status,...await res.json()};
 };
 const create=async()=>{const username=`s09${randomUUID().replaceAll('-','').slice(0,17)}`;
  assert.equal((await call('POST','/api/auth/register',{username,password:PASS})).http,201);
  const x=await call('POST','/api/auth/login',{username,password:PASS});assert.equal(x.http,200);return x;};
 return {store,app,call,create};
}
async function init(c,roles=[25,33,74]){
 const users=await Promise.all(roles.map(()=>c.create())),host=users[0];
 const created=await c.call('POST','/api/rooms',{name:'S09 official vote coercion test',capacity:roles.length},host.token);
 assert.equal(created.http,201);const room=created.room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const started=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(started.http,201,JSON.stringify(started));const id=started.game.gameId,byRole={};
 for(const u of users){const v=(await c.call('GET',`/api/games/${id}`,undefined,u.token)).game;
  const mine=v.players.find(p=>p.playerId===u.profile.id).self;byRole[mine.currentCharacterId]=u;
  assert.equal(v.players.filter(p=>p.self).length,1);
 }
 return {users,host,id,byRole};
}
const post=(c,m,path,body={},u=m.host)=>c.call('POST',`/api/games/${m.id}/${path}`,body,u.token);
const get=(c,m,path,u=m.host)=>c.call('GET',`/api/games/${m.id}${path}`,undefined,u.token);
const ballot=(c,m,u,target)=>post(c,m,'votes',{targetId:target.profile.id,ballotId:`ballot-${randomUUID()}`,idempotencyKey:`idem-${randomUUID()}`},u);
async function day(c,m){assert.equal((await post(c,m,'resolve')).resolution.phase,'DAY_DISCUSS');assert.equal((await post(c,m,'voting-open')).http,200);}
const audit=(c,m)=>withKernel(c.store.gameById(m.id).then(x=>x.archive),false,()=>null,true);
async function internal(c,m){const stored=await c.store.gameById(m.id);return withKernel(stored.archive,false,(e,repo)=>({state:e.getInternalState(m.id),events:repo.events(m.id)}),true).value;}

// Genuine rule execution, NOT a raw-tally preview masquerading as execution.
test('S09-01 certified #33 server-side directive transforms a ballot with private audit but never hangs a player',{timeout:45000},async()=>{
 const c=await setup();try{const m=await init(c);await day(c,m);
  const wolf=m.byRole[33],target=m.byRole[25],third=m.byRole[74];
  const before=await get(c,m,'',wolf);
  assert.ok(before.game.capabilities.some(x=>x.skillId==='official.33.force-vote'&&x.available));
  const submission={skillId:'official.33.force-vote',targetIds:[target.profile.id],actionId:`action-${randomUUID()}`,idempotencyKey:`idempotency-${randomUUID()}`};
  assert.equal((await post(c,m,'actions',submission,wolf)).action.status,'ACCEPTED');
  const pending=await get(c,m,'',third);assert.equal(pending.game.completed,false);
  assert.equal((await post(c,m,'voting-close')).error.code,'PENDING_ACTIONS');
  const resolution=await post(c,m,'resolve');assert.equal(resolution.http,200,JSON.stringify(resolution));
  assert.equal(resolution.resolution.phase,'DAY_VOTE_COLLECT');
  assert.equal((await get(c,m,'',wolf)).game.capabilities.find(x=>x.skillId==='official.33.force-vote').available,false);
  const ownTarget=third,ownWolfVote=target;
  assert.equal((await ballot(c,m,wolf,ownTarget)).http,200);
  assert.equal((await ballot(c,m,target,ownWolfVote)).http,200);
  assert.equal((await ballot(c,m,third,ownWolfVote)).http,200);
  const closed=await post(c,m,'voting-close');assert.equal(closed.http,200,JSON.stringify(closed));
  const saved=await internal(c,m);
  assert.equal(saved.state.voting.status,'CLOSED_UNRESOLVED');
  assert.deepEqual(saved.state.voting.directives.map(x=>[x.controllerId,x.voterId]),[[wolf.profile.id,target.profile.id]]);
  assert.equal(saved.state.voting.review.finalBallotsVerified,true);
  assert.equal(saved.state.voting.review.appliedDirectives,1);
  assert.deepEqual(saved.state.voting.review.counts.map(x=>x.count),[2,1]);
  assert.deepEqual(saved.state.voting.review.effectiveCounts.map(x=>x.count),[2,1]);
  assert.equal(saved.state.voting.review.effectiveCounts[0].targetId,third.profile.id,'wolf forces target to mirror wolf choice');
  assert.equal(saved.state.voting.outcome.kind,'ADJUDICATION_UNRESOLVED');
  assert.equal(saved.state.participants.filter(p=>p.publicReportedDead).length,0);
  for(const u of m.users){const v=await get(c,m,'',u),ev=await get(c,m,'/events',u),rp=await get(c,m,'/replay',u);
   assert.equal(v.http,200);assert.equal(v.game.phase,'DAY_RESOLVE');assert.equal(v.game.completed,false);
   assert.equal(v.game.voting.outcome,'ADJUDICATION_UNRESOLVED');
   for(const secret of ['directives','effectiveCounts','counts','controllerId','sourceActionId','VOTE_CONTROL_SCHEDULED']){
    assert.equal(JSON.stringify(v.game).includes(secret),false,secret);
    assert.equal(JSON.stringify(ev.events).includes(secret),false,secret);
   }
   assert.equal(rp.replay.verified,true);
  }
  const fallback=await post(c,m,'resolve');assert.equal(fallback.http,409);
 }finally{await c.app.close();}
});

test('S09-02 coercion is once-per-match and all retries preserve idempotency and revision',{timeout:40000},async()=>{
 const c=await setup();try{const m=await init(c);await day(c,m);
  const wolf=m.byRole[33],target=m.byRole[25];
  const action={skillId:'official.33.force-vote',targetIds:[target.profile.id],actionId:`s09-a-${randomUUID()}`,idempotencyKey:`s09-k-${randomUUID()}`};
  assert.equal((await post(c,m,'actions',action,wolf)).http,200);
  const retry=await post(c,m,'actions',action,wolf);assert.equal(retry.http,200);assert.equal(retry.action.duplicate,true);
  assert.equal((await post(c,m,'resolve')).http,200);
  assert.equal((await post(c,m,'actions',{...action,actionId:`s09-a-${randomUUID()}`,idempotencyKey:`s09-k-${randomUUID()}`},wolf)).error.code,'RESOURCE_INSUFFICIENT');
  const raw=await internal(c,m);assert.equal(raw.state.voting.directives.length,1);
  assert.equal(raw.events.filter(e=>e.eventType==='VOTE_CONTROL_SCHEDULED').length,1);
  assert.equal((await get(c,m,'/replay',wolf)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S09-03 never fabricate an effective ballot if controller or target has not voted',{timeout:35000},async()=>{
 const c=await setup();try{const m=await init(c);await day(c,m);
  const wolf=m.byRole[33],target=m.byRole[25];
  const a={skillId:'official.33.force-vote',targetIds:[target.profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`k-${randomUUID()}`};
  await post(c,m,'actions',a,wolf);await post(c,m,'resolve');await ballot(c,m,target,m.byRole[74]);
  const closed=await post(c,m,'voting-close');assert.equal(closed.http,200);
  const state=(await internal(c,m)).state;
  assert.equal(state.voting.review.finalBallotsVerified,false);
  assert.equal(state.voting.review.effectiveCounts,undefined);
  assert.ok(state.voting.review.blockers.includes('VOTE_CONTROLLER_OR_TARGET_BALLOT_MISSING'));
  assert.equal(state.voting.outcome.kind,'ADJUDICATION_UNRESOLVED');
  assert.equal(state.completed,false);
 }finally{await c.app.close();}
});

test('S09-04 replay and frozen ACL remain valid after SQLite restart',{timeout:50000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s09-persist-')),filename=join(dir,'game.sqlite');let c,d;
 try{c=await setup(filename);const m=await init(c);await day(c,m);
  const w=m.byRole[33],t=m.byRole[25];
  await post(c,m,'actions',{skillId:'official.33.force-vote',targetIds:[t.profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`k-${randomUUID()}`},w);
  await post(c,m,'resolve');await ballot(c,m,w,m.byRole[74]);await ballot(c,m,t,w);
  await post(c,m,'voting-close');const pre=(await internal(c,m)).state;
  await c.app.close();c=null;d=await setup(filename);
  const postState=(await internal(d,m)).state;
  assert.deepEqual(postState.voting,pre.voting);
  assert.equal((await get(d,m,'/replay',w)).replay.verified,true);
  const outsider=await d.create();assert.equal((await get(d,m,'',outsider)).http,403);
  assert.equal((await get(d,m,'/events',t)).events.some(e=>e.eventType==='VOTE_CONTROL_SCHEDULED'),false);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S09-05 private audit never authorizes hanging, including tied votes and transformed unique leader',()=>{
 const make=(pairs,ds)=>({round:1,status:'OPEN',intents:pairs.map(([voterId,targetId],i)=>({voterId,targetId,ballotId:`b-${i}`,idempotencyKey:`k-${i}`})),directives:ds});
 const tied=make([['a','x'],['b','y']],[]);
 assert.equal(auditCertifiedCoercion(tied,auditRawBallots(tied.intents)).equalTop,true);
 const incomplete=make([['a','x']], [{voterId:'b',controllerId:'a',ruleId:'OFFICIAL_CHAR_33_VOTE_COERCION',sourceActionId:'a'}]);
 assert.equal(auditCertifiedCoercion(incomplete,auditRawBallots(incomplete.intents)).finalBallotsVerified,false);
});

test('S09-06 character.json#23 forbids voting AFTER death, never while alive; denied vote is atomic',()=>{
 const repo=new SqliteRepository(':memory:');try{
  const engine=new EngineService(repo,new RuleRegistry());
  const gameId='s09-role23-vote-test';engine.createGame('s09-room',[{playerId:'gunner',characterId:23},{playerId:'seer',characterId:25}],{gameId,seed:'s09-fixed-seed'});
  for(const phase of ['ROLE_ASSIGNED','NIGHT_COLLECT','NIGHT_RESOLVE','NIGHT_FINALIZE','DAY_DISCUSS'])engine.transition(gameId,phase);
  engine.openVoting(gameId);
  // Source says "không thể vote sau khi đã chết"; living #23 is eligible.
  const ok=engine.submitVoteIntent(gameId,'gunner','seer','s09alive23ballot','s09alive23idem');
  assert.equal(ok.status,'RECORDED');assert.equal(ok.duplicate,false);
  assert.equal(engine.replay(gameId).verified,true);
  // Set a DEAD_FINAL state only as a narrow unit-test fixture. This does NOT
  // claim a certified #23 elimination pipeline or a replayable death event.
  repo.transaction(()=>{const s=repo.get(gameId).state;const old=s.revision;
   const actor=s.participants.find(p=>p.playerId==='gunner');actor.life='DEAD_FINAL';actor.publicReportedDead=true;
   s.revision++;repo.update(s,old);
  });
  const before=engine.getInternalState(gameId),n=repo.events(gameId).length;
  assert.throws(()=>engine.submitVoteIntent(gameId,'gunner','seer','s09dead23ballot','s09dead23idem'),e=>e.code==='UNAUTHORIZED');
  assert.equal(engine.getInternalState(gameId).revision,before.revision);
  assert.equal(repo.events(gameId).length,n);
 }finally{repo.close();}
});

test('S09-07 inherited QA-only day advance cannot fabricate vote, hanging or victory',{timeout:35000},async()=>{
 const c=await setup();try{
  const m=await init(c,[25,74]);
  assert.equal((await post(c,m,'resolve')).resolution.phase,'DAY_DISCUSS');
  // Inherited development test shell needed to exercise next-night statuses.
  // It does NOT certify a general official skip-day rule or add Metric B.
  const shell=await post(c,m,'resolve');assert.equal(shell.http,200);
  assert.equal(shell.resolution.phase,'NIGHT_COLLECT');
  const after=(await get(c,m,'')).game;
  assert.equal(after.completed,false);assert.equal(after.round,2);
  assert.equal(after.players.some(p=>p.publicReportedDead),false);
  const publicEvents=(await get(c,m,'/events')).events;
  assert.equal(publicEvents.some(e=>['VOTE_LOCKED','PLAYER_ELIMINATED','MATCH_COMPLETED'].includes(e.eventType)),false);
  assert.equal((await get(c,m,'/replay')).replay.verified,true);
 }finally{await c.app.close();}
});
