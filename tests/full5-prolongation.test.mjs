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
// Q13-07, Q13-12 and VH26; no fixture injection or forced assignment.
const cap=async(c,u,skill)=>(await c.view(u)).capabilities.find(x=>x.skillId===skill);
const ferry='official.51.ferry';
test('FULL5 Q13-07: prolonged life keeps rights and seed; day close triggers hibernation, later wake and real Bell observation',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,51,64,97]),[k,a,f,b,s]=[8,25,51,64,97].map(r=>c.byRole[r]);
 assert.equal((await cap(c,f,ferry)).remainingUses,2);
 assert.notEqual((await c.post('actions',command(ferry,[c.id(f)]),f)).status,200);
 assert.notEqual((await c.post('actions',command(ferry,[c.id(a),c.id(a)]),f)).status,200);
 await c.act(f,ferry,[a,b]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,f]);await c.act(k,'official.8.night-kill',[a]);await c.advance();
 assert.equal((await self(c,a)).life,'PROLONGED');assert.equal((await c.view(b)).players.find(p=>p.playerId===c.id(a)).publicReportedDead,false);assert.equal((await bell(c)).length,0);assert.equal((await deaths(c,b)).length,0);
 assert.equal((await c.view(a)).chat.canSend,true);const msg={channel:'PUBLIC',text:'still alive today',messageId:randomUUID()};ok(await c.post('chat',msg,a));assert((await c.events(b)).some(e=>e.payload.text===msg.text));
 for(const u of c.users)assert(!(await c.events(u)).some(e=>e.eventType==='FULL5_PROLONG_STARTED'));
 await h.restart();assert.equal((await self(c,a)).life,'PROLONGED');await c.replay();ok(await c.post('voting-open'));assert.equal((await c.view(a)).voting.canVote,true);ok(await c.post('votes',ballot(c.id(b)),a));ok(await c.post('votes',ballot(c.id(f)),b));ok(await c.post('voting-close'));
 assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await bell(c)).length,0);assert.equal((await deaths(c,b)).length,1);
 assert.equal((await cap(c,f,ferry)).remainingUses,1);assert.equal((await cap(c,f,ferry)).maxTargets,1);assert(!(await cap(c,f,ferry)).eligibleTargetIds.includes(c.id(a)));await h.restart();await c.replay();await c.advance();assert.equal((await self(c,a)).life,'ALIVE');await c.day();await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await bell(c)).length,1);assert.equal((await bell(c))[0].payload.roleName,'Người Lái Đò');await c.replay();
}));

test('FULL5 Q13-12: Witch rescue wins over ferry and seed; no charge until actual extension',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,29,51,64,97]),[k,a,w,f,b,s]=[8,25,29,51,64,97].map(r=>c.byRole[r]);
 await c.act(f,ferry,[a]);await c.act(s,'official.97.plant',[a]);await c.act(b,'official.64.pair',[a,f]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await c.view(w)).phase,'WITCH_WINDOW');assert((await c.events(w)).filter(e=>e.eventType==='S15_DEEP_WITCH_PRELIMINARY').at(-1).payload.playerIds.includes(c.id(a)));await c.act(w,'official.29.rescue',[a]);await c.advance();assert.equal((await self(c,a)).life,'ALIVE');assert.equal((await bell(c)).length,0);await c.day();assert.equal((await cap(c,f,ferry)).remainingUses,2);
 await c.act(f,ferry,[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();await c.advance();assert.equal((await self(c,a)).life,'PROLONGED');await c.day();assert.equal((await self(c,a)).life,'HIBERNATING');assert.equal((await cap(c,f,ferry)).remainingUses,1);await h.restart();await c.replay();
}));

test('FULL5 VH26: expiry plus hanging closes ledger before victory; prolonged villager counted until day end',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,51]),[k,a,f]=[8,25,51].map(r=>c.byRole[r]);
 await c.act(f,ferry,[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'PROLONGED');assert.equal((await c.view(k)).completed,false);
 await c.day(f,k);assert.equal((await self(c,a)).life,'DEAD_FINAL');assert.equal((await self(c,f)).life,'DEAD_FINAL');assert.equal((await c.view(k)).completed,true);assert.deepEqual((await c.view(k)).winnerIds,[c.id(k)]);await h.restart();await c.replay();
}));
test('FULL5 F01: Ferryman anonymous night channel, reported-dead address without sleeper delivery, retry and replay',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,51,64,97]),[k,a,f,b,s]=[8,25,51,64,97].map(r=>c.byRole[r]);
 await c.act(s,'official.97.plant',[a]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,a)).life,'HIBERNATING');await c.day(b,f);
 assert.equal((await self(c,b)).life,'DEAD_FINAL');const v=await c.view(f);assert.equal(v.mediumChat.roleLabel,'Người Lái Đò');assert.deepEqual(v.mediumChat.targets.map(t=>t.playerId).sort(),[c.id(a),c.id(b)].sort());
 const msg={channel:'MEDIUM',targetId:c.id(a),text:'silent address',messageId:randomUUID()};ok(await c.post('chat',msg,f));assert.equal((await c.view(f)).revision,v.revision);assert.equal((await c.view(a)).mediumChat,undefined);assert(!(await c.events(a)).some(e=>e.payload.text===msg.text));
 const msg2={channel:'MEDIUM',targetId:c.id(b),text:'anonymous hello',messageId:randomUUID()};ok(await c.post('chat',msg2,f));ok(await c.post('chat',msg2,f));const dv=(await c.view(b)).mediumChat;assert.equal(dv.roleLabel,'Người Lái Đò');assert.equal(dv.kind,'DEAD');assert(!JSON.stringify(dv).includes(c.id(f)));assert.equal((await c.events(b)).filter(e=>e.payload.text===msg2.text).length,1);
 const ev=(await c.events(b)).find(e=>e.payload.text===msg2.text);assert(!JSON.stringify(ev).includes(c.id(f)));assert(!(await c.events(k)).some(e=>[msg.text,msg2.text].includes(e.payload.text)));
 ok(await c.post('chat',{channel:'MEDIUM',sessionId:dv.sessionId,text:'dead reply',messageId:randomUUID()},b));assert((await c.events(f)).some(e=>e.payload.text==='dead reply'));
 assert.notEqual((await c.post('chat',{channel:'MEDIUM',sessionId:dv.sessionId,text:'unauthorized',messageId:randomUUID()},k)).status,200);await h.restart();assert.equal((await c.view(b)).mediumChat.sessionId,dv.sessionId);await c.replay();await c.advance();assert.equal((await c.view(f)).mediumChat,undefined);
}));
test('FULL5 #64: delayed observation uses current transformed Cupid role, not original character id',async()=>harness(async h=>{
 const c=await startLife(h,[8,25,27,64,74,97]),[k,a,p,b,m,s]=[8,25,27,64,74,97].map(r=>c.byRole[r]);
 await c.act(p,'official.27.pair',[a,m]);await c.act(b,'official.64.pair',[p,s]);await c.act(k,'official.8.night-kill',[a]);await c.advance();assert.equal((await self(c,p)).roleNameOverride,'Dân thường');assert.equal((await bell(c)).length,0);await c.day();await c.act(k,'official.8.night-kill',[s]);await c.advance();const ev=(await bell(c)).at(-1);assert(ev);assert.equal(ev.payload.roleName,'Dân thường');assert.equal(ev.payload.characterId,undefined);assert(!(await c.events(k)).some(e=>e.eventType==='S15_SCALE_BELL_OBSERVED'));await h.restart();await c.replay();
}));
