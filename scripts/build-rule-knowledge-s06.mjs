/** Sprint06 additive execution evidence, never mutate original 97/118/207 source files. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'..');
const get=p=>JSON.parse(readFileSync(resolve(root,p),'utf8'));
const chars=get('data/character.json'),old=get('data/rule-intelligence-s05/characters_97.json');
const rules=get('data/rules/official_merged_118.json'),specs=get('data/rules/tests_207.json');
const sha=createHash('sha256').update(readFileSync(resolve(root,'data/character.json'))).digest('hex');
if(chars.length!==97||new Set(chars.map(c=>c.id)).size!==97||sha!=='7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3'||rules.length!==118||specs.length!==207||old.length!==97)
 throw Error('OFFICIAL_SOURCE_INTEGRITY_FAILED');
if(!rules.some(r=>r.code==='PH-02'&&r.rule.includes('Sói Hòa Bình'))||!chars.some(c=>c.id===79&&c.name==='Sói Hòa Bình'))
 throw Error('PEACE_WOLF_RULE_SOURCE_NOT_FOUND');
const dir=resolve(root,'data/rule-intelligence-s06');mkdirSync(dir,{recursive:true});
const save=(name,v)=>writeFileSync(resolve(dir,name+'.json'),JSON.stringify(v,null,2)+'\n');
const implemented=[...get('data/rule-intelligence-s05/implemented_adapters.json'),{
 characterId:79,skillId:'official.79.cancel-vote-reveal',type:'ACTIVE',
 sources:['character.json#79','PH-02','Q13-09'],
 testIds:['tests/sprint06-lifecycle.test.mjs:S06-07','tests/browser_s06_e2e.py'],
 rulesetScope:'RESTRICTED_ONLY_25_74_79_ONE_WOLF',competitive:false
}];
const matrix=old.map(c=>c.characterId===79?{
 ...c,currentSprint:'06',currentImplementationStatus:'IMPLEMENTED_RESTRICTED_PARTIAL',
 currentSkillIds:['official.79.cancel-vote-reveal'],currentPassiveIds:[],
 currentImplementationTests:['tests/sprint06-lifecycle.test.mjs','tests/browser_s06_e2e.py'],
 allSkillBranchesVerifiedAndImplemented:false,officialTestPackEligible:true,competitiveEligible:false
}:c);
const scope={version:'0.8.0',rulesVersion:'wolvesville-official-v1.3.1',characterHash:sha,
 officialCharacters:97,decisions:118,legacyTestSpecifications:207,auditedSkillBranches:145,
 charactersWithExecutedBranches:7,activeSkillAdapters:6,passiveReactions:1,
 fullyCompetitiveReadyCharacters:0,fullyAdjudicatedVotingModes:0,verifiedAutoEndgamePredicates:0,
 votingIntentsRestricted:true,peaceWolfCancelValidated:true,victoryFacts:['WV_CHAR_28_HANGED_WIN','WV_CHAR_8_SOLE_SURVIVOR'],
 supportedDecks:[[25,74],[20,25,74],[9,25,31,34,74],[25,74,79]],
 postgresVerifiedHere:false,fullCompetitive:false};
save('execution_manifest',scope);save('implemented_adapters',implemented);save('characters_97',matrix);
save('interaction_79_vote_cancel',[{source:['character.json#79','PH-02','Q13-09'],
 characterIds:[25,74,79],interaction:'day voting intent -> #79 cancels without hanging',
 status:'IMPLEMENTED_RESTRICTED_TESTED',tests:['S06-07','browser_s06_e2e.py'],
 genericVoteTally:false,attackDeath:false,fullMatch:false}]);
console.log('Sprint06 official execution overlay:',JSON.stringify(scope));
