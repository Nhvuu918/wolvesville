import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const password='NotARealPassword_1234';
async function context(){const app=createMultiplayerServer(new SqliteMultiplayerStore(':memory:'),{officialRuleTestMode:true,staticDir:resolve('frontend')});const port=await app.start();const base=`http://127.0.0.1:${port}`;
 const api=async(method,path,body,token)=>{const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 const user=async()=>{const username='u'+randomUUID().replaceAll('-','').slice(0,18);await api('POST','/api/auth/register',{username,password});return api('POST','/api/auth/login',{username,password});};
 return {app,base,api,user};}
async function prepare(c){const a=await c.user(),b=await c.user();const r=(await c.api('POST','/api/rooms',{name:'feedback',capacity:2},a.token)).room;
 await c.api('POST',`/api/rooms/${r.id}/join`,{},b.token);await c.api('POST',`/api/rooms/${r.id}/lock`,{},a.token);
 const result=await c.api('POST',`/api/rooms/${r.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,74],idempotencyKey:'feedback-start-idempotency'},a.token);
 assert.equal(result.status,201);const gameId=result.game.gameId;
 const av=(await c.api('GET',`/api/games/${gameId}`,undefined,a.token)).game;
 const role=av.players.find(p=>p.playerId===a.profile.id).self.currentCharacterId;
 return {a,b,gameId,role};}

test('03 unified feedback: accepted is pending, only authorized resolved sees role, reconnect identical',{timeout:30000},async()=>{
 const c=await context();try{const {a,b,gameId,role}=await prepare(c);
 const before=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,a.token)).feedback;assert.deepEqual(before.items,[]);
 const action={actionId:'action-feedback-001',idempotencyKey:'idem-feedback-0001',skillId:`official.${role}.inspect-role`,targetIds:[b.profile.id]};
 const accepted=await c.api('POST',`/api/games/${gameId}/actions`,action,a.token);assert.equal(accepted.action.status,'ACCEPTED');
 const pending=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,a.token)).feedback;
 assert.equal(pending.items.length,1);assert.equal(pending.items[0].resolutionStatus,'PENDING_RESOLUTION');assert.equal(pending.items[0].resultPayload,null);assert.equal(JSON.stringify(pending).includes('seed'),false);
 const outsider=(await c.user());assert.equal((await c.api('GET',`/api/games/${gameId}/feedback`,undefined,outsider.token)).status,403);
 const bv=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,b.token)).feedback;assert.equal(bv.items.length,0);assert.equal(JSON.stringify(bv).includes('action-feedback'),false);
 await c.api('POST',`/api/games/${gameId}/resolve`,{},a.token);
 const ended=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,a.token)).feedback;
 assert.equal(ended.items[0].resolutionStatus,'RESOLVED');assert.equal(ended.items[0].resultType,role===25?'AURA_INFORMATION':'ROLE_INFORMATION');assert.deepEqual(ended.items[0].resultPayload,role===25?{verdict:'Thiện',targetId:b.profile.id,context:'SEER_AURA'}:{characterId:25,targetId:b.profile.id});
 assert.equal(ended.items[0].audience.length,1);assert.equal(ended.items[0].audience[0],a.profile.id);
 const bv2=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,b.token)).feedback;assert.deepEqual(bv2.items,[]);
 const repeated=(await c.api('GET',`/api/games/${gameId}/feedback`,undefined,a.token)).feedback;assert.deepEqual(repeated,ended);
 assert.equal((await c.api('GET',`/api/games/${gameId}/replay`,undefined,a.token)).replay.verified,true);
 }finally{await c.app.close();}
});

test('03 static approved frontend served with JS and CSS; cannot traverse into private sources',{timeout:30000},async()=>{
 const c=await context();try{for(const path of ['/', '/app.js','/integration.js','/style.css','/integration.css','/assets/portraits/25.svg']){
 const r=await fetch(c.base+path);assert.equal(r.status,200,`${path} -> ${r.status}`);}
 const r=await fetch(c.base+'/backend/src/game/coordinator.ts');assert.equal(r.status,404);
 const js=await(await fetch(c.base+'/app.js')).text();assert.match(js,/function runTypewriter\(text\)/);
 assert.doesNotMatch(js,/typewriterTimer = setInterval/);
 }finally{await c.app.close();}
});

test('03 feedback not emitted as public room event; errors never fabricate results',{timeout:30000},async()=>{
 const c=await context();try{const {a,b,gameId,role}=await prepare(c);
 const rejected=await c.api('POST',`/api/games/${gameId}/actions`,{actionId:'reject-abc-001',idempotencyKey:'idem-reject-abc-001',skillId:`official.${role}.inspect-role`,targetIds:[a.profile.id]},a.token);
 assert.equal(rejected.status,409);
 assert.deepEqual((await c.api('GET',`/api/games/${gameId}/feedback`,undefined,a.token)).feedback.items,[]);
 assert.deepEqual((await c.api('GET',`/api/games/${gameId}/feedback`,undefined,b.token)).feedback.items,[]);
 }finally{await c.app.close();}
});
