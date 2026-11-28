import test from 'node:test';import assert from 'node:assert/strict';
import {SANDBOX_POLICIES,evaluateVoteSandbox,RULE_EXPERIMENT_STATUS} from '../dist/backend/src/engine/vote-policy-sandbox.js';
const gate={environment:'developer_sandbox',separateTestStorage:true,explicitOptIn:true,competitive:false};
const voters=['a','b','c'].map(playerId=>({playerId,life:'ALIVE'}));
const input=(ballots,modifications=[])=>({voters,ballots:ballots.map(([voterId,targetId])=>({voterId,targetId})),modifications,locked:true});

test('S10-P01 production/competitive/nonisolated policies always fail closed',()=>{
 const x=input([['a','b'],['c','b']]);
 for(const access of [{...gate,environment:'production'},{...gate,environment:'official_test'},{...gate,separateTestStorage:false},{...gate,competitive:true},{...gate,explicitOptIn:false}])
  assert.throws(()=>evaluateVoteSandbox(x,SANDBOX_POLICIES.B,access),e=>e.code==='UNAUTHORIZED');
 assert.throws(()=>evaluateVoteSandbox(x,{...SANDBOX_POLICIES.B,status:'APPROVED'},gate),e=>e.code==='RULE_UNRESOLVED');
});

test('S10-P02 hypothetical plurality, tie, empty, single ballot never authorize elimination',()=>{
 const cases=[
  [ [['a','b'],['c','b'],['b','a']],'HYPOTHETICAL_HANG','b' ],
  [ [['a','b'],['b','a']],'NO_HANG',null ],
  [ [],'NO_HANG',null ],
  [ [['a','c']],'HYPOTHETICAL_HANG','c' ]
 ];
 for(const [b,expect,target] of cases){const original=input(b),copy=JSON.stringify(original),r=evaluateVoteSandbox(original,SANDBOX_POLICIES.B,gate);
  assert.equal(r.result,expect);assert.equal(r.proposedTargetId,target);assert.equal(r.stateCommitted,false);
  assert.equal(r.deathAuthorized,false);assert.equal(r.competitiveMetricEligible,false);assert.equal(r.status,RULE_EXPERIMENT_STATUS);
  assert.equal(JSON.stringify(original),copy,'pure evaluator must not mutate game input');}
});

test('S10-P03 V02 variant B terminal invalidation differs from A; quorum and forced controller are explicit',()=>{
 const x=input([['a','c'],['b','b'],['c','a']],[
  {kind:'INVALIDATE',voterId:'b',ruleSource:'hypothetical-invalidation'},
  {kind:'FORCE',voterId:'b',controllerId:'a',ruleSource:'character.json#33'},
  {kind:'BLOOD_SEAL_EXPERIMENT',voterId:'b',targetId:'c',ruleSource:'hypothetical-seal'}
 ]);
 const b=evaluateVoteSandbox(x,SANDBOX_POLICIES.B,gate),a=evaluateVoteSandbox(x,SANDBOX_POLICIES.A,gate);
 assert.equal(b.qualifiedBallots,2);assert.equal(a.qualifiedBallots,3);
 assert.equal(b.effectiveCounts.find(v=>v.targetId==='c')?.count,1);
 assert.equal(a.effectiveCounts.find(v=>v.targetId==='c')?.count,2);
 assert.equal(b.policyVersion,'s10-v02v03-exp-B-1');assert.equal(a.result,'HYPOTHETICAL_HANG');
});

test('S10-P04 no restoration on missing controller, no duplicate/invalid/dead voting, lock required',()=>{
 const m=[{kind:'FORCE',voterId:'b',controllerId:'c',ruleSource:'character.json#33'}];
 assert.equal(evaluateVoteSandbox(input([['a','c'],['b','a']],m),SANDBOX_POLICIES.B,gate).result,'BLOCKED');
 const dead={...input([['a','b'],['b','a']]),voters:[{playerId:'a',life:'DEAD_FINAL'},...voters.slice(1)]};
 assert.equal(evaluateVoteSandbox(dead,SANDBOX_POLICIES.B,gate).result,'BLOCKED');
 const dup=input([['a','b'],['a','c']]);assert.equal(evaluateVoteSandbox(dup,SANDBOX_POLICIES.B,gate).result,'BLOCKED');
 assert.equal(evaluateVoteSandbox({...dup,locked:false},SANDBOX_POLICIES.B,gate).result,'BLOCKED');
});

test('S10-P05 muted voting remains a policy decision and never becomes official',()=>{
 const x=input([['a','b']]);x.voters[0].muted=true;
 assert.equal(evaluateVoteSandbox(x,SANDBOX_POLICIES.B,gate).qualifiedBallots,1);
 const hacked={...SANDBOX_POLICIES.B,eligibility:{...SANDBOX_POLICIES.B.eligibility,allowMutedVoter:false}};
 assert.throws(()=>evaluateVoteSandbox(x,hacked,gate),e=>e.code==='RULE_UNRESOLVED');
});
