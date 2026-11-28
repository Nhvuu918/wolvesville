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
const trap='official.10.trap',approved='wolvesville-official-v1.3.3';
const eventList=async(c,m,r)=>(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,m.byRole[r].token)).events;
const cap=async(c,m,r)=>(await c.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[r].token)).game.capabilities;

import {OwnerBBV2Journal} from '../dist/backend/src/experimental/owner-bb-v2/journal.js';
import {OwnerBBV2TrapGateway} from '../dist/backend/src/experimental/owner-bb-v2/gateway.js';
for(const target of [25,74,5])test(`BBv2 real accepted engineer queue: trap on ${target}, typed result, atomic journal, old archive unchanged`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-bbv2-trap-gateway-')),file=join(dir,'official.sqlite'),lab=join(dir,'candidate.sqlite');let c,j;const prev=process.env.WV_OWNER_BB_LAB;process.env.WV_OWNER_BB_LAB='1';
 try{c=await setup(file);const m=await match(c,[5,10,25,74]);for(const r of [25,74,5])assert.equal((await action(c,m,r,10,r===5?'official.5.weigh-soul':`official.${r}.inspect-role`)).http,200);assert.equal((await action(c,m,10,target,trap)).http,200);
  const before=(await c.store.gameById(m.gameId)).archive;j=new OwnerBBV2Journal(lab);let gateway=new OwnerBBV2TrapGateway(c.store,j);const outsider=await c.user();await assert.rejects(gateway.commitNight(outsider.token,m.gameId,'candidate-night'),/FORBIDDEN/);
  const out=await gateway.commitNight(m.host.token,m.gameId,'candidate-night');assert.deepEqual(out,{seq:1,duplicate:false,committed:true});const snap=j.replay(`trap-v2:${m.gameId}`);const aggregate=snap.aggregate,events=aggregate.commit.events;assert.equal(aggregate.state.marks[0].targetId,m.byRole[target].profile.id);assert.equal(aggregate.state.marks[0].state,'CONSUMED');assert.equal(aggregate.commit.state.phase,'NIGHT_RESOLVE');assert.equal(aggregate.commit.winnerEvaluated,false);
  const value=r=>events.find(e=>e.eventType==='CANDIDATE_INFORMATION'&&e.recipientId===m.byRole[r].profile.id)?.payload.value;assert.equal(value(25),target===25?'Thiện':'Ác');assert.equal(value(5),'Ác');if(target===74)assert([5,25,74].includes(value(74)));else assert.equal(value(74),10);assert.equal(aggregate.commit.state.participants.find(p=>p.currentCharacterId===5).effects.filter(e=>e.kind==='OFFICIAL_5_JUDGMENT_USED').length,1);assert.equal(events.filter(e=>e.eventType==='CANDIDATE_INFORMATION').length,3);assert(events.filter(e=>e.eventType==='CANDIDATE_INFORMATION').every(e=>e.visibility==='PLAYER_PRIVATE'));
  assert((await gateway.commitNight(m.host.token,m.gameId,'candidate-night')).duplicate);assert.deepEqual((await c.store.gameById(m.gameId)).archive,before);await checkReplay(c,m);j.close();j=undefined;await c.app.close();c=undefined;c=await setup(file);j=new OwnerBBV2Journal(lab);assert.deepEqual(j.replay(`trap-v2:${m.gameId}`),snap);assert.deepEqual((await c.store.gameById(m.gameId)).archive,before);await checkReplay(c,m);
  // Ordinary official engine still resolves the original first-night rule,
  // with its own mark, not the v2 candidate ledger.
  assert.equal((await resolve(c,m)).http,200);assert.equal((await state(c,m)).state.participants.find(p=>p.currentCharacterId===target).effects.filter(e=>e.kind==='S15_ENGINEER_TRAP').length,1);assert.deepEqual(j.replay(`trap-v2:${m.gameId}`),snap);
  console.log('BBV2_TRAP_ENGINE_QUEUE_ARCHIVE_ISOLATION_PASS',target);
 }finally{if(j)j.close();if(c)await c.app.close();rmSync(dir,{recursive:true,force:true});if(prev===undefined)delete process.env.WV_OWNER_BB_LAB;else process.env.WV_OWNER_BB_LAB=prev;}
});
