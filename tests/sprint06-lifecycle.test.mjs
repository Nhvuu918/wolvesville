import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {evaluateVerifiedSoleSurvivorFacts,canHangHeadlessKnight} from '../dist/backend/src/official/victory-predicates.js';
const password='S06PasswordForIntegration!';
async function setup(path=':memory:'){
 const store=new SqliteMultiplayerStore(path);const app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),root=`http://127.0.0.1:${port}`;
 async function request(method,path,body,token){const r=await fetch(root+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};}
 async function user(){const username='s06'+randomUUID().replaceAll('-','').slice(0,14);assert.equal((await request('POST','/api/auth/register',{username,password})).http,201);return request('POST','/api/auth/login',{username,password});}
 return {app,store,request,user,root};
}
async function match(ctx){
 const a=await ctx.user(),b=await ctx.user(),outside=await ctx.user();
 const room=(await ctx.request('POST','/api/rooms',{name:'S06 test vote lifecycle',capacity:2},a.token)).room;
 assert.equal((await ctx.request('POST',`/api/rooms/${room.id}/join`,{},b.token)).http,200);
 assert.equal((await ctx.request('POST',`/api/rooms/${room.id}/lock`,{},a.token)).http,200);
 const start=await ctx.request('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,74],idempotencyKey:`s06-start-${randomUUID()}`},a.token);
 assert.equal(start.http,201,JSON.stringify(start));
 const id=start.game.gameId;
 return {a,b,outside,id,room};
}
async function day(ctx,m){const r=await ctx.request('POST',`/api/games/${m.id}/resolve`,{},m.a.token);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'DAY_DISCUSS');}
async function open(ctx,m){return ctx.request('POST',`/api/games/${m.id}/voting-open`,{},m.a.token);}
async function vote(ctx,m,voter,target,overrides={}){return ctx.request('POST',`/api/games/${m.id}/votes`,{targetId:target.profile.id,ballotId:`s06-${randomUUID()}`,idempotencyKey:`s06-key-${randomUUID()}`,...overrides},voter.token);}
const get=(ctx,m,user)=>ctx.request('GET',`/api/games/${m.id}`,undefined,user.token);

test('S06-01 night→dawn→vote intake→close is committed; no invented elimination/endgame',{timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);await day(c,m);const a=await open(c,m);assert.equal(a.http,200);assert.equal(a.voting.phase,'DAY_VOTE_COLLECT');
  const v=await vote(c,m,m.a,m.b);assert.equal(v.http,200);assert.equal(v.vote.status,'RECORDED');
  const b=await vote(c,m,m.b,m.a);assert.equal(b.http,200);
  const preview=(await get(c,m,m.b)).game;assert.equal(preview.voting.submittedCount,2);assert.equal(preview.voting.ownBallot.targetId,m.a.profile.id);
  const closed=await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.a.token);assert.equal(closed.http,200);assert.equal(closed.voting.status,'RULE_UNRESOLVED');
  const result=(await get(c,m,m.a)).game;assert.equal(result.phase,'DAY_RESOLVE');assert.equal(result.completed,false);assert.ok(result.players.every(p=>!p.publicReportedDead));
  const next=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.a.token);assert.equal(next.http,409);assert.equal(next.error.code,'RULE_UNRESOLVED');
  assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.a.token)).replay.verified,true);
 }finally{await c.app.close();}
});
test('S06-02 authorized audience sees own ballot only, outsider denied, no server seed', {timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);await day(c,m);await open(c,m);
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.b.token)).http,403);
  assert.equal((await c.request('POST',`/api/games/${m.id}/votes`,{targetId:m.a.profile.id,ballotId:'outside-vote-01',idempotencyKey:'outside-key-01'},m.outside.token)).http,403);
  const cmd={ballotId:'private-ballot-012',idempotencyKey:'private-key-012'};
  assert.equal((await vote(c,m,m.a,m.b,cmd)).http,200);
  const av=(await get(c,m,m.a)).game,bv=(await get(c,m,m.b)).game;
  assert.equal(av.voting.ownBallot.targetId,m.b.profile.id);assert.equal(bv.voting.ownBallot,undefined);
  assert.ok(!JSON.stringify(bv).includes('private-ballot-012'));
  assert.ok(!JSON.stringify(bv).includes('seed'));
  const events=(await c.request('GET',`/api/games/${m.id}/events`,undefined,m.b.token)).events;
  assert.ok(!events.some(e=>e.eventType==='VOTE_INTENT_RECORDED'));
  const own=(await c.request('GET',`/api/games/${m.id}/events`,undefined,m.a.token)).events;
  assert.ok(own.some(e=>e.eventType==='VOTE_INTENT_RECORDED'));
 }finally{await c.app.close();}
});
test('S06-03 duplicate vote exactly once, changes fail closed, stale revision not accepted',{timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);await day(c,m);await open(c,m);
  const common={ballotId:'repeat-ballot-01',idempotencyKey:'repeat-key-001'};
  const first=await vote(c,m,m.a,m.b,common);assert.equal(first.http,200);assert.equal(first.vote.duplicate,false);
  const repeat=await vote(c,m,m.a,m.b,{...common,expectedRevision:0});assert.equal(repeat.http,200);assert.equal(repeat.vote.duplicate,true);
  const changed=await vote(c,m,m.a,m.a,common);assert.equal(changed.http,409);assert.equal(changed.error.code,'RULE_UNRESOLVED');
  const other=await vote(c,m,m.b,m.a,{expectedRevision:1});assert.equal(other.http,409);assert.equal(other.error.code,'REVISION_CONFLICT');
  const state=(await get(c,m,m.a)).game;assert.equal(state.voting.submittedCount,1);
 }finally{await c.app.close();}
});
test('S06-04 vote intake denies phase errors, self-forged actor ignored, voting closes once',{timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);
  assert.equal((await vote(c,m,m.a,m.b)).http,409);
  assert.equal((await open(c,m)).http,409);
  await day(c,m);await open(c,m);
  const forged={playerId:m.a.profile.id,actorId:m.a.profile.id,ballotId:'forged-ballot-02',idempotencyKey:'forged-key-02'};
  assert.equal((await vote(c,m,m.b,m.a,forged)).http,200);
  const av=(await get(c,m,m.a)).game,bv=(await get(c,m,m.b)).game;
  assert.equal(av.voting.ownBallot,undefined);assert.equal(bv.voting.ownBallot.targetId,m.a.profile.id);
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.b.token)).http,403);
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.a.token)).http,200);
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.a.token)).http,409);
 }finally{await c.app.close();}
});
test('S06-05 vote state survives SQLite restart, event chain and ACL remain intact',{timeout:40000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s06-vote-')),path=join(dir,'db.sqlite');let c,d;
 try{c=await setup(path);const m=await match(c);await day(c,m);await open(c,m);await vote(c,m,m.a,m.b,{ballotId:'restart-ballot-2',idempotencyKey:'restart-key-02'});
  const before=(await get(c,m,m.a)).game;await c.app.close();c=null;
  d=await setup(path);const after=(await get(d,m,m.a)).game;assert.deepEqual(after,before);
  const b=(await get(d,m,m.b)).game;assert.equal(b.voting.ownBallot,undefined);
  assert.equal((await d.request('GET',`/api/games/${m.id}/replay`,undefined,m.a.token)).replay.verified,true);
  const game=await d.store.gameById(m.id);const internal=withKernel(game.archive,false,engine=>engine.getInternalState(m.id),true).value;
  assert.equal(internal.voting.intents.length,1);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S06-06 #8 sole survivor fact is partial; #8 hanging immunity while wolves counted alive',{timeout:5000},()=>{
 const p=(id,role,faction,life='ALIVE')=>({playerId:id,currentCharacterId:role,currentFaction:faction,life});
 const state={completed:false,participants:[p('headless',8,'phe3'),p('wolf',34,'soi'),p('seed',97,'dan','HIBERNATING')]};
 assert.equal(canHangHeadlessKnight(state,'headless'),false);
 assert.deepEqual(evaluateVerifiedSoleSurvivorFacts(state),[]);
 const deadWolf={...state,participants:[p('headless',8,'phe3'),p('wolf',34,'soi','DEAD_FINAL'),p('seed',97,'dan','DEAD_FINAL')]};
 assert.equal(canHangHeadlessKnight(deadWolf,'headless'),true);
 const facts=evaluateVerifiedSoleSurvivorFacts(deadWolf);assert.equal(facts.length,1);assert.equal(facts[0].predicateId,'WV_CHAR_8_SOLE_SURVIVOR');
 assert.equal(facts[0].conclusion,'CONDITION_MET_PENDING_END_OF_CHAIN');
 assert.deepEqual(evaluateVerifiedSoleSurvivorFacts({...deadWolf,completed:true}),[]);
 assert.deepEqual(evaluateVerifiedSoleSurvivorFacts({...deadWolf,participants:[p('headless',8,'phe3'),p('seed',97,'dan','PENDING_REVIVAL')]}),[]);
});

async function peaceMatch(c){
 const users=await Promise.all([c.user(),c.user(),c.user()]);const host=users[0];
 const room=(await c.request('POST','/api/rooms',{name:'S06 peace wolf PH-02',capacity:3},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.request('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 await c.request('POST',`/api/rooms/${room.id}/lock`,{},host.token);
 const started=await c.request('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,74,79],idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(started.http,201,JSON.stringify(started));const id=started.game.gameId,byRole={};
 for(const u of users){const snap=(await c.request('GET',`/api/games/${id}`,undefined,u.token)).game;
  const own=snap.players.find(p=>p.playerId===u.profile.id).self;
  byRole[own.currentCharacterId]=u;
 }
 return {id,room,users,byRole,host};
}
test('S06-07 #79 cancels ongoing day vote, reveals target only to wolf, phase returns to next night (PH-02)',{timeout:45000},async()=>{
 const c=await setup();try{const m=await peaceMatch(c),id=m.id;
  const night=await c.request('POST',`/api/games/${id}/resolve`,{},m.host.token);assert.equal(night.http,200);
  assert.equal((await c.request('POST',`/api/games/${id}/voting-open`,{},m.host.token)).http,200);
  assert.equal((await c.request('POST',`/api/games/${id}/votes`,{targetId:m.byRole[25].profile.id,ballotId:'wolvesville-vote-79',idempotencyKey:'wolvesville-idem-79'},m.byRole[74].token)).http,200);
  const skill='official.79.cancel-vote-reveal';const action={actionId:'peacewolf-action-01',idempotencyKey:'peacewolf-idem-01',skillId:skill,targetIds:[m.byRole[25].profile.id]};
  const received=await c.request('POST',`/api/games/${id}/actions`,action,m.byRole[79].token);assert.equal(received.http,200,JSON.stringify(received));
  assert.equal(received.action.status,'ACCEPTED');
  for(const u of m.users){const feed=(await c.request('GET',`/api/games/${id}/feedback`,undefined,u.token)).feedback;
   assert.equal(JSON.stringify(feed).includes('characterId'),false);}
  const r=await c.request('POST',`/api/games/${id}/resolve`,{},m.host.token);assert.equal(r.http,200,JSON.stringify(r));
  assert.equal(r.resolution.phase,'NIGHT_COLLECT');assert.equal(r.resolution.resolved,1);
  const v=(await c.request('GET',`/api/games/${id}/voting`,undefined,m.byRole[25].token)).voting;
  assert.equal(v.status,'CANCELLED');assert.equal(v.submittedCount,1);
  const wolfEvents=(await c.request('GET',`/api/games/${id}/events`,undefined,m.byRole[79].token)).events;
  const villagers=(await c.request('GET',`/api/games/${id}/events`,undefined,m.byRole[25].token)).events;
  assert.equal(wolfEvents.filter(e=>e.eventType==='ROLE_OBSERVED').length,1);
  assert(!villagers.some(e=>e.eventType==='ROLE_OBSERVED'));
  assert(wolfEvents.some(e=>e.eventType==='VOTING_CANCELLED'));
  assert(villagers.some(e=>e.eventType==='VOTING_CANCELLED'));
  assert.equal((await c.request('GET',`/api/games/${id}/replay`,undefined,m.byRole[25].token)).replay.verified,true);
  assert.equal((await c.request('POST',`/api/games/${id}/resolve`,{},m.host.token)).http,200); // next dawn
  assert.equal((await c.request('POST',`/api/games/${id}/voting-open`,{},m.host.token)).http,200);
  const capability=(await c.request('GET',`/api/games/${id}`,undefined,m.byRole[79].token)).game.capabilities;
  assert.equal(capability[0].available,false); // once per game
  const again=await c.request('POST',`/api/games/${id}/actions`,{...action,actionId:'peacewolf-action-02',idempotencyKey:'peacewolf-idem-02'},m.byRole[79].token);
  assert.equal(again.http,409);assert.equal(again.error.code,'RESOURCE_INSUFFICIENT');
 }finally{await c.app.close();}
});
test('S06-08 no PH-02 skill: attempting generic vote resolution rolls back phase and event ledger',{timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);await day(c,m);await open(c,m);
  const before=(await get(c,m,m.a)).game;const replayBefore=(await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.a.token)).replay;
  const unresolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.a.token);
  assert.equal(unresolved.http,409);assert.equal(unresolved.error.code,'RULE_UNRESOLVED');
  assert.deepEqual((await get(c,m,m.a)).game,before);
  const replayAfter=(await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.a.token)).replay;
  assert.equal(replayAfter.verified,true);assert.equal(replayBefore.events,replayAfter.events);
 }finally{await c.app.close();}
});
test('S06-09 vote submissions from two independent authenticated clients are serialized without dropping a ballot',{timeout:40000},async()=>{
 const c=await setup();try{const m=await match(c);await day(c,m);await open(c,m);
  const reqs=await Promise.all([vote(c,m,m.a,m.b),vote(c,m,m.b,m.a)]);
  assert(reqs.every(r=>r.http===200),JSON.stringify(reqs));
  const status=(await get(c,m,m.a)).game.voting;
  assert.equal(status.submittedCount,2);
  assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.b.token)).replay.verified,true);
 }finally{await c.app.close();}
});
