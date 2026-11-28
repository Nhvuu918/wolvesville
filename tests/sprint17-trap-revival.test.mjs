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
const TRAP='official.10.trap',KILL='official.8.night-kill',REVIVE='official.26.revive',INSPECT='official.25.inspect-role',profile='owner-bb-live-trap-qa-v1';
const ok=x=>{assert.equal(x.http,200,JSON.stringify(x));return x;};
test('S17 TRAP-05: mark persists through death, public medium revival, next-night inspection and restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-trap-revival-')),file=join(dir,'run.sqlite');let c;
 try{
 c=await setup(file);const m=await match(c,[8,10,25,26],profile),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 const victim=s=>s.state.participants.find(p=>p.playerId===id(25)),mark=s=>victim(s).effects.find(e=>e.kind==='S15_ENGINEER_TRAP');
 ok(await action(c,m,10,25,TRAP));ok(await action(c,m,8,25,KILL));ok(await resolve(c,m));
 let s=await state(c,m);assert.equal(victim(s).life,'DEAD_FINAL');const markId=mark(s).id;assert(!s.events.some(e=>e.eventType==='BB_QA_TRAP_CONSUMED'));await nextNight(c,m);
 ok(await action(c,m,26,25,REVIVE));await c.app.close();c=await setup(file);ok(await resolve(c,m));
 s=await state(c,m);assert.equal(victim(s).life,'ALIVE');assert.equal(mark(s).id,markId);assert(s.events.some(e=>e.eventType==='PLAYER_REVIVED'&&e.payload.playerId===id(25)));assert(hasClosedDeathLedger(s.state,s.events));
 await nextNight(c,m);ok(await action(c,m,25,10,INSPECT));ok(await resolve(c,m));
 s=await state(c,m);assert.equal(mark(s),undefined);assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED'&&e.payload.markId===markId).length,1);
 const own=ok(await c.call('GET',path+'/events',undefined,m.byRole[25].token)).events;assert(own.some(e=>e.eventType==='SEER_AURA_OBSERVED'&&e.payload.verdict==='Thiện'));assert(!own.some(e=>e.eventType==='BB_QA_TRAP_CONSUMED'));
 const others=ok(await c.call('GET',path+'/events',undefined,m.byRole[8].token)).events;assert(!others.some(e=>e.eventType==='SEER_AURA_OBSERVED'||e.eventType==='S15_ENGINEER_TRAP_PLACED'));await checkReplay(c,m);await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,s.state);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S17 TRAP-04: placement before same-night inspection uses existing phase priority and consumes once',async()=>{
 const c=await setup();try{
 const m=await match(c,[8,10,25,26],profile),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 ok(await action(c,m,25,10,INSPECT));ok(await action(c,m,10,25,TRAP));ok(await resolve(c,m));
 let s=await state(c,m);assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED').length,1);assert(!s.state.participants.find(p=>p.playerId===id(25)).effects.some(e=>e.kind==='S15_ENGINEER_TRAP'));
 assert(s.events.some(e=>e.eventType==='SEER_AURA_OBSERVED'&&e.payload.verdict==='Thiện'));
 await nextNight(c,m);ok(await action(c,m,25,10,INSPECT));ok(await resolve(c,m));s=await state(c,m);
 assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED').length,1);assert.equal(s.events.filter(e=>e.eventType==='SEER_AURA_OBSERVED').at(-1).payload.verdict,'Ác');await checkReplay(c,m);
 }finally{await c.app.close();}
});
