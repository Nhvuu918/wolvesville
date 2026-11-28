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

const stone=S13_SKILLS.stoneProtection,effigy=S13_SKILLS.effigy;
const ev=(id,branch,skill)=>console.log('S15_BREAK_EVIDENCE '+JSON.stringify({id,branch,skill,restart:true,replay:true,privacy:true}));
const matchEv=(ids,voteChain)=>console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
async function doVote(c,m,role,target){ok(await post(c,m,'voting-open'));if(role)ok(await post(c,m,'votes',ballot(m.byRole[target].profile.id),role));ok(await post(c,m,'voting-close'));}
async function privateBreak(c,m,owner){for(const [role,u] of Object.entries(m.byRole)){const events=(await eventList(c,m,Number(role)));assert(!events.some(e=>['S15_BREAK_HANGING_PREVENTED','S15_BREAK_STONE_PLACED','S15_BREAK_EFFIGY_PLACED'].includes(e.eventType)));if(Number(role)!==owner)assert(!events.some(e=>['S15_BREAK_STONE_SPENT','S15_BREAK_ALIGNMENT_CHANGED'].includes(e.eventType)));}}
const pstate=(s,m,id)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id);
test('S15 breakthrough #55 protects #28 from actual hanging once; later true hanging and wolf parity co-win',()=>durable('stone-jester',async(c,restart)=>{
 const m=await match(c,[25,28,55]);assert.notEqual((await action(c,m,25,28,stone)).http,200);
 const body={skillId:stone,targetIds:[m.byRole[28].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(c,m,'actions',body,55));assert.equal((await post(c,m,'actions',body,55)).action.duplicate,true);assert.notEqual((await action(c,m,55,25,stone)).http,200);
 ok(await resolve(c,m));await doVote(c,m,25,28);let x=await state(c,m);assert.equal(x.state.voting.outcome.kind,'NO_HANGING_IMMUNE');assert.equal(x.state.voting.outcome.noElimination,true);assert.equal(life(x.state,m,28),'ALIVE');assert.equal(x.state.completed,false);assert(!x.events.some(e=>e.eventType==='PLAYER_ELIMINATED'||e.eventType==='MATCH_COMPLETED'));assert.equal(pstate(x.state,m,55).effects.filter(e=>e.kind==='S15_BREAK_STONE_SPENT').length,1);assert.equal(x.state.voting.officialAudit.counts[0].count,1);await privateBreak(c,m,55);
 const d=await restart(m);assert.equal((await caps(d,m,55)).find(x=>x.skillId===stone).available,false);assert.notEqual((await action(d,m,55,28,stone)).http,200);const v=(await d.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[55].token)).game;assert.equal(v.players.find(p=>p.self).self.roleNameOverride,'Sói thường');ok(await resolve(d,m));await doVote(d,m,25,28);x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[28].profile.id,m.byRole[55].profile.id]));await privateBreak(d,m,55);await restart(m);ev(55,'stone.hanging.protect.once',stone);matchEv([25,28,55],true);
}));
test('S15 breakthrough #8 hanging immunity with wolf alive, no fallback candidate, later knight victory',()=>durable('knight-immunity',async(c,restart)=>{
 const m=await match(c,[8,25,55]);ok(await resolve(c,m));await doVote(c,m,25,8);let x=await state(c,m);assert.equal(x.state.voting.outcome.kind,'NO_HANGING_IMMUNE');assert.equal(life(x.state,m,8),'ALIVE');assert(!x.events.some(e=>e.eventType==='PLAYER_ELIMINATED'||e.eventType==='MATCH_COMPLETED'));const d=await restart(m);ok(await resolve(d,m));await doVote(d,m,25,55);x=await state(d,m);assert.equal(life(x.state,m,55),'DEAD_FINAL');assert.equal(x.state.phase,'NIGHT_COLLECT');ok(await action(d,m,8,25,knight));ok(await resolve(d,m));x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[8].profile.id]);await privateBreak(d,m,8);await restart(m);ev(8,'hanging.immune.while.wolf','passive.8.hanging-immunity');matchEv([8,25,55],true);
}));
test('S15 breakthrough #55 cannot prevent solo night kill; untriggered mark expires for hanging and remains usable',()=>durable('stone-expiry',async(c,restart)=>{
 const m=await match(c,[8,25,28,55]);ok(await action(c,m,55,25,stone));ok(await action(c,m,8,25,knight));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert(!pstate(x.state,m,55).effects.some(e=>e.kind==='S15_BREAK_STONE_SPENT'));await doVote(c,m,null,null);ok(await action(c,m,55,28,stone));ok(await resolve(c,m));await doVote(c,m,null,null);ok(await resolve(c,m));await doVote(c,m,8,28);x=await state(c,m);assert.equal(life(x.state,m,28),'DEAD_FINAL');assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);await privateBreak(c,m,55);await restart(m);ev(55,'stone.untriggered.expiration.and.solo',stone);matchEv([8,25,28,55],true);
}));
test('S15 breakthrough #94 redirect to actual victim, private alignment transition on subsequent #94 death',()=>durable('effigy',async(c,restart)=>{
 const m=await match(c,[8,25,93,94]);assert.notEqual((await action(c,m,25,93,effigy)).http,200);ok(await action(c,m,94,25,effigy));ok(await action(c,m,8,93,knight));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,93),'ALIVE');assert.equal(pstate(x.state,m,93).currentFaction,'phe3');assert.deepEqual(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').map(e=>e.payload.playerId),[m.byRole[25].profile.id]);await privateBreak(c,m,94);const d=await restart(m);await doVote(d,m,null,null);ok(await action(d,m,8,94,knight));ok(await resolve(d,m));x=await state(d,m);assert.equal(pstate(x.state,m,93).initialFaction,'phe3');assert.equal(pstate(x.state,m,93).currentFaction,'soi');assert.equal(pstate(x.state,m,93).currentCharacterId,93);assert.equal(x.state.completed,false);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert.equal(x.events.filter(e=>e.eventType==='S15_BREAK_ALIGNMENT_CHANGED').length,1);await privateBreak(d,m,93);await restart(m);ev(94,'effigy.redirect',effigy);ev(93,'alignment.after.partner.death','passive.93.alignment');
}));
test('S15 breakthrough #94 self effigy converts #93 before victory, identity effigy never creates duplicate death',()=>durable('effigy-edge',async(c,restart)=>{
 let m=await match(c,[8,25,93,94]);ok(await action(c,m,94,94,effigy));ok(await action(c,m,8,93,knight));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,94),'DEAD_FINAL');assert.equal(life(x.state,m,93),'ALIVE');assert.equal(pstate(x.state,m,93).currentFaction,'soi');assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');await privateBreak(c,m,93);let d=await restart(m);m=await match(d,[8,25,93,94]);ok(await action(d,m,94,93,effigy));ok(await action(d,m,8,93,knight));ok(await resolve(d,m));x=await state(d,m);assert.equal(life(x.state,m,93),'DEAD_FINAL');assert.equal(life(x.state,m,94),'ALIVE');assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);assert(!x.events.some(e=>e.eventType==='S15_BREAK_ALIGNMENT_CHANGED'));await privateBreak(d,m,94);await restart(m);ev(94,'effigy.identity.and.self',effigy);
}));
test('S15 breakthrough #28 linked death is not hanging; only actual hanging earns co-win',()=>durable('jester-linked-death',async(c,restart)=>{
 for(const target of [25,28]){
  const m=await match(c,[15,25,28]);ok(await post(c,m,'actions',{skillId:S13_SKILLS.darkCupid,targetIds:[m.byRole[25].profile.id,m.byRole[28].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()},15));ok(await resolve(c,m));await doVote(c,m,15,target);const x=await state(c,m);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,28),'DEAD_FINAL');assert.equal(x.state.completed,true);assert.deepEqual(new Set(x.state.winnerIds),new Set([m.byRole[15].profile.id,...(target===28?[m.byRole[28].profile.id]:[])]));assert.equal(x.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,2);for(const id of [25,28])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S15_DEEP_SECRET_PAIR_CREATED'));c=await restart(m);
 }
 ev(28,'linked.death.not.hanging','passive.28.hanged-victory');matchEv([15,25,28],true);
}));
test('S15 breakthrough #19 anonymous ballot contract uses final valid ballot; #28 survives fulfilled contract then wins by real hanging',()=>durable('ballot-contract',async(c,restart)=>{
 const m=await match(c,[19,25,28]);const offer={skillId:S13_SKILLS.contractOffer,targetIds:[m.byRole[28].profile.id,m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};const offered=await post(c,m,'actions',offer,19);ok(offered);assert(!('privateRefreshIds' in offered.action));assert.equal((await post(c,m,'actions',offer,19)).action.duplicate,true);assert.notEqual((await post(c,m,'actions',{...offer,actionId:randomUUID(),idempotencyKey:randomUUID()},19)).http,200);
 const invite=(await eventList(c,m,28)).find(e=>e.eventType==='S15_BREAK_BALLOT_OFFER');assert.equal(invite.payload.targetId,m.byRole[25].profile.id);assert(!invite.actorId&&!invite.payload.sourceId);assert(!(await eventList(c,m,25)).some(e=>e.eventType==='S15_BREAK_BALLOT_OFFER'));assert((await caps(c,m,28)).some(x=>x.skillId===S13_SKILLS.contractAccept&&x.available));
 const accept={skillId:S13_SKILLS.contractAccept,targetIds:[],actionId:randomUUID(),idempotencyKey:randomUUID()};assert.notEqual((await post(c,m,'actions',accept,25)).http,200);ok(await post(c,m,'actions',accept,28));assert.equal((await post(c,m,'actions',accept,28)).action.duplicate,true);assert.notEqual((await post(c,m,'actions',{...accept,skillId:S13_SKILLS.contractDecline,actionId:randomUUID(),idempotencyKey:randomUUID()},28)).http,200);
 const d=await restart(m);ok(await resolve(d,m));ok(await post(d,m,'voting-open'));ok(await post(d,m,'votes',ballot(m.byRole[28].profile.id),19));ok(await post(d,m,'votes',ballot(m.byRole[28].profile.id),25));ok(await post(d,m,'votes',ballot(m.byRole[19].profile.id),28));ok(await post(d,m,'votes',{...ballot(m.byRole[25].profile.id),expectedRevision:(await state(d,m)).state.revision},28));ok(await post(d,m,'voting-close'));let x=await state(d,m);assert.equal(x.state.voting.outcome.kind,'NO_HANGING_IMMUNE');assert.equal(life(x.state,m,28),'ALIVE');assert(!x.state.completed);assert((await eventList(d,m,19)).some(e=>e.eventType==='S15_BREAK_BALLOT_SETTLED'&&e.payload.status==='FULFILLED'));assert(!(await eventList(d,m,25)).some(e=>e.eventType.startsWith('S15_BREAK_BALLOT_')));ok(await resolve(d,m));await doVote(d,m,25,28);x=await state(d,m);assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);await restart(m);ev(19,'ballot.contract.accept.fulfilled',S13_SKILLS.contractOffer);matchEv([19,25,28],true);
}));
test('S15 breakthrough #19 declined or breached contract cannot prevent true hanging',()=>durable('contract-negative',async(c,restart)=>{
 for(const mode of ['decline','breach']){const m=await match(c,[19,25,28]);ok(await post(c,m,'actions',{skillId:S13_SKILLS.contractOffer,targetIds:[m.byRole[28].profile.id,m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()},19));ok(await post(c,m,'actions',{skillId:mode==='decline'?S13_SKILLS.contractDecline:S13_SKILLS.contractAccept,targetIds:[],actionId:randomUUID(),idempotencyKey:randomUUID()},28));ok(await resolve(c,m));ok(await post(c,m,'voting-open'));for(const r of [19,25])ok(await post(c,m,'votes',ballot(m.byRole[28].profile.id),r));ok(await post(c,m,'votes',ballot(m.byRole[19].profile.id),28));ok(await post(c,m,'voting-close'));const x=await state(c,m);assert.equal(x.state.voting.outcome.kind,'HANGING_COMPLETED');assert.equal(x.state.completed,true);assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);assert(!(await eventList(c,m,25)).some(e=>e.eventType.startsWith('S15_BREAK_BALLOT_')));if(mode==='breach')assert((await eventList(c,m,19)).some(e=>e.eventType==='S15_BREAK_BALLOT_SETTLED'&&e.payload.status==='BREACHED'));c=await restart(m);}
 ev(19,'ballot.contract.declined.or.breached',S13_SKILLS.contractOffer);
}));
test('S15 breakthrough #37 swaps aura and actual hanging victim, never grants victory on selected-but-not-killed #28',()=>durable('swap-hang',async(c,restart)=>{
 for(const selected of [25,28]){const m=await match(c,[25,28,37]);ok(await post(c,m,'actions',{skillId:S13_SKILLS.swap,targetIds:[m.byRole[28].profile.id,m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()},37));ok(await action(c,m,25,28,'official.25.inspect-role'));ok(await resolve(c,m));assert.equal((await privateAura(c,m)).at(-1).payload.verdict,'Thiện');await doVote(c,m,37,selected);let x=await state(c,m);const actual=selected===25?28:25;assert.equal(life(x.state,m,actual),'DEAD_FINAL');assert.equal(life(x.state,m,selected),'ALIVE');assert.equal(x.state.voting.officialAudit.counts[0].targetId,m.byRole[selected].profile.id);assert.equal(x.state.voting.outcome.targetId,m.byRole[actual].profile.id);assert.equal(x.state.completed,actual===28);for(const r of [25,28,37])assert(!(await eventList(c,m,r)).some(e=>e.eventType==='S15_BREAK_HANGING_REDIRECTED'));c=await restart(m);if(actual===25){ok(await resolve(c,m));await doVote(c,m,37,28);x=await state(c,m);assert.equal(x.state.completed,true);}assert.deepEqual(x.state.winnerIds,[m.byRole[28].profile.id]);c=await restart(m);}
 ev(37,'swap.aura.and.hanging',S13_SKILLS.swap);matchEv([25,28,37],true);
}));
