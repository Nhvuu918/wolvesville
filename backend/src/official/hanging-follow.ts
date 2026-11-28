import {selectSingleDefense,consumeDefense} from './protection-consumption.js';
import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** #88: death-follow applies both to a lethal attack and an actual hanging.
 * VH03/VH65: settle secondary deaths before victory, and never bypass a
 * protection. Only the listed non-revival compositions are admitted, including
 * the #9 single-layer interaction and #33 direct revenge on a Hunter.
 * No previous-night mark lifetime or competing redirect order is inferred. */
import {RULESET_VERSION,type GameState} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {SNOW_LAYER,protectionLayers} from './support-rules.js';
export const HUNTER_FOLLOW_DECKS=[[8,28,88],[25,28,88],[8,25,28,88],[8,9,28,88]] as const;
export const HUNTER_MARK='S14_DEATH_MARK';
export const HUNTER_CHAIN_RULE='S15_FINAL_HUNTER_FOLLOW';
export function isFinalHunterDeck(s:GameState):boolean {
 const k=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');
 return isModernRuleVersion(s.ruleVersion)&&HUNTER_FOLLOW_DECKS.some(d=>d.join(',')===k)&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);
}
/** Additional all-villager-except-revenge-actor composition; no hidden faction eligibility. */
export const REVENGE_HUNTER_DECK=[25,33,74,88] as const;
export function isRevengeHunterDeck(s:GameState):boolean {
 return isModernRuleVersion(s.ruleVersion)&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')===REVENGE_HUNTER_DECK.join(',')&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);
}
export function isHunterFollowDomain(s:GameState):boolean{return isFinalHunterDeck(s)||isRevengeHunterDeck(s);}
export function assertFinalHunterDomain(s:GameState):void {
 if(!isHunterFollowDomain(s)||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.skillLocks.length||p.effects.some(e=>{
   if(e.kind==='S13_SKILL_USE'||e.kind===HUNTER_MARK&&p.currentCharacterId===88)return false;
   if(isRevengeHunterDeck(s)&&p.currentCharacterId===33&&['OFFICIAL_33_FORCE_VOTE_USED','S15_FINAL_REVENGE_PENDING'].includes(e.kind))return false;
   if(e.kind==='OFFICIAL_9_USED_TARGET'&&p.currentCharacterId===9)return false;
   if(e.kind===SNOW_LAYER)return !s.participants.some(src=>src.playerId===e.sourceId&&src.currentCharacterId===9)||!Number.isInteger(e.payload?.startedAtRound)||e.expiresAtRound!==Number(e.payload?.startedAtRound)+1;
   return true;
  })))throw new KernelError('RULE_UNRESOLVED','Unverified hunter follow interaction');
}
/** Reusable single-layer interception. #9 explicitly protects in the night;
 * VH65 permits valid protection against death-follow. No daytime shield grant.
 * Unknown/stacked layers stay fail-closed. Owner death does not cancel #9. */
export function absorbHunterDomainAttack(s:GameState,targetId:string):string|undefined {
 assertFinalHunterDomain(s);
 if(s.phase!=='NIGHT_RESOLVE')return undefined;
 const layer=selectSingleDefense(protectionLayers(s,targetId),l=>l.kind===SNOW_LAYER,'Unverified hunter protection ordering');
 return layer?consumeDefense(participant(s,targetId),layer,true):undefined;
}
export function resolveFinalHunterFollow(s:GameState,victimId:string):{secondaryId?:string;blockedTargetId?:string;layerId?:string;sourceRules:string[]} {
 assertFinalHunterDomain(s);
 if(!['DAY_RESOLVE','NIGHT_RESOLVE'].includes(s.phase))throw new KernelError('OUT_OF_PHASE','Hunter follow requires committed death resolution');
 const victim=participant(s,victimId),sourceRules=['character.json#88','VH03','VH65'];
 if(victim.life!=='DEAD_FINAL'||!victim.publicReportedDead)throw new KernelError('RULE_UNRESOLVED','Primary death not committed');
 if(victim.currentCharacterId!==88)return {sourceRules:[`character.json#${victim.currentCharacterId}`,'VH03']};
 const marks=victim.effects.filter(e=>e.kind===HUNTER_MARK);
 if(!marks.length)return {sourceRules};
 if(marks.length!==1||marks[0]!.payload?.round!==s.round)throw new KernelError('RULE_UNRESOLVED','Hunter prior-night or conflicting mark not certified');
 const target=participant(s,String(marks[0]!.payload?.targetId));
 if(target.playerId===victimId)throw new KernelError('RULE_UNRESOLVED','Self death-follow invalid');
 if(target.life==='DEAD_FINAL')return {sourceRules};
 if(target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Secondary death not eligible');
 const layerId=absorbHunterDomainAttack(s,target.playerId);
 if(layerId)return {blockedTargetId:target.playerId,layerId,sourceRules:[...sourceRules,'character.json#9']};
 target.life='DEAD_FINAL';target.publicReportedDead=true;
 return {secondaryId:target.playerId,sourceRules};
}
export function canContinueFinalHunter(s:GameState):boolean {
 const alive=s.participants.filter(p=>p.life==='ALIVE');
 return alive.length>1&&alive.some(p=>[8,28].includes(p.currentCharacterId));
}
