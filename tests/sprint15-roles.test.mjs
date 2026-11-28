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

const eventList=async(c,m,id)=>(await c.call('GET',`/api/games/${m.gameId}/events`,undefined,m.byRole[id].token)).events;
const caps=async(c,m,id)=>(await c.call('GET',`/api/games/${m.gameId}`,undefined,m.byRole[id].token)).game.capabilities;
const uses=(s,m,id,skill)=>s.participants.find(p=>p.playerId===m.byRole[id].profile.id).effects.filter(e=>e.kind===S13_STATUS.used&&e.payload.skillId===skill).length;
const evidence15=(id,branch,skill)=>console.log('S15_EVIDENCE '+JSON.stringify({id,branch,skill,restart:true,replay:true,privacy:true}));
test('S15 #36 shield absorbs knight attack, role feedback private, once per match',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-mage-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[8,25,36]);
 assert.notEqual((await action(c,m,36,36,S13_SKILLS.mageShield)).http,200);
 const actor=m.byRole[36],victim=m.byRole[25],body={skillId:S13_SKILLS.mageShield,targetIds:[victim.profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()},url=`/api/games/${m.gameId}/actions`;
 assert.equal((await c.call('POST',url,body,actor.token)).http,200);assert.equal((await c.call('POST',url,body,actor.token)).action.duplicate,true);
 assert.equal((await action(c,m,8,25,'official.8.night-kill')).http,200);assert.equal((await resolve(c,m)).http,200);
 const old=await state(c,m);assert.equal(life(old.state,m,25),'ALIVE');assert.equal(uses(old.state,m,36,S13_SKILLS.mageShield),1);
 const seen=(await eventList(c,m,36)).filter(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL');assert.equal(seen.length,1);assert.equal(seen[0].payload.characterId,25);assert.equal(seen[0].payload.actionId,body.actionId);
 for(const id of [8,25])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL'||e.eventType==='OFFICIAL_ATTACK_BLOCKED'));
 const feedback=await c.call('GET',`/api/games/${m.gameId}/feedback`,undefined,actor.token);assert(feedback.feedback.items.some(e=>e.actionId===body.actionId&&e.resultPayload?.characterId===25));
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);assert.deepEqual((await eventList(d,m,36)).filter(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL'),seen);await checkReplay(d,m);
 await nextNight(d,m);assert.equal((await action(d,m,36,25,S13_SKILLS.mageShield)).error.code,'RESOURCE_INSUFFICIENT');assert.equal((await action(d,m,8,25,'official.8.night-kill')).http,200);assert.equal((await resolve(d,m)).http,200);assert.equal(life((await state(d,m)).state,m,25),'DEAD_FINAL');await checkReplay(d,m);
 evidence15(36,'shield.success-private',S13_SKILLS.mageShield);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S15 #36 fire and unused shield may both be spent in one night, no false reveal',async()=>{
 const c=await setup();try{const m=await match(c,[23,25,36]);assert.equal((await action(c,m,36,23,S13_SKILLS.mageShield)).http,200);assert.equal((await action(c,m,36,25,S13_SKILLS.fire)).http,200);assert.equal((await resolve(c,m)).http,200);const s=(await state(c,m)).state;assert.equal(uses(s,m,36,S13_SKILLS.mageShield),1);assert.equal(uses(s,m,36,S13_SKILLS.fire),1);assert.equal(life(s,m,25),'DEAD_FINAL');assert(!(await eventList(c,m,36)).some(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL'));assert.equal((await action(c,m,36,23,S13_SKILLS.mageShield)).error.code,'OUT_OF_PHASE');await checkReplay(c,m);}finally{await c.app.close();}
});
test('S15 #66 sees only other protection recipients, not source or own protection',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-watch-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,66,67]);assert.equal((await action(c,m,66,66,S13_SKILLS.watch)).http,200);assert.equal((await action(c,m,67,25,S13_SKILLS.smith)).http,200);assert.equal((await resolve(c,m)).http,200);
 const old=await state(c,m),seen=(await eventList(c,m,66)).filter(e=>e.eventType==='S15_GUARD_OBSERVED');assert.equal(seen.length,1);assert.deepEqual(seen[0].payload.playerIds,[m.byRole[25].profile.id]);assert.equal(seen[0].actorId,undefined);assert(!JSON.stringify(seen).includes(m.byRole[67].profile.id));for(const id of [25,67])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S15_GUARD_OBSERVED'));
 await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);assert.deepEqual((await eventList(d,m,66)).filter(e=>e.eventType==='S15_GUARD_OBSERVED'),seen);await checkReplay(d,m);await nextNight(d,m);assert.equal((await resolve(d,m)).http,200);assert.equal((await eventList(d,m,66)).filter(e=>e.eventType==='S15_GUARD_OBSERVED').length,1);await checkReplay(d,m);evidence15(66,'observe.other-protected','passive.66.observe-protected');
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S15 #43 two rounds two bullets, blocked then day shot, retry privacy restart',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-sniper-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[23,25,43]);const actor=m.byRole[43],victim=m.byRole[25],url=`/api/games/${m.gameId}/actions`,body={skillId:S13_SKILLS.sniper,targetIds:[victim.profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};
 assert.notEqual((await action(c,m,43,43,S13_SKILLS.sniper)).http,200);assert.equal((await action(c,m,23,25,S13_SKILLS.soulShield)).http,200);
 assert.equal((await c.call('POST',url,body,actor.token)).http,200);assert.equal((await c.call('POST',url,body,actor.token)).action.duplicate,true);assert.notEqual((await action(c,m,43,25,S13_SKILLS.sniper)).http,200);
 assert.equal((await resolve(c,m)).http,200);assert.equal(life((await state(c,m)).state,m,25),'ALIVE');assert.equal((await action(c,m,43,25,S13_SKILLS.sniper)).error.code,'RESOURCE_INSUFFICIENT');
 await nextNight(c,m);assert.equal((await resolve(c,m)).http,200);assert.equal((await action(c,m,43,25,S13_SKILLS.sniper)).http,200);await nextNight(c,m);
 const old=await state(c,m);assert.equal(life(old.state,m,25),'DEAD_FINAL');assert.equal(uses(old.state,m,43,S13_SKILLS.sniper),2);for(const id of [23,25]){const events=await eventList(c,m,id);assert(!events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));const deaths=events.filter(e=>e.eventType==='PLAYER_ELIMINATED');assert.equal(deaths.length,1);assert.equal(deaths[0].actorId,undefined);assert.equal(deaths[0].payload.skillId,undefined);}
 await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);await checkReplay(d,m);evidence15(43,'shoot.day-night',S13_SKILLS.sniper);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S15 #87 sedative denies chat and ballot intake, expires next day, blank tally is official',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-sedative-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,74,87]);const victim=m.byRole[25],url=`/api/games/${m.gameId}`;
 assert.equal((await action(c,m,87,25,S13_SKILLS.sedative)).http,200);assert.equal((await resolve(c,m)).http,200);
 const old=await state(c,m);assert.equal(uses(old.state,m,87,S13_SKILLS.sedative),1);assert.equal((await c.call('POST',url+'/chat',{text:'blocked',messageId:randomUUID()},victim.token)).error.code,'UNAUTHORIZED');
 assert.equal((await c.call('POST',url+'/chat',{text:'allowed',messageId:randomUUID()},m.byRole[74].token)).http,200);
 assert.equal((await c.call('POST',url+'/voting-open',{},m.host.token)).http,200);
 const ballot=()=>({targetId:'',ballotId:randomUUID(),idempotencyKey:randomUUID()});
 assert.equal((await c.call('POST',url+'/votes',ballot(),victim.token)).error.code,'UNAUTHORIZED');assert.equal((await c.call('GET',url+'/voting',undefined,victim.token)).voting.canVote,false);
 assert.equal((await c.call('POST',url+'/votes',ballot(),m.byRole[74].token)).http,200);
 assert.equal((await c.call('GET',url+'/voting',undefined,m.byRole[74].token)).voting.canVote,true);
 for(const id of [25,74]){assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'));}
 const frozen=await state(c,m);await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,frozen.state);assert.equal((await d.call('POST',url+'/votes',ballot(),victim.token)).error.code,'UNAUTHORIZED');
 assert.equal((await d.call('POST',url+'/voting-close',{},m.host.token)).http,200);const closed=await state(d,m);assert.equal(closed.state.phase,'NIGHT_COLLECT');assert(closed.events.some(e=>e.eventType==='OFFICIAL_VOTE_RESULT'&&e.payload.outcome==='NO_HANGING_ZERO'));assert.equal((await action(d,m,87,25,S13_SKILLS.sedative)).error.code,'RESOURCE_INSUFFICIENT');
 assert.equal((await resolve(d,m)).http,200);assert.equal((await d.call('POST',url+'/chat',{text:'unmuted',messageId:randomUUID()},victim.token)).http,200);assert.equal((await d.call('POST',url+'/voting-open',{},m.host.token)).http,200);assert.equal((await d.call('POST',url+'/votes',ballot(),victim.token)).http,200);await checkReplay(d,m);evidence15(87,'sedative.chat-and-vote',S13_SKILLS.sedative);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
test('S15 #54 true role reveal only after first completed vote; once, public minimal payload, replay',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-reveal-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,54,74]);const url=`/api/games/${m.gameId}`,actor=m.byRole[54];
 assert.notEqual((await action(c,m,54,25,S13_SKILLS.publicReveal)).http,200);assert.equal((await resolve(c,m)).http,200);assert.equal((await c.call('POST',url+'/voting-open',{},m.host.token)).http,200);
 assert.notEqual((await action(c,m,54,25,S13_SKILLS.publicReveal)).http,200);assert.equal((await c.call('POST',url+'/voting-close',{},m.host.token)).http,200);
 assert.equal((await resolve(c,m)).http,200);assert.equal((await c.call('POST',url+'/voting-open',{},m.host.token)).http,200);assert.notEqual((await action(c,m,54,54,S13_SKILLS.publicReveal)).http,200);
 const body={skillId:S13_SKILLS.publicReveal,targetIds:[m.byRole[25].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()};assert.equal((await c.call('POST',url+'/actions',body,actor.token)).http,200);assert.equal((await c.call('POST',url+'/actions',body,actor.token)).action.duplicate,true);
 assert.equal((await resolve(c,m)).http,200);const old=await state(c,m);assert.equal(old.state.phase,'DAY_VOTE_COLLECT');assert.equal(uses(old.state,m,54,S13_SKILLS.publicReveal),1);
 for(const id of [25,54,74]){const seen=(await eventList(c,m,id)).filter(e=>e.eventType==='S15_PUBLIC_ROLE_REVEALED');assert.equal(seen.length,1);assert.deepEqual(seen[0].payload,{playerId:m.byRole[25].profile.id,roleName:'Tiên Tri'});assert.equal(seen[0].actorId,undefined);}
 assert.equal((await c.call('POST',url+'/voting-close',{},m.host.token)).http,200);await checkReplay(c,m);const frozen=await state(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,frozen.state);await checkReplay(d,m);assert.equal((await resolve(d,m)).http,200);assert.equal((await d.call('POST',url+'/voting-open',{},m.host.token)).http,200);assert.equal((await action(d,m,54,74,S13_SKILLS.publicReveal)).error.code,'RESOURCE_INSUFFICIENT');evidence15(54,'reveal.public-after-first-vote',S13_SKILLS.publicReveal);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});
for(const [attacker,skill,expected] of [[8,'official.8.night-kill','Không Tiếc Thương'],[32,S13_SKILLS.gun,'Tiếc Thương']])test(`S15 #80 ${expected}, previous-night death only, private relation, restart`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'wv-s15-violin-')),file=join(dir,'game.sqlite');let c,d;
 try{c=await setup(file);const m=await match(c,[25,attacker,80]),actor=m.byRole[80],url=`/api/games/${m.gameId}/actions`;
 const compare=async(ctx,live,dead)=>ctx.call('POST',url,{skillId:S13_SKILLS.violin,targetIds:[m.byRole[live].profile.id,m.byRole[dead].profile.id],actionId:randomUUID(),idempotencyKey:randomUUID()},actor.token);
 assert.notEqual((await compare(c,attacker,25)).http,200);assert.equal((await action(c,m,attacker,25,skill)).http,200);assert.equal((await resolve(c,m)).http,200);assert.equal(life((await state(c,m)).state,m,25),'DEAD_FINAL');await nextNight(c,m);assert.notEqual((await compare(c,25,attacker)).http,200);assert.equal((await compare(c,attacker,25)).http,200);assert.equal((await resolve(c,m)).http,200);
 const seen=(await eventList(c,m,80)).filter(e=>e.eventType==='S15_VIOLIN_RESULT');assert.equal(seen.length,1);assert.equal(seen[0].payload.result,expected);assert.equal(seen[0].payload.faction,undefined);for(const id of [attacker,25])assert(!(await eventList(c,m,id)).some(e=>e.eventType==='S15_VIOLIN_RESULT'));
 const old=await state(c,m);await checkReplay(c,m);await c.app.close();c=null;d=await setup(file);assert.deepEqual((await state(d,m)).state,old.state);assert.deepEqual((await eventList(d,m,80)).filter(e=>e.eventType==='S15_VIOLIN_RESULT'),seen);await nextNight(d,m);assert.notEqual((await compare(d,attacker,25)).http,200);await checkReplay(d,m);evidence15(80,expected==='Tiếc Thương'?'compare.same-faction':'compare.different-faction',S13_SKILLS.violin);
 }finally{await c?.app.close();await d?.app.close();rmSync(dir,{force:true,recursive:true});}
});

test('S15 #36 fireball targets non-seer knight in bounded official QA, independent shield and resource',async()=>{
 const archived=process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_ARCHIVED_RULE_REGRESSION;const c=await setup();try{const m=await match(c,[8,25,36]);assert.equal((await action(c,m,36,36,S13_SKILLS.fire)).error.code,'TARGET_INVALID');assert.equal((await action(c,m,36,25,S13_SKILLS.mageShield)).http,200);assert.equal((await action(c,m,36,8,S13_SKILLS.fire)).http,200);assert.notEqual((await action(c,m,36,25,S13_SKILLS.fire)).http,200);assert.equal((await resolve(c,m)).http,200);const s=(await state(c,m)).state;assert.equal(life(s,m,8),'DEAD_FINAL');assert.equal(life(s,m,25),'ALIVE');assert.equal(uses(s,m,36,S13_SKILLS.fire),1);assert.equal(uses(s,m,36,S13_SKILLS.mageShield),1);assert.deepEqual(s.winnerIds.sort(),[m.byRole[25].profile.id,m.byRole[36].profile.id].sort());for(const r of [8,25])assert(!(await eventList(c,m,r)).some(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL'));await checkReplay(c,m);}finally{await c.app.close();if(archived===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=archived;}
});

test('Privacy stability #36: shield consumes one fireball, second night fireball, resource and restart',async()=>{
 const archived=process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_ARCHIVED_RULE_REGRESSION;const dir=mkdtempSync(join(tmpdir(),'wv-mage-two-fire-'));let c;
 try{const file=join(dir,'game.sqlite');c=await setup(file);const m=await match(c,[8,25,36]);
 assert.equal((await action(c,m,36,25,S13_SKILLS.mageShield)).http,200);assert.equal((await action(c,m,36,25,S13_SKILLS.fire)).http,200);assert.equal((await resolve(c,m)).http,200);
 const first=await state(c,m);assert.equal(first.state.completed,false);assert.equal(life(first.state,m,25),'ALIVE');assert.equal(uses(first.state,m,36,S13_SKILLS.fire),1);assert.equal(uses(first.state,m,36,S13_SKILLS.mageShield),1);assert(!first.state.participants.find(p=>p.playerId===m.byRole[25].profile.id).effects.some(e=>e.kind===S13_STATUS.mageShield));assert(first.events.some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'));for(const r of [8,25])assert(!(await eventList(c,m,r)).some(e=>e.eventType==='OFFICIAL_ATTACK_BLOCKED'||e.eventType==='S15_MAGE_SHIELD_REVEAL'));await checkReplay(c,m);
 await c.app.close();c=await setup(file);assert.deepEqual((await state(c,m)).state,first.state);await nextNight(c,m);assert.equal((await action(c,m,36,25,S13_SKILLS.mageShield)).error.code,'RESOURCE_INSUFFICIENT');assert.equal((await action(c,m,36,8,S13_SKILLS.fire)).http,200);assert.equal((await resolve(c,m)).http,200);const final=await state(c,m);assert.equal(uses(final.state,m,36,S13_SKILLS.fire),2);assert.equal(life(final.state,m,8),'DEAD_FINAL');assert.equal(life(final.state,m,25),'ALIVE');assert.deepEqual(final.state.winnerIds.sort(),[m.byRole[25].profile.id,m.byRole[36].profile.id].sort());await checkReplay(c,m);
 }finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});if(archived===undefined)delete process.env.WV_ARCHIVED_RULE_REGRESSION;else process.env.WV_ARCHIVED_RULE_REGRESSION=archived;}
});
