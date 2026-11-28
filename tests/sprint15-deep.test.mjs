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

const WRES='official.29.rescue';
const WPOI=S13_SKILLS.witchPoison;
const knight='official.8.night-kill';
const evidenceDeep=(id,branch,skill)=>console.log('S15_DEEP_EVIDENCE '+JSON.stringify({id,branch,skill,restart:true,replay:true,privacy:true}));
async function assertPrelim(c,m,id){
 const x=await state(c,m);assert.equal(x.state.phase,'WITCH_WINDOW');assert.equal(life(x.state,m,id),'PENDING_DEATH');assert(!x.state.participants.find(p=>p.currentCharacterId===id).publicReportedDead);assert(!x.events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===m.byRole[id].profile.id));
 const notice=(await eventList(c,m,29)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1);assert.deepEqual(notice.payload.playerIds,[m.byRole[id].profile.id]);assert(!('characterId' in notice.payload));
 for(const r of [8,25]){assert(!(await eventList(c,m,r)).some(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY'||e.eventType==='S15_DEEP_PRELIMINARY_QUEUED'));const v=(await c.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[r].token)).game;assert(!v.players.some(p=>p.publicReportedDead));assert(!v.capabilities.some(p=>p.eligibleTargetIds));if(r===id)assert.equal(v.players.find(p=>p.self).self.life,'ALIVE');}
 assert.deepEqual((await caps(c,m,29)).find(x=>x.skillId===WRES).eligibleTargetIds,[m.byRole[id].profile.id]);
}
test('S15 deep #29 preliminary rescue + poison in same night, private notice and exact-once resources',()=>durable('rescue-both',async(c,restart)=>{
 const m=await match(c,[8,25,29]);assert.notEqual((await action(c,m,29,25,WRES)).http,200);ok(await action(c,m,25,8,'official.25.inspect-role'));ok(await action(c,m,8,25,knight));ok(await resolve(c,m));await assertPrelim(c,m,25);
 const d=await restart(m);await assertPrelim(d,m,25);assert.notEqual((await action(d,m,29,8,WRES)).http,200);assert.notEqual((await action(d,m,25,25,WRES)).http,200);
 const b={skillId:WRES,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 // Submit poison first; resolution must apply rescue before poison, regardless of network ordering.
 ok(await action(d,m,29,8,WPOI));ok(await post(d,m,'actions',b,29));assert.equal((await post(d,m,'actions',b,29)).action.duplicate,true);assert.notEqual((await action(d,m,29,25,WRES)).http,200);ok(await resolve(d,m));const old=await state(d,m);
 assert.equal(life(old.state,m,25),'ALIVE');assert.equal(life(old.state,m,8),'DEAD_FINAL');assert.equal(uses(old.state,m,29,WRES),1);assert.equal(uses(old.state,m,29,WPOI),1);assert.equal(old.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);assert(old.events.findIndex(e=>e.eventType==='S15_DEEP_RESCUE_APPLIED')<old.events.findIndex(e=>e.eventType==='PLAYER_ELIMINATED'));
 assert(!(await eventList(d,m,25)).some(e=>e.eventType==='S15_DEEP_RESCUE_APPLIED'));await restart(m);evidenceDeep(29,'rescue.night-victim',WRES);evidenceDeep(29,'rescue.and.poison',WRES);
}));
test('S15 deep #29 self rescue per NV32, second use rejected, no-rescue deaths close before winner',()=>durable('rescue-self',async(c,restart)=>{
 const m=await match(c,[8,25,29]);ok(await action(c,m,8,29,knight));ok(await resolve(c,m));await assertPrelim(c,m,29);ok(await action(c,m,29,29,WRES));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,29),'ALIVE');
 const d=await restart(m);await nextNight(d,m);ok(await action(d,m,8,25,knight));ok(await resolve(d,m));await assertPrelim(d,m,25);assert.equal((await caps(d,m,29)).find(x=>x.skillId===WRES).remainingUses,0);assert.notEqual((await action(d,m,29,25,WRES)).http,200);ok(await resolve(d,m));assert.equal(life((await state(d,m)).state,m,25),'DEAD_FINAL');
 await nextNight(d,m);ok(await action(d,m,8,29,knight));ok(await resolve(d,m));assert.equal((await state(d,m)).state.completed,false);ok(await resolve(d,m));const fin=await state(d,m);assert.equal(fin.state.completed,true);assert.deepEqual(fin.state.winnerIds,[m.byRole[8].profile.id]);assert.equal(fin.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);for(const role of [25,29])assert(fin.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[role].profile.id));await restart(m);evidenceDeep(29,'rescue.self-once',WRES);console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids:[8,25,29],completed:true,voteChain:false,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
}));
const multi=(c,m,role,targets,skill)=>post(c,m,'actions',{skillId:skill,targetIds:targets.map(x=>m.byRole[x].profile.id),actionId:randomUUID(),idempotencyKey:randomUUID()},role);
const matchEvidence=(ids,voteChain)=>console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
async function vote(c,m,role,target){ok(await post(c,m,'voting-open'));if(role)ok(await post(c,m,'votes',ballot(m.byRole[target].profile.id),role));ok(await post(c,m,'voting-close'));}
async function assertPrivate(c,m){for(const u of m.users){const ev=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;assert(!ev.some(e=>['POST_ELIMINATION_CHAIN_CLOSED','VICTORY_EVALUATED','HANGING_AUTHORIZED','S15_DEEP_SECRET_PAIR_CREATED','S15_DEEP_REDIRECT_PLACED'].includes(e.eventType)));}}
test('S15 deep #85 redirect actual victim, consecutive target forbidden, durable winner',()=>durable('hypnosis',async(c,restart)=>{
 const m=await match(c,[8,25,85]);const skill=S13_SKILLS.hypnotize;
 assert.notEqual((await action(c,m,85,85,skill)).http,200);ok(await action(c,m,85,25,skill));ok(await resolve(c,m));await nextNight(c,m);
 assert.notEqual((await action(c,m,85,25,skill)).http,200);ok(await action(c,m,85,8,skill));ok(await resolve(c,m));await nextNight(c,m);
 ok(await action(c,m,85,25,skill));ok(await action(c,m,8,85,knight));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,85),'ALIVE');assert.deepEqual(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').map(e=>e.payload.playerId),[m.byRole[25].profile.id]);await assertPrivate(c,m);
 const d=await restart(m);await nextNight(d,m);ok(await action(d,m,8,85,knight));ok(await resolve(d,m));x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await restart(m);evidenceDeep(85,'redirect.hypnosis',skill);matchEvidence([8,25,85],false);
}));
test('S15 deep #63 redirect begins night two, unsuccessful mark free, cooldown and actual recipient',()=>durable('flag',async(c,restart)=>{
 const m=await match(c,[8,25,63,74]);const skill=S13_SKILLS.flagRedirect;
 assert.notEqual((await multi(c,m,63,[25,74],skill)).http,200);ok(await resolve(c,m));await nextNight(c,m);
 ok(await multi(c,m,63,[25,74],skill));ok(await resolve(c,m));await nextNight(c,m);assert.equal((await caps(c,m,63)).find(x=>x.skillId===skill).remainingUses,2);
 assert.notEqual((await multi(c,m,63,[25,25],skill)).http,200);ok(await multi(c,m,63,[25,74],skill));ok(await action(c,m,8,25,knight));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,74),'DEAD_FINAL');assert.equal(life(x.state,m,25),'ALIVE');assert.equal(x.state.participants.find(p=>p.currentCharacterId===63).effects.filter(e=>e.kind==='S15_DEEP_REDIRECT_USED').length,1);await assertPrivate(c,m);
 const d=await restart(m);await nextNight(d,m);assert.notEqual((await multi(d,m,63,[25,8],skill)).http,200);ok(await resolve(d,m));await nextNight(d,m);ok(await multi(d,m,63,[25,8],skill));ok(await action(d,m,8,25,knight));ok(await resolve(d,m));x=await state(d,m);assert.equal(life(x.state,m,8),'DEAD_FINAL');assert.equal(life(x.state,m,25),'ALIVE');assert.equal(x.state.participants.find(p=>p.currentCharacterId===63).effects.filter(e=>e.kind==='S15_DEEP_REDIRECT_USED').length,2);assert.equal(x.state.completed,false);await restart(m);evidenceDeep(63,'redirect.flag',skill);
}));
test('S15 deep #15 secret link once per target, vote death chain closes before sole winner',()=>durable('pair',async(c,restart)=>{
 const m=await match(c,[15,25,74]);const skill=S13_SKILLS.darkCupid;
 assert.notEqual((await multi(c,m,15,[25,25],skill)).http,200);const b={skillId:skill,targetIds:[25,74].map(x=>m.byRole[x].profile.id),actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(c,m,'actions',b,15));assert.equal((await post(c,m,'actions',b,15)).action.duplicate,true);ok(await resolve(c,m));let x=await state(c,m);assert.equal(x.state.links.length,1);assert(x.state.links[0].active);assert(x.state.participants.every(p=>p.life==='ALIVE'));await assertPrivate(c,m);
 const d=await restart(m);await vote(d,m);assert.notEqual((await action(d,m,15,25,skill)).http,200);ok(await resolve(d,m));await vote(d,m,15,25);x=await state(d,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,74),'DEAD_FINAL');assert.equal(x.state.links[0].active,false);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[15].profile.id]);assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,2);assert(x.events.findIndex(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[74].profile.id)<x.events.findIndex(e=>e.eventType==='MATCH_COMPLETED'));await assertPrivate(d,m);await restart(m);evidenceDeep(15,'secret.pair.linked-death',skill);matchEvidence([15,25,74],true);
}));
test('S15 deep #58 two other factions die, Jester killed at night does not win',()=>durable('demon-double',async(c,restart)=>{
 const m=await match(c,[25,28,58]);const skill=S13_SKILLS.demon;assert.notEqual((await multi(c,m,58,[25,25],skill)).http,200);ok(await multi(c,m,58,[25,28],skill));ok(await resolve(c,m));const x=await state(c,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,28),'DEAD_FINAL');assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[58].profile.id]);assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,2);await assertPrivate(c,m);await restart(m);evidenceDeep(58,'different.faction.two-others',skill);matchEvidence([25,28,58],false);
}));
test('S15 deep #28 hanging wins with other contenders alive, non-final trigger cannot win',()=>durable('jester',async(c,restart)=>{
 const m=await match(c,[25,28,58]);ok(await resolve(c,m));const {resolveHangingVictory}=await import('../dist/backend/src/official/victory-resolver.js');const x=await state(c,m),id=m.byRole[28].profile.id;assert.equal(resolveHangingVictory(x.state,id,{victimId:id,pendingEffects:0}).kind,'NOT_YET');await vote(c,m,25,28);const fin=await state(c,m);assert.equal(fin.state.completed,true);assert.deepEqual(fin.state.winnerIds,[id]);assert.equal(life(fin.state,m,58),'ALIVE');assert.equal(life(fin.state,m,25),'ALIVE');assert.equal(resolveHangingVictory(fin.state,id,{victimId:id,pendingEffects:1}).kind,'NOT_YET');await assertPrivate(c,m);await restart(m);evidenceDeep(28,'hanging.sole-winner','passive.28.hanged-victory');matchEvidence([25,28,58],true);
}));
test('S15 deep two-seat snow protects self, blank vote, knight wins by hanging',()=>durable('snow-two',async(c,restart)=>{
 const m=await match(c,[8,9]);ok(await action(c,m,9,9,'official.9.snow-protection'));ok(await action(c,m,8,9,knight));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,9),'ALIVE');await vote(c,m);ok(await resolve(c,m));await vote(c,m,8,9);const x=await state(c,m);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await assertPrivate(c,m);await restart(m);matchEvidence([8,9],true);
}));
test('S15 deep five-seat mixed inspection, protection, knight and Jester co-win by vote',()=>durable('five',async(c,restart)=>{
 const m=await match(c,[8,9,25,28,74]);ok(await action(c,m,9,74,'official.9.snow-protection'));ok(await action(c,m,25,8,'official.25.inspect-role'));ok(await action(c,m,74,8,'official.74.inspect-role'));ok(await action(c,m,8,74,knight));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,74),'ALIVE');await vote(c,m);
 for(const role of [9,25,74]){ok(await action(c,m,8,role,knight));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,role),'DEAD_FINAL');await vote(c,m);}
 ok(await resolve(c,m));await vote(c,m,8,28);const x=await state(c,m);assert.equal(x.state.completed,true);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[8].profile.id,m.byRole[28].profile.id]));await assertPrivate(c,m);await restart(m);matchEvidence([8,9,25,28,74],true);
}));
test('S15 deep #28 PH-02 cancelled leading ballot cannot win; actual later hanging can win',()=>durable('jester-peace',async(c,restart)=>{
 const m=await match(c,[25,28,79]);ok(await resolve(c,m));ok(await post(c,m,'voting-open'));ok(await post(c,m,'votes',ballot(m.byRole[28].profile.id),25));ok(await action(c,m,79,28,'official.79.cancel-vote-reveal'));ok(await resolve(c,m));let x=await state(c,m);assert.equal(x.state.voting.outcome.kind,'CANCELLED_NO_ELIMINATION');assert.equal(life(x.state,m,28),'ALIVE');assert.equal(x.state.completed,false);assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));assert(!x.events.some(e=>e.eventType==='PLAYER_ELIMINATED'));const d=await restart(m);ok(await resolve(d,m));ok(await post(d,m,'voting-open'));assert.notEqual((await action(d,m,79,28,'official.79.cancel-vote-reveal')).http,200);ok(await post(d,m,'votes',ballot(m.byRole[28].profile.id),25));ok(await post(d,m,'voting-close'));x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[28].profile.id,m.byRole[79].profile.id]));await assertPrivate(d,m);await restart(m);evidenceDeep(28,'cancelled.hanging.no-win','passive.28.hanged-victory');matchEvidence([25,28,79],true);
}));
test('S15 deep C boundary: knight hanging without a verified village predicate must not invent a winner',()=>durable('C-counterexample',async(c,restart)=>{
 const m=await match(c,[8,9]);ok(await resolve(c,m));await vote(c,m,9,8);const x=await state(c,m);assert.equal(life(x.state,m,8),'DEAD_FINAL');assert.equal(life(x.state,m,9),'ALIVE');assert.equal(x.state.completed,false);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));await restart(m);
}));
