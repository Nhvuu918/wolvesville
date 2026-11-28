import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
loadLocalEnv();
const url=process.env.DATABASE_URL,strict=process.env.WV_REQUIRE_POSTGRES==='1';
test('03 PostgreSQL: private feedback accepted/resolved, replay, restart and isolation',{
 skip:!url&&!strict&&'DATABASE_URL absent: not verified on PostgreSQL',timeout:120000
},async()=>{
 if(!url)throw new Error('DATABASE_URL is required for PostgreSQL acceptance');
 const pg=(await import('pg')).default;
 const schema='wv03_feedback_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:url,connectionTimeoutMillis:7000});let app=null,restart=null;
 async function api(context,path,method='GET',body,token){
  const r=await fetch(context.base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:r.status,...await r.json()};
 }
 async function user(context){const username='f'+randomUUID().replaceAll('-','').slice(0,17),password='PostgresFeedback_123456';
  assert.equal((await api(context,'/api/auth/register','POST',{username,password})).status,201);
  return api(context,'/api/auth/login','POST',{username,password});
 }
 async function start(){const server=createMultiplayerServer(await PostgresMultiplayerStore.connect(url,schema),{officialRuleTestMode:true});const port=await server.start();return {server,base:`http://127.0.0.1:${port}`};}
 let created=false;
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;await admin.query(`SET search_path TO ${schema}`);
  await admin.query('BEGIN');try{
   for(const file of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
    await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+file,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK');throw e;}
  app=await start();const a=await user(app),b=await user(app);
  const room=(await api(app,'/api/rooms','POST',{name:'03 feedback PG',capacity:2},a.token)).room;
  await api(app,`/api/rooms/${room.id}/join`,'POST',{},b.token);
  await api(app,`/api/rooms/${room.id}/lock`,'POST',{},a.token);
  const started=await api(app,`/api/rooms/${room.id}/games/start`,'POST',{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,74],idempotencyKey:'pg03-feedback-start'},a.token);
  assert.equal(started.status,201,JSON.stringify(started));const gameId=started.game.gameId;
  const view=(await api(app,`/api/games/${gameId}`,'GET',undefined,a.token)).game;
  const role=view.players.find(p=>p.playerId===a.profile.id).self.currentCharacterId;
  const accept=await api(app,`/api/games/${gameId}/actions`,'POST',{actionId:'pg03-feedback-001',idempotencyKey:'pg03-feedback-key-001',skillId:`official.${role}.inspect-role`,targetIds:[b.profile.id]},a.token);
  assert.equal(accept.status,200);
  const pending=(await api(app,`/api/games/${gameId}/feedback`,'GET',undefined,a.token)).feedback;
  assert.equal(pending.items[0].resolutionStatus,'PENDING_RESOLUTION');assert.equal(pending.items[0].resultPayload,null);
  assert.deepEqual((await api(app,`/api/games/${gameId}/feedback`,'GET',undefined,b.token)).feedback.items,[]);
  assert.equal((await api(app,`/api/games/${gameId}/resolve`,'POST',{},a.token)).status,200);
  const result=(await api(app,`/api/games/${gameId}/feedback`,'GET',undefined,a.token)).feedback;
  assert.equal(result.items[0].resolutionStatus,'RESOLVED');
  assert.equal(result.items[0].resultType,role===25?'AURA_INFORMATION':'ROLE_INFORMATION');assert.deepEqual(result.items[0].resultPayload,role===25?{verdict:'Thiện',targetId:b.profile.id,context:'SEER_AURA'}:{characterId:25,targetId:b.profile.id});
  assert.equal(JSON.stringify((await api(app,`/api/games/${gameId}/feedback`,'GET',undefined,b.token)).feedback).includes('pg03-feedback-001'),false);
  assert.equal((await api(app,`/api/games/${gameId}/replay`,'GET',undefined,a.token)).replay.verified,true);
  await app.server.close();app=null;
  restart=await start();assert.deepEqual((await api(restart,`/api/games/${gameId}/feedback`,'GET',undefined,a.token)).feedback,result);
 }finally{
  await app?.server.close().catch(()=>{});await restart?.server.close().catch(()=>{});
  if(created){try{await admin.query(`DROP SCHEMA ${schema} CASCADE`);}catch{/* only the new isolated test schema is eligible */}}
  await admin.end().catch(()=>{});
 }
});
