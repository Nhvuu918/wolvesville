/** Real authoritative HTTP + server assignment + SQLite archive tests.
 * Only #5 Cân Phán Quyết is implemented, not #5 Công Lý Tuyệt Đối.
 * QA-only day advancement between nights is NOT an official vote outcome.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {JUDGMENT_SKILL,JUDGMENT_USED} from '../dist/backend/src/official/judgment-rules.js';
import {SOI_GAI_DOC_INJURY} from '../dist/backend/src/official/reactive-rules.js';

async function setup(file=':memory:'){
 const store=new SqliteMultiplayerStore(file),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 const call=async(method,path,body,token)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};};
 const user=async()=>{const username=`s10${randomUUID().replaceAll('-','').slice(0,16)}`;
  assert.equal((await call('POST','/api/auth/register',{username,password:'S10SecurePassword2026!'})).http,201);
  const u=await call('POST','/api/auth/login',{username,password:'S10SecurePassword2026!'});assert.equal(u.http,200);return u;};
 return {store,app,call,user};
}
async function match(c,roles){
 const users=await Promise.all(roles.map(()=>c.user())),host=users[0];
 const room=(await c.call('POST','/api/rooms',{name:'S10 source-backed judgment',capacity:roles.length},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const started=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(started.http,201,JSON.stringify(started));const gameId=started.game.gameId,byRole={};
 for(const u of users){const v=await c.call('GET',`/api/games/${gameId}`,undefined,u.token);
  assert.equal(v.http,200);assert.equal(v.game.players.filter(p=>p.self).length,1);
  const role=v.game.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;}
 return {gameId,host,users,byRole};
}
const view=(c,m,u)=>c.call('GET',`/api/games/${m.gameId}`,undefined,u.token);
const endNight=(c,m)=>c.call('POST',`/api/games/${m.gameId}/resolve`,{},m.host.token);
async function advanceToNextNight(c,m){const r=await endNight(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'NIGHT_COLLECT');}
async function action(c,m,role,targetRole,skill=JUDGMENT_SKILL){return c.call('POST',`/api/games/${m.gameId}/actions`,{
 skillId:skill,targetIds:[m.byRole[targetRole].profile.id],actionId:`s10-a-${randomUUID()}`,idempotencyKey:`s10-k-${randomUUID()}`},m.byRole[role].token);}
async function internal(c,m){const game=await c.store.gameById(m.gameId);return withKernel(game.archive,false,(e,repo)=>({state:e.getInternalState(m.gameId),events:repo.events(m.gameId)}),true).value;}

test('S10-01 #5 source VH84 returns private unmodified verdict; #20 injures investigator in following night',{timeout:60000},async()=>{
 const c=await setup();try{const m=await match(c,[5,20,25]);
  assert.equal((await action(c,m,5,20)).http,200);
  assert.equal((await action(c,m,25,20,'official.25.inspect-role')).http,200);
  const resolved=await endNight(c,m);assert.equal(resolved.http,200,JSON.stringify(resolved));assert.equal(resolved.resolution.phase,'DAY_DISCUSS');
  const actor=m.byRole[5],other=m.byRole[25],wolf=m.byRole[20];
  const fb=(await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,actor.token)).feedback.items;
  assert.equal(fb.length,1);assert.equal(fb[0].resultType,'AURA_INFORMATION');assert.deepEqual(fb[0].resultPayload,{verdict:'Ác',targetId:wolf.profile.id});
  const secret=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,wolf.token)).events;
  assert.equal(JSON.stringify(secret).includes('SOUL_JUDGMENT_OBSERVED'),false);
  assert.equal(JSON.stringify(secret).includes('Ác'),false);
  const otherFB=(await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,other.token)).feedback;
  assert.equal(otherFB.items.length,1);assert.equal(otherFB.items[0].resultType,'AURA_INFORMATION');assert.deepEqual(otherFB.items[0].resultPayload,{verdict:'Ác',targetId:wolf.profile.id,context:'SEER_AURA'});
  assert.equal(otherFB.items.some(f=>f.skillId===JUDGMENT_SKILL),false);
  const otherEvents=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,other.token)).events;assert.equal(otherEvents.some(e=>e.eventType==='SOUL_JUDGMENT_OBSERVED'),false);
  const state=(await internal(c,m)).state;
  assert.equal(state.participants.find(p=>p.playerId===actor.profile.id).effects.filter(e=>e.kind===JUDGMENT_USED).length,1);
  assert.equal(state.participants.find(p=>p.playerId===actor.profile.id).effects.filter(e=>e.kind===SOI_GAI_DOC_INJURY&&e.expiresAtRound===2).length,1);
  assert.equal((await c.call('GET',`/api/games/${m.gameId}/replay`,undefined,actor.token)).replay.verified,true);
  await advanceToNextNight(c,m); // inherited QA day skip; not a vote/hanging acceptance
  const denied=await action(c,m,5,25);assert.equal(denied.http,409);assert.equal(denied.error.code,'SKILL_LOCKED');
  const post=(await internal(c,m)).state;assert.equal(post.round,2);
  assert.equal(post.participants.filter(p=>p.life==='DEAD_FINAL').length,0);
 }finally{await c.app.close();}
});

test('S10-02 #5 two match-wide uses, deterministic replay and SQLite restart; cannot infer hanging',{timeout:65000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s10-judgment-')),file=join(dir,'s10.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[5,25,74]);
  const j=m.byRole[5];assert((await view(c,m,j)).game.capabilities.some(x=>x.skillId===JUDGMENT_SKILL&&x.available));
  assert.equal((await action(c,m,5,25)).http,200);
  // Same-night concurrent attempt must be rejected by the stored skill usage ledger.
  const conflict=await action(c,m,5,74);assert.equal(conflict.http,409);assert.equal(conflict.error.code,'RESOURCE_INSUFFICIENT');
  assert.equal((await endNight(c,m)).resolution.phase,'DAY_DISCUSS');await advanceToNextNight(c,m);
  assert.equal((await action(c,m,5,74)).http,200);
  assert.equal((await endNight(c,m)).resolution.phase,'DAY_DISCUSS');await advanceToNextNight(c,m);
  const before=await internal(c,m);assert.equal(before.state.round,3);
  assert.equal(before.state.participants.find(p=>p.playerId===j.profile.id).effects.filter(e=>e.kind===JUDGMENT_USED).length,2);
  assert.equal((await view(c,m,j)).game.capabilities.find(x=>x.skillId===JUDGMENT_SKILL).available,false);
  const denied=await action(c,m,5,25);assert.equal(denied.http,409);assert.equal(denied.error.code,'RESOURCE_INSUFFICIENT');
  await c.app.close();c=null;d=await setup(file);
  const after=await internal(d,m);assert.deepEqual(after.state,before.state);
  assert.equal((await d.call('GET',`/api/games/${m.gameId}/replay`,undefined,j.token)).replay.verified,true);
  const restored=(await d.call('GET',`/api/games/${m.gameId}/feedback`,undefined,j.token)).feedback.items;
  assert.equal(restored.length,2);assert(restored.every(x=>x.resultType==='AURA_INFORMATION'&&x.resultPayload.verdict==='Thiện'));
  for(const u of m.users.filter(x=>x!==j)){
   const r=await d.call('GET',`/api/games/${m.gameId}`,undefined,u.token);
   assert(!JSON.stringify(r.game).includes('JUDGMENT_USED'));assert.equal(r.game.completed,false);
  }
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S10-03 #76 current-night nightmare cancels queued skills, privately informs victim, consumes only two match uses',{timeout:60000},async()=>{
 const c=await setup();try{const m=await match(c,[5,25,76]);
  const seer=m.byRole[25],judge=m.byRole[5],wolf=m.byRole[76];
  assert.equal((await action(c,m,25,76,'official.25.inspect-role')).http,200);
  assert.equal((await action(c,m,5,76)).http,200);
  assert.equal((await action(c,m,76,25,'official.76.nightmare')).http,200);
  const result=await endNight(c,m);assert.equal(result.http,200,JSON.stringify(result));
  assert.equal(result.resolution.cancelled,1);assert.equal(result.resolution.resolved,2);
  const eventsSeer=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,seer.token)).events;
  assert.equal(eventsSeer.some(e=>e.eventType==='SKILL_LOCK_NOTICE'&&e.payload.message.includes('không thể')),true);
  assert.equal(JSON.stringify(eventsSeer).includes('OFFICIAL_NIGHTMARE_APPLIED'),false);
  assert.equal(eventsSeer.some(e=>e.eventType==='SKILL_LOCK_NOTICE'&&e.actorId),false,'must not expose wolf source');
  assert.equal((await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,seer.token)).feedback.items[0].resolutionStatus,'CANCELLED');
  assert.equal((await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,judge.token)).feedback.items[0].resultPayload.verdict,'Ác');
  assert.equal((await c.call('GET',`/api/games/${m.gameId}/events`,undefined,judge.token)).events.some(e=>e.eventType==='SKILL_LOCK_NOTICE'),false);
  await advanceToNextNight(c,m); // inherited QA shell, no official hanging
  assert.equal((await action(c,m,5,25)).http,200);
  assert.equal((await action(c,m,76,5,'official.76.nightmare')).http,200);
  const second=await endNight(c,m);assert.equal(second.resolution.cancelled,1);
  await advanceToNextNight(c,m);
  assert.equal((await view(c,m,wolf)).game.capabilities.find(x=>x.skillId==='official.76.nightmare').available,false);
  const third=await action(c,m,76,25,'official.76.nightmare');assert.equal(third.http,409);
  assert.equal(third.error.code,'RESOURCE_INSUFFICIENT');
  const s=await internal(c,m);assert.equal(s.state.round,3);
  assert.equal(s.state.participants.find(x=>x.playerId===judge.profile.id).effects.filter(e=>e.kind===JUDGMENT_USED).length,1,
    'cancelled #5 skill must not consume second usage');
  assert.equal((await c.call('GET',`/api/games/${m.gameId}/replay`,undefined,wolf.token)).replay.verified,true);
  assert.equal(s.state.completed,false);
 }finally{await c.app.close();}
});
