import {soulDeck,soulAttackTarget,soulBlindKnightIntent,SOUL_SHOT} from '../official/soul-shooter.js';
import {canRevenge} from '../official/post-hanging-revenge.js';
import type {GameAction,GameState,AcceptedAction} from '../../../shared/contracts/index.js';
import type {RuleAdapter} from './rules.js';
import {participant} from './state.js';
import {invariant,KernelError} from '../common/errors.js';
import {hasActiveSoiGaiDocInjury} from '../official/reactive-rules.js';
import {hasActiveNightWalkLock} from '../official/support-rules.js';
import {hasActiveNightmareLock} from '../official/nightmare-rules.js';
import {isS13SkillBlocked,isS13Maintenance} from '../official/s13-mechanics.js';

import {canWitchActWhilePending} from '../official/preliminary-death.js';
const ACCEPTING=['NIGHT_COLLECT','DAY_DISCUSS','DAY_VOTE_COLLECT','WITCH_WINDOW'];
export function validateAction(state:GameState,a:GameAction,rule:RuleAdapter,reserved=0,alreadyUsed=0):AcceptedAction {
  invariant(!state.completed,'GAME_COMPLETED','Match already complete');
  invariant(a.gameId===state.gameId&&a.ruleVersion===state.ruleVersion,'INVALID_ARGUMENT','Game or ruleset version mismatch');
  invariant(typeof a.actionId==='string'&&a.actionId.length>0&&a.actionId.length<=128,'INVALID_ARGUMENT','Invalid actionId');
  invariant(typeof a.idempotencyKey==='string'&&a.idempotencyKey.length>0&&a.idempotencyKey.length<=128,'INVALID_ARGUMENT','Missing idempotency key');
  invariant(a.payload!==null && typeof a.payload==='object' && !Array.isArray(a.payload),'INVALID_ARGUMENT','Action payload must be an object');
  invariant(Number.isFinite(a.timestamp) && a.timestamp>=0,'INVALID_ARGUMENT','Timestamp must be numeric');
  invariant(a.phase===state.phase&&a.round===state.round,'OUT_OF_PHASE','Stale phase/round');
  invariant(ACCEPTING.includes(state.phase)||canRevenge(state,a.playerId,a.skillId),'PHASE_CLOSED','This phase does not accept actions');
  invariant(rule.phases.includes(state.phase),'OUT_OF_PHASE','Skill not active in this phase');
  const actor=participant(state,a.playerId);
  invariant(actor.life==='ALIVE'||actor.life==='PROLONGED'||canWitchActWhilePending(state,a.playerId,a.skillId)||canRevenge(state,a.playerId,a.skillId),'UNAUTHORIZED','Actor cannot submit while dead/hibernating');
  invariant(rule.characterId===null||rule.characterId===actor.currentCharacterId,'UNAUTHORIZED','Actor lacks this skill');
  invariant(!actor.skillLocks.includes(rule.skillId)&&!actor.skillLocks.includes('*')&&!hasActiveSoiGaiDocInjury(state,a.playerId)&&!hasActiveNightWalkLock(state,a.playerId)&&(!hasActiveNightmareLock(state,a.playerId)||isS13Maintenance(state,a.playerId))&&!isS13SkillBlocked(state,a.playerId),'SKILL_LOCKED','Skill is locked');
  invariant(Array.isArray(a.targetIds) && a.targetIds.length>=rule.target.min&&a.targetIds.length<=rule.target.max,'TARGET_INVALID','Wrong target count');
  invariant(new Set(a.targetIds).size===a.targetIds.length,'TARGET_INVALID','Duplicated target');
  for(const target of a.targetIds){
    invariant(typeof target==='string','TARGET_INVALID','Invalid target ID');
    const found=state.participants.find(p=>p.playerId===target);
    invariant(!!found,'TARGET_INVALID','Target does not participate in match');
    invariant(rule.target.allowSelf||target!==a.playerId,'TARGET_INVALID','Self targeting forbidden');
    invariant(!rule.target.aliveOnly||soulBlindKnightIntent(state,a.skillId,found)||(found.life==='ALIVE'||found.life==='PROLONGED')&&(!soulDeck(state)||!found.publicReportedDead),'TARGET_INVALID','Target is not a living eligible participant');
  }
  if(rule.maxUsesPerPhase!==undefined){
    invariant(alreadyUsed<rule.maxUsesPerPhase,'RESOURCE_INSUFFICIENT','Skill phase usage limit');
  }
  if(rule.cost){
    invariant(Number.isInteger(rule.cost.amount)&&rule.cost.amount>=0,'INVALID_ARGUMENT','Invalid adapter cost');
    invariant((actor.resources[rule.cost.name]??0)-reserved>=rule.cost.amount,'RESOURCE_INSUFFICIENT','Insufficient unreserved resources');
  }
  return {action:a,status:'ACCEPTED',costName:rule.cost?.name,costAmount:rule.cost?.amount};
}
// Recheck only conditions that can legitimately change: lock, target existence,
// current-target eligibility. Actor's later death does NOT invalidate accepted
// action, per PH-01. Target changed status is explicit rule adapter responsibility.
export function canResolveAccepted(state:GameState,a:GameAction,rule:RuleAdapter):'OK'|'LOCKED' {
  const actor=participant(state,a.playerId);
  if(actor.skillLocks.includes('*')||actor.skillLocks.includes(a.skillId)||hasActiveSoiGaiDocInjury(state,a.playerId)||(!isS13Maintenance(state,a.playerId)&&(hasActiveNightWalkLock(state,a.playerId)||hasActiveNightmareLock(state,a.playerId)))||isS13SkillBlocked(state,a.playerId))return 'LOCKED';
  if(rule.target.aliveOnly && a.targetIds.some(id=>{const target=participant(state,id);return !soulBlindKnightIntent(state,a.skillId,target)&&target.life!=='ALIVE'&&target.life!=='PROLONGED'&&!(soulDeck(state)&&['official.8.night-kill','official.36.fireball',SOUL_SHOT].includes(a.skillId)&&soulAttackTarget(state,target));})) {
    throw new KernelError('RULE_UNRESOLVED','TARGET_STATUS_CHANGED_WHILE_QUEUED: requires a character-specific rule');
  }
  if(rule.characterId!==null && actor.currentCharacterId!==rule.characterId) {
    // Changed role during this phase may require a special business ruling.
    // Do not silently grant an old skill or remove it.
    throw new KernelError('RULE_UNRESOLVED','ROLE_CHANGED_WHILE_QUEUED');
  }
  return 'OK';
}
