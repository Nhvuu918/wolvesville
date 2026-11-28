/** Additive Sprint05 execution evidence. Never mutate 118 official decisions,
 * 145 source-audit branches, 207 legacy specifications or Sprint04 historical snapshot.
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const rd=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const output=resolve(root,'data/rule-intelligence-s05');mkdirSync(output,{recursive:true});
const write=(name,v)=>writeFileSync(resolve(output,`${name}.json`),JSON.stringify(v,null,2)+'\n');
const official=rd('data/character.json');
if(official.length!==97||new Set(official.map(c=>c.id)).size!==97)throw Error('INVALID_97_SOURCE');
const originalSha=createHash('sha256').update(readFileSync(resolve(root,'data/character.json'))).digest('hex');
if(originalSha!=='7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3')throw Error('CHARACTER_SOURCE_MODIFIED');
const old=rd('data/rule-intelligence/characters_97.json'),pairs=rd('data/rule-intelligence/interaction_pairs_4656.json');
const specs=rd('data/rules/tests_207.json'),rules=rd('data/rule-intelligence/rules_118.json'),skills=rd('data/rule-intelligence/skills_145.json');
if(old.length!==97||pairs.length!==4656||rules.length!==118||skills.length!==145||specs.length!==207)throw Error('LEGACY_SOURCE_INTEGRITY');
const implemented=[
 {characterId:25,skillId:'official.25.inspect-role',type:'ACTIVE',sources:['character.json#25'],testIds:['tests/official-rules.test.mjs']},
 {characterId:74,skillId:'official.74.inspect-role',type:'ACTIVE',sources:['character.json#74'],testIds:['tests/official-rules.test.mjs']},
 {characterId:20,skillId:'OFFICIAL_CHAR_20_REACTIVE_INSPECTION',type:'PASSIVE_INSPECTED',sources:['character.json#20'],testIds:['tests/official-reactive.test.mjs']},
 {characterId:34,skillId:'official.34.night-block',type:'ACTIVE',sources:['character.json#34','VH08','VH10','VH24'],testIds:['tests/official-support.test.mjs']},
 {characterId:31,skillId:'official.31.guard',type:'ACTIVE',sources:['character.json#31'],testIds:['tests/official-support.test.mjs']},
 {characterId:9,skillId:'official.9.snow-protection',type:'ACTIVE',sources:['character.json#9'],testIds:['tests/official-support.test.mjs']}
];
for(const x of implemented)if(!official.some(c=>c.id===x.characterId))throw Error('INVALID_ADAPTER_ROLE');
const updated=old.map(c=>{
 const existing=implemented.filter(x=>x.characterId===c.characterId);
 return {...c,currentSprint:'05',currentImplementationStatus:existing.length?'IMPLEMENTED_RESTRICTED_PARTIAL':'NOT_IMPLEMENTED',
  currentSkillIds:existing.filter(x=>x.type==='ACTIVE').map(x=>x.skillId),
  currentPassiveIds:existing.filter(x=>x.type!=='ACTIVE').map(x=>x.skillId),
  currentImplementationTests:[...new Set(existing.flatMap(x=>x.testIds))],
  // Even an adapter with no outstanding active branch cannot use a full victory evaluator.
  allSkillBranchesVerifiedAndImplemented:false,officialTestPackEligible:existing.length>0,
  competitiveEligible:false};
});
const additional=[
 ['9-34','S05-01','Night walker block cancels accepted Snow Angel protection before resolution'],
 ['25-34','S05-02','Named Tiên Tri (#25) exempt from #34 night lock under VH24'],
 ['31-34','S05-02','Named Bảo Vệ (#31) exempt from #34 night lock under VH24'],
 ['34-74','S05-02','Non-exempt #74 night inspection can be cancelled by #34 lock'],
 ['9-74','S05-04','Two-round protection layer recorded on target #74; attack absorption NOT tested'],
 ['31-74','S05-01','Single-round guard layer recorded on target #74; damage not adjudicated'],
 ['9-25','S05-04','Snow protection layer may be assigned to #25'],
 ['9-31','S05-04','Snow protection layer may be assigned to #31'],
 ['25-31','S05-03','Guard can target #25 in a later round, consistent with no-consecutive-repeat']
];
const evidence=new Map(additional.map(([id,testId,scope])=>[id,{testIds:[testId],scope,evidence:['data/character.json','data/rules/official_merged_118.json','tests/official-support.test.mjs'],level:'EXECUTABLE_RESTRICTED_SCOPE'}]));
const matrix=pairs.map(p=>{
 const id=`${p.characterA}-${p.characterB}`,scoped=evidence.get(id);
 return {...p,currentSprint:'05',
  currentInteractionStatus:scoped?'EXECUTABLE_RESTRICTED_SCOPE':p.interactionStatus==='IMPLEMENTED_RESTRICTED_TESTED'?'EXECUTABLE_RESTRICTED_SCOPE':'SCREENING_ONLY',
  currentTestEvidence:scoped?.testIds??(p.interactionStatus==='IMPLEMENTED_RESTRICTED_TESTED'?['tests/official-rules.test.mjs','tests/official-reactive.test.mjs']:[]),
  currentLimitedOutcome:scoped?.scope??p.resolvedOutcome??null,completeInteractionCoverage:false};
});
const factRegistry={rulesVersion:'wolvesville-official-v1.3.1',genericWinResolver:false,autoCompleteGame:false,
 verifiedPredicateFacts:[{predicateId:'WV_CHAR_28_HANGED_WIN',rules:['character.json#28','VH03'],technicalState:'PARTIAL_PURE_PREDICATE',test:'tests/official-victory-facts.test.mjs',needsVerifiedHangingEvent:true,needsEndOfChain:true}],
 auxiliaryFactionCountFacts:['Q13-05','VH06','VH82'],fullVictoryPredicatesImplemented:0};
const result={version:'0.7.0',baseRuleVersion:'wolvesville-official-v1.3.1',sourceHash:originalSha,
 confirmedDecisions:118,auditSkillBranches:145,legacySpecs:207,characters:97,
 activeAdapters:implemented.filter(x=>x.type==='ACTIVE').length,
 passiveAdapters:implemented.filter(x=>x.type!=='ACTIVE').length,
 charactersWithAtLeastOneExecutedBranch:new Set(implemented.map(x=>x.characterId)).size,
 charactersWithAllBranchesCompetitiveReady:0,
 supportedDecks:[[25,74],[20,25,74],[9,25,31,34,74]],
 executedPairCases:matrix.filter(x=>x.currentInteractionStatus==='EXECUTABLE_RESTRICTED_SCOPE').length,
 pairScreening:4656,fullCompetitive:false};
write('execution_manifest',result);write('implemented_adapters',implemented);write('characters_97',updated);
write('interaction_pairs_4656',matrix);write('victory_partial',factRegistry);
console.log('Sprint05 official expansion overlay:',JSON.stringify(result));
