/** Live PostgreSQL S09: isolated disposable schema; never touches user schema.
 * Requires a real PostgreSQL 16 server & valid DATABASE_URL, no fake PASS.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
loadLocalEnv();
const url=process.env.DATABASE_URL,required=process.env.WV_REQUIRE_POSTGRES==='1';
test('S09 PostgreSQL LIVE isolated schema: #33 private coerced vote, replay, restart, ACL, strict migration',{skip:!url&&!required&&'PostgreSQL not available — NOT a PASS',timeout:120000},async()=>{
 if(!url)throw Error('DATABASE_URL required for PostgreSQL acceptance; not a SQLite test');
 const pg=(await import('pg')).default,schema='wvs09_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:url,connectionTimeoutMillis:7000});
 let a,b,created=false;
 async function boot(){const store=await PostgresMultiplayerStore.connect(url,schema),app=createMultiplayerServer(store,{officialRuleTestMode:true});
  const port=await app.start();return {store,app,root:`http://127.0.0.1:${port}`};}
 const call=async(c,method,path,body,token)=>{const response=await fetch(c.root+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:response.status,...await response.json()};};
 const makeUser=async c=>{const username='s09pg'+randomUUID().replaceAll('-','').slice(0,16),password='S09PostgresTestSecure!';
  assert.equal((await call(c,'POST','/api/auth/register',{username,password})).http,201);
  const u=await call(c,'POST','/api/auth/login',{username,password});assert.equal(u.http,200);return u;};
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);await admin.query('BEGIN');
  try{for(const migration of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
   await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+migration,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK');throw e;}
  a=await boot();const users=await Promise.all([makeUser(a),makeUser(a),makeUser(a)]),host=users[0];
  const room=(await call(a,'POST','/api/rooms',{name:'S09 pg source-grounded vote',capacity:3},host.token)).room;
  for(const u of users.slice(1))assert.equal((await call(a,'POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
  assert.equal((await call(a,'POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
  const start=await call(a,'POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,33,74],idempotencyKey:`pg-${randomUUID()}`},host.token);
  assert.equal(start.http,201,JSON.stringify(start));const id=start.game.gameId,byRole={};
  for(const u of users){const game=(await call(a,'GET',`/api/games/${id}`,undefined,u.token)).game;
   byRole[game.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId]=u;}
  const post=(path,body={},user=host)=>call(a,'POST',`/api/games/${id}/${path}`,body,user.token);
  assert.equal((await post('resolve')).resolution.phase,'DAY_DISCUSS');
  assert.equal((await post('voting-open')).http,200);
  const wolf=byRole[33],target=byRole[25],other=byRole[74];
  const cmd={skillId:'official.33.force-vote',targetIds:[target.profile.id],actionId:`s09-a-${randomUUID()}`,idempotencyKey:`s09-i-${randomUUID()}`};
  assert.equal((await post('actions',cmd,wolf)).action.status,'ACCEPTED');
  assert.equal((await post('actions',cmd,wolf)).action.duplicate,true);
  assert.equal((await post('resolve')).resolution.phase,'DAY_VOTE_COLLECT');
  for(const [voter,voted] of [[wolf,other],[target,wolf],[other,wolf]]){
   assert.equal((await post('votes',{targetId:voted.profile.id,ballotId:`b-${randomUUID()}`,idempotencyKey:`k-${randomUUID()}`},voter)).http,200);}
  assert.equal((await post('voting-close')).http,200);
  const snapshot=await a.store.gameById(id);
  const internal=withKernel(snapshot.archive,false,(engine,repo)=>({state:engine.getInternalState(id),events:repo.events(id)}),true).value;
  assert.equal(internal.state.voting.review.finalBallotsVerified,true);
  assert.equal(internal.state.voting.review.effectiveCounts[0].targetId,other.profile.id);
  assert.equal(internal.state.completed,false);
  const villager=(await call(a,'GET',`/api/games/${id}`,undefined,target.token)).game;
  assert.equal(JSON.stringify(villager).includes('directives'),false);
  assert.equal(JSON.stringify(villager).includes('effectiveCounts'),false);
  assert.equal((await call(a,'GET',`/api/games/${id}/replay`,undefined,other.token)).replay.verified,true);
  await a.app.close();a=null;b=await boot();
  assert.equal((await call(b,'GET',`/api/games/${id}/replay`,undefined,target.token)).replay.verified,true);
  const outsider=await makeUser(b);assert.equal((await call(b,'GET',`/api/games/${id}`,undefined,outsider.token)).http,403);
 }finally{await a?.app.close().catch(()=>{});await b?.app.close().catch(()=>{});
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});}
});
