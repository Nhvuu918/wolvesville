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


const post=(c,m,path,body={},u=m.host)=>c.request('POST',`/api/games/${m.id}/${path}`,body,u.token);
const vote=(targetId,revision)=>({targetId,ballotId:`b-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`,expectedRevision:revision});
async function open(c,m){assert.equal((await post(c,m,'resolve')).resolution.phase,'DAY_DISCUSS');assert.equal((await post(c,m,'voting-open')).http,200);}
test('S11 real multiplayer: zero, tie, blank, changed ballot, retry, hanging, co-winners, restart and replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s11-')),db=join(dir,'run.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,[8,28]);const k=m.byRole[8],j=m.byRole[28];
 await open(c,m);assert.equal((await post(c,m,'voting-close')).voting.status,'RESOLVED');
 let v=(await view(c,m,k)).game;assert.equal(v.round,2);assert.equal(v.voting.outcome,'NO_HANGING_ZERO');
 await open(c,m);assert.equal((await post(c,m,'votes',vote(j.profile.id),k)).http,200);assert.equal((await post(c,m,'votes',vote(k.profile.id),j)).http,200);
 assert.equal((await post(c,m,'voting-close')).http,200);v=(await view(c,m,k)).game;assert.equal(v.round,3);assert.equal(v.voting.outcome,'NO_HANGING_TIE');
 await open(c,m);v=(await view(c,m,k)).game;const old=vote('',v.revision);assert.equal((await post(c,m,'votes',old,k)).http,200);
 assert.equal((await post(c,m,'votes',vote(j.profile.id,v.revision),k)).http,409);
 v=(await view(c,m,k)).game;const latest=vote(j.profile.id,v.revision);assert.equal((await post(c,m,'votes',latest,k)).http,200);assert.equal((await post(c,m,'votes',old,k)).http,200);
 assert.equal((await post(c,m,'votes',vote(''),j)).http,200);
 assert.equal((await view(c,m,k)).game.voting.ownBallot.targetId,j.profile.id);
 assert.equal((await post(c,m,'voting-close')).voting.status,'RESOLVED');
 for(const u of m.users){const g=(await view(c,m,u)).game;assert.equal(g.completed,true);assert.deepEqual(new Set(g.winnerIds),new Set([k.profile.id,j.profile.id]));assert.equal(g.players.find(p=>p.playerId===j.profile.id).publicReportedDead,true);const es=(await events(c,m,u)).events;assert.equal(es.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);assert.equal(es.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);assert.equal(es.some(e=>e.eventType==='HANGING_AUTHORIZED'||e.eventType==='VICTORY_EVALUATED'),false);assert.equal((await replay(c,m,u)).replay.verified,true);}
 assert.equal((await post(c,m,'votes',vote(k.profile.id),k)).http,409);assert.equal((await post(c,m,'voting-close')).http,409);
 const saved=(await view(c,m,k)).game;await c.app.close();c=null;d=await setup(db);assert.deepEqual((await view(d,m,k)).game,saved);assert.equal((await replay(d,m,j)).replay.verified,true);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S11 second certified configuration: real seer skill, concurrent vote revision, hanging and knight victory',async()=>{
 const c=await setup();try{const m=await match(c,[8,25]),k=m.byRole[8],s=m.byRole[25];
 assert.equal((await post(c,m,'actions',{skillId:'official.25.inspect-role',targetIds:[k.profile.id],actionId:`a-${randomUUID()}`,idempotencyKey:`i-${randomUUID()}`},s)).http,200);
 await open(c,m);let v=(await view(c,m,k)).game;
 const results=await Promise.all([post(c,m,'votes',vote(s.profile.id,v.revision),k),post(c,m,'votes',vote(k.profile.id,v.revision),s)]);
 assert.deepEqual(results.map(x=>x.http).sort(),[200,409]);
 v=(await view(c,m,s)).game;if(v.voting.ownBallot)assert.equal((await post(c,m,'votes',vote('',v.revision),s)).http,200);
 v=(await view(c,m,k)).game;if(!v.voting.ownBallot)assert.equal((await post(c,m,'votes',vote(s.profile.id,v.revision),k)).http,200);
 assert.equal((await post(c,m,'voting-close')).http,200);
 for(const u of m.users){const g=(await view(c,m,u)).game;assert.equal(g.completed,true);assert.deepEqual(g.winnerIds,[k.profile.id]);assert.equal((await replay(c,m,u)).replay.verified,true);assert.equal(JSON.stringify(g).includes('officialAudit'),false);}
 const internal=withKernel((await c.store.gameById(m.id)).archive,false,(e,r)=>({state:e.getInternalState(m.id),events:r.events(m.id)}),true).value;
 assert.equal(internal.state.voting.officialAudit.counts[0].targetId,s.profile.id);
 assert.equal(internal.events.filter(e=>e.eventType==='HANGING_AUTHORIZED').length,1);
 assert.equal(internal.events.filter(e=>e.eventType==='VICTORY_EVALUATED').length,1);
 }finally{await c.app.close();}
});

import {reviewOfficialBallots} from '../dist/backend/src/engine/vote-control-review.js';
import {adjudicateOfficialVote} from '../dist/backend/src/engine/vote-adjudicator.js';
const intent=(voterId,targetId)=>({voterId,targetId,ballotId:'b-'+voterId,idempotencyKey:'k-'+voterId});
test('S11 V02 terminal invalidation survives certified coercion; missing controller and overlapping controls fail closed',()=>{
 const v={round:1,status:'OPEN',intents:[intent('a','x'),intent('b','y'),intent('c','x')],invalidatedVoters:['b'],directives:[{voterId:'b',controllerId:'a',sourceActionId:'action',ruleId:'OFFICIAL_CHAR_33_VOTE_COERCION'}]};
 const audit=reviewOfficialBallots(v);assert.deepEqual(audit.counts,[{targetId:'x',count:2}]);assert.equal(audit.ballots.find(b=>b.voterId==='b').valid,false);assert.equal(audit.ballots.find(b=>b.voterId==='b').effectiveTargetId,'');
 assert.throws(()=>reviewOfficialBallots({...v,invalidatedVoters:['a']}),e=>e.code==='RULE_UNRESOLVED');
 assert.throws(()=>reviewOfficialBallots({...v,directives:[...v.directives,...v.directives]}),e=>e.code==='RULE_UNRESOLVED');
});
test('S11 muted voter eligibility and dead target fail-closed (pure policy unit, not gameplay proof)',()=>{
 const s={phase:'DAY_VOTE_COLLECT',round:1,votingPolicy:'S11_OFFICIAL_V1',participants:[{playerId:'a',life:'ALIVE',effects:[{kind:'MUTED'}]},{playerId:'b',life:'ALIVE'}],voting:{round:1,status:'OPEN',intents:[intent('a','b')]}};
 assert.equal(adjudicateOfficialVote(s).outcome.targetId,'b');s.participants[1].life='DEAD_FINAL';assert.throws(()=>adjudicateOfficialVote(s),e=>e.code==='RULE_UNRESOLVED');
});
