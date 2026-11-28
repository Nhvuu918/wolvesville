import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
import {RULESET_VERSION} from '../dist/shared/contracts/index.js';
import {RuleRegistry} from '../dist/backend/src/engine/rules.js';
import {registerOfficialInspection} from '../dist/backend/src/official/inspection-rules.js';
import {registerOfficialSupport} from '../dist/backend/src/official/support-rules.js';
import {registerOfficialPeace} from '../dist/backend/src/official/peace-rules.js';
import {registerOfficialKnight} from '../dist/backend/src/official/solo-rules.js';
import {registerOfficialVoteControl} from '../dist/backend/src/official/vote-control-rules.js';
import {registerOfficialJudgment} from '../dist/backend/src/official/judgment-rules.js';
import {registerOfficialNightmare} from '../dist/backend/src/official/nightmare-rules.js';
test('S10-coverage 97-row versioned matrix matches registered restricted adapters and unmodified official sources',()=>{
 const m=JSON.parse(readFileSync('data/rule-intelligence-s10/execution_manifest_s10.json','utf8'));
 const entries=JSON.parse(readFileSync('data/rule-intelligence-s10/character_implementation_matrix_97.json','utf8'));
 assert.equal(m.sourceHash,createHash('sha256').update(readFileSync('data/character.json')).digest('hex'));
 assert.equal(JSON.parse(readFileSync('data/character.json')).length,97);
 assert.equal(JSON.parse(readFileSync('data/rules/official_merged_118.json')).length,118);
 assert.equal(JSON.parse(readFileSync('data/rules/tests_207.json')).length,207);
 assert.equal(JSON.parse(readFileSync('data/rule-intelligence/skills_145.json')).length,145);
 assert.equal(entries.length,97);assert.equal(new Set(entries.map(e=>e.characterId)).size,97);
 const r=new RuleRegistry();for(const f of [registerOfficialInspection,registerOfficialSupport,registerOfficialPeace,registerOfficialKnight,registerOfficialVoteControl,registerOfficialJudgment,registerOfficialNightmare])f(r);
 let active=0;for(const x of entries){assert.equal(x.competitiveReady,false);assert.equal(x.completeAbilitiesImplemented,false);
  for(const id of x.executableActiveBranches){assert.equal(r.get(id,RULESET_VERSION).characterId,x.characterId);active++;}}
 assert.equal(active,10);assert.equal(entries.filter(e=>e.executablePassiveBranches.length).length,1);
 assert.equal(entries.filter(e=>e.technicalStatus==='PARTIAL_RESTRICTED_EXECUTION').length,11);
 assert.equal(m.executedCharacters,11);assert.deepEqual(m.newlyExecutedCharacterIds,[5,76]);
 assert.equal(m.metricA,2);assert.equal(m.metricB,0);
 assert.throws(()=>r.get('official.1.thief',RULESET_VERSION),e=>e.code==='RULE_UNRESOLVED');
});

test('S10-coverage 145 source-audited branches grouped without rule promotion and technical dependencies are acyclic',()=>{
 const audit=JSON.parse(readFileSync('data/rule-intelligence-s10/skill_dependency_audit_145.json','utf8'));
 const original=JSON.parse(readFileSync('data/rule-intelligence/skills_145.json','utf8'));
 assert.equal(audit.status,'TECHNICAL_AUDIT_NOT_OFFICIAL_RULE');
 assert.equal(audit.branchCount,145);assert.equal(audit.branchAudit.length,145);
 assert.deepEqual(audit.branchAudit.map(b=>b.branchId),original.map(b=>b.skillBranchId));
 assert.equal(Object.values(audit.mechanismTagCounts).reduce((a,b)=>a+b,0),
  original.reduce((sum,b)=>sum+(b.auditOnlyMetadata.mechanismTags?.length??0),0));
 const ids=new Set(audit.mechanisms.map(x=>x.id)),edges=audit.dependencies;
 for(const [a,b] of edges){assert(ids.has(a));assert(ids.has(b));}
 const visiting=new Set(),visited=new Set();
 const walk=id=>{assert(!visiting.has(id),'technical mechanism dependency is cyclic');if(visited.has(id))return;
  visiting.add(id);for(const [a,b] of edges)if(a===id)walk(b);visiting.delete(id);visited.add(id);};
 for(const id of ids)walk(id);
});
