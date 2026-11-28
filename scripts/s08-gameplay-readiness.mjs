/** Sprint 08 additional acceptance gate: executes REAL backend/SQLite operations.
 * This is NOT a voting resolver or a competitive rule implementation.
 * A configuration only enters Metric A if a certified match commits GAME_COMPLETED.
 * Metric B requires an independently executed vote-resolution -> elimination -> victory chain.
 */
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
import {OFFICIAL_TEST_PACK} from '../dist/backend/src/official/inspection-rules.js';
import {KNIGHT_SKILL} from '../dist/backend/src/official/solo-rules.js';
import {qualifiesMetricA,qualifiesMetricB,scoreConfigEvidence} from './s08-acceptance-scoring.mjs';

const ROOT=process.cwd();
const reportPath=join(ROOT,'reports','S08_GAMEPLAY_MATCH_READINESS.json');
const time=new Date().toISOString();
const verified=[];
const setups=[
 {key:'closed-knight-jester',characters:[8,28],players:2,description:'Đêm đầu: Kỵ Sĩ Không Đầu #8 loại Thằng Ngố #28 (không phải treo cổ)',roleSource:'data/character.json#8,#28',interactions:['official.8.night-kill -> death of #28, no hanging win condition']},
 {key:'closed-knight-seer',characters:[8,25],players:2,description:'Đêm đầu: Kỵ Sĩ Không Đầu #8 loại Tiên Tri #25',roleSource:'data/character.json#8,#25',interactions:['official.8.night-kill versus accepted official.25.inspect-role (same night)']},
 {key:'seer-pair',characters:[25,74],players:2,description:'Cặp soi vai; có đêm/ngày, chưa chốt vote',interactions:['independent role inspections; no general vote adjudication']},
 {key:'thorn-inspection',characters:[20,25,74],players:3,description:'Phản ứng Sói Gai Độc; chưa chốt vote',interactions:['20 reactive injury when inspected by 25/74; next-night skill disabled']},
 {key:'peace-voting-cancel',characters:[25,74,79],players:3,description:'Sói Hòa Bình hủy biểu quyết; không có người bị loại',interactions:['79 cancels vote under PH-02; no adjudicated hanging']},
 {key:'five-skill-pack',characters:[9,25,31,34,74],players:5,description:'Bảo vệ, soi, khóa; chưa chốt vote',interactions:['9 and 31 protection ledgers; 34 supported night-block; investigation; generic attack unresolved']}
];
const pwd='Safe-Certification-Password-2026';
async function host(file){
 const store=new SqliteMultiplayerStore(file);
 const app=createMultiplayerServer(store,{officialRuleTestMode:true});
 const port=await app.start();
 const base=`http://127.0.0.1:${port}`;
 async function request(method,path,data,token){
  const r=await fetch(base+path,{method,headers:{'content-type':'application/json',connection:'close',...(token?{authorization:`Bearer ${token}`}:{})},body:data===undefined?undefined:JSON.stringify(data)});
  const payload=await r.json();return {http:r.status,...payload};
 }
 async function user(){
  const username='s08'+randomUUID().replaceAll('-','').slice(0,17);
  assert.equal((await request('POST','/api/auth/register',{username,password:pwd})).http,201);
  const result=await request('POST','/api/auth/login',{username,password:pwd});assert.equal(result.http,200);return result;
 }
 return {store,app,request,user};
}
async function safeClose(c){
 if(!c)return; c.app.server.closeIdleConnections?.(); await c.app.close();
}
async function startMatch(c,ids){
 const users=await Promise.all(ids.map(()=>c.user()));
 const created=await c.request('POST','/api/rooms',{name:'Sprint08 acceptance',capacity:ids.length},users[0].token);assert.equal(created.http,201,JSON.stringify(created));
 const room=created.room;
 for(const u of users.slice(1))assert.equal((await c.request('POST',`/api/rooms/${room.id}/join`,{},u.token)).http,200);
 assert.equal((await c.request('POST',`/api/rooms/${room.id}/lock`,{},users[0].token)).http,200);
 const started=await c.request('POST',`/api/rooms/${room.id}/games/start`,{rulePack:OFFICIAL_TEST_PACK,characterIds:ids,idempotencyKey:`s08-${randomUUID()}`},users[0].token);
 assert.equal(started.http,201,JSON.stringify(started));
 const id=started.game.gameId,byRole={};
 for(const u of users){
  const view=(await c.request('GET',`/api/games/${id}`,undefined,u.token)).game;
  assert.equal(view.players.filter(p=>p.self).length,1,'one private role per authenticated viewer');
  assert.equal(view.players.filter(p=>p.self && p.playerId!==u.profile.id).length,0,'foreign self data leaked');
  byRole[view.players.find(p=>p.self).self.currentCharacterId]=u;
 }
 return {id,users,byRole,host:users[0],room};
}
function publicEventsSafe(events){
 const death=events.filter(e=>e.eventType==='PLAYER_ELIMINATED');
 assert.equal(death.length,1);
 for(const e of death){assert.deepEqual(Object.keys(e.payload).sort(),['playerId']);assert.equal('actorId' in e,false);}
 assert.equal(events.some(e=>e.eventType==='VERIFIED_ELIMINATION_AUDIT'),false);
}
async function certifyMetricA(victimRole=25){
 const dir=mkdtempSync(join(tmpdir(),'wv-s08-metric-a-'));const file=join(dir,'app.sqlite');let c,c2;
 try{
  c=await host(file);const m=await startMatch(c,[8,victimRole]);
  const attack=await c.request('POST',`/api/games/${m.id}/actions`,{skillId:KNIGHT_SKILL,targetIds:[m.byRole[victimRole].profile.id],actionId:`s08-attack-${randomUUID()}`,idempotencyKey:`s08-key-${randomUUID()}`},m.byRole[8].token);
  assert.equal(attack.http,200,JSON.stringify(attack));assert.equal(attack.action.status,'ACCEPTED');
  for(const u of m.users){const early=(await c.request('GET',`/api/games/${m.id}`,undefined,u.token)).game;assert.equal(early.completed,false,'do not show result at ACCEPTED');}
  const resolve=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);
  assert.equal(resolve.http,200,JSON.stringify(resolve));assert.equal(resolve.resolution.phase,'GAME_COMPLETED');
  for(const u of m.users){
   const post=(await c.request('GET',`/api/games/${m.id}`,undefined,u.token)).game;
   assert.equal(post.completed,true);assert.deepEqual(post.winnerIds,[m.byRole[8].profile.id]);
   const ev=(await c.request('GET',`/api/games/${m.id}/events`,undefined,u.token)).events;
   publicEventsSafe(ev);assert.equal(ev.filter(e=>e.eventType==='MATCH_COMPLETED').length,1);
   const replay=(await c.request('GET',`/api/games/${m.id}/replay`,undefined,u.token)).replay;assert.equal(replay.verified,true);
  }
  const outsider=await c.user();assert.equal((await c.request('GET',`/api/games/${m.id}`,undefined,outsider.token)).http,403);
  await safeClose(c);c=null;
  c2=await host(file);const state=(await c2.request('GET',`/api/games/${m.id}`,undefined,m.byRole[8].token)).game;
  assert.equal(state.completed,true);assert.deepEqual(state.winnerIds,[m.byRole[8].profile.id]);
  assert.equal((await c2.request('GET',`/api/games/${m.id}/replay`,undefined,m.byRole[8].token)).replay.verified,true);
  return {config:victimRole===25?'closed-knight-seer':'closed-knight-jester',result:'PASS',mode:'REAL_BACKEND_SQLITE',backendRunVerified:true,eventLogVerified:true,winnerCommitted:true,gameCompleted:true,eliminated:true,victoryEvaluated:true,throughNight:true,
   throughDay:false,throughVoting:false,voteResolved:false,eliminationFromVote:false,privateAclVerified:true,restartReplayVerified:true,source:`data/character.json#8,#${victimRole}; VH03, L02`};
 }finally{if(c)await safeClose(c);if(c2)await safeClose(c2);rmSync(dir,{recursive:true,force:true});}
}
async function verifyVoteUnresolved(){
 const c=await host(':memory:');try{
  const m=await startMatch(c,[25,74]);
  const endNight=await c.request('POST',`/api/games/${m.id}/resolve`,{},m.host.token);assert.equal(endNight.http,200);assert.equal(endNight.resolution.phase,'DAY_DISCUSS');
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-open`,{},m.host.token)).http,200);
  for(const [index,u] of m.users.entries()){
   const voted=await c.request('POST',`/api/games/${m.id}/votes`,{targetId:m.users[1-index].profile.id,ballotId:`s08-vote-${index}`,idempotencyKey:`s08-ballot-key-${index}`},u.token);assert.equal(voted.http,200,JSON.stringify(voted));
  }
  assert.equal((await c.request('POST',`/api/games/${m.id}/voting-close`,{},m.host.token)).http,200);
  for(const u of m.users){
   const game=(await c.request('GET',`/api/games/${m.id}`,undefined,u.token)).game;assert.equal(game.completed,false);
   const events=(await c.request('GET',`/api/games/${m.id}/events`,undefined,u.token)).events;
   assert.equal(events.some(e=>e.eventType==='PLAYER_ELIMINATED'),false);
   assert.equal(events.some(e=>e.eventType==='MATCH_COMPLETED'),false);
   assert.equal((await c.request('GET',`/api/games/${m.id}/replay`,undefined,u.token)).replay.verified,true);
  }
  return {config:'seer-pair',result:'PASS_PARTIAL_PATH',mode:'REAL_BACKEND_SQLITE',backendRunVerified:true,eventLogVerified:true,throughNight:true,throughDay:true,throughVoting:true,voteResolved:false,
   eliminationFromVote:false,gameCompleted:false,privateAclVerified:true,source:'docs/SPRINT07_RULE_BLOCKER_DIAGNOSIS.md#S07-V02/S07-V03'};
 }finally{await safeClose(c);}
}
function matrix(a,second,b){
 return setups.map(pack=>{
  const evidence=pack.key===a.config?a:pack.key===second.config?second:pack.key===b.config?b:null;
  const measuredA=qualifiesMetricA(evidence);
  const measuredB=qualifiesMetricB(evidence);
  return {...pack,skillAdapters:pack.characters.map(id=>({8:'official.8.night-kill',9:'official.9.snow-protection',20:'OFFICIAL_CHAR_20_REACTIVE_INSPECTION',25:'official.25.inspect-role',31:'official.31.guard',34:'official.34.night-block',74:'official.74.inspect-role',79:'official.79.peace'}[id])),
   evidence:evidence??{result:'NOT_EXECUTED_IN_THIS_RUN'},throughDay:evidence?.throughDay??null,throughVoting:evidence?.throughVoting??null,
   voteResolved:evidence?.voteResolved??false,eliminationFromVote:evidence?.eliminationFromVote??false,
   victoryEvaluated:evidence?.victoryEvaluated??false,gameCompleted:evidence?.gameCompleted??false,
   restartReplay:evidence?.restartReplayVerified??false,browserE2E:'NOT_EXECUTED_BY_THIS_COMMAND',postgresqlAcceptance:'PENDING_EXTERNAL_DB',
   metricA:measuredA,metricB:measuredB,readiness:measuredA?'GO_RESTRICTED_BACKEND_TEST':measuredB?'GO_VERIFIED_VOTE_CHAIN':'PARTIAL'};
 });
}
async function run(){
 const a=await certifyMetricA(25);const second=await certifyMetricA(28);
 console.log('S08 GAMEPLAY METRIC A: two DISTINCT real backend finished matches + restart + replay + ACL PASS');
 const b=await verifyVoteUnresolved();console.log('S08 METRIC B GATE: vote inputs do not count as elimination PASS');
 const configurations=matrix(a,second,b);
 const {metricA,metricB}=scoreConfigEvidence(configurations);
 assert.equal(metricA,2);assert.equal(metricB,0);
 const summary={schemaVersion:'s08-acceptance-v1',evidenceGeneratedAt:time,sourceBaseline:'Sprint 08 Acceptance Foundation v0.9.1; gameplay expansion verified',officialCharacters:97,
  metricACompletedOfficialMatchConfigurations:metricA,metricBVoteToEliminationConfigurations:metricB,
  postgres:'PENDING_NOT_RUN',browser:'NOT_EXECUTED_BY_THIS_COMMAND',
  metricAProof:'two independent real committed night-end matches [8,25] and [8,28] (role privacy, HTTP events, restart, replay)' ,
  metricBNonProof:'night/day/vote recorded in #25/#74, but no official vote resolution or elimination; correctly counts zero',
  configurations};
 mkdirSync(join(ROOT,'reports'),{recursive:true});writeFileSync(reportPath,JSON.stringify(summary,null,2)+'\n');
 const lines=['# S08 Match Readiness — Real Backend Evidence','',`Evidence run: ${time}`,'',
  `**Metric A = ${metricA}. Metric B = ${metricB}.** Independent metrics; B requires verified vote->elimination->victory check, not necessarily GAME_COMPLETED.`,
  '', '| Cấu hình | Người | Ban ngày | Voting | Vote resolution | Loại qua vote | GAME_COMPLETED | Replay/restart | Browser | PostgreSQL | Trạng thái |',
  '|---|---:|---|---|---|---|---|---|---|---|---|'];
 for(const c of configurations)lines.push(`| ${c.characters.join(' + ')} | ${c.players} | ${fmt(c.throughDay)} | ${fmt(c.throughVoting)} | ${fmt(c.voteResolved)} | ${fmt(c.eliminationFromVote)} | ${fmt(c.gameCompleted)} | ${fmt(c.restartReplay)} | Chưa chạy trong lệnh này | PENDING | ${c.readiness} |`);
 lines.push('','**Quy ước:** Chưa chạy không phải FAIL, cũng không phải PASS. Các cấu hình không thực thi trong lượt kiểm tra này chỉ là cấu hình đã có source/test ở Sprint trước. Không được cộng Metric A/B từ chúng.','',
 'Việc `GAME_COMPLETED` ở đêm đầu của [8,25] hoặc [8,28] KHÔNG tính Metric B. `CLOSED_UNRESOLVED` và hủy biểu quyết KHÔNG phải `VOTE_RESOLVED`.','','Nguồn: `tests/sprint07-endgame.test.mjs`, `docs/SPRINT07_RULE_BLOCKER_DIAGNOSIS.md`, `backend/src/official/inspection-rules.ts`.');
 writeFileSync(join(ROOT,'reports','S08_GAMEPLAY_MATCH_READINESS.md'),lines.join('\n')+'\n');
 console.log(`S08_GAMEPLAY_ACCEPTANCE_PASS metric_A=${metricA} metric_B=${metricB} configurations=${configurations.length}`);
}
function fmt(x){return x===true?'Có':x===false?'Không':'Chưa kiểm chứng';}
run().catch(err=>{console.error('S08_GAMEPLAY_ACCEPTANCE_FAIL',err);process.exitCode=1;});
