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

test('Scale #64 pair replacement, no premature disclosure, day hanging and private role result',()=>durable('bell-replace',async(c,restart)=>{
 const m=await match(c,[25,48,64,74]);await checkVersion(c,m);const cap=(await caps(c,m,64)).find(k=>k.skillId===bell);assert.equal(cap.minTargets,2);assert.equal(cap.maxTargets,2);
 for(const t of [[25],[25,25],[64,25]])assert.notEqual((await choose(c,m,64,bell,t)).http,200);assert.notEqual((await choose(c,m,25,bell,[48,74])).http,200);
 const b=cmd(bell,[id(m,25),id(m,74)]);ok(await post(c,m,'actions',b,64));assert.equal((await post(c,m,'actions',b,64)).action.duplicate,true);ok(await resolve(c,m));await assertBell(c,m,[]);await vote(c,m,null,null);const d=await restart(m);ok(await choose(d,m,64,bell,[25,48]));ok(await choose(d,m,48,leader,[74]));ok(await resolve(d,m));await assertBell(d,m,[]);assert.equal((await state(d,m)).state.completed,false);await vote(d,m,25,48);const x=await state(d,m);winner(x,m,[25,64,74]);assertDeaths(x,m,[74,48]);await assertBell(d,m,['Tiên Tri']);await checkPublic(d,m);await privacy(d,m);const z=await restart(m);await assertBell(z,m,['Tiên Tri']);scaleMatch([25,48,64,74],true);scaleEvidence(64,bell);
}));
test('Scale #64 two simultaneous pack deaths reveal both once before victory',()=>durable('bell-double',async(c,restart)=>{
 const m=await match(c,[25,48,64,74]);ok(await choose(c,m,64,bell,[25,74]));ok(await choose(c,m,48,leader,[25,74]));const d=await restart(m);ok(await resolve(d,m));const x=await state(d,m);winner(x,m,[48]);assertDeaths(x,m,[25,74]);await assertBell(d,m,['Tiên Tri','Tiên Tri Huyền Bí']);assert(x.events.findIndex(e=>e.eventType==='S15_SCALE_BELL_OBSERVED')<x.events.findIndex(e=>e.eventType==='MATCH_COMPLETED'));await privacy(d,m);await restart(m);scaleMatch([25,48,64,74],false);scaleEvidence(64,bell);
}));
test('Scale #64 first marked death freezes pair; no second information or selection',()=>durable('bell-single',async(c,restart)=>{
 const m=await match(c,[25,48,64,74]);ok(await choose(c,m,64,bell,[25,74]));ok(await choose(c,m,48,leader,[25]));ok(await resolve(c,m));await assertBell(c,m,['Tiên Tri Huyền Bí']);await vote(c,m,null,null);const d=await restart(m);assert.equal((await caps(d,m,64)).find(k=>k.skillId===bell).available,false);assert.notEqual((await choose(d,m,64,bell,[48,74])).http,200);ok(await choose(d,m,48,leader,[74]));ok(await resolve(d,m));winner(await state(d,m),m,[48]);await assertBell(d,m,['Tiên Tri Huyền Bí']);await privacy(d,m);await restart(m);
}));
test('Scale leader double bite respects Snow Angel, independent victims, then Village co-wins',()=>durable('pack-snow',async(c,restart)=>{
 const m=await match(c,[9,25,48,74]);ok(await choose(c,m,9,snow,[25]));ok(await choose(c,m,48,leader,[25,74]));ok(await resolve(c,m));let x=await state(c,m);assert.equal(life(x.state,m,25),'ALIVE');assertDeaths(x,m,[74]);assert.equal(x.events.filter(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED').length,1);assert.equal(x.state.completed,false);await vote(c,m,25,48);x=await state(c,m);winner(x,m,[9,25,74]);await privacy(c,m);await checkPublic(c,m);await restart(m);scaleMatch([9,25,48,74],true);
}));
test('Scale leader protection precedes preliminary death and rescue; no protected victim in private list',()=>durable('pack-rescue',async(c,restart)=>{
 const m=await match(c,[9,25,48,74,87]);ok(await choose(c,m,9,snow,[25]));ok(await choose(c,m,48,leader,[25,74]));ok(await resolve(c,m));let x=await state(c,m);assert.equal(x.state.phase,'WITCH_WINDOW');assert.equal(life(x.state,m,25),'ALIVE');assert.equal(life(x.state,m,74),'PENDING_DEATH');assertDeaths(x,m,[]);const notice=(await eventList(c,m,87)).find(e=>e.eventType==='S15_FINAL_PHARMACIST_PRELIMINARY');assert.deepEqual(notice.payload.playerIds,[id(m,74)]);for(const r of [9,25,48,74])assert(!(await eventList(c,m,r)).some(e=>e.eventType==='S15_FINAL_PHARMACIST_PRELIMINARY'));
 assert.notEqual((await choose(c,m,87,rescue,[25])).http,200);const d=await restart(m);const b=cmd(rescue,[id(m,74)]);ok(await post(d,m,'actions',b,87));assert.equal((await post(d,m,'actions',b,87)).action.duplicate,true);ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[]);assert.equal(life(x.state,m,74),'ALIVE');await vote(d,m,null,null);
 ok(await choose(d,m,48,leader,[25,74]));ok(await resolve(d,m));assert.equal((await caps(d,m,87)).find(k=>k.skillId===rescue).available,false);assert.notEqual((await choose(d,m,87,rescue,[74])).http,200);ok(await resolve(d,m));x=await state(d,m);assertDeaths(x,m,[25,74].sort((a,b)=>x.state.participants.findIndex(p=>p.playerId===id(m,a))-x.state.participants.findIndex(p=>p.playerId===id(m,b))));await vote(d,m,9,48);x=await state(d,m);winner(x,m,[9,25,74,87]);await privacy(d,m);await restart(m);scaleMatch([9,25,48,74,87],true);
}));
// New QA certification candidate #8/#74: all terminal ballot combinations,
// both night branches, optional inspection, private exact-role and durable replay.
test('Scale QA [8,74] sixteen final ballots and valid terminal or next-round results',async()=>{
 for(const a of [null,'',8,74])for(const b of [null,'',8,74])await durable('mystic-ballots',async(c,restart)=>{
 const m=await match(c,[8,74]);ok(await resolve(c,m));ok(await post(c,m,'voting-open'));for(const [r,t] of [[8,a],[74,b]])if(t!==null)ok(await post(c,m,'votes',ballot(t===''?'':id(m,t)),r));ok(await post(c,m,'voting-close'));const x=await state(c,m);const n8=[a,b].filter(t=>t===8).length,n74=[a,b].filter(t=>t===74).length;if(n8!==n74){winner(x,m,[n8>n74?74:8]);assertDeaths(x,m,[n8>n74?8:74]);}else{assert.equal(x.state.phase,'NIGHT_COLLECT');assert.equal(x.state.completed,false);assertDeaths(x,m,[]);}await privacy(c,m);await checkReplay(c,m);
 });
});
test('Scale QA [8,74] inspection, abstain, retry, vote change, restart and Village victory',()=>durable('mystic-vote',async(c,restart)=>{
 const m=await match(c,[8,74]);const skill='official.74.inspect-role';assert.notEqual((await action(c,m,74,74,skill)).http,200);assert.notEqual((await action(c,m,8,8,knight)).http,200);assert.notEqual((await post(c,m,'votes',ballot(id(m,8)),74)).http,200);const b=cmd(skill,[id(m,8)]);ok(await post(c,m,'actions',b,74));assert.equal((await post(c,m,'actions',b,74)).action.duplicate,true);ok(await resolve(c,m));const r=(await eventList(c,m,74)).filter(e=>e.eventType==='ROLE_OBSERVED');assert.equal(r.length,1);assert.equal(r[0].payload.characterId,8);assert.equal((await eventList(c,m,8)).filter(e=>e.eventType==='ROLE_OBSERVED').length,0);await vote(c,m,null,null);const d=await restart(m);ok(await resolve(d,m));ok(await post(d,m,'voting-open'));const blank=ballot();ok(await post(d,m,'votes',blank,74));assert.equal((await post(d,m,'votes',blank,74)).vote.duplicate,true);ok(await post(d,m,'votes',{...ballot(id(m,8)),expectedRevision:(await state(d,m)).state.revision},74));ok(await post(d,m,'voting-close'));winner(await state(d,m),m,[74]);assert.notEqual((await action(d,m,74,8,skill)).http,200);await privacy(d,m);await restart(m);scaleMatch([8,74],true);
}));
test('Scale QA [8,74] independent optional inspection on fatal night, both orders, exact-role privacy',async()=>{
 for(const inspect of [false,true])for(const attackFirst of [false,true])await durable('mystic-kill',async(c,restart)=>{
 const m=await match(c,[8,74]);if(attackFirst)ok(await action(c,m,8,74,knight));if(inspect)ok(await action(c,m,74,8,'official.74.inspect-role'));if(!attackFirst)ok(await action(c,m,8,74,knight));const d=await restart(m);ok(await resolve(d,m));winner(await state(d,m),m,[8]);assert.equal((await eventList(d,m,74)).filter(e=>e.eventType==='ROLE_OBSERVED').length,inspect?1:0);assert.equal((await eventList(d,m,8)).filter(e=>e.eventType==='ROLE_OBSERVED').length,0);assert.notEqual((await action(d,m,8,74,knight)).http,200);await privacy(d,m);await restart(m);scaleMatch([8,74],false);
 });
});
// Official QA rooms are gated by the explicit test-mode setting. No normal-room start.
test('Scale production room cannot start an official QA composition without test mode',async()=>{
 const store=new SqliteMultiplayerStore(':memory:'),app=createMultiplayerServer(store,{officialRuleTestMode:false});const port=await app.start();const base=`http://127.0.0.1:${port}`;let token;try{const call=async(method,path,body)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});return {http:r.status,...await r.json()};};const username='scale'+randomUUID().replaceAll('-','').slice(0,12);assert.equal((await call('POST','/api/auth/register',{username,password:'S13Strong2026Pass!'})).http,201);token=(await call('POST','/api/auth/login',{username,password:'S13Strong2026Pass!'})).token;const room=(await call('POST','/api/rooms',{name:'QA gating',capacity:2})).room;const r=await call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25],idempotencyKey:randomUUID()});assert.equal(r.http,409);assert.match(JSON.stringify(r),/WV_OFFICIAL_RULE_TEST_MODE/);}finally{await app.close();}
});
