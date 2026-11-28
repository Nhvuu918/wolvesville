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
 const oldFull50=process.env.WV_FULL50_QA;process.env.WV_FULL50_QA='1';const old=process.env.WV_ARCHIVED_RULE_REGRESSION,oldCult=process.env.WV_RC01_LIFE02_QA;delete process.env.WV_ARCHIVED_RULE_REGRESSION;process.env.WV_RC01_LIFE02_QA='1';
 async function start(){app=createMultiplayerServer(new SqliteMultiplayerStore(file),{officialRuleTestMode:true,integrationTestMode:false});base=`http://127.0.0.1:${await app.start()}`;}
 async function api(method,path,body,user){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,...await res.json()};}
 async function account(name){const credentials={username:'normal_'+randomUUID().replaceAll('-','').slice(0,16),password:'NormalTestSecure_321',displayName:name};ok(await api('POST','/api/auth/register',credentials),201);return ok(await api('POST','/api/auth/login',credentials));}
 async function socket(user,room){const ws=new WebSocket(base.replace('http','ws')+'/ws'),messages=[];sockets.push(ws);ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));await wait(()=>messages.find(m=>m.type==='connected'));ws.send(JSON.stringify({type:'auth',token:user.token}));await wait(()=>messages.find(m=>m.type==='auth.ok'));if(room){ws.send(JSON.stringify({type:'subscribe',roomId:room}));await wait(()=>messages.find(m=>m.type==='room.snapshot'));}return {ws,messages,subscribe:async(gameId)=>{ws.send(JSON.stringify({type:'game.subscribe',gameId}));return wait(()=>messages.find(m=>m.type==='game.snapshot'&&m.game.gameId===gameId));}};}
 async function restart(){for(const s of sockets)s.close();sockets=[];await app.close();app=undefined;await start();}
 try{await start();await work({api,account,socket,restart,file});}finally{for(const s of sockets)s.close();await app?.close();if(old===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=old;if(oldCult===undefined)delete process.env.WV_RC01_LIFE02_QA;else process.env.WV_RC01_LIFE02_QA=oldCult;if(oldFull50===undefined)delete process.env.WV_FULL50_QA;else process.env.WV_FULL50_QA=oldFull50;rmSync(dir,{recursive:true,force:true});}
}

async function startLife(h, roles){
 const users=await Promise.all(roles.map((_,i)=>h.account('Cult '+i))),host=users[0],id=u=>u.profile.id;
 const room=ok(await h.api('POST','/api/rooms',{name:'RC01 candidate',capacity:roles.length},host),201).room.id,rp='/api/rooms/'+room;
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
const self=async(c,u)=>(await c.view(u)).players.find(p=>p.self).self;
const bell=async(c)=> (await c.events(c.byRole[64])).filter(e=>e.eventType==='S15_SCALE_BELL_OBSERVED');
const deaths=async(c,u)=>(await c.events(u)).filter(e=>e.eventType==='PLAYER_ELIMINATED');
test('FULL50 candidate: Cupid dead, living pair night chat and pair-only victory',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,97]),[k,a,p,b,s]=[8,25,27,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(k,'official.8.night-kill',[p]);await c.advance();
 assert.equal((await self(c,p)).life,'DEAD_FINAL');assert.equal((await c.view(a)).groupChat[0].canSend,true);assert.equal((await c.view(p)).groupChat[0].canSend,false);
 await c.day();const g=(await c.view(a)).groupChat[0];assert.equal(g.canSend,true);const msg={channel:'GROUP',groupId:g.id,text:'night pair secret',messageId:randomUUID()};
 assert.notEqual((await c.post('chat',msg,b)).status,200);assert.notEqual((await c.post('chat',msg,p)).status,200);ok(await c.post('chat',msg,a));assert((await c.events(s)).some(e=>e.payload.text===msg.text));assert(!(await c.events(b)).some(e=>e.payload.text===msg.text));
 await h.restart();assert.equal((await c.view(s)).groupChat[0].canSend,true);await c.replay();await c.advance();await c.day(b,a);await c.advance();await c.day(k,a);
 const end=await c.view(a);assert.equal(end.completed,true);assert.deepEqual(new Set(end.winnerIds),new Set([c.id(a),c.id(s)]));await c.replay();
}));

test('FULL50 M1: linked death puts seeded partner to sleep; both revive next night and publish once',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,97]),[k,a,p,b,s]=[8,25,27,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,s]);await c.act(k,'official.8.night-kill',[s]);await c.advance();
 assert.equal((await self(c,s)).life,'DEAD_FINAL');assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await bell(c)).length,1);assert.equal((await c.events(b)).filter(e=>e.eventType==='PLAYER_REVIVED').length,0);await c.replay();await h.restart();await c.day();await c.advance();
 assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await self(c,s)).life,'ALIVE');const ev=await c.events(b);assert.deepEqual(new Set(ev.filter(e=>e.eventType==='PLAYER_REVIVED').map(e=>e.payload.playerId)),new Set([c.id(a),c.id(s)]));assert.equal(ev.filter(e=>e.eventType==='PLAYER_REVIVED').length,2);assert(!ev.some(e=>e.eventType==='FULL50_COUPLE_REVIVED'));assert.equal((await bell(c)).length,1);await h.restart();await c.replay();assert.equal((await c.events(b)).filter(e=>e.eventType==='PLAYER_REVIVED').length,2);assert.equal((await c.view(a)).groupChat[0].canSend,true);
}));

test('FULL50 M1: sleeping partner dies for real after other partner is hanged; no duplicate public death or wake',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,97]),[k,a,p,b,s]=[8,25,27,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,s]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await bell(c)).length,0);
 await c.day(s,b);assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await self(c,s)).life,'DEAD_FINAL');assert.equal((await bell(c)).length,2);assert.equal((await deaths(c,b)).filter(e=>e.payload.playerId===c.id(a)).length,1);assert(!(await c.events(b)).some(e=>e.eventType==='FULL50_HIBERNATION_FATAL'));await h.restart();await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await c.events(b)).filter(e=>e.eventType==='PLAYER_REVIVED').length,0);await c.replay();
}));

test('FULL50 M1: blind Knight attack accepts any public dead seat; cancels sleeper wake without public double death',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,97]),[k,a,p,b,s]=[8,25,27,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();await c.day(p,b);
 const cap=(await c.view(k)).capabilities.find(x=>x.skillId==='official.8.night-kill');assert.equal(cap.targetPolicy.aliveOnly,false);assert(cap.eligibleTargetIds.includes(c.id(a)));assert(cap.eligibleTargetIds.includes(c.id(p)));
 await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await self(c,s)).life,'DEAD_FINAL');assert.equal((await deaths(c,b)).filter(e=>e.payload.playerId===c.id(a)).length,1);assert.equal((await c.events(b)).filter(e=>e.eventType==='PLAYER_REVIVED').length,0);await c.replay();
}));

test('FULL50 M1: witch saves seeded victim before seed activation, restart and subsequent hibernation',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,29,64,97]),[k,a,p,w,b,s]=[8,25,27,29,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,s]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.equal((await c.view(w)).phase,'WITCH_WINDOW');assert.equal((await deaths(c,b)).length,0);assert.equal((await bell(c)).length,0);await h.restart();await c.act(w,'official.29.rescue',[a]);await c.advance();
 assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await deaths(c,b)).length,0);assert.equal((await bell(c)).length,0);await c.day();await c.act(k,'official.8.night-kill',[a]);await c.advance();await c.advance();assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await bell(c)).length,0);await h.restart();await c.replay();
}));

test('FULL50 M1-02: guard prevents independent night kill and poison before seed; protection expires, seed survives',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,29,31,64,97]),[k,a,p,w,g,b,s]=[8,25,27,29,31,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,s]);await c.act(g,'official.31.guard',[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.equal((await c.view(w)).phase,'WITCH_WINDOW');assert.deepEqual((await c.events(w)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1).payload.playerIds,[]);
 await c.act(w,'official.29.poison',[a]);await c.advance();assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,0);assert.equal((await deaths(c,b)).length,0);
 for(const u of c.users)assert(!(await c.events(u)).some(e=>e.eventType==='FULL50_LIFE_GUARD_PREVENTED'));
 await h.restart();await c.replay();await c.day();assert(!(await c.view(g)).capabilities.find(x=>x.skillId==='official.31.guard').eligibleTargetIds.includes(c.id(a)));
 await c.act(k,'official.8.night-kill',[a]);await c.advance();await c.advance();assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await bell(c)).length,0);await h.restart();await c.replay();
}));

test('FULL50 M1-02: guard prevents Cupid death-follow during night, not day hanging; no false Bell death',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,29,31,64,97]),[k,a,p,w,g,b,s]=[8,25,27,29,31,64,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,s]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,s]);await c.act(g,'official.31.guard',[a]);await c.act(k,'official.8.night-kill',[s]);await c.advance();assert.deepEqual((await c.events(w)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1).payload.playerIds,[c.id(s)]);await c.advance();
 assert.equal((await self(c,s)).life,'DEAD_FINAL');assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,1);assert.equal((await deaths(c,b)).filter(e=>e.payload.playerId===c.id(a)).length,0);await c.replay();
 await c.day(a,b);assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await deaths(c,b)).filter(e=>e.payload.playerId===c.id(a)).length,1);await h.restart();await c.replay();
}));
