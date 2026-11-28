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
test('S27 cult gameplay: recruitment, mute group ACL, preserved role, private chat, restart and living cult victory',async()=>harness(async h=>{
 const c=await startCult(h,[25,74,84,90]);const [a,m,z,l]=[25,74,84,90].map(x=>c.byRole[x]);const self=async u=>(await c.view(u)).players.find(p=>p.self).self;
 assert.equal((await self(l)).currentFaction,'cult');assert.equal((await c.view(a)).groupChat,undefined);
 assert.notEqual((await c.post('actions',command('official.90.recruit',[c.id(a)]),m)).status,200);
 const initial=await self(a);await c.act(l,'official.90.recruit',[a]);await c.act(z,'official.84.silence',[a]);await h.restart();await c.advance();
 assert.equal((await self(a)).currentFaction,'cult');assert.equal((await self(a)).currentCharacterId,25);assert.deepEqual((await self(a)).resources,initial.resources);
 assert.equal((await c.view(a)).chat.canSend,false);assert.equal((await c.view(a)).groupChat[0].canSend,true);assert.equal((await c.view(m)).groupChat,undefined);
 const payload={channel:'GROUP',groupId:(await c.view(a)).groupChat[0].id,text:'cult secret',messageId:randomUUID()};
 assert.notEqual((await c.post('chat',{text:'public forbidden',messageId:randomUUID()},a)).status,200);
 assert.notEqual((await c.post('chat',payload,m)).status,200);
 const outside=await c.view(m),outsideEvents=await c.events(m);ok(await c.post('chat',payload,a));assert.equal(ok(await c.post('chat',payload,a)).chat.duplicate,true);assert.deepEqual(await c.view(m),outside);assert.deepEqual(await c.events(m),outsideEvents);assert((await c.events(l)).some(e=>e.payload.text===payload.text));
 assert((await c.events(a)).some(e=>e.eventType==='CULT_RECRUITED'));assert(!(await c.events(m)).some(e=>e.eventType.startsWith('CULT_')));
 await c.day();await c.act(a,'official.25.inspect-role',[l]);await c.act(l,'official.90.recruit',[m]);await c.advance();assert((await c.events(a)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));assert(!(await c.events(m)).some(e=>e.payload.text===payload.text));await c.day();
 await c.act(l,'official.90.recruit',[z]);await c.advance();assert.equal((await c.view(l)).completed,true);assert.deepEqual(new Set((await c.view(l)).winnerIds),new Set(c.users.map(c.id)));await c.replay();await h.restart();assert.equal((await c.view(a)).completed,true);const sock=await h.socket(a,c.room);assert((await sock.subscribe(c.game.gameId)).game.completed);
}));
test('S27 cult gameplay: independent target failure, single attempt, private generic feedback and leader death chain',async()=>harness(async h=>{
 const c=await startCult(h,[25,28,74,84,90]);const [a,j,m,z,l]=[25,28,74,84,90].map(x=>c.byRole[x]);
 const pre=await c.view(l);const targets=pre.capabilities.find(x=>x.skillId==='official.90.recruit');assert(targets.available);assert(!targets.targetPolicy?.eligibleTargetIds||[c.id(j),c.id(a)].every(id=>targets.targetPolicy.eligibleTargetIds.includes(id)));assert(!targets.eligibleTargetIds||[c.id(j),c.id(a)].every(id=>targets.eligibleTargetIds.includes(id)));
 await c.act(l,'official.90.recruit',[j]);assert.notEqual((await c.post('actions',command('official.90.recruit',[c.id(a)]),l)).status,200);await c.advance();const ev=(await c.events(l)).filter(e=>e.eventType==='CULT_RECRUITMENT_RESOLVED');assert.equal(ev.length,1);assert.equal(ev[0].payload.success,false);assert.deepEqual(Object.keys(ev[0].payload).sort(),['actionId','success']);assert(!(await c.events(j)).some(e=>e.eventType.startsWith('CULT_')));assert.equal((await c.view(j)).groupChat,undefined);await c.day();
 await c.act(l,'official.90.recruit',[a]);await c.advance();await c.day(l,m);assert.equal((await c.view(a)).players.find(x=>x.playerId===c.id(a)).publicReportedDead,true);assert.equal((await c.view(a)).groupChat,undefined);assert.equal((await c.events(m)).filter(e=>e.eventType==='PLAYER_ELIMINATED').length,2);await c.replay();
}));

test('S27 cult gameplay: same-night recruitment before sacrifice, final deaths, no membership restoration or fabricated winner',async()=>harness(async h=>{
 const c=await startCult(h,[25,28,74,84,90]);const [a,j,m,z,l]=[25,28,74,84,90].map(x=>c.byRole[x]);
 await c.act(l,'official.90.sacrifice',[a,j]);await c.act(l,'official.90.recruit',[a]);await h.restart();await c.advance();
 const v=await c.view(l);assert.equal(v.completed,false);assert.equal(v.players.filter(p=>p.publicReportedDead).length,2);assert.equal((await c.view(a)).groupChat,undefined);
 const events=await c.events(l);assert.equal(events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,2);assert.equal(events.find(e=>e.eventType==='CULT_RECRUITMENT_RESOLVED').payload.success,true);assert.equal(events.find(e=>e.eventType==='CULT_SACRIFICE_RESOLVED').payload.success,true);
 await c.day();await c.act(l,'official.90.recruit',[m]);await c.advance();await c.day();await c.act(l,'official.90.recruit',[z]);await c.advance();
 const end=await c.view(l);assert.equal(end.completed,false);const db=new DatabaseSync(h.file,{readOnly:true});try{const row=db.prepare('SELECT kernel_archive FROM game_sessions WHERE game_id=?').get(c.game.gameId);const state=withKernel(Buffer.from(row.kernel_archive),false,e=>e.getInternalState(c.game.gameId),true).state;assert.equal(state.resolutionGate.status,'BLOCKED_BY_RULE');assert.equal(state.resolutionGate.reason,'CULT_DEAD_WINNER_POLICY_UNRESOLVED');}finally{db.close();}await c.replay();
}));
