import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const load=p=>JSON.parse(readFileSync(new URL(`../data/rule-intelligence/${p}.json`,import.meta.url),'utf8'));
const raw=p=>JSON.parse(readFileSync(new URL(`../data/${p}.json`,import.meta.url),'utf8'));
test('S04 KB-01: 118 confirmed decisions with original codes, 145 skill audit branches, and 97 characters',()=>{
 const rules=load('rules_118'),skills=load('skills_145'),chars=load('characters_97');
 assert.equal(rules.length,118);assert.equal(skills.length,145);assert.equal(chars.length,97);
 assert.equal(new Set(rules.map(r=>r.ruleId)).size,118);
 assert.equal(new Set(skills.map(r=>r.skillBranchId)).size,145);
 assert.equal(new Set(chars.map(r=>r.characterId)).size,97);
 assert.deepEqual(new Set(rules.map(x=>x.verificationStatus)),new Set(['CONFIRMED']));
 assert.ok(rules.every(x=>x.source?.localMirror==='data/rules/official_merged_118.json'));
 assert.ok(skills.every(x=>x.skillIdAuthority==='AUDIT_TECHNICAL_ID_NOT_GAMEPLAY_ID'));
 assert.deepEqual(chars.filter(r=>r.technicalStatus==='IMPLEMENTED_RESTRICTED_PASSIVE_ONLY').map(r=>r.characterId),[20]);
 assert.deepEqual(chars.filter(r=>r.technicalStatus==='IMPLEMENTED_RESTRICTED_ACTION').map(r=>r.characterId),[25,74]);
 assert.equal(chars.some(r=>r.competitiveEligible),false);
});
test('S04 KB-02: original character bytes unchanged and every branch points back to exact official description',()=>{
 const bytes=readFileSync(new URL('../data/character.json',import.meta.url));
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3');
 const original=JSON.parse(bytes.toString('utf8')),branches=load('skills_145');
 for(const b of branches){assert.equal(b.fullOfficialDescription,original.find(x=>x.id===b.characterId)?.desc);}
});
test('S04 KB-03: all 4656 pairs exist as SCREENING, only three closed-deck pairs have implemented outcomes',()=>{
 const pairs=load('interaction_pairs_4656');assert.equal(pairs.length,97*96/2);
 assert.equal(new Set(pairs.map(x=>`${x.characterA}-${x.characterB}`)).size,pairs.length);
 const implemented=pairs.filter(x=>x.interactionStatus==='IMPLEMENTED_RESTRICTED_TESTED');
 assert.deepEqual(implemented.map(x=>`${x.characterA}-${x.characterB}`),['20-25','20-74','25-74']);
 assert.ok(pairs.filter(x=>!implemented.includes(x)).every(x=>x.resolvedOutcome===null));
});
test('S04 KB-04: 207 legacy specifications are NEVER flagged as executed by this generator',()=>{
 const source=raw('rules/tests_207');assert.equal(source.length,207);
 assert.ok(source.every(x=>(x.run_status??x.execution_status)==='SPEC_ONLY_NOT_EXECUTED'));
 const rules=load('rules_118');assert.ok(rules.every(x=>Array.isArray(x.relatedTestSpecIds)));
});
test('S04 KB-05: DERIVED inference never overwritten as CONFIRMED and no global victory assertion',()=>{
 const inferred=load('inferences'),victory=load('victory_coverage'),unresolved=load('unresolved');
 assert.equal(inferred.length,2);
 assert.ok(inferred.every(x=>x.verificationStatus==='DERIVED'&&x.notPromotedToConfirmed===true));
 assert.equal(victory.competitive,false);assert.equal(victory.genericVictoryResolverImplemented,false);
 assert.ok(victory.verifiedSourceRuleIds.every(x=>typeof x==='string'&&x.length>1));
 assert.deepEqual(load('test_conflicts').map(x=>x.sourceTestId),['T-MC-04','T-COV-03','T-MC-33']);
 assert.ok(unresolved.some(x=>x.issue==='ROLE20_SHOOT_TRIGGER_NOT_EXECUTABLE'));
});
test('S04 KB-06: source inventory hashes check out for every source available',()=>{
 const inventory=load('source_inventory');
 assert.ok(inventory.every(e=>e.accessible===true));
 for(const x of inventory){const hash=createHash('sha256').update(readFileSync(new URL(`../${x.path}`,import.meta.url))).digest('hex');assert.equal(x.sha256,hash,x.path);}
});
