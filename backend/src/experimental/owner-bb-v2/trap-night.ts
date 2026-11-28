/** Bounded candidate integration with the actual accepted engine action queue.
 * Reuses the published inspection/judgment validators, priorities, evaluation,
 * resource accounting and phase transition. The official archive is not edited.
 * Only the existing engineer/inspection deck is admitted here. */
import type {GameState,RandomRecord} from '../../../../shared/contracts/index.js';
import type {StoredAction} from '../../persistence/sqlite.js';
import {RuleRegistry,makeRuleContext} from '../../engine/rules.js';
import {canResolveAccepted} from '../../engine/validate.js';
import {orderActions} from '../../engine/queue.js';
import {transition,participant} from '../../engine/state.js';
import {registerOfficialInspection} from '../../official/inspection-rules.js';
import {registerOfficialJudgment,applyOfficialJudgment,JUDGMENT_SKILL} from '../../official/judgment-rules.js';
import {registerEngineerTrap,engineerDeck,ENGINEER_TRAP,ENGINEER_MARK} from '../../official/engineer-trap.js';
import {clone} from '../../common/canonical.js';
import {openTraps,placeTrap,type TrapState,type Resolution} from './trap.js';
import {commitCandidateTrapGroup,type CandidateEvent,type CandidateCommit} from './runtime.js';
import type {DeathProofEvent} from '../../official/stable-death-proof.js';
function check(ok:unknown,code:string):asserts ok{if(!ok)throw Error(code);}
export function resolveCandidateTrapNight(original:GameState,queued:readonly StoredAction[],history:readonly DeathProofEvent[]=[],previous?:TrapState){
 check(engineerDeck(original)&&original.phase==='NIGHT_COLLECT'&&!original.participants.some(p=>p.effects.some(e=>e.kind===ENGINEER_MARK)),'CANDIDATE_TRAP_NIGHT_DOMAIN');
 check(queued.every(i=>i.status==='ACCEPTED'&&i.action.round===original.round&&i.action.phase===original.phase&&i.action.gameId===original.gameId&&i.action.ruleVersion===original.ruleVersion)&&new Set(queued.map(i=>i.action.actionId)).size===queued.length,'INVALID_ACCEPTED_QUEUE');
 let work=transition(clone(original),'NIGHT_RESOLVE'),trap=previous??openTraps(work);const events:CandidateEvent[]=[],draws:RandomRecord[]=[];
 const registry=new RuleRegistry();registerOfficialInspection(registry);registerOfficialJudgment(registry);registerEngineerTrap(registry);
 const prepared=orderActions(queued.map(item=>({item,rule:registry.get(item.action.skillId,original.ruleVersion)})));
 // Placement remains before the read-only inspections as in published priority.
 // New placement admission after night one uses candidate state only; the old
 // REST adapter is intentionally unchanged and does not grant it to users.
 for(const {item,rule} of prepared.filter(x=>x.item.action.skillId===ENGINEER_TRAP)){
  const a=item.action;if(canResolveAccepted(work,a,rule)==='LOCKED'){events.push({eventType:'ACTION_CANCELLED',visibility:'SERVER_INTERNAL',payload:{actionId:a.actionId,reason:'SKILL_LOCKED'}});continue;}
  trap=placeTrap(trap,work,a,true);events.push({eventType:'CANDIDATE_TRAP_PLACED',visibility:'SERVER_INTERNAL',payload:{actionId:a.actionId,sourceId:a.playerId,targetId:a.targetIds[0],sourceRules:['DEC-BT-02','BB-05','character.json#10']}});
 }
 const groups=new Map<string,typeof prepared>();for(const x of prepared.filter(x=>x.item.action.skillId!==ENGINEER_TRAP)){const id=x.item.action.playerId;groups.set(id,[...(groups.get(id)??[]),x]);}
 for(const [id,group] of groups){const items:Resolution[]=group.map(({item,rule})=>{const a=item.action;const status=canResolveAccepted(work,a,rule);return {state:clone(work),action:a,status:status==='LOCKED'?'BLOCKED':'EXECUTED',effects:status==='LOCKED'?[]:rule.evaluate(work,a,makeRuleContext(work,a,draws)),acceptedWhileAlive:true};});
  // These official inspection and judgment adapters do not draw base RNG or
  // charge generic resource costs. Fail closed if that contract changes.
  check(draws.length===0&&group.every(x=>!x.rule.cost),'UNSUPPORTED_BASE_COST_OR_RNG');
  const result=commitCandidateTrapGroup(trap,`night-${original.round}-${id}`,items,[...history,...events]);check(!result.pending&&!result.duplicate&&result.commit,'TRAP_GROUP_NOT_COMMITTABLE');trap=result.trap;work=result.commit.state;events.push(...result.commit.events);
  for(const item of items){if(item.status!=='EXECUTED'){events.push({eventType:'ACTION_CANCELLED',visibility:'SERVER_INTERNAL',payload:{actionId:item.action.actionId,reason:'SKILL_LOCKED'}});continue;}
   // #5 judgment is immune but spends one of its two official uses.
   if(item.action.skillId===JUDGMENT_SKILL)for(const e of item.effects)applyOfficialJudgment(work,e,item.action);
   events.push({eventType:'ACTION_RESOLVED',visibility:'SERVER_INTERNAL',payload:{actionId:item.action.actionId}});
  }
 }
 const commit:CandidateCommit={state:work,events,candidateOnly:true,winnerEvaluated:false};return {trap,commit};
}
