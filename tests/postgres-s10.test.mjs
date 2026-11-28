/** Live PostgreSQL 16 only; separate randomly named disposable test schema.
 * No database or Docker volume reset; no public schema modifications.
 * Checks S10 #5/#76 gameplay, revisions, private ACL, archive replay and restart.
 */
import test from 'node:test';import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';import {readFileSync} from 'node:fs';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
loadLocalEnv();
const url=process.env.DATABASE_URL,strict=process.env.WV_REQUIRE_POSTGRES==='1';
test('S10 PostgreSQL LIVE source-backed nightmare+judgment, ACL, rollback, restart, replay',{
 skip:!url&&!strict&&'DATABASE_URL unavailable: pending environment, not a PASS',timeout:120000},async()=>{
 if(!url)throw Error('DATABASE_URL required: strict PostgreSQL acceptance cannot run without server');
 const pg=(await import('pg')).default,schema='wvs10_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:url,connectionTimeoutMillis:7000});let created=false,a,b;
 async function boot(){const store=await PostgresMultiplayerStore.connect(url,schema),app=createMultiplayerServer(store,{officialRuleTestMode:true});
  const port=await app.start();return {store,app,base:`http://127.0.0.1:${port}`};}
 const api=async(c,method,path,payload,token)=>{const r=await fetch(c.base+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});return {http:r.status,...await r.json()};};
 const register=async c=>{const name='s10pg'+randomUUID().replaceAll('-','').slice(0,16),password='S10PGPassword-Secure!';
  assert.equal((await api(c,'POST','/api/auth/register',{username:name,password})).http,201);
  const r=await api(c,'POST','/api/auth/login',{username:name,password});assert.equal(r.http,200);return r;};
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);await admin.query('BEGIN');
  try{for(const m of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
   await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+m,import.meta.url),'utf8'));
   await admin.query('COMMIT');}catch(e){await admin.query('ROLLBACK');throw e;}
  a=await boot();const users=await Promise.all([register(a),register(a),register(a)]),host=users[0];
  const room=(await api(a,'POST','/api/rooms',{name:'S10 pg isolated skill match',capacity:3},host.token)).room;
  for(const u of users.slice(1))assert.equal((await api(a,'POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
  assert.equal((await api(a,'POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
  const started=await api(a,'POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[5,25,76],idempotencyKey:`start-${randomUUID()}`},host.token);
  assert.equal(started.http,201,JSON.stringify(started));const id=started.game.gameId,byRole={};
  for(const u of users){const view=(await api(a,'GET',`/api/games/${id}`,undefined,u.token)).game;
   byRole[view.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId]=u;
   assert.equal(view.players.filter(p=>p.self).length,1);}
  async function skill(role,target,skillId){return api(a,'POST',`/api/games/${id}/actions`,{
    skillId,targetIds:[byRole[target].profile.id],actionId:`act-${randomUUID()}`,idempotencyKey:`idem-${randomUUID()}`},byRole[role].token);}
  assert.equal((await skill(5,76,'official.5.weigh-soul')).http,200);
  assert.equal((await skill(25,76,'official.25.inspect-role')).http,200);
  assert.equal((await skill(76,25,'official.76.nightmare')).http,200);
  const beforeReplay=(await api(a,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay;
  const unauthorized=await api(a,'POST',`/api/games/${id}/resolve`,{},users.find(x=>x.profile.id!==host.profile.id).token);
  assert.equal(unauthorized.http,403);
  assert.equal((await api(a,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay.events,beforeReplay.events);
  const res=await api(a,'POST',`/api/games/${id}/resolve`,{},host.token);
  assert.equal(res.http,200,JSON.stringify(res));assert.equal(res.resolution.cancelled,1);
  const judge=(await api(a,'GET',`/api/games/${id}/feedback`,undefined,byRole[5].token)).feedback.items;
  assert.equal(judge[0].resultType,'AURA_INFORMATION');assert.equal(judge[0].resultPayload.verdict,'Ác');
  const targetEvents=(await api(a,'GET',`/api/games/${id}/events`,undefined,byRole[25].token)).events;
  assert(targetEvents.some(e=>e.eventType==='SKILL_LOCK_NOTICE'));
  const others=(await api(a,'GET',`/api/games/${id}/events`,undefined,byRole[76].token)).events;
  assert(!others.some(e=>e.eventType==='SOUL_JUDGMENT_OBSERVED'));
  const archive=await a.store.gameById(id);
  const internal=withKernel(archive.archive,false,(engine,repo)=>({state:engine.getInternalState(id),events:repo.events(id)}),true).value;
  assert.equal(internal.state.completed,false);assert.equal(internal.state.round,1);
  assert.equal((await api(a,'GET',`/api/games/${id}/replay`,undefined,byRole[5].token)).replay.verified,true);
  await a.app.close();a=null;b=await boot();
  assert.equal((await api(b,'GET',`/api/games/${id}/replay`,undefined,byRole[76].token)).replay.verified,true);
  const replayed=(await api(b,'GET',`/api/games/${id}/feedback`,undefined,byRole[5].token)).feedback.items;
  assert.equal(replayed[0].resultPayload.verdict,'Ác');
  const outsider=await register(b);assert.equal((await api(b,'GET',`/api/games/${id}`,undefined,outsider.token)).http,403);
 }finally{await a?.app.close().catch(()=>{});await b?.app.close().catch(()=>{});
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});}
});
