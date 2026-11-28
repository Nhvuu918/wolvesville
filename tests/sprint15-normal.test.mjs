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
async function create(h,a,b,deck,{checks=false}={}){const {api,socket}=h;const ids=deck==='knight'?[8,25]:[8,74];const room=ok(await api('POST','/api/rooms',{name:'Normal match',capacity:2},a),201).room.id;const rp='/api/rooms/'+room;ok(await api('POST',rp+'/join',{},b));const wa=await socket(a,room),wb=await socket(b,room);ok(await api('POST',rp+'/lock',{},a));const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()};
 if(checks){assert.equal((await api('POST',rp+'/games/start',{...start,mode:'INTEGRATION_TEST'},a)).status,409);assert.equal((await api('POST',rp+'/games/start',{...start,rulePack:'FIXTURE'},a)).status,409);assert.equal((await api('POST',rp+'/configure',{deck},b)).status,403);assert.equal((await api('POST',rp+'/configure',{deck:'invalid'},a)).status,409);assert.equal((await api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await api('GET',rp,undefined,a)).room.revision},a)).status,409);}
 ok(await api('POST',rp+'/configure',{deck},a));ok(await api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await api('GET',rp,undefined,a)).room.revision},a));if(checks){assert.equal((await api('POST',rp+'/games/start',start,a)).status,409);ok(await api('POST',rp+'/configure',{deck:deck==='knight'?'s15-mystic-knight':'knight'},a));assert.equal(ok(await api('GET',rp,undefined,a)).room.members.every(m=>!m.ready),true);ok(await api('POST',rp+'/configure',{deck},a));ok(await api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await api('GET',rp,undefined,a)).room.revision},a));}ok(await api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await api('GET',rp,undefined,b)).room.revision},b));if(checks){assert.equal((await api('POST',rp+'/games/start',start,b)).status,403);assert.equal((await api('POST',rp+'/games/start',{...start,characterIds:[8,28]},a)).status,409);}
 const started=ok(await api('POST',rp+'/games/start',start,a),201).game;assert.equal(started.mode,'NORMAL_GAMEPLAY');assert.equal(ok(await api('POST',rp+'/games/start',start,a)).game.gameId,started.gameId);
 const path='/api/games/'+started.gameId;const view=async u=>ok(await api('GET',path,undefined,u)).game;const post=(suffix,body={},u=a)=>api('POST',path+'/'+suffix,body,u);const v=await view(a);const va=v.players.find(p=>p.playerId===a.profile.id).self.currentCharacterId;const knight=va===8?a:b,seer=va===8?b:a;assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.canQaAdvanceDay,false);assert.equal(v.canQaResolveDaySkill,false);for(const u of [a,b])assert((await view(u)).players.every(p=>p.playerId===u.profile.id?!!p.self:!p.self));await wa.subscribe(started.gameId);await wb.subscribe(started.gameId);assert.equal(ok(await api('GET',rp,undefined,b)).room.gameId,started.gameId);
 const advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(a)).revision}));const vote=async (u,target)=>ok(await post('votes',{...ballot(target),expectedRevision:(await view(u)).revision},u));const open=()=>post('voting-open');const close=()=>post('voting-close');const replay=async u=>ok(await api('GET',path+'/replay',undefined,u)).replay;
 return {room,rp,path,view,post,advance,vote,open,close,replay,knight,seer,wa,wb,gameId:started.gameId};}
const winners=(v,users)=>{assert.equal(v.completed,true);assert.equal(v.phase,'GAME_COMPLETED');assert.deepEqual(new Set(v.winnerIds),new Set(users.map(u=>u.profile.id)));};
test('Normal gameplay real authenticated session: readiness, QA isolation, private aura, chat, vote, restart, reconnect and Village victory',async()=>harness(async h=>{const a=await h.account('Host'),b=await h.account('Guest'),outsider=await h.account('Outsider');const m=await create(h,a,b,'knight',{checks:true});
 assert.equal((await h.api('GET',m.path,undefined,outsider)).status,403);assert.equal((await m.post('resolve',{},a)).status,403);assert.equal((await m.post('advance-night',{expectedRevision:(await m.view(a)).revision},b)).status,403);assert.equal((await m.post('advance-night',{},a)).status,400);assert.equal((await m.post('actions',command('fixture.protect',[b.profile.id]),a)).status!==200,true);
 const skill=command('official.25.inspect-role',[m.knight.profile.id]);ok(await m.post('actions',skill,m.seer));assert.equal(ok(await m.post('actions',skill,m.seer)).action.duplicate,true);await m.advance();assert.equal((await m.view(a)).phase,'DAY_DISCUSS');assert.equal((await m.post('advance-night',{expectedRevision:(await m.view(a)).revision})).status,409);
 const ev=async u=>ok(await h.api('GET',m.path+'/events',undefined,u)).events;assert((await ev(m.seer)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));assert(!(await ev(m.knight)).some(e=>e.eventType==='SEER_AURA_OBSERVED'));
 ok(await m.post('chat',{text:'Normal game hello',messageId:randomUUID()},m.seer));assert((await ev(m.knight)).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));assert.equal((await m.post('chat',{text:'outside',messageId:randomUUID()},outsider)).status,403);
 ok(await m.open());await m.vote(m.seer,'');await m.vote(m.seer,m.knight.profile.id);ok(await m.close());winners(await m.view(a),[m.seer]);assert((await m.replay(a)).verified);assert((await m.replay(b)).roleAssignmentsVerified);
 await h.restart();winners(await m.view(a),[m.seer]);assert((await m.replay(b)).verified);const ws=await h.socket(b,m.room);const snap=await ws.subscribe(m.gameId);assert.equal(snap.game.mode,'NORMAL_GAMEPLAY');winners(snap.game,[m.seer]);const db=new DatabaseSync(h.file);try{assert.equal(db.prepare('SELECT mode FROM game_sessions WHERE game_id=?').get(m.gameId).mode,'NORMAL_GAMEPLAY');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);}finally{db.close();}console.log('NORMAL_PLAY_EVIDENCE '+JSON.stringify({deck:[8,25],mode:'NORMAL_GAMEPLAY',ruleVersion:'wolvesville-official-v1.3.3',victory:'VILLAGE',restart:true,replay:true,privacy:true}));}));
test('Normal gameplay exact-role seer, night kill, dead player actions denied and persisted Knight victory',async()=>harness(async h=>{const a=await h.account('Host'),b=await h.account('Guest');const m=await create(h,a,b,'s15-mystic-knight');ok(await m.post('actions',command('official.74.inspect-role',[m.knight.profile.id]),m.seer));ok(await m.post('actions',command('official.8.night-kill',[m.seer.profile.id]),m.knight));await m.advance();winners(await m.view(a),[m.knight]);assert.notEqual((await m.post('actions',command('official.74.inspect-role',[m.knight.profile.id]),m.seer)).status,200);const ev=async u=>ok(await h.api('GET',m.path+'/events',undefined,u)).events;assert((await ev(m.seer)).some(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.characterId===8));assert(!(await ev(m.knight)).some(e=>e.eventType==='ROLE_OBSERVED'));await h.restart();winners(await m.view(b),[m.knight]);assert((await m.replay(a)).verified);console.log('NORMAL_PLAY_EVIDENCE '+JSON.stringify({deck:[8,74],mode:'NORMAL_GAMEPLAY',ruleVersion:'wolvesville-official-v1.3.3',victory:'KNIGHT',restart:true,replay:true,privacy:true}));}));
for(const [deck,seerRole] of [['knight',25],['s15-mystic-knight',74]]){
 test(`Normal [8,${seerRole}] all 16 final ballot combinations in real rooms, V02/V03, both winning sides`,async()=>harness(async h=>{
 const a=await h.account('Host'),b=await h.account('Guest');
 for(const x of [null,'','knight','seer'])for(const y of [null,'','knight','seer']){
  const m=await create(h,a,b,deck);await m.advance();ok(await m.open());
  const target=r=>r===''?'':m[r].profile.id;if(x!==null)await m.vote(m.knight,target(x));if(y!==null)await m.vote(m.seer,target(y));ok(await m.close());
  const counts={knight:[x,y].filter(t=>t==='knight').length,seer:[x,y].filter(t=>t==='seer').length},v=await m.view(a);
  if(counts.knight===counts.seer){assert.equal(v.completed,false);assert.equal(v.phase,'NIGHT_COLLECT');assert.equal(v.round,2);}
  else winners(v,[counts.knight>counts.seer?m.seer:m.knight]);assert((await m.replay(a)).verified);m.wa.ws.close();m.wb.ws.close();
 }console.log('NORMAL_BRANCH_EVIDENCE '+JSON.stringify({deck:[8,seerRole],ballotCombinations:16,mode:'NORMAL_GAMEPLAY',replay:true}));}));
 test(`Normal [8,${seerRole}] four optional night branches plus reversed submission, phase and target rejection`,async()=>harness(async h=>{
 const a=await h.account('Host'),b=await h.account('Guest');
 for(const steps of [[],['seer'],['knight'],['seer','knight'],['knight','seer']]){
  const m=await create(h,a,b,deck);const skill=`official.${seerRole}.inspect-role`;
  assert.notEqual((await m.post('actions',command(skill,[m.seer.profile.id]),m.seer)).status,200);
  assert.notEqual((await m.post('actions',command('official.8.night-kill',[m.knight.profile.id]),m.knight)).status,200);
  for(const step of steps)ok(await m.post('actions',step==='knight'?command('official.8.night-kill',[m.seer.profile.id]):command(skill,[m.knight.profile.id]),m[step]));await m.advance();
  const v=await m.view(a);if(steps.includes('knight'))winners(v,[m.knight]);else assert.equal(v.phase,'DAY_DISCUSS');
  const expected=seerRole===25?'SEER_AURA_OBSERVED':'ROLE_OBSERVED';const events=async u=>ok(await h.api('GET',m.path+'/events',undefined,u)).events;
  assert.equal((await events(m.seer)).filter(e=>e.eventType===expected).length,Number(steps.includes('seer')));assert(!(await events(m.knight)).some(e=>e.eventType===expected));assert.notEqual((await m.post('actions',command(skill,[m.knight.profile.id]),m.seer)).status,200);assert((await m.replay(b)).verified);m.wa.ws.close();m.wb.ws.close();
 }console.log('NORMAL_BRANCH_EVIDENCE '+JSON.stringify({deck:[8,seerRole],nightScenarios:5,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true}));}));
}
test('Normal ROOM-03 authenticated handoff after host disconnect, no reassignment, phase authorization, restart and audit',async()=>harness(async h=>{
 const a=await h.account('Original host'),b=await h.account('Successor'),o=await h.account('Outsider');const m=await create(h,a,b,'knight');const original=[(await m.view(a)).players.find(p=>p.self).self.currentCharacterId,(await m.view(b)).players.find(p=>p.self).self.currentCharacterId];
 const claim=async(u,rev)=>m.post('claim-coordinator',{expectedRoomRevision:rev},u);const revision=async()=>ok(await h.api('GET',m.rp,undefined,b)).room.revision;
 assert.equal((await claim(b,await revision())).status,409);assert.equal((await claim(o,await revision())).status,403);m.wa.ws.close();await wait(()=>m.wb.messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===a.profile.id&&!p.online)));
 assert.equal((await claim(b,(await revision())-1)).status,409);ok(await claim(b,await revision()));assert.equal((await m.view(b)).coordinatorId,b.profile.id);assert.equal((await m.post('advance-night',{expectedRevision:(await m.view(a)).revision},a)).status,403);ok(await m.post('advance-night',{expectedRevision:(await m.view(b)).revision},b));assert.equal((await m.view(b)).phase,'DAY_DISCUSS');
 await h.restart();const ba=await h.socket(a,m.room),bb=await h.socket(b,m.room);await ba.subscribe(m.gameId);await bb.subscribe(m.gameId);assert.deepEqual([(await m.view(a)).players.find(p=>p.self).self.currentCharacterId,(await m.view(b)).players.find(p=>p.self).self.currentCharacterId],original);assert.equal((await m.view(b)).coordinatorId,b.profile.id);assert.equal((await m.post('voting-open',{},a)).status,403);ok(await m.post('voting-open',{},b));await m.vote(m.seer,m.knight.profile.id);ok(await m.post('voting-close',{},b));winners(await m.view(a),[m.seer]);const replay=await m.replay(b);assert(replay.verified);assert.equal(replay.coordinationHistory.length,1);assert.equal(replay.coordinationHistory[0].fromId,a.profile.id);assert.equal(replay.coordinationHistory[0].toId,b.profile.id);assert.equal((await claim(a,await revision())).status,403);console.log('NORMAL_HANDOFF_EVIDENCE '+JSON.stringify({mode:'NORMAL_GAMEPLAY',deck:[8,25],restart:true,replay:true,originalAssignmentsPreserved:true}));
}));
test('S19 [8,74] authenticated handoff during day, private role, reconnect, vote and SQLite replay',async()=>harness(async h=>{
 const a=await h.account('Original host'),b=await h.account('Successor'),outsider=await h.account('Outsider');const m=await create(h,a,b,'s15-mystic-knight');
 ok(await m.post('actions',command('official.74.inspect-role',[m.knight.profile.id]),m.seer));await m.advance();
 const events=async u=>ok(await h.api('GET',m.path+'/events',undefined,u)).events;
 assert((await events(m.seer)).some(e=>e.eventType==='ROLE_OBSERVED'));assert(!(await events(m.knight)).some(e=>e.eventType==='ROLE_OBSERVED'));
 m.wa.ws.close();await wait(()=>m.wb.messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===a.profile.id&&!p.online)));
 const rev=ok(await h.api('GET',m.rp,undefined,b)).room.revision;ok(await m.post('claim-coordinator',{expectedRoomRevision:rev},b));
 const returned=await h.socket(a,m.room);const snap=await returned.subscribe(m.gameId);assert.equal(snap.game.coordinatorId,b.profile.id);assert.equal(snap.game.phase,'DAY_DISCUSS');
 assert.equal((await m.post('voting-open',{},a)).status,403);ok(await m.post('voting-open',{},b));await h.restart();
 const va=await h.socket(a,m.room),vb=await h.socket(b,m.room);assert.equal((await va.subscribe(m.gameId)).game.phase,'DAY_VOTE_COLLECT');assert.equal((await vb.subscribe(m.gameId)).game.coordinatorId,b.profile.id);
 assert.equal((await h.api('GET',m.path,undefined,outsider)).status,403);await m.vote(m.seer,m.knight.profile.id);ok(await m.post('voting-close',{},b));winners(await m.view(a),[m.seer]);
 const replay=await m.replay(b);assert(replay.verified);assert.equal(replay.coordinationHistory.length,1);assert.equal(replay.coordinationHistory[0].toId,b.profile.id);
}));
test('Normal migration 007/008 preserves an actual archived 1.3.2 QA game and replay byte-for-byte',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-normal-legacy-')),file=join(dir,'legacy.sqlite');let app;const previous=process.env.WV_ARCHIVED_RULE_REGRESSION;process.env.WV_ARCHIVED_RULE_REGRESSION='1';
 try{
 const store=new SqliteMultiplayerStore(file);app=createMultiplayerServer(store,{officialRuleTestMode:true});let base=`http://127.0.0.1:${await app.start()}`;
 const req=async(method,path,body,token)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,...await r.json()};};
 const account=async()=>{const body={username:'legacy_'+randomUUID().replaceAll('-','').slice(0,16),password:'LegacySecureTest_2026'};ok(await req('POST','/api/auth/register',body),201);return ok(await req('POST','/api/auth/login',body));};const a=await account(),b=await account();const room=ok(await req('POST','/api/rooms',{name:'Historical rule',capacity:2},a.token),201).room.id;ok(await req('POST',`/api/rooms/${room}/join`,{},b.token));ok(await req('POST',`/api/rooms/${room}/lock`,{},a.token));const g=ok(await req('POST',`/api/rooms/${room}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25],idempotencyKey:randomUUID()},a.token),201).game.gameId;const path=`/api/games/${g}`;ok(await req('POST',path+'/resolve',{},a.token));ok(await req('POST',path+'/voting-open',{},a.token));const av=ok(await req('GET',path,undefined,a.token)).game;assert.equal(av.ruleVersion,'wolvesville-official-v1.3.2');const bv=ok(await req('GET',path,undefined,b.token)).game;const knight=av.players.find(p=>p.self).self.currentCharacterId===8?a:b,seer=knight===a?b:a;ok(await req('POST',path+'/votes',ballot(seer.profile.id),knight.token));ok(await req('POST',path+'/voting-close',{},a.token));const before=ok(await req('GET',path,undefined,b.token)).game;assert.equal(before.completed,true);const replay=ok(await req('GET',path+'/replay',undefined,b.token)).replay;assert(replay.verified);await app.close();app=undefined;
 // Reconstruct exact legacy relational shape using original SQL; the game and
 // all projections were created by the real kernel, never fabricated fixtures.
 let db=new DatabaseSync(file);let archive;let events;try{archive=Buffer.from(db.prepare('SELECT kernel_archive FROM game_sessions WHERE game_id=?').get(g).kernel_archive);events=db.prepare('SELECT * FROM game_events WHERE game_id=? ORDER BY seq').all(g);db.exec('PRAGMA foreign_keys=OFF; PRAGMA legacy_alter_table=ON; BEGIN; DROP TABLE normal_coordination_log; ALTER TABLE lobby_rooms DROP COLUMN normal_deck; ALTER TABLE lobby_members DROP COLUMN ready; ALTER TABLE game_sessions RENAME TO game_sessions_newshape;');db.exec(readFileSync(new URL('../backend/src/persistence/migrations/004_game_sessions_sqlite.sql',import.meta.url),'utf8'));db.exec(readFileSync(new URL('../backend/src/persistence/migrations/005_official_rule_pack_sqlite.sql',import.meta.url),'utf8'));db.exec('INSERT INTO game_sessions SELECT game_id,room_id,host_id,request_key,start_fingerprint,mode,phase,revision,rule_version,seed_commitment,kernel_archive,assigned_at,rule_pack FROM game_sessions_newshape; DROP TABLE game_sessions_newshape; COMMIT;');}finally{db.close();}
 delete process.env.WV_ARCHIVED_RULE_REGRESSION;app=createMultiplayerServer(new SqliteMultiplayerStore(file),{officialRuleTestMode:false});base=`http://127.0.0.1:${await app.start()}`;const after=ok(await req('GET',path,undefined,b.token)).game;assert.equal(after.ruleVersion,before.ruleVersion);assert.deepEqual(after.winnerIds,before.winnerIds);assert.deepEqual(ok(await req('GET',path+'/replay',undefined,b.token)).replay,replay);db=new DatabaseSync(file);try{assert.deepEqual(Buffer.from(db.prepare('SELECT kernel_archive FROM game_sessions WHERE game_id=?').get(g).kernel_archive),archive);assert.deepEqual(db.prepare('SELECT * FROM game_events WHERE game_id=? ORDER BY seq').all(g),events);assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);}finally{db.close();}
 }finally{await app?.close();if(previous===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=previous;rmSync(dir,{recursive:true,force:true});}
});

test('Normal three-human dual-seer journey: role privacy, both victory routes, restart and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Guest 1','Guest 2'].map(n=>h.account(n))),host=users[0],outsider=await h.account('Outsider');
 assert((await h.api('GET','/health')).normalDecks.some(d=>d.key==='s15-knight-dual-seer'&&d.characterIds.join(',')==='8,25,74'));
 for(const side of ['village','knight']){
  const room=ok(await h.api('POST','/api/rooms',{name:'Three humans',capacity:3},host),201).room.id,rp='/api/rooms/'+room;
  for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
  const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
  assert.equal((await h.api('POST',rp+'/configure',{deck:'knight'},host)).status,409);ok(await h.api('POST',rp+'/configure',{deck:'s15-knight-dual-seer'},host));
  const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25,74],idempotencyKey:randomUUID()};
  for(const u of users.slice(0,2))ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  assert.equal((await h.api('POST',rp+'/games/start',start,host)).status,409);
  ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,users[2])).room.revision},users[2]));
  const game=ok(await h.api('POST',rp+'/games/start',start,host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
  for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
  assert.deepEqual(Object.keys(byRole).sort(),['25','74','8']);await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const [k,a,m]=[8,25,74].map(i=>byRole[i]);const id=u=>u.profile.id,advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));
  assert.equal((await post('resolve')).status,403);assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.notEqual((await post('actions',command('official.74.inspect-role',[id(k)]),a)).status,200);
  for(const [role,u] of [[25,a],[74,m]]){const action=command(`official.${role}.inspect-role`,[id(k)]);ok(await post('actions',action,u));assert.equal(ok(await post('actions',action,u)).action.duplicate,true);}
  ok(await post('actions',command('official.8.night-kill',[id(m)]),k));await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');
  const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
  for(const [u,role] of [[a,25],[m,74],[k,8]]){const es=await events(u);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,Number(role===25));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,Number(role===74));}
  assert.notEqual((await post('actions',command('official.74.inspect-role',[id(k)]),m)).status,200);
  ok(await post('chat',{text:'Three humans',messageId:randomUUID()},a));assert((await events(k)).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
  ok(await post('voting-open'));assert.notEqual((await post('votes',ballot(id(k)),m)).status,200);
  if(side==='village'){ok(await post('votes',ballot(id(k)),a));ok(await post('voting-close'));winners(await view(a),[a,m]);}
  else{ok(await post('votes',ballot(id(a)),k));ok(await post('voting-close'));winners(await view(a),[k]);}
  const before=await view(a);await h.restart();assert.deepEqual((await view(a)).winnerIds,before.winnerIds);
  for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}
  const back=await h.socket(a,room);await back.subscribe(game.gameId);back.ws.close();
  console.log('CONTINUED_NORMAL_EVIDENCE '+JSON.stringify({deck:[8,25,74],side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true}));
 }
}));

test('Normal four-human guard and leader: real blocked bite, both victory routes, restart and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Guest 1','Guest 2','Guest 3'].map(n=>h.account(n))),host=users[0],outsider=await h.account('Outsider');
 assert((await h.api('GET','/health')).normalDecks.some(d=>d.key==='s15-play-guard'&&d.characterIds.join(',')==='25,31,48,74'));
 for(const side of ['village','wolf']){
  const room=ok(await h.api('POST','/api/rooms',{name:'Four humans',capacity:4},host),201).room.id,rp='/api/rooms/'+room;
  for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
  const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
  assert.equal((await h.api('POST',rp+'/configure',{deck:'knight'},host)).status,409);ok(await h.api('POST',rp+'/configure',{deck:'s15-play-guard'},host));
  const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,31,48,74],idempotencyKey:randomUUID()};
  for(const u of users.slice(0,3))ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  assert.equal((await h.api('POST',rp+'/games/start',start,host)).status,409);
  ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,users[3])).room.revision},users[3]));
  const game=ok(await h.api('POST',rp+'/games/start',start,host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
  for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
  assert.deepEqual(Object.keys(byRole).sort(),['25','31','48','74']);await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const [w,a,g,m]=[48,25,31,74].map(i=>byRole[i]);const id=u=>u.profile.id,advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));
  assert.equal((await post('resolve')).status,403);assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),a)).status,200);
  for(const [role,u] of [[25,a],[74,m]]){const action=command(`official.${role}.inspect-role`,[id(w)]);ok(await post('actions',action,u));assert.equal(ok(await post('actions',action,u)).action.duplicate,true);}
  ok(await post('actions',command('official.31.guard',[id(g)]),g));
  ok(await post('actions',command('official.48.pack-bite',[id(g),id(m)]),w));await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');assert.equal((await view(g)).players.find(p=>p.playerId===id(g)).publicReportedDead,false);assert.equal((await view(g)).players.find(p=>p.playerId===id(m)).publicReportedDead,true);
  const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
  for(const [u,role] of [[a,25],[m,74],[w,48],[g,31]]){const es=await events(u);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,Number(role===25));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,Number(role===74));}
  assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),m)).status,200);
  ok(await post('chat',{text:'Four humans',messageId:randomUUID()},a));assert((await events(w)).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
  ok(await post('voting-open'));assert.notEqual((await post('votes',ballot(id(w)),m)).status,200);
  if(side==='village'){ok(await post('votes',ballot(id(w)),a));ok(await post('voting-close'));winners(await view(a),[a,g,m]);}
  else{ok(await post('votes',ballot(id(g)),w));ok(await post('voting-close'));winners(await view(a),[w]);}
  const before=await view(a);await h.restart();assert.deepEqual((await view(a)).winnerIds,before.winnerIds);
  for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}
  const back=await h.socket(a,room);await back.subscribe(game.gameId);back.ws.close();
  console.log('MATURITY_NORMAL_GUARD_EVIDENCE '+JSON.stringify({deck:[25,31,48,74],side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true}));
 }
}));

test('Growth normal five-human snow and pharmacist: protected and rescued bite, both victory routes, restart and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Guest 1','Guest 2','Guest 3','Guest 4'].map(n=>h.account(n))),host=users[0],outsider=await h.account('Outsider');
 assert((await h.api('GET','/health')).normalDecks.some(d=>d.key==='s15-scale-leader-rescue'&&d.characterIds.join(',')==='9,25,48,74,87'));
 for(const side of ['village','wolf']){
  const room=ok(await h.api('POST','/api/rooms',{name:'Five humans',capacity:5},host),201).room.id,rp='/api/rooms/'+room;
  for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
  const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
  assert.equal((await h.api('POST',rp+'/configure',{deck:'knight'},host)).status,409);ok(await h.api('POST',rp+'/configure',{deck:'s15-scale-leader-rescue'},host));
  const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[9,25,48,74,87],idempotencyKey:randomUUID()};
  for(const u of users.slice(0,4))ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  assert.equal((await h.api('POST',rp+'/games/start',start,host)).status,409);
  ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,users[4])).room.revision},users[4]));
  const game=ok(await h.api('POST',rp+'/games/start',start,host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
  for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
  assert.deepEqual(Object.keys(byRole).sort(),['25','48','74','87','9']);await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const [w,a,g,m,d]=[48,25,9,74,87].map(i=>byRole[i]);const id=u=>u.profile.id,advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));
  assert.equal((await post('resolve')).status,403);assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),a)).status,200);
  for(const [role,u] of [[25,a],[74,m]]){const action=command(`official.${role}.inspect-role`,[id(w)]);ok(await post('actions',action,u));assert.equal(ok(await post('actions',action,u)).action.duplicate,true);}
  if(side==='village')ok(await post('actions',command('official.9.snow-protection',[id(g)]),g));
  ok(await post('actions',command('official.48.pack-bite',[id(g),id(m)]),w));await advance();assert.equal((await view(host)).phase,'WITCH_WINDOW');
  assert.equal((await post('resolve')).status,403);assert.equal((await post('advance-night',{expectedRevision:(await view(host)).revision},users[1])).status,403);
  const rescueCap=(await view(d)).capabilities.find(c=>c.skillId==='official.87.rescue');assert(rescueCap);assert.deepEqual(new Set(rescueCap.eligibleTargetIds),new Set(side==='village'?[id(m)]:[id(g),id(m)]));
  for(const u of [a,g,m,w])assert(!(await view(u)).capabilities.some(c=>c.skillId==='official.87.rescue'));
  await h.restart();assert.equal((await view(d)).phase,'WITCH_WINDOW');assert.deepEqual(new Set((await view(d)).capabilities.find(c=>c.skillId==='official.87.rescue').eligibleTargetIds),new Set(rescueCap.eligibleTargetIds));
  for(const u of users){const socket=await h.socket(u,room);await socket.subscribe(game.gameId);}
  if(side==='village')ok(await post('actions',command('official.87.rescue',[id(m)]),d));await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');
  for(const u of [g,m])assert.equal((await view(d)).players.find(p=>p.playerId===id(u)).publicReportedDead,side==='wolf');
  const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
  for(const [u,role] of [[a,25],[m,74],[w,48],[g,9],[d,87]]){const es=await events(u);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,Number(role===25));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,Number(role===74));}
  assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),m)).status,200);
  ok(await post('chat',{text:'Five humans',messageId:randomUUID()},a));assert((await events(w)).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
  ok(await post('voting-open'));if(side==='wolf')assert.notEqual((await post('votes',ballot(id(w)),m)).status,200);
  if(side==='village'){ok(await post('votes',ballot(id(w)),a));ok(await post('voting-close'));winners(await view(a),[a,g,m,d]);}
  else{ok(await post('votes',ballot(id(a)),w));ok(await post('voting-close'));winners(await view(a),[w]);}
  const before=await view(a);await h.restart();assert.deepEqual((await view(a)).winnerIds,before.winnerIds);
  for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}
  const back=await h.socket(a,room);await back.subscribe(game.gameId);back.ws.close();
  console.log('GROWTH_NORMAL_RESCUE_EVIDENCE '+JSON.stringify({deck:[9,25,48,74,87],side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true}));
 }
}));

test('Growth normal five-human guard and pharmacist: protected and rescued bite, both victory routes, restart and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Guest 1','Guest 2','Guest 3','Guest 4'].map(n=>h.account(n))),host=users[0],outsider=await h.account('Outsider');
 assert((await h.api('GET','/health')).normalDecks.some(d=>d.key==='s15-growth-guard-rescue'&&d.characterIds.join(',')==='25,31,48,74,87'));
 for(const side of ['village','wolf']){
  const room=ok(await h.api('POST','/api/rooms',{name:'Five humans',capacity:5},host),201).room.id,rp='/api/rooms/'+room;
  for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));
  const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));
  assert.equal((await h.api('POST',rp+'/configure',{deck:'knight'},host)).status,409);ok(await h.api('POST',rp+'/configure',{deck:'s15-growth-guard-rescue'},host));
  const start={mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[25,31,48,74,87],idempotencyKey:randomUUID()};
  for(const u of users.slice(0,4))ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  assert.equal((await h.api('POST',rp+'/games/start',start,host)).status,409);
  ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,users[4])).room.revision},users[4]));
  const game=ok(await h.api('POST',rp+'/games/start',start,host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),byRole={};
  for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.ruleVersion,'wolvesville-official-v1.3.3');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
  assert.deepEqual(Object.keys(byRole).sort(),['25','31','48','74','87']);await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const [w,a,g,m,d]=[48,25,31,74,87].map(i=>byRole[i]);const id=u=>u.profile.id,advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));
  assert.equal((await post('resolve')).status,403);assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),a)).status,200);
  for(const [role,u] of [[25,a],[74,m]]){const action=command(`official.${role}.inspect-role`,[id(w)]);ok(await post('actions',action,u));assert.equal(ok(await post('actions',action,u)).action.duplicate,true);}
  if(side==='village')ok(await post('actions',command('official.31.guard',[id(g)]),g));
  ok(await post('actions',command('official.48.pack-bite',[id(g),id(m)]),w));await advance();assert.equal((await view(host)).phase,'WITCH_WINDOW');
  assert.equal((await post('resolve')).status,403);assert.equal((await post('advance-night',{expectedRevision:(await view(host)).revision},users[1])).status,403);
  const rescueCap=(await view(d)).capabilities.find(c=>c.skillId==='official.87.rescue');assert(rescueCap);assert.deepEqual(new Set(rescueCap.eligibleTargetIds),new Set(side==='village'?[id(m)]:[id(g),id(m)]));
  for(const u of [a,g,m,w])assert(!(await view(u)).capabilities.some(c=>c.skillId==='official.87.rescue'));
  await h.restart();assert.equal((await view(d)).phase,'WITCH_WINDOW');assert.deepEqual(new Set((await view(d)).capabilities.find(c=>c.skillId==='official.87.rescue').eligibleTargetIds),new Set(rescueCap.eligibleTargetIds));
  for(const u of users){const socket=await h.socket(u,room);await socket.subscribe(game.gameId);}
  if(side==='village')ok(await post('actions',command('official.87.rescue',[id(m)]),d));await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');
  for(const u of [g,m])assert.equal((await view(d)).players.find(p=>p.playerId===id(u)).publicReportedDead,side==='wolf');
  const events=async u=>ok(await h.api('GET',path+'/events',undefined,u)).events;
  for(const [u,role] of [[a,25],[m,74],[w,48],[g,31],[d,87]]){const es=await events(u);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED').length,Number(role===25));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,Number(role===74));}
  assert.notEqual((await post('actions',command('official.74.inspect-role',[id(w)]),m)).status,200);
  ok(await post('chat',{text:'Five humans',messageId:randomUUID()},a));assert((await events(w)).some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
  ok(await post('voting-open'));if(side==='wolf')assert.notEqual((await post('votes',ballot(id(w)),m)).status,200);
  if(side==='village'){ok(await post('votes',ballot(id(w)),a));ok(await post('voting-close'));winners(await view(a),[a,g,m,d]);}
  else{ok(await post('votes',ballot(id(a)),w));ok(await post('voting-close'));winners(await view(a),[w]);}
  const before=await view(a);await h.restart();assert.deepEqual((await view(a)).winnerIds,before.winnerIds);
  for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}
  const back=await h.socket(a,room);await back.subscribe(game.gameId);back.ws.close();
  console.log('GROWTH_NORMAL_GUARD_RESCUE_EVIDENCE '+JSON.stringify({deck:[25,31,48,74,87],side,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,restart:true}));
 }
}));

test('Growth [8,25,74] actual Normal Gameplay 157 ballot combinations and replay',async()=>harness(async h=>{
 const users=await Promise.all(['Host','Guest 1','Guest 2'].map(n=>h.account(n))),host=users[0];const sockets=await Promise.all(users.map(u=>h.socket(u)));
 let count=0;for(const dead of [null,25,74]){const alive=[8,25,74].filter(r=>r!==dead),opts=[null,'',...alive];const combos=alive.length===3?opts.flatMap(a=>opts.flatMap(b=>opts.map(c=>[a,b,c]))):opts.flatMap(a=>opts.map(b=>[a,b]));for(const targets of combos){
  const rid=ok(await h.api('POST','/api/rooms',{name:'Dual seer acceptance',capacity:3},host),201).room.id,rp='/api/rooms/'+rid;for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s15-knight-dual-seer'},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
  const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:[8,25,74],idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId;
  const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u),roles={};for(const u of users){const v=await view(u);assert.equal(v.players.filter(p=>p.self).length,1);roles[v.players.find(p=>p.self).self.currentCharacterId]=u;}await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
  const id=r=>roles[r].profile.id;
  if(dead)ok(await post('actions',command('official.8.night-kill',[id(dead)]),roles[8]));ok(await post('advance-night',{expectedRevision:(await view(host)).revision}));ok(await post('voting-open'));
  for(let i=0;i<alive.length;i++)if(targets[i]!==null)ok(await post('votes',ballot(targets[i]===''?'':id(targets[i])),roles[alive[i]]));ok(await post('voting-close'));
  const tally=alive.map(r=>targets.filter(t=>t===r).length),max=Math.max(...tally),leaders=alive.filter((r,i)=>tally[i]===max),v=await view(host);
  if(!max||leaders.length!==1){assert.equal(v.phase,'NIGHT_COLLECT');assert.equal(v.completed,false);}else{const victim=leaders[0];assert(v.players.find(p=>p.playerId===id(victim)).publicReportedDead);if(victim===8)winners(v,[roles[25],roles[74]]);else if(alive.length===2)winners(v,[roles[8]]);else{assert.equal(v.phase,'NIGHT_COLLECT');assert.equal(v.completed,false);}}
  for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);}
  count++;
 }}assert.equal(count,157);console.log('GROWTH_NORMAL_BALLOTS '+JSON.stringify({deck:[8,25,74],ballotCombinations:count,mode:'NORMAL_GAMEPLAY',privacy:true,replay:true,multiClient:true}));
}));

// #87 source: separate single-use sedative and rescue; PH-01, VH57,
// V02/V03. Exercise independently from the two one-night winning journeys.
for(const protector of [9,31])test(`Stability five-player #${protector}/#87: self rescue, two resources, mute/vote expiry, dead healer continuation and replay`,()=>harness(async h=>{
 const ids=[25,protector,48,74,87].sort((a,b)=>a-b),deck=protector===9?'s15-scale-leader-rescue':'s15-growth-guard-rescue',users=await Promise.all(ids.map(r=>h.account('Five Closure '+r))),host=users[0];
 const room=ok(await h.api('POST','/api/rooms',{name:'Five closure',capacity:5},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId,byRole={};
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=host)=>h.api('POST',path+'/'+suffix,body,u);for(const u of users){const v=await view(u);assert.equal(v.mode,'NORMAL_GAMEPLAY');assert.equal(v.players.filter(p=>p.self).length,1);byRole[v.players.find(p=>p.self).self.currentCharacterId]=u;}
 const id=r=>byRole[r].profile.id,act=(r,skill,targets)=>post('actions',command(skill,targets.map(id)),byRole[r]),advance=async()=>ok(await post('advance-night',{expectedRevision:(await view(host)).revision})),dead=async r=>(await view(host)).players.find(p=>p.playerId===id(r)).publicReportedDead;
 const guard=protector===9?'official.9.snow-protection':'official.31.guard',sed='official.87.sedative',res='official.87.rescue',bite='official.48.pack-bite';
 // The two resources are independent; the healer can rescue themself even
 // when pending death. Protection and rescue cover different victims.
 ok(await act(87,sed,[48]));ok(await act(protector,guard,[25]));ok(await act(48,bite,[25,87]));await advance();assert.equal((await view(host)).phase,'WITCH_WINDOW');
 assert.deepEqual((await view(byRole[87])).capabilities.find(c=>c.skillId===res).eligibleTargetIds,[id(87)]);assert.notEqual((await act(87,res,[25])).status,200);ok(await act(87,res,[87]));await h.restart();await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');assert.equal(await dead(25),false);assert.equal(await dead(87),false);
 assert.equal((await view(byRole[48])).chat.canSend,false);assert.notEqual((await post('chat',{text:'Muted',messageId:randomUUID()},byRole[48])).status,200);ok(await post('voting-open'));assert.equal((await view(byRole[48])).voting.canVote,false);assert.notEqual((await post('votes',ballot(id(25)),byRole[48])).status,200);ok(await post('voting-close'));assert.equal((await view(host)).round,2);
 // Spent resources never come back; previous day mute and vote block expire.
 assert.notEqual((await act(87,sed,[25])).status,200);ok(await act(48,bite,[87]));await advance();assert.equal((await view(host)).phase,'WITCH_WINDOW');assert.notEqual((await act(87,res,[87])).status,200);await advance();assert.equal(await dead(87),true);assert.equal((await view(byRole[48])).chat.canSend,true);ok(await post('chat',{text:'Expired mute',messageId:randomUUID()},byRole[48]));ok(await post('voting-open'));assert.equal((await view(byRole[48])).voting.canVote,true);ok(await post('voting-close'));
 // No living pharmacist, so no phantom rescue window or resource reset.
 ok(await act(48,bite,[74]));await advance();assert.equal((await view(host)).phase,'DAY_DISCUSS');assert.equal(await dead(74),true);assert.notEqual((await act(87,sed,[48])).status,200);ok(await post('voting-open'));ok(await post('votes',ballot(id(48)),byRole[25]));ok(await post('voting-close'));winners(await view(host),[25,protector,74,87].map(r=>byRole[r]));
 for(const u of users){const replay=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(replay.verified&&replay.roleAssignmentsVerified);}console.log('STABILITY_FIVE_RESOURCE_EVIDENCE',deck);
}));

test('Five-player guard/pharmacist actual pending rescue: coordinator handoff, stale revision, retry, privacy, restart and replay',()=>harness(async h=>{
 const ids=[25,31,48,74,87],users=await Promise.all(ids.map(r=>h.account('Handoff '+r))),host=users[0],guest=users[1],outsider=await h.account('Outside');
 const room=ok(await h.api('POST','/api/rooms',{name:'Rescue handoff',capacity:5},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s15-growth-guard-rescue'},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId,roles={};
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=guest)=>h.api('POST',path+'/'+suffix,body,u),rev=async()=>ok(await h.api('GET',rp,undefined,guest)).room.revision,claim=(u,r)=>post('claim-coordinator',{expectedRoomRevision:r},u),id=r=>roles[r].profile.id;
 for(const u of users){const v=await view(u);roles[v.players.find(p=>p.self).self.currentCharacterId]=u;}await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 ok(await post('actions',command('official.48.pack-bite',[id(25),id(87)]),roles[48]));ok(await post('actions',command('official.31.guard',[id(31)]),roles[31]));ok(await post('advance-night',{expectedRevision:(await view(host)).revision},host));assert.equal((await view(host)).phase,'WITCH_WINDOW');
 const cap=(await view(roles[87])).capabilities.find(c=>c.skillId==='official.87.rescue');assert.deepEqual(new Set(cap.eligibleTargetIds),new Set([id(25),id(87)]));
 for(const u of users.filter(u=>u!==roles[87])){const v=await view(u);assert(!v.capabilities.some(c=>c.skillId==='official.87.rescue'));assert(v.players.every(p=>!p.publicReportedDead));}
 assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.equal((await claim(outsider,await rev())).status,403);
 const rescue=command('official.87.rescue',[id(87)]);ok(await post('actions',rescue,roles[87]));assert.equal(ok(await post('actions',rescue,roles[87])).action.duplicate,true);
 sockets[0].ws.close();await wait(()=>sockets[1].messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===host.profile.id&&!p.online)));assert.equal((await claim(guest,(await rev())-1)).status,409);ok(await claim(guest,await rev()));assert.equal((await view(guest)).coordinatorId,guest.profile.id);assert.equal((await post('advance-night',{expectedRevision:(await view(host)).revision},host)).status,403);assert.equal((await post('advance-night',{expectedRevision:(await view(guest)).revision-1})).status,409);
 await h.restart();for(const u of users){const ws=await h.socket(u,room);const snap=await ws.subscribe(game.gameId);assert.equal(snap.game.phase,'WITCH_WINDOW');assert.equal(snap.game.coordinatorId,guest.profile.id);}assert.equal(ok(await post('actions',rescue,roles[87])).action.duplicate,true);ok(await post('advance-night',{expectedRevision:(await view(guest)).revision}));const day=await view(guest);assert.equal(day.phase,'DAY_DISCUSS');assert(day.players.find(p=>p.playerId===id(25)).publicReportedDead);assert(!day.players.find(p=>p.playerId===id(87)).publicReportedDead);
 ok(await post('voting-open'));ok(await post('votes',ballot(id(48)),roles[74]));ok(await post('voting-close'));winners(await view(guest),[25,31,74,87].map(r=>roles[r]));for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);assert.equal(r.coordinationHistory.length,1);}
 console.log('FIVE_GUARD_PENDING_HANDOFF PASS');
}));

test('Five-player snow/pharmacist actual pending rescue: coordinator handoff, stale revision, retry, privacy, restart and replay',()=>harness(async h=>{
 const ids=[9,25,48,74,87],users=await Promise.all(ids.map(r=>h.account('Handoff '+r))),host=users[0],guest=users[1],outsider=await h.account('Outside');
 const room=ok(await h.api('POST','/api/rooms',{name:'Rescue handoff',capacity:5},host),201).room.id,rp='/api/rooms/'+room;
 for(const u of users.slice(1))ok(await h.api('POST',rp+'/join',{},u));const sockets=await Promise.all(users.map(u=>h.socket(u,room)));ok(await h.api('POST',rp+'/lock',{},host));ok(await h.api('POST',rp+'/configure',{deck:'s15-scale-leader-rescue'},host));for(const u of users)ok(await h.api('POST',rp+'/ready',{ready:true,expectedRevision:ok(await h.api('GET',rp,undefined,u)).room.revision},u));
 const game=ok(await h.api('POST',rp+'/games/start',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:ids,idempotencyKey:randomUUID()},host),201).game,path='/api/games/'+game.gameId,roles={};
 const view=async u=>ok(await h.api('GET',path,undefined,u)).game,post=(suffix,body={},u=guest)=>h.api('POST',path+'/'+suffix,body,u),rev=async()=>ok(await h.api('GET',rp,undefined,guest)).room.revision,claim=(u,r)=>post('claim-coordinator',{expectedRoomRevision:r},u),id=r=>roles[r].profile.id;
 for(const u of users){const v=await view(u);roles[v.players.find(p=>p.self).self.currentCharacterId]=u;}await Promise.all(sockets.map(s=>s.subscribe(game.gameId)));
 ok(await post('actions',command('official.48.pack-bite',[id(25),id(87)]),roles[48]));ok(await post('actions',command('official.9.snow-protection',[id(9)]),roles[9]));ok(await post('advance-night',{expectedRevision:(await view(host)).revision},host));assert.equal((await view(host)).phase,'WITCH_WINDOW');
 const cap=(await view(roles[87])).capabilities.find(c=>c.skillId==='official.87.rescue');assert.deepEqual(new Set(cap.eligibleTargetIds),new Set([id(25),id(87)]));
 for(const u of users.filter(u=>u!==roles[87])){const v=await view(u);assert(!v.capabilities.some(c=>c.skillId==='official.87.rescue'));assert(v.players.every(p=>!p.publicReportedDead));}
 assert.equal((await h.api('GET',path,undefined,outsider)).status,403);assert.equal((await claim(outsider,await rev())).status,403);
 const rescue=command('official.87.rescue',[id(87)]);ok(await post('actions',rescue,roles[87]));assert.equal(ok(await post('actions',rescue,roles[87])).action.duplicate,true);
 sockets[0].ws.close();await wait(()=>sockets[1].messages.findLast(x=>x.type==='room.updated'&&x.room.members.some(p=>p.id===host.profile.id&&!p.online)));assert.equal((await claim(guest,(await rev())-1)).status,409);ok(await claim(guest,await rev()));assert.equal((await view(guest)).coordinatorId,guest.profile.id);assert.equal((await post('advance-night',{expectedRevision:(await view(host)).revision},host)).status,403);assert.equal((await post('advance-night',{expectedRevision:(await view(guest)).revision-1})).status,409);
 await h.restart();for(const u of users){const ws=await h.socket(u,room);const snap=await ws.subscribe(game.gameId);assert.equal(snap.game.phase,'WITCH_WINDOW');assert.equal(snap.game.coordinatorId,guest.profile.id);}assert.equal(ok(await post('actions',rescue,roles[87])).action.duplicate,true);ok(await post('advance-night',{expectedRevision:(await view(guest)).revision}));const day=await view(guest);assert.equal(day.phase,'DAY_DISCUSS');assert(day.players.find(p=>p.playerId===id(25)).publicReportedDead);assert(!day.players.find(p=>p.playerId===id(87)).publicReportedDead);
 ok(await post('voting-open'));ok(await post('votes',ballot(id(48)),roles[74]));ok(await post('voting-close'));winners(await view(guest),[9,25,74,87].map(r=>roles[r]));for(const u of users){const r=ok(await h.api('GET',path+'/replay',undefined,u)).replay;assert(r.verified&&r.roleAssignmentsVerified);assert.equal(r.coordinationHistory.length,1);}
 console.log('FIVE_SNOW_PENDING_HANDOFF PASS');
}));
