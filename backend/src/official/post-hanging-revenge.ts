import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** #33 Báo thù, VH03/VH65. A deliberately narrow domain with no hidden
 * faction choice: composition contains exactly one wolf (#33) and three
 * villagers. Mixed-faction choice and protective precedence are not inferred. */
import {RULESET_VERSION,isApprovedRuleVersion,type GameState,type GameAction} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {isRevengeHunterDeck,HUNTER_MARK} from './hanging-follow.js';
export const REVENGE_SKILL='official.33.hanging-revenge';
export const REVENGE_SKIP='official.33.hanging-revenge-skip';
export const REVENGE_PENDING='S15_FINAL_REVENGE_PENDING';
export const REVENGE_DECK=[25,33,74,84] as const;
export const APPROVED_MIXED_REVENGE_DECK=[25,28,33,74] as const;
export function isFinalRevengeDeck(s:GameState):boolean{
 return isRevengeHunterDeck(s)||isModernRuleVersion(s.ruleVersion)&&(s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')===REVENGE_DECK.join(',')||isApprovedRuleVersion(s.ruleVersion)&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')===APPROVED_MIXED_REVENGE_DECK.join(','))&&!s.links.length&&s.participants.every(p=>p.currentFaction===p.initialFaction&&p.currentCharacterId===p.initialCharacterId&&!p.winLinks.length);
}
export function canRevenge(s:GameState,id:string,skill:string):boolean {
 if(!isFinalRevengeDeck(s)||![REVENGE_SKILL,REVENGE_SKIP].includes(skill)||s.phase!=='DAY_RESOLVE'||s.resolutionGate?.status!=='PENDING_EFFECT'||s.voting?.outcome?.kind!=='HANGING_COMPLETED'||s.voting.outcome.targetId!==id)return false;
 const p=participant(s,id);return p.currentCharacterId===33&&p.life==='DEAD_FINAL'&&p.publicReportedDead&&p.effects.some(e=>e.kind===REVENGE_PENDING&&e.payload?.round===s.round);
}
export function assertRevengeDomain(s:GameState):void{
 if(!isFinalRevengeDeck(s)||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.winLinks.length||p.skillLocks.length||p.effects.some(e=>!['S13_SKILL_USE','S14_PUBLIC_MUTE','OFFICIAL_33_FORCE_VOTE_USED',REVENGE_PENDING].includes(e.kind)&&!(isRevengeHunterDeck(s)&&p.currentCharacterId===88&&e.kind===HUNTER_MARK))))throw new KernelError('RULE_UNRESOLVED','Unverified revenge protection or status');
}
export function validateRevenge(s:GameState,a:GameAction):void {
 assertRevengeDomain(s);
 if(!canRevenge(s,a.playerId,a.skillId)||a.targetIds.length!==(a.skillId===REVENGE_SKILL?1:0))throw new KernelError('RULE_UNRESOLVED','No pending revenge choice');
 if(a.targetIds.length){const p=participant(s,a.targetIds[0]!);if((!isApprovedRuleVersion(s.ruleVersion)&&p.currentFaction!=='dan')||p.life!=='ALIVE'||p.playerId===a.playerId)throw new KernelError('TARGET_INVALID','Invalid revenge target');}
}
export function settleRevenge(s:GameState,a:GameAction):string|undefined{
 validateRevenge(s,a);const actor=participant(s,a.playerId);actor.effects=actor.effects.filter(e=>e.kind!==REVENGE_PENDING);
 if(!a.targetIds.length)return undefined;
 const victim=participant(s,a.targetIds[0]!);if(isApprovedRuleVersion(s.ruleVersion)&&victim.currentFaction!=='dan')return undefined;victim.life='DEAD_FINAL';victim.publicReportedDead=true;return victim.playerId;
}
