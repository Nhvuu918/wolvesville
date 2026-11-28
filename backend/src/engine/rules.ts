import type {Effect,GameAction,GameState,Phase,RandomRecord} from '../../../shared/contracts/index.js';
import {LEGACY_RULESET_VERSION,RULESET_VERSION,APPROVED_RULESET_VERSION} from '../../../shared/contracts/index.js';
import {KernelError,invariant} from '../common/errors.js';
import {draw} from './rng.js';
export interface TargetPolicy { min:number;max:number; allowSelf:boolean; aliveOnly:boolean }
export interface CostPolicy {name:string; amount:number}
export interface RuleContext {readonly ruleVersion:string;readonly ruleIds:string[];random(candidates:string[],reason:string):string}
export interface RuleAdapter {
  skillId:string; ruleId:string; characterId:number|null; ruleVersion:string;
  priority:number; phases:Phase[]; target:TargetPolicy; cost?:CostPolicy;
  maxUsesPerPhase?:number;
  /** Rule-specific eligibility at submission. Rechecked at resolution. */
  validateSubmission?(state:GameState,action:GameAction):void;
  evaluate(state:GameState,action:GameAction,ctx:RuleContext):Effect[];
}
export class RuleRegistry {
  private readonly rules=new Map<string,RuleAdapter>();
  register(adapter:RuleAdapter):void {
    invariant(adapter.skillId.trim()!==''&&adapter.ruleId.trim()!=='','INVALID_ARGUMENT','Empty rule key');
    invariant(!this.rules.has(adapter.skillId),'INVALID_ARGUMENT',`Duplicate rule adapter ${adapter.skillId}`);
    this.rules.set(adapter.skillId,adapter);
  }
  unregister(skillId:string):void { this.rules.delete(skillId); }
  get(skillId:string,version:string):RuleAdapter {
    const rule=this.rules.get(skillId);
    // All other adapters are unchanged; the inspection adapter branches on the archived ruleset.
    if(rule?.ruleVersion===RULESET_VERSION&&(version===LEGACY_RULESET_VERSION||version===APPROVED_RULESET_VERSION))return {...rule,ruleVersion:version};
    if(!rule||rule.ruleVersion!==version) throw new KernelError('RULE_UNRESOLVED',`No confirmed resolver for ${skillId} at ${version}`);
    return rule;
  }
}
export function makeRuleContext(state:GameState,action:GameAction,drawTape:RandomRecord[]):RuleContext {
  return {
    ruleVersion:state.ruleVersion, ruleIds:[],
    random(candidates,reason){
      const r=draw(state.seed,state.gameId,state.randomCursor++,candidates,reason,action.actionId);
      drawTape.push(r);return r.result;
    }
  };
}
