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
test('S26 normal mirror: private reflection, guard, second scan, both victory routes, restart and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Second','Third','Fourth'].map(n=>h.account(n))),host=users[0],id=u=>u.profile.id;
 for(const side of ['village','wolf']){
 const room=ok(await h.api('POST','/api/rooms',{name:'Mirror',capacity:4},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
 const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s26-mirror-guard'},host));
 for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,31,35,74],idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
 for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
 await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));const [w,a,g,m]=[35,25,31,74].map(i=>byRole[i]);assert(w&&a&&g&&m);
 const act=async(u,skill,t)=>{const c=command(skill,[id(t)]);ok(await post('actions',c,u));assert.equal(ok(await post('actions',c,u)).action.duplicate,true);};
 const advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));const day=async(target,voter)=>{ok(await post('voting-open'));if(target)ok(await post('votes',ballot(id(target)),voter));ok(await post('voting-close'));};
 const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;const aura=async()=> (await events(a)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').at(-1)?.payload.verdict;
 assert.notEqual((await post('actions',command('official.35.pack-bite',[id(g),id(m)]),w)).status,200);assert.notEqual((await post('actions',command('official.35.pack-bite',[id(g)]),a)).status,200);if(side==='wolf')await act(a,'official.25.inspect-role',w);await act(m,'official.74.inspect-role',w);await act(g,'official.31.guard',a);await act(w,'official.35.pack-bite',m);await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');assert((await events(m)).some(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.characterId===35));assert(!(await events(w)).some(e=>e.eventType==='ROLE_OBSERVED'));if(side==='wolf')assert.equal(await aura(),'Ác');for(const u of users){assert(!JSON.stringify(await view(u)).includes('S26_MIRROR_'));assert(!JSON.stringify(await events(u)).includes('S26_MIRROR_'));}await day();
 if(side==='village'){
 await act(g,'official.31.guard',g);await act(w,'official.35.pack-bite',g);await advance();assert.equal((await view(g)).players.find(p=>p.playerId===id(g)).publicReportedDead,false);await day();
 await act(a,'official.25.inspect-role',w);await h.restart();await advance();assert.equal(await aura(),'Thiện');await day();
 await act(a,'official.25.inspect-role',w);await advance();assert.equal(await aura(),'Ác');assert.equal((await events(a)).filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,2);assert(!(await events(g)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));await day(w,a);
 }else{await act(a,'official.25.inspect-role',w);await act(w,'official.35.pack-bite',g);await advance();assert.equal(await aura(),'Ác');if(!(await view(host)).completed)await day(a,w);}
 const final=await view(host);assert.equal(final.completed,true);assert.deepEqual(new Set(final.winnerIds),new Set((side==='village'?[a,g,m]:[w]).map(id)));for(const u of users)assert((await h.api('GET',path+'/replay',undefined,u)).replay.verified);
 await h.restart();assert.deepEqual((await view(host)).winnerIds,final.winnerIds);const ws=await h.socket(a,room);assert((await ws.subscribe(game.gameId)).game.completed);ws.ws.close();console.log('S26_NORMAL_MIRROR_EVIDENCE '+JSON.stringify({id:35,deck:[25,31,35,74],side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true,completed:true,voteChain:side==='village'}));
 }
}));
