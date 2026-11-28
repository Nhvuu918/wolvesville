import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {loadLocalEnv} from '../scripts/local-env.mjs';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const REQUIRE_PG=process.env.WV_REQUIRE_POSTGRES==='1';
test('02B PostgreSQL real DB: start/commit/atomic failure/role assignments/restart/replay',{skip:!DATABASE_URL && !REQUIRE_PG && 'DATABASE_URL absent; not counted as PASS',timeout:90000},async()=>{
 if(!DATABASE_URL)throw new Error('PostgreSQL required: provide DATABASE_URL in .env or exported environment');
 const pg=await import('pg');const schema='wv02b_test_'+randomUUID().replaceAll('-','').slice(0,16);
 const admin=new pg.default.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);await admin.query(`SET search_path TO ${schema}`);
  await admin.query('BEGIN');
  try{for(const f of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
   await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+f,import.meta.url),'utf8'));
   await admin.query('COMMIT');}
  catch(e){await admin.query('ROLLBACK').catch(()=>{});throw e;}
 }finally{await admin.end().catch(()=>{});}
 let app,second;
 async function start(){const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);const server=createMultiplayerServer(store,{integrationTestMode:true});const port=await server.start();return {server,base:`http://127.0.0.1:${port}`};}
 async function api(s,path,method,body,token){const r=await fetch(s.base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
 try{
  app=await start();
  const auth=async()=>{const username='pg02b'+randomUUID().replaceAll('-','').slice(0,12);await api(app,'/api/auth/register','POST',{username,password:'SafeLocalTestPassword_123'});return api(app,'/api/auth/login','POST',{username,password:'SafeLocalTestPassword_123'});};
  const a=await auth(),b=await auth();const room=(await api(app,'/api/rooms','POST',{name:'PG game',capacity:2},a.token)).room;
  assert.equal((await api(app,`/api/rooms/${room.id}/join`,'POST',{},b.token)).status,200);
  assert.equal((await api(app,`/api/rooms/${room.id}/lock`,'POST',{},a.token)).status,200);
  const game=(await api(app,`/api/rooms/${room.id}/games/start`,'POST',{characterIds:[25,31],idempotencyKey:'pg02b-start-key'},a.token));
  assert.equal(game.status,201,JSON.stringify(game));const id=game.game.gameId;
  const [same1,same2]=await Promise.all([api(app,`/api/rooms/${room.id}/games/start`,'POST',{characterIds:[25,31],idempotencyKey:'pg02b-start-key'},a.token),api(app,`/api/rooms/${room.id}/games/start`,'POST',{characterIds:[25,31],idempotencyKey:'pg02b-start-key'},a.token)]);
  assert.equal(same1.status,200);assert.equal(same2.status,200);assert.equal(same1.game.gameId,id);assert.equal(same2.game.gameId,id);
  assert.equal((await api(app,`/api/games/${id}/replay`,'GET',undefined,a.token)).replay.verified,true);
  const ok=await api(app,`/api/games/${id}/actions`,'POST',{actionId:'pg-ok-00001',idempotencyKey:'pg-ok-key',skillId:'fixture.protect',targetIds:[b.profile.id]},a.token);
  assert.equal(ok.status,200,JSON.stringify(ok));
  const success=await api(app,`/api/games/${id}/resolve`,'POST',{},a.token);
  assert.equal(success.status,200,JSON.stringify(success));assert.equal(success.resolution.resolved,1);
  assert.equal(success.resolution.phase,'DAY_DISCUSS');
  assert.equal((await api(app,`/api/games/${id}/actions`,'POST',{actionId:'pg-throw-001',idempotencyKey:'pg-throw-key',skillId:'fixture.throw',targetIds:[b.profile.id]},a.token)).status,200);
  const before=(await api(app,`/api/games/${id}`,'GET',undefined,a.token)).game;
  const beforeFailedResolveReplay=(await api(app,`/api/games/${id}/replay`,'GET',undefined,a.token)).replay;
  assert.equal(beforeFailedResolveReplay.verified,true);
  assert.equal(beforeFailedResolveReplay.roleAssignmentsVerified,true);
  const fail=await api(app,`/api/games/${id}/resolve`,'POST',{},a.token);assert.equal(fail.status,409);
  const checkClient=new pg.default.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});
  try{
    await checkClient.connect();await checkClient.query(`SET search_path TO ${schema}`);
    const events=await checkClient.query('SELECT COUNT(*)::INTEGER AS n FROM wv_game_events WHERE game_id=$1',[id]);
    const roles=await checkClient.query('SELECT COUNT(*)::INTEGER AS n FROM wv_game_assignment_draws WHERE game_id=$1',[id]);
    assert.equal(events.rows[0].n,beforeFailedResolveReplay.events);
    assert.equal(roles.rows[0].n,2);
  }finally{await checkClient.end().catch(()=>{});}
  const afterFailedResolveReplay=(await api(app,`/api/games/${id}/replay`,'GET',undefined,a.token)).replay;
  assert.equal(afterFailedResolveReplay.events,beforeFailedResolveReplay.events);
  assert.equal(afterFailedResolveReplay.verified,true);
  assert.deepEqual((await api(app,`/api/games/${id}`,'GET',undefined,a.token)).game,before);
  await app.server.close();app=undefined;
  second=await start();
  assert.deepEqual((await api(second,`/api/games/${id}`,'GET',undefined,a.token)).game,before);
  assert.equal((await api(second,`/api/games/${id}/replay`,'GET',undefined,b.token)).replay.verified,true);
 }finally{
  await app?.server.close().catch(()=>{});
  await second?.server.close().catch(()=>{});
  const cleanup=new pg.default.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:7000});
  try{await cleanup.connect();await cleanup.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);}finally{await cleanup.end().catch(()=>{});}
 }
});
