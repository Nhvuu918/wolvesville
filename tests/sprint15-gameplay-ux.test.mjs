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

test('S15 UX: seer aura and mystical seer exact role privately, public composition has no mapping, restart/replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15ux-seer-')),db=join(dir,'game.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,[25,74]);const url=`/api/games/${m.gameId}`;
 const composition=[{name:'Tiên Tri',count:1},{name:'Tiên Tri Huyền Bí',count:1}];
 for(const [role,target] of [[25,74],[74,25]]){
  const actor=m.byRole[role],v=(await c.call('GET',url,undefined,actor.token)).game;
  assert.deepEqual(v.roleComposition,composition);assert.equal(v.players.filter(p=>p.self).length,1);assert.equal(v.capabilities[0].targetPolicy.allowSelf,false);
  assert.equal(v.chat.enabled,true);assert.equal(v.chat.canSend,false);
  assert.notEqual((await action(c,m,role,role,`official.${role}.inspect-role`)).http,200);
  assert.equal((await action(c,m,role,target,`official.${role}.inspect-role`)).http,200);
  const pending=await c.call('GET',url+'/feedback',undefined,actor.token);assert.equal(pending.feedback.items[0].resultPayload,null);
 }
 assert.equal((await resolve(c,m)).http,200);
 const feedback=async(ctx,role)=>(await ctx.call('GET',url+'/feedback',undefined,m.byRole[role].token)).feedback;
 for(const [role,target] of [[25,74],[74,25]]){
  const f=await feedback(c,role);assert.equal(f.items.length,1);assert.equal(f.items[0].resultType,role===25?'AURA_INFORMATION':'ROLE_INFORMATION');assert.deepEqual(f.items[0].resultPayload,role===25?{verdict:'Thiện',targetId:m.byRole[target].profile.id,context:'SEER_AURA'}:{characterId:target,targetId:m.byRole[target].profile.id});
  const ev=await c.call('GET',url+'/events',undefined,m.byRole[role].token);assert.equal(ev.events.filter(e=>e.eventType===(role===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED')).length,1);assert.equal(ev.events.filter(e=>e.eventType===(role===25?'ROLE_OBSERVED':'SEER_AURA_OBSERVED')).length,0);
 }
 const outsider=await c.user();assert.equal((await c.call('GET',url,undefined,outsider.token)).http,403);assert.equal((await c.call('GET',url+'/feedback',undefined,outsider.token)).http,403);
 await checkReplay(c,m);const before=await feedback(c,25);await c.app.close();c=null;d=await setup(db);assert.deepEqual(await feedback(d,25),before);assert.deepEqual((await d.call('GET',url,undefined,m.byRole[25].token)).game.roleComposition,composition);await checkReplay(d,m);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('S15 UX: chat for ordinary approved seer/knight room, day-only, idempotency, outsiders and persistence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15ux-chat-')),db=join(dir,'game.sqlite');let c,d;
 try{c=await setup(db);const m=await match(c,[8,25]),url=`/api/games/${m.gameId}`,actor=m.byRole[25],other=m.byRole[8],outsider=await c.user();const msg={text:'Xin chào cả làng',messageId:randomUUID()};
 assert.equal((await c.call('POST',url+'/chat',msg,actor.token)).error.code,'OUT_OF_PHASE');assert.equal((await resolve(c,m)).http,200);
 assert.equal((await c.call('GET',url,undefined,actor.token)).game.chat.canSend,true);assert.equal((await c.call('POST',url+'/chat',msg,actor.token)).http,200);assert.equal((await c.call('POST',url+'/chat',msg,actor.token)).chat.duplicate,true);
 assert.equal((await c.call('POST',url+'/chat',{...msg,text:'Khác'},actor.token)).error.code,'IDEMPOTENCY_CONFLICT');assert.equal((await c.call('POST',url+'/chat',msg,outsider.token)).http,403);assert.equal((await c.call('GET',url+'/events',undefined,outsider.token)).http,403);
 const chat=async ctx=>(await ctx.call('GET',url+'/events',undefined,other.token)).events.filter(e=>e.eventType==='GAME_PUBLIC_CHAT');const seen=await chat(c);assert.equal(seen.length,1);assert.equal(seen[0].payload.text,msg.text);await checkReplay(c,m);await c.app.close();c=null;d=await setup(db);assert.deepEqual(await chat(d),seen);
 assert.equal((await d.call('POST',url+'/voting-open',{},m.host.token)).http,200);assert.equal((await d.call('POST',url+'/chat',{...msg,messageId:randomUUID()},actor.token)).error.code,'OUT_OF_PHASE');assert.equal((await d.call('GET',url,undefined,actor.token)).game.chat.canSend,false);await checkReplay(d,m);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{recursive:true,force:true});}
});
