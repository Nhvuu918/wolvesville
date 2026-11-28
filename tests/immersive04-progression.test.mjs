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
import {levelFor,progressionPlan} from '../dist/backend/src/social/progression.js';
test('XP thresholds, multi-level remainder, distinct badge thresholds and scope exclusions',()=>{
 assert.equal(levelFor(99).level,1);assert.equal(levelFor(100).level,2);assert.equal(levelFor(275).level,3);assert.equal(levelFor(460).inLevel,185);assert.equal(levelFor(460).remaining,65);
 const f=(i,scope='NORMAL')=>({gameId:'test-'+i,at:1000+i,scope,resolvedActions:0,state:{completed:true,phase:'GAME_COMPLETED',winnerIds:['a','b'],participants:[{playerId:'a',initialCharacterId:25,currentFaction:'dan',life:'ALIVE'},{playerId:'b',initialCharacterId:31,currentFaction:'dan',life:'ALIVE'}]}});
 const one=progressionPlan('a',[f(1),f(1),f(2,'DEMO'),f(3,'DEVELOPMENT')]);assert.equal(one.total,460);assert.equal(one.unlocks.length,3);assert.equal(one.reward.filter(x=>x.reason==='FIRST_WIN').length,1);
 const many=progressionPlan('a',Array.from({length:10},(_,i)=>f(i)));assert(many.unlocks.some(x=>x.definitionId==='PERFECT_DUO'));assert(!many.unlocks.some(x=>x.definitionId==='DESTINED_SOULMATES'));assert.equal(many.reward.filter(x=>x.reason==='FIRST_MATCH').length,1);
});
test('Official Normal two-human completed match grants own persisted XP once; replay/restart no extra rewards',async()=>harness(async h=>{
 const [a,b]=await Promise.all([h.account('A'),h.account('B')]);const room=ok(await h.api('POST','/api/rooms',{name:'XP normal',capacity:2},a),201).room.id,rp='/api/rooms/'+room;
 ok(await h.api('POST',rp+'/join',{},b));const sockets=await Promise.all([a,b].map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},a));ok(await h.api('POST',rp+'/configure',{deck:'knight'},a));for(const u of [a,b])ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const g=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25],idempotencyKey:randomUUID()},a),201).game,path='/api/games/'+g.gameId;
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,va=await view(a),k=va.players.find(p=>p.self).self.currentCharacterId===8?a:b,other=k===a?b:a;await Promise.all(sockets.map(s=>s.subscribe(g.gameId)));
 const xp=async u=>ok(await h.api('GET','/api/social/progression',undefined,u)).progression;assert.equal((await xp(k)).totalXp,0);
 ok(await h.api('POST',path+'/actions',command('official.8.night-kill',[other.profile.id]),k));ok(await h.api('POST',path+'/advance-night',{expectedRevision:(await view(a)).revision},a));assert.equal((await view(a)).completed,true);assert((await view(a)).winnerIds.includes(k.profile.id));
 const winner=await xp(k),loser=await xp(other);assert.equal(winner.totalXp,460);assert.equal(loser.totalXp,200);assert.equal(winner.level,3);assert.equal(winner.inLevel,185);assert.equal(winner.records.length,3);assert.equal(winner.history.length,8);assert.equal(winner.changed,false);assert.equal((await xp(k)).totalXp,460);assert.equal((await h.api('POST','/api/social/progression/preferences',{title:'fate'},k)).status,403);
 ok(await h.api('POST','/api/social/progression/preferences',{badge:'matches-1',featured:true},k));assert.equal((await xp(k)).records.find(r=>r.achievement_id==='matches-1').featured,1);
 assert.equal((await h.api('GET','/api/social/progression',undefined,null)).status,401);assert((await h.api('GET','/api/games/'+g.gameId+'/replay',undefined,k)).replay.verified);await h.restart();assert.equal((await xp(k)).totalXp,460);assert.equal((await xp(other)).totalXp,200);assert.equal((await xp(k)).records.find(r=>r.achievement_id==='matches-1').featured,1);assert.equal(ok(await h.api('GET','/api/social/notifications',undefined,k)).notifications.filter(x=>x.kind==='career_reward').length,1);
 const db=new DatabaseSync(h.file,{readOnly:true});try{assert.equal(db.prepare('SELECT COUNT(*) AS n FROM xp_transactions WHERE user_id=?').get(k.profile.id).n,8);assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);}finally{db.close();}
}));
