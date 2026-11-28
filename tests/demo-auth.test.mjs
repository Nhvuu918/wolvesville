import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';

async function harness(enabled=true,store=new SqliteMultiplayerStore()){
 const app=createMultiplayerServer(store,{demoAuthEnabled:enabled});const port=await app.start();
 const base=`http://127.0.0.1:${port}`;
 async function req(path,method='GET',data,token,extra={}){
  const headers={...(data!==undefined?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{}) ,...extra};
  const r=await fetch(base+path,{method,headers,body:data===undefined?undefined:JSON.stringify(data)});
  return {status:r.status,...await r.json()};
 }
 return {app,store,base,req};
}
async function makeRegular(h,username='realuser'){
 const pass='RegularPassword123!';
 const r=await h.req('/api/auth/register','POST',{username,password:pass});assert.equal(r.status,201);
 const l=await h.req('/api/auth/login','POST',{username,password:pass});assert.equal(l.status,200);
 return l;
}
async function wsConnect(url){const ws=new WebSocket(url),messages=[];
 ws.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch{}});
 await new Promise((r,j)=>{ws.addEventListener('open',r,{once:true});ws.addEventListener('error',j,{once:true});});
 return {ws,messages,send:obj=>ws.send(JSON.stringify(obj)),wait:async type=>{const until=Date.now()+2000;
  while(Date.now()<until){const found=messages.find(x=>x.type===type);if(found)return found;await new Promise(r=>setTimeout(r,15));}throw Error('WS timeout '+type);}};
}
test('DEMO-001: endpoint disabled by default; no account/session created',async()=>{
 const h=await harness(false);try{const r=await h.req('/api/auth/demo','POST',{});assert.equal(r.status,403);assert.equal(r.error.code,'DEMO_DISABLED');
  assert.equal((await h.req('/health')).demoAuthEnabled,false);
 }finally{await h.app.close();}
});
test('DEMO-002: independent sessions with valid public IDs, no credential in response',async()=>{
 const h=await harness();try{
  const [a,b]=await Promise.all([h.req('/api/auth/demo','POST',{}),h.req('/api/auth/demo','POST',{})]);
  assert.equal(a.status,201);assert.equal(b.status,201);
  assert.notEqual(a.profile.id,b.profile.id);assert.notEqual(a.profile.publicId,b.profile.publicId);assert.notEqual(a.token,b.token);
  assert.match(a.profile.publicId,/^WV-[0-9A-F]{12}$/);assert.equal(a.profile.isDemo,true);
  assert.ok(a.expiresAt-Date.now()<=2*60*60*1000);
  for(const field of ['username','passwordHash','password','seed','admin'])assert.equal(Object.hasOwn(a.profile,field),false);
  assert.equal((await h.req('/api/auth/me','GET',undefined,a.token)).profile.isDemo,true);
  assert.equal((await h.req('/api/auth/me','GET',undefined,b.token)).profile.id,b.profile.id);
 }finally{await h.app.close();}
});
test('DEMO-003: demo account is server-side, can join lobby, access is isolated',async()=>{
 const h=await harness();try{
  const a=await h.req('/api/auth/demo','POST',{}),b=await h.req('/api/auth/demo','POST',{});
  const made=await h.req('/api/rooms','POST',{name:'Demo lounge',capacity:3},a.token);assert.equal(made.status,201);
  assert.equal(made.room.hostId,a.profile.id);
  const id=made.room.id;
  assert.equal((await h.req(`/api/rooms/${id}`,'GET',undefined,b.token)).status,403);
  const joined=await h.req(`/api/rooms/${id}/join`,'POST',{},b.token);assert.equal(joined.status,200);assert.equal(joined.room.members.length,2);
  assert.equal((await h.req(`/api/rooms/${id}/lock`,'POST',{},b.token)).status,403);
  assert.equal((await h.req(`/api/rooms/${id}/lock`,'POST',{},a.token)).status,200);
 }finally{await h.app.close();}
});
test('DEMO-004: logout revokes token without affecting independent demos',async()=>{
 const h=await harness();try{
  const a=await h.req('/api/auth/demo','POST',{}),b=await h.req('/api/auth/demo','POST',{});
  assert.equal((await h.req('/api/auth/logout','POST',{},a.token)).status,200);
  assert.equal((await h.req('/api/auth/me','GET',undefined,a.token)).status,401);
  assert.equal((await h.req('/api/auth/me','GET',undefined,b.token)).status,200);
 }finally{await h.app.close();}
});
test('DEMO-005: rate limit creation on same IP; no unbounded new accounts',async()=>{
 const h=await harness();try{
  for(let i=0;i<6;i++)assert.equal((await h.req('/api/auth/demo','POST',{})).status,201);
  const r=await h.req('/api/auth/demo','POST',{});
  assert.equal(r.status,429);assert.equal(r.error.code,'DEMO_RATE_LIMITED');
 }finally{await h.app.close();}
});
test('DEMO-006: wrong origin/invalid media type cannot provision demo',async()=>{
 const h=await harness();try{
  assert.equal((await h.req('/api/auth/demo','POST',{},undefined,{Origin:'https://unrelated.example'})).status,403);
  const r=await h.req('/api/auth/demo','POST',undefined);assert.equal(r.status,415);
  assert.equal((await h.req('/api/auth/me')).status,401);
 }finally{await h.app.close();}
});
test('DEMO-007: normal register/login unchanged and never becomes demo',async()=>{
 const h=await harness();try{
  const regular=await makeRegular(h);assert.equal((await h.req('/api/auth/me','GET',undefined,regular.token)).profile.isDemo,false);
  const demo=await h.req('/api/auth/demo','POST',{});assert.equal(demo.status,201);
  assert.equal((await h.req('/api/auth/me','GET',undefined,regular.token)).status,200);
  assert.equal((await h.req('/api/auth/login','POST',{username:'moonwalker',password:'demo123'})).status,401);
 }finally{await h.app.close();}
});
test('DEMO-008: SQLite restart preserves demo token and marker, expiration cleanup is safe',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-demo-')),filename=join(dir,'game.sqlite');
 let h,h2;try{
  h=await harness(true,new SqliteMultiplayerStore(filename));
  const inactive=await h.req('/api/auth/demo','POST',{}),active=await h.req('/api/auth/demo','POST',{});
  const regular=await makeRegular(h,'remaininguser');
  const r=await h.req('/api/rooms','POST',{name:'Historic room',capacity:2},active.token);assert.equal(r.status,201);
  await h.app.close();h=null;
  h2=await harness(true,new SqliteMultiplayerStore(filename));
  assert.equal((await h2.req('/api/auth/me','GET',undefined,inactive.token)).profile.id,inactive.profile.id);
  assert.equal((await h2.req('/api/auth/me','GET',undefined,active.token)).profile.id,active.profile.id);
  const result=await h2.store.cleanupExpiredDemoAccounts(Date.now()+24*60*60*1000);
  assert.equal(result.deleted,1);assert.equal(result.retained,1);
  assert.equal(await h2.store.accountById(inactive.profile.id),undefined);
  assert.ok(await h2.store.accountById(active.profile.id));
  assert.ok(await h2.store.accountById(regular.profile.id));
  assert.equal((await h2.req('/api/auth/me','GET',undefined,active.token)).status,401);
 }finally{if(h2)await h2.app.close();if(h)await h.app.close();rmSync(dir,{recursive:true,force:true});}
});
test('DEMO-009: WebSocket auth is scoped to each demo session and room membership',async()=>{
 const h=await harness();let wa,wb;try{
  const a=await h.req('/api/auth/demo','POST',{}),b=await h.req('/api/auth/demo','POST',{});
  const made=await h.req('/api/rooms','POST',{name:'Moon Demo',capacity:2},a.token);
  wa=await wsConnect(h.base.replace('http:','ws:')+'/ws');wb=await wsConnect(h.base.replace('http:','ws:')+'/ws');
  wa.send({type:'auth',token:a.token});wb.send({type:'auth',token:b.token});
  assert.equal((await wa.wait('auth.ok')).profile.id,a.profile.id);
  assert.equal((await wb.wait('auth.ok')).profile.id,b.profile.id);
  wb.send({type:'subscribe',roomId:made.room.id});assert.equal((await wb.wait('error')).error.code,'NOT_MEMBER');
  wa.send({type:'subscribe',roomId:made.room.id});assert.equal((await wa.wait('room.snapshot')).room.id,made.room.id);
 }finally{wa?.ws.close();wb?.ws.close();await h.app.close();}
});
test('DEMO-010: production NODE_ENV prevents demo even if enable flag supplied',async()=>{
 const before=process.env.NODE_ENV;process.env.NODE_ENV='production';let h;
 try{h=await harness(true);const r=await h.req('/api/auth/demo','POST',{});assert.equal(r.status,403);assert.equal(r.error.code,'DEMO_DISABLED');}
 finally{if(h)await h.app.close();if(before===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=before;}
});
test('DEMO-011: original 97-character JSON and approved reference remain available',()=>{
 const chars=JSON.parse(readFileSync(new URL('../data/character.json',import.meta.url),'utf8'));
 assert.equal(chars.length,97);assert.equal(new Set(chars.map(x=>x.id)).size,97);
});
