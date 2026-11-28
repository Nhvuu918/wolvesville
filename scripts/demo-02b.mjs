/** First playable *technical* multiplayer demonstration — no official skills. */
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {randomUUID} from 'node:crypto';
const app=createMultiplayerServer(new SqliteMultiplayerStore(),{integrationTestMode:true});
const port=await app.start();const base=`http://127.0.0.1:${port}`;
const wss=[];
async function request(method,path,body,token){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const data=await r.json();if(!r.ok)throw new Error(`${method} ${path}: ${JSON.stringify(data)}`);return data;}
async function account(label){const username='demo_'+label+'_'+randomUUID().slice(0,7),password='DemoLocalPassword-2026';await request('POST','/api/auth/register',{username,password});return request('POST','/api/auth/login',{username,password});}
async function connect(token){const ws=new WebSocket(base.replace('http:','ws:')+'/ws'),messages=[];wss.push(ws);ws.onmessage=e=>{try{messages.push(JSON.parse(e.data));}catch{}};await new Promise((r,j)=>{ws.onopen=r;ws.onerror=j;});ws.send(JSON.stringify({type:'auth',token}));await wait(()=>messages.find(m=>m.type==='auth.ok'));return {ws,messages,send:data=>ws.send(JSON.stringify(data))};}
async function wait(fn){const until=Date.now()+4000;while(Date.now()<until){const v=fn();if(v)return v;await new Promise(r=>setTimeout(r,20));}throw Error('WebSocket timed out');}
try{
 const alice=await account('alice'),bob=await account('bob');const a=await connect(alice.token),b=await connect(bob.token);
 const room=(await request('POST','/api/rooms',{name:'02B technical integration',capacity:2},alice.token)).room;
 await request('POST',`/api/rooms/${room.id}/join`,{},bob.token);
 a.send({type:'subscribe',roomId:room.id});b.send({type:'subscribe',roomId:room.id});await Promise.all([wait(()=>a.messages.find(x=>x.type==='room.snapshot')),wait(()=>b.messages.find(x=>x.type==='room.snapshot'))]);
 await request('POST',`/api/rooms/${room.id}/lock`,{},alice.token);
 const game=(await request('POST',`/api/rooms/${room.id}/games/start`,{characterIds:[25,31],idempotencyKey:'demo-start-key'},alice.token)).game;
 a.send({type:'game.subscribe',gameId:game.gameId});b.send({type:'game.subscribe',gameId:game.gameId});
 const aSnap=(await wait(()=>a.messages.find(x=>x.type==='game.snapshot'))).game;
 const bSnap=(await wait(()=>b.messages.find(x=>x.type==='game.snapshot'))).game;
 const ownA=aSnap.players.find(p=>p.playerId===alice.profile.id).self?.initialCharacterId;
 const ownB=bSnap.players.find(p=>p.playerId===bob.profile.id).self?.initialCharacterId;
 console.log('TWO CLIENTS:',aSnap.players.length,'members; private self roles (dev only):',ownA,ownB);
 console.log('ISOLATION:',aSnap.players.find(p=>p.playerId===bob.profile.id).self===undefined && bSnap.players.find(p=>p.playerId===alice.profile.id).self===undefined?'PASS':'FAIL');
 const action=await request('POST',`/api/games/${game.gameId}/actions`,{actionId:'demo-action-0001',idempotencyKey:'demo-action-key',skillId:'fixture.protect',targetIds:[bob.profile.id]},alice.token);
 console.log('ACTION:',action.action.status,'revision',action.action.revision);
 const resolved=await request('POST',`/api/games/${game.gameId}/resolve`,{},alice.token);
 await wait(()=>b.messages.find(x=>x.type==='game.state_updated'&&x.game.phase==='DAY_DISCUSS'));
 console.log('RESOLVE:',resolved.resolution.resolved,'effects; phase',resolved.resolution.phase);
 const replay=(await request('GET',`/api/games/${game.gameId}/replay`,undefined,bob.token)).replay;
 console.log('REPLAY:',replay.verified?'PASS':'FAIL','events',replay.events,'assignment draws',replay.assignmentDraws,'verified',replay.roleAssignmentsVerified);
 console.log('MODE:',game.mode,'(not competitive; 97 official role skills remain disabled)');
}finally{for(const ws of wss)ws.close();await app.close();}
