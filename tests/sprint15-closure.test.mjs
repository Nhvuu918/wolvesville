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

const snow='official.9.snow-protection',revenge='official.33.hanging-revenge';
const layer=(s,m,role)=>s.participants.find(p=>p.playerId===m.byRole[role].profile.id).effects.filter(e=>e.kind==='OFFICIAL_9_SNOW_PROTECTION');
test('S15 closure snow shield absorbs Hunter secondary at night once; actual hanging still wins Jester',()=>durable('hunter-snow',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,28,snow));ok(await action(c,m,88,28,mark));ok(await action(c,m,8,88,knight));ok(await resolve(c,m));let x=await state(c,m);assertDeaths(x,m,[88]);assert.equal(life(x.state,m,28),'ALIVE');assert.equal(layer(x.state,m,28).length,0);assert.equal(x.events.filter(e=>e.eventType==='S15_CLOSURE_FOLLOW_BLOCKED').length,1);assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));for(const role of [8,9,28,88])assert(!(await eventList(c,m,role)).some(e=>e.eventType==='S15_CLOSURE_FOLLOW_BLOCKED'));
 const d=await restart(m);await vote(d,m,9,28);x=await state(d,m);assertDeaths(x,m,[88,28]);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);await privacy(d,m);await restart(m);emit(88,'follow.blocked.by.snow',mark);matchEvidence([8,9,28,88]);
}));
test('S15 closure primary shield prevents Hunter death and follow; next night mark may be renewed',()=>durable('hunter-shield-primary',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,88,snow));ok(await action(c,m,88,28,mark));ok(await action(c,m,8,88,knight));ok(await resolve(c,m));let x=await state(c,m);assertDeaths(x,m,[]);assert.equal(layer(x.state,m,88).length,0);assert.equal(life(x.state,m,28),'ALIVE');await vote(c,m,null,null);const d=await restart(m);assert.notEqual((await action(d,m,9,88,snow)).http,200);ok(await action(d,m,88,9,mark));ok(await action(d,m,8,88,knight));ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[88,9]);assert.equal(life(x.state,m,28),'ALIVE');await vote(d,m,8,28);x=await state(d,m);assertDeaths(x,m,[88,9,28]);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[8].profile.id,m.byRole[28].profile.id]));await privacy(d,m);await restart(m);
}));
test('S15 closure snow shield persists after owner dies and is consumed once',()=>durable('hunter-snow-persistent',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,28,snow));ok(await action(c,m,88,28,mark));ok(await action(c,m,8,9,knight));ok(await resolve(c,m));let x=await state(c,m);assertDeaths(x,m,[9]);assert.equal(layer(x.state,m,28).length,1);await vote(c,m,null,null);const d=await restart(m);ok(await action(d,m,88,28,mark));ok(await action(d,m,8,88,knight));ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[9,88]);assert.equal(life(x.state,m,28),'ALIVE');assert.equal(layer(x.state,m,28).length,0);await vote(d,m,8,28);x=await state(d,m);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[8].profile.id,m.byRole[28].profile.id]));await restart(m);
}));
test('S15 closure revenge kills Hunter and follows pinned villager before closing original chain',()=>durable('revenge-hunter',async(c,restart)=>{
 const m=await match(c,[25,33,74,88]);ok(await action(c,m,88,25,mark));ok(await resolve(c,m));await vote(c,m,74,33);let x=await state(c,m);assert.equal(x.state.resolutionGate.status,'PENDING_EFFECT');assert(!x.events.some(e=>e.eventType==='VICTORY_EVALUATED'));const d=await restart(m);const body={skillId:revenge,targetIds:[m.byRole[88].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(d,m,'actions',body,33));assert.equal((await post(d,m,'actions',body,33)).action.duplicate,true);x=await state(d,m);assertDeaths(x,m,[33,88,25]);assert.equal(x.state.completed,false);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');const vi=x.events.findIndex(e=>e.eventType==='VICTORY_EVALUATED');for(const role of [33,88,25])assert(x.events.findIndex(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[role].profile.id)<vi);await privacy(d,m);await restart(m);emit(33,'revenge.hunter.follow',revenge);
}));
test('S15 closure Hunter hanging pulls wolf as secondary without opening revenge or duplicating death',()=>durable('hunter-pulls-wolf',async(c,restart)=>{
 const m=await match(c,[25,33,74,88]);ok(await action(c,m,88,33,mark));ok(await resolve(c,m));await vote(c,m,74,88);const x=await state(c,m);assertDeaths(x,m,[88,33]);assert.equal(x.state.completed,false);assert(!x.events.some(e=>e.eventType==='S15_FINAL_REVENGE_AVAILABLE'));assert(!(await caps(c,m,33)).some(x=>x.skillId===revenge&&x.available));assert.notEqual((await action(c,m,33,25,revenge)).http,200);await privacy(c,m);await restart(m);
}));

test('S15 closure death ledger rejects missing, duplicated and reopened death chains before victory',()=>durable('ledger-counterexample',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,28,snow));ok(await action(c,m,88,28,mark));ok(await action(c,m,8,88,knight));ok(await resolve(c,m));await vote(c,m,9,28);const x=await state(c,m);const s={...x.state,completed:false,phase:'DAY_RESOLVE'};const victim=m.byRole[28].profile.id;const chain={victimId:victim,pendingEffects:0};const death=x.events.find(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===victim);
 assert.equal(hasClosedDeathLedger(s,x.events),true);assert.equal(resolveHangingVictory(s,victim,chain,x.events).kind,'WINNER_VERIFIED');
 for(const invalid of [x.events.filter(e=>!(e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===victim)),[...x.events,death],[...x.events,{eventType:'POST_ELIMINATION_CHAIN_PENDING',payload:{victimId:victim,pendingEffects:1}}]]){assert.equal(hasClosedDeathLedger(s,invalid),false);assert.equal(resolveHangingVictory(s,victim,chain,invalid).kind,'NOT_YET');}
 await restart(m);
}));

test('S15 closure snow protection expires before the third night Hunter follow',()=>durable('hunter-expiry',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,28,snow));ok(await action(c,m,88,28,mark));ok(await action(c,m,8,9,knight));ok(await resolve(c,m));let x=await state(c,m);assertDeaths(x,m,[9]);assert.equal(layer(x.state,m,28).length,1);await vote(c,m,null,null);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,null,null);const d=await restart(m);ok(await action(d,m,88,28,mark));ok(await action(d,m,8,88,knight));ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[9,88,28]);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);assert(!x.events.some(e=>e.eventType==='S15_CLOSURE_FOLLOW_BLOCKED'));await privacy(d,m);await restart(m);
}));
test('S15 closure night-only snow protection cannot block daytime Hunter follow',()=>durable('hunter-day-snow',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,9,28,snow));ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,9,88);let x=await state(c,m);assertDeaths(x,m,[88,28]);assert.equal(x.state.completed,false);assert(!x.events.some(e=>e.eventType==='S15_CLOSURE_FOLLOW_BLOCKED'));const d=await restart(m);ok(await action(d,m,8,9,knight));ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[88,28,9]);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await privacy(d,m);await restart(m);
}));
