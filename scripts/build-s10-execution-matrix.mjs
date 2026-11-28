/** Supplemental runtime matrix. Never rewrites the audited 145 or 118 decisions. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
const root=process.cwd(),out=join(root,'data','rule-intelligence-s10');mkdirSync(out,{recursive:true});
const chars=JSON.parse(readFileSync(join(root,'data/character.json'),'utf8'));
const sourceHash=createHash('sha256').update(readFileSync(join(root,'data/character.json'))).digest('hex');
const executed=new Map([
 [5,{active:['official.5.weigh-soul'],partial:'Only Cân Phán Quyết; Công Lý Tuyệt Đối not adjudicated; no team-victory pack'}],
 [8,{active:['official.8.night-kill'],partial:'Only certified two-person early-night decks'}],
 [9,{active:['official.9.snow-protection'],partial:'Protection ledger only; attack resolution outside verified deck pending'}],
 [20,{active:[],passive:['OFFICIAL_CHAR_20_REACTIVE_INSPECTION'],partial:'Inspection injury supported; shooting trigger unsupported'}],
 [25,{active:['official.25.inspect-role'],partial:'Closed decks only; broad distortion unsupported'}],
 [31,{active:['official.31.guard'],partial:'Protection ledger only; general damage unsupported'}],
 [33,{active:['official.33.force-vote'],partial:'Only isolated one-controller vote; hanging unresolved'}],
 [34,{active:['official.34.night-block'],partial:'Closed deck and specific exemptions only'}],
 [74,{active:['official.74.inspect-role'],partial:'Closed decks only; broad distortion unsupported'}],
 [76,{active:['official.76.nightmare'],partial:'Nightmare current-night lock, 2 charges; closed decks only, wolf general victory/bite unsupported'}],
 [79,{active:['official.79.cancel-vote-reveal'],partial:'Vote cancellation only; no hanging or generic wolf attack'}],
 ]);
const tested=new Set([5,8,9,20,25,31,33,34,74,76,79]);
const entries=chars.map(c=>{
 const impl=executed.get(c.id),has=!!impl;
 return {characterId:c.id,characterName:c.name,characterDataPresent:true,originalCharacterSource:'data/character.json',hasSourceDescription:typeof c.desc==='string'&&c.desc.length>0,
  executableActiveBranches:impl?.active??[],executablePassiveBranches:impl?.passive??[],completeAbilitiesImplemented:false,
  interactionTestsAvailable:tested.has(c.id),restrictedPackParticipant:has,competitiveReady:false,
  technicalStatus:has?'PARTIAL_RESTRICTED_EXECUTION':'SOURCE_ONLY',notes:impl?.partial??'No exhaustive executable rule adapter or certified victory chain'};
});
const deckSets=[[8,25],[8,28],[25,74],[20,25,74],[9,25,31,34,74],[25,74,79],[25,33,74],[5,20,25],[5,25,74],[25,74,76],[5,25,76]];
const summary={schemaVersion:1,release:'1.2.0-s10',sourceHash,officialCharacters:chars.length,decisions:118,legacySpecifications:207,auditedBranches:145,
 executedCharacterIds:[...executed.keys()].sort((a,b)=>a-b),executedCharacters:executed.size,
 newlyExecutedCharacterIds:[5,76],newImplementedBranches:2,completeSkillCharacters:0,competitiveReadyCharacters:0,
 restrictedDecks:deckSets,certifiedCompletedDecks:[[8,25],[8,28]],metricA:2,metricB:0,
 minimumTestedInteractionPairs:15,officialCompletedMultiRoundMatchConfigurations:0,
 voteResolution:'PARTIAL_BLOCKED_BY_V02_V03',elimination:'PARTIAL_NIGHT_ONLY',victory:'PARTIAL_VERIFIED_KNIGHT_ONLY',postgresql:'PENDING_LIVE',fullCompetitive:'NO_GO'};
function csvEscape(x){return `"${String(x??'').replaceAll('"','""')}"`;}
const fields=['characterId','characterName','characterDataPresent','hasSourceDescription','executableActiveBranches','executablePassiveBranches','completeAbilitiesImplemented','interactionTestsAvailable','restrictedPackParticipant','competitiveReady','technicalStatus','notes'];
writeFileSync(join(out,'character_implementation_matrix_97.csv'),[fields.join(','),...entries.map(row=>fields.map(k=>csvEscape(Array.isArray(row[k])?row[k].join(';'):row[k])).join(','))].join('\n')+'\n');
writeFileSync(join(out,'character_implementation_matrix_97.json'),JSON.stringify(entries,null,2)+'\n');
writeFileSync(join(out,'execution_manifest_s10.json'),JSON.stringify(summary,null,2)+'\n');
console.log(`S10 MATRIX ${chars.length} roles; ${executed.size} partially executed roles; A=2 B=0`);
