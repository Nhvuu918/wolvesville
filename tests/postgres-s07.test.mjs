/** Live PostgreSQL acceptance for Sprint 07, isolated random schema.
 * NEVER touches the default public schema, any existing application tables or volumes.
 * Tests real backend room->verified official kill->endgame->replay->restart. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {KNIGHT_SKILL} from '../dist/backend/src/official/solo-rules.js';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const required=process.env.WV_REQUIRE_POSTGRES==='1';
test('S07 PostgreSQL LIVE isolated schema: certified early match, idempotency, ACL, restart, replay',{
 skip:!DATABASE_URL&&!required&&'DATABASE_URL absent — PostgreSQL not tested (NOT PASS)',timeout:120000
},async()=>{
 if(!DATABASE_URL)throw Error('DATABASE_URL REQUIRED for PostgreSQL acceptance; SQLite must remain independent');
 const pg=(await import('pg')).default;
 const schema='wvs07_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:7000});
 let created=false,a,b;
 const passwd='S07RealPostgresTestPwd!';
 const boot=async()=>{const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);const app=createMultiplayerServer(store,{officialRuleTestMode:true});const port=await app.start();return {app,base:`http://127.0.0.1:${port}`};};
 const api=async(c,method,path,body,token)=>{const r=await fetch(c.base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};};
 const user=async c=>{const name='s07p'+randomUUID().replaceAll('-','').slice(0,17);assert.equal((await api(c,'POST','/api/auth/register',{username:name,password:passwd})).http,201);return api(c,'POST','/api/auth/login',{username:name,password:passwd});};
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);await admin.query('BEGIN');
  try{for(const n of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
   await admin.query(readFileSync(new URL(`../backend/src/persistence/migrations/${n}`,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK');throw e;}
  a=await boot();const players=await Promise.all([user(a),user(a)]),host=players[0];
  const room=(await api(a,'POST','/api/rooms',{name:'S07 verified knight match',capacity:2},host.token)).room;
  assert.equal((await api(a,'POST',`/api/rooms/${room.id}/join`,{},players[1].token)).http,200);
  assert.equal((await api(a,'POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
  const started=await api(a,'POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25],idempotencyKey:`start-${randomUUID()}`},host.token);
  assert.equal(started.http,201,JSON.stringify(started));const gameId=started.game.gameId,byRole={};
  for(const x of players){const v=(await api(a,'GET',`/api/games/${gameId}`,undefined,x.token)).game;
   byRole[v.players.find(p=>p.playerId===x.profile.id).self.currentCharacterId]=x;
   assert.equal(v.players.filter(p=>p.self).length,1);
  }
  const cmd={skillId:KNIGHT_SKILL,targetIds:[byRole[25].profile.id],actionId:'pg-s07-attack-id',idempotencyKey:'pg-s07-attack-key'};
  assert.equal((await api(a,'POST',`/api/games/${gameId}/actions`,cmd,byRole[8].token)).http,200);
  assert.equal((await api(a,'POST',`/api/games/${gameId}/actions`,cmd,byRole[8].token)).action.duplicate,true);
  const oldReplay=(await api(a,'GET',`/api/games/${gameId}/replay`,undefined,host.token)).replay;
  const unauthorized=await api(a,'POST',`/api/games/${gameId}/resolve`,{},players.find(x=>x.profile.id!==host.profile.id).token);
  assert.equal(unauthorized.http,403);const afterUnauthorized=(await api(a,'GET',`/api/games/${gameId}/replay`,undefined,host.token)).replay;
  assert.equal(oldReplay.events,afterUnauthorized.events);
  const res=await api(a,'POST',`/api/games/${gameId}/resolve`,{},host.token);
  assert.equal(res.http,200,JSON.stringify(res));assert.equal(res.resolution.phase,'GAME_COMPLETED');
  const completed=(await api(a,'GET',`/api/games/${gameId}`,undefined,byRole[8].token)).game;
  assert.deepEqual(completed.winnerIds,[byRole[8].profile.id]);
  const events=(await api(a,'GET',`/api/games/${gameId}/events`,undefined,byRole[25].token)).events;
  assert(!events.some(e=>e.eventType==='VERIFIED_ELIMINATION_AUDIT'||e.eventType==='MATCH_COMPLETION_AUDIT'));
  assert.equal(events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);
  assert.equal((await api(a,'GET',`/api/games/${gameId}/replay`,undefined,host.token)).replay.verified,true);
  await a.app.close();a=null;b=await boot();
  const after=(await api(b,'GET',`/api/games/${gameId}`,undefined,byRole[25].token)).game;
  assert.equal(after.completed,true);assert.deepEqual(after.winnerIds,[byRole[8].profile.id]);
  assert.equal((await api(b,'GET',`/api/games/${gameId}/replay`,undefined,host.token)).replay.verified,true);
  const outsider=await user(b);assert.equal((await api(b,'GET',`/api/games/${gameId}`,undefined,outsider.token)).http,403);
 }finally{
  await a?.app.close().catch(()=>{});await b?.app.close().catch(()=>{});
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});
 }
});
