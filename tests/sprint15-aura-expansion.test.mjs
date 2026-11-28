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
for(const role of [49,72])test(`S15 aura expansion #${role} private distortion, expiry, duplicate and restart`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-aura-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,role,84]);const actor=m.byRole[role],victim=m.byRole[84],seer=m.byRole[25],skill=role===49?S13_SKILLS.illusion:S13_SKILLS.curse,url=`/api/games/${m.gameId}/actions`;
 const cast=async(ctx,targets)=>ctx.call('POST',url,{skillId:skill,targetIds:targets,actionId:randomUUID(),idempotencyKey:randomUUID()},actor.token);
 const inspect=async(ctx)=>action(ctx,m,25,84,'official.25.inspect-role');
 assert.equal((await caps(c,m,role)).find(x=>x.skillId===skill).targetPolicy.max,role===49?0:1);
 assert.notEqual((await cast(c,role===49?[victim.profile.id]:[])).http,200);
 assert.equal((await inspect(c)).http,200); // reversed submission order, modifier still resolves first
 const body={skillId:skill,targetIds:role===49?[]:[victim.profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 assert.equal((await c.call('POST',url,body,actor.token)).http,200);assert.equal((await c.call('POST',url,body,actor.token)).action.duplicate,true);assert.notEqual((await cast(c,body.targetIds)).http,200);
 assert.equal((await resolve(c,m)).http,200);let old=await state(c,m);assert.equal(uses(old.state,m,role,skill),1);
 const observed=async(ctx)=>(await eventList(ctx,m,25)).filter(e=>e.eventType==='SEER_AURA_OBSERVED');
 let seen=await observed(c);assert.equal(seen.length,1);assert.equal(seen[0].payload.verdict,'Ác');assert(!('characterId' in seen[0].payload));
 for(const id of [84,role])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));
 for(const id of [25,84])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));
 assert.equal((await cast(c,body.targetIds)).error.code,'OUT_OF_PHASE');await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);
 assert.deepEqual((await state(d,m)).state,old.state);assert.deepEqual(await observed(d),seen);await checkReplay(d,m);
 await nextNight(d,m);assert.equal((await inspect(d)).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal((await observed(d)).at(-1).payload.verdict,'Thiện');
 await nextNight(d,m);assert.equal((await cast(d,body.targetIds)).http,200);assert.equal((await inspect(d)).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal((await observed(d)).at(-1).payload.verdict,'Ác');
 await nextNight(d,m);if(role===49){assert.equal((await cast(d,[])).error.code,'RESOURCE_INSUFFICIENT');assert.equal((await caps(d,m,role)).find(x=>x.skillId===skill).available,false);}else{assert.equal((await cast(d,body.targetIds)).http,200);}
 assert.equal((await inspect(d)).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal((await observed(d)).at(-1).payload.verdict,role===49?'Thiện':'Ác');await checkReplay(d,m);
 evidence15(role,role===49?'illusion.global-aura':'curse.single-aura',skill);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});

test('S15 #54 shot before voting, same-day exclusion, next-day reveal, retry and replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-guard-shot-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,54,74]),actor=m.byRole[54],url=`/api/games/${m.gameId}`,shot=S13_SKILLS.guardShot;
 assert.equal((await action(c,m,54,25,shot)).error.code,'OUT_OF_PHASE');assert.equal((await resolve(c,m)).http,200);
 assert.notEqual((await action(c,m,54,25,shot)).http,200);
 const open=async(ctx)=>ctx.call('POST',url+'/voting-open',{},m.host.token),close=async(ctx)=>ctx.call('POST',url+'/voting-close',{},m.host.token);
 assert.equal((await open(c)).http,200);assert.equal((await close(c)).http,200);assert.equal((await resolve(c,m)).http,200);
 assert.equal((await caps(c,m,54)).find(x=>x.skillId===shot).available,true);assert.notEqual((await action(c,m,54,54,shot)).http,200);
 const body={skillId:shot,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 assert.equal((await c.call('POST',url+'/actions',body,actor.token)).http,200);assert.equal((await c.call('POST',url+'/actions',body,actor.token)).action.duplicate,true);assert.notEqual((await open(c)).http,200);
 assert.equal((await resolve(c,m)).http,200);let frozen=await state(c,m);assert.equal(frozen.state.phase,'DAY_DISCUSS');assert.equal(life(frozen.state,m,25),'DEAD_FINAL');assert.equal(uses(frozen.state,m,54,shot),1);assert.equal(frozen.state.completed,false);
 for(const id of [25,54,74]){const deaths=(await eventList(c,m,id)).filter(e=>e.eventType==='PLAYER_ELIMINATED');assert.equal(deaths.length,1);assert.equal(deaths[0].actorId,undefined);assert.deepEqual(deaths[0].payload,{playerId:m.byRole[25].profile.id});}
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,frozen.state);await checkReplay(d,m);
 assert.equal((await open(d)).http,200);assert.equal((await caps(d,m,54)).find(x=>x.skillId===S13_SKILLS.publicReveal).available,false);assert.notEqual((await action(d,m,54,74,S13_SKILLS.publicReveal)).http,200);assert.equal((await close(d)).http,200);
 assert.equal((await resolve(d,m)).http,200);assert.notEqual((await action(d,m,54,74,shot)).http,200);assert.equal((await open(d)).http,200);assert.equal((await action(d,m,54,74,S13_SKILLS.publicReveal)).http,200);assert.equal((await resolve(d,m)).http,200);
 assert((await eventList(d,m,74)).some(e=>e.eventType==='S15_PUBLIC_ROLE_REVEALED'&&e.payload.roleName==='Tiên Tri Huyền Bí'));await checkReplay(d,m);evidence15(54,'shoot.day-before-vote',shot);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});

for(const ids of [[8,28,74],[8,25,74]])test(`S15 certified complete match ${ids}`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-endgame-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,ids),url=`/api/games/${m.gameId}`,victim=ids.includes(28)?28:25;
 assert.equal((await action(c,m,74,8,'official.74.inspect-role')).http,200);assert.equal((await action(c,m,8,74,'official.8.night-kill')).http,200);assert.equal((await resolve(c,m)).http,200);
 assert.equal(life((await state(c,m)).state,m,74),'DEAD_FINAL');assert.equal((await c.call('POST',url+'/voting-open',{},m.host.token)).http,200);
 const body={targetId:m.byRole[victim].profile.id,ballotId:randomUUID(),idempotencyKey:randomUUID()};
 assert.equal((await c.call('POST',url+'/votes',body,m.byRole[8].token)).http,200);assert.equal((await c.call('POST',url+'/votes',body,m.byRole[8].token)).vote.duplicate,true);
 assert.equal((await c.call('POST',url+'/voting-close',{},m.host.token)).http,200);
 const old=await state(c,m),expected=[m.byRole[8].profile.id,...(victim===28?[m.byRole[28].profile.id]:[])];assert.equal(old.state.completed,true);assert.deepEqual(new Set(old.state.winnerIds),new Set(expected));
 assert.equal(old.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);assert(old.events.some(e=>e.eventType==='OFFICIAL_VOTE_RESULT'&&e.payload.outcome==='HANGING_COMPLETED'));assert(old.events.some(e=>e.eventType==='VICTORY_EVALUATED'));
 for(const id of ids){const events=await eventList(c,m,id);assert(!events.some(e=>['HANGING_AUTHORIZED','VICTORY_EVALUATED','POST_ELIMINATION_CHAIN_CLOSED'].includes(e.eventType)));assert.equal(events.filter(e=>e.eventType==='ROLE_OBSERVED').length,id===74?1:0);}
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);await checkReplay(d,m);
 console.log('S15_MATCH_EVIDENCE '+JSON.stringify({ids,completed:true,voteChain:true,restartReplay:true,privacy:true,multiClient:true,branchComplete:false}));
 if(victim===28)evidence15(28,'passive.hanged-victory','passive.28.hanged-victory');
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
