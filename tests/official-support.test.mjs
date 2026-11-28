import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {OFFICIAL_TEST_PACK,INSPECTION_SKILLS} from '../dist/backend/src/official/inspection-rules.js';
import {SUPPORT_SKILLS,protectionLayers,NIGHT_LOCK} from '../dist/backend/src/official/support-rules.js';
const ROLES=[9,25,31,34,74];
const secret='S05IntegrationTestPassword!';
async function setup(filename=':memory:'){
 const store=new SqliteMultiplayerStore(filename),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 async function api(method,path,body,token){const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
 async function user(){const username='s05'+randomUUID().replaceAll('-','').slice(0,18);assert.equal((await api('POST','/api/auth/register',{username,password:secret})).status,201);return api('POST','/api/auth/login',{username,password:secret});}
 return {store,app,api,user};
}
async function match(c){
 const users=await Promise.all(Array.from({length:5},()=>c.user()));
 const r=(await c.api('POST','/api/rooms',{name:'S05 official support pack',capacity:5},users[0].token));assert.equal(r.status,201);
 const room=r.room;
 for(const u of users.slice(1))assert.equal((await c.api('POST',`/api/rooms/${room.id}/join`,{},u.token)).status,200);
 assert.equal((await c.api('POST',`/api/rooms/${room.id}/lock`,{},users[0].token)).status,200);
 const start=await c.api('POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:ROLES,idempotencyKey:`start-${randomUUID()}`},users[0].token);
 assert.equal(start.status,201,JSON.stringify(start));
 const gameId=start.game.gameId,byRole={};
 for(const u of users){const v=await c.api('GET',`/api/games/${gameId}`,undefined,u.token);assert.equal(v.status,200);const role=v.game.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;
  assert.equal(v.game.players.filter(p=>p.self).length,1); // secret roles never projected to other players
  assert.deepEqual(v.game.capabilities.map(x=>x.skillId),role===9?[SUPPORT_SKILLS[9]]:role===31?[SUPPORT_SKILLS[31]]:role===34?[SUPPORT_SKILLS[34]]:[INSPECTION_SKILLS[role]]);
 }
 assert.deepEqual(Object.keys(byRole).map(Number).sort((a,b)=>a-b),ROLES);
 return {users,room,gameId,byRole,host:users[0]};
}
let sequence=0;
async function act(c,m,role,targetRole,opts={}){
 const n=++sequence;
 return c.api('POST',`/api/games/${m.gameId}/actions`,{
  skillId:role===9?SUPPORT_SKILLS[9]:role===31?SUPPORT_SKILLS[31]:role===34?SUPPORT_SKILLS[34]:INSPECTION_SKILLS[role],
  targetIds:[m.byRole[targetRole].profile.id],actionId:`s05-action-${n}`,idempotencyKey:`s05-key-${n}`,...opts
 },m.byRole[role].token);
}
const resolve=(c,m)=>c.api('POST',`/api/games/${m.gameId}/resolve`,{},m.host.token);
async function internal(c,m){const game=await c.store.gameById(m.gameId);assert(game);return withKernel(game.archive,false,engine=>engine.getInternalState(m.gameId),true).value;}

// #34 night lock has dependency before inspector and shield skill, with VH24 exact exemption.
test('S05-01 #34 blocks accepted #9 action but not #25 Tiên Tri or #31 Bảo Vệ (VH10/VH24)',{timeout:40000},async()=>{
 const c=await setup();try{
  const m=await match(c);
  assert.equal((await act(c,m,9,74)).status,200);
  assert.equal((await act(c,m,25,34)).status,200);
  assert.equal((await act(c,m,31,74)).status,200);
  assert.equal((await act(c,m,74,34)).status,200);
  assert.equal((await act(c,m,34,9)).status,200);
  const result=await resolve(c,m);assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.resolution.cancelled,1);assert.equal(result.resolution.resolved,4);
  const s=await internal(c,m);
  assert.equal(s.participants.find(x=>x.currentCharacterId===9).effects.some(x=>x.kind===NIGHT_LOCK),true);
  const guard=s.participants.find(x=>x.currentCharacterId===31), target=s.participants.find(x=>x.currentCharacterId===74);
  assert.equal(protectionLayers({...s,phase:'NIGHT_COLLECT'},target.playerId).length,1);
  assert.equal(guard.effects.some(x=>x.kind.includes('LAST_GUARD')),true);
  const p9=(await c.api('GET',`/api/games/${m.gameId}/feedback`,undefined,m.byRole[9].token)).feedback;
  assert.equal(p9.items.find(x=>x.skillId===SUPPORT_SKILLS[9]).resolutionStatus,'CANCELLED');
  assert.equal((await c.api('GET',`/api/games/${m.gameId}/replay`,undefined,m.byRole[34].token)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S05-02 #34 targeting #25/#31 does not lock protected named roles; #74 can be locked', {timeout:40000},async()=>{
 for(const [target,blocked] of [[25,false],[31,false],[74,true]]){
  const c=await setup();try{
   const m=await match(c);
   assert.equal((await act(c,m,target===31?31:25,target===31?74:34)).status,200);
   // #25 may be inspected even if #34 targets #31; in #74 case #25 still resolves.
   if(target===74)assert.equal((await act(c,m,74,34)).status,200);
   assert.equal((await act(c,m,34,target)).status,200);
   const out=await resolve(c,m);assert.equal(out.status,200);assert.equal(out.resolution.cancelled,blocked?1:0);
   const s=await internal(c,m);
   assert.equal(s.participants.find(p=>p.currentCharacterId===target).effects.some(e=>e.kind===NIGHT_LOCK),blocked);
  }finally{await c.app.close();}
 }
});

test('S05-03 #31 guard cannot select same target in consecutive nights but can after a gap', {timeout:40000},async()=>{
 const c=await setup();try{
  const m=await match(c);assert.equal((await act(c,m,31,74)).status,200);assert.equal((await resolve(c,m)).status,200);
  assert.equal((await resolve(c,m)).status,200); // day -> next night
  const rejected=await act(c,m,31,74);assert.equal(rejected.status,409);assert.equal(rejected.error.code,'TARGET_INVALID');
  assert.equal((await act(c,m,31,25)).status,200);assert.equal((await resolve(c,m)).status,200);
  assert.equal((await resolve(c,m)).status,200);
  assert.equal((await act(c,m,31,74)).status,200);
 }finally{await c.app.close();}
});

test('S05-04 #9 snow protection lasts two nights and cannot repeat any of three targets', {timeout:50000},async()=>{
 const c=await setup();try{
  const m=await match(c);const target=m.byRole[74].profile.id;
  assert.equal((await act(c,m,9,74)).status,200);assert.equal((await resolve(c,m)).status,200);
  let st=await internal(c,m);assert.equal(protectionLayers({...st,phase:'NIGHT_COLLECT'},target).length,1);
  assert.equal((await resolve(c,m)).status,200);st=await internal(c,m);assert.equal(protectionLayers(st,target).length,1);
  assert.equal((await act(c,m,9,74)).error.code,'TARGET_INVALID');
  assert.equal((await act(c,m,9,25)).status,200);assert.equal((await resolve(c,m)).status,200);
  assert.equal((await resolve(c,m)).status,200);st=await internal(c,m);assert.equal(protectionLayers(st,target).length,0);
  assert.equal((await act(c,m,9,31)).status,200);assert.equal((await resolve(c,m)).status,200);
  assert.equal((await resolve(c,m)).status,200);
  const attempt=await act(c,m,9,34);assert.equal(attempt.status,409);assert.equal(attempt.error.code,'RESOURCE_INSUFFICIENT');
 }finally{await c.app.close();}
});

test('S05-05 no secret leakage, no fixtures in official pack, idempotency preserves one protection layer',{timeout:40000},async()=>{
 const c=await setup();try{
  const m=await match(c);
  const req={actionId:'s05-fixed-action-id',idempotencyKey:'s05-fixed-idempotency'};
  assert.equal((await act(c,m,31,74,req)).status,200);
  const retry=await act(c,m,31,74,req);assert.equal(retry.action.duplicate,true);
  assert.equal((await act(c,m,34,74,{skillId:'fixture.damage'})).error.code,'RULE_UNRESOLVED');
  assert.equal((await resolve(c,m)).status,200);
  const p=await internal(c,m);assert.equal(protectionLayers({...p,phase:'NIGHT_COLLECT'},m.byRole[74].profile.id).length,1);
  for(const u of m.users){const events=(await c.api('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;
   assert.equal(events.some(e=>e.eventType==='OFFICIAL_PROTECTION_RECORDED'||e.eventType==='OFFICIAL_NIGHT_LOCK_APPLIED'),false);
  }
 }finally{await c.app.close();}
});

test('S05-06 SQLite restart preserves layer provenance, action status and deterministic replay',{timeout:40000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s05-restart-')),file=join(dir,'db.sqlite');let c,c2;
 try{c=await setup(file);const m=await match(c);assert.equal((await act(c,m,9,74)).status,200);assert.equal((await resolve(c,m)).status,200);
  const before=await internal(c,m);await c.app.close();c=null;
  c2=await setup(file);const after=await internal(c2,m);assert.deepEqual(after,before);
  const check=await c2.api('GET',`/api/games/${m.gameId}/replay`,undefined,m.byRole[9].token);assert.equal(check.replay.verified,true);
 }finally{await c?.app.close();await c2?.app.close();rmSync(dir,{recursive:true,force:true});}
});
