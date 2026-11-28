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
const skill='official.26.revive',kill='official.8.night-kill';
for(const mediumKilled of [false,true])test(`Deep medium #26: closed death, revival, repeated elimination, PH-01 ${mediumKilled}`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-medium-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[8,25,26]),id=r=>m.byRole[r].profile.id,path=`/api/games/${m.gameId}`,get=async r=>(await c.call('GET',path,undefined,m.byRole[r].token)).game,events=async r=>(await c.call('GET',path+'/events',undefined,m.byRole[r].token)).events;
 assert.notEqual((await action(c,m,26,25,skill)).http,200);assert.equal((await action(c,m,8,25,kill)).http,200);assert.equal((await resolve(c,m)).http,200);assert.equal((await get(26)).phase,'DAY_DISCUSS');assert((await get(26)).players.find(p=>p.playerId===id(25)).publicReportedDead);await nextNight(c,m);
 const cap=(await get(26)).capabilities.find(x=>x.skillId===skill);assert(cap.available);assert.deepEqual(cap.eligibleTargetIds,[id(25)]);assert.equal(cap.remainingUses,1);assert.notEqual((await action(c,m,26,8,skill)).http,200);assert.notEqual((await action(c,m,8,25,skill)).http,200);
 const command={skillId:skill,targetIds:[id(25)],actionId:randomUUID(),idempotencyKey:randomUUID()};assert.equal((await c.call('POST',path+'/actions',command,m.byRole[26].token)).http,200);assert.equal((await c.call('POST',path+'/actions',command,m.byRole[26].token)).action.duplicate,true);
 if(mediumKilled)assert.equal((await action(c,m,8,26,kill)).http,200);await c.app.close();c=await setup(file);const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal((await get(25)).phase,'DAY_DISCUSS');assert.equal((await get(25)).players.find(p=>p.playerId===id(25)).self.life,'ALIVE');assert.equal((await get(26)).players.find(p=>p.playerId===id(26)).publicReportedDead,mediumKilled);assert.equal((await get(25)).completed,false);for(const role of [8,25,26]){const es=await events(role),rev=es.filter(e=>e.eventType==='PLAYER_REVIVED');assert.equal(rev.length,1);assert.deepEqual(rev[0].payload,{playerId:id(25)});assert(!rev[0].actorId);assert(!es.some(e=>e.eventType==='REVIVAL_SCHEDULED'));}await checkReplay(c,m);await nextNight(c,m);assert.notEqual((await action(c,m,26,25,skill)).http,200);assert.equal((await action(c,m,25,8,'official.25.inspect-role')).http,200);assert.equal((await action(c,m,8,25,kill)).http,200);assert.equal((await resolve(c,m)).http,200);
 if(!mediumKilled){assert.equal((await get(8)).completed,false);await nextNight(c,m);assert.notEqual((await action(c,m,26,25,skill)).http,200);assert.equal((await action(c,m,8,26,kill)).http,200);assert.equal((await resolve(c,m)).http,200);}
 const f=await get(8);assert(f.completed);assert.deepEqual(f.winnerIds,[id(8)]);const internal=await state(c,m);assert.equal(internal.events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===id(25)).length,2);assert(hasClosedDeathLedger(internal.state,internal.events));const missing=internal.events.filter(e=>e.eventType!=='PLAYER_REVIVED');assert(!hasClosedDeathLedger(internal.state,missing));assert(!hasClosedDeathLedger(internal.state,[...internal.events,internal.events.find(e=>e.eventType==='PLAYER_REVIVED')]));const closeIndex=internal.events.findIndex(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===id(25));assert(closeIndex>=0);const closeEvent=internal.events[closeIndex];for(const inserted of [[closeEvent],[{eventType:'POST_ELIMINATION_CHAIN_PENDING',payload:{victimId:id(25)}},closeEvent]])assert(!hasClosedDeathLedger(internal.state,[...internal.events.slice(0,closeIndex+1),...inserted,...internal.events.slice(closeIndex+1)]),'closed death cycle may not be closed twice or reopened');await checkReplay(c,m);await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,internal.state);await checkReplay(c,m);console.log('DEEP_MEDIUM_EVIDENCE '+JSON.stringify({id:26,deck:[8,25,26],mediumKilled,completed:true,privacy:true,replay:true,restart:true,deathCycles:2}));
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
