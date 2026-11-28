import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
let seq=0;
const unique=()=>String(++seq)+'_'+String(Date.now()%1000000);
async function setup(db=':memory:',testMode=true){
 const app=createMultiplayerServer(new SqliteMultiplayerStore(db),{integrationTestMode:testMode});const port=await app.start();const base=`http://127.0.0.1:${port}`;
 async function req(method,path,body,token){const response=await fetch(base+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:response.status,...await response.json()};}
 async function account(){const username='test_'+unique();const pwd='Password-Tester-123';const registered=await req('POST','/api/auth/register',{username,password:pwd});assert.equal(registered.status,201,JSON.stringify(registered));return {...registered,...await req('POST','/api/auth/login',{username,password:pwd})};}
 return {app,req,base,account};
}
async function createRoom(ctx,num=2){const users=await Promise.all(Array.from({length:num},()=>ctx.account()));const room=(await ctx.req('POST','/api/rooms',{name:'First 02B session',capacity:num},users[0].token)).room;for(let i=1;i<num;i++)assert.equal((await ctx.req('POST',`/api/rooms/${room.id}/join`,{},users[i].token)).status,200);const lock=await ctx.req('POST',`/api/rooms/${room.id}/lock`,{},users[0].token);assert.equal(lock.status,200);return {users,room:lock.room};}
function roles(num=2){return [25,31,87,1,27,44].slice(0,num);}
async function begin(ctx,obj,key='start-run-01'){return ctx.req('POST',`/api/rooms/${obj.room.id}/games/start`,{characterIds:roles(obj.users.length),idempotencyKey:key},obj.users[0].token);}
function sleep(t=15){return new Promise(resolve=>setTimeout(resolve,t));}
async function wsConnect(url,token,roomId,gameId){const ws=new WebSocket(url),messages=[];ws.addEventListener('message',ev=>{try{messages.push(JSON.parse(ev.data));}catch{}});await new Promise((res,rej)=>{ws.addEventListener('open',res,{once:true});ws.addEventListener('error',rej,{once:true});});ws.send(JSON.stringify({type:'auth',token}));await waitFor(()=>messages.find(m=>m.type==='auth.ok'));if(roomId){ws.send(JSON.stringify({type:'subscribe',roomId}));await waitFor(()=>messages.find(m=>m.type==='room.snapshot'));}if(gameId){ws.send(JSON.stringify({type:'game.subscribe',gameId}));await waitFor(()=>messages.find(m=>m.type==='game.snapshot'));}return {ws,messages};}
async function waitFor(check,timeout=3000){const deadline=Date.now()+timeout;while(Date.now()<deadline){const v=check();if(v)return v;await sleep();}throw new Error('Timed out waiting for message');}

test('02B: locked room creates unique official roles, with two private projections and durable replay',{timeout:30000},async()=>{
 const ctx=await setup();try{
 const obj=await createRoom(ctx);const result=await begin(ctx,obj);assert.equal(result.status,201,JSON.stringify(result));const id=result.game.gameId;
 const a=await ctx.req('GET',`/api/games/${id}`,undefined,obj.users[0].token);const b=await ctx.req('GET',`/api/games/${id}`,undefined,obj.users[1].token);
 assert.equal(a.game.players.length,2);assert.equal(a.game.phase,'NIGHT_COLLECT');assert.ok(a.game.players.find(x=>x.playerId===obj.users[0].profile.id).self);
 const own=a.game.players.find(x=>x.playerId===obj.users[0].profile.id).self.initialCharacterId;const other=b.game.players.find(x=>x.playerId===obj.users[1].profile.id).self.initialCharacterId;
 assert.notEqual(own,other);assert.deepEqual([own,other].sort((x,y)=>x-y),[25,31]);
 assert.equal(a.game.players.find(x=>x.playerId===obj.users[1].profile.id).self,undefined);
 assert.equal(JSON.stringify(a).includes('seed'),false);assert.equal(JSON.stringify(a).includes(String(other)+'00000'),false);
 const room=await ctx.req('GET',`/api/rooms/${obj.room.id}`,undefined,obj.users[0].token);assert.equal(room.room.status,'IN_GAME');
 const replay=await ctx.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token);assert.equal(replay.replay.verified,true);
 assert.equal((await begin(ctx,obj)).status,200);
 assert.equal((await begin(ctx,obj,'different-request-key')).status,409);
 }finally{await ctx.app.close();}
});

test('02B: server validation prevents outsider access and forged client actor, role, seed',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx);const game=(await begin(ctx,obj)).game;const outsider=await ctx.account();
 assert.equal((await ctx.req('GET',`/api/games/${game.gameId}`,undefined,outsider.token)).status,403);
 const forbidden=await ctx.req('POST',`/api/games/${game.gameId}/actions`,{actionId:'outside-0001',idempotencyKey:'outside-key',skillId:'fixture.protect',targetIds:[obj.users[0].profile.id]},outsider.token);assert.equal(forbidden.status,403);
 const action=await ctx.req('POST',`/api/games/${game.gameId}/actions`,{actionId:'legit-00001',idempotencyKey:'legit-key-1',playerId:outsider.profile.id,initialCharacterId:44,seed:'guess',priority:-100,ruleVersion:'fake',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id]},obj.users[0].token);
 assert.equal(action.status,200,JSON.stringify(action));
 const dup=await ctx.req('POST',`/api/games/${game.gameId}/actions`,{actionId:'legit-00001',idempotencyKey:'legit-key-1',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id]},obj.users[0].token);assert.equal(dup.status,200,JSON.stringify(dup));assert.equal(dup.action.duplicate,true);
 const invalid=await ctx.req('POST',`/api/games/${game.gameId}/actions`,{actionId:'illegal-0001',idempotencyKey:'illegal-key',skillId:'role.25.unverified',targetIds:[obj.users[1].profile.id]},obj.users[0].token);assert.equal(invalid.status,409);assert.equal(invalid.error.code,'RULE_UNRESOLVED');
 }finally{await ctx.app.close();}
});

test('02B: 2 realtime clients get individual game snapshots, game updates and private skill is hidden',{timeout:35000},async()=>{
 const ctx=await setup();const sockets=[];try{const obj=await createRoom(ctx);const game=(await begin(ctx,obj)).game;const wsurl=ctx.base.replace('http:','ws:')+'/ws';
 const a=await wsConnect(wsurl,obj.users[0].token,obj.room.id,game.gameId);const b=await wsConnect(wsurl,obj.users[1].token,obj.room.id,game.gameId);sockets.push(a,b);
 const as=a.messages.find(m=>m.type==='game.snapshot').game,bs=b.messages.find(m=>m.type==='game.snapshot').game;
 assert.ok(as.players.find(p=>p.playerId===obj.users[0].profile.id).self);assert.equal(as.players.find(p=>p.playerId===obj.users[1].profile.id).self,undefined);
 assert.ok(bs.players.find(p=>p.playerId===obj.users[1].profile.id).self);
 a.ws.send(JSON.stringify({type:'game.action',gameId:game.gameId,action:{actionId:'private-0001',idempotencyKey:'private-key1',skillId:'fixture.private',targetIds:[obj.users[1].profile.id]}}));
 const receipt=await waitFor(()=>a.messages.find(m=>m.type==='game.action_accepted'));assert.equal(receipt.action.status,'ACCEPTED');
 assert.equal(b.messages.some(m=>m.type==='game.action_accepted'),false);
 assert.equal(b.messages.some(m=>m.type==='game.state_updated'),false); // private submission is not broadcast
 const resolution=await ctx.req('POST',`/api/games/${game.gameId}/resolve`,{},obj.users[0].token);assert.equal(resolution.status,200,JSON.stringify(resolution));
 assert.equal(resolution.resolution.verified,true);await waitFor(()=>b.messages.filter(m=>m.type==='game.state_updated').some(m=>m.game.phase==='DAY_DISCUSS'));
 const privateEvents=(await ctx.req('GET',`/api/games/${game.gameId}/events`,undefined,obj.users[0].token)).events;
 const strangerEvents=(await ctx.req('GET',`/api/games/${game.gameId}/events`,undefined,obj.users[1].token)).events;
 assert.ok(privateEvents.some(e=>e.eventType==='PRIVATE_INFORMATION'));
 assert.ok(!strangerEvents.some(e=>e.eventType==='PRIVATE_INFORMATION'));
 assert.equal(JSON.stringify(b.messages).includes('fixture:secret'),false);
 assert.equal((await ctx.req('GET',`/api/games/${game.gameId}/replay`,undefined,obj.users[1].token)).replay.verified,true);
 }finally{sockets.forEach(w=>w.ws.close());await ctx.app.close();}
});

test('02B: start rejects invalid role lists, unlocked rooms and start/join races',{timeout:30000},async()=>{
 const ctx=await setup();try{const a=await ctx.account(),b=await ctx.account();const room=(await ctx.req('POST','/api/rooms',{name:'Concurrency',capacity:2},a.token)).room;
 const start=ctx.req('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'run-key-001',characterIds:[25]},a.token);
 const join=ctx.req('POST',`/api/rooms/${room.id}/join`,{},b.token);const [s,j]=await Promise.all([start,join]);assert.equal(s.status,409);assert.equal(j.status,200);
 const locked=(await ctx.req('POST',`/api/rooms/${room.id}/lock`,{},a.token)).room;
 assert.equal((await ctx.req('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'run-key-001',characterIds:[25,25]},a.token)).status,400);
 assert.equal((await ctx.req('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'run-key-001',characterIds:[25]},a.token)).status,400);
 const [x,y]=await Promise.all([ctx.req('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'once-run-001',characterIds:[25,31]},a.token),ctx.req('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'once-run-001',characterIds:[25,31]},a.token)]);
 assert.deepEqual([x.status,y.status].sort(),[200,201]);assert.equal(x.game.gameId,y.game.gameId);
 }finally{await ctx.app.close();}
});

test('02B: fixture throw rolls back phase, action, event and revision atomically',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx);const id=(await begin(ctx,obj)).game.gameId;
 const accepted=await ctx.req('POST',`/api/games/${id}/actions`,{actionId:'fixture-throw-1',idempotencyKey:'fixture-throw-key',skillId:'fixture.throw',targetIds:[obj.users[1].profile.id]},obj.users[0].token);assert.equal(accepted.status,200);
 const before=(await ctx.req('GET',`/api/games/${id}`,undefined,obj.users[0].token)).game;
 const r=await ctx.req('POST',`/api/games/${id}/resolve`,{},obj.users[0].token);assert.equal(r.status,409);assert.equal(r.error.code,'RULE_UNRESOLVED');
 const after=(await ctx.req('GET',`/api/games/${id}`,undefined,obj.users[0].token)).game;
 assert.deepEqual(after,before);assert.equal((await ctx.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token)).replay.verified,true);
 }finally{await ctx.app.close();}
});

test('02B: restart retains session, roles, logged events and replay',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv02b-restart-')),db=join(dir,'game.sqlite');let a,b;
 try{a=await setup(db);const obj=await createRoom(a);const id=(await begin(a,obj)).game.gameId;
 const accepted=await a.req('POST',`/api/games/${id}/actions`,{actionId:'durable-0001',idempotencyKey:'durable-key1',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id]},obj.users[0].token);assert.equal(accepted.status,200);
 const resolved=await a.req('POST',`/api/games/${id}/resolve`,{},obj.users[0].token);assert.equal(resolved.status,200,JSON.stringify(resolved));
 const before=(await a.req('GET',`/api/games/${id}`,undefined,obj.users[0].token)).game;await a.app.close();a=undefined;
 b=await setup(db);const after=(await b.req('GET',`/api/games/${id}`,undefined,obj.users[0].token)).game;
 assert.deepEqual(after,before);assert.equal((await b.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token)).replay.verified,true);
 assert.equal((await b.req('POST',`/api/games/${id}/actions`,{actionId:'after-restart-1',idempotencyKey:'another-action',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id]},obj.users[0].token)).status,200); // day-discuss test fixture is allowed
 }finally{await a?.app.close();await b?.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('02B: default mode rejects game start safely, never enables fixtures',{timeout:25000},async()=>{
 const ctx=await setup(':memory:',false);try{const obj=await createRoom(ctx);const result=await begin(ctx,obj);assert.equal(result.status,409);assert.equal(result.error.code,'RULE_UNRESOLVED');
 assert.equal((await ctx.req('GET',`/api/rooms/${obj.room.id}`,undefined,obj.users[0].token)).room.status,'LOCKED');
 }finally{await ctx.app.close();}
});

test('02B: action stale revision rejected, duplicate with stale revision is idempotent; changed payload conflicts',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx);const id=(await begin(ctx,obj)).game.gameId;
 const before=(await ctx.req('GET',`/api/games/${id}`,undefined,obj.users[0].token)).game;
 const make=(target)=>({actionId:'stale-action1',idempotencyKey:'stale-action-key',skillId:'fixture.protect',targetIds:[target],expectedRevision:before.revision});
 const a=await ctx.req('POST',`/api/games/${id}/actions`,make(obj.users[1].profile.id),obj.users[0].token);assert.equal(a.status,200);
 const stale=await ctx.req('POST',`/api/games/${id}/actions`,{actionId:'new-action-xx',idempotencyKey:'new-key-001',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id],expectedRevision:before.revision},obj.users[0].token);assert.equal(stale.status,409);assert.equal(stale.error.code,'REVISION_CONFLICT');
 const duplicate=await ctx.req('POST',`/api/games/${id}/actions`,make(obj.users[1].profile.id),obj.users[0].token);assert.equal(duplicate.status,200);assert.equal(duplicate.action.duplicate,true);
 const changed=await ctx.req('POST',`/api/games/${id}/actions`,make(obj.users[0].profile.id),obj.users[0].token);assert.equal(changed.status,409);assert.equal(changed.error.code,'IDEMPOTENCY_CONFLICT');
 }finally{await ctx.app.close();}
});

test('02B: start key reused with different role selection is conflict',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx);const first=await begin(ctx,obj);assert.equal(first.status,201);
 const changed=await ctx.req('POST',`/api/rooms/${obj.room.id}/games/start`,{idempotencyKey:'start-run-01',characterIds:[25,87]},obj.users[0].token);
 assert.equal(changed.status,409);assert.equal(changed.error.code,'GAME_ALREADY_STARTED');
 }finally{await ctx.app.close();}
});

test('02B: two concurrent accepted actions are persisted and replay remains valid',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx);const id=(await begin(ctx,obj)).game.gameId;
 const [a,b]=await Promise.all(obj.users.map((user,i)=>ctx.req('POST',`/api/games/${id}/actions`,{actionId:'concurrent-'+i,idempotencyKey:'concurrent-key-'+i,skillId:'fixture.protect',targetIds:[obj.users[1-i].profile.id]},user.token)));
 assert.equal(a.status,200,JSON.stringify(a));assert.equal(b.status,200,JSON.stringify(b));
 const result=await ctx.req('POST',`/api/games/${id}/resolve`,{},obj.users[0].token);assert.equal(result.status,200,JSON.stringify(result));assert.equal(result.resolution.resolved,2);
 assert.equal((await ctx.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token)).replay.verified,true);
 }finally{await ctx.app.close();}
});

test('02B: one-human room may start test game without a hard minimum; no competitive start',{timeout:30000},async()=>{
 const ctx=await setup();try{const obj=await createRoom(ctx,1);const result=await begin(ctx,obj);assert.equal(result.status,201);
 const snapshot=(await ctx.req('GET',`/api/games/${result.game.gameId}`,undefined,obj.users[0].token)).game;
 assert.equal(snapshot.players.length,1);assert.equal(snapshot.players[0].self.initialCharacterId,25);
 }finally{await ctx.app.close();}
});

test('02B: outsider/non-host cannot resolve; nonmember game WebSocket subscription is rejected',{timeout:30000},async()=>{
 const ctx=await setup();let outsiderWs;try{const obj=await createRoom(ctx);const id=(await begin(ctx,obj)).game.gameId;
 const nonhost=await ctx.req('POST',`/api/games/${id}/resolve`,{},obj.users[1].token);assert.equal(nonhost.status,403);
 const outsider=await ctx.account();assert.equal((await ctx.req('POST',`/api/games/${id}/resolve`,{},outsider.token)).status,403);
 const url=ctx.base.replace('http:','ws:')+'/ws';outsiderWs=await wsConnect(url,outsider.token);outsiderWs.ws.send(JSON.stringify({type:'game.subscribe',gameId:id}));
 const denied=await waitFor(()=>outsiderWs.messages.find(m=>m.type==='error'));assert.equal(denied.error.code,'FORBIDDEN');
 }finally{outsiderWs?.ws.close();await ctx.app.close();}
});

test('02B: server stores non-public role draws and unique initial assignments, not WS payload',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv02b-db-')),filename=join(dir,'db.sqlite');const ctx=await setup(filename);
 try{const obj=await createRoom(ctx,3);const game=(await begin(ctx,obj)).game;
 const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(filename);
 try{const rows=db.prepare('SELECT * FROM game_assignment_draws WHERE game_id=? ORDER BY draw_index').all(game.gameId);
 assert.equal(rows.length,3);assert.deepEqual(rows.map(r=>r.draw_index),[0,1,2]);
 assert.equal(new Set(rows.map(r=>r.result)).size,3);assert.equal(JSON.parse(rows[0].domain_json).length,3);
 const p=db.prepare('SELECT initial_character_id FROM game_participants WHERE game_id=?').all(game.gameId);
 assert.equal(new Set(p.map(r=>r.initial_character_id)).size,3);
 const archive=db.prepare('SELECT kernel_archive FROM game_sessions WHERE game_id=?').get(game.gameId).kernel_archive;
 assert.ok(archive instanceof Uint8Array);assert.ok(archive.byteLength>20000);
 }finally{db.close();}
 }finally{await ctx.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('02B: game WebSocket reconnect restores updated private snapshot and cannot read another role',{timeout:30000},async()=>{
 const ctx=await setup();let first,again;try{const obj=await createRoom(ctx);const id=(await begin(ctx,obj)).game.gameId;
 const url=ctx.base.replace('http:','ws:')+'/ws';first=await wsConnect(url,obj.users[1].token,obj.room.id,id);
 const initial=first.messages.find(m=>m.type==='game.snapshot').game;
 first.ws.close();await sleep(70);
 assert.equal((await ctx.req('POST',`/api/games/${id}/resolve`,{},obj.users[0].token)).status,200);
 again=await wsConnect(url,obj.users[1].token,obj.room.id,id);
 const restored=again.messages.find(m=>m.type==='game.snapshot').game;
 assert.ok(restored.revision>initial.revision);assert.equal(restored.phase,'DAY_DISCUSS');
 assert.equal(restored.players.find(p=>p.playerId===obj.users[0].profile.id).self,undefined);
 }finally{first?.ws.close();again?.ws.close();await ctx.app.close();}
});

test('02B: initial and committed Engine events are projected into relational game_events, not lost',{timeout:30000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv02b-relational-')),filename=join(dir,'db.sqlite');const ctx=await setup(filename);
 try{const obj=await createRoom(ctx,2);const id=(await begin(ctx,obj)).game.gameId;
 const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(filename);
 try{const first=db.prepare('SELECT COUNT(*) AS n FROM game_events WHERE game_id=?').get(id).n;
 const replay=(await ctx.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token)).replay;
 assert.equal(first,replay.events);assert.ok(first>0);
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game_snapshots WHERE game_id=?').get(id).n,3); // revision 0,1,2
 const received=await ctx.req('POST',`/api/games/${id}/actions`,{actionId:'event-00001',idempotencyKey:'event-key-001',skillId:'fixture.protect',targetIds:[obj.users[1].profile.id]},obj.users[0].token);
 assert.equal(received.status,200);const after=(await ctx.req('GET',`/api/games/${id}/replay`,undefined,obj.users[0].token)).replay;
 assert.equal(db.prepare('SELECT COUNT(*) AS n FROM game_events WHERE game_id=?').get(id).n,after.events);
 }finally{db.close();}
 }finally{await ctx.app.close();rmSync(dir,{recursive:true,force:true});}
});
