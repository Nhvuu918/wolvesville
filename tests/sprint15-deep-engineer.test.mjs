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
for(const target of [25,74,5])test(`Deep engineer #10: first-night trap on ${target}, typed inspection, private RNG and durable replay`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-engineer-')),file=join(dir,'run.sqlite');let c;const prev=process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_ARCHIVED_RULE_REGRESSION;
 try{c=await setup(file);const m=await match(c,[5,10,25,74]);assert.equal((await state(c,m)).state.ruleVersion,approved);assert((await cap(c,m,10)).some(x=>x.skillId===trap&&x.available));assert(!(await cap(c,m,25)).some(x=>x.skillId===trap));assert.notEqual((await action(c,m,25,10,trap)).http,200);assert.notEqual((await action(c,m,10,10,trap)).http,200);
  for(const r of [25,74,5])assert.equal((await action(c,m,r,10,r===5?'official.5.weigh-soul':`official.${r}.inspect-role`)).http,200);
  const a={skillId:trap,targetIds:[m.byRole[target].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};const path=`/api/games/${m.gameId}`;assert.equal((await c.call('POST',path+'/actions',a,m.byRole[10].token)).http,200);assert.equal((await c.call('POST',path+'/actions',a,m.byRole[10].token)).action.duplicate,true);assert.equal((await resolve(c,m)).http,200);
  const expected={25:'SEER_AURA_OBSERVED',74:'ROLE_OBSERVED',5:'SOUL_JUDGMENT_OBSERVED'};for(const r of [25,74,5]){const es=await eventList(c,m,r);for(const [actor,type] of Object.entries(expected))assert.equal(es.filter(e=>e.eventType===type).length,Number(Number(actor)===r));assert(!es.some(e=>e.eventType==='S15_ENGINEER_TRAP_PLACED'));const e=es.find(e=>e.eventType===expected[r]);if(r===25)assert.equal(e.payload.verdict,target===25?'Thiện':'Ác');if(r===5)assert.equal(e.payload.verdict,'Ác');if(r===74){assert.equal(typeof e.payload.characterId,'number');if(target===74)assert([5,25,74].includes(e.payload.characterId));else assert.equal(e.payload.characterId,10);}}
  const internal=await state(c,m);assert.equal(internal.events.filter(e=>e.eventType==='S15_ENGINEER_TRAP_PLACED').length,1);assert.equal(internal.state.participants.find(p=>p.currentCharacterId===target).effects.filter(e=>e.kind==='S15_ENGINEER_TRAP').length,1);
  const archive=(await c.store.gameById(m.gameId)).archive;const rng=withKernel(archive,false,(e,repo)=>repo.draws(m.gameId),true).value.filter(d=>d.reason.startsWith('Q13-06'));assert.equal(rng.length,Number(target===74));if(rng.length)assert.deepEqual(rng[0].domain,['25','5','74']);
  await checkReplay(c,m);await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,internal.state);await checkReplay(c,m);console.log('DEEP_ENGINEER_EVIDENCE '+JSON.stringify({id:10,target,skill:trap,privacy:true,replay:true,restart:true}));
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});if(prev!==undefined)process.env.WV_ARCHIVED_RULE_REGRESSION=prev;}
});
