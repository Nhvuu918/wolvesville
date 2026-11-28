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
 const oldDev=process.env.WV_LIFE_MODULES_DEV_NORMAL;process.env.WV_LIFE_MODULES_DEV_NORMAL='1';const oldFull50=process.env.WV_FULL50_QA;delete process.env.WV_FULL50_QA;const old=process.env.WV_ARCHIVED_RULE_REGRESSION,oldCult=process.env.WV_RC01_LIFE02_QA;delete process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_RC01_LIFE02_QA;
 async function start(){app=createMultiplayerServer(new SqliteMultiplayerStore(file),{officialRuleTestMode:false,integrationTestMode:false});base=`http://127.0.0.1:${await app.start()}`;}
 async function api(method,path,body,user){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(user?{Authorization:'Bearer '+user.token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,...await res.json()};}
 async function account(name){const credentials={username:'normal_'+randomUUID().replaceAll('-','').slice(0,16),password:'NormalTestSecure_321',displayName:name};ok(await api('POST','/api/auth/register',credentials),201);return ok(await api('POST','/api/auth/login',credentials));}
 async function socket(user,room){const ws=new WebSocket(base.replace('http','ws')+'/ws'),messages=[];sockets.push(ws);ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));await wait(()=>messages.find(m=>m.type==='connected'));ws.send(JSON.stringify({type:'auth',token:user.token}));await wait(()=>messages.find(m=>m.type==='auth.ok'));if(room){ws.send(JSON.stringify({type:'subscribe',roomId:room}));await wait(()=>messages.find(m=>m.type==='room.snapshot'));}return {ws,messages,subscribe:async(gameId)=>{ws.send(JSON.stringify({type:'game.subscribe',gameId}));return wait(()=>messages.find(m=>m.type==='game.snapshot'&&m.game.gameId===gameId));}};}
 async function restart(){for(const s of sockets)s.close();sockets=[];await app.close();app=undefined;await start();}
 try{await start();await work({api,account,socket,restart,file});}finally{for(const s of sockets)s.close();await app?.close();if(old===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=old;if(oldCult===undefined)delete process.env.WV_RC01_LIFE02_QA;else process.env.WV_RC01_LIFE02_QA=oldCult;if(oldFull50===undefined)delete process.env.WV_FULL50_QA;else process.env.WV_FULL50_QA=oldFull50;if(oldDev===undefined)delete process.env.WV_LIFE_MODULES_DEV_NORMAL;else process.env.WV_LIFE_MODULES_DEV_NORMAL=oldDev;rmSync(dir,{recursive:true,force:true});}
}

import {lifeDevelopmentComposition,lifeDevelopmentKey,listLifeDevelopmentCompositions} from '../dist/backend/src/official/lifecycle-composition.js';
import {listNormalDecks} from '../dist/backend/src/game/normal-decks.js';
const self=async(c,u)=>(await c.view(u)).players.find(p=>p.self).self;
async function startNormal(h,roles){
 const users=await Promise.all(roles.map((_,i)=>h.account('Dev '+i))),host=users[0],id=u=>u.profile.id;
 const room=ok(await h.api('POST','/api/rooms',{name:'Development normal',capacity:roles.length},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
 const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
 const deck=lifeDevelopmentKey(roles);ok(await h.api('POST',rp+'/configure',{deck},host));
 const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:randomUUID()};
 assert.equal((await h.api('POST',rp+'/games/start',start,host)).status,409);
 for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 assert.equal((await h.api('POST',rp+'/games/start',{...start,life02Composition:true},host)).status,409);
 const game=ok(await h.api('POST',rp+'/games/start',start,host),201).game,path='/api/games/'+game.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
 for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.developmentScope,'LIFE-MODULES-1-GUARD-OBSERVATION');assert.equal(v.canQaAdvanceDay,false);assert(v.players.every(p=>p.playerId===id(u)?!!p.self:!p.self));byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
 await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 const act=async(u,skill,ts)=>{const c=command(skill,ts.map(id));ok(await post('actions',c,u));assert.equal(ok(await post('actions',c,u)).action.duplicate,true);};
 const advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));
 const day=async(target,voter)=>{ok(await post('voting-open'));if(target)ok(await post('votes',{...ballot(id(target)),expectedRevision:(await view(voter)).revision},voter));ok(await post('voting-close'));};
 const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
 const replay=async()=>{for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert.equal(r.verified,true);assert.equal(r.roleAssignmentsVerified,true);}};
 return {users,host,id,room,game,path,view,post,byRole,act,advance,day,events,replay};
}
const rolesets=[[8,25,31],[8,31,74],[8,25,31,74],[8,25,31,64],[8,31,64,74],[8,25,31,64,74]];
for(const roles of rolesets)test('Universal DEV normal: '+roles.join(',')+' guard, observer, real vote, restart and ACL',async()=>harness(async h=>{
 const c=await startNormal(h,roles),k=c.byRole[8],g=c.byRole[31],b=c.byRole[64],a=c.byRole[25]??c.byRole[74];
 assert.equal((await c.post('resolve',{},c.host)).status,403);
 if(b)await c.act(b,'official.64.pair',[a,g]);await c.act(g,'official.31.guard',[a]);await c.act(k,'official.8.night-kill',[a]);
 for(const r of [25,74].filter(r=>roles.includes(r)))await c.act(c.byRole[r],`official.${r}.inspect-role`,[k]);
 await c.advance();assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await c.view(a)).phase,'DAY_DISCUSS');
 for(const r of [25,74].filter(r=>roles.includes(r))){const event=r===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED';assert((await c.events(c.byRole[r])).some(e=>e.eventType===event));assert(!(await c.events(k)).some(e=>e.eventType===event));}
 if(b)assert(!(await c.events(b)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'));await c.replay();await h.restart();await c.day();
 await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');if(b){assert((await c.events(b)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'&&e.payload.roleName==='Bảo Vệ'));assert(!(await c.events(g)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'));}
 await c.day(k,g);assert.equal((await c.view(g)).completed,true);assert((await c.view(g)).winnerIds.includes(c.id(g)));assert(!(await c.view(g)).winnerIds.includes(c.id(k)));await c.replay();await h.restart();assert.equal((await c.view(g)).completed,true);
 // rollback of admission is not a rewrite of a historical game.
 delete process.env.WV_LIFE_MODULES_DEV_NORMAL;assert.equal(listLifeDevelopmentCompositions().length,0);assert.equal((await c.view(g)).completed,true);await c.replay();
 console.log('LIFE_DEV_NORMAL_EVIDENCE '+JSON.stringify({roles,mode:'NORMAL_GAMEPLAY',scope:'LIFE-MODULES-1-GUARD-OBSERVATION',privacy:true,replay:true,restart:true,rollback:true}));
}));
test('Universal DEV admission defaults off, disabled in production, rejects unsupported roles',()=>{
 const old=process.env.WV_LIFE_MODULES_DEV_NORMAL,env=process.env.NODE_ENV,archived=process.env.WV_ARCHIVED_RULE_REGRESSION;try{delete process.env.WV_LIFE_MODULES_DEV_NORMAL;assert.equal(listNormalDecks().length,16);process.env.WV_LIFE_MODULES_DEV_NORMAL='1';delete process.env.WV_ARCHIVED_RULE_REGRESSION;assert.equal(listLifeDevelopmentCompositions().length,6);assert(!lifeDevelopmentComposition([8,25,31,97]));process.env.NODE_ENV='production';assert.equal(listLifeDevelopmentCompositions().length,0);assert.equal(listNormalDecks().length,16);}finally{if(old===undefined)delete process.env.WV_LIFE_MODULES_DEV_NORMAL;else process.env.WV_LIFE_MODULES_DEV_NORMAL=old;if(env===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=env;if(archived===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=archived;}
});
