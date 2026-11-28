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


const ok=x=>{assert.equal(x.http,200,JSON.stringify(x));return x;};
const swap='official.37.swap',aura='official.25.inspect-role',exact='official.74.inspect-role';
test('S22 #25/#74/#37: shared transposition preserves typed private inspection, expiry, restart and actual hanging',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s22-swap-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[25,28,37,74]),id=r=>m.byRole[r].profile.id,path=`/api/games/${m.gameId}`;
 const post=(r,endpoint,body)=>c.call('POST',path+'/'+endpoint,body,m.byRole[r].token);
 const ev=async r=>ok(await c.call('GET',path+'/events',undefined,m.byRole[r].token)).events;
 const cmd={skillId:swap,targetIds:[id(28),id(25)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await action(c,m,74,28,exact));ok(await action(c,m,25,28,aura));ok(await post(37,'actions',cmd));assert(ok(await post(37,'actions',cmd)).action.duplicate);
 assert.notEqual((await action(c,m,74,37,exact)).http,200);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));
 assert.deepEqual((await ev(25)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').map(e=>e.payload.verdict),['Thiện']);
 assert.deepEqual((await ev(74)).filter(e=>e.eventType==='ROLE_OBSERVED').map(e=>e.payload.characterId),[25]);
 for(const r of [28,37])assert(!(await ev(r)).some(e=>['SEER_AURA_OBSERVED','ROLE_OBSERVED','S15_BREAK_SWAP_PLACED'].includes(e.eventType)));
 assert(!(await ev(74)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));assert(!(await ev(25)).some(e=>e.eventType==='ROLE_OBSERVED'));
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));
 ok(await c.call('POST',path+'/voting-close',{},m.host.token));
 let v=await state(c,m);if(v.state.phase!=='NIGHT_COLLECT')await nextNight(c,m);
 ok(await action(c,m,25,28,aura));ok(await action(c,m,74,28,exact));ok(await resolve(c,m));
 assert.deepEqual((await ev(25)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').map(e=>e.payload.verdict),['Thiện','Không xác định']);
 assert.deepEqual((await ev(74)).filter(e=>e.eventType==='ROLE_OBSERVED').map(e=>e.payload.characterId),[25,28]);
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));ok(await post(37,'votes',{targetId:id(28),ballotId:randomUUID(),idempotencyKey:randomUUID()}));ok(await c.call('POST',path+'/voting-close',{},m.host.token));v=await state(c,m);assert(v.state.completed);assert.deepEqual(v.state.winnerIds,[id(28)]);assert(hasClosedDeathLedger(v.state,v.events));await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S22 VH73 #26: third faction #28 night death, revival, real hanging victory and closed death ledger',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s22-jester-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,25,26,28]),id=r=>m.byRole[r].profile.id,path=`/api/games/${m.gameId}`;
 const post=(r,endpoint,body)=>c.call('POST',path+'/'+endpoint,body,m.byRole[r].token);
 const get=async r=>ok(await c.call('GET',path,undefined,m.byRole[r].token)).game;
 const ev=async r=>ok(await c.call('GET',path+'/events',undefined,m.byRole[r].token)).events;
 ok(await action(c,m,8,28,'official.8.night-kill'));ok(await resolve(c,m));let v=await state(c,m);assert(!v.state.completed);assert(v.state.participants.find(p=>p.playerId===id(28)).publicReportedDead);assert(hasClosedDeathLedger(v.state,v.events));
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));ok(await c.call('POST',path+'/voting-close',{},m.host.token));
 assert((await get(26)).capabilities.find(x=>x.skillId==='official.26.revive').eligibleTargetIds.includes(id(28)));
 assert.notEqual((await action(c,m,26,25,'official.26.revive')).http,200);
 const cmd={skillId:'official.26.revive',targetIds:[id(28)],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(26,'actions',cmd));assert(ok(await post(26,'actions',cmd)).action.duplicate);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));v=await state(c,m);assert(!v.state.completed);const j=v.state.participants.find(p=>p.playerId===id(28));assert.equal(j.life,'ALIVE');assert.equal(j.currentFaction,'phe3');assert.equal(j.currentCharacterId,28);assert(hasClosedDeathLedger(v.state,v.events));
 for(const r of [8,25,26,28])assert.deepEqual((await ev(r)).filter(e=>e.eventType==='PLAYER_REVIVED').map(e=>e.payload),[{playerId:id(28)}]);
 ok(await c.call('POST',path+'/voting-open',{},m.host.token));ok(await post(25,'votes',{targetId:id(28),ballotId:randomUUID(),idempotencyKey:randomUUID()}));ok(await c.call('POST',path+'/voting-close',{},m.host.token));v=await state(c,m);assert(v.state.completed);assert.deepEqual(v.state.winnerIds,[id(28)]);assert(hasClosedDeathLedger(v.state,v.events));assert.equal(v.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(28)).length,2);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
