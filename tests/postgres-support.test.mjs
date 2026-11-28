import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {OFFICIAL_TEST_PACK} from '../dist/backend/src/official/inspection-rules.js';
import {SUPPORT_SKILLS} from '../dist/backend/src/official/support-rules.js';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const required=process.env.WV_REQUIRE_POSTGRES==='1';
const roles=[9,25,31,34,74];
test('S05 PostgreSQL REAL: support/block pack, private capability, rollback-safe replay, restart',{skip:!DATABASE_URL&&!required&&'DATABASE_URL not configured (NOT COUNTED AS PASS)',timeout:120000},async()=>{
 if(!DATABASE_URL)throw Error('DATABASE_URL REQUIRED for PostgreSQL acceptance');
 const pg=(await import('pg')).default;
 const schema='wvs05_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:7000});
 let created=false,app,second;
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);await admin.query('BEGIN');
  try{
   for(const f of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
    await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+f,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK').catch(()=>{});throw e;}
  async function server(){const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);const instance=createMultiplayerServer(store,{officialRuleTestMode:true});const port=await instance.start();return {server:instance,base:`http://127.0.0.1:${port}`};}
  async function api(ctx,method,path,body,token){const r=await fetch(ctx.base+path,{method,headers:{'Content-Type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
  async function user(ctx){const username='pgs05'+randomUUID().replaceAll('-','').slice(0,15);assert.equal((await api(ctx,'POST','/api/auth/register',{username,password:'pg-S05-LIVE-TEST-password!'})).status,201);return api(ctx,'POST','/api/auth/login',{username,password:'pg-S05-LIVE-TEST-password!'});}
  app=await server();const users=await Promise.all(Array.from({length:5},()=>user(app)));
  const room=(await api(app,'POST','/api/rooms',{name:'PG support game',capacity:5},users[0].token)).room;
  for(const u of users.slice(1))assert.equal((await api(app,'POST',`/api/rooms/${room.id}/join`,{},u.token)).status,200);
  await api(app,'POST',`/api/rooms/${room.id}/lock`,{},users[0].token);
  const result=await api(app,'POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:roles,idempotencyKey:'pg-s05-start-locked'},users[0].token);
  assert.equal(result.status,201,JSON.stringify(result));const id=result.game.gameId;const byRole={};
  for(const u of users){const v=(await api(app,'GET',`/api/games/${id}`,undefined,u.token)).game;
   const role=v.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;
   assert.equal(v.players.filter(p=>p.self).length,1);
  }
  const submit=async(role,target,num)=>api(app,'POST',`/api/games/${id}/actions`,{actionId:`pgs05-action-${num}`,idempotencyKey:`pgs05-key-${num}`,
   skillId:SUPPORT_SKILLS[role],targetIds:[byRole[target].profile.id]},byRole[role].token);
  assert.equal((await submit(9,74,1)).status,200);
  assert.equal((await submit(31,74,2)).status,200);
  assert.equal((await submit(34,9,3)).status,200);
  const before=(await api(app,'GET',`/api/games/${id}/replay`,undefined,users[0].token)).replay;
  assert.equal(before.verified,true);
  const r=await api(app,'POST',`/api/games/${id}/resolve`,{},users[0].token);
  assert.equal(r.status,200,JSON.stringify(r));assert.equal(r.resolution.cancelled,1);
  const after=(await api(app,'GET',`/api/games/${id}/replay`,undefined,byRole[9].token)).replay;
  assert.equal(after.verified,true);assert(after.events>before.events);
  const visible=(await api(app,'GET',`/api/games/${id}/events`,undefined,byRole[25].token)).events;
  assert(!visible.some(e=>e.eventType==='OFFICIAL_PROTECTION_RECORDED'||e.eventType==='OFFICIAL_NIGHT_LOCK_APPLIED'));
  await app.server.close();app=undefined;second=await server();
  const restored=(await api(second,'GET',`/api/games/${id}/replay`,undefined,users[0].token)).replay;
  assert.equal(restored.verified,true);assert.equal(restored.events,after.events);
  const outside=await user(second);assert.equal((await api(second,'GET',`/api/games/${id}`,undefined,outside.token)).status,403);
 }finally{
  await app?.server.close().catch(()=>{});await second?.server.close().catch(()=>{});
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});
 }
});
