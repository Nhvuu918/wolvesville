import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {DatabaseSync} from 'node:sqlite';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {requireDatabaseUrl,pgDiagnostic} from '../scripts/local-env.mjs';

test('BUG-02B-002: PostgreSQL URL variable does not shadow standard URL constructor',()=>{
 const source=readFileSync('tests/postgres-game.test.mjs','utf8');
 assert.doesNotMatch(source,/\b(?:const|let|var)\s+URL\s*=/);
 assert.match(source,/new URL\('\.\.\/backend\/src\/persistence\/migrations\//);
 assert.equal(new URL('../test',import.meta.url).protocol,'file:');
});

test('BUG-02B-001/005: DATABASE_URL absent/placeholder is rejected without printing credentials',()=>{
 const before=process.env.DATABASE_URL;try{
  delete process.env.DATABASE_URL;
  assert.throws(()=>requireDatabaseUrl(),/DATABASE_URL missing/);
  process.env.DATABASE_URL='postgresql://wolvesville:YOUR_PASSWORD@localhost:5433/wolvesville';
  assert.throws(()=>requireDatabaseUrl(),/placeholder/);
  assert.doesNotMatch(pgDiagnostic({code:'28P01'}),/YOUR_PASSWORD|password=/i);
  assert.match(pgDiagnostic({code:'28P01'}),/28P01/);
 }finally{if(before===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=before;}
});

test('02C SQLite 005 additive migration upgrades old 002+004 database without losing old rows',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-02c-migrate-'));const db=join(dir,'old.sqlite');
 try{
  const original=new DatabaseSync(db);
  for(const f of ['002_multiplayer_sqlite.sql','004_game_sessions_sqlite.sql'])original.exec(readFileSync('backend/src/persistence/migrations/'+f,'utf8'));
  original.exec("INSERT INTO user_accounts(id,public_id,username,display_name,password_hash,created_at) VALUES('old-user-id','WU000001','olduser','Old User','test_hash',1)");
  original.close();
  const upgraded=new SqliteMultiplayerStore(db);try{
   assert.equal((await upgraded.accountByUsername('olduser')).displayName,'Old User');
  }finally{await upgraded.close();}
  const verify=new DatabaseSync(db);try{assert.ok(verify.prepare('PRAGMA table_info(game_sessions)').all().some(x=>x.name==='rule_pack'));}finally{verify.close();}
  const repeat=new SqliteMultiplayerStore(db);await repeat.close();
 }finally{rmSync(dir,{recursive:true,force:true});}
});

test('BUG-02B-003: failed resolution compares replay checkpoint after ACCEPTED (not stale hardcoded 15/17)',()=>{
 const text=readFileSync('tests/postgres-game.test.mjs','utf8');
 assert.match(text,/beforeFailedResolveReplay/);
 assert.match(text,/afterFailedResolveReplay/);
 assert.doesNotMatch(text,/events\.rows\[0\]\.n\s*,\s*(?:15|17)\b/);
});
