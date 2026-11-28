import {ownerDc} from '../experimental/owner-dc-policy.js';
import {trapRevivalDomain} from './revival-capability.js';
/** Source-derived revival lifecycle, independent of transport. The bounded capability domain admits #26 with #8 and read-only investigators. No anonymous chat, future-night pending
 * revival or role conversion is inferred. VH73/VH76 override the old village-only
 * text; the fixture-free domain here contains only non-exception roles. */
import {APPROVED_RULESET_VERSION,isApprovedRuleVersion,type GameState,type GameAction,type Effect} from '../../../shared/contracts/index.js';
import {participant} from '../engine/state.js';
import type {RuleRegistry} from '../engine/rules.js';
import {KernelError} from '../common/errors.js';
export const MEDIUM_REVIVE='official.26.revive',REVIVE_RULE='S15_DEEP_CHAR_26_REVIVE',REVIVE_PENDING='S15_DEEP_REVIVE_PENDING',REVIVE_USED='S15_DEEP_MEDIUM_USED';
import {revivalCapabilityReady,revivalDeckIds} from './revival-capability.js';
export {revivalDeckIds};
export const revivalDeck=revivalCapabilityReady;
export function eligibleRevivalTargets(s:GameState,actorId:string):string[]{return s.participants.filter(p=>p.playerId!==actorId&&p.life==='DEAD_FINAL'&&p.publicReportedDead&&![46,47,53].includes(p.currentCharacterId)&&!p.effects.some(e=>e.kind===REVIVE_PENDING)).map(p=>p.playerId);}
export function mediumReady(s:GameState,actorId:string){const a=participant(s,actorId);return revivalDeck(s)&&a.currentCharacterId===26&&!a.effects.some(e=>e.kind===REVIVE_USED)&&eligibleRevivalTargets(s,actorId).length>0;}
function validate(s:GameState,a:GameAction,submitting:boolean){if(!mediumReady(s,a.playerId)||submitting&&participant(s,a.playerId).life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Revival not available in this domain');if(a.targetIds.length!==1||!eligibleRevivalTargets(s,a.playerId).includes(a.targetIds[0]!))throw new KernelError('TARGET_INVALID','Select a previously eliminated eligible participant');}
export function registerMediumRevival(r:RuleRegistry){r.register({characterId:26,skillId:MEDIUM_REVIVE,ruleId:REVIVE_RULE,ruleVersion:APPROVED_RULESET_VERSION,priority:200,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:false},maxUsesPerPhase:1,validateSubmission:(s,a)=>validate(s,a,true),evaluate(s,a){validate(s,a,false);return [{type:'STATUS',key:REVIVE_PENDING,targetId:a.targetIds[0]!,causeId:a.playerId}];}});return r;}
export function applyMediumRevival(s:GameState,e:Effect,a:GameAction){
 validate(s,a,false);
 if(e.type!=='STATUS'||e.key!==REVIVE_PENDING||e.causeId!==a.playerId||e.targetId!==a.targetIds[0]||s.phase!=='NIGHT_RESOLVE')throw new KernelError('RULE_UNRESOLVED','Invalid revival provenance');
 const p=participant(s,e.targetId),actor=participant(s,a.playerId);
 const inverted=ownerDc(s)&&trapRevivalDomain(s)&&actor.effects.some(x=>x.kind==='S15_ENGINEER_TRAP');
 // The accepted, still valid action spends the one revival use. The shared
 // NightActionGroup records and consumes the trap once at night finalization.
 // Inversion never changes the victim's death state or queues a new death.
 if(!inverted)p.effects.push({id:`revive-${a.actionId}`,kind:REVIVE_PENDING,sourceId:a.playerId,payload:{actionId:a.actionId,round:s.round,ruleId:REVIVE_RULE}});
 actor.effects.push({id:`revive-use-${a.actionId}`,kind:REVIVE_USED,payload:{round:s.round}});
 if(inverted)return {type:'REVIVAL_INVERTED_FAILED',targetId:p.playerId,payload:{sourceRules:['DC-TRAP-02','DEC-BT-02','BB-05','BB-PENDING-03','VH73','VH76']}};
 return {type:'REVIVAL_SCHEDULED',targetId:p.playerId,payload:{sourceRules:['VH73','VH76','PH-01']}};
}
/** Commit only at the end of the same night, after all accepted actions settle.
 * Reuses identity, faction and resources; never grants a new role or resource. */
export function finalizeNightRevivals(s:GameState):Array<{playerId:string;actionId:string}>{const pending=s.participants.flatMap(p=>p.effects.filter(e=>e.kind===REVIVE_PENDING).map(e=>({p,e})));if(!pending.length)return [];if(!revivalDeck(s)||s.phase!=='NIGHT_FINALIZE'||pending.length!==1)throw new KernelError('RULE_UNRESOLVED','Unverified revival closure');return pending.map(({p,e})=>{if(p.life!=='DEAD_FINAL'||!p.publicReportedDead||e.payload?.round!==s.round||e.payload?.ruleId!==REVIVE_RULE||typeof e.payload?.actionId!=='string')throw new KernelError('RULE_UNRESOLVED','Invalid pending revival state');p.effects=p.effects.filter(x=>x.id!==e.id);p.life='ALIVE';p.publicReportedDead=false;return {playerId:p.playerId,actionId:String(e.payload.actionId)};});}
