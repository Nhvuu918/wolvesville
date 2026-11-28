/** Full HTTP -> GameCoordinator -> Kernel -> persisted SQLite archive -> replay.
 * Tests have no pre-filled resolved effects and do not bypass the Engine. */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {SqliteMultiplayerStore} from '../../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../../dist/backend/src/multiplayer/server.js';
import {withKernel} from '../../dist/backend/src/game/archive.js';
import {S13_SKILLS,S13_STATUS} from '../../dist/backend/src/official/s13-mechanics.js';

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

delete process.env.WV_ARCHIVED_RULE_REGRESSION;
const dir=mkdtempSync(join(tmpdir(),'wv24-mage-durable-')),file=join(dir,'game.sqlite');let c;
try {
 c=await setup(file);const m=await match(c,[8,25,36]),out=await c.user(),url=`/api/games/${m.gameId}`;
 assert.equal((await action(c,m,36,25,S13_SKILLS.mageShield)).http,200);assert.equal((await action(c,m,36,8,S13_SKILLS.fire)).http,200);
 for(const u of m.users){const v=await c.call('GET',url,undefined,u.token);assert.equal(v.http,200);assert.equal(v.game.players.filter(p=>p.self).length,1);assert.equal(v.game.players.find(p=>p.self).playerId,u.profile.id);}
 for(const endpoint of ['', '/events','/feedback','/replay'])assert.notEqual((await c.call('GET',url+endpoint,undefined,out.token)).http,200);
 const queued=await state(c,m);assert.equal(queued.state.phase,'NIGHT_COLLECT');await c.app.close();c=null;c=await setup(file);assert.deepEqual(await state(c,m),queued);
 assert.equal((await resolve(c,m)).http,200);const finished=await state(c,m);const st=finished.state;assert.equal(st.completed,true);assert.equal(st.phase,'GAME_COMPLETED');assert.equal(finished.events.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);assert.deepEqual([...st.winnerIds].sort(),[m.byRole[25].profile.id,m.byRole[36].profile.id].sort());assert.equal(life(st,m,8),'DEAD_FINAL');assert.equal(uses(st,m,36,S13_SKILLS.fire),1);assert.equal(uses(st,m,36,S13_SKILLS.mageShield),1);
 for(const u of m.users){const v=await c.call('GET',url,undefined,u.token);assert.equal(v.game.completed,true);assert.deepEqual([...v.game.winnerIds].sort(),[...st.winnerIds].sort());} for(const r of [8,25])assert(!(await eventList(c,m,r)).some(e=>e.eventType==='S15_MAGE_SHIELD_REVEAL'));await checkReplay(c,m);
 await c.app.close();c=null;c=await setup(file);assert.deepEqual(await state(c,m),finished);await checkReplay(c,m);assert.notEqual((await c.call('GET',url+'/replay',undefined,out.token)).http,200);
 console.log('MAGE_OFFICIAL_QA_MATCH '+JSON.stringify({ids:[8,25,36],completed:true,ruleVersion:'wolvesville-official-v1.3.3',voteChain:false,restartReplay:true,privacy:true,multiClient:true,sourceFingerprint:'611eda16bbcf0f48530cc6174c03912206578aefd857f236fe255bf4bd066d52'}));
}finally{await c?.app.close();rmSync(dir,{recursive:true,force:true});}
