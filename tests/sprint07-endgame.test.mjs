import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {KNIGHT_SKILL} from '../dist/backend/src/official/solo-rules.js';
import {auditRawBallots} from '../dist/backend/src/engine/vote-review.js';
import {OFFICIAL_TEST_PACK} from '../dist/backend/src/official/inspection-rules.js';
const password='Safe-Local-2026-Password';
async function setup(file=':memory:') {
 const store=new SqliteMultiplayerStore(file);const app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 const request=async(method,path,body,token)=>{const r=await fetch(base+path,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};};
 async function user(){const username='s07'+randomUUID().replaceAll('-','').slice(0,18);assert.equal((await request('POST','/api/auth/register',{username,password})).http,201);return request('POST','/api/auth/login',{username,password});}
 return {store,app,request,user,base};
}
async function match(c,roles=[8,25]) {
 const users=await Promise.all(roles.map(()=>c.user()));const room=(await c.request('POST','/api/rooms',{name:'Verified closed deck',capacity:users.length},users[0].token)).room;
 for(const u of users.slice(1))assert.equal((await c.request('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.request('POST',`/api/rooms/${room.id}/lock`,{},users[0].token)).http,200);
 const started=await c.request('POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:roles,idempotencyKey:`s07-start-${randomUUID()}`},users[0].token);
 assert.equal(started.http,201,JSON.stringify(started));const id=started.game.gameId,byRole={};
 for(const u of users){const view=(await c.request('GET',`/api/games/${id}`,undefined,u.token)).game;const role=view.players.find(p=>p.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;
  assert.equal(view.players.filter(p=>p.self).length,1);
 }
 return {users,room,id,byRole,host:users[0]};
}
async function knightAct(c,m,extra={}) {
 return c.request('POST',`/api/games/${m.id}/actions`,{skillId:KNIGHT_SKILL,targetIds:[m.byRole[25].profile.id],actionId:'s07-knight-action-0001',idempotencyKey:'s07-knight-idempotency-0001',...extra},m.byRole[8].token);
}
function timer(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
async function ws(c,user,gameId){const socket=new WebSocket(c.base.replace('http','ws')+'/ws'),messages=[];
 socket.addEventListener('message',e=>{try{messages.push(JSON.parse(e.data));}catch{}});
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
 socket.send(JSON.stringify({type:'auth',token:user.token}));await until(()=>messages.some(m=>m.type==='auth.ok'));
 socket.send(JSON.stringify({type:'game.subscribe',gameId}));await until(()=>messages.some(m=>m.type==='game.snapshot'));return {socket,messages};
}
async function until(f){for(let i=0;i<150;i++){if(f())return;await timer(20);}throw new Error('WebSocket event not received');}

test('S07-01 certified #8 night kill commits legitimate #8 sole-survivor match end, replay and ACL',{timeout:35000},async()=>{
 const c=await setup(),sockets=[];try{
 const m=await match(c),before8=(await c.request('GET',`/api/games/${m.id}`,undefined,m.byRole[8].token)).game;
 assert.equal(before8.phase,'NIGHT_COLLECT');assert.equal(before8.capabilities[0].skillId,KNIGHT_SKILL);
 const w8=await ws(c,m.byRole[8],m.id),w25=await ws(c,m.byRole[25],m.id);sockets.push(w8,w25);
 const submission=await knightAct(c,m,{playerId:m.byRole[25].profile.id,characterId:25,priority:-999,seed:'attacker-chosen'});
 assert.equal(submission.http,200);assert.equal(submission.action.status,'ACCEPTED');
 const still=(await c.request('GET',`/api/games/${m.id}`,undefined,m.byRole[25].token)).game;
 assert.equal(still.completed,false);assert.ok(still.players.every(p=>!p.publicReportedDead));
 assert.equal((await knightAct(c,m)).action.duplicate,true);
 const outsider=await c.user();assert.equal((await c.request('GET',`/api/games/${m.id}`,undefined,outsider.token)).http,403);
 const resolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
 assert.equal(resolved.http,200,JSON.stringify(resolved));assert.equal(resolved.resolution.phase,'GAME_COMPLETED');assert.equal(resolved.resolution.verified,true);
 await until(()=>w8.messages.some(x=>x.type==='game.state_updated'&&x.game.completed));await until(()=>w25.messages.some(x=>x.type==='game.state_updated'&&x.game.completed));
 const result8=(await c.request('GET',`/api/games/${m.id}`,undefined,m.byRole[8].token)).game;
 const result25=(await c.request('GET',`/api/games/${m.id}`,undefined,m.byRole[25].token)).game;
 assert.deepEqual(result8.winnerIds,[m.byRole[8].profile.id]);assert.deepEqual(result25.winnerIds,result8.winnerIds);
 assert.equal(result25.players.find(p=>p.playerId===m.byRole[25].profile.id).self.life,'DEAD_FINAL');
 for(const u of m.users){const events=(await c.request('GET',`/api/games/${m.id}/events`,undefined,u.token)).events;
  const elimination=events.find(x=>x.eventType==='PLAYER_ELIMINATED');assert(elimination);assert.deepEqual(elimination.payload,{playerId:m.byRole[25].profile.id});
  assert.equal('actorId' in elimination,false);assert.equal('characterId' in elimination.payload,false);
  assert.equal(events.some(x=>x.eventType==='VERIFIED_ELIMINATION_AUDIT'),false);
  const win=events.find(x=>x.eventType==='MATCH_COMPLETED');assert.equal(win.payload.winnerIds[0],m.byRole[8].profile.id);
  assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,u.token)).replay.verified,true);
 }
 assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,409);
 assert.equal((await knightAct(c,m,{actionId:'s07-new-action-0002',idempotencyKey:'s07-new-key-0002'})).http,409);
 const audit=withKernel((await c.store.gameById(m.id)).archive,false,(eng,repo)=>({state:eng.getInternalState(m.id),events:repo.events(m.id)}),true).value;
 assert.equal(audit.state.completed,true);assert.equal(audit.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);
 }finally{sockets.forEach(w=>w.socket.close());await c.app.close();}
});

test('S07-02 knight restricted pack does not fabricate winner if no committed elimination',{timeout:30000},async()=>{
 const c=await setup();try{const m=await match(c);
 const resolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);assert.equal(resolved.http,200);assert.equal(resolved.resolution.phase,'DAY_DISCUSS');
 const state=withKernel((await c.store.gameById(m.id)).archive,false,eng=>eng.getInternalState(m.id),true).value;
 assert.equal(state.completed,false);assert.deepEqual(state.winnerIds,[]);
 assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.host.token)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S07-03 raw vote audit never elects a hanging target and is never projected to clients',{timeout:30000},async()=>{
 assert.deepEqual(auditRawBallots([]).leaders,[]);
 const tie=auditRawBallots([{voterId:'v1',targetId:'a',ballotId:'a1',idempotencyKey:'k1'},{voterId:'v2',targetId:'b',ballotId:'a2',idempotencyKey:'k2'}]);
 assert.equal(tie.equalTop,true);assert.equal(tie.adjudication,'RULE_UNRESOLVED');
 const single=auditRawBallots([{voterId:'v1',targetId:'a',ballotId:'a1',idempotencyKey:'k1'}]);assert.equal(single.equalTop,false);assert.equal(single.adjudication,'RULE_UNRESOLVED');
 const c=await setup();try{const m=await match(c,[25,74]);
 assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,200);
 assert.equal((await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token)).http,200);
 for(const [i,u] of m.users.entries()){assert.equal((await c.request('POST',`/api/games/${m.id}/votes`,{targetId:m.users[1-i].profile.id,ballotId:`s07-ballot-${i}`,idempotencyKey:`s07-idem-${i}`},u.token)).http,200);}
 assert.equal((await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.host.token)).http,200);
 const internal=withKernel((await c.store.gameById(m.id)).archive,false,eng=>({state:eng.getInternalState(m.id),review:eng.voteReviewInternal(m.id)}),true).value;
 assert.equal(internal.review.equalTop,true);assert.equal(internal.review.ballots,2);
 assert.equal(internal.state.completed,false);assert.ok(internal.state.participants.every(p=>p.life==='ALIVE'));
 for(const u of m.users){const game=(await c.request('GET',`/api/games/${m.id}`,undefined,u.token)).game;
  assert.equal(JSON.stringify(game).includes('counts'),false);assert.equal(JSON.stringify(game).includes('leaders'),false);
  assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,u.token)).replay.verified,true);}
 }finally{await c.app.close();}
});

test('S07-04 SQLite restart persists certified endgame, action, and player-facing result',{timeout:40000},async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s07-persist-')),file=join(dir,'app.sqlite');let c,c2;
 try{c=await setup(file);const m=await match(c);assert.equal((await knightAct(c,m)).http,200);assert.equal((await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token)).http,200);
 const before=withKernel((await c.store.gameById(m.id)).archive,false,eng=>eng.getInternalState(m.id),true).value;
 await c.app.close();c=null;
 c2=await setup(file);const after=withKernel((await c2.store.gameById(m.id)).archive,false,eng=>eng.getInternalState(m.id),true).value;
 assert.deepEqual(after,before);assert.equal(after.completed,true);
 const projection=(await c2.request('GET',`/api/games/${m.id}`,undefined,m.byRole[8].token)).game;
 assert.deepEqual(projection.winnerIds,[m.byRole[8].profile.id]);assert.equal((await c2.request('GET',`/api/games/${m.id}/replay`,undefined,m.byRole[8].token)).replay.verified,true);
 }finally{if(c)await c.app.close();if(c2)await c2.app.close();rmSync(dir,{recursive:true,force:true});}
});

test('S07-05 simultaneous accepted knight kill and seer inspection: two actions resolve once, private inspection and simultaneous endgame',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c);
  const attack=knightAct(c,m);
  const look=c.request('POST',`/api/games/${m.id}/actions`,{actionId:'seer-s07-action-01',idempotencyKey:'seer-s07-idem-01',skillId:'official.25.inspect-role',targetIds:[m.byRole[8].profile.id]},m.byRole[25].token);
  const [one,two]=await Promise.all([attack,look]);assert.equal(one.http,200);assert.equal(two.http,200);
  const resolved=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  assert.equal(resolved.http,200,JSON.stringify(resolved));assert.equal(resolved.resolution.resolved,2);
  assert.equal(resolved.resolution.phase,'GAME_COMPLETED');
  const seerEvents=(await c.request('GET',`/api/games/${m.id}/events`,undefined,m.byRole[25].token)).events;
  const knightEvents=(await c.request('GET',`/api/games/${m.id}/events`,undefined,m.byRole[8].token)).events;
  assert.equal(seerEvents.filter(x=>x.eventType==='SEER_AURA_OBSERVED'&&x.payload.verdict==='Không xác định'&&!('characterId' in x.payload)).length,1);
  assert.equal(knightEvents.filter(x=>['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(x.eventType)).length,0);
  assert.equal(knightEvents.filter(x=>x.eventType==='PLAYER_ELIMINATED').length,1);
  assert.equal(knightEvents.filter(x=>x.eventType==='MATCH_COMPLETED').length,1);
  assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.byRole[25].token)).replay.verified,true);
 }finally{await c.app.close();}
});

test('S07-06 rejected forged roles and unauthorized character actions cannot mutate state',{timeout:35000},async()=>{
 const c=await setup();try{const m=await match(c);const before=(await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.host.token)).replay;
  const forbidden=await c.request('POST',`/api/games/${m.id}/actions`,{actionId:'forged-s07-0001',idempotencyKey:'forged-s07-key1',skillId:KNIGHT_SKILL,playerId:m.byRole[8].profile.id,currentCharacterId:8,targetIds:[m.byRole[8].profile.id]},m.byRole[25].token);
  assert.equal(forbidden.http,400);assert.equal(forbidden.error.code,'UNAUTHORIZED');
  const self=await knightAct(c,m,{targetIds:[m.byRole[8].profile.id],actionId:'self-s07-0001',idempotencyKey:'self-s07-key1'});
  assert.equal(self.http,409);assert.equal(self.error.code,'TARGET_INVALID');
  const after=(await c.request('GET',`/api/games/${m.id}/replay`,undefined,m.host.token)).replay;
  assert.equal(after.verified,true);assert.equal(after.events,before.events);
  const outsider=await c.user();assert.equal((await c.request('GET',`/api/games/${m.id}/events`,undefined,outsider.token)).http,403);
 }finally{await c.app.close();}
});
