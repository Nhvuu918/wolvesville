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
async function match(c,roles,qaProfile){
 const users=await Promise.all(roles.map(()=>c.user())),host=users[0];
 const room=(await c.call('POST','/api/rooms',{name:'S13 Official Character Tests',capacity:roles.length},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const r=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,...(qaProfile?{qaProfile}:{}),idempotencyKey:`start-${randomUUID()}`},host.token);
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

process.env.WV_OWNER_BB_LIVE_QA='1';
process.env.WV_OWNER_DC_QA='1';
const TRAP='official.10.trap',KILL='official.8.night-kill',REVIVE='official.26.revive',INSPECT='official.25.inspect-role',profile='owner-bb-live-trap-qa-v1';
const ok=x=>{assert.equal(x.http,200,JSON.stringify(x));return x;};

const SHOOT='official.23.shoot',FIRE='official.36.fireball',SHIELD='official.36.shield';
const by=(s,m,role)=>s.state.participants.find(p=>p.playerId===m.byRole[role].profile.id);
async function day(c,m){const path=`/api/games/${m.gameId}`;ok(await c.call('POST',path+'/voting-open',{},m.host.token));ok(await c.call('POST',path+'/voting-close',{},m.host.token));}
test('S21 VH73: wolf dies, medium revives same identity with remaining trap uses, re-elimination and replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s21-wolf-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,10,25,26],profile),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 assert.equal((await state(c,m)).state.qaOwnerDecisionPolicy,'WV-DC-2026-11-25-A-S21');
 ok(await action(c,m,10,25,TRAP));ok(await action(c,m,8,10,KILL));ok(await resolve(c,m));let s=await state(c,m);
 assert.equal(by(s,m,10).life,'DEAD_FINAL');assert(!s.state.completed);assert.equal(by(s,m,10).effects.filter(e=>e.kind==='S15_ENGINEER_TRAP_USED').length,1);
 await nextNight(c,m);const cmd={skillId:REVIVE,targetIds:[id(10)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await c.call('POST',path+'/actions',cmd,m.byRole[26].token));assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[26].token)).action.duplicate);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));s=await state(c,m);
 assert.equal(by(s,m,10).life,'ALIVE');assert.equal(by(s,m,10).currentFaction,'soi');assert.equal(by(s,m,10).currentCharacterId,10);assert.equal(by(s,m,10).effects.filter(e=>e.kind==='S15_ENGINEER_TRAP_USED').length,1);
 assert.equal(s.events.filter(e=>e.eventType==='PLAYER_REVIVED'&&e.payload.playerId===id(10)).length,1);assert(hasClosedDeathLedger(s.state,s.events));
 const ev=ok(await c.call('GET',path+'/events',undefined,m.byRole[8].token)).events;assert.deepEqual(ev.filter(e=>e.eventType==='PLAYER_REVIVED').map(e=>e.payload),[{playerId:id(10)}]);
 await nextNight(c,m);ok(await action(c,m,10,26,TRAP));ok(await action(c,m,8,10,KILL));ok(await resolve(c,m));s=await state(c,m);
 assert.equal(by(s,m,10).effects.filter(e=>e.kind==='S15_ENGINEER_TRAP_USED').length,2);assert.equal(by(s,m,10).life,'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(10)).length,2);assert(hasClosedDeathLedger(s.state,s.events));await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
