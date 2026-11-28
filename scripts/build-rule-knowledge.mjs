/** Sprint04 rule intelligence generator. Only local, provenance-bearing sources.
 * No fixtures, frontend prototype text or web data are promoted to rules.
 * No law inferred from a character name alone. Writes generated/ outputs only.
 */
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve,dirname} from 'node:path';
const base=resolve(import.meta.dirname,'..'),file=p=>resolve(base,p);
const sourceHash=p=>createHash('sha256').update(readFileSync(file(p))).digest('hex');
const j=p=>JSON.parse(readFileSync(file(p),'utf8'));
const character=j('data/character.json'),rules=j('data/rules/official_merged_118.json');
const skills=j('data/rules/skills.json'),tests=j('data/rules/tests_207.json'),findings=j('data/rules/findings.json');
if(character.length!==97||new Set(character.map(x=>x.id)).size!==97)throw Error('INVALID_OFFICIAL_CHARACTER_SET');
if(rules.length!==118||new Set(rules.map(x=>x.code)).size!==118)throw Error('INVALID_CONFIRMED_RULE_REGISTER');
if(skills.length!==145||tests.length!==207||findings.length!==22)throw Error('INVALID_INHERITED_AUDIT_COUNTERS');
if(sourceHash('data/character.json')!=='7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3')throw Error('OFFICIAL_CHARACTER_BYTES_CHANGED');
const sourcePaths=[
 'data/character.json','data/rules/official_merged_118.json','data/rules/vh01_vh85_UNCHANGED.json',
 'data/rules/decisions_21_v1_2_UNCHANGED.json','data/rules/q13_12_user_confirmed.json',
 'data/rules/skills.json','data/rules/tests_207.json','data/rules/findings.json',
 'docs/FINAL_HARDENING_KNOWN_LIMITATIONS.md','backend/src/engine/service.ts',
 'backend/src/official/inspection-rules.ts','backend/src/official/reactive-rules.ts',
 'tests/official-rules.test.mjs','tests/official-reactive.test.mjs',
 'reference/official_rule_sources_v1_3_1/Wolvesville_Bao_cao_tong_hop_quyet_dinh_VH01-VH85.docx',
 'reference/official_rule_sources_v1_3_1/Wolvesville_Dac_ta_day_du_QA_Luong_he_thong_VH01-VH85.md',
 'reference/official_rule_sources_v1_3_1/01_SO_QUYET_DINH_V1_3_1.md',
 'reference/official_rule_sources_v1_3_1/02_AUDIT_MAU_THUAN.md',
 'reference/official_rule_sources_v1_3_1/03_GAME_ENGINE_DELTA.md'];
const sourceInventory=sourcePaths.map(path=>({path,accessible:existsSync(file(path)),sha256:existsSync(file(path))?sourceHash(path):null,
 type:path.includes('data/rules')?'OFFICIAL_OR_INHERITED_AUDIT':path.includes('official/')?'IMPLEMENTATION':'ARCHITECTURE_OR_TEST'}));
const testsById=new Map(tests.map(t=>[t.test_id,t]));
const charsById=new Map(character.map(r=>[r.id,r]));
const skillsByChar=new Map(character.map(r=>[r.id,skills.filter(s=>s.character_id===r.id)]));
const mappedRuleIds=new Set(rules.map(r=>r.code));
const reRule=/\b(?:VH\d{2}|Q13-\d{2}|PH-\d{2}|SK-\d{2}|LIFE-\d{2}|REL-\d{2}|ROOM-\d{2}|PRIV-\d{2})\b/g;
const rulesKB=rules.map(r=>({
 ruleId:r.code,characterId:null,name:r.code,exactRule:r.rule, verificationStatus:'CONFIRMED',
 implementationStatus:'NOT_FULLY_IMPLEMENTED',tier:r.tier,source:{type:r.code.startsWith('Q13')?'USER_CONFIRMED':'USER_CONFIRMED_RULE_REGISTER',
  document:r.source,localMirror:'data/rules/official_merged_118.json',lookupKey:r.code},
 activation:null,phase:null,targetDomain:null,resourceLimit:null,priority:null,effect:null,
 invalidation:null,visibility:null,
 linkedSkillBranchIds:skills.filter(s=>s.rule_ids.includes(r.code)).map(s=>s.skill_id),
 relatedTestSpecIds:tests.filter(t=>(t.sources.match(reRule)||[]).includes(r.code)).map(t=>t.test_id)
}));
const implementationIds=new Set(['official.25.inspect-role','official.74.inspect-role']);
const activeBranches=[];
for(const s of skills){
 const role=charsById.get(s.character_id);
 if(!role)throw Error(`Orphan skill for character ${s.character_id}`);
 activeBranches.push({skillBranchId:s.skill_id,characterId:role.id,characterName:role.name,
  // An audit branch is not necessarily an atomic rule or confirmed skill identifier.
  skillIdAuthority:'AUDIT_TECHNICAL_ID_NOT_GAMEPLAY_ID',
  sourceDescription:s.source_excerpt_exact,fullOfficialDescription:role.desc,
  source:{file:'data/character.json',characterId:role.id,field:'desc'},
  verificationStatus:'CONFIRMED', // only confirms that the SOURCE TEXT exists, not execution completeness
  executionCompleteness:'UNRESOLVED_UNLESS_RESTRICTED_ADAPTER_VERIFIED',
  sourceRuleIds:s.rule_ids.filter(id=>mappedRuleIds.has(id)),
  nonCanonicalAuditReferences:s.rule_ids.filter(id=>!mappedRuleIds.has(id)),
  phase:s.phase.includes('theo nguồn')?null:s.phase,
  activation:null,targets:null,cost:null,effect:null,priority:null,visibility:null,
  auditOnlyMetadata:{mechanismTags:s.mechanism_tags,readiness:s.readiness,unresolvedFields:s.unresolved_fields,roleSpecificBlocker:s.role_specific_blocker},
  legacyTestSpecIds:s.test_ids.filter(id=>testsById.has(id)),
  implementationStatus:([25,74].includes(role.id)?'IMPLEMENTED_RESTRICTED_ACTION':role.id===20?'IMPLEMENTED_RESTRICTED_PASSIVE_INSPECTION_ONLY':'NOT_IMPLEMENTED'),
  implementationEvidence:role.id===25?'backend/src/official/inspection-rules.ts#official.25.inspect-role':role.id===74?'backend/src/official/inspection-rules.ts#official.74.inspect-role':role.id===20?'backend/src/official/reactive-rules.ts#OFFICIAL_CHAR_20_REACTIVE_INSPECTION':null
 });
}
const csvReadiness=readFileSync(file('data/character_readiness_02c.csv'),'utf8').split(/\r?\n/);
const csvById=new Map(csvReadiness.slice(1).filter(Boolean).map(line=>{
 // first column is numeric and role name may include commas elsewhere: only two base cells are required.
 const id=Number(line.split(',')[0]);return [id,line];
}));
const characterMatrix=character.map(role=>{
 const ss=skillsByChar.get(role.id)??[];
 const baselineAudit=(csvById.get(role.id)??'').split(',');
 const enabledActive=[25,74].includes(role.id)?[`official.${role.id}.inspect-role`]:[];
 const passive=role.id===20?['OFFICIAL_CHAR_20_REACTIVE_INSPECTION']:[];
 return {characterId:role.id,name:role.name,faction:role.team,aura:role.aura,
 codexData:'SOURCE_PRESENT',sourceDescriptionPresent:!!role.desc,
 previousAuditReadiness:baselineAudit[3]||'UNKNOWN',previousSprint02cReadiness:baselineAudit[4]||'UNKNOWN',
 legacyTestSpecIds:[...new Set(ss.flatMap(s=>s.test_ids).filter(id=>testsById.has(id)))],
 mechanismTags:[...new Set(ss.flatMap(s=>s.mechanism_tags))],
 sourceRefs:[`data/character.json#${role.id}`,...new Set(ss.flatMap(s=>s.rule_ids))],
 auditSkillBranchCount:ss.length,auditSkillBranchIds:ss.map(s=>s.skill_id),
 officialActiveAdapterIds:enabledActive,officialPassiveRuleIds:passive,
 implementedTestFiles:[20,25,74].includes(role.id)?['tests/official-rules.test.mjs','tests/official-reactive.test.mjs']:[],
 technicalStatus:enabledActive.length?'IMPLEMENTED_RESTRICTED_ACTION':passive.length?'IMPLEMENTED_RESTRICTED_PASSIVE_ONLY':'NOT_IMPLEMENTED',
 restrictedPackEnabled:[20,25,74].includes(role.id),
 restrictedPackRuleScope:role.id===20?'ONLY when investigated by #25 or #74; shoot trigger unimplemented':
 [25,74].includes(role.id)?'Only exact #25/#74 or #20/#25/#74 deck; no interference source except #20':'NOT_ENABLED',
 testGameEligible:[20,25,74].includes(role.id),competitiveEligible:false,
 fullRoleReady:false, // conservative no generic victory system
 unresolvedReason:role.id===20?'Gunshot injury branch not executable; only inspection trigger enabled. No verified victory evaluator.':
 [25,74].includes(role.id)?'No complete victory evaluator and broad distortion interaction pack.':'No enabled exhaustive official adapter or victory evaluator.',
 inheritedAuditSourceExists:csvById.has(role.id)
 };
});
const testPairs=new Map();
for(const t of tests){
 const match=new Set([...String(t.preconditions||'').matchAll(/#(\d{1,2})\b/g),...String(t.action||'').matchAll(/#(\d{1,2})\b/g)].map(x=>Number(x[1])).filter(n=>charsById.has(n)));
 for(const a of match)for(const b of match)if(a<b){const key=`${a}-${b}`;let a1=testPairs.get(key);if(!a1)testPairs.set(key,a1=[]);a1.push(t.test_id);}
}
const verifiedPairSet=new Set(['20-25','20-74','25-74']);
const pairs=[];for(let a=1;a<=97;a++)for(let b=a+1;b<=97;b++){
 const key=`${a}-${b}`,ids=testPairs.get(key)??[];
 pairs.push({characterA:a,characterB:b,sourceTestSpecIds:ids,
 mechanismScreeningOnly:!verifiedPairSet.has(key),
 interactionStatus:verifiedPairSet.has(key)?'IMPLEMENTED_RESTRICTED_TESTED':ids.length?'SOURCE_SCENARIO_SPEC_ONLY':'UNDETERMINED_NO_DIRECT_PAIR_SCENARIO',
 resolvedOutcome:verifiedPairSet.has(key)?
 (key==='20-25'||key==='20-74'?'Role inspection returns true character privately; inspector injured next NIGHT only':'Both roles can inspect each other in approved restricted pack'):
 null,
 evidence:verifiedPairSet.has(key)?['data/character.json','tests/official-reactive.test.mjs','tests/official-rules.test.mjs']:ids.length?['data/rules/tests_207.json']:[]});
}
const inferences=[
 {inferenceId:'S04-I-01',verificationStatus:'DERIVED',claim:'When #25 directly inspects #20 inside approved 3-role test deck, #25 receives true role as information and loses skill capability during the following night.',
  evidence:['data/character.json#25','data/character.json#20','data/rules/tests_207.json#T-COV-20'],
  proof:'Both source descriptions expressly describe nightly role inspection and the response to inspection; the legacy scenario names #25. Damage-by-shooting is separately unresolved.',
  implementation:'backend/src/official/reactive-rules.ts',test:'tests/official-reactive.test.mjs',notPromotedToConfirmed:true},
 {inferenceId:'S04-I-02',verificationStatus:'DERIVED',claim:'When #74 inspects #20 in the approved closed deck, the exact-role private result and following-night injury may both occur.',
  evidence:['data/character.json#74','data/character.json#20','VH08'],
  proof:'Character #74 is an explicit exact-role inspector; the #20 passive is phrased against being inspected (not against a specific inspector). Applies only to #74 and #20 with no distortion roles in deck.',
  implementation:'backend/src/official/reactive-rules.ts',test:'tests/official-reactive.test.mjs',notPromotedToConfirmed:true}
];
const unresolved=[
 {issue:'ROLE20_SHOOT_TRIGGER_NOT_EXECUTABLE',status:'MISSING_IMPLEMENTATION',source:['data/character.json#20','data/rules/tests_207.json#T-COV-20'],scope:'Gunshot injury trigger, collision with incoming damage and shooting action; none active in allowed deck',containment:'No shooter roles in restricted pack; no competitive'},
 {issue:'GLOBAL_VICTORY_PREDICATES',status:'BLOCKED_BY_RULE_OR_IMPLEMENTATION',source:['VH03','VH58','data/character.json'],scope:'All packs including winner evaluation; special win groups',containment:'Game completion prohibited'},
 ...findings.filter(f=>f.status==='BLOCKED_BY_RULE'||f.status==='CONFLICTING'||f.status==='BLOCKED_BY_SOURCE').map(f=>({issue:f.id,status:f.status,source:[f.evidence],scope:f.issue,containment:f.containment})),
];
const victorySourceIds=rules.filter(r=>/thắng|đồng thắng|kết thúc ván/i.test(r.rule)).map(r=>r.code);
const victory={ruleset:'wolvesville-official-v1.3.1',verifiedSourceRuleIds:victorySourceIds,
 genericVictoryResolverImplemented:false,restrictedPackMayComplete:false,competitive:false,
 sourceDecisionCount:victorySourceIds.length,notEquivalentToExecutableVictoryPredicates:true,
 requirements:['Complete event-chain closure (VH03)','Individual/group faction-specific predicates','Life-state accounting (VH06,VH58,Q13-05)','Co-win and independent factions','Regression tests of simultaneous win and unresolved branch fail-close']};
const legacyTestConflicts=[
 {id:'S04-TEST-CONFLICT-25-01',sourceTestId:'T-MC-04',field:'expected',quotedLegacyInterpretation:'soi aura chuẩn',actualCharacterSource:'data/character.json#25',finding:'Test expects aura, while #25 source describes exact role inspection; SPEC ONLY, must not be executable as written.',disposition:'QUARANTINE_EXPECTED_RESULT'},
 {id:'S04-TEST-CONFLICT-25-02',sourceTestId:'T-COV-03',field:'preconditions',quotedLegacyInterpretation:'#25 soi hào quang',actualCharacterSource:'data/character.json#25',finding:'Test premise treats #25 as aura seer contrary to the original role-description.',disposition:'QUARANTINE_PRECONDITION'},
 {id:'S04-TEST-CONFLICT-25-03',sourceTestId:'T-MC-33',field:'preconditions',quotedLegacyInterpretation:'#25 soi aura',actualCharacterSource:'data/character.json#25',finding:'Legacy narrative assumes #25 aura; other scenario assertions may be reusable if re-specified.',disposition:'QUARANTINE_ROLE_ASSUMPTION'}
];
for(const t of legacyTestConflicts)if(!testsById.has(t.sourceTestId))throw Error('Missing legacy conflicting test: '+t.sourceTestId);
const written={test_conflicts:legacyTestConflicts,source_inventory:sourceInventory,rules_118:rulesKB,skills_145:activeBranches,characters_97:characterMatrix,
 interaction_pairs_4656:pairs,inferences,unresolved,victory_coverage:victory};
const root='data/rule-intelligence';mkdirSync(file(root),{recursive:true});
for(const [n,data] of Object.entries(written))writeFileSync(file(`${root}/${n}.json`),JSON.stringify(data,null,2)+'\n');
const escapeCsv=x=>'"'+String(x??'').replaceAll('"','""')+'"';
const csv=(rows,keys)=>[keys.join(','),...rows.map(r=>keys.map(k=>escapeCsv(r[k] instanceof Array?r[k].join(';'):r[k])).join(','))].join('\n')+'\n';
writeFileSync(file(`${root}/character_matrix.csv`),csv(characterMatrix,['characterId','name','faction','auditSkillBranchCount','officialActiveAdapterIds','officialPassiveRuleIds','technicalStatus','testGameEligible','competitiveEligible','unresolvedReason']));
writeFileSync(file(`${root}/interaction_pairs.csv`),csv(pairs,['characterA','characterB','sourceTestSpecIds','interactionStatus','resolvedOutcome']));
writeFileSync(file(`${root}/rule_traceability.csv`),csv(rulesKB,['ruleId','verificationStatus','implementationStatus','linkedSkillBranchIds','relatedTestSpecIds']));
console.log(`Knowledge Base: ${character.length} characters, ${rules.length} confirmed decisions, ${skills.length} audit branches, ${tests.length} legacy SPEC_ONLY, ${pairs.length} pair screening, ${inferences.length} explicitly derived, ${findings.length} inherited audit findings`);
