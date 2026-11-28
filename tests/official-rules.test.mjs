import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {OFFICIAL_TEST_PACK,INSPECTION_SKILLS} from '../dist/backend/src/official/inspection-rules.js';
const password='LocalTestOnlyPassword_123';
async function context(db=':memory:',options={officialRuleTestMode:true}){
 const app=createMultiplayerServer(new SqliteMultiplayerStore(db),options);
 const port=await app.start();const base=`http://127.0.0.1:${port}`;
 async function api(method,path,body,token){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,...await response.json()};}
 async function user(){const username='o'+randomUUID().replaceAll('-','').slice(0,13);const reg=await api('POST','/api/auth/register',{username,password});assert.equal(reg.status,201);return await api('POST','/api/auth/login',{username,password});}
 return {app,base,api,user};
}
async function make(ctx,rulePack=OFFICIAL_TEST_PACK){const [a,b]=await Promise.all([ctx.user(),ctx.user()]);const room=(await ctx.api('POST','/api/rooms',{name:'Official role inspection',capacity:2},a.token)).room;
 assert.equal((await ctx.api('POST',`/api/rooms/${room.id}/join`,{},b.token)).status,200);
 assert.equal((await ctx.api('POST',`/api/rooms/${room.id}/lock`,{},a.token)).status,200);
 const started=await ctx.api('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'official-game-start-123',rulePack,characterIds:[25,74]},a.token);
 return {a,b,room,started,gameId:started.game?.gameId};
}
function ownerView(s,id){return s.game.players.find(p=>p.playerId===id).self;}
async function action(ctx,gameId,actor,target,skillId,seq=1,body={}){return ctx.api('POST',`/api/games/${gameId}/actions`,{actionId:`official-${seq}-0001`,idempotencyKey:`official-key-${seq}-0001`,skillId,targetIds:[target.profile.id],...body},actor.token);}
const events=(ctx,id,token)=>ctx.api('GET',`/api/games/${id}/events`,undefined,token);
const game=(ctx,id,token)=>ctx.api('GET',`/api/games/${id}`,undefined,token);
const replay=(ctx,id,token)=>ctx.api('GET',`/api/games/${id}/replay`,undefined,token);
async function waitFor(fn,ms=3500){const end=Date.now()+ms;while(Date.now()<end){const x=fn();if(x)return x;await new Promise(r=>setTimeout(r,15));}throw Error('WebSocket timeout');}
async function connect(ctx,user,gameId){const ws=new WebSocket(ctx.base.replace('http:','ws:')+'/ws'),messages=[];ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch{}});await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});ws.send(JSON.stringify({type:'auth',token:user.token}));await waitFor(()=>messages.find(x=>x.type==='auth.ok'));ws.send(JSON.stringify({type:'game.subscribe',gameId}));await waitFor(()=>messages.find(x=>x.type==='game.snapshot'));return {ws,messages};}

test('02C official pack: server assigns 25 and 74; each skill reveals only its approved aura or exact role to actor',{timeout:30000},async()=>{
 const ctx=await context();try{const {a,b,gameId,started}=await make(ctx);assert.equal(started.status,201,JSON.stringify(started));assert.equal(started.game.rulePack,OFFICIAL_TEST_PACK);
 const av=await game(ctx,gameId,a.token),bv=await game(ctx,gameId,b.token),idA=ownerView(av,a.profile.id).currentCharacterId,idB=ownerView(bv,b.profile.id).currentCharacterId;
 assert.deepEqual([idA,idB].sort(),[25,74]);assert.equal(av.game.players.find(x=>x.playerId===b.profile.id).self,undefined);
 assert.equal(JSON.stringify(av).includes('seed'),false);
 const first=await action(ctx,gameId,a,b,INSPECTION_SKILLS[idA]);assert.equal(first.status,200,JSON.stringify(first));assert.equal(first.action.status,'ACCEPTED');
 const second=await ctx.api('POST',`/api/games/${gameId}/actions`,{actionId:'official-second-0001',idempotencyKey:'official-second-key',skillId:INSPECTION_SKILLS[idB],targetIds:[a.profile.id]},b.token);assert.equal(second.status,200,JSON.stringify(second));
 const resolve=await ctx.api('POST',`/api/games/${gameId}/resolve`,{},a.token);assert.equal(resolve.status,200,JSON.stringify(resolve));assert.equal(resolve.resolution.resolved,2);
 const ae=(await events(ctx,gameId,a.token)).events,be=(await events(ctx,gameId,b.token)).events;
 for(const [events,role,target] of [[ae,idA,idB],[be,idB,idA]]){
  const own=events.filter(e=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(e.eventType));assert.equal(own.length,1);
  assert.equal(own[0].eventType,role===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED');
  if(role===25){assert.equal(own[0].payload.verdict,'Thiện');assert.equal(own[0].payload.characterId,undefined);}else assert.equal(own[0].payload.characterId,target);
 }
 assert.equal((await replay(ctx,gameId,a.token)).replay.verified,true);
 }finally{await ctx.app.close();}
});

test('02C skills: wrong character, self-target, duplicate, second use, day phase are server enforced',{timeout:30000},async()=>{
 const ctx=await context();try{const {a,b,gameId}=await make(ctx);const av=await game(ctx,gameId,a.token);const role=ownerView(av,a.profile.id).currentCharacterId;
 assert.equal((await action(ctx,gameId,a,b,INSPECTION_SKILLS[role===25?74:25])).status,400); // forged role
 assert.equal((await action(ctx,gameId,a,a,INSPECTION_SKILLS[role])).status,409);
 const accepted=await action(ctx,gameId,a,b,INSPECTION_SKILLS[role]);assert.equal(accepted.status,200);
 const duplicate=await action(ctx,gameId,a,b,INSPECTION_SKILLS[role]);assert.equal(duplicate.action.duplicate,true);
 const twice=await action(ctx,gameId,a,b,INSPECTION_SKILLS[role],2);assert.equal(twice.status,409);
 assert.equal((await ctx.api('POST',`/api/games/${gameId}/resolve`,{},a.token)).status,200);
 const day=await action(ctx,gameId,a,b,INSPECTION_SKILLS[role],3);assert.equal(day.status,409);
 assert.equal((await replay(ctx,gameId,b.token)).replay.verified,true);
 }finally{await ctx.app.close();}
});

test('02C official pack rejects fixture, unsupported character set, outsider and production start',{timeout:30000},async()=>{
 const ctx=await context();const disabled=await context(':memory:',{});try{
 const {a,b,gameId}=await make(ctx);
 assert.equal((await action(ctx,gameId,a,b,'fixture.protect')).status,409);
 assert.equal((await action(ctx,gameId,a,b,'official.10.engineer-trap')).status,409);
 const outside=await ctx.user();assert.equal((await game(ctx,gameId,outside.token)).status,403);
 assert.equal((await action(ctx,gameId,outside,b,INSPECTION_SKILLS[25])).status,403);
 const x=await disabled.user(),y=await disabled.user();const room=(await disabled.api('POST','/api/rooms',{name:'disabled',capacity:2},x.token)).room;
 await disabled.api('POST',`/api/rooms/${room.id}/join`,{},y.token);await disabled.api('POST',`/api/rooms/${room.id}/lock`,{},x.token);
 const blocked=await disabled.api('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'blocked-game-123',rulePack:OFFICIAL_TEST_PACK,characterIds:[25,74]},x.token);
 assert.equal(blocked.status,409);assert.equal(blocked.error.code,'RULE_UNRESOLVED');
 }finally{await ctx.app.close();await disabled.app.close();}
});

test('02C restricted pack refuses unverified role selection and does not silently run fixture aliases',{timeout:30000},async()=>{
 const ctx=await context();try{const a=await ctx.user(),b=await ctx.user();const room=(await ctx.api('POST','/api/rooms',{name:'cannot promote',capacity:2},a.token)).room;
 await ctx.api('POST',`/api/rooms/${room.id}/join`,{},b.token);await ctx.api('POST',`/api/rooms/${room.id}/lock`,{},a.token);
 const bad=await ctx.api('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'strict-role-start',rulePack:OFFICIAL_TEST_PACK,characterIds:[25,31]},a.token);
 assert.equal(bad.status,409);assert.equal(bad.error.code,'RULE_UNRESOLVED');
 assert.equal((await ctx.api('GET',`/api/rooms/${room.id}`,undefined,a.token)).room.status,'LOCKED');
 }finally{await ctx.app.close();}
});

test('02C websocket: 2 authenticated clients receive individual official results; no cross-reader leakage',{timeout:30000},async()=>{
 const ctx=await context(),sockets=[];try{const {a,b,gameId}=await make(ctx);const aw=await connect(ctx,a,gameId),bw=await connect(ctx,b,gameId);sockets.push(aw.ws,bw.ws);
 const av=await game(ctx,gameId,a.token),char=ownerView(av,a.profile.id).currentCharacterId,other=char===25?74:25;
 assert.equal((await action(ctx,gameId,a,b,INSPECTION_SKILLS[char])).status,200);
 assert.equal(bw.messages.some(m=>m.type==='game.events'),false); // private ACTION_ACCEPTED not broadcast
 assert.equal((await ctx.api('POST',`/api/games/${gameId}/resolve`,{},a.token)).status,200);
 const eventType=char===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED';
 const aInfo=await waitFor(()=>aw.messages.find(m=>m.type==='game.events'&&m.events.some(e=>e.eventType===eventType)));
 const result=aInfo.events.find(e=>e.eventType===eventType).payload;
 if(char===25){assert.equal(result.verdict,'Thiện');assert.equal(result.characterId,undefined);}else assert.equal(result.characterId,other);
 await waitFor(()=>bw.messages.find(m=>m.type==='game.state_updated'));
 assert.equal(bw.messages.some(m=>m.type==='game.events'&&m.events.some(e=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(e.eventType))),false);
 assert.equal(JSON.stringify(bw.messages).includes('characterId'),false); // no private roles in event bodies
 const reconnect=await connect(ctx,b,gameId);sockets.push(reconnect.ws);assert.equal(reconnect.messages.find(x=>x.type==='game.snapshot').game.phase,'DAY_DISCUSS');
 }finally{sockets.forEach(ws=>ws.close());await ctx.app.close();}
});

test('02C official pack: sqlite restart and replay preserve private skill outcome, idempotency',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-02c-'));const filename=join(dir,'real.sqlite');let ctx1,ctx2;
 try{ctx1=await context(filename);const {a,b,gameId}=await make(ctx1);const initial=await game(ctx1,gameId,a.token),role=ownerView(initial,a.profile.id).currentCharacterId;
 assert.equal((await action(ctx1,gameId,a,b,INSPECTION_SKILLS[role])).status,200);
 await ctx1.api('POST',`/api/games/${gameId}/resolve`,{},a.token);
 const before=await events(ctx1,gameId,a.token);await ctx1.app.close();ctx1=null;
 ctx2=await context(filename);const after=await events(ctx2,gameId,a.token);assert.deepEqual(after,before);
 assert.equal((await replay(ctx2,gameId,b.token)).replay.verified,true);
 const d=await action(ctx2,gameId,a,b,INSPECTION_SKILLS[role]);assert.equal(d.action.duplicate,true);
 }finally{await ctx1?.app.close();await ctx2?.app.close();rmSync(dir,{recursive:true,force:true});}
});
