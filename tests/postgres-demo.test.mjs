import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {loadLocalEnv} from '../scripts/local-env.mjs';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const REQUIRED=process.env.WV_REQUIRE_POSTGRES==='1';
test('DEMO-PG-001: atomic independent demo accounts, PG 006 migration, rollback and session persistence',
 {skip:!DATABASE_URL&&!REQUIRED?'PostgreSQL connection absent: NOT a PASS':false,timeout:45000},async()=>{
  if(!DATABASE_URL)throw new Error('DATABASE_URL required for PostgreSQL acceptance; do not count SKIPPED as PASS');
  const pg=(await import('pg')).default;
  const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});
  const schema='wv_demo_hotfix_test_'+randomBytes(5).toString('hex');
  let app,created=false;
  try{
   await admin.connect();await admin.query('SELECT 1');
   await admin.query(`CREATE SCHEMA ${schema}`);created=true;
   await admin.query(`SET search_path TO ${schema}`);
   await admin.query('BEGIN');
   try{for(const f of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql']){
    await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+f,import.meta.url),'utf8'));
   }await admin.query('COMMIT');}catch(e){await admin.query('ROLLBACK');throw e;}
   const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);
   app=createMultiplayerServer(store,{demoAuthEnabled:true});const port=await app.start();const base=`http://127.0.0.1:${port}`;
   async function req(path,method='GET',data,token){const r=await fetch(base+path,{method,headers:{...(data!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:data===undefined?undefined:JSON.stringify(data)});return {status:r.status,...await r.json()};}
   const [a,b]=await Promise.all([req('/api/auth/demo','POST',{}),req('/api/auth/demo','POST',{})]);
   assert.equal(a.status,201);assert.equal(b.status,201);assert.notEqual(a.profile.id,b.profile.id);
   assert.equal((await req('/api/auth/me','GET',undefined,a.token)).profile.isDemo,true);
   const room=await req('/api/rooms','POST',{name:'PG demo room',capacity:2},a.token);assert.equal(room.status,201);
   assert.equal((await req(`/api/rooms/${room.room.id}/join`,'POST',{},b.token)).status,200);
   assert.equal((await req('/api/auth/logout','POST',{},b.token)).status,200);
   assert.equal((await req('/api/auth/me','GET',undefined,b.token)).status,401);
   assert.equal((await req('/api/auth/me','GET',undefined,a.token)).status,200);
   const before=await admin.query('SELECT COUNT(*)::integer AS n FROM wv_demo_account_meta');assert.equal(before.rows[0].n,2);
   await app.close();app=null;
   const after=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);
   app=createMultiplayerServer(after,{demoAuthEnabled:true});const port2=await app.start();
   const restored=await fetch(`http://127.0.0.1:${port2}/api/auth/me`,{headers:{Authorization:'Bearer '+a.token}});
   assert.equal(restored.status,200);
   assert.equal((await restored.json()).profile.isDemo,true);
  }finally{
   if(app)await app.close().catch(()=>{});
   if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
   await admin.end().catch(()=>{});
  }
});
