import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {scoreConfigEvidence} from '../scripts/s08-acceptance-scoring.mjs';
const summary=JSON.parse(readFileSync(new URL('../reports/S08_GAMEPLAY_MATCH_READINESS.json',import.meta.url)));
test('S08-G09 metric A grows only through two real verified configurations (not recycled test counters)',()=>{
 const score=scoreConfigEvidence(summary.configurations);
 assert.equal(score.metricA,2);
 assert.equal(score.metricB,0);
 assert.deepEqual(summary.configurations.filter(c=>c.metricA).map(c=>c.characters).sort((a,b)=>a[1]-b[1]),[[8,25],[8,28]]);
 for(const c of summary.configurations.filter(c=>c.metricA)){
  assert.equal(c.evidence.mode,'REAL_BACKEND_SQLITE');
  for(const k of ['backendRunVerified','eventLogVerified','winnerCommitted','gameCompleted','privateAclVerified','restartReplayVerified'])assert.equal(c.evidence[k],true,k);
  assert.equal(c.eliminationFromVote,false);
 }
});
test('S08-G10 metric B remains zero until actual verified vote->elimination->victory check (no early-night substitution)',()=>{
 assert.equal(summary.metricBVoteToEliminationConfigurations,0);
 assert.equal(summary.configurations.some(c=>c.metricB),false);
});
