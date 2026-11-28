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
test('S15 final #88 hanging follow kills #28 without Jester win; stable knight victory',()=>durable('hunter-hang',async(c,restart)=>{
 const m=await match(c,[8,28,88]);assert.notEqual((await action(c,m,28,88,mark)).http,200);assert.notEqual((await action(c,m,88,88,mark)).http,200);
 const body={skillId:mark,targetIds:[m.byRole[28].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(c,m,'actions',body,88));assert.equal((await post(c,m,'actions',body,88)).action.duplicate,true);assert.notEqual((await action(c,m,88,8,mark)).http,200);ok(await resolve(c,m));assert.notEqual((await action(c,m,88,8,mark)).http,200);
 const d=await restart(m);await vote(d,m,8,88);const x=await state(d,m);assertDeaths(x,m,[88,28]);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);assert(x.events.findIndex(e=>e.eventType==='VICTORY_EVALUATED')>x.events.findIndex(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[28].profile.id));await privacy(d,m);await restart(m);emit(88,"hanging.follow",mark);matchEvidence([8,28,88]);
}));
test('S15 final #28 direct hanging remains winning despite a live Hunter mark',()=>durable('direct-jester',async(c,restart)=>{
 const m=await match(c,[25,28,88]);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,25,28);const x=await state(c,m);assertDeaths(x,m,[28]);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);assert.equal(life(x.state,m,88),'ALIVE');await privacy(c,m);await restart(m);emit(28,"hanging.with.hunter", "passive.28.hanged-victory");matchEvidence([25,28,88]);
}));
test('S15 final #88 hanging without mark does not eliminate secondary player; subsequent direct Jester win',()=>durable('no-mark',async(c,restart)=>{
 const m=await match(c,[8,25,28,88]);ok(await resolve(c,m));await vote(c,m,25,88);let x=await state(c,m);assertDeaths(x,m,[88]);assert.equal(x.state.completed,false);assert.equal(x.state.phase,'NIGHT_COLLECT');const d=await restart(m);ok(await resolve(d,m));await vote(d,m,25,28);x=await state(d,m);assertDeaths(x,m,[88,28]);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);await privacy(d,m);await restart(m);matchEvidence([8,25,28,88]);
}));
test('S15 final #88 night follow and #28 non-hanging death are closed before victory',()=>durable('night-hunter',async(c,restart)=>{
 const m=await match(c,[8,28,88]);ok(await action(c,m,88,28,mark));ok(await action(c,m,8,88,knight));ok(await resolve(c,m));const x=await state(c,m);assertDeaths(x,m,[88,28]);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await privacy(c,m);await restart(m);
}));
test('S15 final #88 hanging follow to Knight does not award Jester a false survivor win',()=>durable('no-false-win',async(c,restart)=>{
 const m=await match(c,[8,28,88]);ok(await action(c,m,88,8,mark));ok(await resolve(c,m));await vote(c,m,28,88);const x=await state(c,m);assertDeaths(x,m,[88,8]);assert.equal(x.state.completed,false);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert.equal(life(x.state,m,28),'ALIVE');assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));await privacy(c,m);await restart(m);
}));

test('S15 final #88 already dead marked target is not eliminated twice',()=>durable('already-dead',async(c,restart)=>{
 const m=await match(c,[8,25,28,88]);ok(await action(c,m,88,28,mark));ok(await action(c,m,8,28,knight));ok(await resolve(c,m));await vote(c,m,25,88);let x=await state(c,m);assertDeaths(x,m,[28,88]);assert.equal(x.state.phase,'NIGHT_COLLECT');const d=await restart(m);ok(await action(d,m,8,25,knight));ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[28,88,25]);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await privacy(d,m);await restart(m);
}));
test('S15 final #88 stale mark without renewed choice fails atomically rather than inventing duration',()=>durable('stale-mark',async(c,restart)=>{
 const m=await match(c,[8,25,28,88]);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,null,null);ok(await resolve(c,m));ok(await post(c,m,'voting-open'));ok(await post(c,m,'votes',ballot(m.byRole[88].profile.id),25));const before=await state(c,m);const r=await post(c,m,'voting-close');assert.notEqual(r.http,200);const after=await state(c,m);assert.deepEqual(after.state,before.state);assert(!after.events.some(e=>e.eventType==='PLAYER_ELIMINATED'||e.eventType==='MATCH_COMPLETED'));await privacy(c,m);await restart(m);
}));
const revenge='official.33.hanging-revenge',skipRevenge='official.33.hanging-revenge-skip';
test('S15 final #33 actual hanging opens private post-death response; choice commits secondary before victory',()=>durable('revenge-choice',async(c,restart)=>{
 const m=await match(c,[25,33,74,84]);assert.notEqual((await action(c,m,33,25,revenge)).http,200);ok(await resolve(c,m));await vote(c,m,25,33);let x=await state(c,m);assert.equal(x.state.resolutionGate.status,'PENDING_EFFECT');assert.equal(life(x.state,m,33),'DEAD_FINAL');assert(!x.events.some(e=>e.eventType==='VICTORY_EVALUATED'||e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'));assert((await caps(c,m,33)).some(x=>x.skillId===revenge&&x.available));
 for(const role of [25,74,84]){assert(!(await caps(c,m,role)).some(x=>x.skillId===revenge));assert(!(await eventList(c,m,role)).some(e=>e.eventType==='S15_FINAL_REVENGE_AVAILABLE'));assert.notEqual((await action(c,m,role,25,revenge)).http,200);}
 assert.notEqual((await action(c,m,33,33,revenge)).http,200);assert.notEqual((await resolve(c,m)).http,200);const d=await restart(m);assert((await caps(d,m,33)).some(x=>x.skillId===revenge&&x.available));const body={skillId:revenge,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(d,m,'actions',body,33));assert.equal((await post(d,m,'actions',body,33)).action.duplicate,true);x=await state(d,m);assertDeaths(x,m,[33,25]);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert.equal(x.state.completed,false);assert(x.events.findIndex(e=>e.eventType==='VICTORY_EVALUATED')>x.events.findIndex(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[33].profile.id));assert.notEqual((await action(d,m,33,74,revenge)).http,200);await restart(m);emit(33,"post-hanging.revenge",revenge);
}));
test('S15 final #33 decline revenge closes chain without secondary death and no invented winner',()=>durable('revenge-skip',async(c,restart)=>{
 const m=await match(c,[25,33,74,84]);ok(await resolve(c,m));await vote(c,m,25,33);const body={skillId:skipRevenge,targetIds:[],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(c,m,'actions',body,33));const x=await state(c,m);assertDeaths(x,m,[33]);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));assert(!(await caps(c,m,33)).some(x=>x.available));await restart(m);
}));
const bite='official.93.pack-bite',heal='official.87.rescue';
async function biteBody(m,targets){return {skillId:bite,targetIds:targets.map(id=>m.byRole[id].profile.id),actionId:randomUUID(),idempotencyKey:randomUUID()};}
async function convert(c,m){assert.notEqual((await action(c,m,93,74,bite)).http,200);ok(await resolve(c,m));await vote(c,m,74,94);const x=await state(c,m);assert.equal(x.state.phase,'NIGHT_COLLECT');const exile=x.state.participants.find(p=>p.currentCharacterId===93);assert.equal(exile.initialFaction,'phe3');assert.equal(exile.currentFaction,'soi');assert.equal(exile.currentCharacterId,93);assert((await caps(c,m,93)).some(c=>c.skillId===bite&&c.available));assert(!(await caps(c,m,93)).some(c=>c.skillId===S13_SKILLS.exile));for(const role of Object.keys(m.byRole).map(Number).filter(r=>r!==93)){assert(!(await caps(c,m,role)).some(c=>c.skillId===bite));assert(!(await eventList(c,m,role)).some(e=>e.eventType==='S15_BREAK_ALIGNMENT_CHANGED'));}}
test('S15 final #93 current faction grants one-wolf two-target pack action after #94 hanging',()=>durable('pack-double',async(c,restart)=>{
 const m=await match(c,[74,84,93,94]);await convert(c,m);const d=await restart(m);assert.notEqual((await action(d,m,93,74,S13_SKILLS.exile)).http,200);assert.notEqual((await action(d,m,74,93,bite)).http,200);assert.notEqual((await post(d,m,'actions',await biteBody(m,[74,74]),93)).http,200);assert.notEqual((await post(d,m,'actions',await biteBody(m,[74,84,94]),93)).http,200);assert.notEqual((await action(d,m,93,94,bite)).http,200);const body=await biteBody(m,[74,84]);ok(await post(d,m,'actions',body,93));assert.equal((await post(d,m,'actions',body,93)).action.duplicate,true);assert.notEqual((await action(d,m,93,74,bite)).http,200);ok(await action(d,m,84,93,S13_SKILLS.silence));ok(await resolve(d,m));const x=await state(d,m);assertDeaths(x,m,[94,74,84]);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[93].profile.id]);for(const role of [74,84,94]){const e=await eventList(d,m,role);assert(!e.some(e=>e.eventType==='S15_BREAK_ALIGNMENT_CHANGED'));assert(e.filter(e=>e.eventType==='PLAYER_ELIMINATED').every(e=>Object.keys(e.payload).length===1&&!e.actorId));}await restart(m);emit(93,"pack.double-bite",bite);matchEvidence([74,84,93,94],false);
}));
test('S15 final #87 privately receives both bite victims and rescues only one before wolf parity',()=>durable('pack-rescue',async(c,restart)=>{
 const m=await match(c,[74,84,87,93,94]);await convert(c,m);ok(await post(c,m,'actions',await biteBody(m,[74,84]),93));ok(await resolve(c,m));let x=await state(c,m);assert.equal(x.state.phase,'WITCH_WINDOW');assert.equal(life(x.state,m,74),'PENDING_DEATH');assert.equal(life(x.state,m,84),'PENDING_DEATH');assert(!x.state.participants.find(p=>p.currentCharacterId===74).publicReportedDead);assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));const notice=(await eventList(c,m,87)).find(e=>e.eventType==='S15_FINAL_PHARMACIST_PRELIMINARY');assert.deepEqual(new Set(notice.payload.playerIds),new Set([m.byRole[74].profile.id,m.byRole[84].profile.id]));for(const role of [74,84,93,94]){const e=await eventList(c,m,role);assert(!e.some(e=>e.eventType==='S15_FINAL_PHARMACIST_PRELIMINARY'||e.eventType==='S15_DEEP_PRELIMINARY_QUEUED'));const view=(await c.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[role].token)).game;assert(!view.players.filter(p=>p.playerId!==m.byRole[94].profile.id).some(p=>p.publicReportedDead));if([74,84].includes(role))assert.equal(view.players.find(p=>p.self).self.life,'ALIVE');}
 const d=await restart(m);assert.deepEqual(new Set((await caps(d,m,87)).find(c=>c.skillId===heal).eligibleTargetIds),new Set(notice.payload.playerIds));assert.notEqual((await action(d,m,87,87,heal)).http,200);assert.notEqual((await action(d,m,74,84,heal)).http,200);const body={skillId:heal,targetIds:[m.byRole[74].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(d,m,'actions',body,87));assert.equal((await post(d,m,'actions',body,87)).action.duplicate,true);assert.notEqual((await action(d,m,87,84,heal)).http,200);ok(await resolve(d,m));x=await state(d,m);assert.equal(life(x.state,m,74),'ALIVE');assert.equal(life(x.state,m,84),'DEAD_FINAL');assert.equal(x.state.phase,'DAY_DISCUSS');assert(!x.state.completed);assert(!(await eventList(d,m,74)).some(e=>e.eventType==='S15_DEEP_RESCUE_APPLIED'));await vote(d,m,null,null);ok(await post(d,m,'actions',await biteBody(m,[74,87]),93));ok(await resolve(d,m));assert.notEqual((await action(d,m,87,87,heal)).http,200);ok(await resolve(d,m));x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[93].profile.id]);assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,4);await restart(m);emit(87,"rescue.one-bite-victim",heal);matchEvidence([74,84,87,93,94],false);
}));
test('S15 final #87 may use its single rescue on itself while preliminarily bitten',()=>durable('pack-self-rescue',async(c,restart)=>{
 const m=await match(c,[74,84,87,93,94]);await convert(c,m);ok(await post(c,m,'actions',await biteBody(m,[87,74]),93));ok(await resolve(c,m));const before=await state(c,m);assert.equal(life(before.state,m,87),'PENDING_DEATH');assert((await caps(c,m,87)).some(c=>c.skillId===heal&&c.available));ok(await action(c,m,87,87,heal));ok(await resolve(c,m));const x=await state(c,m);assert.equal(life(x.state,m,87),'ALIVE');assert.equal(life(x.state,m,74),'DEAD_FINAL');assert.equal(x.state.completed,false);await restart(m);
}));
