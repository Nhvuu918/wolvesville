/** Full HTTP -> GameCoordinator -> Kernel -> persisted SQLite archive -> replay.
 * Tests have no pre-filled resolved effects and do not bypass the Engine. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {S13_SKILLS,S13_STATUS} from '../dist/backend/src/official/s13-mechanics.js';

async function setup(path=':memory:'){
 const store=new SqliteMultiplayerStore(path),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 const call=async(method,url,body,token)=>{const resp=await fetch(base+url,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:resp.status,...await resp.json()};};
 const user=async()=>{const name=`s13${randomUUID().replaceAll('-','').slice(0,16)}`;
  assert.equal((await call('POST','/api/auth/register',{username:name,password:'S13Strong2026Pass!'})).http,201);
  const u=await call('POST','/api/auth/login',{username:name,password:'S13Strong2026Pass!'});assert.equal(u.http,200);return u;};
 return {store,app,call,user};
}
async function match(c,roles){
 const users=await Promise.all(roles.map(()=>c.user())),host=users[0];
 const room=(await c.call('POST','/api/rooms',{name:'S13 Official Character Tests',capacity:roles.length},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const r=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(r.http,201,JSON.stringify(r));
 const gameId=r.game.gameId,byRole={};
 for(const u of users){const v=await c.call('GET',`/api/games/${gameId}`,undefined,u.token);
  assert.equal(v.http,200);const role=v.game.players.find(x=>x.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;}
 return {gameId,host,users,byRole};
}
async function action(c,m,role,target,skill){
 return c.call('POST',`/api/games/${m.gameId}/actions`,{skillId:skill,targetIds:[m.byRole[target].profile.id],actionId:`act-${randomUUID()}`,idempotencyKey:`key-${randomUUID()}`},m.byRole[role].token);
}
async function resolve(c,m){return c.call('POST',`/api/games/${m.gameId}/resolve`,{},m.host.token);}
async function state(c,m){const game=await c.store.gameById(m.gameId);
 return withKernel(game.archive,false,(e,repo)=>({state:e.getInternalState(m.gameId),events:repo.events(m.gameId)}),true).value;
}
async function nextNight(c,m){const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'NIGHT_COLLECT');}
async function checkReplay(c,m){for(const u of m.users){const r=await c.call('GET',`/api/games/${m.gameId}/replay`,undefined,u.token);assert.equal(r.http,200);assert.equal(r.replay.verified,true);}}
const life=(s,m,id)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id).life;
function evidence(characterIds,source,skill){console.log('# S13_CHARACTER_EVIDENCE '+JSON.stringify({characterIds,source,skill,authoritative:true,replay:true}));}

test('S13-01 #11 maintenance protects #25 from #76 nightmare in a real game session',{timeout:65000},async()=>{
 const c=await setup();try{
  const m=await match(c,[11,25,76]);
  assert.equal((await action(c,m,25,76,'official.25.inspect-role')).http,200);
  assert.equal((await action(c,m,76,25,'official.76.nightmare')).http,200);
  assert.equal((await action(c,m,11,25,S13_SKILLS.maintenance)).http,200);
  const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.resolved,3);assert.equal(r.resolution.cancelled,0);
  const snapshot=await state(c,m);
  assert.equal(snapshot.events.filter(e=>e.eventType==='OFFICIAL_NIGHTMARE_RESISTED').length,1);
  assert.equal(snapshot.state.participants.find(p=>p.playerId===m.byRole[25].profile.id).effects.some(e=>e.kind===S13_STATUS.maintenance),true);
  const feedback=(await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,m.byRole[25].token)).feedback;
  assert.equal(feedback.items[0].resultType,'AURA_INFORMATION');assert.deepEqual(feedback.items[0].resultPayload,{verdict:'Ác',targetId:m.byRole[76].profile.id,context:'SEER_AURA'});
  const wrong=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,m.byRole[76].token)).events;
  assert.equal(wrong.some(e=>e.eventType==='OFFICIAL_NIGHTMARE_RESISTED'),false);
  await checkReplay(c,m);evidence([11],'character.json#11, VH08','maintenance-vs-nightmare');
 }finally{await c.app.close();}
});

test('S13-02 #16 antidote absorbs real #8 night attack; poison triggers next-night skill lock',{timeout:90000},async()=>{
 const c=await setup();try{
  let m=await match(c,[8,16,25]);
  assert.equal((await action(c,m,16,25,S13_SKILLS.antidote)).http,200);
  assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
  const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(life((await state(c,m)).state,m,25),'ALIVE');
  assert.equal((await state(c,m)).events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'),true);
  await checkReplay(c,m);
  // Second night, without a new antidote, damage is committed; victory remains unresolved.
  await nextNight(c,m);assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
  const r2=await resolve(c,m);assert.equal(r2.http,200,JSON.stringify(r2));
  const now=await state(c,m);assert.equal(life(now.state,m,25),'DEAD_FINAL');assert.equal(now.state.completed,false);
  assert.equal(now.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);
  evidence([16],'character.json#16','antidote');
  m=await match(c,[16,25,76]);
  assert.equal((await action(c,m,16,76,S13_SKILLS.poison)).http,200);
  assert.equal((await resolve(c,m)).http,200);
  assert.equal((await state(c,m)).state.participants.find(p=>p.playerId===m.byRole[76].profile.id).effects.some(e=>e.kind===S13_STATUS.poison),true);
  await nextNight(c,m);
  const denied=await action(c,m,76,25,'official.76.nightmare');assert.equal(denied.http,409,JSON.stringify(denied));assert.equal(denied.error.code,'SKILL_LOCKED');
  await checkReplay(c,m);evidence([16],'character.json#16','delayed-poison');
 }finally{await c.app.close();}
});

test('S13-03 #24 jail blocks inspection and absorbs a night attack; rule-private events',{timeout:70000},async()=>{
 const c=await setup();try{
  const m=await match(c,[8,24,25]);
  assert.equal((await action(c,m,25,8,'official.25.inspect-role')).http,200);
  assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
  assert.equal((await action(c,m,24,25,S13_SKILLS.jail)).http,200);
  const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.cancelled,1);
  assert.equal(life((await state(c,m)).state,m,25),'ALIVE');
  const victimFeedback=(await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,m.byRole[25].token)).feedback;
  assert.equal(victimFeedback.items[0].resolutionStatus,'CANCELLED');
  for(const u of m.users){const events=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;
   assert.equal(events.some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'),false);}
  await checkReplay(c,m);evidence([24],'character.json#24,VH79','jail-block-and-defense');
 }finally{await c.app.close();}
});

test('S13-04 #66 guard blocks lethal attack, persists and expires, uses 3 charges max',{timeout:70000},async()=>{
 const c=await setup();try{
  const m=await match(c,[8,25,66]);
  assert.equal((await action(c,m,66,25,S13_SKILLS.watch)).http,200);
  assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
  assert.equal((await resolve(c,m)).http,200);
  assert.equal(life((await state(c,m)).state,m,25),'ALIVE');
  await nextNight(c,m);assert.equal((await action(c,m,66,25,S13_SKILLS.watch)).http,200);
  assert.equal((await resolve(c,m)).http,200);
  await nextNight(c,m);assert.equal((await action(c,m,66,25,S13_SKILLS.watch)).http,200);
  assert.equal((await resolve(c,m)).http,200);
  await nextNight(c,m);const denied=await action(c,m,66,25,S13_SKILLS.watch);assert.equal(denied.http,409);assert.equal(denied.error.code,'RESOURCE_INSUFFICIENT');
  await checkReplay(c,m);evidence([66],'character.json#66,VH34','three-use-guard-attack-defense');
 }finally{await c.app.close();}
});

test('S13-05 #67 shield blocks real attack; exactly two shields per game',{timeout:70000},async()=>{
 const c=await setup();try{
  const m=await match(c,[8,25,67]);
  assert.equal((await action(c,m,67,25,S13_SKILLS.smith)).http,200);
  assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
  assert.equal((await resolve(c,m)).http,200);
  assert.equal(life((await state(c,m)).state,m,25),'ALIVE');
  await nextNight(c,m);assert.equal((await action(c,m,67,25,S13_SKILLS.smith)).http,200);
  assert.equal((await resolve(c,m)).http,200);
  await nextNight(c,m);const denied=await action(c,m,67,25,S13_SKILLS.smith);assert.equal(denied.http,409);assert.equal(denied.error.code,'RESOURCE_INSUFFICIENT');
  await checkReplay(c,m);evidence([67],'character.json#67,VH35,VH70','two-shield-defense');
 }finally{await c.app.close();}
});

test('S13-06 #59 day injury prevents next-night action and cannot silently kill on repeat',{timeout:70000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s13-stone-')),file=join(dir,'game.sqlite');let c,d;
 try{
  c=await setup(file);const m=await match(c,[25,59]);
  const r=await resolve(c,m);assert.equal(r.resolution.phase,'DAY_DISCUSS',JSON.stringify(r));
  assert.equal((await action(c,m,59,25,S13_SKILLS.stone)).http,200);
  assert.equal((await resolve(c,m)).resolution.phase,'NIGHT_COLLECT');
  assert.equal((await state(c,m)).state.round,2);
  const denied=await action(c,m,25,59,'official.25.inspect-role');assert.equal(denied.http,409,JSON.stringify(denied));assert.equal(denied.error.code,'SKILL_LOCKED');
  await checkReplay(c,m);
  const old=await state(c,m);await c.app.close();c=null;d=await setup(file);
  const after=await state(d,m);assert.deepEqual(after.state,old.state);
  await checkReplay(d,m);
  evidence([59],'character.json#59,VH31','day-injury-next-night-lock');
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});

test('S13-07 #17 public judgment reveals only the certified wolf and permanently disables the skill',{timeout:70000},async()=>{
 const c=await setup();try{
  const m=await match(c,[17,25,76]);
  assert.equal((await resolve(c,m)).resolution.phase,'DAY_DISCUSS');
  assert.equal((await action(c,m,17,76,S13_SKILLS.judgment)).http,200);
  const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'NIGHT_COLLECT');
  const s=await state(c,m);assert.equal(s.state.participants.find(p=>p.playerId===m.byRole[76].profile.id).skillLocks.includes('*'),true);
  const wolfAttempt=await action(c,m,76,25,'official.76.nightmare');assert.equal(wolfAttempt.http,409);assert.equal(wolfAttempt.error.code,'SKILL_LOCKED');
  for(const u of m.users){const events=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;
   const notice=events.find(e=>e.eventType==='S13_DAY_JUDGMENT_REVEALED');assert(notice);
   assert.equal(notice.payload.revealedRole,'Sói Ác Mộng');assert.equal(notice.payload.sourceRole,'Nữ Tu Huyết Thệ');
   assert.equal(JSON.stringify(events).includes('S13_17_JUDGMENT_USED'),false);
  }
  await checkReplay(c,m);evidence([17],'character.json#17,SYS-10,VH57','public-day-judgment-wolf-permanent-lock');
 }finally{await c.app.close();}
});
