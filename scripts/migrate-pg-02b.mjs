import {readFileSync} from 'node:fs';
import {requireDatabaseUrl,pgDiagnostic} from './local-env.mjs';
const DATABASE_URL=requireDatabaseUrl();
let pg;try{pg=(await import('pg')).default;}catch{throw Error('pg dependency unavailable: run npm install');}
const client=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});
let began=false;
try{
 await client.connect();await client.query('SELECT 1');console.log('PostgreSQL authenticated (read-only preflight PASS)');
 await client.query('BEGIN');began=true;
 // Serialize migrations across overlapping deploys. Existing migrations remain additive/idempotent.
 await client.query('SELECT pg_advisory_xact_lock(2026112803)');
 await client.query('CREATE TABLE IF NOT EXISTS wv_schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
 for(const file of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql','007_normal_gameplay_postgresql.sql','008_normal_coordination_postgresql.sql','009_social_postgresql.sql','010_social_post_media_postgresql.sql','011_progression_postgresql.sql','012_account_workspace_postgresql.sql']){
  const previous=await client.query('SELECT name FROM wv_schema_migrations WHERE name=$1',[file]);if(previous.rowCount)continue;
  await client.query(readFileSync(new URL('../backend/src/persistence/migrations/'+file,import.meta.url),'utf8'));
  await client.query('INSERT INTO wv_schema_migrations(name) VALUES($1)',[file]);
 }
 await client.query('COMMIT');began=false;console.log('PostgreSQL 002,004,005,006,007,008,009,010,011,012 migrations applied');
}catch(error){if(began)await client.query('ROLLBACK').catch(()=>{});console.error(pgDiagnostic(error));process.exitCode=1;}
finally{await client.end().catch(()=>{});}
