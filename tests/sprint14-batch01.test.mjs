/** Full HTTP -> GameCoordinator -> Kernel -> persisted SQLite archive -> replay.
 * Tests have no pre-filled resolved effects and do not bypass the Engine. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../dist/backend/src/game/archive.js';
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
async function match(c,roles){
 const users=await Promise.all(roles.map(()=>c.user())),host=users[0];
 const room=(await c.call('POST','/api/rooms',{name:'S13 Official Character Tests',capacity:roles.length},host.token)).room;
 for(const u of users.slice(1))assert.equal((await c.call('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.call('POST',`/api/rooms/${room.id}/lock`,{},host.token)).http,200);
 const r=await c.call('POST',`/api/rooms/${room.id}/games/start`,{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds:roles,idempotencyKey:`start-${randomUUID()}`},host.token);
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
const life=(s,m,id)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id).life;
function evidence(characterIds,source,skill){console.log('# S13_CHARACTER_EVIDENCE '+JSON.stringify({characterIds,source,skill,authoritative:true,replay:true}));}

for(const [id,skill] of [[32,S13_SKILLS.gun],[36,S13_SKILLS.fire],[67,S13_SKILLS.sword],[78,S13_SKILLS.meteor]]){
 test(`S14 #${id} authoritative attack, retry, privacy and restart`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s14-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,id]);
 const url=`/api/games/${m.gameId}/actions`,actor=m.byRole[id],victim=m.byRole[25];
 const body={skillId:skill,targetIds:[victim.profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 const bad=await c.call('POST',url,{...body,targetIds:[actor.profile.id]},actor.token);assert.notEqual(bad.http,200);
 const first=await c.call('POST',url,body,actor.token);assert.equal(first.http,200,JSON.stringify(first));
 const retry=await c.call('POST',url,body,actor.token);assert.equal(retry.http,200,JSON.stringify(retry));
 const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));
 const old=await state(c,m);assert.equal(life(old.state,m,25),'DEAD_FINAL');
 assert.equal(old.events.filter(e=>e.eventType==='PLAYER_ELIMINATED').length,1);
 assert.equal(old.state.participants.find(p=>p.playerId===actor.profile.id).effects.filter(e=>e.kind===S13_STATUS.used&&e.payload.skillId===skill).length,1);
 const visible=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,victim.token)).events;
 const death=visible.find(e=>e.eventType==='PLAYER_ELIMINATED');assert(death);assert.equal(death.actorId??null,null);assert.equal(death.payload.skillId,undefined);
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);await checkReplay(d,m);
 console.log('S14_EVIDENCE '+JSON.stringify({id,skill,restart:true,replay:true}));
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
 });
}
test('S14 #52 solo dog consumes protection and expires',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s14-dog-')),file=join(dir,'game.sqlite');let c,d;try{c=await setup(file);const m=await match(c,[8,25,52]);
 assert.equal((await action(c,m,52,25,S13_SKILLS.dog)).http,200);
 assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);
 assert.equal((await resolve(c,m)).http,200);const s=await state(c,m);assert.equal(life(s.state,m,25),'ALIVE');assert(s.events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));
 for(const u of m.users){const events=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;assert(!events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'||e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));}
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,s.state);await nextNight(d,m);assert.equal((await action(d,m,8,25,'official.8.night-kill')).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal(life((await state(d,m)).state,m,25),'DEAD_FINAL');await checkReplay(d,m);
 console.log('S14_EVIDENCE '+JSON.stringify({id:52,skill:S13_SKILLS.dog,restart:true,replay:true}));
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});

test('S14 #23 one shield absorbs #36 fireball, then expires; persistence and private events',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s14-shield-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[23,25,36]);
 assert.equal((await action(c,m,23,25,S13_SKILLS.soulShield)).http,200);
 assert.equal((await action(c,m,36,25,S13_SKILLS.fire)).http,200);
 const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));
 const s=await state(c,m);assert.equal(life(s.state,m,25),'ALIVE');assert(s.events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));
 for(const u of m.users){const e=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;assert(!e.some(x=>['OFFICIAL_ATTACK_BLOCKED','S13_OFFICIAL_EFFECT_APPLIED'].includes(x.eventType)));}
 await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,s.state);await checkReplay(d,m);await nextNight(d,m);
 assert.equal((await action(d,m,23,25,S13_SKILLS.soulShield)).error.code,'RESOURCE_INSUFFICIENT');
 assert.equal((await action(d,m,36,25,S13_SKILLS.fire)).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal(life((await state(d,m)).state,m,25),'DEAD_FINAL');await checkReplay(d,m);
 console.log('S14_EVIDENCE '+JSON.stringify({id:23,skill:S13_SKILLS.soulShield,restart:true,replay:true}));
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S14 #16 two poison targets consume one use, faction-specific next-night effect',async()=>{
 const c=await setup();try{const m=await match(c,[16,25,76]);
 const u=m.byRole[16],body={skillId:S13_SKILLS.poison,targetIds:[m.byRole[25].profile.id,m.byRole[76].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 const url=`/api/games/${m.gameId}/actions`;assert.equal((await c.call('POST',url,body,u.token)).http,200);assert.equal((await c.call('POST',url,body,u.token)).http,200);
 assert.equal((await resolve(c,m)).http,200);const s=await state(c,m);assert.equal(s.state.participants.filter(p=>p.effects.some(x=>x.kind===S13_STATUS.poison)).length,2);
 assert.equal(s.state.participants.find(p=>p.playerId===u.profile.id).effects.filter(x=>x.kind===S13_STATUS.used).length,1);await nextNight(c,m);
 assert.equal((await action(c,m,25,76,'official.25.inspect-role')).http,200);assert.equal((await action(c,m,76,25,'official.76.nightmare')).error.code,'SKILL_LOCKED');await checkReplay(c,m);
 }finally{await c.app.close();}
});
test('S14 #32 day shot permitted, night shot in same round denied after shielded shot',async()=>{
 const c=await setup();try{const m=await match(c,[23,25,32]);
 assert.equal((await action(c,m,23,25,S13_SKILLS.soulShield)).http,200);assert.equal((await action(c,m,32,25,S13_SKILLS.gun)).http,200);assert.equal((await resolve(c,m)).http,200);
 assert.equal((await action(c,m,32,25,S13_SKILLS.gun)).error.code,'RESOURCE_INSUFFICIENT');await nextNight(c,m);assert.equal((await resolve(c,m)).http,200);
 assert.equal((await action(c,m,32,25,S13_SKILLS.gun)).http,200);assert.equal((await resolve(c,m)).http,200);assert.equal(life((await state(c,m)).state,m,25),'DEAD_FINAL');await checkReplay(c,m);
 }finally{await c.app.close();}
});
test('S14 #67 shield and sword both accepted in same night, valid shield blocks sword',async()=>{
 const c=await setup();try{const m=await match(c,[25,67]);
 assert.equal((await action(c,m,67,25,S13_SKILLS.smith)).http,200);assert.equal((await action(c,m,67,25,S13_SKILLS.sword)).http,200);
 assert.equal((await resolve(c,m)).http,200);assert.equal(life((await state(c,m)).state,m,25),'ALIVE');await nextNight(c,m);
 assert.equal((await action(c,m,67,25,S13_SKILLS.sword)).error.code,'RESOURCE_INSUFFICIENT');await checkReplay(c,m);
 }finally{await c.app.close();}
});

async function wsClient(c,user){
 const ws=new WebSocket(c.base.replace('http:','ws:')+'/ws'),messages=[];
 ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
 await new Promise((ok,no)=>{ws.addEventListener('open',ok,{once:true});ws.addEventListener('error',no,{once:true});});
 const wait=async predicate=>{const until=Date.now()+5000;while(Date.now()<until){const m=messages.find(predicate);if(m)return m;await new Promise(r=>setTimeout(r,10));}throw Error('WS timeout '+JSON.stringify(messages));};
 const send=body=>ws.send(JSON.stringify(body));send({type:'auth',token:user.token});await wait(m=>m.type==='auth.ok');return {ws,send,wait,messages};
}
for(const [id,skill] of [[84,S13_SKILLS.silence],[50,S13_SKILLS.numb]])test(`S14 #${id} public chat mute, WS/HTTP ACL, restart, expiry`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s14-chat-')),file=join(dir,'game.sqlite');let c,d,w;
 try{c=await setup(file);const m=await match(c,[25,id]),actor=m.byRole[id],target=m.byRole[25];const outsider=await c.user();
 const path=`/api/games/${m.gameId}/chat`,body={text:'Xin chào làng',messageId:randomUUID()};
 assert.equal((await c.call('POST',path,body,target.token)).error.code,'OUT_OF_PHASE');
 assert.equal((await action(c,m,25,id,'official.25.inspect-role')).http,200);assert.equal((await action(c,m,id,25,skill)).http,200);
 const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.cancelled,id===50?1:0);
 const view=await c.call('GET',`/api/games/${m.gameId}`,undefined,target.token);assert.deepEqual(view.game.chat,{enabled:true,canSend:false,muted:true});
 assert.equal((await c.call('POST',path,body,target.token)).error.code,'UNAUTHORIZED');assert.equal((await c.call('POST',path,body,outsider.token)).http,403);
 w=await wsClient(c,target);w.send({type:'game.subscribe',gameId:m.gameId});await w.wait(x=>x.type==='game.snapshot');
 w.send({type:'game.chat',gameId:m.gameId,chat:body});assert.equal((await w.wait(x=>x.type==='error')).error.code,'UNAUTHORIZED');
 assert.equal((await c.call('POST',path,body,actor.token)).http,200);assert.equal((await c.call('POST',path,body,actor.token)).chat.duplicate,true);
 await w.wait(x=>x.type==='game.events'&&x.events.some(e=>e.eventType==='GAME_PUBLIC_CHAT'));
 const before=await state(c,m);assert.equal(before.events.filter(e=>e.eventType==='GAME_PUBLIC_CHAT').length,1);
 const events=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,target.token)).events;
 assert.equal(events.filter(e=>e.eventType==='PUBLIC_CHAT_MUTED').length,1);assert.equal(events.find(e=>e.eventType==='PUBLIC_CHAT_MUTED').actorId,undefined);assert(!events.some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));
 assert.equal((await c.call('GET',`/api/games/${m.gameId}/events`,undefined,outsider.token)).http,403);
 w.ws.close();w=null;await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,before.state);await checkReplay(d,m);
 await nextNight(d,m);if(id===50)assert.notEqual((await action(d,m,id,25,skill)).http,200);assert.equal((await resolve(d,m)).http,200);
 assert.equal((await d.call('GET',`/api/games/${m.gameId}`,undefined,target.token)).game.chat.canSend,true);
 assert.equal((await d.call('POST',path,{...body,messageId:randomUUID()},target.token)).http,200);await checkReplay(d,m);
 console.log('S14_EVIDENCE '+JSON.stringify({id,skill,restart:true,replay:true}));
 }finally{w?.ws.close();await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S14 #17 judgment on villager causes persistent public-chat mute but no vote denial',async()=>{
 const c=await setup();try{const m=await match(c,[17,25,74]);const priest=m.byRole[17];assert.equal((await resolve(c,m)).http,200);
 assert.equal((await action(c,m,17,25,S13_SKILLS.judgment)).http,200);await nextNight(c,m);assert.equal((await resolve(c,m)).http,200);
 const path=`/api/games/${m.gameId}`;assert.equal((await c.call('GET',path,undefined,priest.token)).game.chat.muted,true);
 assert.equal((await c.call('POST',path+'/chat',{text:'bị câm',messageId:randomUUID()},priest.token)).error.code,'UNAUTHORIZED');
 assert.equal((await c.call('POST',path+'/voting-open',{},m.host.token)).http,200);assert.equal((await c.call('POST',path+'/votes',{targetId:m.byRole[25].profile.id,ballotId:randomUUID(),idempotencyKey:randomUUID()},priest.token)).http,200);await checkReplay(c,m);
 }finally{await c.app.close();}
});

for(const [id,skill] of [[68,S13_SKILLS.youngMark],[88,S13_SKILLS.hunterMark]])test(`S14 #${id} death-follow chain commits before certified knight victory`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s14-chain-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[8,25,id]);
 assert.equal((await action(c,m,8,id,'official.8.night-kill')).http,200);assert.equal((await action(c,m,id,25,skill)).http,200);
 const r=await resolve(c,m);assert.equal(r.http,200,JSON.stringify(r));assert.equal(r.resolution.phase,'GAME_COMPLETED');
 const s=await state(c,m);assert.equal(life(s.state,m,25),'DEAD_FINAL');assert.equal(life(s.state,m,id),'DEAD_FINAL');assert.deepEqual(s.state.winnerIds,[m.byRole[8].profile.id]);
 const deaths=s.events.filter(e=>e.eventType==='PLAYER_ELIMINATED');assert.equal(deaths.length,2);assert.equal(new Set(deaths.map(e=>e.payload.playerId)).size,2);
 assert(s.events.find(e=>e.eventType==='S14_DEATH_FOLLOW_AUDIT').sequence<s.events.find(e=>e.eventType==='MATCH_COMPLETED').sequence);
 for(const u of m.users){const e=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;assert(!e.some(x=>['S14_DEATH_FOLLOW_AUDIT','S13_OFFICIAL_EFFECT_APPLIED'].includes(x.eventType)));assert(e.filter(x=>x.eventType==='PLAYER_ELIMINATED').every(x=>!x.actorId&&Object.keys(x.payload).join(',')==='playerId'));}
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,s.state);await checkReplay(d,m);
 console.log('S14_EVIDENCE '+JSON.stringify({id,skill,restart:true,replay:true,completedDeck:[8,25,id]}));
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S14 #68 no preselected target means no secondary death (VH36)',async()=>{
 const c=await setup();try{const m=await match(c,[8,25,68]);assert.equal((await action(c,m,8,68,'official.8.night-kill')).http,200);assert.equal((await resolve(c,m)).http,200);const s=await state(c,m);assert.equal(life(s.state,m,25),'ALIVE');assert.equal(s.state.completed,false);assert(!s.events.some(e=>e.eventType==='S14_DEATH_FOLLOW_AUDIT'));await checkReplay(c,m);}finally{await c.app.close();}
});

test('S14 #59 second stone kills and reveals Ná Thủ only after second hit',async()=>{
 const c=await setup();try{const m=await match(c,[25,59]);assert.equal((await resolve(c,m)).http,200);
 assert.equal((await action(c,m,59,25,S13_SKILLS.stone)).http,200);await nextNight(c,m);assert.equal(life((await state(c,m)).state,m,25),'ALIVE');assert.equal((await resolve(c,m)).http,200);
 const r=await action(c,m,59,25,S13_SKILLS.stone);assert.equal(r.http,200,JSON.stringify(r));assert.equal((await resolve(c,m)).http,200);
 const s=await state(c,m);assert.equal(life(s.state,m,25),'DEAD_FINAL');assert.equal(s.events.filter(e=>e.eventType==='S14_STONE_ROLE_REVEALED').length,1);
 for(const u of m.users){const e=(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,u.token)).events;const reveal=e.find(x=>x.eventType==='S14_STONE_ROLE_REVEALED');assert.deepEqual(reveal.payload,{playerId:m.byRole[59].profile.id,roleName:'Ná Thủ'});assert(!e.find(x=>x.eventType==='PLAYER_ELIMINATED').actorId);}
 assert.equal(s.state.completed,false);await checkReplay(c,m);
 }finally{await c.app.close();}
});
