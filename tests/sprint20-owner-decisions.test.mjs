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
test('S20 DC-SOUL-02: friendly shot spends one bullet, shield blocks, unshielded villager dies, retry and restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-dc-soul-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,23,25,36]),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 assert.equal((await state(c,m)).state.qaOwnerDecisionPolicy,'WV-DC-2026-11-25-A');
 ok(await action(c,m,36,23,FIRE));ok(await resolve(c,m));await day(c,m);
 ok(await action(c,m,36,25,SHIELD));const cmd={skillId:SHOOT,targetIds:[id(25)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await c.call('POST',path+'/actions',cmd,m.byRole[23].token));assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[23].token)).action.duplicate);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));let s=await state(c,m);
 assert.equal(by(s,m,23).resources.soulBullets,1);assert.equal(by(s,m,25).life,'ALIVE');assert(!s.state.completed);
 assert(s.events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'&&e.targetId===id(25)));
 await day(c,m);ok(await action(c,m,23,25,SHOOT));ok(await resolve(c,m));s=await state(c,m);
 assert.equal(by(s,m,25).life,'DEAD_FINAL');assert.equal(by(s,m,23).resources.soulBullets,0);assert(!s.state.completed);
 assert.equal(s.events.filter(e=>e.eventType==='RESOURCE_CHARGED'&&e.payload.name==='soulBullets').length,2);
 assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(25)).length,1);
 await day(c,m);assert.notEqual((await action(c,m,23,8,SHOOT)).http,200);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S20 DC-SOUL-02: friendly kill then enemy kill, victory after second shot; legacy policy remains pinned',async()=>{
 const c=await setup();try{const m=await match(c,[8,23,25,36]);ok(await action(c,m,36,23,FIRE));ok(await resolve(c,m));await day(c,m);ok(await action(c,m,23,25,SHOOT));ok(await resolve(c,m));assert(!(await state(c,m)).state.completed);await day(c,m);ok(await action(c,m,23,8,SHOOT));ok(await resolve(c,m));const s=await state(c,m);assert(s.state.completed);assert.deepEqual(new Set(s.state.winnerIds),new Set([23,25,36].map(r=>m.byRole[r].profile.id)));await checkReplay(c,m);
 delete process.env.WV_OWNER_DC_QA;const legacy=await match(c,[8,23,25,36]);process.env.WV_OWNER_DC_QA='1';ok(await action(c,legacy,36,23,FIRE));ok(await resolve(c,legacy));await day(c,legacy);assert.equal((await state(c,legacy)).state.qaOwnerDecisionPolicy,undefined);assert.notEqual((await action(c,legacy,23,25,SHOOT)).http,200);await checkReplay(c,legacy);
 }finally{process.env.WV_OWNER_DC_QA='1';await c.app.close();}
});
test('S20 DC-TRAP-02: trapped medium fails revival, consumes mark and use once; invalid action and restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-dc-trap-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,10,25,26],profile),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 ok(await action(c,m,10,26,TRAP));ok(await action(c,m,8,25,KILL));ok(await resolve(c,m));let s=await state(c,m);const mark=by(s,m,26).effects.find(x=>x.kind==='S15_ENGINEER_TRAP');assert(mark);await nextNight(c,m);
 assert.notEqual((await action(c,m,26,8,REVIVE)).http,200);assert((await state(c,m)).state.participants.find(x=>x.playerId===id(26)).effects.some(x=>x.id===mark.id));
 const cmd={skillId:REVIVE,targetIds:[id(25)],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await c.call('POST',path+'/actions',cmd,m.byRole[26].token));assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[26].token)).action.duplicate);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));s=await state(c,m);
 assert.equal(by(s,m,25).life,'DEAD_FINAL');assert(!by(s,m,25).effects.some(e=>e.kind==='S15_DEEP_REVIVE_PENDING'));
 assert.equal(by(s,m,26).effects.filter(e=>e.kind==='S15_DEEP_MEDIUM_USED').length,1);assert(!by(s,m,26).effects.some(e=>e.id===mark.id));
 assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED'&&e.payload.markId===mark.id).length,1);
 assert.equal(s.events.filter(e=>e.eventType==='REVIVAL_INVERTED_FAILED').length,1);assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(25)).length,1);assert(!s.events.some(e=>e.eventType==='PLAYER_REVIVED'));assert(hasClosedDeathLedger(s.state,s.events));
 const v=ok(await c.call('GET',path+'/events',undefined,m.byRole[8].token)).events;assert(!v.some(e=>['REVIVAL_INVERTED_FAILED','BB_QA_TRAP_CONSUMED'].includes(e.eventType)));await nextNight(c,m);assert.notEqual((await action(c,m,26,25,REVIVE)).http,200);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S20 DC-TRAP-02: same-night placement precedes accepted revival; no duplicate death or revival',async()=>{
 const c=await setup();try{const m=await match(c,[8,10,25,26],profile);ok(await action(c,m,8,25,KILL));ok(await resolve(c,m));await nextNight(c,m);ok(await action(c,m,26,25,REVIVE));ok(await action(c,m,10,26,TRAP));ok(await resolve(c,m));const s=await state(c,m);assert.equal(by(s,m,25).life,'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='REVIVAL_INVERTED_FAILED').length,1);assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED').length,1);assert(!s.events.some(e=>e.eventType==='PLAYER_REVIVED'));await checkReplay(c,m);
 }finally{await c.app.close();}
});

test('S20 DC-SOUL-01: designated #8 blind attempt on dead seat consumes nightly slot; no extra death, finite fire still restricted',async()=>{
 const c=await setup();try{const m=await match(c,[8,23,25,36]),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 ok(await action(c,m,36,23,FIRE));ok(await action(c,m,8,25,KILL));ok(await resolve(c,m));await day(c,m);
 const view=ok(await c.call('GET',path,undefined,m.byRole[8].token)).game;const cap=view.capabilities.find(x=>x.skillId===KILL);assert(cap.eligibleTargetIds.includes(id(23))&&cap.eligibleTargetIds.includes(id(25)));assert.equal(cap.targetPolicy.aliveOnly,false);
 assert.notEqual((await action(c,m,36,23,FIRE)).http,200); // #36 is not designated for blind attempts
 const cmd={skillId:KILL,targetIds:[id(25)],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await c.call('POST',path+'/actions',cmd,m.byRole[8].token));assert(ok(await c.call('POST',path+'/actions',cmd,m.byRole[8].token)).action.duplicate);assert.notEqual((await action(c,m,8,23,KILL)).http,200);
 ok(await resolve(c,m));let s=await state(c,m);assert.equal(by(s,m,23).life,'ALIVE');assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(25)).length,1);
 await day(c,m);ok(await action(c,m,8,23,KILL));ok(await resolve(c,m));s=await state(c,m);assert.equal(by(s,m,23).life,'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(23)).length,1);await checkReplay(c,m);
 }finally{await c.app.close();}
});

test('FULL5 #25 trapped unknown aura uses typed false aura, consumes once and preserves private replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-full5-aura-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,10,25,26],profile),id=x=>m.byRole[x].profile.id,path=`/api/games/${m.gameId}`;
 ok(await action(c,m,10,25,TRAP));ok(await resolve(c,m));const mark=by(await state(c,m),m,25).effects.find(x=>x.kind==='S15_ENGINEER_TRAP');assert(mark);await nextNight(c,m);
 ok(await action(c,m,25,8,INSPECT));await c.app.close();c=await setup(file);ok(await resolve(c,m));let s=await state(c,m);
 const obs=s.events.filter(e=>e.eventType==='SEER_AURA_OBSERVED');assert.equal(obs.length,1);assert.equal(obs[0].payload.verdict,'Thiện');assert(!('characterId' in obs[0].payload));assert.equal(s.events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED'&&e.payload.markId===mark.id).length,1);
 assert(!(ok(await c.call('GET',path+'/events',undefined,m.byRole[8].token)).events).some(e=>e.eventType==='SEER_AURA_OBSERVED'));
 await nextNight(c,m);ok(await action(c,m,25,8,INSPECT));ok(await resolve(c,m));s=await state(c,m);assert.deepEqual(s.events.filter(e=>e.eventType==='SEER_AURA_OBSERVED').map(e=>e.payload.verdict),['Thiện','Không xác định']);await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
