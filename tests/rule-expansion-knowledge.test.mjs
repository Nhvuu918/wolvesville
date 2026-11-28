import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {OfficialRuleKnowledgeBase} from '../dist/backend/src/rule-intelligence/knowledge-base.js';
const data=n=>JSON.parse(readFileSync(new URL(`../data/rule-intelligence-s05/${n}.json`,import.meta.url),'utf8'));
test('S05 KB-01 additive knowledge overlay: 97 roles, 118 rules/145 branches unchanged and six executed role branches',()=>{
 const m=data('execution_manifest'),c=data('characters_97'),a=data('implemented_adapters');
 assert.equal(m.characters,97);assert.equal(m.confirmedDecisions,118);assert.equal(m.auditSkillBranches,145);assert.equal(m.legacySpecs,207);
 assert.equal(m.charactersWithAtLeastOneExecutedBranch,6);assert.equal(m.activeAdapters,5);assert.equal(m.passiveAdapters,1);
 assert.deepEqual(a.map(x=>x.characterId).sort((x,y)=>x-y),[9,20,25,31,34,74]);
 assert.equal(c.filter(x=>x.currentImplementationStatus==='IMPLEMENTED_RESTRICTED_PARTIAL').length,6);
 assert.equal(c.every(x=>x.competitiveEligible===false),true);
});
test('S05 KB-02 4656 pairs remain screening except 12 narrow executable cases',()=>{
 const all=data('interaction_pairs_4656'),scoped=all.filter(x=>x.currentInteractionStatus==='EXECUTABLE_RESTRICTED_SCOPE');
 assert.equal(all.length,4656);assert.equal(scoped.length,12);assert.equal(scoped.every(x=>x.currentTestEvidence.length>0),true);
 assert.equal(all.every(x=>x.completeInteractionCoverage===false),true);
 const kb=new OfficialRuleKnowledgeBase();
 assert.equal(kb.getCharacter(34).currentSkillIds.includes('official.34.night-block'),true);
 assert.equal(kb.allowedInRestrictedOfficialTest([9,25,31,34,74],34,'official.34.night-block'),true);
 assert.equal(kb.allowedInRestrictedOfficialTest([25,74],34,'official.34.night-block'),false);
 assert.equal(kb.getInteraction(34,74).currentInteractionStatus,'EXECUTABLE_RESTRICTED_SCOPE');
});
test('S05 KB-03 victory facts are separate from auto-finalized winner',()=>{
 const v=data('victory_partial');assert.equal(v.genericWinResolver,false);assert.equal(v.fullVictoryPredicatesImplemented,0);
 assert.deepEqual(v.verifiedPredicateFacts.map(x=>x.predicateId),['WV_CHAR_28_HANGED_WIN']);
 assert.equal(v.autoCompleteGame,false);
});
