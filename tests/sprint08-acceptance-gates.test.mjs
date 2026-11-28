import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {qualifiesMetricA,qualifiesMetricB,scoreConfigEvidence} from '../scripts/s08-acceptance-scoring.mjs';

const readJson=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const report=readJson('../reports/S08_MATCH_READINESS.json');
const graphics=readJson('../docs/gameplay-flow-handoff/S08_GRAPHICS_READY_CONTRACT.json');

const A={result:'PASS',backendRunVerified:true,gameCompleted:true,winnerCommitted:true,eventLogVerified:true,privateAclVerified:true,restartReplayVerified:true};
const B={result:'PASS',backendRunVerified:true,eventLogVerified:true,privateAclVerified:true,restartReplayVerified:true,gameCompleted:false,winnerCommitted:false,throughNight:true,throughDay:true,throughVoting:true,voteResolved:true,verifiedVoteRuleSource:true,eliminationFromVote:true,victoryChecked:true};

test('S08-A01 Metric A requires real backend, committed winner, Event Log, ACL and replay/restart',()=>{
 assert.equal(qualifiesMetricA(A),true);
 for(const key of Object.keys(A).filter(k=>k!=='result'))assert.equal(qualifiesMetricA({...A,[key]:false}),false,key);
 assert.equal(qualifiesMetricA({...A,result:'MOCK_SUCCESS'}),false);
});
test('S08-A02 Metric B cannot count early-night end, raw ballots, cancelled voting or unresolved votes',()=>{
 assert.equal(qualifiesMetricB(A),false);
 assert.equal(qualifiesMetricB(B),true);assert.equal(qualifiesMetricA(B),false,'B is independent of A and match completion');
 for(const key of ['backendRunVerified','eventLogVerified','privateAclVerified','restartReplayVerified','throughNight','throughDay','throughVoting','voteResolved','verifiedVoteRuleSource','eliminationFromVote','victoryChecked']){
  assert.equal(qualifiesMetricB({...B,[key]:false}),false,key);
 }
});
test('S08-A03 certified matrix only counts actually verified match configurations, not 97 Codex or unit tests',()=>{
 const x=scoreConfigEvidence(report.configurations);
 assert.equal(x.metricA,report.metricACompletedOfficialMatchConfigurations);
 assert.equal(x.metricB,report.metricBVoteToEliminationConfigurations);
 assert.equal(report.schemaVersion,'s08-acceptance-v1');
 assert.equal(report.officialCharacters,97);
 assert.equal(x.metricA,1,'S07 closed-deck completion must be preserved');
 assert.equal(x.metricB,0,'S07 has no official vote->elimination match');
 assert.deepEqual(report.configurations.filter(c=>c.metricA).map(c=>c.characters),[[8,25]]);
 for(const c of report.configurations) {
  assert.equal(new Set(c.characters).size,c.players);
  assert.equal(c.postgresqlAcceptance,'PENDING_EXTERNAL_DB');
  assert.equal(c.browserE2E,'NOT_EXECUTED_BY_THIS_COMMAND');
 }
});
test('S08-A04 invalid duplicate configuration and mislabeled metrics are rejected',()=>{
 const row=report.configurations[0];
 assert.throws(()=>scoreConfigEvidence([row,{...row}]),/duplicate configuration/);
 assert.throws(()=>scoreConfigEvidence([{...row,metricB:true}]),/Metric B evidence mismatch/);
});
test('S08-A05 graphics states include authorization, trigger, transition, loading/error/reconnect, reduced motion and assets',()=>{
 assert.equal(graphics.schemaVersion,'graphics-handoff-v2.0-s08-addendum');
 assert.ok(graphics.states.length>=16);
 const ids=new Set();
 for(const s of graphics.states){
  assert.ok(!ids.has(s.id),`duplicate ${s.id}`);ids.add(s.id);
  for(const k of ['title','status','trigger','backendEvent','authoritativeSource','authorizedAudience','authorizedPayload','transitions','loading','error','reconnect','reducedMotion','assetPlaceholder','responsiveGuidance'])assert.ok(s[k]!==undefined,`${s.id} missing ${k}`);
  assert.ok(!/typewriter|từng ký tự/i.test(s.animationHook||''));
  if(s.status==='BLOCKED_BY_RULE')assert.equal(s.backendEvent,'NOT_IMPLEMENTED');
 }
 assert.equal(graphics.states.find(s=>s.id==='GAME_RESULT').backendEvent,'MATCH_COMPLETED');
 assert.equal(graphics.states.find(s=>s.id==='VOTE_RESOLUTION').status,'BLOCKED_BY_RULE');
 assert.equal(graphics.states.find(s=>s.id==='NIGHT_RESULT').authorizedAudience,'PLAYER_PRIVATE');
});
test('S08-A06 graphics contract corrects stale S06 placeholders without changing original event catalogue',()=>{
 const base=readJson('../docs/gameplay-flow-handoff/frontend_gameplay_event_catalog.json');
 assert.equal(base.version,'s06-event-handoff-v1');
 assert.ok(graphics.supersedes.includes('S07'));
 assert.equal(graphics.states.find(s=>s.id==='VERIFIED_NIGHT_ELIMINATION').status,'IMPLEMENTED_TESTED_SCOPED');
 assert.equal(graphics.states.find(s=>s.id==='VOTE_ELIMINATION').status,'BLOCKED_BY_RULE');
});
