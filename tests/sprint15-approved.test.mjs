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
test('QD01 [8,25] Village victory after valid hanging; no vote, tie, retry, change, phase, privacy, replay',()=>durable('village',async(c,restart)=>{
 const m=await match(c,[8,25]);await checkVersion(c,m);await checkPublic(c,m);assert.notEqual((await action(c,m,25,25,'official.25.inspect-role')).http,200);assert.notEqual((await post(c,m,'votes',ballot(id(m,8)),25)).http,200);
 ok(await action(c,m,25,8,'official.25.inspect-role'));assert.notEqual((await action(c,m,25,8,'official.25.inspect-role')).http,200);ok(await resolve(c,m));assert.equal((await privateAura(c,m)).at(-1).payload.verdict,'Không xác định');assert.equal((await eventList(c,m,8)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,0);
 await vote(c,m,null,null);assert.equal((await state(c,m)).state.round,2);ok(await resolve(c,m));ok(await post(c,m,'voting-open'));ok(await post(c,m,'votes',ballot(id(m,25)),8));ok(await post(c,m,'votes',ballot(id(m,8)),25));ok(await post(c,m,'voting-close'));assert.equal((await state(c,m)).state.round,3);
 const d=await restart(m);ok(await resolve(d,m));ok(await post(d,m,'voting-open'));const b=ballot();ok(await post(d,m,'votes',b,25));assert.equal((await post(d,m,'votes',b,25)).vote.duplicate,true);const rev=(await state(d,m)).state.revision;ok(await post(d,m,'votes',{...ballot(id(m,8)),expectedRevision:rev},25));ok(await post(d,m,'voting-close'));const x=await state(d,m);winner(x,m,[25]);assertDeaths(x,m,[8]);await checkPublic(d,m);await privacy(d,m);assert.notEqual((await action(d,m,8,25,knight)).http,200);await restart(m);matchProof([8,25],true);
}));
test('QD01 [8,25] knight night victory with seer action before death; both choices private',()=>durable('knight-night',async(c,restart)=>{
 const m=await match(c,[8,25]);assert.notEqual((await action(c,m,8,8,knight)).http,200);ok(await action(c,m,25,8,'official.25.inspect-role'));ok(await action(c,m,8,25,knight));assert.notEqual((await action(c,m,8,25,knight)).http,200);ok(await resolve(c,m));const x=await state(c,m);winner(x,m,[8]);assertDeaths(x,m,[25]);assert.equal((await privateAura(c,m)).length,1);await privacy(c,m);await restart(m);matchProof([8,25],false);
}));
test('QD01 [8,25] Knight wins by hanging, Village cannot win with contender alive',()=>durable('knight-hang',async(c,restart)=>{
 const m=await match(c,[8,25]);ok(await resolve(c,m));assert.equal((await state(c,m)).state.completed,false);await vote(c,m,8,25);const x=await state(c,m);winner(x,m,[8]);await privacy(c,m);await restart(m);matchProof([8,25],true);
}));
test('QD01 dead Village teammate wins by current faction; opposite direction [8,9,25]',()=>durable('dead-villager',async(c,restart)=>{
 const m=await match(c,[8,9,25]);ok(await action(c,m,8,25,knight));ok(await resolve(c,m));assert.equal((await state(c,m)).state.completed,false);await vote(c,m,9,8);const x=await state(c,m);winner(x,m,[9,25]);assertDeaths(x,m,[25,8]);await privacy(c,m);await restart(m);matchProof([8,9,25],true);
}));
test('QD02 wrong alignment consumes revenge without disclosure or retry; Village and Jester co-win',()=>durable('wrong-revenge',async(c,restart)=>{
 const m=await match(c,[25,28,33,74]);ok(await resolve(c,m));await vote(c,m,25,33);let x=await state(c,m);assert.equal(x.state.resolutionGate.status,'PENDING_EFFECT');assert(!(await caps(c,m,33)).find(k=>k.skillId===REV).eligibleTargetIds);assert.notEqual((await action(c,m,25,28,REV)).http,200);const d=await restart(m);const cmd={skillId:REV,targetIds:[id(m,28)],actionId:randomUUID(),idempotencyKey:randomUUID()};const r=await post(d,m,'actions',cmd,33);ok(r);assert(!JSON.stringify(r).match(/faction|phe3|targetFaction/));assert.equal((await post(d,m,'actions',cmd,33)).action.duplicate,true);x=await state(d,m);assertDeaths(x,m,[33]);assert.equal(x.state.phase,'NIGHT_COLLECT');assert.equal(x.state.completed,false);assert.notEqual((await action(d,m,33,25,REV)).http,200);assert(!(await eventList(d,m,33)).some(e=>JSON.stringify(e.payload).match(/phe3|wrong.alignment/i)));await checkPublic(d,m);ok(await resolve(d,m));await vote(d,m,25,28);x=await state(d,m);winner(x,m,[25,74,28]);await privacy(d,m);await restart(m);matchProof([25,28,33,74],true);
}));
test('QD02 valid revenge after hanging, Hunter follow completes before dead Village teammates win',()=>durable('valid-revenge',async(c,restart)=>{
 const m=await match(c,[25,33,74,88]);ok(await action(c,m,88,25,mark));ok(await resolve(c,m));await vote(c,m,74,33);let x=await state(c,m);assert.equal(x.state.resolutionGate.status,'PENDING_EFFECT');assert(!x.events.some(e=>e.eventType==='MATCH_COMPLETED'));const d=await restart(m);ok(await action(d,m,33,88,REV));x=await state(d,m);winner(x,m,[25,74,88]);assertDeaths(x,m,[33,88,25]);await privacy(d,m);await restart(m);matchProof([25,33,74,88],true);
}));
test('QD03 pin expires at next night before no-repin death, replay and retry',()=>durable('pin-expiry',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));const a=await state(c,m);assert.equal(a.state.participants.find(p=>p.playerId===id(m,88)).effects.find(e=>e.kind==='S14_DEATH_MARK').payload.expirationRound,2);await vote(c,m,null,null);const d=await restart(m);assert(!((await state(d,m)).state.participants.find(p=>p.playerId===id(m,88)).effects.some(e=>e.kind==='S14_DEATH_MARK')));ok(await action(d,m,8,88,knight));ok(await resolve(d,m));const x=await state(d,m);assertDeaths(x,m,[88]);assert.equal(life(x.state,m,28),'ALIVE');await vote(d,m,9,8);const y=await state(d,m);assert.equal(y.state.completed,false);await privacy(d,m);await restart(m);
}));
test('QD03 pin reselect same target or change target, daytime follow still valid',()=>durable('pin-reselect',async(c,restart)=>{
 const m=await match(c,[8,9,28,88]);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,null,null);ok(await action(c,m,88,28,mark));ok(await resolve(c,m));await vote(c,m,null,null);const d=await restart(m);ok(await action(d,m,88,8,mark));ok(await resolve(d,m));await vote(d,m,9,88);const x=await state(d,m);assertDeaths(x,m,[88,8]);assert.equal(life(x.state,m,28),'ALIVE');assert.equal(x.state.completed,false);await privacy(d,m);await restart(m);
}));
test('QD01 historical active game stays 1.3.2 after restart; old winner behavior and replay unchanged',()=>durable('old-rule',async(c,restart)=>{
 process.env.WV_ARCHIVED_RULE_REGRESSION='1';let m;try{m=await match(c,[8,9]);}finally{delete process.env.WV_ARCHIVED_RULE_REGRESSION;}
 assert.equal((await state(c,m)).state.ruleVersion,'wolvesville-official-v1.3.2');ok(await resolve(c,m));const d=await restart(m);await vote(d,m,9,8);const x=await state(d,m);assert.equal(x.state.completed,false);assert.equal(x.state.resolutionGate.status,'BLOCKED_BY_RULE');assert.equal(x.state.ruleVersion,'wolvesville-official-v1.3.2');await restart(m);
}));
const leader='official.48.pack-bite';
test('QD01 #48 two victims via shared pack, retry, target limits, authorized projection and replay',()=>durable('leader',async(c,restart)=>{
 const m=await match(c,[25,48,74]);await checkVersion(c,m);assert.equal((await caps(c,m,48)).find(k=>k.skillId===leader).maxTargets,2);assert(!(await caps(c,m,25)).some(k=>k.skillId===leader));
 const cmd=(targetIds)=>({skillId:leader,targetIds,actionId:randomUUID(),idempotencyKey:randomUUID()});for(const targets of [[id(m,25),id(m,25)],[id(m,48)],[id(m,25),id(m,74),id(m,48)]])assert.notEqual((await post(c,m,'actions',cmd(targets),48)).http,200);
 const b=cmd([id(m,25),id(m,74)]);assert.notEqual((await post(c,m,'actions',b,25)).http,200);ok(await post(c,m,'actions',b,48));assert.equal((await post(c,m,'actions',b,48)).action.duplicate,true);const d=await restart(m);ok(await resolve(d,m));const x=await state(d,m);winner(x,m,[48]);assert.equal(life(x.state,m,25),'DEAD_FINAL');assert.equal(life(x.state,m,74),'DEAD_FINAL');await privacy(d,m);await restart(m);matchProof([25,48,74],false);console.log('S15_APPROVED_EVIDENCE '+JSON.stringify({id:48,skill:leader,restart:true,replay:true,privacy:true}));
}));
test('QD01 #48 sole wolf blocks Village victory until true hanging',()=>durable('leader-village',async(c,restart)=>{
 const m=await match(c,[25,48,74]);ok(await resolve(c,m));assert.equal((await state(c,m)).state.completed,false);await vote(c,m,25,48);const x=await state(c,m);winner(x,m,[25,74]);await privacy(c,m);await restart(m);matchProof([25,48,74],true);
}));
test('QD01 direct Jester hanging with live Hunter mark yields Village and Jester co-winners',()=>durable('jester-hunter',async(c,restart)=>{
 const m=await match(c,[25,28,88]);ok(await action(c,m,88,25,mark));ok(await resolve(c,m));await vote(c,m,25,28);const x=await state(c,m);winner(x,m,[25,28,88]);assertDeaths(x,m,[28]);await privacy(c,m);await restart(m);matchProof([25,28,88],true);
}));
test('QD01 revenge skip after true hanging closes chain and Village wins',()=>durable('skip-revenge',async(c,restart)=>{
 const m=await match(c,[25,33,74,84]);ok(await resolve(c,m));await vote(c,m,25,33);const x=await state(c,m);assert.equal(x.state.resolutionGate.status,'PENDING_EFFECT');const b={skillId:'official.33.hanging-revenge-skip',targetIds:[],actionId:randomUUID(),idempotencyKey:randomUUID()};ok(await post(c,m,'actions',b,33));const y=await state(c,m);winner(y,m,[25,74,84]);assertDeaths(y,m,[33]);await privacy(c,m);await restart(m);matchProof([25,33,74,84],true);
}));
test('QD01 [8,25] all 16 final ballot combinations including self, abstention and explicit blank',async()=>{
 for(const a of [null,'',8,25])for(const b of [null,'',8,25])await durable('all-ballots',async(c,restart)=>{
  const m=await match(c,[8,25]);ok(await resolve(c,m));ok(await post(c,m,'voting-open'));for(const [r,t] of [[8,a],[25,b]])if(t!==null)ok(await post(c,m,'votes',ballot(t===''?'':id(m,t)),r));ok(await post(c,m,'voting-close'));const x=await state(c,m);const n8=[a,b].filter(t=>t===8).length,n25=[a,b].filter(t=>t===25).length;
  if(n8!==n25){winner(x,m,[n8>n25?25:8]);assertDeaths(x,m,[n8>n25?8:25]);}else{assert.equal(x.state.completed,false);assert.equal(x.state.phase,'NIGHT_COLLECT');assertDeaths(x,m,[]);}
  await privacy(c,m);await checkReplay(c,m);
 });
});
test('QD01 [8,25] night kill without inspection, terminal phase rejects actions',()=>durable('kill-only',async(c,restart)=>{
 const m=await match(c,[8,25]);ok(await action(c,m,8,25,knight));ok(await resolve(c,m));const x=await state(c,m);winner(x,m,[8]);assert.equal((await privateAura(c,m)).length,0);assert.notEqual((await action(c,m,25,8,'official.25.inspect-role')).http,200);await privacy(c,m);await restart(m);
}));
test('QD01 current alignment and pending-life counterexamples on a real session snapshot',()=>durable('predicate',async(c,restart)=>{
 const m=await match(c,[8,9,25]);const x=await state(c,m);const {evaluateApprovedVillageVictory}=await import('../dist/backend/src/official/victory-predicates.js');const {resolveCertifiedVictory}=await import('../dist/backend/src/official/victory-resolver.js');const s=structuredClone(x.state);s.phase='DAY_RESOLVE';const k=s.participants.find(p=>p.currentCharacterId===8),snow=s.participants.find(p=>p.currentCharacterId===9),seer=s.participants.find(p=>p.currentCharacterId===25);assert.equal(evaluateApprovedVillageVictory(s).length,0);k.life='DEAD_FINAL';k.publicReportedDead=true;assert.equal(evaluateApprovedVillageVictory(s).length,2);assert.notEqual(resolveCertifiedVictory(s,x.events,0).kind,'WINNER_VERIFIED');snow.currentFaction='soi';assert.equal(evaluateApprovedVillageVictory(s).length,0);snow.life='DEAD_FINAL';snow.publicReportedDead=true;assert.deepEqual(evaluateApprovedVillageVictory(s).map(p=>p.playerId),[seer.playerId]);snow.currentFaction='dan';snow.life='PENDING_REVIVAL';assert.equal(evaluateApprovedVillageVictory(s).length,0);await restart(m);
}));
