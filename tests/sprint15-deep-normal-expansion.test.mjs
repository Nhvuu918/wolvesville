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
const configurations=[['s15-deep-leader',[25,48,74]],['s15-deep-leader-snow',[9,25,48,74]],['s15-deep-knight-snow',[8,9]],['s15-deep-knight-snow-aura',[8,9,25]],['s15-deep-knight-snow-role',[8,9,74]],['s15-deep-knight-snow-dual',[8,9,25,74]]];
for(const [deck,ids] of configurations)test(`Deep normal ${deck}: both factions, real protection, chat, private observations, SQLite restart and replay`,()=>harness(async h=>{
 const users=await Promise.all(ids.map((_,i)=>h.account(`Player ${i}`))),host=users[0],outsider=await h.account('Outside');
 for(const side of ['village','enemy']){
  const room=ok(await h.api('POST','/api/rooms',{name:'Deep normal',capacity:ids.length},host),201).room.id,rp='/api/rooms/'+room;
  for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck},host));
  for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events,byRole={};
  for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const enemy=ids.includes(48)?48:8,villagers=ids.filter(r=>r!==enemy),id=r=>byRole[r].profile.id,act=(r,skill,targets)=>post('actions',command(skill,targets.map(id)),byRole[r]);
  assert.equal((await post('resolve')).status,403);assert.equal((await h.api('GET',path,undefined,outsider)).status,403);
  for(const r of [25,74].filter(r=>ids.includes(r)))ok(await act(r,`official.${r}.inspect-role`,[enemy]));
  if(ids.includes(9)){
   ok(await act(9,'official.9.snow-protection',[9]));ok(await act(enemy,enemy===8?'official.8.night-kill':'official.48.pack-bite',[9]));
  }
  ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));assert.equal((await view(host)).phase,'DAY_DISCUSS');assert((await view(host)).players.every(p=>!p.publicReportedDead));
  for(const r of [25,74].filter(r=>ids.includes(r))){const type=r===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED';for(const q of ids){const es=(await events(byRole[q])).filter(e=>e.eventType===type);assert.equal(es.length,Number(q===r));if(q===r)assert.equal(r===25?es[0].payload.verdict:es[0].payload.characterId,r===25?(enemy===48?'Ác':'Không xác định'):enemy);}}
  ok(await post('chat',{text:'Deep normal chat',messageId:randomUUID()},byRole[villagers[0]]));assert((await events(byRole[enemy])).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
  ok(await post('voting-open'));if(side==='village'){ok(await post('votes',ballot(id(enemy)),byRole[villagers[0]]));ok(await post('voting-close'));}
  else{
   ok(await post('voting-close'));assert.equal((await view(host)).phase,'NIGHT_COLLECT');
   while(!(await view(host)).completed){const v=await view(host);assert(v.round<=5);const live=villagers.filter(r=>!v.players.find(p=>p.playerId===id(r)).publicReportedDead);ok(await act(enemy,enemy===8?'official.8.night-kill':'official.48.pack-bite',live.slice(0,enemy===8?1:2)));ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));if(!(await view(host)).completed){ok(await post('voting-open'));ok(await post('voting-close'));}}
  }
  const v=await view(host);assert.equal(v.completed,true);assert.deepEqual(new Set(v.winnerIds),new Set((side==='village'?villagers:[enemy]).map(id)));await h.restart();for(const u of users){const after=await view(u);assert.deepEqual(after.winnerIds,v.winnerIds);const replay=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(replay.verified&&replay.roleAssignmentsVerified);}const back=await h.socket(users[0],room);await back.subscribe(game.gameId);back.ws.close();
  console.log('DEEP_NORMAL_EVIDENCE '+JSON.stringify({deck,ids,side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true}));
 }
}));
