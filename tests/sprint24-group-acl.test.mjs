/** Transport/ACL contract for server-issued grants. The initial grant is a
 * trusted storage fixture: not an assertion that #90 recruitment is live. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID,randomBytes,createHmac,createHash} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {withKernel} from '../dist/backend/src/game/archive.js';
import {draw} from '../dist/backend/src/engine/rng.js';
import {grantCommittedCultChat,revokeSystemChatMember,prepareSystemGroupChat,systemGroupChatView} from '../dist/backend/src/official/group-chat.js';
import {projectEvents} from '../dist/backend/src/engine/visibility.js';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
delete process.env.WV_ARCHIVED_RULE_REGRESSION;
import {roles,seedState,archive,startGroupFixture} from './fixtures/s24-group-archive.mjs';
const msg=(groupId,text='private message')=>({channel:'GROUP',groupId,text,messageId:randomUUID()});
test('S24 group ACL: muted member, frozen audience, hidden ledger positions, restart and replay',()=>{
 const f=seedState('fixture-room',roles.map(r=>({playerId:`role-${r}`,characterId:r})),'fixture-game','seed-1234567890'),k=archive(f.s),gid=f.s.gameId;
 const body=msg(f.group.id);
 const b=withKernel(k.archive,false,(e,r)=>{const before=e.getInternalState(gid);assert.equal(e.systemGroupChatProjection(gid,f.member)[0].canSend,true);assert.deepEqual(e.systemGroupChatProjection(gid,f.outsider),[]);assert.throws(()=>e.sendSystemGroupChat(gid,f.outsider,body),/Group chat unavailable/);assert.throws(()=>e.sendSystemGroupChat(gid,f.member,{...body,recipientId:f.outsider}),/Invalid group message/);const x=e.sendSystemGroupChat(gid,f.member,body);assert.deepEqual(x.privateRefreshIds,[f.owner,f.member]);assert.equal(x.revision,before.revision);assert.deepEqual(e.getInternalState(gid),before);return x;},true);
 assert(b.replay.verified);assert.equal(b.events.length,k.events.length+1);assert.deepEqual(projectEvents(b.state,b.events,{viewerId:f.outsider}),projectEvents(k.state,k.events,{viewerId:f.outsider}));
 const after=withKernel(b.archive,false,(e,r)=>{assert(e.sendSystemGroupChat(gid,f.member,body).duplicate);assert.throws(()=>e.sendSystemGroupChat(gid,f.member,{...body,text:'changed'}),/Chat key reused/);return e.transition(gid,'DAY_VOTE_COLLECT');},true);
 const control=withKernel(k.archive,false,e=>e.transition(gid,'DAY_VOTE_COLLECT'),true);
 assert(after.replay.verified);assert.deepEqual(projectEvents(after.state,after.events,{viewerId:f.outsider}),projectEvents(control.state,control.events,{viewerId:f.outsider}));
 const s=structuredClone(after.state);s.phase='NIGHT_RESOLVE';grantCommittedCultChat(s,f.owner,f.outsider,'fixture-later-recruit');s.phase='DAY_DISCUSS';
 assert(!projectEvents(s,after.events,{viewerId:f.outsider}).some(e=>e.payload.text===body.text));
 revokeSystemChatMember(s,f.group.id,f.member);assert.deepEqual(systemGroupChatView(s,f.member),[]);assert.throws(()=>prepareSystemGroupChat(s,after.events,f.member,msg(f.group.id)),/Group chat unavailable/);assert(projectEvents(s,after.events,{viewerId:f.member}).some(e=>e.payload.text===body.text));
 s.phase='NIGHT_COLLECT';assert.equal(systemGroupChatView(s,f.owner)[0].canSend,false);assert.throws(()=>prepareSystemGroupChat(s,after.events,f.owner,msg(f.group.id)),/Group chat unavailable/);
});
async function server(file){const store=new SqliteMultiplayerStore(file),app=createMultiplayerServer(store,{officialRuleTestMode:true}),port=await app.start(),base=`http://127.0.0.1:${port}`;const call=async(method,url,body,token)=>{const r=await fetch(base+url,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {http:r.status,...await r.json()};};const user=async()=>{const username=`acl${randomUUID().replaceAll('-','').slice(0,16)}`;assert.equal((await call('POST','/api/auth/register',{username,password:'S24Strong2026Pass!'})).http,201);return call('POST','/api/auth/login',{username,password:'S24Strong2026Pass!'});};return {store,app,base,call,user};}
async function ws(c,u,gid){const conn=new WebSocket(c.base.replace('http:','ws:')+'/ws'),messages=[];conn.addEventListener('message',e=>messages.push(JSON.parse(e.data)));await new Promise((resolve,reject)=>{conn.addEventListener('open',resolve,{once:true});conn.addEventListener('error',reject,{once:true});});const send=b=>conn.send(JSON.stringify(b));const wait=async p=>{const deadline=Date.now()+5000;while(Date.now()<deadline){const m=messages.find(p);if(m)return m;await new Promise(r=>setTimeout(r,10));}throw Error('WS timeout '+JSON.stringify(messages));};send({type:'auth',token:u.token});await wait(m=>m.type==='auth.ok');send({type:'game.subscribe',gameId:gid});await wait(m=>m.type==='game.snapshot');return {conn,messages,send,wait};}
const ok=r=>{assert.equal(r.http,200,JSON.stringify(r));return r;};
test('S24 group ACL HTTP/WS: trusted grant fixture, no public fallback, restricted refresh, SQLite restart and replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s24-')),file=join(dir,'state.sqlite');let c,clients=[];
 try{c=await server(file);const users=await Promise.all(roles.map(()=>c.user())),host=users[0];const room=(await c.call('POST','/api/rooms',{name:'S24 storage ACL fixture',capacity:roles.length},host.token)).room;for(const u of users.slice(1))ok(await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token));ok(await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token));
 const {gameId:gid}=await startGroupFixture(c.store,room.id);const saved=await c.store.gameById(gid),f=withKernel(saved.archive,false,(e)=>{const state=e.getInternalState(gid);return {group:state.systemChatGroups[0],owner:state.participants.find(p=>p.initialCharacterId===90).playerId,member:state.participants.find(p=>p.initialCharacterId===25).playerId,outsider:state.participants.find(p=>p.initialCharacterId===74).playerId};},true).value;
 const user=id=>users.find(u=>u.profile.id===id),path=`/api/games/${gid}`,get=async(id,suffix='')=>ok(await c.call('GET',path+suffix,undefined,user(id).token)),post=(id,body)=>c.call('POST',path+'/chat',body,user(id).token);
 const before=await get(f.outsider),replayBefore=await get(f.outsider,'/replay');assert.equal(before.game.groupChat,undefined);assert.equal((await get(f.member)).game.groupChat[0].canSend,true);
 const outsider=await ws(c,user(f.outsider),gid),member=await ws(c,user(f.member),gid),owner=await ws(c,user(f.owner),gid);clients=[outsider,member,owner];await new Promise(r=>setTimeout(r,50));const n=outsider.messages.length;
 const m=msg(f.group.id,'group-only-transport');assert.notEqual((await post(f.outsider,m)).http,200);ok(await post(f.member,m));await owner.wait(e=>e.type==='game.events'&&e.events.some(x=>x.payload?.text===m.text));assert.equal(outsider.messages.length,n);assert.deepEqual(await get(f.outsider),before);assert.deepEqual(await get(f.outsider,'/replay'),replayBefore);assert(!(await get(f.outsider,'/events')).events.some(e=>e.payload.text===m.text));
 const m2=msg(f.group.id,'group-only-ws');member.send({type:'game.chat',gameId:gid,chat:m2});await member.wait(e=>e.type==='game.chat_accepted');await owner.wait(e=>e.type==='game.events'&&e.events.some(x=>x.payload?.text===m2.text));assert.equal(outsider.messages.length,n);assert.equal((await get(f.member,'/replay')).replay.verified,true);
 for(const w of clients)w.conn.close();clients=[];await c.app.close();c=await server(file);assert(ok(await post(f.member,m)).chat.duplicate);assert.equal((await get(f.owner,'/events')).events.filter(e=>e.payload.text===m.text).length,1);assert.equal((await get(f.owner,'/replay')).replay.verified,true);assert.deepEqual(await get(f.outsider,'/replay'),replayBefore);
 }finally{for(const w of clients)w.conn.close();if(c)await c.app.close();rmSync(dir,{recursive:true,force:true});}
});
