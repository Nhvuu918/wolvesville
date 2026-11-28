import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const RUN='s02_'+Math.floor(Math.random()*100000000).toString();
let n=0;
async function start(store=new SqliteMultiplayerStore()){
 const app=createMultiplayerServer(store);const port=await app.start();
 const base=`http://127.0.0.1:${port}`;
 async function req(method,path,data,token){const headers={'Accept':'application/json'};
  if(data!==undefined)headers['Content-Type']='application/json';if(token)headers.Authorization='Bearer '+token;
  const res=await fetch(base+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
  const payload=await res.json();return {status:res.status,...payload};
 }
 async function account(label){const username=RUN+'_'+(++n)+'_'+label;
  const created=await req('POST','/api/auth/register',{username,password:'PassW0rd-Long-'+n,displayName:'User '+label});
  assert.equal(created.status,201,JSON.stringify(created));
  const logged=await req('POST','/api/auth/login',{username,password:'PassW0rd-Long-'+n});assert.equal(logged.status,200);
  return {...logged,username};
 }
 return {app,base,req,account};
}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function waitFor(read,timeout=2000){const until=Date.now()+timeout;while(Date.now()<until){const result=read();if(result)return result;await sleep(10);}throw new Error('Timed out waiting for WebSocket message');}
async function wsConnect(url){const ws=new WebSocket(url);const messages=[];
 ws.addEventListener('message',evt=>{try{messages.push(JSON.parse(evt.data));}catch{messages.push({type:'invalid'});}});
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
 await waitFor(()=>messages.find(x=>x.type==='connected'));
 return {ws,messages,send:m=>ws.send(JSON.stringify(m)),wait:type=>waitFor(()=>messages.find(x=>x.type===type))};
}

test('02A: registration/login hash, normalization, public IDs, authorization and logout',{timeout:10000},async()=>{
 const {app,req,account}=await start();try{
  const a=await account('auth');assert.match(a.profile.publicId,/^WV-[A-F0-9]{12}$/);
  assert.equal(Object.hasOwn(a.profile,'passwordHash'),false);
  assert.equal((await req('GET','/api/auth/me',undefined,a.token)).profile.id,a.profile.id);
  assert.equal((await req('GET','/api/auth/me')).status,401);
  assert.equal((await req('POST','/api/auth/login',{username:a.username,password:'WRONG_PASSWORD'})).status,401);
  assert.equal((await req('POST','/api/auth/register',{username:a.username.toUpperCase(),password:'AnotherPassw0rd'})).status,409);
  assert.equal((await req('POST','/api/auth/register',{username:'bad',password:'short'})).status,400);
  assert.equal((await req('POST','/api/auth/logout',{},a.token)).status,200);
  assert.equal((await req('GET','/api/auth/me',undefined,a.token)).status,401);
 }finally{await app.close();}
});

test('02A: room create/join/idempotent join/leave/host transfer/discovery',{timeout:10000},async()=>{
 const {app,req,account}=await start();try{
  const a=await account('owner'),b=await account('guest');
  const made=await req('POST','/api/rooms',{name:'Sương mù',capacity:2},a.token);assert.equal(made.status,201);
  const room=made.room;assert.equal(room.members.length,1);assert.equal(room.hostId,a.profile.id);
  assert.equal((await req('GET',`/api/rooms/${room.id}`,undefined,b.token)).status,403);
  const joined=await req('POST',`/api/rooms/${room.id}/join`,{},b.token);assert.equal(joined.status,200);assert.equal(joined.room.members.length,2);
  const duplicate=await req('POST',`/api/rooms/${room.id}/join`,{},b.token);assert.equal(duplicate.room.revision,joined.room.revision);
  assert.equal((await req('GET','/api/rooms',undefined,a.token)).rooms[0].occupied,2);
  assert.equal((await req('POST',`/api/rooms/${room.id}/leave`,{},a.token)).room.hostId,b.profile.id);
  assert.equal((await req('POST',`/api/rooms/${room.id}/leave`,{},b.token)).room,null);
  assert.equal((await req('GET',`/api/rooms/${room.id}`,undefined,b.token)).status,404);
 }finally{await app.close();}
});

test('02A: concurrent join at capacity cannot overbook',{timeout:10000},async()=>{
 const {app,req,account}=await start();try{
  const a=await account('host'),b=await account('b'),c=await account('c');
  const made=await req('POST','/api/rooms',{name:'Limited',capacity:2},a.token);const id=made.room.id;
  const [r1,r2]=await Promise.all([req('POST',`/api/rooms/${id}/join`,{},b.token),req('POST',`/api/rooms/${id}/join`,{},c.token)]);
  assert.deepEqual([r1.status,r2.status].sort(),[200,409]);
  assert.equal((await req('GET',`/api/rooms/${id}`,undefined,a.token)).room.members.length,2);
 }finally{await app.close();}
});

test('02A: lock/unlock only host; locked room prevents join',{timeout:10000},async()=>{
 const {app,req,account}=await start();try{
  const a=await account('host2'),b=await account('nonhost'),c=await account('third');
  const id=(await req('POST','/api/rooms',{name:'Lockable',capacity:3},a.token)).room.id;
  await req('POST',`/api/rooms/${id}/join`,{},b.token);
  assert.equal((await req('POST',`/api/rooms/${id}/lock`,{},b.token)).status,403);
  assert.equal((await req('POST',`/api/rooms/${id}/lock`,{},a.token)).room.status,'LOCKED');
  assert.equal((await req('POST',`/api/rooms/${id}/join`,{},c.token)).status,409);
  assert.equal((await req('POST',`/api/rooms/${id}/unlock`,{},a.token)).room.status,'WAITING');
  assert.equal((await req('POST',`/api/rooms/${id}/join`,{},c.token)).status,200);
 }finally{await app.close();}
});

test('02A: two authenticated WebSocket clients receive room updates; outsider cannot subscribe',{timeout:15000},async()=>{
 const {app,base,req,account}=await start();let sockets=[];try{
  const a=await account('wsA'),b=await account('wsB'),c=await account('wsC');
  const id=(await req('POST','/api/rooms',{name:'WS room',capacity:4},a.token)).room.id;
  await req('POST',`/api/rooms/${id}/join`,{},b.token);
  const wa=await wsConnect(base.replace('http:','ws:')+'/ws'),wb=await wsConnect(base.replace('http:','ws:')+'/ws'),wc=await wsConnect(base.replace('http:','ws:')+'/ws');sockets=[wa,wb,wc];
  wa.send({type:'auth',token:a.token});wb.send({type:'auth',token:b.token});wc.send({type:'auth',token:c.token});
  await Promise.all(sockets.map(s=>s.wait('auth.ok')));
  wa.send({type:'subscribe',roomId:id});wb.send({type:'subscribe',roomId:id});wc.send({type:'subscribe',roomId:id});
  await Promise.all([wa.wait('room.snapshot'),wb.wait('room.snapshot'),wc.wait('error')]);
  assert.equal(wc.messages.find(x=>x.type==='error').error.code,'NOT_MEMBER');
  assert.equal(wa.messages.find(x=>x.type==='room.snapshot').room.members.length,2);
  const current=wa.messages.filter(x=>x.type==='room.updated').length;
  const changed=await req('POST',`/api/rooms/${id}/lock`,{},a.token);assert.equal(changed.status,200);
  await waitFor(()=>wa.messages.filter(x=>x.type==='room.updated').length>current&&wa.messages.some(x=>x.type==='room.updated'&&x.room.status==='LOCKED'));
  await waitFor(()=>wb.messages.some(x=>x.type==='room.updated'&&x.room.status==='LOCKED'));
  assert.equal(wc.messages.some(x=>x.type==='room.updated'),false);
 }finally{sockets.forEach(s=>s.ws.close());await app.close();}
});

test('02A: WebSocket reconnect restores snapshot without exposing other users secrets',{timeout:15000},async()=>{
 const {app,base,req,account}=await start();let w1,w2;try{
  const a=await account('recon'),b=await account('other');const id=(await req('POST','/api/rooms',{name:'Reconnect',capacity:2},a.token)).room.id;
  await req('POST',`/api/rooms/${id}/join`,{},b.token);
  w1=await wsConnect(base.replace('http:','ws:')+'/ws');w1.send({type:'auth',token:a.token});await w1.wait('auth.ok');w1.send({type:'subscribe',roomId:id});await w1.wait('room.snapshot');
  w1.ws.close();await new Promise(resolve=>w1.ws.addEventListener('close',resolve,{once:true}));
  w2=await wsConnect(base.replace('http:','ws:')+'/ws');w2.send({type:'auth',token:a.token});await w2.wait('auth.ok');w2.send({type:'subscribe',roomId:id});
  const snapshot=(await w2.wait('room.snapshot')).room;
  assert.equal(snapshot.members.length,2);assert.equal(snapshot.status,'WAITING');
  assert.equal(JSON.stringify(snapshot).includes('password'),false);assert.equal(JSON.stringify(snapshot).includes(b.token),false);
 }finally{w1?.ws.close();w2?.ws.close();await app.close();}
});

test('02A: SQLite store keeps accounts and room data after reopening',{timeout:10000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv02a-')),db=join(dir,'lobby.sqlite');let s1,s2;
 try{
  s1=await start(new SqliteMultiplayerStore(db));const a=await s1.account('persist');const id=(await s1.req('POST','/api/rooms',{name:'durable',capacity:3},a.token)).room.id;
  await s1.app.close();s2=await start(new SqliteMultiplayerStore(db));
  assert.equal((await s2.req('GET','/api/auth/me',undefined,a.token)).profile.id,a.profile.id);
  assert.equal((await s2.req('GET',`/api/rooms/${id}`,undefined,a.token)).room.name,'durable');
 }finally{if(s2)await s2.app.close();else if(s1)try{await s1.app.close();}catch{}rmSync(dir,{recursive:true,force:true});}
});

test('02A: room limits 1–100 do not imply a competitive game has begun',{timeout:10000},async()=>{
 const {app,req,account}=await start();try{
  const a=await account('capacity');
  assert.equal((await req('POST','/api/rooms',{name:'bad',capacity:101},a.token)).status,400);
  assert.equal((await req('POST','/api/rooms',{name:'solo + bot later',capacity:1},a.token)).room.capacity,1);
  assert.equal((await req('POST','/api/rooms',{name:'100 slots',capacity:100},a.token)).room.capacity,100);
  assert.equal((await req('GET','/health')).characterRulesEnabled,0);
 }finally{await app.close();}
});

test('02A: profile update keeps public ID and broadcasts to subscribed room',{timeout:12000},async()=>{
 const {app,base,req,account}=await start();let w;try{
  const a=await account('profile');const id=(await req('POST','/api/rooms',{name:'Profile update',capacity:2},a.token)).room.id;
  w=await wsConnect(base.replace('http:','ws:')+'/ws');w.send({type:'auth',token:a.token});await w.wait('auth.ok');w.send({type:'subscribe',roomId:id});await w.wait('room.snapshot');
  const updated=await req('PATCH','/api/profile/me',{displayName:'Updated Display'},a.token);
  assert.equal(updated.status,200);assert.equal(updated.profile.publicId,a.profile.publicId);
  assert.equal(updated.profile.displayName,'Updated Display');
  await waitFor(()=>w.messages.some(m=>m.type==='room.updated'&&m.room.members.some(p=>p.displayName==='Updated Display')));
  assert.equal((await req('PATCH','/api/profile/me',{displayName:''},a.token)).status,400);
 }finally{w?.ws.close();await app.close();}
});

test('02A: logout closes authenticated WebSocket, stale token cannot reconnect',{timeout:12000},async()=>{
 const {app,base,req,account}=await start();let w,w2;try{
  const a=await account('revoke');w=await wsConnect(base.replace('http:','ws:')+'/ws');
  w.send({type:'auth',token:a.token});await w.wait('auth.ok');
  const closePromise=new Promise(resolve=>w.ws.addEventListener('close',resolve,{once:true}));
  await req('POST','/api/auth/logout',{},a.token);await closePromise;
  w2=await wsConnect(base.replace('http:','ws:')+'/ws');w2.send({type:'auth',token:a.token});
  const error=await w2.wait('error');assert.equal(error.error.code,'UNAUTHORIZED');
 }finally{w?.ws.close();w2?.ws.close();await app.close();}
});

test('02A: ordered WebSocket frames auth then subscribe cannot race',{timeout:12000},async()=>{
 const {app,base,req,account}=await start();let w;try{
  const a=await account('batch');const id=(await req('POST','/api/rooms',{name:'Fast messages',capacity:1},a.token)).room.id;
  w=await wsConnect(base.replace('http:','ws:')+'/ws');
  w.send({type:'auth',token:a.token});w.send({type:'subscribe',roomId:id});
  await Promise.all([w.wait('auth.ok'),w.wait('room.snapshot')]);
  assert.equal(w.messages.some(msg=>msg.type==='error'),false);
 }finally{w?.ws.close();await app.close();}
});
