/** Real official #25/#74 adapters, restricted to two-player noncompetitive inspection lab. */
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {INSPECTION_SKILLS,OFFICIAL_TEST_PACK} from '../dist/backend/src/official/inspection-rules.js';
import {randomUUID} from 'node:crypto';
const app=createMultiplayerServer(new SqliteMultiplayerStore(),{officialRuleTestMode:true,integrationTestMode:false});
const port=await app.start(),base=`http://127.0.0.1:${port}`,sockets=[];
async function api(method,path,body,token){const resp=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});const data=await resp.json();if(!resp.ok)throw Error(`${method} ${path} status ${resp.status}: ${JSON.stringify(data)}`);return data;}
async function user(prefix){const username='o'+prefix+randomUUID().replaceAll('-','').slice(0,8),password='DemoOnlyLocalPassword_123';await api('POST','/api/auth/register',{username,password});return api('POST','/api/auth/login',{username,password});}
async function poll(fn,ms=4000){const end=Date.now()+ms;while(Date.now()<end){const x=fn();if(x)return x;await new Promise(r=>setTimeout(r,20));}throw Error('No websocket event before timeout');}
async function connect(token,gameId){const ws=new WebSocket(base.replace('http:','ws:')+'/ws'),messages=[];sockets.push(ws);ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch{}});await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});ws.send(JSON.stringify({type:'auth',token}));await poll(()=>messages.find(x=>x.type==='auth.ok')).catch(e=>{console.error('AUTH MSG',messages);throw e;});ws.send(JSON.stringify({type:'game.subscribe',gameId}));const snapshot=await poll(()=>messages.find(x=>x.type==='game.snapshot')).catch(e=>{console.error('GAME MSG',messages);throw e;});return {ws,messages,snapshot:snapshot.game};}
try{
 const alice=await user('alice'),bob=await user('bob');
 const room=(await api('POST','/api/rooms',{name:'Official #25/#74 lab (noncompetitive)',capacity:2},alice.token)).room;
 await api('POST',`/api/rooms/${room.id}/join`,{},bob.token);
 await api('POST',`/api/rooms/${room.id}/lock`,{},alice.token);
 const started=(await api('POST',`/api/rooms/${room.id}/games/start`,{idempotencyKey:'official-demo-start',characterIds:[25,74],rulePack:OFFICIAL_TEST_PACK},alice.token)).game;
 const gameId=started.gameId;
 const a=await connect(alice.token,gameId),b=await connect(bob.token,gameId);
 const roleA=a.snapshot.players.find(p=>p.playerId===alice.profile.id).self.initialCharacterId;
 const roleB=b.snapshot.players.find(p=>p.playerId===bob.profile.id).self.initialCharacterId;
 if(a.snapshot.players.find(p=>p.playerId===bob.profile.id).self!==undefined)throw Error('Secret role leaked to Alice');
 await api('POST',`/api/games/${gameId}/actions`,{actionId:'official-demo-action-alice',idempotencyKey:'official-demo-key-alice',skillId:INSPECTION_SKILLS[roleA],targetIds:[bob.profile.id]},alice.token);
 const res=await api('POST',`/api/games/${gameId}/resolve`,{},alice.token);
 const info=await poll(()=>a.messages.find(x=>x.type==='game.events'&&x.events.some(e=>e.eventType==='ROLE_OBSERVED')));
 const ownerResult=info.events.find(e=>e.eventType==='ROLE_OBSERVED');
 if(ownerResult.payload.characterId!==roleB)throw Error('Incorrect official inspection result');
 if(b.messages.some(x=>x.type==='game.events'&&x.events.some(e=>e.eventType==='ROLE_OBSERVED')))throw Error('Private inspection leaked to Bob');
 const verify=(await api('GET',`/api/games/${gameId}/replay`,undefined,alice.token)).replay;
 if(!verify.verified||res.resolution.resolved!==1)throw Error('Replay or resolution failed');
 console.log('REAL OFFICIAL SKILL:',INSPECTION_SKILLS[roleA],'=> roleId',roleB,'(Alice-only)');
 console.log('MULTIPLAYER: 2 authenticated WebSocket clients, authorized result PASS');
 console.log('ENGINE: resolved',res.resolution.resolved,'phase',res.resolution.phase,'replay',verify.verified?'PASS':'FAIL','events',verify.events);
 console.log('SAFE MODE:',started.rulePack,'competitive DISABLED; no winner was declared');
}finally{for(const ws of sockets)ws.close();await app.close();}
