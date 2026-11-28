/** Full HTTP -> GameCoordinator -> Kernel -> persisted SQLite archive -> replay.
 * Tests have no pre-filled resolved effects and do not bypass the Engine. */
import test from 'node:test';
delete process.env.WV_ARCHIVED_RULE_REGRESSION;
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {hasClosedDeathLedger} from '../dist/backend/src/official/stable-death-proof.js';
import {resolveHangingVictory} from '../dist/backend/src/official/victory-resolver.js';
import {S13_SKILLS,S13_STATUS} from '../dist/backend/src/official/s13-mechanics.js';

async function setup(path=':memory:'){
 const store=new SqliteMultiplayerStore(path),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 const call=async(method,url,body,token)=>{const resp=await fetch(base+url,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:resp.status,...await resp.json()};};
 const user=async()=>{const name=`s13${randomUUID().replaceAll('-','').slice(0,16)}`;
  assert.equal((await call('POST','/api/auth/register',{username:name,password:'S13Strong2026Pass!'})).http,201);
  const u=await call('POST','/api/auth/login',{username:name,password:'S13Strong2026Pass!'});assert.equal(u.http,200);return u;};
 return {store,app,call,user,base};
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

import {countsTowardFaction} from '../dist/backend/src/official/victory-predicates.js';
const SHOOT='official.23.shoot',FIRE='official.36.fireball',KILL='official.8.night-kill',SHIELD='official.36.shield';
const deck=[8,23,25,36];
const ok=x=>{assert.equal(x.http,200,JSON.stringify(x));return x;};
async function day(c,m){
 const path=`/api/games/${m.gameId}`;
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));
 const v=await c.call('GET',path,undefined,m.byRole[23].token);
 if(v.game.players.find(p=>p.self).publicReportedDead){
  assert.equal(v.game.voting.canVote,false);
  assert.notEqual((await c.call('POST',path+'/votes',{targetId:m.byRole[8].profile.id,ballotId:randomUUID(),idempotencyKey:randomUUID()},m.byRole[23].token)).http,200);
 }
 ok(await c.call('POST',path+'/voting-close',{},m.host.token));
}
test('S17 #23 live session: private revival, two bullets, protection, vote ban, retry, restart, replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-soul-')),file=join(dir,'run.sqlite');let c;
 try{
 c=await setup(file);const m=await match(c,deck),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`,get=async x=>ok(await c.call('GET',path,undefined,m.byRole[x].token)).game;
 assert.notEqual((await action(c,m,23,8,SHOOT)).http,200);
 ok(await action(c,m,36,23,FIRE));ok(await resolve(c,m));
 let s=await state(c,m),p=s.state.participants.find(x=>x.playerId===id(23));
 assert.equal(p.life,'PENDING_REVIVAL');assert(countsTowardFaction(s.state,id(23)));assert(!s.state.completed);
 assert.equal(p.resources.soulBullets,undefined);assert((await get(8)).players.find(x=>x.playerId===id(23)).publicReportedDead);
 await c.app.close();c=await setup(file);await day(c,m);
 s=await state(c,m);p=s.state.participants.find(x=>x.playerId===id(23));assert.equal(s.state.round,2);assert.equal(p.life,'ALIVE');assert.equal(p.resources.soulBullets,2);assert(p.publicReportedDead);
 for(const x of [8,25,36]){
  const view=await get(x);assert.deepEqual(view.players.find(y=>y.playerId===id(23)),{playerId:id(23),publicReportedDead:true});
  const events=ok(await c.call('GET',path+'/events',undefined,m.byRole[x].token)).events;
  assert(!events.some(e=>e.eventType==='SOUL_SECRET_REVIVED'));assert(events.every((e,i)=>e.seq===i+1));
 }
 assert((await get(23)).capabilities.find(x=>x.skillId===SHOOT).available);
 const cmd={skillId:SHOOT,targetIds:[id(8)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await action(c,m,36,8,SHIELD));
 ok(await c.call('POST',path+'/actions',cmd,m.byRole[23].token));
 assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[23].token)).action.duplicate);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));
 s=await state(c,m);assert.equal(s.state.participants.find(x=>x.playerId===id(23)).resources.soulBullets,1);assert.equal(s.state.participants.find(x=>x.playerId===id(8)).life,'ALIVE');
 await day(c,m);ok(await action(c,m,23,8,SHOOT));assert.notEqual((await action(c,m,23,8,SHOOT)).http,200);ok(await resolve(c,m));
 s=await state(c,m);assert.equal(s.state.participants.find(x=>x.playerId===id(23)).resources.soulBullets,0);assert(s.state.completed);assert.deepEqual(new Set(s.state.winnerIds),new Set([id(23),id(25),id(36)]));assert.equal(s.events.filter(e=>e.eventType==='SOUL_SECRET_REVIVED').length,1);
 assert.equal(s.events.filter(e=>e.eventType==='RESOURCE_CHARGED'&&e.payload.name==='soulBullets').length,2);
 assert.notEqual((await action(c,m,23,8,SHOOT)).http,200);
 await checkReplay(c,m);await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,s.state);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S17 LIFE-01: two accepted night attacks finalize pending soul without duplicate public death',async()=>{
 const c=await setup();try{
 const m=await match(c,deck),id=x=>m.byRole[x].profile.id;
 ok(await action(c,m,36,23,FIRE));ok(await action(c,m,8,23,KILL));ok(await resolve(c,m));
 let s=await state(c,m),p=s.state.participants.find(x=>x.playerId===id(23));
 assert.equal(p.life,'DEAD_FINAL');assert(!countsTowardFaction(s.state,id(23)));assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(23)).length,1);assert.equal(s.events.filter(e=>e.eventType==='SOUL_FINAL_DEATH_CLOSED'&&e.payload.victimId===id(23)).length,1);
 await day(c,m);s=await state(c,m);assert.equal(s.state.participants.find(x=>x.playerId===id(23)).life,'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='SOUL_SECRET_REVIVED').length,0);await checkReplay(c,m);
 }finally{await c.app.close();}
});
test('S17 VH82: village victory while soul waits, no extra night or ammunition',async()=>{
 const c=await setup();try{
 const m=await match(c,deck),id=x=>m.byRole[x].profile.id;
 ok(await action(c,m,36,8,FIRE));ok(await action(c,m,8,23,KILL));ok(await resolve(c,m));
 const s=await state(c,m),p=s.state.participants.find(x=>x.playerId===id(23));assert.equal(p.life,'PENDING_REVIVAL');assert(countsTowardFaction(s.state,id(23)));assert(s.state.completed);assert(s.state.winnerIds.includes(id(23)));assert.equal(s.state.round,1);assert.equal(p.resources.soulBullets,undefined);await checkReplay(c,m);
 }finally{await c.app.close();}
});

test('S18 LIFE-01: fresh blind knight attempt after secret revival, then identical dead-seat retry without duplicate death',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-soul-second-')),file=join(dir,'run.sqlite');let c;
 try{
  c=await setup(file);const m=await match(c,deck),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
  const view=async role=>ok(await c.call('GET',path,undefined,m.byRole[role].token)).game;
  ok(await action(c,m,36,23,FIRE));ok(await action(c,m,8,25,KILL));ok(await resolve(c,m));await day(c,m);
  const before=await view(8),cap=before.capabilities.find(x=>x.skillId===KILL);
  assert.equal(cap.targetPolicy.aliveOnly,false);assert.deepEqual(new Set(cap.eligibleTargetIds),new Set([id(23),id(25),id(36)]));
  assert.deepEqual(before.players.find(p=>p.playerId===id(23)),{playerId:id(23),publicReportedDead:true});
  assert.deepEqual(before.players.find(p=>p.playerId===id(25)),{playerId:id(25),publicReportedDead:true});
  const outside=await c.call('POST',path+'/actions',{skillId:KILL,targetIds:[randomUUID()],actionId:randomUUID(),idempotencyKey:randomUUID()},m.byRole[8].token);assert.notEqual(outside.http,200);
  const cmd={skillId:KILL,targetIds:[id(23)],actionId:randomUUID(),idempotencyKey:randomUUID()};
  const receipt=ok(await c.call('POST',path+'/actions',cmd,m.byRole[8].token)).action;assert.equal(receipt.status,'ACCEPTED');
  assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[8].token)).action.duplicate);
  await c.app.close();c=await setup(file);ok(await resolve(c,m));
  let s=await state(c,m);assert.equal(s.state.participants.find(p=>p.playerId===id(23)).life,'DEAD_FINAL');assert(!countsTowardFaction(s.state,id(23)));assert(!s.state.completed);
  assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(23)).length,1);assert.equal(s.events.filter(e=>e.eventType==='SOUL_FINAL_DEATH_CLOSED'&&e.payload.victimId===id(23)).length,1);
  const events=ok(await c.call('GET',path+'/events',undefined,m.byRole[8].token)).events;assert(!events.some(e=>e.eventType.includes('SOUL_')));
  await day(c,m);
  const r=ok(await action(c,m,8,25,KILL)).action;assert.equal(r.status,receipt.status);ok(await resolve(c,m));
  s=await state(c,m);assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(25)).length,1);assert(!s.state.completed);await checkReplay(c,m);
  await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,s.state);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});

// Source-backed shield (JSON #23, VH13) followed by first death through
// V03 hanging. No extension of blind finite-cost targeting or wrong-faction shots.
test('S19 #23: own shield blocks mage fire, first hanging revives privately, knight second death',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-soul-hanging-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,deck),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 ok(await action(c,m,23,23,'official.23.shield'));ok(await action(c,m,36,23,FIRE));ok(await resolve(c,m));
 let s=await state(c,m);assert.equal(s.state.participants.find(p=>p.playerId===id(23)).life,'ALIVE');assert(!s.events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(23)));
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));for(const role of [8,25,36])ok(await c.call('POST',path+'/votes',{targetId:id(23),ballotId:randomUUID(),idempotencyKey:randomUUID()},m.byRole[role].token));ok(await c.call('POST',path+'/voting-close',{},m.host.token));
 s=await state(c,m);const soul=s.state.participants.find(p=>p.playerId===id(23));assert.equal(soul.life,'ALIVE');assert(soul.publicReportedDead);assert.equal(soul.resources.soulBullets,2);assert.equal(s.state.round,2);assert(!s.state.completed);
 const others=await c.call('GET',path+'/events',undefined,m.byRole[8].token);assert(!others.events.some(e=>e.eventType==='SOUL_SECRET_REVIVED'));assert.equal(others.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(23)).length,1);
 await c.app.close();c=await setup(file);ok(await action(c,m,8,23,KILL));ok(await resolve(c,m));s=await state(c,m);assert.equal(s.state.participants.find(p=>p.playerId===id(23)).life,'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='SOUL_FINAL_DEATH_CLOSED'&&e.payload.victimId===id(23)).length,1);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
