import {isModernRuleVersion,isApprovedRuleVersion} from '../../../shared/contracts/index.js';
/** #37/VH14: each pair swaps through the following day. VH15 attack
 * exchange is not enabled here: this restricted deck has no night attacker. */
import {RULESET_VERSION,type GameState,type GameAction} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const SWAP_SKILL='official.37.swap';
export const SWAP_MARK='S15_BREAK_SWAP';
export function isSwapDeck(s:GameState){return isModernRuleVersion(s.ruleVersion)&&(s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='25,28,37'||isApprovedRuleVersion(s.ruleVersion)&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='25,28,37,74')&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function validateSwap(s:GameState,a:GameAction){if(!isSwapDeck(s)||a.targetIds.length!==2||a.targetIds.some(id=>participant(s,id).life!=='ALIVE'))throw new KernelError('RULE_UNRESOLVED','Swap domain/targets unavailable');}
export function placeSwap(s:GameState,a:GameAction){validateSwap(s,a);participant(s,a.playerId).effects.push({id:`swap-${a.actionId}`,kind:SWAP_MARK,payload:{round:s.round,memberIds:[...a.targetIds]},expiresAtRound:s.round+1});}
/** Map once, never recursively reapply the same transposition. Fail closed if
 * a future deck has multiple conflicting swaps or non-living replacement. */
export function swappedTarget(s:GameState,id:string):string{
 if(!isSwapDeck(s))return id;
 const marks=s.participants.flatMap(p=>p.effects.filter(e=>e.kind===SWAP_MARK&&e.payload?.round===s.round));if(marks.length>1)throw new KernelError('RULE_UNRESOLVED','Conflicting swaps');
 const ids=marks[0]?.payload?.memberIds as string[]|undefined;if(!ids?.includes(id))return id;const other=ids.find(x=>x!==id)!;if(participant(s,other).life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Swap replacement is not living');return other;
}
