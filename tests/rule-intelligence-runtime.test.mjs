import test from 'node:test';
import assert from 'node:assert/strict';
import {OfficialRuleKnowledgeBase} from '../dist/backend/src/rule-intelligence/knowledge-base.js';
const db=()=>new OfficialRuleKnowledgeBase();
test('S04 RUNTIME-01: rule lookups carry source and defensive copies do not mutate register',()=>{
 const k=db();assert.deepEqual(k.counts,{confirmedDecisions:118,characters:97,pairScreening:4656});
 const r=k.getRule('VH03');assert.equal(r.verificationStatus,'CONFIRMED');assert.match(r.exactRule,/chuỗi/);
 r.exactRule='tampered';assert.notEqual(k.getRule('VH03').exactRule,'tampered');
 assert.equal(k.getRule('DERIVED_UNKNOWN'),null);
});
test('S04 RUNTIME-02: closed deck only allows registered active skills and #20 passive without elevating competitive',()=>{
 const k=db();assert.equal(k.allowedInRestrictedOfficialTest([25,74],25,'official.25.inspect-role'),true);
 assert.equal(k.allowedInRestrictedOfficialTest([20,25,74],20,null),true);
 assert.equal(k.allowedInRestrictedOfficialTest([20,25,74],20,'official.20.shoot'),false);
 assert.equal(k.allowedInRestrictedOfficialTest([20,25,74],25,'official.74.inspect-role'),false);
 assert.equal(k.allowedInRestrictedOfficialTest([20,25,74,31],25,'official.25.inspect-role'),false);
 assert.equal(k.allowedInRestrictedOfficialTest([20,25],25,'official.25.inspect-role'),false);
 assert.equal(k.getCharacter(20).competitiveEligible,false);
});
test('S04 RUNTIME-03: pair evidence is separate from resolved outcome, no implicit skills',()=>{
 const k=db();const ok=k.getInteraction(74,20);
 assert.equal(ok.interactionStatus,'IMPLEMENTED_RESTRICTED_TESTED');
 const gap=k.getInteraction(1,2);assert.equal(gap.resolvedOutcome,null);
 assert.equal(k.getInteraction(4,4),null);
});
