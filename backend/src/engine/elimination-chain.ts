import {bellRevivalDomain,bellLinkDomain,bellLocalEffect} from '../official/bell-rules.js';
import {cultDeck,cultFinalDeath} from '../official/cult-recruitment.js';
import {mirrorMixedDomain,mirrorDeck,MIRROR_MEMORY,MIRROR_SCAN} from '../official/mirror-investigation.js';
import {jesterRevivalDomain} from '../official/revival-capability.js';
import {soulDeck,soulDeath} from '../official/soul-shooter.js';
import {isApprovedSingleWolfPackDeck} from '../official/final-pack.js';
import {isFinalRevengeDeck,assertRevengeDomain} from '../official/post-hanging-revenge.js';
import {isFinalHunterDeck,assertFinalHunterDomain,resolveFinalHunterFollow,HUNTER_CHAIN_RULE,isRevengeHunterDeck} from '../official/hanging-follow.js';
import {isSwapDeck,SWAP_MARK} from '../official/swap-rules.js';
import {isContractDeck,CONTRACT_MARK} from '../official/ballot-contract.js';
import {isBreakStoneDeck,isBreakExileDeck,STONE_LAYER,STONE_SPENT,EXILE_DOLL,EXILE_TRANSITION} from '../official/breakthrough-rules.js';
/** Closed-world authoritative post-elimination chain gate.
 * Character #8's first-night attack against #25 has no death reaction
 * in this exact {8,25} deck. NO generic attack/defense or execution rule.
 * All other combinations must fail closed pending source verification.
 */
import type {GameState} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {isS12ClosedDeck,assertS12StableDomain,commitS12Death} from '../official/death-interactions.js';
import {isKnightClosedDeck} from '../official/solo-rules.js';

export interface EliminationChainCertificate {
 schemaVersion:1;victimId:string;ruleId:'OFFICIAL_CHAR_8_NIGHT_KILL';
 stage:'POST_ELIMINATION_CLOSED';pendingEffects:0;sourceRules:string[];
}
export function certifyKnightPostElimination(s:GameState,victimId:string):EliminationChainCertificate {
 const victim=s.participants.find(p=>p.playerId===victimId);
 if(isS12ClosedDeck(s)){
  assertS12StableDomain(s);
  if(!victim||victim.life!=='DEAD_FINAL'||!victim.publicReportedDead||victim.currentCharacterId===8)throw new KernelError('RULE_UNRESOLVED','Invalid committed attack victim');
  return {schemaVersion:1,victimId,ruleId:'OFFICIAL_CHAR_8_NIGHT_KILL',stage:'POST_ELIMINATION_CLOSED',pendingEffects:0,sourceRules:['character.json#8',`character.json#${victim.currentCharacterId}`,'VH03','L02']};
 }
 if(!victim || !isKnightClosedDeck(s)||![25,28].includes(victim.currentCharacterId)||victim.life!=='DEAD_FINAL'||!victim.publicReportedDead ||
    s.links.length>0||s.participants.some(p=>p.winLinks.length||p.life==='PENDING_DEATH'||p.life==='PENDING_REVIVAL'||
     p.life==='HIBERNATING'||p.life==='PROLONGED'||p.effects.some(e=>/PROTECTION|REVIVAL|LINK/.test(e.kind))))
  throw new KernelError('RULE_UNRESOLVED','Pending post-death effects require an additional official interaction rule');
 return {schemaVersion:1,victimId,ruleId:'OFFICIAL_CHAR_8_NIGHT_KILL',stage:'POST_ELIMINATION_CLOSED',
  pendingEffects:0,sourceRules:['character.json#8',`character.json#${victim.currentCharacterId}`,'VH03','L02']};
}

import {isDeepVoteDeck,deepLinkedDeath} from '../official/deep-links.js';
import {canHangHeadlessKnight} from '../official/victory-predicates.js';
export function applyCertifiedHanging(s:GameState,victimId:string){
 const victim=s.participants.find(p=>p.playerId===victimId);
 if(cultDeck(s)){if(s.phase!=='DAY_RESOLVE'||s.voting?.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||s.voting.status!=='RESOLVED'||victim?.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Unverified cult hanging');const deaths=cultFinalDeath(s,victimId);return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','character.json#90','VH03'],secondaryIds:deaths.slice(1),secondaryRuleId:'WV-CH90-DEATH',secondarySourceRules:['character.json#90','VH03']};}
 if(jesterRevivalDomain(s)||bellRevivalDomain(s)){
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||victim.publicReportedDead||!canHangHeadlessKnight(s,victimId)||s.participants.some(p=>p.effects.some(e=>e.kind!=='S15_DEEP_MEDIUM_USED'&&!(bellRevivalDomain(s)&&bellLocalEffect(p,e.kind)))))throw new KernelError('RULE_UNRESOLVED','Unverified revival/jester hanging');
  victim.life='DEAD_FINAL';victim.publicReportedDead=true;
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03','VH73',`character.json#${victim.currentCharacterId}`]};
 }
 if(soulDeck(s)){
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||victim.publicReportedDead||!canHangHeadlessKnight(s,victimId))throw new KernelError('RULE_UNRESOLVED','Unverified soul deck hanging');
  if(victim.currentCharacterId===23)soulDeath(s,victim,`hang-${s.round}`);else{victim.life='DEAD_FINAL';victim.publicReportedDead=true;}
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03','VH82','character.json#'+victim.currentCharacterId]};
 }
 if(isFinalRevengeDeck(s)){
  assertRevengeDomain(s);
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||victim.currentCharacterId===33)throw new KernelError('RULE_UNRESOLVED','Revenge requires separate pending resolution');
  victim.life='DEAD_FINAL';victim.publicReportedDead=true;
  if(isRevengeHunterDeck(s)){
   const follow=resolveFinalHunterFollow(s,victimId);
   return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03',...follow.sourceRules],secondaryIds:follow.secondaryId?[follow.secondaryId]:[],secondaryRuleId:HUNTER_CHAIN_RULE,secondarySourceRules:follow.sourceRules};
  }
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03',`character.json#${victim.currentCharacterId}`]};
 }
 if(isFinalHunterDeck(s)){
  assertFinalHunterDomain(s);
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||!canHangHeadlessKnight(s,victimId))throw new KernelError('RULE_UNRESOLVED','Unverified hunter hanging');
  victim.life='DEAD_FINAL';victim.publicReportedDead=true;
  const follow=resolveFinalHunterFollow(s,victimId);
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03',...follow.sourceRules],secondaryIds:follow.secondaryId?[follow.secondaryId]:[],secondaryRuleId:HUNTER_CHAIN_RULE,secondarySourceRules:follow.sourceRules};
 }
 if(isBreakStoneDeck(s)||isBreakExileDeck(s)||isContractDeck(s)||isSwapDeck(s)||isApprovedSingleWolfPackDeck(s)){
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||!canHangHeadlessKnight(s,victimId)||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.winLinks.length||p.effects.some(e=>![SWAP_MARK,CONTRACT_MARK,STONE_LAYER,STONE_SPENT,EXILE_DOLL,EXILE_TRANSITION,'S13_SKILL_USE','S14_50_NIGHT_LOCK','S14_PUBLIC_MUTE','S15_87_VOTE_BLOCK',...((mirrorDeck(s)||mirrorMixedDomain(s))?[MIRROR_MEMORY,MIRROR_SCAN]:[]),...(mirrorMixedDomain(s)?['OFFICIAL_31_GUARD','OFFICIAL_31_LAST_GUARD','S15_77_TRAP']:[]),...(isApprovedSingleWolfPackDeck(s)?['OFFICIAL_9_SNOW_PROTECTION','OFFICIAL_9_USED_TARGET','S15_SCALE_BELL_PAIR','S15_SCALE_BELL_RESOLVED',...(s.participants.some(p=>p.currentCharacterId===31)?['OFFICIAL_31_GUARD','OFFICIAL_31_LAST_GUARD']:[])]:[])].includes(e.kind))))throw new KernelError('RULE_UNRESOLVED','Unverified breakthrough hanging');
  victim.life='DEAD_FINAL';victim.publicReportedDead=true;
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03',`character.json#${victim.currentCharacterId}`]};
 }
 if(isDeepVoteDeck(s)){
  if(s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||!victim||victim.life!=='ALIVE'||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.winLinks.length||p.effects.some(e=>!(bellLinkDomain(s)&&bellLocalEffect(p,e.kind))&&!['S13_SKILL_USE','S15_DEEP_CUPID_TARGET','OFFICIAL_79_USED_ONCE'].includes(e.kind))))throw new KernelError('RULE_UNRESOLVED','Unverified deep hanging');
  victim.life='DEAD_FINAL';victim.publicReportedDead=true;const secondaryIds=deepLinkedDeath(s,victimId);
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03','VH65',`character.json#${victim.currentCharacterId}`],secondaryIds};
 }
 if(isS12ClosedDeck(s)){
  assertS12StableDomain(s);
  if(s.phase!=='DAY_RESOLVE'||s.voting?.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||s.voting.status!=='RESOLVED'||!victim||!canHangHeadlessKnight(s,victimId))throw new KernelError('RULE_UNRESOLVED','Unverified hanging');
  commitS12Death(s,victim);
  return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03','character.json#'+victim.currentCharacterId]};
 }
 if(s.phase!=='DAY_RESOLVE'||s.voting?.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==victimId||s.voting.status!=='RESOLVED'||!isKnightClosedDeck(s)||!victim||victim.life!=='ALIVE'||!canHangHeadlessKnight(s,victimId)||s.links.length||s.effects.some(e=>e.type!=='INFORMATION_RESULT')||s.participants.some(p=>p.life!=='ALIVE'||p.winLinks.length||p.effects.length))
  throw new KernelError('RULE_UNRESOLVED','Unverified hanging or post-elimination interaction');
 victim.life='DEAD_FINAL';victim.publicReportedDead=true;
 return {victimId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','VH03','character.json#'+victim.currentCharacterId]};
}
