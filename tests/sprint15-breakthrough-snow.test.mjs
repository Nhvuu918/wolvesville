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
async function snowMatch(h,users){
 const host=users[0],ids=[8,9],room=ok(await h.api('POST','/api/rooms',{name:'Snow acceptance',capacity:2},host),201).room.id,rp='/api/rooms/'+room;
 ok(await h.api('POST',rp+'/join',{},users[1]));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s15-deep-knight-snow'},host));
 for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
 for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
 await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 const id=r=>byRole[r].profile.id,v=()=>view(host),act=(r,target)=>post('actions',command(r===8?'official.8.night-kill':'official.9.snow-protection',[id(target)]),byRole[r]);
 const advance=async()=>ok(await post('advance-night',{expectedRevision:(await v()).revision}));
 const day=async()=>{ok(await post('voting-open'));ok(await post('voting-close'));assert.equal((await v()).phase,'NIGHT_COLLECT');};
 const cap=async()=> (await view(byRole[9])).capabilities.find(c=>c.skillId==='official.9.snow-protection');
 const replay=async()=>{for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}};
 const win=async r=>{const x=await v();assert.equal(x.completed,true);assert.deepEqual(x.winnerIds,[id(r)]);};
 const vote=async(r,t)=>ok(await post('votes',{...ballot(t===''?'':id(t)),expectedRevision:(await view(byRole[r])).revision},byRole[r]));
 return {id,v,view,act,advance,day,cap,replay,win,vote,post,byRole,sockets,room,rp,path,gameId:game.gameId};
}
test('Breakthrough snow pair: 16 final ballots in each of unshielded and protected states; all final outcomes',()=>harness(async h=>{
 const users=await Promise.all([h.account('Host'),h.account('Guest')]);let count=0;
 for(const shield of [false,true])for(const x of [null,'',8,9])for(const y of [null,'',8,9]){
  const m=await snowMatch(h,users);if(shield)ok(await m.act(9,9));await m.advance();ok(await m.post('voting-open'));if(x!==null)await m.vote(8,x);if(y!==null)await m.vote(9,y);ok(await m.post('voting-close'));
  const a=[x,y].filter(t=>t===8).length,b=[x,y].filter(t=>t===9).length;if(a===b){assert.equal((await m.v()).completed,false);assert.equal((await m.v()).round,2);}else await m.win(a>b?9:8);await m.replay();for(const s of m.sockets)s.ws.close();count++;
 }console.log('BREAKTHROUGH_SNOW_BALLOTS '+count);
}));
test('Breakthrough snow pair: self/other protection, skipped action, reverse order, two-night lifetime, consumption, exhaustion and replay',()=>harness(async h=>{
 const users=await Promise.all([h.account('Host'),h.account('Guest')]);
 for(const scenario of ['no-shield','other-shield','same-night','reverse-order','next-night','expired','both-used']){
  const m=await snowMatch(h,users);assert.deepEqual(new Set((await m.cap()).eligibleTargetIds),new Set([m.id(8),m.id(9)]));assert.notEqual((await m.act(8,8)).status,200);
  if(scenario==='no-shield'){ok(await m.act(8,9));await m.advance();await m.win(8);}
  if(scenario==='other-shield'){ok(await m.act(9,8));ok(await m.act(8,9));await m.advance();await m.win(8);}
  if(['same-night','reverse-order'].includes(scenario)){
   if(scenario==='reverse-order')ok(await m.act(8,9));ok(await m.act(9,9));if(scenario==='same-night')ok(await m.act(8,9));await m.advance();assert.equal((await m.v()).completed,false);assert.notEqual((await m.act(9,8)).status,200);await m.day();assert.deepEqual((await m.cap()).eligibleTargetIds,[m.id(8)]);assert.notEqual((await m.act(9,9)).status,200);ok(await m.act(8,9));await m.advance();await m.win(8);
  }
  if(['next-night','expired','both-used'].includes(scenario)){
   ok(await m.act(9,9));await m.advance();await m.day();assert.deepEqual((await m.cap()).eligibleTargetIds,[m.id(8)]);
   if(scenario==='next-night'){ok(await m.act(8,9));await m.advance();assert.equal((await m.v()).completed,false);await m.day();}
   else {if(scenario==='both-used')ok(await m.act(9,8));await m.advance();await m.day();if(scenario==='both-used'){assert.equal((await m.cap()).available,false);assert.deepEqual((await m.cap()).eligibleTargetIds,[]);assert.notEqual((await m.act(9,8)).status,200);}}
   ok(await m.act(8,9));await m.advance();await m.win(8);
  }
  await m.replay();for(const s of m.sockets)s.ws.close();console.log('BREAKTHROUGH_SNOW_PATH '+scenario);
 }
}));
test('Breakthrough snow pair: retry, outsider rejection, active-layer restart and coordinator handoff preserve protection and winner',()=>harness(async h=>{
 const users=await Promise.all([h.account('Host'),h.account('Successor')]),outsider=await h.account('Outside'),[host,guest]=users,m=await snowMatch(h,users);
 assert.equal((await h.api('GET',m.path,undefined,outsider)).status,403);assert.equal((await m.post('actions',command('official.9.snow-protection',[m.id(9)]),outsider)).status,403);assert.equal((await m.post('resolve')).status,403);
 const shield=command('official.9.snow-protection',[m.id(8)]);ok(await m.post('actions',shield,m.byRole[9]));assert.equal(ok(await m.post('actions',shield,m.byRole[9])).action.duplicate,true);await m.advance();await m.day();assert.deepEqual((await m.cap()).eligibleTargetIds,[m.id(9)]);
 const shieldSelf=command('official.9.snow-protection',[m.id(9)]);ok(await m.post('actions',shieldSelf,m.byRole[9]));assert.equal(ok(await m.post('actions',shieldSelf,m.byRole[9])).action.duplicate,true);await m.advance();assert.equal((await m.v()).phase,'DAY_DISCUSS');
 await h.restart();const a=await h.socket(host,m.room),b=await h.socket(guest,m.room);await a.subscribe(m.gameId);await b.subscribe(m.gameId);assert.equal((await m.v()).phase,'DAY_DISCUSS');a.ws.close();await wait(()=>b.messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===host.profile.id&&!p.online)));
 const revision=ok(await h.api('GET',m.rp,undefined,guest)).room.revision;ok(await m.post('claim-coordinator',{expectedRoomRevision:revision},guest));assert.equal((await m.view(guest)).coordinatorId,guest.profile.id);assert.equal((await m.post('voting-open',{},host)).status,403);ok(await m.post('voting-open',{},guest));ok(await m.post('voting-close',{},guest));assert.equal((await m.view(guest)).round,3);
 assert.equal((await m.cap()).available,false);ok(await m.act(8,9));ok(await m.post('advance-night',{expectedRevision:(await m.view(guest)).revision},guest));assert.equal((await m.v()).completed,false);ok(await m.post('voting-open',{},guest));await m.vote(9,8);ok(await m.post('voting-close',{},guest));await m.win(9);await m.replay();
 console.log('BREAKTHROUGH_SNOW_HANDOFF '+JSON.stringify({mode:'NORMAL_GAMEPLAY',deck:[8,9],restart:true,retry:true,privacy:true,replay:true,handoff:true}));
}));
