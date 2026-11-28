import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {loadLocalEnv} from '../scripts/local-env.mjs';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const REQUIRED=process.env.WV_REQUIRE_POSTGRES==='1';
test('02A PostgreSQL: transaction-safe concurrent join + persistence, requires DATABASE_URL', {skip: !DATABASE_URL && !REQUIRED && 'DATABASE_URL absent; not counted as PASS',timeout:30000}, async()=>{
 if(!DATABASE_URL)throw new Error('DATABASE_URL is required for PostgreSQL acceptance test');
 // Test only in an isolated, disposable schema. Never write test users into public.
 const pg=(await import('pg')).default;
 const schema='wv02a_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});
 let app,created=false;
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);
  await admin.query('BEGIN');
  try{
   for(const f of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
    await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+f,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK').catch(()=>{});throw e;}
  app=createMultiplayerServer(await PostgresMultiplayerStore.connect(DATABASE_URL,schema));
 const port=await app.start();const base=`http://127.0.0.1:${port}`;
 async function api(path,method,body,token){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};}
 async function user(){const username='pg'+randomUUID().replaceAll('-','').slice(0,20);
  const reg=await api('/api/auth/register','POST',{username,password:'test-password-123'},null);assert.equal(reg.status,201);
  return api('/api/auth/login','POST',{username,password:'test-password-123'},null);
 }
 try{
  const a=await user(),b=await user(),c=await user();
  const created=await api('/api/rooms','POST',{name:'PG transactional room',capacity:2},a.token);assert.equal(created.status,201);
  const id=created.room.id;const [x,y]=await Promise.all([api(`/api/rooms/${id}/join`,'POST',{},b.token),api(`/api/rooms/${id}/join`,'POST',{},c.token)]);
  assert.deepEqual([x.status,y.status].sort(),[200,409]);
  const read=await api(`/api/rooms/${id}`,'GET',undefined,a.token);assert.equal(read.room.members.length,2);
  assert.equal(read.room.revision,2);
 }finally{
   await app?.close().catch(()=>{});
  }
 }finally{
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});
 }
});
