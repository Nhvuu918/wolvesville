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
/** Official 1.3.3 only; independent of the candidate B/B profile. */
const ids=[25,31,48,74];
async function match(h,users){const host=users[0],room=ok(await h.api('POST','/api/rooms',{name:'Guard finite acceptance',capacity:4},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s15-play-guard'},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId,byRole={};
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u);for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}assert.deepEqual(Object.keys(byRole).map(Number).sort((a,b)=>a-b),ids);await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 const id=r=>byRole[r].profile.id,v=()=>view(host),act=(r,targets)=>post('actions',command(r===31?'official.31.guard':r===48?'official.48.pack-bite':`official.${r}.inspect-role`,targets.map(id)),byRole[r]),advance=async()=>ok(await post('advance-night',{expectedRevision:(await v()).revision})),vote=async(r,t)=>ok(await post('votes',{...ballot(t===''?'':id(t)),expectedRevision:(await view(byRole[r])).revision},byRole[r])),open=()=>post('voting-open'),close=()=>post('voting-close'),events=async r=>ok(await h.api('GET',path+'/events',undefined,byRole[r])).events,cap=async r=>(await view(byRole[r])).capabilities.find(x=>x.skillId===(r===31?'official.31.guard':'official.48.pack-bite'));
 const day=async(votes=[])=>{ok(await open());for(const [r,t] of votes)await vote(r,t);ok(await close());};const replay=async()=>{for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}};const dead=async()=>{const x=await v();return ids.filter(r=>x.players.find(p=>p.playerId===id(r)).publicReportedDead);};const win=async(expected)=>{const x=await v();assert(x.completed);assert.deepEqual([...x.winnerIds].sort(),expected.map(id).sort());};return {id,v,view,byRole,act,advance,day,replay,dead,win,cap,post,events,vote,open,close,sockets,room,rp,gameId:game.gameId};}
const bites=[[],[25],[31],[74],[25,31],[25,74],[31,74]];
test('Owner BB independent guard acceptance: all 35 initial-night guard and bite combinations, alternating submission order and private observations',()=>harness(async h=>{
 const users=await Promise.all(ids.map(r=>h.account('Guard Matrix '+r)));let count=0;
 for(const guard of [null,...ids])for(const bite of bites){const m=await match(h,users);const seq=[];if(guard!==null)seq.push(()=>m.act(31,[guard]));if(bite.length)seq.push(()=>m.act(48,count%2?[...bite].reverse():bite));for(const role of [25,74])if((count+role)%3!==0){const available=ids.filter(r=>r!==role);seq.push(()=>m.act(role,[available[(count+role)%available.length]]));}if(count%2)seq.reverse();for(const a of seq)ok(await a());await m.advance();const expected=bite.filter(r=>r!==guard).sort((a,b)=>a-b);assert.deepEqual(await m.dead(),expected);if(expected.length===2)await m.win([48]);else assert.equal((await m.v()).phase,'DAY_DISCUSS');for(const role of ids){const es=await m.events(role);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,Number(role===25&&(count+25)%3!==0));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,Number(role===74&&(count+74)%3!==0));}await m.replay();for(const s of m.sockets)s.ws.close();count++;}assert.equal(count,35);console.log('OWNER_BB_GUARD_NIGHT_MATRIX '+count);
}));
test('Owner BB independent guard acceptance: cooldown skip, self shield, guard death, vote ties, blank/change/retry, handoff and restart',()=>harness(async h=>{
 const users=await Promise.all(ids.map(r=>h.account('Guard Continuation '+r)));let m=await match(h,users);ok(await m.act(31,[25]));await m.advance();assert.deepEqual(await m.dead(),[]);await m.day([[25,48],[31,74]]);assert.equal((await m.v()).round,2);assert(!(await m.cap(31)).eligibleTargetIds.includes(m.id(25)));assert.notEqual((await m.act(31,[25])).status,200);await m.advance();await m.day([[25,''],[31,'']]);assert.equal((await m.v()).round,3);assert((await m.cap(31)).eligibleTargetIds.includes(m.id(25)));ok(await m.act(31,[25]));ok(await m.act(48,[31,25]));await m.advance();assert.deepEqual(await m.dead(),[31]);assert.notEqual((await m.act(31,[25])).status,200);await m.day([[25,48]]);await m.win([25,31,74]);await m.replay();for(const s of m.sockets)s.ws.close();
 m=await match(h,users);ok(await m.act(31,[31]));ok(await m.act(48,[31]));await m.advance();assert.deepEqual(await m.dead(),[]);ok(await m.open());const u=m.byRole[25],cmd={...ballot(m.id(25)),expectedRevision:(await m.view(u)).revision};ok(await m.post('votes',cmd,u));ok(await m.post('votes',cmd,u));await m.vote(25,48);await m.vote(31,48);await m.vote(48,31);ok(await m.close());await m.win([25,31,74]);await m.replay();for(const s of m.sockets)s.ws.close();
 m=await match(h,users);await m.advance();await m.day([[25,74]]);assert.deepEqual(await m.dead(),[74]);assert.equal((await m.v()).round,2);ok(await m.act(31,[31]));await h.restart();const sock=await Promise.all(users.map(u=>h.socket(u,m.room)));await Promise.all(sock.map(s=>s.subscribe(m.gameId)));assert.equal((await m.v()).round,2);sock[0].ws.close();await wait(()=>sock[1].messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===users[0].profile.id&&!p.online)));const next=users[1],roomRev=ok(await h.api('GET',m.rp,undefined,next)).room.revision;ok(await m.post('claim-coordinator',{expectedRoomRevision:roomRev},next));assert.equal((await m.view(next)).coordinatorId,next.profile.id);assert.equal((await m.post('advance-night',{expectedRevision:(await m.v()).revision})).status,403);ok(await m.act(48,[25,31]));ok(await m.post('advance-night',{expectedRevision:(await m.view(next)).revision},next));await m.win([48]);await m.replay();console.log('OWNER_BB_GUARD_CONTINUATION_PASS');
}));

// Finite reduced-roster classes: only 3 survivors can continue. The second
// death with a living wolf reaches parity, and the wolf hanging ends the game.
// All guard/attack combinations, both sources of first death, all 3 dead-role
// identities; inspection and order are tested as independent read-only axes.
test('Official guard reduced roster: 72 real-room night choices after first death by night or hanging',()=>harness(async h=>{
 const users=await Promise.all(ids.map(r=>h.account('Guard Reduced '+r)));let count=0;
 for(const removed of [25,31,74])for(const origin of ['night','hanging']){
  const live=ids.filter(r=>r!==removed),victims=live.filter(r=>r!==48),guards=removed===31?[null]:[null,...live];
  for(const guard of guards)for(const bite of [[],[victims[0]],[victims[1]],victims]){
   const m=await match(h,users);if(origin==='night')ok(await m.act(48,[removed]));await m.advance();await m.day(origin==='hanging'?[[48,removed]]:[]);assert.deepEqual(await m.dead(),[removed]);assert.equal((await m.v()).round,2);assert.equal((await m.v()).phase,'NIGHT_COLLECT');
   assert.notEqual((await m.act(removed,[48])).status,200);assert.notEqual((await m.act(48,[removed])).status,200);if(removed!==31)assert.notEqual((await m.act(31,[removed])).status,200);
   const actions=[];if(guard!==null)actions.push(()=>m.act(31,[guard]));if(bite.length)actions.push(()=>m.act(48,count%2?[...bite].reverse():bite));for(const r of live.filter(x=>x===25||x===74))if((count+r)%2===0)actions.push(()=>m.act(r,[48]));if(count%2)actions.reverse();for(const a of actions)ok(await a());await m.advance();
   const killed=bite.filter(r=>r!==guard);assert.deepEqual(await m.dead(),[removed,...killed].sort((a,b)=>a-b));if(killed.length)await m.win([48]);else{assert.equal((await m.v()).phase,'DAY_DISCUSS');await m.day([[victims[0],48]]);await m.win([25,31,74]);}await m.replay();for(const s of m.sockets)s.ws.close();count++;
  }
 }assert.equal(count,72);console.log('OFFICIAL_GUARD_REDUCED_MATRIX '+count);
}));

// Exhaustive pure adjudicator partition; actual room tests above and inherited
// cases prove commit / vote changes / authorization / both outcomes separately.
test('Official guard voting: exhaustive 1671 ballot assignments on the actual adjudicator',async()=>{
 const {adjudicateOfficialVote}=await import('../dist/backend/src/engine/vote-adjudicator.js');let count=0;
 for(const removed of [null,25,31,74]){const live=ids.filter(r=>r!==removed),options=[null,'',...live.map(String)];const walk=(i,ballots)=>{if(i<live.length){for(const t of options)walk(i+1,[...ballots,t]);return;}const intents=ballots.flatMap((t,j)=>t===null?[]:[{voterId:String(live[j]),targetId:t,ballotId:`b${j}`,idempotencyKey:`k${j}`}]);const s={round:1,ruleVersion:'wolvesville-official-v1.3.3',links:[],phase:'DAY_VOTE_COLLECT',votingPolicy:'S11_OFFICIAL_V1',participants:ids.map(r=>({playerId:String(r),initialCharacterId:r,currentCharacterId:r,initialFaction:r===48?'soi':'dan',currentFaction:r===48?'soi':'dan',life:r===removed?'DEAD_FINAL':'ALIVE',effects:[],skillLocks:[],winLinks:[]})),voting:{round:1,status:'OPEN',intents}};const result=adjudicateOfficialVote(s).outcome;const counts=live.map(r=>[String(r),ballots.filter(t=>t===String(r)).length]),max=Math.max(...counts.map(x=>x[1])),leaders=counts.filter(x=>x[1]===max);assert.equal(result.kind,max===0?'NO_HANGING_ZERO':leaders.length>1?'NO_HANGING_TIE':'HANGING_AUTHORIZED');if(max&&leaders.length===1)assert.equal(result.targetId,leaders[0][0]);count++;};walk(0,[]);}
 assert.equal(count,1671); // 6^4 + 3*5^3 = 1671, absent and blank distinguished
 console.log('OFFICIAL_GUARD_BALLOT_MATRIX '+count);
});
