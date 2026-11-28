import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {OFFICIAL_TEST_PACK,INSPECTION_SKILLS} from '../dist/backend/src/official/inspection-rules.js';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL,required=process.env.WV_REQUIRE_POSTGRES==='1';
const json=(x)=>JSON.stringify(x);
test('02C PostgreSQL isolated: official skill, role privacy, transaction rollback, replay, restart',{skip:!DATABASE_URL&&!required&&'DATABASE_URL absent; PostgreSQL not verified',timeout:120000},async()=>{
 if(!DATABASE_URL)throw Error('DATABASE_URL required in acceptance mode (WV_REQUIRE_POSTGRES=1)');
 const pg=(await import('pg')).default;const schema='wv02c_test_'+randomUUID().replaceAll('-','').slice(0,12);
 const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:7000});let app,second;
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);await admin.query(`SET search_path TO ${schema}`);
  await admin.query('BEGIN');
  try{for(const f of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
   await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+f,import.meta.url),'utf8'));
   await admin.query('COMMIT');}
  catch(error){await admin.query('ROLLBACK').catch(()=>{});throw error;}
  async function start(){const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);const server=createMultiplayerServer(store,{officialRuleTestMode:true,integrationTestMode:true});const port=await server.start();return {server,base:`http://127.0.0.1:${port}`};}
  async function api(ctx,path,method='GET',body,token){const response=await fetch(ctx.base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:json(body)});return {status:response.status,...await response.json()};}
  async function user(ctx){const username='pgc'+randomUUID().replaceAll('-','').slice(0,14);assert.equal((await api(ctx,'/api/auth/register','POST',{username,password:'LocalTestPassword_123'})).status,201);return api(ctx,'/api/auth/login','POST',{username,password:'LocalTestPassword_123'});}
  app=await start();const a=await user(app),b=await user(app);
  const room=(await api(app,'/api/rooms','POST',{name:'Postgres official 02C',capacity:2},a.token)).room;
  assert.equal((await api(app,`/api/rooms/${room.id}/join`,'POST',{},b.token)).status,200);
  await api(app,`/api/rooms/${room.id}/lock`,'POST',{},a.token);
  const begin=await api(app,`/api/rooms/${room.id}/games/start`,'POST',{rulePack:OFFICIAL_TEST_PACK,characterIds:[25,74],idempotencyKey:'pg-official-start'},a.token);
  assert.equal(begin.status,201,json(begin));const id=begin.game.gameId;
  const own=await api(app,`/api/games/${id}`,'GET',undefined,a.token);const role=own.game.players.find(x=>x.playerId===a.profile.id).self.currentCharacterId;
  const other=role===25?74:25;assert.equal(own.game.players.find(x=>x.playerId===b.profile.id).self,undefined);
  const accepted=await api(app,`/api/games/${id}/actions`,'POST',{actionId:'pg-official-0001',idempotencyKey:'pg-official-action',skillId:INSPECTION_SKILLS[role],targetIds:[b.profile.id]},a.token);
  assert.equal(accepted.status,200,json(accepted));
  const outcome=await api(app,`/api/games/${id}/resolve`,'POST',{},a.token);assert.equal(outcome.status,200,json(outcome));
  const mine=(await api(app,`/api/games/${id}/events`,'GET',undefined,a.token)).events;
  const theirs=(await api(app,`/api/games/${id}/events`,'GET',undefined,b.token)).events;
  const observed=mine.find(x=>x.eventType===(role===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED'));
  if(role===25){assert.equal(observed.payload.verdict,'Thiện');assert.equal(observed.payload.characterId,undefined);}else assert.equal(observed.payload.characterId,other);
  assert.equal(theirs.some(x=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(x.eventType)),false);
  const before=(await api(app,`/api/games/${id}/replay`,'GET',undefined,a.token)).replay;
  assert.equal(before.verified,true);
  const outsider=await user(app);assert.equal((await api(app,`/api/games/${id}`,'GET',undefined,outsider.token)).status,403);
  // Atomic failure separate game in the same database/schema: prior ACCEPTED events remain committed.
  const c=await user(app),d=await user(app);const room2=(await api(app,'/api/rooms','POST',{name:'rollback fixture',capacity:2},c.token)).room;
  await api(app,`/api/rooms/${room2.id}/join`,'POST',{},d.token);await api(app,`/api/rooms/${room2.id}/lock`,'POST',{},c.token);
  const fixture=(await api(app,`/api/rooms/${room2.id}/games/start`,'POST',{characterIds:[25,74],idempotencyKey:'pg-rollback-fixture'},c.token)).game;
  const fid=fixture.gameId;
  await api(app,`/api/games/${fid}/actions`,'POST',{actionId:'pg-throw-0001',idempotencyKey:'pg-throw-action',skillId:'fixture.throw',targetIds:[d.profile.id]},c.token);
  const beforeFailedState=(await api(app,`/api/games/${fid}`,'GET',undefined,c.token)).game;
  const beforeFailedReplay=(await api(app,`/api/games/${fid}/replay`,'GET',undefined,c.token)).replay;
  assert.equal((await api(app,`/api/games/${fid}/resolve`,'POST',{},c.token)).status,409);
  assert.deepEqual((await api(app,`/api/games/${fid}`,'GET',undefined,c.token)).game,beforeFailedState);
  const afterFailedReplay=(await api(app,`/api/games/${fid}/replay`,'GET',undefined,c.token)).replay;
  assert.equal(afterFailedReplay.events,beforeFailedReplay.events);
  assert.equal(afterFailedReplay.verified,true);
  await app.server.close();app=undefined;second=await start();
  const restarted=(await api(second,`/api/games/${id}/replay`,'GET',undefined,a.token)).replay;
  assert.equal(restarted.verified,true);assert.equal(restarted.events,before.events);
  assert.equal((await api(second,`/api/games/${fid}/replay`,'GET',undefined,c.token)).replay.verified,true);
 }finally{
  await app?.server.close().catch(()=>{});
  await second?.server.close().catch(()=>{});
  await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});
 }
});
