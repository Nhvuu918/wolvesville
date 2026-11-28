import {life02Domain,life02RescueDomain,queueLife02Attack} from './life02.js';
import {cultDeck} from './cult-recruitment.js';
import {MIRROR_DECK,MIRROR_BITE,mirrorDeck,recordMirrorBite} from './mirror-investigation.js';
import {ownerDc,ownerDcS21} from '../experimental/owner-dc-policy.js';
import {trapRevivalDomain} from './revival-capability.js';
import {jesterRevivalDomain} from './revival-capability.js';
import {revivalDeck,revivalDeckIds} from './revival.js';
import {selectSingleDefense,consumeDefense} from './protection-consumption.js';
import {DOG_THIEF_SKILL,DOG_THIEF_DECK,DOG_THIEF_RULE,validateDogThief,dogThiefEffect,applyDogThief} from './dog-thief.js';
import {isModernRuleVersion,isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import {PACK_BITE,PACK_BITE_RULE,LEADER_BITE,LEADER_DECK,SCALE_LEADER_DECKS,isApprovedLeaderDeck,absorbPackProtection,isPackBiteSkill,PHARMACIST_RESCUE,PACK_DECKS,isFinalPackDeck,packReady,pharmacistWindow,validatePack} from './final-pack.js';
import {BELL_SKILL,BELL_MARK,validateBell,placeBell,BELL_LINK_DECK,bellRevivalDomain,bellLinkDomain,bellLocalEffect} from './bell-rules.js';
import {REVENGE_SKILL,REVENGE_SKIP,REVENGE_DECK,APPROVED_MIXED_REVENGE_DECK,isFinalRevengeDeck,validateRevenge} from './post-hanging-revenge.js';
import {isFinalHunterDeck,HUNTER_FOLLOW_DECKS,resolveFinalHunterFollow,isHunterFollowDomain,REVENGE_HUNTER_DECK,absorbHunterDomainAttack} from './hanging-follow.js';
import {SWAP_SKILL,SWAP_MARK,validateSwap,placeSwap} from './swap-rules.js';
import {CONTRACT_SKILL,validateContract} from './ballot-contract.js';
/** Sprint 13 restricted, source-backed executable branches.
 * No competitive games and no generic combat ordering. Effects are persisted
 * in the authoritative Kernel; unresolved interactions fail closed.
 * Provenance: character.json #11/#16/#24/#59/#66/#67, VH08/VH31/VH35/VH57/VH68/VH70.
 */
import type {GameAction,GameState,Effect,Participant} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {RuleRegistry} from '../engine/rules.js';
import {isDeepPairDeck,isDeepDemonDeck,cupidEligible,validateCupid,rememberCupid,createSecretPair,SECRET_PAIR} from './deep-links.js';
import {REDIRECT_SKILLS,REDIRECT_MARK,validateRedirect,placeRedirect,isDeepRedirectDeck} from './deep-redirect.js';
import {isDeepRescueDeck,pendingVictims,queuePreliminaryDeath,rescuePreliminary,WITCH_RESCUE} from './preliminary-death.js';

import {liveRetaliationDomain} from '../experimental/owner-bb-v2/live-profile.js';
import {liveWitchDomain} from '../experimental/owner-bb-v2/live-witch-domain.js';
import {STONE_SKILL,STONE_LAYER,EXILE_DOLL_SKILL,EXILE_DOLL,isBreakStoneDeck,isBreakExileDeck,validateStone,placeStone,validateEffigy,placeEffigy} from './breakthrough-rules.js';
export const S13_SKILLS={
 dogThief:DOG_THIEF_SKILL,bell:BELL_SKILL,packBite:PACK_BITE,leaderBite:LEADER_BITE,mirrorBite:MIRROR_BITE,pharmacistRescue:PHARMACIST_RESCUE,revenge:REVENGE_SKILL,revengeSkip:REVENGE_SKIP,swap:SWAP_SKILL,stoneProtection:STONE_SKILL,effigy:EXILE_DOLL_SKILL,contractOffer:CONTRACT_SKILL.offer,contractAccept:CONTRACT_SKILL.accept,contractDecline:CONTRACT_SKILL.decline,
 maintenance:'official.11.maintenance',judgment:'official.17.day-judgment',poison:'official.16.delayed-poison',antidote:'official.16.antidote',
 jail:'official.24.jail',stone:'official.59.stone',watch:'official.66.night-guard',
 smith:'official.67.shield', gun:'official.32.shoot', fire:'official.36.fireball', sword:'official.67.sword', meteor:'official.78.meteor', dog:'official.52.solo-dog',soulShield:'official.23.shield',silence:'official.84.silence',numb:'official.50.numb',youngMark:'official.68.mark',hunterMark:'official.88.pin',sniper:'official.43.shoot',mageShield:'official.36.shield',sedative:'official.87.sedative',publicReveal:'official.54.reveal',violin:'official.80.compare', curse:'official.72.aura-curse', illusion:'official.49.aura-illusion', guardShot:'official.54.shoot', witchPoison:'official.29.poison',witchRescue:WITCH_RESCUE,flagRedirect:REDIRECT_SKILLS.flag,hypnotize:REDIRECT_SKILLS.hypnosis, exile:'official.93.seal', portrait:'official.71.disguise', darkCupid:'official.15.single-kill', demon:'official.58.compare', trap:'official.77.trap'
} as const;
export const S13_STATUS={
 maintenance:'S13_11_MAINTENANCE',judgment:'S13_17_JUDGMENT_USED',poison:'S13_16_POISON',antidote:'S13_16_ANTIDOTE',
 jail:'S13_24_JAIL',stone:'S13_59_INJURY',watch:'S13_66_GUARD',smith:'S13_67_SHIELD',
 dog:'S14_52_SOLO_DOG',soulShield:'S14_23_SHIELD',mute:'S14_PUBLIC_MUTE',numb:'S14_50_NIGHT_LOCK',deathMark:'S14_DEATH_MARK',stoneKill:'S14_59_KILL_USED',mageShield:'S15_36_SHIELD',voteBlock:'S15_87_VOTE_BLOCK',deathFact:'S15_80_DEATH_FACT',curse:'S15_72_AURA_CURSE',illusion:'S15_49_AURA_ILLUSION',portrait:'S15_71_DISGUISE',trap:'S15_77_TRAP',used:'S13_SKILL_USE'
} as const;
/** Each deck is explicitly identified. Other combinations are not authorized.
 * In particular #8 may attack #25 only in these extended decks; no match winner is inferred. */
import {soulDeck,soulDeckIds,soulAttackTarget,soulDeath,soulStage,SOUL_MARK,SOUL_SHOT,SOUL_AMMO} from './soul-shooter.js';
export const S13_DECKS=[DOG_THIEF_DECK,[8,25,26],
 [11,25,76],[17,25,76],[16,25,76],[8,16,25],[8,24,25],[8,25,66],[8,25,67],[25,59], [25,32],[25,36],[25,67],[25,78],[8,25,52],[8,25,23],[23,25,36],[23,25,32],[23,25,78],[25,84],[25,50],[17,25,74],[8,25,68],[8,25,88],[25,43],[23,25,43],[8,25,36],[25,66,67],[25,74,87],[25,54,74],[8,25,80],[25,32,80],[25,72,84],[25,49,84],[3,25,49,74],[25,29],[25,29,67],[8,25,29],[8,25,63],[8,25,63,74],[8,25,85],[25,93,94],[25,71,84],[15,25],[15,25,74],[15,25,28],[25,58,74],[25,28,58],[25,28,79],[8,25,77],[19,25,28],[25,28,37],[25,28,37,74],[25,28,55],[8,25,55],[8,25,28,55],[8,25,93,94],...HUNTER_FOLLOW_DECKS,REVENGE_DECK,APPROVED_MIXED_REVENGE_DECK,REVENGE_HUNTER_DECK,...PACK_DECKS,LEADER_DECK,...SCALE_LEADER_DECKS,MIRROR_DECK,BELL_LINK_DECK
] as const;
const deckKey=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',');
const DECK_KEYS=new Set(S13_DECKS.map(deckKey));
export function isS13DeckIds(ids:readonly number[]):boolean{
 return ids.length===new Set(ids).size&&(DECK_KEYS.has(deckKey(ids))||revivalDeckIds(ids)||soulDeckIds(ids));
}
export function isS13Deck(s:GameState):boolean{
 return life02Domain(s)||cultDeck(s)||mirrorDeck(s)||soulDeck(s)||revivalDeck(s)||liveWitchDomain(s)||liveRetaliationDomain(s)||isBreakExileDeck(s)||isS13DeckIds(s.participants.map(p=>p.initialCharacterId))&&!soulDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.participants.some(p=>p.initialCharacterId===35)&&
  s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction)&&
  (s.links.length===0||isDeepPairDeck(s))&&s.participants.every(p=>p.winLinks.length===0);
}
export function isS13AttackDeck(s:GameState):boolean{
 return life02Domain(s)||isBreakStoneDeck(s)&&s.participants.some(p=>p.currentCharacterId===8)||isBreakExileDeck(s)&&s.participants.some(p=>p.currentCharacterId===8)||isS13Deck(s)&&[8,16,24,29,63,85,66,67,52,23,68,88,36,80,77].some(id=>s.participants.some(p=>p.currentCharacterId===id))&&
 s.participants.some(p=>p.currentCharacterId===8);
}
export function isS14DeathDeck(s:GameState):boolean{
 return isHunterFollowDomain(s)||isS13Deck(s)&&['8,25,68','8,25,88'].includes(deckKey(s.participants.map(p=>p.initialCharacterId)));
}
export function isCertifiedS13AttackTarget(s:GameState,id:string):boolean{
 const role=participant(s,id).currentCharacterId;
 return (life02Domain(s)&&role!==8)||(soulDeck(s)&&[23,25,36].includes(role))||(revivalDeck(s)&&[25,26,74].includes(role))||(bellRevivalDomain(s)&&role===64)||(jesterRevivalDomain(s)&&role===28)||(ownerDcS21(s)&&trapRevivalDomain(s)&&role===10)||(isFinalHunterDeck(s)&&[9,25,28,88].includes(role))||(isBreakStoneDeck(s)&&[25,28,55].includes(role))||(isBreakExileDeck(s)&&[25,93,94].includes(role))||role===25||(isDeepRescueDeck(s)&&role===29)||(liveWitchDomain(s)&&role===10)||(isDeepRedirectDeck(s)&&[63,74,85].includes(role))||(isS15TrapDeck(s)&&role===77)||(isS14DeathDeck(s)&&[68,88].includes(role));
}
/** Exact three-role, night-kill-only death chain. No resurrection, competing links,
 * shields, or unknown reactions are admitted. VH36 and VH65; no mark = no #68 pull.
 * #88 old mark persistence remains unresolved outside a mark made this night. */
export function resolveS14DeathFollow(s:GameState,victimId:string):{secondaryId?:string;blockedTargetId?:string;layerId?:string;sourceRules:string[]} {
 if(isHunterFollowDomain(s))return resolveFinalHunterFollow(s,victimId);
 if(!isS14DeathDeck(s)||s.phase!=='NIGHT_RESOLVE')throw new KernelError('RULE_UNRESOLVED','Unverified death-chain deck');
 const victim=participant(s,victimId);
 if(victim.life!=='DEAD_FINAL')throw new KernelError('RULE_UNRESOLVED','Primary death not committed');
 const role=victim.currentCharacterId,sourceRules=[`character.json#${role}`,'VH03','VH65'];
 if(role===25)return {sourceRules};
 if(![68,88].includes(role))throw new KernelError('RULE_UNRESOLVED','Unknown death trigger');
 if(role===68)sourceRules.push('VH36');
 const mark=victim.effects.find(e=>e.kind===S13_STATUS.deathMark);
 if(!mark)return {sourceRules};
 if(role===88&&mark.payload?.round!==s.round)throw new KernelError('RULE_UNRESOLVED','Hunter prior-night mark persistence not certified');
 const target=participant(s,String(mark.payload?.targetId));
 if(target.currentCharacterId!==25||target.winLinks.length||target.effects.some(e=>e.kind!==S13_STATUS.used))throw new KernelError('RULE_UNRESOLVED','Unverified follow-death protection/link');
 if(target.life==='DEAD_FINAL')return {sourceRules};
 if(target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Unverified secondary life state');
 target.life='DEAD_FINAL';target.publicReportedDead=true;return {secondaryId:target.playerId,sourceRules};
}
export function isS14ChatDeck(s:GameState):boolean{
 return cultDeck(s)||isFinalRevengeDeck(s)||isFinalPackDeck(s)||isApprovedLeaderDeck(s)||isS13Deck(s)&&['25,84','25,50','17,25,74','25,74,87','25,72,84','25,49,84','25,93,94','25,71,84'].includes(deckKey(s.participants.map(p=>p.initialCharacterId)));
}
/** S15: the sedative applies the explicit #87 vote restriction in addition to VH57 mute.
 * No new modifier precedence is inferred; only one sedative actor in a QA deck. */
export function isS15SedativeDeck(s:GameState):boolean{
 return isS13Deck(s)&&(deckKey(s.participants.map(p=>p.initialCharacterId))==='25,74,87'||(isFinalPackDeck(s)||isApprovedLeaderDeck(s))&&s.participants.some(p=>p.currentCharacterId===87));
}
export function isS15RevealDeck(s:GameState):boolean{
 return isS13Deck(s)&&deckKey(s.participants.map(p=>p.initialCharacterId))==='25,54,74';
}
export function s15RevealReady(s:GameState):boolean{
 return isS15RevealDeck(s)&&s.round>1&&s.phase==='DAY_VOTE_COLLECT'&&s.voting?.status==='OPEN'&& !guardUsedToday(s);
}
function guardUsedToday(s:GameState):boolean{
 return s.participants.some(p=>p.currentCharacterId===54&&p.effects.some(e=>e.kind===S13_STATUS.used&&[S13_SKILLS.guardShot,S13_SKILLS.publicReveal].includes(e.payload?.skillId as typeof S13_SKILLS.guardShot)&&e.payload?.round===s.round));
}
export function s15GuardShotReady(s:GameState):boolean{
 return isModernRuleVersion(s.ruleVersion)&&isS15RevealDeck(s)&&s.round>1&&s.phase==='DAY_DISCUSS'&&!guardUsedToday(s)&&s.participants.some(p=>p.currentCharacterId===54&&p.life==='ALIVE'&&s13UseCount(s,p.playerId,S13_SKILLS.guardShot)<1);
}
export function isS15TrapDeck(s:GameState):boolean{return isModernRuleVersion(s.ruleVersion)&&isS13Deck(s)&&deckKey(s.participants.map(p=>p.initialCharacterId))==='8,25,77';}
export function isS15WitchDeck(s:GameState):boolean{return isModernRuleVersion(s.ruleVersion)&&isS13Deck(s)&&(life02RescueDomain(s)||liveWitchDomain(s)||['25,29','25,29,67','8,25,29'].includes(deckKey(s.participants.map(p=>p.initialCharacterId))));}
export function isS15ExileDeck(s:GameState):boolean {return isModernRuleVersion(s.ruleVersion)&&isS13Deck(s)&&(deckKey(s.participants.map(p=>p.initialCharacterId))==='25,93,94'||isBreakExileDeck(s));}
export function isS15VoteBlocked(s:GameState,id:string):boolean{
 return (isS15SedativeDeck(s)||isS15ExileDeck(s))&&s.phase.startsWith('DAY')&&hasS13Status(s,id,S13_STATUS.voteBlock);
}
/** VH57: mute blocks public chat only, not voting. Scope: QA public day discussion. */
export function isS14PublicMuted(s:GameState,id:string):boolean{
 return s.phase.startsWith('DAY')&&participant(s,id).effects.some(e=>e.kind===S13_STATUS.mute&&(e.expiresAtRound===s.round||e.payload?.permanent===true));
}
export function s14NumbReady(s:GameState,id:string):boolean{
 return !participant(s,id).effects.some(e=>e.kind===S13_STATUS.used&&e.payload?.skillId===S13_SKILLS.numb&&Number(e.payload?.round)>=s.round-1);
}
export function hasS13Status(s:GameState,id:string,kind:string):boolean{
 return participant(s,id).effects.some(e=>e.kind===kind&&e.expiresAtRound===s.round);
}
export function isS13SkillBlocked(s:GameState,id:string):boolean{
 const p=participant(s,id);
 const jail=hasS13Status(s,id,S13_STATUS.jail)&&s.phase.startsWith('NIGHT');
 const injured=p.effects.some(e=>e.kind===S13_STATUS.stone&&
  ((s.phase.startsWith('DAY')&&e.payload?.dayRound===s.round)||
   (s.phase.startsWith('NIGHT')&&e.expiresAtRound===s.round)));
 const poison=p.currentFaction!=='dan'&&p.effects.some(e=>e.kind===S13_STATUS.poison&&
  e.expiresAtRound===s.round&&s.phase.startsWith('NIGHT'));
 return jail||injured||poison||(s.phase.startsWith('NIGHT')&&hasS13Status(s,id,S13_STATUS.numb));
}
export function isS13Maintenance(s:GameState,id:string):boolean{
 return s.phase.startsWith('NIGHT')&&hasS13Status(s,id,S13_STATUS.maintenance);
}
export function s13UseCount(s:GameState,actorId:string,skillId:string):number{
 return participant(s,actorId).effects.filter(e=>e.kind===S13_STATUS.used&&e.payload?.skillId===skillId).length;
}
const used=(s:GameState,a:GameAction)=>participant(s,a.playerId).effects.push({
 id:`s13-use-${a.actionId}`,kind:S13_STATUS.used,
 payload:{skillId:a.skillId,round:s.round,sourceRule:'character.json'}
});
/** B/B QA only. Called after the registered adapter evaluates the accepted
 * action. #29 may use both potions in a single window; the caller consumes
 * the mark after the whole group. Resource history uses the normal ledger. */
export function applyLiveInvertedWitch(s:GameState,a:GameAction,e:Effect):boolean{
 if(!liveWitchDomain(s)||s.phase!=='WITCH_WINDOW'||participant(s,a.playerId).currentCharacterId!==29||e.targetId!==a.targetIds[0]||e.causeId!==a.playerId)throw new KernelError('RULE_UNRESOLVED','Invalid B/B potion provenance');
 const target=participant(s,e.targetId);
 if(a.skillId===WITCH_RESCUE){
  validate(s,a,1);if(e.type!=='HEAL'||e.key!==WITCH_RESCUE||!pendingVictims(s).includes(target))throw new KernelError('TARGET_INVALID','Inverted rescue requires pending death');
  used(s,a);target.effects=target.effects.filter(x=>x.kind!=='S15_DEEP_PRELIMINARY_DEATH');target.life='DEAD_FINAL';target.publicReportedDead=true;return true;
 }
 if(a.skillId===S13_SKILLS.witchPoison){s14AttackAllowed(s,a);if(e.type!=='DEATH_TRANSITION'||e.key!==a.skillId||target.life!=='ALIVE')throw new KernelError('TARGET_INVALID','Inverted poison requires valid living target');used(s,a);return false;}
 throw new KernelError('RULE_UNRESOLVED','Unsupported B/B potion');
}
function validate(s:GameState,a:GameAction,maxPerMatch?:number){
 if(!isS13Deck(s))throw new KernelError('RULE_UNRESOLVED','This skill has no certified interaction path in this deck');
 if(maxPerMatch!==undefined&&s13UseCount(s,a.playerId,a.skillId)>=maxPerMatch)
  throw new KernelError('RESOURCE_INSUFFICIENT','This official skill has no remaining uses');
}
const single={min:1,max:1,allowSelf:true,aliveOnly:true};

/** S14: direct lethal actions in isolated two-role sessions. No inferred faction victory. */
export const S14_ATTACKS=[SOUL_SHOT,S13_SKILLS.gun,S13_SKILLS.fire,S13_SKILLS.sword,S13_SKILLS.meteor,S13_SKILLS.sniper,S13_SKILLS.guardShot,S13_SKILLS.witchPoison,S13_SKILLS.darkCupid,S13_SKILLS.demon] as readonly string[];
const attackSpecs=[
 {id:23,skill:SOUL_SHOT,max:2,source:'character.json#23,VH82,LIFE-01',day:false},
 {id:15,skill:S13_SKILLS.darkCupid,max:undefined,source:'character.json#15',day:false},
 {id:29,skill:S13_SKILLS.witchPoison,max:1,source:'character.json#29,VH60',day:false},
 {id:32,skill:S13_SKILLS.gun,max:3,source:'character.json#32,VH09',day:true},
 {id:43,skill:S13_SKILLS.sniper,max:2,source:'character.json#43',day:true},
 {id:36,skill:S13_SKILLS.fire,max:2,source:'character.json#36,VH12,VH13',day:false},
 {id:67,skill:S13_SKILLS.sword,max:1,source:'character.json#67,VH35,VH70',day:false},
 {id:78,skill:S13_SKILLS.meteor,max:1,source:'character.json#78,VH43',day:false}
];
export function isS15ViolinDeck(s:GameState):boolean{
 return isS13Deck(s)&&['8,25,80','25,32,80'].includes(deckKey(s.participants.map(p=>p.initialCharacterId)));
}
export function s15ViolinReady(s:GameState,actorId:string):boolean{
 return isS15ViolinDeck(s)&&s.participants.some(p=>p.playerId!==actorId&&p.life==='ALIVE')&&s.participants.some(p=>p.life==='DEAD_FINAL'&&p.effects.some(e=>e.kind===S13_STATUS.deathFact&&e.payload?.round===s.round-1));
}
function violinResult(s:GameState,a:GameAction):string{
 if(!isS15ViolinDeck(s))throw new KernelError('RULE_UNRESOLVED','Violin QA scope required');
 const live=participant(s,a.targetIds[0]!),dead=participant(s,a.targetIds[1]!);
 const fact=dead.effects.find(e=>e.kind===S13_STATUS.deathFact&&e.payload?.round===s.round-1);
 if(live.life!=='ALIVE'||dead.life!=='DEAD_FINAL'||!fact||typeof fact.payload?.faction!=='string')throw new KernelError('TARGET_INVALID','Select a living player and a victim from the previous night');
 return live.currentFaction===fact.payload.faction?'Tiếc Thương':'Không Tiếc Thương';
}
function isS14DirectDeck(s:GameState,id:number):boolean{
 const key=deckKey(s.participants.map(p=>p.initialCharacterId));
 return (soulDeck(s)&&[23,36].includes(id))||(id===36&&isApprovedRuleVersion(s.ruleVersion)&&key==='8,25,36')||(id===15&&isDeepPairDeck(s))||(id===29&&isS15WitchDeck(s))||(id===32&&key==='25,32,80')||key===deckKey([25,id])||([32,36,43,78].includes(id)&&key===deckKey([23,25,id]));
}
// A source-backed fireball may hit any other living member of the supported
// knight/mage/seer composition. #23 is deliberately not newly admitted as a
// lethal target: its mandatory secret revival is not yet implemented.
function directTargetAllowed(s:GameState,role:number,actorId:string,target:Participant):boolean{
 if(soulDeck(s)&&role===36)return target.playerId!==actorId;
 if(soulDeck(s)&&role===23)return target.playerId!==actorId&&(ownerDc(s)||['soi','phe3'].includes(target.currentFaction)); // DC-SOUL-02=A in opt-in QA; legacy policy unchanged
 if(role===15&&isDeepPairDeck(s))return cupidEligible(s,actorId).includes(target.playerId);
 if(role===29)return target.playerId!==actorId;
 if(role===36&&isApprovedRuleVersion(s.ruleVersion)&&deckKey(s.participants.map(p=>p.initialCharacterId))==='8,25,36')return target.playerId!==actorId;
 return target.currentCharacterId===25;
}
export function s14AttackAllowed(s:GameState,a:GameAction){
 const spec=attackSpecs.find(x=>x.skill===a.skillId);
 if(!spec||!isS13Deck(s)||!isS14DirectDeck(s,spec.id)||(spec.id!==29&&!(spec.id===15&&isDeepPairDeck(s))&&!directTargetAllowed(s,spec.id,a.playerId,participant(s,a.targetIds[0]!))))
  throw new KernelError('RULE_UNRESOLVED','S14 attack requires isolated verified target');
 validate(s,a,spec.max);
 if(spec.id===23&&(!soulDeck(s)||soulStage(participant(s,a.playerId))!=='REVIVED'))throw new KernelError('RULE_UNRESOLVED','Soul ammunition is not available');
 if(spec.id===15&&isDeepPairDeck(s))validateCupid(s,a);
 if([32,43].includes(spec.id)&&participant(s,a.playerId).effects.some(e=>e.kind===S13_STATUS.used&&e.payload?.skillId===a.skillId&&e.payload?.round===s.round))
  throw new KernelError('RESOURCE_INSUFFICIENT','Only one shooting phase per round');
 return spec;
}
export function s14AttackAvailable(s:GameState,playerId:string,skillId:string):boolean{
 const spec=attackSpecs.find(x=>x.skill===skillId);
 return !!spec&&isS14DirectDeck(s,spec.id)&&s.participants.some(p=>directTargetAllowed(s,spec.id,playerId,p)&&p.life==='ALIVE'&&(!soulDeck(s)||!p.publicReportedDead))&&
 !([32,43].includes(spec.id)&&participant(s,playerId).effects.some(e=>e.kind===S13_STATUS.used&&e.payload?.skillId===skillId&&e.payload?.round===s.round));
}

/** Only new, disjoint aura QA decks. VH39 single target; VH25 two uses per match.
 * No exact-role distortion, transformation or overlapping modifiers inferred. */
export function isS15AuraDeck(s:GameState,role:number):boolean{
 return isModernRuleVersion(s.ruleVersion)&&isS13Deck(s)&&[49,72].includes(role)&&deckKey(s.participants.map(p=>p.initialCharacterId))===deckKey([25,84,role]);
}
export function hasS15AuraDistortion(s:GameState,targetId:string):boolean{
 if(s.phase!=='NIGHT_RESOLVE')return false;
 return (isS15AuraDeck(s,72)&&hasS13Status(s,targetId,S13_STATUS.curse))||
 (isS15AuraDeck(s,49)&&s.participants.some(p=>p.currentCharacterId===49&&hasS13Status(s,p.playerId,S13_STATUS.illusion)));
}
export function registerS13Mechanics(r:RuleRegistry):RuleRegistry{
 r.register({characterId:39,skillId:DOG_THIEF_SKILL,ruleId:DOG_THIEF_RULE,ruleVersion:RULESET_VERSION,priority:150,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateDogThief,evaluate:(s,a)=>[dogThiefEffect(s,a)]});
 r.register({characterId:64,skillId:BELL_SKILL,ruleId:'S15_SCALE_CHAR_64_BELL',ruleVersion:RULESET_VERSION,priority:20,phases:['NIGHT_COLLECT'],target:{min:2,max:2,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateBell,evaluate:(s,a)=>{validateBell(s,a);return [{type:'STATUS',key:BELL_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 for(const [characterId,skillId,ruleId] of [[93,PACK_BITE,PACK_BITE_RULE],[48,LEADER_BITE,'S15_APPROVED_CHAR_48_PACK_BITE'],[35,MIRROR_BITE,'S26_CHAR_35_PACK_BITE']] as const)r.register({characterId,skillId,ruleId,ruleVersion:RULESET_VERSION,priority:150,phases:['NIGHT_COLLECT'],target:{min:1,max:characterId===35?1:2,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validatePack,evaluate:(s,a)=>{validatePack(s,a);return a.targetIds.map(id=>({type:'DEATH_TRANSITION',key:skillId,targetId:id,causeId:a.playerId}));}});
 const checkPharmacist=(s:GameState,a:GameAction)=>{validate(s,a,1);if(!pharmacistWindow(s)||s.phase!=='WITCH_WINDOW'||!pendingVictims(s).some(p=>p.playerId===a.targetIds[0]))throw new KernelError('TARGET_INVALID','Rescue requires a pending wolf-bite victim');};
 r.register({characterId:87,skillId:PHARMACIST_RESCUE,ruleId:'S15_FINAL_CHAR_87_RESCUE',ruleVersion:RULESET_VERSION,priority:10,phases:['WITCH_WINDOW'],target:{min:1,max:1,allowSelf:true,aliveOnly:false},maxUsesPerPhase:1,validateSubmission:checkPharmacist,evaluate:(s,a)=>{checkPharmacist(s,a);return [{type:'HEAL',key:PHARMACIST_RESCUE,targetId:a.targetIds[0]!,causeId:a.playerId,recipientId:a.playerId}];}});

 for(const skillId of [REVENGE_SKILL,REVENGE_SKIP])r.register({characterId:33,skillId,ruleId:'S15_FINAL_CHAR_33_REVENGE',ruleVersion:RULESET_VERSION,priority:1,phases:['DAY_RESOLVE'],target:{min:skillId===REVENGE_SKILL?1:0,max:skillId===REVENGE_SKILL?1:0,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateRevenge,evaluate:()=>{throw new KernelError('RULE_UNRESOLVED','Revenge must settle atomically with pending chain');}});

 r.register({characterId:37,skillId:SWAP_SKILL,ruleId:'S15_BREAK_CHAR_37_SWAP',ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:{min:2,max:2,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateSwap,evaluate:(s,a)=>{validateSwap(s,a);return [{type:'STATUS',key:SWAP_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 for(const skill of Object.values(CONTRACT_SKILL)){r.register({characterId:skill===CONTRACT_SKILL.offer?19:null,skillId:skill,ruleId:'S15_BREAK_CHAR_19_BALLOT_CONTRACT',ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:skill===CONTRACT_SKILL.offer?{min:2,max:2,allowSelf:true,aliveOnly:true}:{min:0,max:0,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateContract,evaluate:()=>{throw new KernelError('RULE_UNRESOLVED','Contract must resolve at submission');}});}
 r.register({characterId:55,skillId:STONE_SKILL,ruleId:'S15_BREAK_CHAR_55_PROTECTION',ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,validateSubmission:validateStone,evaluate:(s,a)=>{validateStone(s,a);return [{type:'PROTECTION',key:STONE_LAYER,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:94,skillId:EXILE_DOLL_SKILL,ruleId:'S15_BREAK_CHAR_94_EFFIGY',ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,validateSubmission:validateEffigy,evaluate:(s,a)=>{validateEffigy(s,a);return [{type:'PROTECTION',key:EXILE_DOLL,targetId:a.targetIds[0]!,causeId:a.playerId}];}});

 for(const spec of [{id:63,skill:REDIRECT_SKILLS.flag,targets:2},{id:85,skill:REDIRECT_SKILLS.hypnosis,targets:1}])r.register({characterId:spec.id,skillId:spec.skill,ruleId:`S15_DEEP_CHAR_${spec.id}_REDIRECT`,ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:{min:spec.targets,max:spec.targets,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateRedirect,evaluate:(s,a)=>{validateRedirect(s,a);return [{type:'PROTECTION',key:REDIRECT_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 const validateRescue=(s:GameState,a:GameAction)=>{validate(s,a,1);if(!(isDeepRescueDeck(s)||life02RescueDomain(s))||s.phase!=='WITCH_WINDOW'||!pendingVictims(s).some(p=>p.playerId===a.targetIds[0]))throw new KernelError('TARGET_INVALID','Rescue requires a preliminary night victim');};
 r.register({characterId:29,skillId:WITCH_RESCUE,ruleId:'S15_DEEP_CHAR_29_RESCUE',ruleVersion:RULESET_VERSION,priority:10,phases:['WITCH_WINDOW'],target:{min:1,max:1,allowSelf:true,aliveOnly:false},maxUsesPerPhase:1,validateSubmission:validateRescue,evaluate:(s,a)=>{validateRescue(s,a);return [{type:'HEAL',key:WITCH_RESCUE,targetId:a.targetIds[0]!,causeId:a.playerId,recipientId:a.playerId}];}});

 // #71 persistent aura disguise: INV-01 + VH38, no exact-role seer in this deck.
 r.register({characterId:71,skillId:S13_SKILLS.portrait,ruleId:'S15_CHAR_71_DISGUISE',ruleVersion:RULESET_VERSION,priority:15,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,validateSubmission:(s,a)=>validate(s,a),evaluate:(s,a)=>{validate(s,a);return [{type:'STATUS',key:S13_STATUS.portrait,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 // #77: single trap, explicit lethal-block and counter-kill in VH51. No pack bite here.
 r.register({characterId:77,skillId:S13_SKILLS.trap,ruleId:'S15_CHAR_77_TRAP',ruleVersion:RULESET_VERSION,priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,validateSubmission:(s,a)=>validate(s,a),evaluate:(s,a)=>{validate(s,a);return [{type:'PROTECTION',key:S13_STATUS.trap,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 // #58 actual faction comparison; same faction is private, differing factions die (except self).
 r.register({characterId:58,skillId:S13_SKILLS.demon,ruleId:'S15_CHAR_58_COMPARE',ruleVersion:RULESET_VERSION,priority:150,phases:['NIGHT_COLLECT'],target:{min:2,max:2,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:(s,a)=>validate(s,a),evaluate:(s,a)=>{
  validate(s,a);const targets=a.targetIds.map(id=>participant(s,id));
  if(targets[0]!.currentFaction===targets[1]!.currentFaction)return [{type:'INFORMATION_RESULT',key:a.skillId,targetId:targets[0]!.playerId,causeId:a.playerId,recipientId:a.playerId,visibility:'PLAYER_PRIVATE',value:targets[0]!.currentFaction}];
  return targets.filter(t=>t.playerId!==a.playerId).map(t=>({type:'DEATH_TRANSITION' as const,key:a.skillId,targetId:t.playerId,causeId:a.playerId}));
 }});

 // Character #93: same-night skill lock, subsequent day chat AND vote lock.
 // Only the mandatory paired deck is admitted; no transformation/death triggers inferred.
 const checkExile=(s:GameState,a:GameAction)=>{validate(s,a);if(!isS15ExileDeck(s)||isFinalPackDeck(s)&&participant(s,a.playerId).currentFaction==='soi')throw new KernelError('RULE_UNRESOLVED','Exile paired scope required; post-conversion seal not certified');};
 r.register({characterId:93,skillId:S13_SKILLS.exile,ruleId:'S15_CHAR_93_SEAL',ruleVersion:RULESET_VERSION,priority:8,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
 validateSubmission:checkExile,evaluate:(s,a)=>{checkExile(s,a);return [{type:'STATUS',key:S13_STATUS.numb,targetId:a.targetIds[0]!,causeId:a.playerId}];}});

 for(const spec of [{id:72,skill:S13_SKILLS.curse,kind:S13_STATUS.curse,max:undefined},{id:49,skill:S13_SKILLS.illusion,kind:S13_STATUS.illusion,max:2}]){
  const check=(s:GameState,a:GameAction)=>{validate(s,a,spec.max);if(!isS15AuraDeck(s,spec.id))throw new KernelError('RULE_UNRESOLVED','Aura modifier scope not certified');};
  r.register({characterId:spec.id,skillId:spec.skill,ruleId:`S15_CHAR_${spec.id}_AURA_MODIFIER`,ruleVersion:RULESET_VERSION,
   priority:15,phases:['NIGHT_COLLECT'],target:spec.id===49?{min:0,max:0,allowSelf:false,aliveOnly:true}:single,maxUsesPerPhase:1,
   validateSubmission:check,evaluate:(s,a)=>{check(s,a);return [{type:'STATUS',key:spec.kind,targetId:spec.id===49?a.playerId:a.targetIds[0]!,causeId:a.playerId}];}});
 }

 r.register({characterId:11,skillId:S13_SKILLS.maintenance,ruleId:'S13_CHAR_11_MAINTENANCE',ruleVersion:RULESET_VERSION,
  priority:6,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a),evaluate:(s,a)=>{
   validate(s,a);return [{type:'STATUS',key:S13_STATUS.maintenance,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:17,skillId:S13_SKILLS.judgment,ruleId:'S13_CHAR_17_DAY_JUDGMENT',ruleVersion:RULESET_VERSION,
  priority:10,phases:['DAY_DISCUSS'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,1);
   // Only the wolf branch is certified in this pack. The villager outcome requires
   // an authorized room-wide chat mute which this test mode does not yet provide.
   if(participant(s,a.targetIds[0]!).currentFaction==='dan'&&!isS14ChatDeck(s))throw new KernelError('RULE_UNRESOLVED','Judging a villager requires a certified public-chat mute');
  },evaluate:(s,a)=>{
   validate(s,a,1);return [{type:'BLOCK',key:S13_STATUS.judgment,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:16,skillId:S13_SKILLS.poison,ruleId:'S13_CHAR_16_DELAYED_POISON',ruleVersion:RULESET_VERSION,
  priority:15,phases:['NIGHT_COLLECT'],target:{...single,max:2,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a,2),evaluate:(s,a)=>{
   validate(s,a,2);return a.targetIds.map(targetId=>({type:'STATUS' as const,key:S13_STATUS.poison,targetId,causeId:a.playerId}));
  }});
 r.register({characterId:16,skillId:S13_SKILLS.antidote,ruleId:'S13_CHAR_16_ANTIDOTE',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a,2),evaluate:(s,a)=>{
   validate(s,a,2);return [{type:'PROTECTION',key:S13_STATUS.antidote,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:24,skillId:S13_SKILLS.jail,ruleId:'S13_CHAR_24_JAIL',ruleVersion:RULESET_VERSION,
  priority:7,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a),evaluate:(s,a)=>{
   validate(s,a);return [{type:'STATUS',key:S13_STATUS.jail,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:59,skillId:S13_SKILLS.stone,ruleId:'S13_CHAR_59_FIRST_STONE',ruleVersion:RULESET_VERSION,
  priority:20,phases:['DAY_DISCUSS'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{
   validate(s,a);
   if(participant(s,a.targetIds[0]!).effects.some(e=>e.kind===S13_STATUS.stone)&&participant(s,a.playerId).effects.filter(e=>e.kind===S13_STATUS.stoneKill).length>=2)throw new KernelError('RESOURCE_INSUFFICIENT','Two lethal stone uses per match');
  },evaluate:(s,a)=>{
   validate(s,a);const target=participant(s,a.targetIds[0]!);
   const second=target.effects.some(e=>e.kind===S13_STATUS.stone);
   return [{type:second?'DEATH_TRANSITION':'STATUS',key:second?S13_STATUS.stoneKill:S13_STATUS.stone,targetId:target.playerId,causeId:a.playerId}];
  }});
 r.register({characterId:66,skillId:S13_SKILLS.watch,ruleId:'S13_CHAR_66_GUARD',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a,3),evaluate:(s,a)=>{
   validate(s,a,3);return [{type:'PROTECTION',key:S13_STATUS.watch,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:67,skillId:S13_SKILLS.smith,ruleId:'S13_CHAR_67_SHIELD',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a,2),evaluate:(s,a)=>{
   validate(s,a,2);return [{type:'PROTECTION',key:S13_STATUS.smith,targetId:a.targetIds[0]!,causeId:a.playerId}];
  }});
 r.register({characterId:54,skillId:S13_SKILLS.guardShot,ruleId:'S15_CHAR_54_SHOOT',ruleVersion:RULESET_VERSION,
  priority:150,phases:['DAY_DISCUSS'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,1);if(!s15GuardShotReady(s))throw new KernelError('RULE_UNRESOLVED','Guard shooting requires day discussion after first completed vote');},
  evaluate:(s,a)=>{validate(s,a,1);if(!s15GuardShotReady(s))throw new KernelError('RULE_UNRESOLVED','Guard shot scope not certified');return [{type:'DEATH_TRANSITION',key:a.skillId,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 for(const spec of attackSpecs)r.register({characterId:spec.id,skillId:spec.skill,ruleId:`S14_CHAR_${spec.id}_DIRECT_ATTACK`,ruleVersion:RULESET_VERSION,
  priority:150,...(spec.id===23?{cost:{name:SOUL_AMMO,amount:1}}:{}),phases:spec.id===29?['WITCH_WINDOW']:spec.day?['NIGHT_COLLECT','DAY_DISCUSS']:['NIGHT_COLLECT'],target:{...single,allowSelf:false,max:spec.id===15?2:1},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{s14AttackAllowed(s,a);if(spec.id===15&&a.targetIds.length===2&&!isDeepPairDeck(s))throw new KernelError('RULE_UNRESOLVED','Pair scope required');},evaluate:(s,a)=>{s14AttackAllowed(s,a);if(spec.id===15&&a.targetIds.length===2){if(!isDeepPairDeck(s))throw new KernelError('RULE_UNRESOLVED','Pair scope required');return [{type:'LINK_MODIFICATION',key:SECRET_PAIR,targetId:a.targetIds[0]!,causeId:a.playerId}];}return [{type:'DEATH_TRANSITION',key:spec.skill,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 for(const spec of [{id:84,skill:S13_SKILLS.silence},{id:50,skill:S13_SKILLS.numb}])r.register({characterId:spec.id,skillId:spec.skill,ruleId:`S14_CHAR_${spec.id}_PUBLIC_MUTE`,ruleVersion:RULESET_VERSION,
  priority:8,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a);if(!isS14ChatDeck(s)||spec.id===50&&!s14NumbReady(s,a.playerId))throw new KernelError('RULE_UNRESOLVED','Silence scope or cooldown unavailable');},
  evaluate:(s,a)=>{validate(s,a);if(!isS14ChatDeck(s)||spec.id===50&&!s14NumbReady(s,a.playerId))throw new KernelError('RULE_UNRESOLVED','Silence scope or cooldown unavailable');return [{type:'STATUS',key:S13_STATUS.mute,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 for(const spec of [{id:68,skill:S13_SKILLS.youngMark},{id:88,skill:S13_SKILLS.hunterMark}])r.register({characterId:spec.id,skillId:spec.skill,ruleId:`S14_CHAR_${spec.id}_DEATH_MARK`,ruleVersion:RULESET_VERSION,
  priority:5,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a);if(!isS14DeathDeck(s)||(!isHunterFollowDomain(s)&&participant(s,a.targetIds[0]!).currentCharacterId!==25)||spec.id===68&&participant(s,a.playerId).effects.some(e=>e.kind===S13_STATUS.deathMark))throw new KernelError('RULE_UNRESOLVED','Only first mark on seer is supported');},
  evaluate:(s,a)=>{validate(s,a);return [{type:'STATUS',key:S13_STATUS.deathMark,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:80,skillId:S13_SKILLS.violin,ruleId:'S15_CHAR_80_COMPARE',ruleVersion:RULESET_VERSION,
  priority:100,phases:['NIGHT_COLLECT'],target:{min:2,max:2,allowSelf:false,aliveOnly:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a);violinResult(s,a);},evaluate:(s,a)=>[{type:'INFORMATION_RESULT',key:S13_SKILLS.violin,targetId:a.targetIds[0]!,causeId:a.playerId,recipientId:a.playerId,visibility:'PLAYER_PRIVATE',value:violinResult(s,a)}]});
 r.register({characterId:54,skillId:S13_SKILLS.publicReveal,ruleId:'S15_CHAR_54_PUBLIC_REVEAL',ruleVersion:RULESET_VERSION,
  priority:10,phases:['DAY_VOTE_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,1);if(!s15RevealReady(s))throw new KernelError('RULE_UNRESOLVED','Reveal requires a completed first-day vote');},
  evaluate:(s,a)=>{validate(s,a,1);if(!s15RevealReady(s))throw new KernelError('RULE_UNRESOLVED','Reveal requires a completed first-day vote');return [{type:'STATUS',key:S13_SKILLS.publicReveal,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:87,skillId:S13_SKILLS.sedative,ruleId:'S15_CHAR_87_SEDATIVE',ruleVersion:RULESET_VERSION,
  priority:8,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,1);if(!isS15SedativeDeck(s))throw new KernelError('RULE_UNRESOLVED','Sedative QA scope required');},
  evaluate:(s,a)=>{validate(s,a,1);return [{type:'STATUS',key:S13_STATUS.mute,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:36,skillId:S13_SKILLS.mageShield,ruleId:'S15_CHAR_36_SHIELD',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>validate(s,a,1),evaluate:(s,a)=>{
   validate(s,a,1);return [{type:'PROTECTION',key:S13_STATUS.mageShield,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:23,skillId:S13_SKILLS.soulShield,ruleId:'S14_CHAR_23_SHIELD',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:single,maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,1);if(soulDeck(s)&&soulStage(participant(s,a.playerId)))throw new KernelError('RULE_UNRESOLVED','Soul shield only before first death');},evaluate:(s,a)=>{validate(s,a,1);if(soulDeck(s)&&soulStage(participant(s,a.playerId)))throw new KernelError('RULE_UNRESOLVED','Soul shield only before first death');return [{type:'PROTECTION',key:S13_STATUS.soulShield,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:52,skillId:S13_SKILLS.dog,ruleId:'S14_CHAR_52_SOLO_DOG',ruleVersion:RULESET_VERSION,
  priority:25,phases:['NIGHT_COLLECT'],target:{...single,allowSelf:false},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{validate(s,a,2);if(participant(s,a.targetIds[0]!).currentCharacterId!==25)throw new KernelError('RULE_UNRESOLVED','Solo dog restricted to verified target');},
  evaluate:(s,a)=>{validate(s,a,2);return [{type:'PROTECTION',key:S13_STATUS.dog,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 return r;
}
export function applyS13Mechanic(s:GameState,e:Effect,a:GameAction){
 if(a.skillId===DOG_THIEF_SKILL)return applyDogThief(s,e,a);
 if(!isS13Deck(s)||(!a.targetIds.includes(e.targetId)&&!(a.skillId===S13_SKILLS.illusion&&a.targetIds.length===0&&e.targetId===a.playerId))||e.causeId!==a.playerId)
  throw new KernelError('RULE_UNRESOLVED','S13 action provenance or restricted deck mismatch');
 if(a.skillId===SWAP_SKILL&&e.type==='STATUS'&&e.key===SWAP_MARK){placeSwap(s,a);return {type:'S15_BREAK_SWAP_PLACED' as const,targetId:e.targetId,payload:{sourceRule:'VH14'}};}
 if(a.skillId===STONE_SKILL&&e.type==='PROTECTION'&&e.key===STONE_LAYER){placeStone(s,a);return {type:'S15_BREAK_STONE_PLACED' as const,targetId:e.targetId,payload:{sourceRule:'character.json#55'}};}
 if(a.skillId===EXILE_DOLL_SKILL&&e.type==='PROTECTION'&&e.key===EXILE_DOLL){placeEffigy(s,a);return {type:'S15_BREAK_EFFIGY_PLACED' as const,targetId:e.targetId,payload:{sourceRule:'character.json#94'}};}
 if(a.skillId===S13_SKILLS.stone&&e.type==='DEATH_TRANSITION'){
  const target=participant(s,e.targetId),actor=participant(s,a.playerId);
  if(deckKey(s.participants.map(p=>p.initialCharacterId))!=='25,59'||s.phase!=='DAY_RESOLVE'||e.key!==S13_STATUS.stoneKill||!target.effects.some(x=>x.kind===S13_STATUS.stone)||target.currentCharacterId!==25||target.life!=='ALIVE'||target.effects.some(x=>x.kind!==S13_STATUS.stone&&x.kind!==S13_STATUS.used))throw new KernelError('RULE_UNRESOLVED','Unsupported second stone interaction');
  if(actor.effects.filter(x=>x.kind===S13_STATUS.stoneKill).length>=2)throw new KernelError('RESOURCE_INSUFFICIENT','Two lethal stone uses per match');
  actor.effects.push({id:`s14-stone-kill-${a.actionId}`,kind:S13_STATUS.stoneKill,payload:{sourceRule:'character.json#59'}});used(s,a);
  target.life='DEAD_FINAL';target.publicReportedDead=true;
  return {type:'PLAYER_ELIMINATED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};
 }
 if(a.skillId===S13_SKILLS.guardShot){
  validate(s,a,1);const target=participant(s,e.targetId);
  if(!s15GuardShotReady(s)||e.type!=='DEATH_TRANSITION'||e.key!==a.skillId||![25,74].includes(target.currentCharacterId)||target.life!=='ALIVE'||target.effects.some(x=>x.kind!==S13_STATUS.used)||s.links.length)throw new KernelError('RULE_UNRESOLVED','Guard shot target has unverified interaction');
  used(s,a);target.life='DEAD_FINAL';target.publicReportedDead=true;
  return {type:'PLAYER_ELIMINATED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};
 }
 if(a.skillId===S13_SKILLS.demon){
  validate(s,a);const targets=a.targetIds.map(id=>participant(s,id)),same=targets[0]!.currentFaction===targets[1]!.currentFaction,target=participant(s,e.targetId);
  if(same&&e.type==='INFORMATION_RESULT'&&e.recipientId===a.playerId&&e.value===target.currentFaction)return {type:'S15_DEMON_FACTION' as const,targetId:e.targetId,payload:{faction:target.currentFaction}};
  if(same||e.type!=='DEATH_TRANSITION'||target.playerId===a.playerId||target.life!=='ALIVE'||target.effects.length||s.links.length)throw new KernelError('RULE_UNRESOLVED','Unverified demon comparison interaction');
  target.life='DEAD_FINAL';target.publicReportedDead=true;return {type:'PLAYER_ELIMINATED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};
 }
 if(a.skillId===S13_SKILLS.portrait){
  validate(s,a);if(e.type!=='STATUS'||e.key!==S13_STATUS.portrait)throw new KernelError('RULE_UNRESOLVED','Invalid disguise');
  const target=participant(s,e.targetId);if(!target.effects.some(x=>x.kind===S13_STATUS.portrait))target.effects.push({id:`s15-portrait-${a.actionId}`,kind:S13_STATUS.portrait,sourceId:a.playerId,payload:{sourceRule:'VH38,INV-01'}});
  used(s,a);return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:e.targetId,payload:{kind:S13_STATUS.portrait}};
 }
 if(a.skillId===REDIRECT_SKILLS.flag||a.skillId===REDIRECT_SKILLS.hypnosis){
  if(e.type!=='PROTECTION'||e.key!==REDIRECT_MARK)throw new KernelError('RULE_UNRESOLVED','Invalid redirect effect');placeRedirect(s,a);return {type:'S15_DEEP_REDIRECT_PLACED' as const,targetId:e.targetId,payload:{kind:REDIRECT_MARK}};
 }
 if(a.skillId===BELL_SKILL){if(e.type!=='STATUS'||e.key!==BELL_MARK)throw new KernelError('RULE_UNRESOLVED','Invalid bell marker');placeBell(s,a);return {type:'S15_SCALE_BELL_PLACED' as const,targetId:e.targetId,payload:{}};}
 if(isPackBiteSkill(a.skillId)){
  // Each target was validated against the same pre-attack state in evaluate;
  // effects are independent in these protection-free decks. No intervening victory.
  if(!packReady(s,a.playerId)||e.type!=='DEATH_TRANSITION'||e.key!==a.skillId)throw new KernelError('RULE_UNRESOLVED','Invalid wolf bite');
  const target=participant(s,e.targetId);if(target.life!=='ALIVE'||target.currentFaction!=='dan')throw new KernelError('RULE_UNRESOLVED','Invalid bite recipient');
  const layerId=absorbPackProtection(s,target.playerId);if(layerId)return {type:'OFFICIAL_ATTACK_BLOCKED' as const,targetId:target.playerId,payload:{layerId,sourceRules:[s.participants.some(p=>p.currentCharacterId===31)?'character.json#31':'character.json#9',a.skillId===MIRROR_BITE?'character.json#35':'character.json#48']}};
  if(pharmacistWindow(s)){queuePreliminaryDeath(s,target,PACK_BITE_RULE);return {type:'S15_DEEP_PRELIMINARY_QUEUED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};}
  target.life='DEAD_FINAL';target.publicReportedDead=true;if(a.skillId===MIRROR_BITE)recordMirrorBite(s,a,target);return {type:'PLAYER_ELIMINATED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};
 }
 if(a.skillId===PHARMACIST_RESCUE){validate(s,a,1);if(!pharmacistWindow(s)||e.type!=='HEAL'||e.key!==PHARMACIST_RESCUE)throw new KernelError('RULE_UNRESOLVED','Invalid pharmacist rescue');rescuePreliminary(s,participant(s,e.targetId));used(s,a);return {type:'S15_DEEP_RESCUE_APPLIED' as const,targetId:e.targetId,payload:{playerId:e.targetId}};}
 if(a.skillId===WITCH_RESCUE){
  validate(s,a,1);if(e.type!=='HEAL'||e.key!==WITCH_RESCUE)throw new KernelError('RULE_UNRESOLVED','Invalid rescue effect');rescuePreliminary(s,participant(s,e.targetId));used(s,a);return {type:'S15_DEEP_RESCUE_APPLIED' as const,targetId:e.targetId,payload:{playerId:e.targetId}};
 }
 if(a.skillId===S13_SKILLS.darkCupid&&e.type==='LINK_MODIFICATION'&&e.key===SECRET_PAIR){createSecretPair(s,a);used(s,a);return {type:'S15_DEEP_SECRET_PAIR_CREATED' as const,targetId:e.targetId,payload:{kind:SECRET_PAIR}};}
 if(a.skillId===S13_SKILLS.witchPoison&&life02RescueDomain(s)){
  const spec=s14AttackAllowed(s,a);if(s.phase!=='WITCH_WINDOW'||e.type!=='DEATH_TRANSITION'||e.key!==a.skillId||e.targetId!==a.targetIds[0])throw new KernelError('RULE_UNRESOLVED','Invalid LIFE-02 poison provenance');
  used(s,a);queueLife02Attack(s,e.targetId,a.actionId,'S14_CHAR_29_DIRECT_ATTACK');return {type:'S15_DEEP_PRELIMINARY_QUEUED' as const,targetId:e.targetId,payload:{playerId:e.targetId}};
 }
 if(S14_ATTACKS.includes(a.skillId)){
  const spec=s14AttackAllowed(s,a),target=participant(s,e.targetId);
  if(e.type!=='DEATH_TRANSITION'||e.key!==a.skillId||!soulAttackTarget(s,target)||s.links.length&&!bellLinkDomain(s)||target.effects.some(x=>!(bellLinkDomain(s)&&bellLocalEffect(target,x.kind))&&![S13_STATUS.used,S13_STATUS.soulShield,S13_STATUS.smith,S13_STATUS.mageShield].includes(x.kind as typeof S13_STATUS.used)&&!(soulDeck(s)&&x.kind===SOUL_MARK)&&!(liveWitchDomain(s)&&['S15_ENGINEER_TRAP','S15_ENGINEER_TRAP_USED'].includes(x.kind))))
   throw new KernelError('RULE_UNRESOLVED','S14 direct attack has unverified interaction');
  const shields=target.effects.filter(x=>[S13_STATUS.soulShield,S13_STATUS.smith,S13_STATUS.mageShield].some(k=>k===x.kind)&&x.expiresAtRound===s.round&&(s.phase==='NIGHT_RESOLVE'||a.skillId===S13_SKILLS.witchPoison&&s.phase==='WITCH_WINDOW'));
  const defense=selectSingleDefense(shields,()=>true,'Shield stacking order not certified');
  if(a.skillId===S13_SKILLS.darkCupid&&isDeepPairDeck(s))rememberCupid(s,a);
  used(s,a);
  if(defense){consumeDefense(target,defense,true);return {type:'OFFICIAL_ATTACK_BLOCKED' as const,targetId:target.playerId,payload:{sourceRule:spec.source}};}
  if(a.skillId===S13_SKILLS.witchPoison&&isDeepRescueDeck(s)){queuePreliminaryDeath(s,target,'S14_CHAR_29_DIRECT_ATTACK');return {type:'S15_DEEP_PRELIMINARY_QUEUED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};}
  if(soulDeck(s)&&target.currentCharacterId===23){const stage=soulDeath(s,target,a.actionId);return {type:stage==='FIRST'?'PLAYER_ELIMINATED':'SOUL_FINAL_DEATH',targetId:target.playerId,payload:{playerId:target.playerId}};}
  target.life='DEAD_FINAL';target.publicReportedDead=true;
  return {type:'PLAYER_ELIMINATED' as const,targetId:target.playerId,payload:{playerId:target.playerId}};
 }
 if(a.skillId===S13_SKILLS.youngMark||a.skillId===S13_SKILLS.hunterMark){
  const actor=participant(s,a.playerId);
  if(!isS14DeathDeck(s)||e.type!=='STATUS'||e.key!==S13_STATUS.deathMark||(!isHunterFollowDomain(s)&&participant(s,e.targetId).currentCharacterId!==25))throw new KernelError('RULE_UNRESOLVED','Invalid death mark');
  if(a.skillId===S13_SKILLS.youngMark&&actor.effects.some(x=>x.kind===S13_STATUS.deathMark))throw new KernelError('RULE_UNRESOLVED','Wolf re-selection not certified');
  actor.effects=actor.effects.filter(x=>x.kind!==S13_STATUS.deathMark);
  actor.effects.push({id:`s14-death-mark-${a.actionId}`,kind:S13_STATUS.deathMark,payload:{targetId:e.targetId,round:s.round,sourceRule:actor.currentCharacterId===68?'VH36':'character.json#88',...(actor.currentCharacterId===88&&s.ruleVersion==='wolvesville-official-v1.3.3'?{sourcePlayerId:a.playerId,createdPhase:'NIGHT_COLLECT',effectiveRound:s.round,expirationRound:s.round+1,status:'ACTIVE',ruleVersion:s.ruleVersion}: {})}});
  return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:e.targetId,payload:{kind:S13_STATUS.deathMark}};
 }
 if(a.skillId===S13_SKILLS.violin){
  const result=violinResult(s,a);
  if(e.type!=='INFORMATION_RESULT'||e.key!==a.skillId||e.recipientId!==a.playerId||e.value!==result)throw new KernelError('RULE_UNRESOLVED','Invalid violin effect');
  return {type:'S15_VIOLIN_RESULT' as const,targetId:e.targetId,payload:{result}};
 }
 if(a.skillId===S13_SKILLS.publicReveal){
  validate(s,a,1);
  if(!s15RevealReady(s)||e.type!=='STATUS'||e.key!==a.skillId)throw new KernelError('RULE_UNRESOLVED','Invalid public reveal effect');
  const target=participant(s,e.targetId);used(s,a);
  return {type:'S15_PUBLIC_ROLE_REVEALED' as const,targetId:target.playerId,payload:{characterId:target.currentCharacterId}};
 }
 if(a.skillId===S13_SKILLS.exile){
  validate(s,a);if(!isS15ExileDeck(s)||e.type!=='STATUS'||e.key!==S13_STATUS.numb||s.phase!=='NIGHT_RESOLVE')throw new KernelError('RULE_UNRESOLVED','Invalid exile seal');
  const target=participant(s,e.targetId);
  for(const kind of [S13_STATUS.numb,S13_STATUS.mute,S13_STATUS.voteBlock])target.effects.push({id:`s15-exile-${kind}-${a.actionId}`,kind,expiresAtRound:s.round,payload:{sourceRule:'character.json#93'}});
  used(s,a);return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:target.playerId,payload:{kind:S13_STATUS.numb}};
 }
 if(a.skillId===S13_SKILLS.sedative){
  validate(s,a,1);
  if(!isS15SedativeDeck(s)||e.type!=='STATUS'||e.key!==S13_STATUS.mute)throw new KernelError('RULE_UNRESOLVED','Invalid sedative effect');
  const target=participant(s,e.targetId);
  target.effects.push({id:`s15-sedative-mute-${a.actionId}`,kind:S13_STATUS.mute,expiresAtRound:s.round,payload:{sourceRule:'character.json#87,VH57'}});
  target.effects.push({id:`s15-sedative-vote-${a.actionId}`,kind:S13_STATUS.voteBlock,expiresAtRound:s.round,payload:{sourceRule:'character.json#87'}});
  used(s,a);return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:target.playerId,payload:{kind:S13_STATUS.voteBlock}};
 }
 if(a.skillId===S13_SKILLS.silence||a.skillId===S13_SKILLS.numb){
  if(!isS14ChatDeck(s)||e.type!=='STATUS'||e.key!==S13_STATUS.mute)throw new KernelError('RULE_UNRESOLVED','Invalid public mute effect');
  const target=participant(s,e.targetId);
  target.effects.push({id:`s14-mute-${a.actionId}`,kind:S13_STATUS.mute,expiresAtRound:s.round,payload:{sourceRule:'VH57'}});
  if(a.skillId===S13_SKILLS.numb){
   if(!s14NumbReady(s,a.playerId))throw new KernelError('RESOURCE_INSUFFICIENT','Numb cooldown');
   target.effects.push({id:`s14-numb-${a.actionId}`,kind:S13_STATUS.numb,expiresAtRound:s.round,payload:{sourceRule:'character.json#50'}});
  }
  used(s,a);return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:target.playerId,payload:{kind:S13_STATUS.mute}};
 }
 if(a.skillId===S13_SKILLS.curse||a.skillId===S13_SKILLS.illusion){
  const role=a.skillId===S13_SKILLS.curse?72:49,kind=role===72?S13_STATUS.curse:S13_STATUS.illusion;
  validate(s,a,role===49?2:undefined);
  if(!isS15AuraDeck(s,role)||e.type!=='STATUS'||e.key!==kind||s.phase!=='NIGHT_RESOLVE')throw new KernelError('RULE_UNRESOLVED','Invalid aura modifier effect');
  participant(s,e.targetId).effects.push({id:`s15-aura-${a.actionId}`,kind,sourceId:a.playerId,expiresAtRound:s.round,payload:{sourceRule:role===72?'VH39':'VH25'}});
  used(s,a);return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:e.targetId,payload:{kind}};
 }
 const entries:Record<string,{kind:string;type:'STATUS'|'PROTECTION';max?:number;expires:number}>= {
  [S13_SKILLS.trap]:{kind:S13_STATUS.trap,type:'PROTECTION',expires:s.round},
  [S13_SKILLS.judgment]:{kind:S13_STATUS.judgment,type:'STATUS',max:1,expires:s.round},
  [S13_SKILLS.maintenance]:{kind:S13_STATUS.maintenance,type:'STATUS',expires:s.round},
  [S13_SKILLS.poison]:{kind:S13_STATUS.poison,type:'STATUS',max:2,expires:s.round+1},
  [S13_SKILLS.antidote]:{kind:S13_STATUS.antidote,type:'PROTECTION',max:2,expires:s.round},
  [S13_SKILLS.jail]:{kind:S13_STATUS.jail,type:'STATUS',expires:s.round},
  [S13_SKILLS.stone]:{kind:S13_STATUS.stone,type:'STATUS',expires:s.round+1},
  [S13_SKILLS.watch]:{kind:S13_STATUS.watch,type:'PROTECTION',max:3,expires:s.round},
  [S13_SKILLS.smith]:{kind:S13_STATUS.smith,type:'PROTECTION',max:2,expires:s.round},
  [S13_SKILLS.mageShield]:{kind:S13_STATUS.mageShield,type:'PROTECTION',max:1,expires:s.round},
  [S13_SKILLS.soulShield]:{kind:S13_STATUS.soulShield,type:'PROTECTION',max:1,expires:s.round},
  [S13_SKILLS.dog]:{kind:S13_STATUS.dog,type:'PROTECTION',max:2,expires:s.round}
 };
 const spec=entries[a.skillId];
 if(a.skillId===S13_SKILLS.judgment){
  if(e.type!=='BLOCK'||e.key!==S13_STATUS.judgment)throw new KernelError('RULE_UNRESOLVED','Judgment effect mismatch');
  validate(s,a,1);
  const judged=participant(s,e.targetId),priest=participant(s,a.playerId);
  if(judged.currentFaction==='dan'){
   if(!isS14ChatDeck(s)||priest.currentCharacterId!==17||![25,74].includes(judged.currentCharacterId))throw new KernelError('RULE_UNRESOLVED','Villager silence branch not certified');
   priest.effects.push({id:`s14-mute-${a.actionId}`,kind:S13_STATUS.mute,payload:{permanent:true,sourceRule:'character.json#17,VH57'}});used(s,a);
   return {type:'S13_DAY_JUDGMENT_REVEALED' as const,targetId:judged.playerId,payload:{sourcePlayerId:priest.playerId,sourceRole:'Nữ Tu Huyết Thệ',revealedRole:judged.currentCharacterId===25?'Tiên Tri':'Tiên Tri Huyền Bí'}};
  }
  if(priest.currentCharacterId!==17||!['soi','phe3'].includes(judged.currentFaction))throw new KernelError('RULE_UNRESOLVED','Unsupported judgment faction');
  judged.skillLocks.push('*');used(s,a);
  return {type:'S13_DAY_JUDGMENT_REVEALED' as const,targetId:judged.playerId,
   payload:{sourcePlayerId:priest.playerId,sourceRole:'Nữ Tu Huyết Thệ',revealedRole:judged.currentCharacterId===76?'Sói Ác Mộng':'Không xác định'}};
 }
 if(!spec||e.key!==spec.kind||e.type!==spec.type)throw new KernelError('RULE_UNRESOLVED','Invalid S13 skill effect');
 const alreadyCharged=participant(s,a.playerId).effects.some(x=>x.id===`s13-use-${a.actionId}`);
 validate(s,a,alreadyCharged?undefined:spec.max);
 const target=participant(s,e.targetId);
 if(a.skillId===S13_SKILLS.stone&&target.effects.some(x=>x.kind===spec.kind))
  throw new KernelError('RULE_UNRESOLVED','Lethal second stone not implemented');
 target.effects.push({id:a.targetIds.length===1?`s13-${a.actionId}`:`s13-${a.actionId}-${e.targetId}`,kind:spec.kind,sourceId:a.playerId,expiresAtRound:spec.expires,
  payload:{sourceRule:`character.json#${participant(s,a.playerId).currentCharacterId}`,
   startedAtRound:s.round,...(a.skillId===S13_SKILLS.mageShield?{shieldActionId:a.actionId}:{}),...(a.skillId===S13_SKILLS.stone?{dayRound:s.round}:{})}});
 if(!alreadyCharged)used(s,a);
 return {type:'S13_OFFICIAL_EFFECT_APPLIED' as const,targetId:target.playerId,
  payload:{kind:spec.kind,sourceRule:`character.json#${participant(s,a.playerId).currentCharacterId}`}};
}
/** Certified single night attack against #25 only, with one explicit shield.
 * Nothing here decides faction victory or removes a valid death chain. */
export function adjudicateS13Attack(s:GameState,target:Participant):'ABSORBED'|'ELIMINATED'|'TRAP_COUNTER'|'PENDING'{
 if(!isS13AttackDeck(s)||s.phase!=='NIGHT_RESOLVE'||!isCertifiedS13AttackTarget(s,target.playerId)||!soulAttackTarget(s,target)||
 s.participants.some(p=>!['ALIVE','DEAD_FINAL',...(soulDeck(s)?['PENDING_REVIVAL']:[])].includes(p.life)))
  throw new KernelError('RULE_UNRESOLVED','Unsupported S13 lethal interaction');
 if(isFinalHunterDeck(s)&&absorbHunterDomainAttack(s,target.playerId))return 'ABSORBED';
 const kinds=[S13_STATUS.trap,S13_STATUS.antidote,S13_STATUS.jail,S13_STATUS.watch,S13_STATUS.smith,S13_STATUS.dog,S13_STATUS.soulShield,S13_STATUS.mageShield];
 const active=target.effects.filter(e=>kinds.includes(e.kind as typeof kinds[number])&&e.expiresAtRound===s.round);
 const layer=selectSingleDefense(active,()=>true,'Shield stacking order not certified');
 if(layer){
  if(layer.kind===S13_STATUS.trap){
   if(!isS15TrapDeck(s))throw new KernelError('RULE_UNRESOLVED','Trap counter scope');
   const attacker=s.participants.find(p=>p.currentCharacterId===8&&p.life==='ALIVE');
   if(!attacker||attacker.effects.length||attacker.winLinks.length)throw new KernelError('RULE_UNRESOLVED','Unverified counter protection');
   consumeDefense(target,layer,true);attacker.life='DEAD_FINAL';attacker.publicReportedDead=true;return 'TRAP_COUNTER';
  }
  // Prison grants immunity; a one-attack shield is consumed on hit.
  consumeDefense(target,layer,layer.kind!==S13_STATUS.jail);
  return 'ABSORBED';
 }
 if(isDeepRescueDeck(s)){queuePreliminaryDeath(s,target,'OFFICIAL_CHAR_8_NIGHT_KILL');return 'PENDING';}
 if(!soulDeck(s)||target.currentCharacterId!==23){target.life='DEAD_FINAL';target.publicReportedDead=true;}
 return 'ELIMINATED';
}
