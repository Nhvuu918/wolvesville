/** Full HTTP -> GameCoordinator -> Kernel -> persisted SQLite archive -> replay.
 * Tests have no pre-filled resolved effects and do not bypass the Engine. */
import test from 'node:test';
delete process.env.WV_ARCHIVED_RULE_REGRESSION;
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {hasClosedDeathLedger} from '../dist/backend/src/official/stable-death-proof.js';

import {S13_SKILLS,S13_STATUS} from '../dist/backend/src/official/s13-mechanics.js';

async function setup(path=':memory:'){
 const store=new SqliteMultiplayerStore(path),app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start(),base=`http://127.0.0.1:${port}`;
 const call=async(method,url,body,token)=>{const resp=await fetch(base+url,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:resp.status,...await resp.json()};};
 const user=async()=>{const name=`s13${randomUUID().replaceAll('-','').slice(0,16)}`;
  assert.equal((await call('POST','/api/auth/register',{username:name,password:'S13Strong2026Pass!'})).http,201);
  const u=await call('POST','/api/auth/login',{username:name,password:'S13Strong2026Pass!'});assert.equal(u.http,200);return u;};
 return {store,app,call,user,base};
}
async function match(c,roles,qaProfile){
 const users=await Promise.all(roles.map(()=>c.user())),host=users[0];
 const room=(await c.call('POST','/api/rooms',{name:'S13 Official Character Tests',capacity:roles.length},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const r=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,...(qaProfile?{qaProfile}:{}),idempotencyKey:`start-${randomUUID()}`},host.token);
 assert.equal(r.http,201,JSON.stringify(r));
 const gameId=r.game.gameId,byRole={};
 for(const u of users){const v=await c.call('GET',`/api/games/${gameId}`,undefined,u.token);
  assert.equal(v.http,200);const role=v.game.players.find(x=>x.playerId===u.profile.id).self.currentCharacterId;byRole[role]=u;}
 return {gameId,host,users,byRole};
}
async function action(c,m,role,target,skill){
 return c.call('POST',`/api/games/${m.gameId}/actions`,{skillId:skill,targetIds:[m.byRole[target].profile.id],actionId:`act-${randomUUID()}`,idempotencyKey:`key-${randomUUID()}`},m.byRole[role].token);
}
async function resolve(c,m){return c.call('POST',`/api/games/${m.gameId}/resolve`,{},m.host.token);}
async function state(c,m){const game=await c.store.gameById(m.gameId);
 return withKernel(game.archive,false,(e,repo)=>({state:e.getInternalState(m.gameId),events:repo.events(m.gameId)}),true).value;
}
async function nextNight(c,m){const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'NIGHT_COLLECT');}
async function checkReplay(c,m){for(const u of m.users){const r=await c.call('GET',`/api/games/${m.gameId}/replay`,undefined,u.token);assert.equal(r.http,200);assert.equal(r.replay.verified,true);}}


const ok=x=>{assert.equal(x.http,200,JSON.stringify(x));return x;};
const mute='official.84.silence';
async function wsClient(c,user){
 const ws=new WebSocket(c.base.replace('http:','ws:')+'/ws'),messages=[];
 ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
 await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});
 const wait=async predicate=>{const until=Date.now()+5000;while(Date.now()<until){const m=messages.find(predicate);if(m)return m;await new Promise(r=>setTimeout(r,10));}throw Error('WS timeout '+JSON.stringify(messages));};
 const send=body=>ws.send(JSON.stringify(body));send({type:'auth',token:user.token});await wait(m=>m.type==='auth.ok');return {ws,send,wait,messages};
}
test('S23 #84: existing voting deck, channel isolation, mute expiry, repeated use, restart and real victory',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s23-mute-')),file=join(dir,'run.sqlite');let c,w;
 try{c=await setup(file);const m=await match(c,[25,33,74,84]),id=r=>m.byRole[r].profile.id,path=`/api/games/${m.gameId}`;
 const post=(r,endpoint,body)=>c.call('POST',path+'/'+endpoint,body,m.byRole[r].token);
 const get=async r=>ok(await c.call('GET',path,undefined,m.byRole[r].token)).game;
 const ev=async r=>ok(await c.call('GET',path+'/events',undefined,m.byRole[r].token)).events;
 const vote=(r,targetId)=>post(r,'votes',{targetId,ballotId:randomUUID(),idempotencyKey:randomUUID()});
 const host=(ep)=>c.call('POST',path+'/'+ep,{},m.host.token);
 const cmd={skillId:mute,targetIds:[id(33)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 assert.notEqual((await action(c,m,84,84,mute)).http,200);assert.notEqual((await action(c,m,25,33,mute)).http,200);
 ok(await post(84,'actions',cmd));assert(ok(await post(84,'actions',cmd)).action.duplicate);assert.notEqual((await action(c,m,84,74,mute)).http,200);
 await c.app.close();c=await setup(file);ok(await resolve(c,m));
 assert.deepEqual((await get(33)).chat,{enabled:true,canSend:false,muted:true});assert((await get(25)).chat.canSend);
 const wrong={channel:'WOLF',text:'private-intent-do-not-broadcast',messageId:randomUUID()};
 assert.notEqual((await post(25,'chat',wrong)).http,200,'Unrecognized channel must never be routed to public chat');
 assert(!(await ev(84)).some(e=>e.payload?.text===wrong.text));
 const publicMsg={channel:'PUBLIC',text:'public-day-one',messageId:randomUUID()};
 ok(await post(25,'chat',publicMsg));assert(ok(await post(25,'chat',publicMsg)).chat.duplicate);
 assert.notEqual((await post(33,'chat',{text:'muted',messageId:randomUUID()})).http,200);
 w=await wsClient(c,m.byRole[25]);w.send({type:'game.subscribe',gameId:m.gameId});await w.wait(e=>e.type==='game.snapshot');
 w.send({type:'game.chat',gameId:m.gameId,chat:{channel:'GROUP',text:'private-ws-do-not-broadcast',messageId:randomUUID()}});await w.wait(e=>e.type==='error');
 assert(!(await ev(84)).some(e=>e.payload?.text==='private-ws-do-not-broadcast'));w.ws.close();w=null;
 const outsider=await c.user();assert.equal((await c.call('POST',path+'/chat',publicMsg,outsider.token)).http,403);
 assert((await ev(33)).some(e=>e.payload?.text===publicMsg.text));
 for(const r of [25,33,74,84]){const es=await ev(r);assert.deepEqual(es.filter(e=>e.eventType==='PUBLIC_CHAT_MUTED').map(e=>e.payload),[{playerId:id(33)}]);assert(!es.some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));assert(es.filter(e=>e.eventType==='PUBLIC_CHAT_MUTED').every(e=>!e.actorId));}
 ok(await host('voting-open'));ok(await vote(33,''));ok(await host('voting-close'));
 let v=await state(c,m);assert.equal(v.state.phase,'NIGHT_COLLECT');assert(!v.state.participants.find(p=>p.playerId===id(33)).effects.some(e=>e.kind===S13_STATUS.mute),'expired mute must not remain active or in live status storage');
 ok(await action(c,m,84,74,mute));ok(await action(c,m,74,33,'official.74.inspect-role'));ok(await resolve(c,m));
 assert((await get(33)).chat.canSend);assert((await get(74)).chat.muted);assert((await ev(74)).some(e=>e.eventType==='ROLE_OBSERVED'&&e.payload.characterId===33));
 ok(await post(33,'chat',{text:'restored',messageId:randomUUID()}));await c.app.close();c=await setup(file);assert((await get(74)).chat.muted);
 ok(await host('voting-open'));ok(await vote(74,id(33)));ok(await host('voting-close'));assert.equal((await state(c,m)).state.resolutionGate.status,'PENDING_EFFECT');
 ok(await post(33,'actions',{skillId:'official.33.hanging-revenge-skip',targetIds:[],actionId:randomUUID(),idempotencyKey:randomUUID()}));v=await state(c,m);assert(v.state.completed);assert.deepEqual(new Set(v.state.winnerIds),new Set([id(25),id(74),id(84)]));assert(hasClosedDeathLedger(v.state,v.events));await checkReplay(c,m);
 }finally{w?.ws.close();await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});

import {orderResolutionActions,cancelledByPeace} from '../dist/backend/src/engine/queue.js';
test('S23 PH-02 pending day skills order and cancellation cutoff; archived rules unaffected',()=>{
 const s={ruleVersion:'wolvesville-official-v1.3.3',phase:'DAY_VOTE_COLLECT',voting:{status:'OPEN'}};
 const item=(skillId,priority)=>({item:{action:{skillId,playerId:'actor',actionId:skillId}},rule:{priority}});
 const ordinary=item('official.33.hanging-revenge',4),peace=item('official.79.cancel-vote-reveal',5);
 assert.deepEqual(orderResolutionActions(s,[ordinary,peace]),[peace,ordinary]);
 assert.deepEqual(orderResolutionActions({...s,ruleVersion:'wolvesville-official-v1.3.2'},[ordinary,peace]),[ordinary,peace]);
 assert.equal(cancelledByPeace(s),false);assert.equal(cancelledByPeace({...s,voting:{status:'CANCELLED'}}),true);
 assert.equal(cancelledByPeace({...s,phase:'NIGHT_COLLECT',voting:{status:'CANCELLED'}}),false);
});
test('S23 #79 accepted cancellation survives restart; private role, no elimination, once per match, replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s23-peace-')),file=join(dir,'run.sqlite');let c;
 try{c=await setup(file);const m=await match(c,[25,28,79]),id=r=>m.byRole[r].profile.id,path=`/api/games/${m.gameId}`;
 const post=(r,endpoint,body)=>c.call('POST',path+'/'+endpoint,body,m.byRole[r].token);const host=ep=>c.call('POST',path+'/'+ep,{},m.host.token);
 const cmd={skillId:'official.79.cancel-vote-reveal',targetIds:[id(28)],actionId:randomUUID(),idempotencyKey:randomUUID()};
 ok(await resolve(c,m));ok(await host('voting-open'));ok(await post(25,'votes',{targetId:id(28),ballotId:randomUUID(),idempotencyKey:randomUUID()}));
 ok(await post(79,'actions',cmd));assert(ok(await post(79,'actions',cmd)).action.duplicate);await c.app.close();c=await setup(file);ok(await resolve(c,m));
 let v=await state(c,m);assert.equal(v.state.voting.status,'CANCELLED');assert.equal(v.state.phase,'NIGHT_COLLECT');assert(!v.state.completed);assert(!v.events.some(e=>e.eventType==='PLAYER_ELIMINATED'));
 for(const r of [25,28,79]){const es=ok(await c.call('GET',path+'/events',undefined,m.byRole[r].token)).events;assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED').length,r===79?1:0);assert.equal(es.filter(e=>e.eventType==='VOTING_CANCELLED').length,1);}
 ok(await resolve(c,m));ok(await host('voting-open'));assert.notEqual((await action(c,m,79,28,cmd.skillId)).http,200);ok(await post(25,'votes',{targetId:id(28),ballotId:randomUUID(),idempotencyKey:randomUUID()}));ok(await host('voting-close'));v=await state(c,m);assert(v.state.completed);assert.deepEqual(new Set(v.state.winnerIds),new Set([id(28),id(79)]));await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
});
