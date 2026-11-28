import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const service=createMultiplayerServer(new SqliteMultiplayerStore(':memory:'));
const port=await service.start();const base=`http://127.0.0.1:${port}`;
const request=async(method,path,payload,token)=>{const res=await fetch(base+path,{method,headers:{...(payload?{'Content-Type':'application/json'}:{}),...(token?{Authorization:'Bearer '+token}:{})},body:payload?JSON.stringify(payload):undefined});const body=await res.json();if(!res.ok)throw new Error(JSON.stringify(body));return body;};
const messages=[];const sockets=[];
async function client(label){const username='demo_'+label+'_'+Date.now().toString().slice(-6);
 await request('POST','/api/auth/register',{username,password:'demo-secure-password-123',displayName:label});
 const login=await request('POST','/api/auth/login',{username,password:'demo-secure-password-123'});return login;
}
async function socketOf(login,label){const ws=new WebSocket(base.replace('http:','ws:')+'/ws');sockets.push(ws);
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);messages.push({label,type:m.type,roomRevision:m.room?.revision});});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 ws.send(JSON.stringify({type:'auth',token:login.token}));return ws;
}
async function waitFor(predicate){const start=Date.now();while(Date.now()-start<4000){if(predicate())return;await new Promise(r=>setTimeout(r,15));}throw new Error('Demo websocket synchronization timeout');}
try{
 const a=await client('Alice'),b=await client('Bob');
 const room=(await request('POST','/api/rooms',{name:'Wolvesville Multiplayer Demo',capacity:2},a.token)).room;
 await request('POST',`/api/rooms/${room.id}/join`,{},b.token);
 const wa=await socketOf(a,'Alice'),wb=await socketOf(b,'Bob');await waitFor(()=>messages.filter(m=>m.type==='auth.ok').length===2);
 wa.send(JSON.stringify({type:'subscribe',roomId:room.id}));wb.send(JSON.stringify({type:'subscribe',roomId:room.id}));await waitFor(()=>messages.filter(m=>m.type==='room.snapshot').length===2);
 await request('POST',`/api/rooms/${room.id}/lock`,{},a.token);
 await waitFor(()=>messages.filter(m=>m.type==='room.updated'&&m.roomRevision===3).length===2);
 console.log(JSON.stringify({result:'TWO_CLIENTS_SYNCED',roomId:room.id,players:[a.profile.publicId,b.profile.publicId],members:2,revision:3,events:messages.filter(m=>m.type==='room.snapshot'||m.type==='room.updated'),gameEngine:'NOT_STARTED',characterSkillsEnabled:0},null,2));
}finally{sockets.forEach(ws=>ws.close());await service.close();}
