import type {GameState} from '../../../shared/contracts/index.js';
import {isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import type {StoredAction} from '../persistence/sqlite.js';
import type {RuleAdapter} from './rules.js';
export interface PreparedAction {item:StoredAction;rule:RuleAdapter}
// Stable priority key makes resolution independent from request/network arrival.
// This is a technical tie-break for fixtures, NOT a new Wolvesville role priority.
export function orderActions(prepared:PreparedAction[]):PreparedAction[]{
  return [...prepared].sort((a,b)=>a.rule.priority-b.rule.priority ||
    a.item.action.skillId.localeCompare(b.item.action.skillId) ||
    a.item.action.playerId.localeCompare(b.item.action.playerId) ||
    a.item.action.actionId.localeCompare(b.item.action.actionId));
}

// PH-02: pending day actions are not already executed events. Cancellation
// must be resolved first, independent of their ordinary numeric priority.
export function orderResolutionActions(state:GameState,prepared:PreparedAction[]):PreparedAction[]{
 const ordered=orderActions(prepared);
 if(!isApprovedRuleVersion(state.ruleVersion)||state.phase!=='DAY_VOTE_COLLECT'||state.voting?.status!=='OPEN')return ordered;
 const isPeace=(x:PreparedAction)=>x.item.action.skillId==='official.79.cancel-vote-reveal';
 return [...ordered.filter(isPeace),...ordered.filter(x=>!isPeace(x))];
}
export function cancelledByPeace(state:GameState):boolean{
 return isApprovedRuleVersion(state.ruleVersion)&&state.phase==='DAY_VOTE_COLLECT'&&state.voting?.status==='CANCELLED';
}
