import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(f){for(let i=0;i<300;i++){const x=f();if(x)return x;await sleep(10);}throw Error('WebSocket event missing');}
const ok=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r));return r;};
const command=(skillId,targetIds)=>({skillId,targetIds,actionId:randomUUID(),idempotencyKey:randomUUID()});
const ballot=targetId=>({targetId,ballotId:randomUUID(),idempotencyKey:randomUUID()});
async function harness(work){
 const dir=mkdtempSync(join(tmpdir(),'wv-normal-')),file=join(dir,'lobby.sqlite');let app,base,sockets=[];
 const old=process.env.WV_ARCHIVED_RULE_REGRESSION,oldCult=process.env.WV_OWNER_CULT_QA;delete process.env.WV_ARCHIVED_RULE_REGRESSION;process.env.WV_OWNER_CULT_QA='1';
 async function start(){app=createMultiplayerServer(new SqliteMultiplayerStore(file),{officialRuleTestMode:true,integrationTestMode:false});base=`http://127.0.0.1:${await app.start()}`;}
 async function api(method,path,body,user){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,...await res.json()};}
 async function account(name){const credentials={username:'normal_'+randomUUID().replaceAll('-','').slice(0,16),password:'NormalTestSecure_321',displayName:name};ok(await api('POST','/api/auth/register',credentials),201);return ok(await api('POST','/api/auth/login',credentials));}
 async function socket(user,room){const ws=new WebSocket(base.replace('http','ws')+'/ws'),messages=[];sockets.push(ws);ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));await wait(()=>messages.find(m=>m.type==='connected'));ws.send(JSON.stringify({type:'auth',token:user.token}));await wait(()=>messages.find(m=>m.type==='auth.ok'));if(room){ws.send(JSON.stringify({type:'subscribe',roomId:room}));await wait(()=>messages.find(m=>m.type==='room.snapshot'));}return {ws,messages,subscribe:async(gameId)=>{ws.send(JSON.stringify({type:'game.subscribe',gameId}));return wait(()=>messages.find(m=>m.type==='game.snapshot'&&m.game.gameId===gameId));}};}
 async function restart(){for(const s of sockets)s.close();sockets=[];await app.close();app=undefined;await start();}
 try{await start();await work({api,account,socket,restart,file});}finally{for(const s of sockets)s.close();await app?.close();if(old===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=old;if(oldCult===undefined)delete process.env.WV_OWNER_CULT_QA;else process.env.WV_OWNER_CULT_QA=oldCult;rmSync(dir,{recursive:true,force:true});}
}

async function startCult(h, roles){
 const users=await Promise.all(roles.map((_,i)=>h.account('Cult '+i))),host=users[0],id=u=>u.profile.id;
 const room=ok(await h.api('POST','/api/rooms',{name:'Cult candidate',capacity:roles.length},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
 const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
 const game=ok(await h.api('POST',rp+'/games/start',{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
 for(const u of users){const v=await view(u);assert.equal(v.mode,'INTEGRATION_TEST');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
 await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 const act=async(u,skill,ts)=>{const c=command(skill,ts.map(id));ok(await post('actions',c,u));assert.equal(ok(await post('actions',c,u)).action.duplicate,true);return c;};
 const advance=async()=>ok(await post('resolve',{expectedRevision:(await view(host)).revision}));
 const day=async(target,voter)=>{ok(await post('voting-open'));if(target)ok(await post('votes',ballot(id(target)),voter));ok(await post('voting-close'));};
 const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
 const replay=async()=>{for(const u of users)assert.equal(ok(await h.api('GET',path+'/replay',undefined,u)).replay.verified,true);};
 return {users,host,id,room,game,path,view,post,byRole,act,advance,day,events,replay,sockets};
}
test('Owner group-time policy: recruited cult member sends day and night; frozen ACL, WS, restart, replay',async()=>{const old=process.env.WV_GROUP_CHAT_DAY_NIGHT;process.env.WV_GROUP_CHAT_DAY_NIGHT='1';try{await harness(async h=>{
 const c=await startCult(h,[25,74,84,90]),[a,m,l]=[25,74,90].map(x=>c.byRole[x]);await c.act(l,'official.90.recruit',[a]);await c.advance();const group=(await c.view(a)).groupChat[0];assert(group.canSend);assert.equal((await c.view(m)).groupChat,undefined);const msg=text=>({channel:'GROUP',groupId:group.id,text,messageId:randomUUID()});ok(await c.post('chat',msg('owner04-day'),a));await c.day();assert.equal((await c.view(a)).phase,'NIGHT_COLLECT');assert.equal((await c.view(l)).groupChat[0].canSend,true);assert.equal((await c.view(a)).chat.canSend,false);const s=await h.socket(l,c.room);await s.subscribe(c.game.gameId);const secret=msg('owner04-night');ok(await c.post('chat',secret,a));await wait(()=>s.messages.some(x=>x.type==='game.events'&&x.events.some(e=>e.payload.text===secret.text)));assert(!(await c.events(m)).some(e=>e.payload.text===secret.text));assert.notEqual((await c.post('chat',secret,m)).status,200);await h.restart();assert((await c.view(a)).groupChat[0].canSend);assert((await c.events(l)).some(e=>e.payload.text===secret.text));assert.equal(ok(await c.post('chat',secret,a)).chat.duplicate,true);await c.replay();
 });}finally{if(old===undefined)delete process.env.WV_GROUP_CHAT_DAY_NIGHT;else process.env.WV_GROUP_CHAT_DAY_NIGHT=old;}});
