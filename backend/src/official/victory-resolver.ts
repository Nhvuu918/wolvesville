import {life02Domain,life02Winners} from './life02.js';
import {cultDeck,cultWin} from './cult-recruitment.js';
import {soulDeck} from './soul-shooter.js';
import {revivalDeck} from './revival.js';
import {isDogThiefDeck,dogThiefWinner} from './dog-thief.js';
import {isApprovedSingleWolfPackDeck} from './final-pack.js';
import {hasClosedDeathLedger,type DeathProofEvent} from './stable-death-proof.js';
import {isFinalRevengeDeck} from './post-hanging-revenge.js';
import {isBreakStoneDeck,isBreakExileDeck,evaluateStableWolfParity,breakContinuation} from './breakthrough-rules.js';
/** Rule-sourced endgame gate. Only the exact {8,25} first-night death
 * chain can be finalized. Other decks/predicates remain non-final facts.
 * Pure and deterministic; caller must commit the result with its Event Log.
 */
import type {GameState,EngineEvent} from '../../../shared/contracts/index.js';
import {isS12ClosedDeck,assertS12StableDomain,canContinueS12AfterHanging} from './death-interactions.js';
import {isS14DeathDeck,isS13Deck} from './s13-mechanics.js';
import {isDeepVoteDeck,isDeepPairDeck,isDeepDemonDeck,isDeepJesterDeck} from './deep-links.js';
import {isDeepRedirectDeck} from './deep-redirect.js';
import {isDeepRescueDeck} from './preliminary-death.js';
import {knightSoloWinner} from './solo-rules.js';

export type VictoryDecision=
  |{kind:'WINNER_VERIFIED';winnerIds:string[];predicateId:'WV_CHAR_8_SOLE_SURVIVOR'|'S11_HANGING_VICTORY'|'S15_CHAR_15_SOLE_SURVIVOR'|'S15_CHAR_58_SOLE_SURVIVOR'|'WV_WOLF_PARITY'|'WV_VILLAGE_ELIMINATION'|'WV_CHAR_39_CAPTURE_MAJORITY'|'WV_CULT_ALL_LIVING'|'WV_CUPID_PAIR';sourceRules:string[]}
  |{kind:'NOT_YET';winnerIds:[];blocker:'NO_MATCHING_CERTIFIED_PREDICATE'|'PENDING_ACCEPTED_ACTIONS'|'POST_ELIMINATION_CHAIN_UNVERIFIED'};
export function resolveCertifiedVictory(s:GameState,events:readonly EngineEvent[],queuedActions:number):VictoryDecision {
 if(life02Domain(s)){if(queuedActions)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};if(!hasClosedDeathLedger(s,events))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};const w=life02Winners(s);return w?{kind:'WINNER_VERIFIED',winnerIds:w.ids,predicateId:w.predicate,sourceRules:w.sources}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};}
 const cw=cultWin(s);if(cw){if(queuedActions||cw.unresolvedDeadFollowers)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};return hasClosedDeathLedger(s,events)?{kind:'WINNER_VERIFIED',winnerIds:cw.winnerIds,predicateId:'WV_CULT_ALL_LIVING',sourceRules:['DC-CULT-WIN-01','VH03','VH58',...(s.qaCultPolicy==='WV-FULL50-CULT-V2'?['WV-CULT-DEAD-WIN-01']:[])]}:{kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};}
 const village=evaluateApprovedVillageVictory(s);
 if(village.length&&queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
 const verdict:VictoryDecision=village.length?{kind:'WINNER_VERIFIED',winnerIds:village.map(f=>f.playerId),predicateId:'WV_VILLAGE_ELIMINATION',sourceRules:village[0]!.ruleSources}:resolveNightCandidate(s,events,queuedActions);
 if(verdict.kind==='WINNER_VERIFIED'&&!hasClosedDeathLedger(s,events))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
 return verdict;
}
function resolveNightCandidate(s:GameState,events:readonly EngineEvent[],queuedActions:number):VictoryDecision {
 if(soulDeck(s)){if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};const facts=s.phase==='NIGHT_FINALIZE'?evaluateVerifiedSoleSurvivorFacts(s):[];return facts.length?{kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_CHAR_8_SOLE_SURVIVOR',sourceRules:['character.json#8','VH03','VH82','LIFE-01']}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};}
 if(s.qaProfile==='owner-bb-live-pack-qa-v1'){if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};const facts=s.phase==='NIGHT_FINALIZE'?evaluateStableWolfParity(s):[];return facts.length?{kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_WOLF_PARITY',sourceRules:['WIN-03','VH03','VH58','DEC-BT-01']}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};}

 if(revivalDeck(s)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  const facts=s.phase==='NIGHT_FINALIZE'?evaluateVerifiedSoleSurvivorFacts(s):[];
  return facts.length?{kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_CHAR_8_SOLE_SURVIVOR',sourceRules:['character.json#8','VH03','VH73','VH76']}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
 }
 if(isDogThiefDeck(s)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  const winner=dogThiefWinner(s);if(winner)return {kind:'WINNER_VERIFIED',winnerIds:[winner],predicateId:'WV_CHAR_39_CAPTURE_MAJORITY',sourceRules:['character.json#39','VH17','VH03']};
  if(s.phase==='NIGHT_FINALIZE'){const wolves=evaluateStableWolfParity(s);if(wolves.length)return {kind:'WINNER_VERIFIED',winnerIds:wolves.map(x=>x.playerId),predicateId:'WV_WOLF_PARITY',sourceRules:['WIN-03','VH03','VH58']};}
  return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
 }
 // Derived closed domains: both #15 and #58 explicitly win as last player alive.
 // All other roles in these decks have no mandatory post-death effects; closure is
 // verified against committed events, not the number of submitted attacks.
 if(isBreakStoneDeck(s)||isBreakExileDeck(s)||isApprovedSingleWolfPackDeck(s)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  if(s.phase!=='NIGHT_FINALIZE'||s.completed||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life))||s.links.some(l=>l.active))return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  if(s.participants.filter(p=>p.life==='DEAD_FINAL').some(p=>!events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId)||!events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0)))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
  const knight=evaluateVerifiedSoleSurvivorFacts(s),wolves=evaluateStableWolfParity(s),facts=[...knight,...wolves];
  return facts.length?{kind:'WINNER_VERIFIED',winnerIds:[...new Set(facts.map(f=>f.playerId))],predicateId:knight.length?'WV_CHAR_8_SOLE_SURVIVOR':'WV_WOLF_PARITY',sourceRules:[...new Set(facts.flatMap(f=>f.ruleSources))]}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
 }
 const key=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');
 if(isS13Deck(s)&&['15,25','15,25,74','15,25,28','15,25,64,74','25,58,74','25,28,58'].includes(key)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  const facts=evaluateExplicitSoleSurvivorFacts(s,[15,58]);
  if(s.phase!=='NIGHT_FINALIZE'||s.completed||s.links.some(l=>l.active)||facts.length!==1)return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  const role=s.participants.find(p=>p.playerId===facts[0]!.playerId)!.currentCharacterId;
  const rule=role===15?'S14_CHAR_15_DIRECT_ATTACK':'S15_CHAR_58_COMPARE';
  if(s.participants.filter(p=>p.life==='DEAD_FINAL').some(p=>!events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId)||!events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0&&[rule,'S11-V03','S15_DEEP_LINKED_DEATH'].includes(String(e.payload.ruleId)))))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
  return {kind:'WINNER_VERIFIED',winnerIds:[facts[0]!.playerId],predicateId:role===15?'S15_CHAR_15_SOLE_SURVIVOR':'S15_CHAR_58_SOLE_SURVIVOR',sourceRules:[`character.json#${role}`,'VH03','WIN-01']};
 }
 if(isDeepRescueDeck(s)||isDeepRedirectDeck(s)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  const facts=s.phase==='NIGHT_FINALIZE'?evaluateVerifiedSoleSurvivorFacts(s):[];
  if(!facts.length||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)))return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  if(s.participants.filter(p=>p.life==='DEAD_FINAL').some(p=>!events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId)||!events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0)))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
  return {kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_CHAR_8_SOLE_SURVIVOR',sourceRules:['character.json#8','VH03',...(isDeepRescueDeck(s)?['character.json#29','NV32']:['VH45','VH61'])]};
 }
 if(isS14DeathDeck(s)){
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  const facts=s.phase==='NIGHT_FINALIZE'?evaluateVerifiedSoleSurvivorFacts(s):[];
  if(!facts.length)return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  for(const p of s.participants.filter(p=>p.life==='DEAD_FINAL'))if(!events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId)||!events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0&&['OFFICIAL_CHAR_8_NIGHT_KILL','S14_DEATH_FOLLOW','S11-V03','S15_FINAL_HUNTER_FOLLOW'].includes(String(e.payload.ruleId))))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
  return {kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_CHAR_8_SOLE_SURVIVOR',sourceRules:['character.json#8','VH03','VH36','VH65']};
 }
 if(isS12ClosedDeck(s)){
  assertS12StableDomain(s);
  if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
  if(s.phase!=='NIGHT_FINALIZE'||s.completed)return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  const facts=evaluateVerifiedSoleSurvivorFacts(s);
  for(const p of s.participants.filter(p=>p.life==='DEAD_FINAL')){
   if(!events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0&&['OFFICIAL_CHAR_8_NIGHT_KILL','S11-V03'].includes(String(e.payload.ruleId)))||!events.some(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
  }
  if(!facts.length)return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
  return {kind:'WINNER_VERIFIED',winnerIds:facts.map(f=>f.playerId),predicateId:'WV_CHAR_8_SOLE_SURVIVOR',sourceRules:facts.flatMap(f=>f.ruleSources)};
 }
 const winner=knightSoloWinner(s);
 if(!winner)return {kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
 if(queuedActions>0)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};
 const victimRole=s.participants.find(p=>p.currentCharacterId===25||p.currentCharacterId===28);
 const victim=victimRole?.playerId;
 const killed=events.some(e=>e.eventType==='VERIFIED_ELIMINATION_AUDIT'&&e.payload.targetId===victim);
 const chain=events.some(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===victim&&
   e.payload.pendingEffects===0&&e.payload.ruleId==='OFFICIAL_CHAR_8_NIGHT_KILL');
 if(!killed||!chain)return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
 return {kind:'WINNER_VERIFIED',winnerIds:[winner],predicateId:'WV_CHAR_8_SOLE_SURVIVOR',
   sourceRules:['character.json#8',`character.json#${victimRole?.currentCharacterId}`,'VH03','VH58']};
}

import {evaluateVerifiedVictoryFacts,evaluateVerifiedSoleSurvivorFacts,evaluateExplicitSoleSurvivorFacts,evaluateApprovedVillageVictory} from './victory-predicates.js';
export function resolveHangingVictory(s:GameState,victimId:string,chain:{victimId:string;pendingEffects:number},events:readonly DeathProofEvent[]=[]):VictoryDecision{
 if(life02Domain(s)){if(s.completed||s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_COMPLETED'||s.voting.outcome.targetId!==victimId||!hasClosedDeathLedger(s,events))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};const w=life02Winners(s);return w?{kind:'WINNER_VERIFIED',winnerIds:w.ids,predicateId:w.predicate,sourceRules:w.sources}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};}
 if(s.completed||s.phase!=='DAY_RESOLVE'||s.voting?.status!=='RESOLVED'||s.voting.outcome?.kind!=='HANGING_COMPLETED'||s.voting.outcome.targetId!==victimId||chain.victimId!==victimId||chain.pendingEffects!==0||!s.participants.some(p=>p.playerId===victimId&&(p.life==='DEAD_FINAL'||soulDeck(s)&&p.life==='PENDING_REVIVAL')&&p.publicReportedDead))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
 const facts=[...evaluateVerifiedVictoryFacts(s,[{type:'HANGING_FINALIZED',playerId:victimId,committed:true}]),...evaluateVerifiedSoleSurvivorFacts(s),...evaluateApprovedVillageVictory(s)];
 const cw=cultWin(s);if(cw?.unresolvedDeadFollowers)return {kind:'NOT_YET',winnerIds:[],blocker:'PENDING_ACCEPTED_ACTIONS'};if(cw)for(const id of cw.winnerIds)facts.push({playerId:id,predicateId:'WV_CULT_ALL_LIVING',ruleSources:['DC-CULT-WIN-01','VH03','VH58'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'});
 if(isDeepVoteDeck(s)&&!s.links.some(l=>l.active))facts.push(...evaluateExplicitSoleSurvivorFacts(s,[15,58]));
 if(!hasClosedDeathLedger(s,events))return {kind:'NOT_YET',winnerIds:[],blocker:'POST_ELIMINATION_CHAIN_UNVERIFIED'};
 // WIN-03 + VH03: after #28's actual hanging the sole wolf is at parity with
 // the sole villager. Only this certified deck is admitted; no dead-faction
 // winner membership or village-elimination predicate is inferred.
 if(isDeepJesterDeck(s)||isBreakStoneDeck(s)||isBreakExileDeck(s)||isFinalRevengeDeck(s)||isApprovedSingleWolfPackDeck(s))facts.push(...evaluateStableWolfParity(s));
 return facts.length?{kind:'WINNER_VERIFIED',winnerIds:[...new Set(facts.map(f=>f.playerId))],predicateId:'S11_HANGING_VICTORY',sourceRules:[...new Set(facts.flatMap(f=>f.ruleSources))]}:{kind:'NOT_YET',winnerIds:[],blocker:'NO_MATCHING_CERTIFIED_PREDICATE'};
}

/** Explicit resolution disposition; a missing predicate is not always a blocker. */
export function classifyS12Resolution(s:GameState,verdict:VictoryDecision):NonNullable<GameState['resolutionGate']>{
 if(verdict.kind==='WINNER_VERIFIED')return {status:'GAME_COMPLETED',round:s.round};
 if(verdict.blocker==='PENDING_ACCEPTED_ACTIONS'||verdict.blocker==='POST_ELIMINATION_CHAIN_UNVERIFIED')return {status:'PENDING_EFFECT',round:s.round,reason:verdict.blocker};
 if(canContinueS12AfterHanging(s))return {status:'CONTINUE',round:s.round};
 return {status:'BLOCKED_BY_RULE',round:s.round,reason:'E02: NO_MATCHING_CERTIFIED_PREDICATE'};
}

export function classifyBreakResolution(s:GameState,verdict:VictoryDecision):NonNullable<GameState['resolutionGate']>{
 if(verdict.kind==='WINNER_VERIFIED')return {status:'GAME_COMPLETED',round:s.round};
 if(verdict.blocker==='PENDING_ACCEPTED_ACTIONS'||verdict.blocker==='POST_ELIMINATION_CHAIN_UNVERIFIED')return {status:'PENDING_EFFECT',round:s.round,reason:verdict.blocker};
 return breakContinuation(s)?{status:'CONTINUE',round:s.round}:{status:'BLOCKED_BY_RULE',round:s.round,reason:'E02: unverified remaining victory or pack action'};
}
