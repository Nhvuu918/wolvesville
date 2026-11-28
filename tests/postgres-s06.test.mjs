import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {loadLocalEnv} from '../scripts/local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
loadLocalEnv();
const DATABASE_URL=process.env.DATABASE_URL;
const required=process.env.WV_REQUIRE_POSTGRES==='1';
test('S06 PostgreSQL LIVE isolated schema: vote, #79 PH-02, atomicity, replay, restart, ACL',{
 skip:!DATABASE_URL&&!required&&'DATABASE_URL absent — PostgreSQL not executed (NOT A PASS)',timeout:120000
},async()=>{
 if(!DATABASE_URL)throw Error('DATABASE_URL REQUIRED for mandatory PostgreSQL acceptance');
 const pg=(await import('pg')).default;
 const schema='wvs06_test_'+randomUUID().replaceAll('-','').slice(0,14);
 const admin=new pg.Client({connectionString:DATABASE_URL,connectionTimeoutMillis:7000});
 let created=false,app,second;
 const password='S06PostgresTestPassword!';
 async function server(){const store=await PostgresMultiplayerStore.connect(DATABASE_URL,schema);
  const instance=createMultiplayerServer(store,{officialRuleTestMode:true});const port=await instance.start();return {server:instance,url:`http://127.0.0.1:${port}`};}
 async function req(ctx,method,path,body,token){const r=await fetch(ctx.url+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};}
 async function user(ctx){const username='s06pg'+randomUUID().replaceAll('-','').slice(0,15);
  assert.equal((await req(ctx,'POST','/api/auth/register',{username,password})).http,201);
  return req(ctx,'POST','/api/auth/login',{username,password});}
 try{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);created=true;
  await admin.query(`SET search_path TO ${schema}`);
  await admin.query('BEGIN');try{
   for(const n of ['002_multiplayer_postgresql.sql','004_game_sessions_postgresql.sql','005_official_rule_pack_postgresql.sql','006_demo_auth_postgresql.sql'])
    await admin.query(readFileSync(new URL('../backend/src/persistence/migrations/'+n,import.meta.url),'utf8'));
   await admin.query('COMMIT');
  }catch(e){await admin.query('ROLLBACK');throw e;}
  app=await server();const all=await Promise.all([user(app),user(app),user(app)]),host=all[0];
  const room=(await req(app,'POST','/api/rooms',{name:'S06 PG official vote',capacity:3},host.token)).room;
  for(const u of all.slice(1))assert.equal((await req(app,'POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
  await req(app,'POST',`/api/rooms/${room.id}/lock`,{},host.token);
  const s=await req(app,'POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,74,79],idempotencyKey:`pg-start-${randomUUID()}`},host.token);
  assert.equal(s.http,201,JSON.stringify(s));const id=s.game.gameId,byRole={};
  for(const u of all){const state=(await req(app,'GET',`/api/games/${id}`,undefined,u.token)).game;
   const role=state.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;}
  assert.equal((await req(app,'POST',`/api/games/${id}/resolve`,{},host.token)).http,200);
  assert.equal((await req(app,'POST',`/api/games/${id}/voting-open`,{},host.token)).http,200);
  const vote={targetId:byRole[25].profile.id,ballotId:'pg-s06-ballot-01',idempotencyKey:'pg-s06-vote-key'};
  assert.equal((await req(app,'POST',`/api/games/${id}/votes`,vote,byRole[74].token)).http,200);
  const firstReplay=(await req(app,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay;
  const bad=await req(app,'POST',`/api/games/${id}/resolve`,{},host.token);
  assert.equal(bad.http,409);assert.equal(bad.error.code,'RULE_UNRESOLVED');
  const sameReplay=(await req(app,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay;
  assert.equal(sameReplay.events,firstReplay.events);assert.equal(sameReplay.verified,true);
  const skill={actionId:'pg-s06-peace-01',idempotencyKey:'pg-s06-peace-key',skillId:'official.79.cancel-vote-reveal',targetIds:[byRole[25].profile.id]};
  assert.equal((await req(app,'POST',`/api/games/${id}/actions`,skill,byRole[79].token)).http,200);
  const r=await req(app,'POST',`/api/games/${id}/resolve`,{},host.token);
  assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'NIGHT_COLLECT');
  assert.equal((await req(app,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay.verified,true);
  assert.equal((await req(app,'GET',`/api/games/${id}/voting`,undefined,byRole[74].token)).voting.status,'CANCELLED');
  const privateEvents=(await req(app,'GET',`/api/games/${id}/events`,undefined,byRole[25].token)).events;
  assert(!privateEvents.some(e=>e.eventType==='ROLE_OBSERVED'));
  await app.server.close();app=null;second=await server();
  const reloaded=(await req(second,'GET',`/api/games/${id}/replay`,undefined,host.token)).replay;
  assert.equal(reloaded.verified,true);assert(reloaded.events>sameReplay.events);
  const outsider=await user(second);assert.equal((await req(second,'GET',`/api/games/${id}/voting`,undefined,outsider.token)).http,403);
 }finally{
  await app?.server.close().catch(()=>{});await second?.server.close().catch(()=>{});
  if(created)await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(()=>{});
  await admin.end().catch(()=>{});
 }
});
