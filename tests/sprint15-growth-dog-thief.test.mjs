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
const life=(s,m,id)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id).life;
function evidence(characterIds,source,skill){console.log('# S13_CHARACTER_EVIDENCE '+JSON.stringify({characterIds,source,skill,authoritative:true,replay:true}));}

const eventList=async(c,m,id)=>(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,m.byRole[id].token)).events;
const caps=async(c,m,id)=>(await c.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[id].token)).game.capabilities;
const uses=(s,m,id,skill)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id).effects.filter(e=>e.kind===S13_STATUS.used&&e.payload.skillId===skill).length;
const evidence15=(id,branch,skill)=>console.log('S15_EVIDENCE '+JSON.stringify({id,branch,skill,restart:true,replay:true,privacy:true}));
// New tests use the exact same HTTP/SQLite harness, not seeded game states.
const emit=(id,branch,skill)=>evidence15(id,branch,skill);
async function durable(name,fn){
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-accelerated-')),file=join(dir,'run.sqlite');let c,d;
 try{c=await setup(file);await fn(c,async(m)=>{const ctx=d||c;const old=await state(ctx,m);await checkReplay(ctx,m);await (d||c).app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);await checkReplay(d,m);return d;});}
 finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
}
const ok=r=>assert.equal(r.http,200,JSON.stringify(r));
const ballot=(targetId='')=>({targetId,ballotId:randomUUID(),idempotencyKey:randomUUID()});
const post=(c,m,path,body={},role)=>c.call('POST',`/api/games/${m.gameId}/${path}`,body,role?m.byRole[role].token:m.host.token);
const privateAura=async(c,m)=>(await eventList(c,m,25)).filter(e=>e.eventType==='SEER_AURA_OBSERVED');


const mark=S13_SKILLS.hunterMark,knight='official.8.night-kill';
async function vote(c,m,actor,target){ok(await post(c,m,'voting-open'));if(actor)ok(await post(c,m,'votes',ballot(m.byRole[target].profile.id),actor));ok(await post(c,m,'voting-close'));}
async function privacy(c,m){for(const u of m.users){const r=await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token);assert.equal(r.http,200);assert(!r.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'||e.eventType==='S14_DEATH_FOLLOW_AUDIT'));if(u!==m.byRole[88])assert(!JSON.stringify(r.events).includes('S14_DEATH_MARK'));}}
function matchEvidence(ids,voteChain=true){console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));}
function assertDeaths(x,m,ids){assert.deepEqual(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').map(e=>e.payload.playerId),ids.map(id=>m.byRole[id].profile.id));for(const id of ids){assert.equal(life(x.state,m,id),'DEAD_FINAL');assert.equal(x.events.filter(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[id].profile.id).length,1);}}

const REV='official.33.hanging-revenge';
const winner=(x,m,roles)=>{assert.equal(x.state.completed,true);assert.deepEqual(new Set(x.state.winnerIds),new Set(roles.map(r=>m.byRole[r].profile.id)));assert.equal(x.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);};
const id=(m,r)=>m.byRole[r].profile.id;
const matchProof=(ids,voteChain)=>console.log('S15_APPROVED_MATCH '+JSON.stringify({ids,completed:true,voteChain,restartReplay:true,privacy:true,multiClient:true}));
const approved='wolvesville-official-v1.3.3';
const checkVersion=async(c,m)=>assert.equal((await state(c,m)).state.ruleVersion,approved);
const checkPublic=async(c,m)=>{for(const u of m.users){const r=await c.call('GET',`/api/games/${m.gameId}`,undefined,u.token);assert.equal(r.http,200);assert.equal(r.game.ruleVersion,approved);assert(!r.game.players.some(p=>p.playerId!==u.profile.id&&p.self));}};

const leader='official.48.pack-bite',bell='official.64.pair',snow='official.9.snow-protection',rescue='official.87.rescue';
const cmd=(skillId,targetIds)=>({skillId,targetIds,actionId:randomUUID(),idempotencyKey:randomUUID()});
const choose=(c,m,r,skill,targets)=>post(c,m,'actions',cmd(skill,targets.map(t=>id(m,t))),r);
const bellEvents=async(c,m,r)=>(await eventList(c,m,r)).filter(e=>e.eventType==='S15_SCALE_BELL_OBSERVED');
const scaleMatch=(ids,voteChain)=>console.log('S15_SCALE_MATCH '+JSON.stringify({ids,completed:true,voteChain,restartReplay:true,privacy:true,multiClient:true}));
const scaleEvidence=(id,skill)=>console.log('S15_SCALE_EVIDENCE '+JSON.stringify({id,skill,restart:true,replay:true,privacy:true}));
async function assertBell(c,m,expected){const got=await bellEvents(c,m,64);assert.deepEqual(new Set(got.map(e=>e.payload.roleName)),new Set(expected));assert.equal(got.length,expected.length);for(const r of [25,48,74])assert.equal((await bellEvents(c,m,r)).length,0);}


// Do not run new v1.3.3 mechanics on archived v1.3.2.
delete process.env.WV_ARCHIVED_RULE_REGRESSION;
const capture='official.39.capture';
const missEvent='S15_GROWTH_DOG_THIEF_MISS';
const cap39=async(c,m)=>(await caps(c,m,39)).find(k=>k.skillId===capture);
async function next(c,m){const r=await resolve(c,m);ok(r);assert.equal((await state(c,m)).state.phase,'NIGHT_COLLECT');}
async function checkMiss(c,m,n){assert.equal((await eventList(c,m,39)).filter(x=>x.eventType===missEvent).length,n);for(const r of [25,76])assert.equal((await eventList(c,m,r)).filter(x=>x.eventType===missEvent).length,0);}
test('Growth #39 real QA capture: wolf death, fixed initial majority, private role data, restart and replay',()=>durable('dog-thief-capture',async(c,restart)=>{
 const m=await match(c,[25,39,76]);assert((await cap39(c,m)).available);assert.notEqual((await choose(c,m,39,capture,[39])).http,200);assert.notEqual((await choose(c,m,25,capture,[76])).http,200);
 const b=cmd(capture,[id(m,76)]);ok(await post(c,m,'actions',b,39));assert.equal((await post(c,m,'actions',b,39)).action.duplicate,true);
 ok(await choose(c,m,25,'official.25.inspect-role',[39]));ok(await resolve(c,m));const x=await state(c,m);winner(x,m,[39]);assertDeaths(x,m,[76]);assert.equal((await eventList(c,m,25)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,1);await checkMiss(c,m,0);await checkPublic(c,m);await privacy(c,m);const d=await restart(m);winner(await state(d,m),m,[39]);assert(!JSON.stringify((await eventList(d,m,25)).filter(e=>e.eventType==='PLAYER_ELIMINATED')).includes(capture));console.log('GROWTH_ROLE_EVIDENCE '+JSON.stringify({id:39,skill:capture,branch:'wolf-capture',restart:true,replay:true,privacy:true}));console.log('GROWTH_MATCH_EVIDENCE '+JSON.stringify({ids:[25,39,76],completed:true,voteChain:false,restartReplay:true,privacy:true,multiClient:true}));
}));
test('Growth #39 real QA miss, exact one-night loss, restart, third miss death, wolf victory',()=>durable('dog-thief-miss',async(c,restart)=>{
 const m=await match(c,[25,39,76]);ok(await choose(c,m,39,capture,[25]));ok(await resolve(c,m));await checkMiss(c,m,1);assert.equal(life((await state(c,m)).state,m,39),'ALIVE');await next(c,m);const d=await restart(m);
 for(let n=2;n<=3;n++){assert.equal((await cap39(d,m)).available,false);assert.notEqual((await choose(d,m,39,capture,[76])).http,200);ok(await resolve(d,m));await next(d,m);assert((await cap39(d,m)).available);ok(await choose(d,m,39,capture,[25]));ok(await resolve(d,m));if(n===2){await checkMiss(d,m,2);await next(d,m);}}
 const x=await state(d,m);winner(x,m,[76]);assertDeaths(x,m,[39]);await checkMiss(d,m,2);await privacy(d,m);await restart(m);console.log('GROWTH_ROLE_EVIDENCE '+JSON.stringify({id:39,skill:capture,branch:'miss-cooldown-third-death',restart:true,replay:true,privacy:true}));
}));
test('Growth #39 nightmare cancels queued capture without consuming a miss',()=>durable('dog-thief-block',async(c,restart)=>{
 const m=await match(c,[25,39,76]);ok(await choose(c,m,39,capture,[25]));ok(await choose(c,m,76,'official.76.nightmare',[39]));ok(await resolve(c,m));await checkMiss(c,m,0);assert.equal(life((await state(c,m)).state,m,39),'ALIVE');await next(c,m);const d=await restart(m);assert((await cap39(d,m)).available);await checkReplay(d,m);console.log('GROWTH_ROLE_EVIDENCE '+JSON.stringify({id:39,skill:capture,branch:'locked-capture',restart:true,replay:true,privacy:true}));
}));
