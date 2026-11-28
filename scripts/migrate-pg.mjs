import {readFileSync} from 'node:fs';
import {requireDatabaseUrl,pgDiagnostic} from './local-env.mjs';
const DATABASE_URL=requireDatabaseUrl();
let pg;try{pg=(await import('pg')).default;}catch{throw Error('pg dependency unavailable: run npm install');}
const client=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:8000});let begun=false;
try{
 await client.connect();await client.query('SELECT 1');
 await client.query('BEGIN');begun=true;
 await client.query(readFileSync(new URL('../backend/src/persistence/migrations/002_multiplayer_postgresql.sql',import.meta.url),'utf8'));
 await client.query('COMMIT');begun=false;console.log('PostgreSQL 002 migration applied');
}catch(err){if(begun)await client.query('ROLLBACK').catch(()=>{});console.error(pgDiagnostic(err));process.exitCode=1;}
finally{await client.end().catch(()=>{});}
