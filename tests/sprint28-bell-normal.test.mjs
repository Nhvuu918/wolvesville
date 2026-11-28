import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(f){for(let i=0;i<300;i++){const x=f();if(x)return x;await sleep(10);}throw Error('WebSocket event missing');}
const ok=(r,status=200)=>{assert.equal(r.status,status,JSON.stringify(r));return r;};
const command=(skillId,targetIds)=>({skillId,targetIds,actionId:randomUUID(),idempotencyKey:randomUUID()});
const ballot=targetId=>({targetId,ballotId:randomUUID(),idempotencyKey:randomUUID()});
async function harness(work){
 const dir=mkdtempSync(join(tmpdir(),'wv-normal-')),file=join(dir,'lobby.sqlite');let app,base,sockets=[];
 const old=process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_ARCHIVED_RULE_REGRESSION;
 async function start(){app=createMultiplayerServer(new SqliteMultiplayerStore(file),{officialRuleTestMode:false,integrationTestMode:false});base=`http://127.0.0.1:${await app.start()}`;}
 async function api(method,path,body,user){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,...await res.json()};}
 async function account(name){const credentials={username:'normal_'+randomUUID().replaceAll('-','').slice(0,16),password:'NormalTestSecure_321',displayName:name};ok(await api('POST','/api/auth/register',credentials),201);return ok(await api('POST','/api/auth/login',credentials));}
 async function socket(user,room){const ws=new WebSocket(base.replace('http','ws')+'/ws'),messages=[];sockets.push(ws);ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));await wait(()=>messages.find(m=>m.type==='connected'));ws.send(JSON.stringify({type:'auth',token:user.token}));await wait(()=>messages.find(m=>m.type==='auth.ok'));if(room){ws.send(JSON.stringify({type:'subscribe',roomId:room}));await wait(()=>messages.find(m=>m.type==='room.snapshot'));}return {ws,messages,subscribe:async(gameId)=>{ws.send(JSON.stringify({type:'game.subscribe',gameId}));return wait(()=>messages.find(m=>m.type==='game.snapshot'&&m.game.gameId===gameId));}};}
 async function restart(){for(const s of sockets)s.close();sockets=[];await app.close();app=undefined;await start();}
 try{await start();await work({api,account,socket,restart,file});}finally{for(const s of sockets)s.close();await app?.close();if(old===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=old;rmSync(dir,{recursive:true,force:true});}
}
async function startNormal(h,deck,roles){
 const users=await Promise.all(roles.map((_,i)=>h.account('Bell '+i))),host=users[0],id=u=>u.profile.id;
 const room=ok(await h.api('POST','/api/rooms',{name:'Bell normal',capacity:roles.length},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 const act=async(u,skill,ts)=>{const c=command(skill,ts.map(id));ok(await post('actions',c,u));assert.equal(ok(await post('actions',c,u)).action.duplicate,true);};const advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));const day=async(target,voter)=>{ok(await post('voting-open'));if(target)ok(await post('votes',ballot(id(target)),voter));ok(await post('voting-close'));};const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;const bell=async()=> (await events(byRole[64])).filter(e=>e.eventType==='S15_SCALE_BELL_OBSERVED');
 const proof=async winnerRoles=>{const v=await view(host);assert.equal(v.completed,true);assert.deepEqual(new Set(v.winnerIds),new Set(winnerRoles.map(r=>id(byRole[r]))));for(const u of users){assert((await h.api('GET',path+'/replay',undefined,u)).replay.verified);if(u!==byRole[64])assert(!(await events(u)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'));}await h.restart();assert.deepEqual((await view(host)).winnerIds,v.winnerIds);const ws=await h.socket(byRole[64],room);assert((await ws.subscribe(game.gameId)).game.completed);console.log('S28_NORMAL_BELL_EVIDENCE '+JSON.stringify({deck:roles,mode:'NORMAL_GAMEPLAY',completed:true,privacy:true,replay:true,restart:true}));};return {id,byRole,view,post,act,advance,day,events,bell,proof};
}
test('S28 normal bell: real double bite and one private observation batch before victory',async()=>harness(async h=>{
 const c=await startNormal(h,'s28-bell-leader',[25,48,64,74]),[a,w,b,m]=[25,48,64,74].map(r=>c.byRole[r]);
 assert.notEqual((await c.post('actions',command('official.64.pair',[c.id(a)]),b)).status,200);assert.notEqual((await c.post('actions',command('official.64.pair',[c.id(b),c.id(a)]),b)).status,200);await c.act(b,'official.64.pair',[a,m]);await c.act(w,'official.48.pack-bite',[a,m]);await h.restart();await c.advance();assert.deepEqual(new Set((await c.bell()).map(e=>e.payload.roleName)),new Set(['Tiên Tri','Tiên Tri Huyền Bí']));assert.equal((await c.bell()).length,2);await c.proof([48]);
}));
test('S28 normal bell: linked simultaneous death, actual vote, spent observation and village victory',async()=>harness(async h=>{
 const c=await startNormal(h,'s28-bell-linked',[15,25,64,74]),[k,a,b,m]=[15,25,64,74].map(r=>c.byRole[r]);await c.act(b,'official.64.pair',[a,m]);await c.act(k,'official.15.single-kill',[a,m]);await c.advance();assert.equal((await c.bell()).length,0);await c.day(a,b);assert.equal((await c.bell()).length,2);assert.deepEqual(new Set((await c.bell()).map(e=>e.payload.roleName)),new Set(['Tiên Tri','Tiên Tri Huyền Bí']));assert.notEqual((await c.post('actions',command('official.64.pair',[c.id(k),c.id(b)]),b)).status,200);await c.advance();await c.day(k,b);await c.proof([25,64,74]);
}));
test('S28 normal bell: previously revived target can be paired, repeated final death, privacy and village victory',async()=>harness(async h=>{
 const c=await startNormal(h,'s28-bell-revival',[8,25,26,64]),[k,a,m,b]=[8,25,26,64].map(r=>c.byRole[r]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await c.bell()).length,0);await c.day();await c.act(m,'official.26.revive',[a]);await c.advance();assert.equal((await c.view(a)).players.find(p=>p.self).publicReportedDead,false);await c.day();await c.act(b,'official.64.pair',[a,m]);await c.act(k,'official.8.night-kill',[a]);await h.restart();await c.advance();assert.equal((await c.bell()).length,1);assert.equal((await c.bell())[0].payload.roleName,'Thầy Đồng');assert.equal((await c.view(b)).capabilities.find(x=>x.skillId==='official.64.pair').available,false);await c.day(k,b);await c.proof([25,26,64]);
}));
test('S28 normal bell: owner dies in the same batch, no private observation or resource reuse',async()=>harness(async h=>{
 const c=await startNormal(h,'s28-bell-leader',[25,48,64,74]),[a,w,b,m]=[25,48,64,74].map(r=>c.byRole[r]);await c.act(b,'official.64.pair',[a,m]);await c.act(w,'official.48.pack-bite',[a,b]);await c.advance();assert.equal((await c.bell()).length,0);assert.equal((await c.view(b)).capabilities.find(x=>x.skillId==='official.64.pair').available,false);await c.proof([48]);
}));
test('S28 normal bell: replace pair across nights, dead target invalid, first observation only',async()=>harness(async h=>{
 const c=await startNormal(h,'s28-bell-revival',[8,25,26,64]),[k,a,m,b]=[8,25,26,64].map(r=>c.byRole[r]);await c.act(b,'official.64.pair',[a,m]);await c.advance();assert.equal((await c.bell()).length,0);await c.day();await c.act(b,'official.64.pair',[k,m]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await c.bell()).length,0);await c.day();assert.notEqual((await c.post('actions',command('official.64.pair',[c.id(a),c.id(m)]),b)).status,200);await c.act(k,'official.8.night-kill',[m]);await c.advance();assert.equal((await c.bell()).length,1);assert.equal((await c.bell())[0].payload.roleName,'Kỵ Sĩ Không Đầu');await c.day(k,b);await c.proof([25,26,64]);
}));
