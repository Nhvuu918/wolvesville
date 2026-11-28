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
 const game=ok(await h.api('POST',rp+'/games/start',{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,life02Composition:true,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
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
import {lifecycleComposition,lifecycleCapabilities} from '../dist/backend/src/official/lifecycle-composition.js';

test('Universal module admission is order-independent and rejects unknown/duplicate roles',()=>{
 const roles=[8,9,25,27,29,31,64,74,97];let admitted=0;
 for(let mask=0;mask<2**roles.length;mask++){
  const ids=roles.filter((_,i)=>mask&(1<<i));const expected=ids.length>=3&&ids.includes(8);
  assert.equal(lifecycleComposition(ids),expected);assert.equal(lifecycleComposition([...ids].reverse()),expected);
  if(expected){admitted++;const caps=lifecycleCapabilities(ids);assert.equal(caps.has('night-guard'),ids.includes(31));assert.equal(caps.has('consumable-night-shield'),ids.includes(9));assert.equal(caps.has('preliminary-rescue'),ids.includes(29));}
 }
 assert.equal(admitted,247);assert.equal(lifecycleComposition([8,25,25]),false);assert.equal(lifecycleComposition([8,25,10]),false);
});

test('Universal real API: guard and Bell without Cupid or Witch; no fabricated mandatory action; restart and true death',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,31,64]),[k,a,g,b]=[8,25,31,64].map(r=>c.byRole[r]);
 await c.act(b,'official.64.pair',[a,g]);await c.act(g,'official.31.guard',[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,0);assert.equal((await c.view(a)).phase,'DAY_DISCUSS');await c.replay();await h.restart();await c.day();
 await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await bell(c)).length,1);assert.equal((await bell(c))[0].payload.roleName,'Bảo Vệ');assert(!(await c.events(g)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'));await c.replay();await h.restart();await c.day(k,g);assert.equal((await c.view(g)).completed,true);await c.replay();
}));

test('Universal real API: seed, Witch and exact inspection without Cupid or Bell; rescue then hibernation and wake',async()=>harness(async h=>{
 const c=await startLife(h,[8,29,74,97]),[k,w,m,s]=[8,29,74,97].map(r=>c.byRole[r]);
 await c.act(s,'official.97.plant',[m]);await c.act(m,'official.74.inspect-role',[k]);await c.act(k,'official.8.night-kill',[m]);await c.advance();assert.equal((await c.view(w)).phase,'WITCH_WINDOW');assert((await c.events(m)).some(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.characterId===8));assert(!(await c.events(k)).some(e=>e.eventType==='ROLE_OBSERVED'));
 await c.act(w,'official.29.rescue',[m]);await c.advance();assert.equal((await self(c,m)).life,'ALIVE');await c.replay();await h.restart();await c.day();await c.act(k,'official.8.night-kill',[m]);await c.advance();await c.advance();assert.equal((await self(c,m)).life,'HIBERNATING');await c.day();await c.advance();await c.advance();assert.equal((await self(c,m)).life,'ALIVE');await c.replay();
}));

// Regression: an outside Cupid becomes a villager when both partners die.
// Exact inspection must not expose the historical Cupid role ID.
test('FULL5 #74 sees converted Cupid as villager; private feedback, restart, replay',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,74]),[k,a,p,b,m]=[8,25,27,64,74].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,b]);await c.act(m,'official.74.inspect-role',[p]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.equal((await self(c,p)).roleNameOverride,'Dân thường');assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await self(c,b)).life,'DEAD_FINAL');
 assert((await c.events(m)).some(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.characterId===27));await c.day();
 const action=await c.act(m,'official.74.inspect-role',[p]);await c.advance();
 const event=(await c.events(m)).find(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.actionId===action.actionId);assert.equal(event.payload.roleName,'Dân thường');assert.equal(event.payload.characterId,undefined);
 assert(!(await c.events(k)).some(e=>e.eventType==='ROLE_OBSERVED'));
 const feedback=async u=>ok(await h.api('GET',c.path+'/feedback',undefined,u)).feedback.items;
 const result=(await feedback(m)).find(x=>x.actionId===action.actionId);assert.deepEqual(result.resultPayload,{roleName:'Dân thường',targetId:c.id(p)});assert(!(await feedback(k)).some(x=>x.actionId===action.actionId));
 await h.restart();await c.replay();assert.deepEqual((await feedback(m)).find(x=>x.actionId===action.actionId).resultPayload,result.resultPayload);
}));

// Shared guard + snow layering, across both night collection and Witch window.
test('FULL5 #31/#9 layered protection: renewable guard first, snow retained then consumed, Bell only on true death',async()=>harness(async h=>{
 const c=await startLife(h,[8,9,25,29,31,64]),[k,n,a,w,g,b]=[8,9,25,29,31,64].map(r=>c.byRole[r]);
 await c.act(b,'official.64.pair',[a,g]);await c.act(n,'official.9.snow-protection',[a]);await c.act(g,'official.31.guard',[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.deepEqual((await c.events(w)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1).payload.playerIds,[]);await c.act(w,'official.29.poison',[a]);await c.advance();
 assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,0);await h.restart();await c.replay();await c.day();
 await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.deepEqual((await c.events(w)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1).payload.playerIds,[]);await c.advance();assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,0);await c.replay();await c.day();
 await c.act(k,'official.8.night-kill',[a]);await c.advance();await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await bell(c)).length,1);assert.equal((await bell(c))[0].payload.roleName,'Bảo Vệ');
 for(const u of c.users)assert(!(await c.events(u)).some(e=>['FULL50_LIFE_SNOW_PREVENTED','FULL50_LIFE_GUARD_PREVENTED'].includes(e.eventType)));
 await h.restart();await c.replay();
}));

test('FULL5 #9 shield survives provider death and blocks linked night death once',async()=>harness(async h=>{
 const c=await startLife(h,[8,9,25,27,64]),[k,n,a,p,b]=[8,9,25,27,64].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,b]);await c.act(n,'official.9.snow-protection',[a]);await c.act(k,'official.8.night-kill',[n]);await c.advance();assert.equal((await self(c,n)).life,'DEAD_FINAL');await c.day();
 await c.act(k,'official.8.night-kill',[b]);await c.advance();assert.equal((await self(c,b)).life,'DEAD_FINAL');assert.equal((await self(c,a)).life,'ALIVE');await h.restart();await c.replay();await c.day();
 await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');await c.replay();
}));
