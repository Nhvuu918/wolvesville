import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {OFFICIAL_TEST_PACK,INSPECTION_SKILLS} from '../dist/backend/src/official/inspection-rules.js';

const password='LocalReactiveTestPass_1';
async function setup(filename=':memory:',options={officialRuleTestMode:true}){
 const app=createMultiplayerServer(new SqliteMultiplayerStore(filename),options);
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 async function api(method,path,body,token){const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
 async function newUser(){const username='rx'+randomUUID().replaceAll('-','').slice(0,16);assert.equal((await api('POST','/api/auth/register',{username,password})).status,201);return api('POST','/api/auth/login',{username,password});}
 return {app,api,newUser};
}
async function make(ctx){
 const users=await Promise.all([ctx.newUser(),ctx.newUser(),ctx.newUser()]);
 const room=(await ctx.api('POST','/api/rooms',{name:'Official 20/25/74 reaction',capacity:3},users[0].token)).room;
 for(const user of users.slice(1))assert.equal((await ctx.api('POST',`/api/rooms/${room.id}/join`,{},user.token)).status,200);
 assert.equal((await ctx.api('POST',`/api/rooms/${room.id}/lock`,{},users[0].token)).status,200);
 const started=await ctx.api('POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:[20,25,74],idempotencyKey:'official-reactive-start-001'},users[0].token);
 assert.equal(started.status,201,JSON.stringify(started));
 const gameId=started.game.gameId;
 const byRole={};
 for(const user of users){const response=await ctx.api('GET',`/api/games/${gameId}`,undefined,user.token);assert.equal(response.status,200);const id=response.game.players.find(p=>p.playerId===user.profile.id).self.currentCharacterId;byRole[id]=user;}
 assert.deepEqual(Object.keys(byRole).sort(),['20','25','74']);
 ctx._hostId=users[0].profile.id;return {users,byRole,gameId};
}
let actionNum=0;
async function act(ctx,id,source,target,role,custom={}){
 const n=String(++actionNum).padStart(6,'0');
 return ctx.api('POST',`/api/games/${id}/actions`,{
 actionId:`reactive-action-${n}`,idempotencyKey:`reactive-key-${n}`,skillId:INSPECTION_SKILLS[role],targetIds:[target.profile.id],...custom
 },source.token);
}
const resolve=(ctx,id,host)=>ctx.api('POST',`/api/games/${id}/resolve`,{},host.token);
const getEvents=(ctx,id,u)=>ctx.api('GET',`/api/games/${id}/events`,undefined,u.token);
const replay=(ctx,id,u)=>ctx.api('GET',`/api/games/${id}/replay`,undefined,u.token);

test('S04 OFF20 inspected by both official seers: aura/role results private and next-night injury for each investigator',{timeout:30000},async()=>{
 const ctx=await setup(); try{
  const {byRole,gameId}=await make(ctx),wolf=byRole[20],seer=byRole[25],oracle=byRole[74];
  assert.equal((await act(ctx,gameId,seer,wolf,25)).status,200);
  assert.equal((await act(ctx,gameId,oracle,wolf,74)).status,200);
  const host=(await ctx.api('GET',`/api/games/${gameId}`,undefined,seer.token)).game; // no secret host inference
  const {users}=await Promise.resolve({users:Object.values(byRole)}); // list only for leak checks
  const hostUser=[wolf,seer,oracle].find(u=>u.profile.id===ctx._hostId);
  assert.equal((await resolve(ctx,gameId,hostUser)).status,200);
  const seerE=(await getEvents(ctx,gameId,seer)).events;
  const oracleE=(await getEvents(ctx,gameId,oracle)).events;
  const wolfE=(await getEvents(ctx,gameId,wolf)).events;
  assert.equal(seerE.find(e=>e.eventType==='SEER_AURA_OBSERVED')?.payload.verdict,'Ác');assert.equal(seerE.some(e=>e.eventType==='ROLE_OBSERVED'),false);
  assert.equal(oracleE.find(e=>e.eventType==='ROLE_OBSERVED')?.payload.characterId,20);
  assert.equal(wolfE.some(e=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(e.eventType)),false);
  for(const set of [seerE,oracleE,wolfE])assert.equal(set.some(e=>e.eventType==='OFFICIAL_INJURY_SCHEDULED'),false);
  assert.equal((await replay(ctx,gameId,wolf)).replay.verified,true);
  // Day passes: next night is the precise locked window.
  assert.equal((await resolve(ctx,gameId,hostUser)).status,200);
  assert.equal((await act(ctx,gameId,seer,wolf,25)).error.code,'SKILL_LOCKED');
  assert.equal((await act(ctx,gameId,oracle,wolf,74)).error.code,'SKILL_LOCKED');
  assert.equal((await replay(ctx,gameId,seer)).replay.verified,true);
  // Advance without actions: later night unlocked, no permanent lock.
  assert.equal((await resolve(ctx,gameId,hostUser)).status,200);
  assert.equal((await resolve(ctx,gameId,hostUser)).status,200);
  assert.equal((await act(ctx,gameId,seer,wolf,25)).status,200);
 }finally{await ctx.app.close();}
});

test('S04 OFF20 passive does not grant an unconfirmed active skill and remains closed to unknown roles',{timeout:30000},async()=>{
 const ctx=await setup(); try{
  const {byRole,gameId}=await make(ctx);
  const denied=await act(ctx,gameId,byRole[20],byRole[25],20,{skillId:'official.20.shoot'});
  assert.equal(denied.status,409);assert.equal(denied.error.code,'RULE_UNRESOLVED');
  const forged=await act(ctx,gameId,byRole[20],byRole[74],25);
  assert.equal(forged.status,400);
  const a=await act(ctx,gameId,byRole[25],byRole[74],25);
  assert.equal(a.status,200);
  const host=[byRole[20],byRole[25],byRole[74]].find(u=>u.profile.id===ctx._hostId);
  assert.equal((await resolve(ctx,gameId,host)).status,200);
  assert.equal((await resolve(ctx,gameId,host)).status,200);
  // The #25 investigating #74 should not create spine injury.
  assert.equal((await act(ctx,gameId,byRole[25],byRole[74],25)).status,200);
  assert.equal((await replay(ctx,gameId,byRole[20])).replay.verified,true);
 }finally{await ctx.app.close();}
});

test('S04 OFF20 persists an injury through SQLite restart and duplicate action cannot double-apply it',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-reactive-restart-')),filename=join(dir,'test.sqlite');
 let ctx,ctx2;try{
  ctx=await setup(filename);const {byRole,gameId}=await make(ctx),wolf=byRole[20],seer=byRole[25];
  const host=[...Object.values(byRole)].find(u=>u.profile.id===ctx._hostId);
  const request={actionId:'reactive-retry-id-001',idempotencyKey:'reactive-retry-key-001'};
  const a=await act(ctx,gameId,seer,wolf,25,request);assert.equal(a.status,200);
  const d=await act(ctx,gameId,seer,wolf,25,request);assert.equal(d.action.duplicate,true);
  assert.equal((await resolve(ctx,gameId,host)).status,200);
  const before=(await replay(ctx,gameId,wolf)).replay;
  assert.equal(before.verified,true);await ctx.app.close();ctx=null;
  ctx2=await setup(filename);
  assert.equal((await replay(ctx2,gameId,wolf)).replay.verified,true);
  const reopenedEvents=(await getEvents(ctx2,gameId,seer)).events;
  assert.equal(reopenedEvents.filter(x=>x.eventType==='SEER_AURA_OBSERVED').length,1);
  assert.equal((await resolve(ctx2,gameId,host)).status,200);
  const b=await act(ctx2,gameId,seer,wolf,25);assert.equal(b.status,409);assert.equal(b.error.code,'SKILL_LOCKED');
 }finally{await ctx?.app.close();await ctx2?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S04 OFF20 pack is feature gated, cannot start with arbitrary fourth character',{timeout:30000},async()=>{
 const ctx=await setup(),blocked=await setup(':memory:',{});try{
  for(const [server,enabled] of [[ctx,true],[blocked,false]]){
   const users=await Promise.all([server.newUser(),server.newUser(),server.newUser()]);
   const room=(await server.api('POST','/api/rooms',{name:'closed-deck-test',capacity:3},users[0].token)).room;
   for(const u of users.slice(1))await server.api('POST',`/api/rooms/${room.id}/join`,{},u.token);
   await server.api('POST',`/api/rooms/${room.id}/lock`,{},users[0].token);
   const ids=enabled?[20,25,31]:[20,25,74];
   const result=await server.api('POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:ids,idempotencyKey:'closed-deck-start-001'},users[0].token);
   assert.equal(result.status,409);assert.equal(result.error.code,'RULE_UNRESOLVED');
  }
 }finally{await ctx.app.close();await blocked.app.close();}
});
