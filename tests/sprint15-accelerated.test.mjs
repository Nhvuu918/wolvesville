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

test('S15 accelerated #3 passive aura concealment does not distort exact-role #74',()=>durable('wolf-seer',async(c,restart)=>{
 const m=await match(c,[3,25,49,74]);ok(await action(c,m,25,3,'official.25.inspect-role'));ok(await action(c,m,74,3,'official.74.inspect-role'));ok(await resolve(c,m));
 const a=await privateAura(c,m);assert.equal(a.length,1);assert.equal(a[0].payload.verdict,'Thiện');assert(!('characterId' in a[0].payload));
 const exact=(await eventList(c,m,74)).filter(e=>e.eventType==='ROLE_OBSERVED');assert.equal(exact.length,1);assert.equal(exact[0].payload.characterId,3);
 assert(!(await eventList(c,m,3)).some(e=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(e.eventType)));assert(!(await eventList(c,m,25)).some(e=>e.eventType==='ROLE_OBSERVED'));
 const d=await restart(m);assert.deepEqual(await privateAura(d,m),a);assert.deepEqual((await eventList(d,m,74)).filter(e=>e.eventType==='ROLE_OBSERVED'),exact);
 emit(3,'passive.false-aura','passive.3.seer-aura');
}));

test('S15 accelerated #29 poison consumes one use; death closure, private actor and replay',()=>durable('witch',async(c,restart)=>{
 const m=await match(c,[25,29]),skill=S13_SKILLS.witchPoison;assert.equal((await caps(c,m,29)).find(x=>x.skillId===skill).remainingUses,1);
 assert.equal((await action(c,m,29,25,skill)).error.code,'OUT_OF_PHASE');ok(await resolve(c,m));assert.equal((await state(c,m)).state.phase,'WITCH_WINDOW');assert.notEqual((await action(c,m,29,29,skill)).http,200);
 const body={skillId:skill,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await post(c,m,'actions',body,29));assert.equal((await post(c,m,'actions',body,29)).action.duplicate,true);
 assert.notEqual((await action(c,m,29,25,skill)).http,200);ok(await resolve(c,m));const old=await state(c,m);
 assert.equal(life(old.state,m,25),'DEAD_FINAL');assert.equal(uses(old.state,m,29,skill),1);assert.equal(old.state.completed,false);
 assert(old.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[25].profile.id&&e.payload.pendingEffects===0));
 for(const id of [25,29]){const ev=await eventList(c,m,id);const deaths=ev.filter(e=>e.eventType==='PLAYER_ELIMINATED');assert.equal(deaths.length,1);assert.equal(deaths[0].actorId,undefined);assert.deepEqual(deaths[0].payload,{playerId:m.byRole[25].profile.id});assert(!ev.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'));}
 assert.equal((await caps(c,m,29)).find(x=>x.skillId===skill).remainingUses,0);assert.notEqual((await action(c,m,29,25,skill)).http,200);
 const d=await restart(m);assert.equal((await caps(d,m,29)).find(x=>x.skillId===skill).remainingUses,0);emit(29,'poison.lethal-once',skill);
}));

test('S15 accelerated #93 seal and #94 passive concealment, lock expiry and vote/chat enforcement',()=>durable('exile',async(c,restart)=>{
 const m=await match(c,[25,93,94]),skill=S13_SKILLS.exile,body={skillId:skill,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await action(c,m,25,93,'official.25.inspect-role'));ok(await post(c,m,'actions',body,93));assert.equal((await post(c,m,'actions',body,93)).action.duplicate,true);
 ok(await resolve(c,m));assert.equal((await privateAura(c,m)).length,0);assert.equal(uses((await state(c,m)).state,m,93,skill),1);
 assert((await eventList(c,m,25)).some(e=>e.eventType==='SKILL_LOCK_NOTICE'));assert(!(await eventList(c,m,94)).some(e=>e.eventType==='SKILL_LOCK_NOTICE'||e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));
 assert.equal((await post(c,m,'chat',{text:'blocked',messageId:randomUUID()},25)).error.code,'UNAUTHORIZED');ok(await post(c,m,'chat',{text:'allowed',messageId:randomUUID()},94));
 ok(await post(c,m,'voting-open'));assert.equal((await post(c,m,'votes',ballot(),25)).error.code,'UNAUTHORIZED');ok(await post(c,m,'votes',ballot(),94));
 const d=await restart(m);assert.equal((await post(d,m,'votes',ballot(),25)).error.code,'UNAUTHORIZED');ok(await post(d,m,'voting-close'));ok(await action(d,m,25,93,'official.25.inspect-role'));ok(await resolve(d,m));
 const a=await privateAura(d,m);assert.equal(a.length,1);assert.equal(a[0].payload.verdict,'Thiện');assert(!('characterId' in a[0].payload));assert(!(await eventList(d,m,93)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));
 ok(await post(d,m,'chat',{text:'unmuted',messageId:randomUUID()},25));ok(await post(d,m,'voting-open'));ok(await post(d,m,'votes',ballot(),25));ok(await post(d,m,'voting-close'));
 await checkReplay(d,m);emit(93,'seal.night-chat-vote',skill);emit(94,'passive.conceal-living','passive.94.conceal-aura');
}));

for(const ids of [[8,74],[8,9,74],[8,25,28,74],[8,9,25,74],[8,9,28,74]])test(`S15 accelerated match ${ids}`,()=>durable('match',async(c,restart)=>{
 const m=await match(c,ids),victim=ids.includes(28)?28:74;
 const others=ids.filter(x=>x!==8&&x!==victim);
 if(ids.includes(9)){ok(await action(c,m,9,74,'official.9.snow-protection'));ok(await action(c,m,8,74,'official.8.night-kill'));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,74),'ALIVE');ok(await post(c,m,'voting-open'));ok(await post(c,m,'voting-close'));}
 for(const role of others){if(life((await state(c,m)).state,m,role)!=='ALIVE')continue;
  if(life((await state(c,m)).state,m,74)==='ALIVE')ok(await action(c,m,74,8,'official.74.inspect-role'));
  ok(await action(c,m,8,role,'official.8.night-kill'));ok(await resolve(c,m));assert.equal(life((await state(c,m)).state,m,role),'DEAD_FINAL');ok(await post(c,m,'voting-open'));ok(await post(c,m,'voting-close'));
 }
 ok(await resolve(c,m));ok(await post(c,m,'voting-open'));const b=ballot(m.byRole[victim].profile.id);ok(await post(c,m,'votes',b,8));assert.equal((await post(c,m,'votes',b,8)).vote.duplicate,true);ok(await post(c,m,'voting-close'));
 const old=await state(c,m);assert.equal(old.state.completed,true);assert.deepEqual(new Set(old.state.winnerIds),new Set([m.byRole[8].profile.id,...(victim===28?[m.byRole[28].profile.id]:[])]));assert.equal(old.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);assert(old.events.some(e=>e.eventType==='OFFICIAL_VOTE_RESULT'&&e.payload.outcome==='HANGING_COMPLETED'));assert(old.events.some(e=>e.eventType==='VICTORY_EVALUATED'));
 for(const id of ids){const ev=await eventList(c,m,id);assert(!ev.some(e=>['HANGING_AUTHORIZED','VICTORY_EVALUATED','POST_ELIMINATION_CHAIN_CLOSED'].includes(e.eventType)));if(id!==74)assert(!ev.some(e=>e.eventType==='ROLE_OBSERVED'));}
 await restart(m);console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain:true,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
}));

test('S15 #29 poison versus #67 shield: VH60 charges even when valid shield absorbs',()=>durable('witch-shield',async(c,restart)=>{
 const m=await match(c,[25,29,67]);ok(await action(c,m,67,25,S13_SKILLS.smith));ok(await resolve(c,m));assert.equal((await state(c,m)).state.phase,'WITCH_WINDOW');
 ok(await action(c,m,29,25,S13_SKILLS.witchPoison));ok(await resolve(c,m));const old=await state(c,m);assert.equal(life(old.state,m,25),'ALIVE');assert.equal(uses(old.state,m,29,S13_SKILLS.witchPoison),1);assert.equal(uses(old.state,m,67,S13_SKILLS.smith),1);assert(!old.state.participants.find(p=>p.currentCharacterId===25).effects.some(e=>e.kind===S13_STATUS.smith));assert(old.events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));assert(!(await eventList(c,m,25)).some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));
 await restart(m);emit(29,'poison.valid-shield-consumes',S13_SKILLS.witchPoison);
}));

test('S15 #71 persistent disguise on living target changes aura only, next night still active',()=>durable('portrait',async(c,restart)=>{
 const m=await match(c,[25,71,84]);ok(await action(c,m,25,84,'official.25.inspect-role'));ok(await action(c,m,71,84,S13_SKILLS.portrait));ok(await resolve(c,m));let a=await privateAura(c,m);assert.equal(a.at(-1).payload.verdict,'Không xác định');assert(!('characterId' in a.at(-1).payload));assert(!(await eventList(c,m,84)).some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));
 const d=await restart(m);await nextNight(d,m);ok(await action(d,m,25,84,'official.25.inspect-role'));ok(await resolve(d,m));a=await privateAura(d,m);assert.equal(a.length,2);assert.equal(a.at(-1).payload.verdict,'Không xác định');await checkReplay(d,m);emit(71,'persistent.aura-disguise',S13_SKILLS.portrait);
}));
test('S15 #15 single-target lethal branch commits official sole-survivor winner without binding',()=>durable('cupid',async(c,restart)=>{
 const m=await match(c,[15,25]);assert.notEqual((await action(c,m,15,15,S13_SKILLS.darkCupid)).http,200);ok(await action(c,m,15,25,S13_SKILLS.darkCupid));ok(await resolve(c,m));const old=await state(c,m);assert.equal(life(old.state,m,25),'DEAD_FINAL');assert.equal(old.state.links.length,0);assert.equal(old.state.completed,true);assert.deepEqual(old.state.winnerIds,[m.byRole[15].profile.id]);assert.equal(old.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);assert(old.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[25].profile.id));assert(!(await eventList(c,m,25)).some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'));await restart(m);emit(15,'single.target.lethal',S13_SKILLS.darkCupid);console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids:[15,25],completed:true,voteChain:false,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
}));
test('S15 #58 compares same faction privately, then self plus different faction kills only other',()=>durable('demon',async(c,restart)=>{
 const m=await match(c,[25,58,74]);const cmd=(ctx,ids)=>post(ctx,m,'actions',{skillId:S13_SKILLS.demon,targetIds:ids.map(id=>m.byRole[id].profile.id),actionId:randomUUID(),idempotencyKey:randomUUID()},58);
 assert.notEqual((await cmd(c,[25])).http,200);assert.notEqual((await cmd(c,[25,25])).http,200);ok(await cmd(c,[25,74]));ok(await resolve(c,m));const a=(await eventList(c,m,58)).filter(e=>e.eventType==='S15_DEMON_FACTION');assert.equal(a.length,1);assert.equal(a[0].payload.faction,'dan');for(const id of [25,74])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S15_DEMON_FACTION'));
 const d=await restart(m);await nextNight(d,m);ok(await cmd(d,[58,25]));ok(await resolve(d,m));const old=await state(d,m);assert.equal(life(old.state,m,58),'ALIVE');assert.equal(life(old.state,m,25),'DEAD_FINAL');assert.equal(life(old.state,m,74),'ALIVE');assert(old.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[25].profile.id));await nextNight(d,m);ok(await cmd(d,[58,74]));ok(await resolve(d,m));const final=await state(d,m);assert.equal(final.state.completed,true);assert.deepEqual(final.state.winnerIds,[m.byRole[58].profile.id]);assert.equal(final.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);await checkReplay(d,m);await restart(m);console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids:[25,58,74],completed:true,voteChain:false,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));emit(58,'same.faction.private',S13_SKILLS.demon);emit(58,'different.faction.self-exception',S13_SKILLS.demon);
}));
test('S15 #77 VH51 trap absorbs one lethal attack and counter kills knight without public cause',()=>durable('trap',async(c,restart)=>{
 const m=await match(c,[8,25,77]);ok(await action(c,m,8,25,'official.8.night-kill'));ok(await action(c,m,77,25,S13_SKILLS.trap));ok(await resolve(c,m));const old=await state(c,m);
 assert.equal(life(old.state,m,8),'DEAD_FINAL');assert.equal(life(old.state,m,25),'ALIVE');assert.equal(life(old.state,m,77),'ALIVE');assert(!old.state.participants.find(p=>p.currentCharacterId===25).effects.some(e=>e.kind===S13_STATUS.trap));assert(old.events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===m.byRole[8].profile.id&&e.payload.pendingEffects===0));
 for(const id of [8,25,77]){const ev=await eventList(c,m,id),deaths=ev.filter(e=>e.eventType==='PLAYER_ELIMINATED');assert.equal(deaths.length,1);assert.equal(deaths[0].actorId,undefined);assert.deepEqual(deaths[0].payload,{playerId:m.byRole[8].profile.id});assert(!ev.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));}
 await restart(m);emit(77,'trap.lethal-block-counter',S13_SKILLS.trap);
}));
