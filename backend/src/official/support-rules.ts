/** Official abilities limited to the five-seat #9/#25/#31/#34/#74 test deck.
 * Source: character.json#9/#31/#34, VH08, VH10, VH24, PH-01.
 * This module records protected layers; it DOES NOT adjudicate attacks. No victory predicate.
 */
import {KernelError} from '../common/errors.js';
import type {GameState,GameAction,Effect} from '../../../shared/contracts/index.js';
import type {RuleAdapter} from '../engine/rules.js';
import {RuleRegistry} from '../engine/rules.js';
import {participant} from '../engine/state.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
export const SUPPORT_IDS=[9,31,34] as const;
export const SUPPORT_SKILLS={
  9:'official.9.snow-protection',31:'official.31.guard',34:'official.34.night-block'
} as const;
export const NIGHT_LOCK='OFFICIAL_34_NIGHT_BLOCK';
export const GUARD_LAYER='OFFICIAL_31_GUARD';
export const SNOW_LAYER='OFFICIAL_9_SNOW_PROTECTION';
const GUARD_HISTORY='OFFICIAL_31_LAST_GUARD';
const SNOW_HISTORY='OFFICIAL_9_USED_TARGET';
// VH24 names exactly Tiên Tri (#25), Bảo Vệ (#31). Do not extend to #74.
export const NIGHT_WALKER_IMMUNE_IDS=new Set([25,31]);
export function hasActiveNightWalkLock(s:GameState,playerId:string):boolean {
  return participant(s,playerId).effects.some(e=>e.kind===NIGHT_LOCK&&e.expiresAtRound===s.round&&
    (s.phase==='NIGHT_COLLECT'||s.phase==='NIGHT_RESOLVE'||s.phase==='WITCH_WINDOW'));
}
/** Server-only source-of-truth defense layer inventory; not a rule for stacking/absorbing. */
export function protectionLayers(s:GameState,playerId:string){
  return participant(s,playerId).effects.filter(e=>(e.kind===GUARD_LAYER||e.kind===SNOW_LAYER)&&
    e.payload?.startedAtRound!==undefined&&Number(e.payload.startedAtRound)<=s.round&&
    (e.expiresAtRound??-1)>=s.round&&s.phase.startsWith('NIGHT'));
}
/** A #31 layer remains active through the witch window. The caller chooses
 * whether the attack class is covered by this rule; no global immunity. */
export function activeGuardProtection(s:GameState,playerId:string){
 if(!['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase))return undefined;
 return participant(s,playerId).effects.find(e=>e.kind===GUARD_LAYER&&e.payload?.startedAtRound===s.round&&e.expiresAtRound===s.round&&s.participants.some(p=>p.playerId===e.sourceId&&p.currentCharacterId===31));
}
export function registerOfficialSupport(registry:RuleRegistry):RuleRegistry{
 const config:RuleAdapter[]=[
  {
   ruleId:'OFFICIAL_CHAR_34_NIGHT_WALK',skillId:SUPPORT_SKILLS[34],characterId:34,ruleVersion:RULESET_VERSION,
   // Dependency-directed block before queued skills; VH08/VH10. Numeric value technical, not universal role priority.
   priority:10,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,
   evaluate:(s,a)=>{
    const t=participant(s,a.targetIds[0]);
    if(t.currentFaction!=='dan'||NIGHT_WALKER_IMMUNE_IDS.has(t.currentCharacterId))return [];
    return [{type:'BLOCK',targetId:t.playerId,key:NIGHT_LOCK,causeId:a.playerId}];
   }
  },
  {
   ruleId:'OFFICIAL_CHAR_31_GUARD',skillId:SUPPORT_SKILLS[31],characterId:31,ruleVersion:RULESET_VERSION,
   priority:30,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,
   validateSubmission:(s,a)=>assertGuardTarget(s,a),
   evaluate:(s,a)=>{assertGuardTarget(s,a);return [{type:'PROTECTION',targetId:a.targetIds[0],key:GUARD_LAYER,causeId:a.playerId}];}
  },
  {
   ruleId:'OFFICIAL_CHAR_9_SNOW_PROTECTION',skillId:SUPPORT_SKILLS[9],characterId:9,ruleVersion:RULESET_VERSION,
   priority:30,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,
   validateSubmission:(s,a)=>assertSnowTarget(s,a),
   evaluate:(s,a)=>{assertSnowTarget(s,a);return [{type:'PROTECTION',targetId:a.targetIds[0],key:SNOW_LAYER,causeId:a.playerId}];}
  }
 ];
 config.forEach(x=>registry.register(x));return registry;
}
export function applyOfficialSupport(s:GameState,e:Effect,a:GameAction):{type:string;targetId:string;payload:Record<string,unknown>}{
 if(e.targetId!==a.targetIds[0]||e.causeId!==a.playerId)throw new KernelError('RULE_UNRESOLVED','Support effect provenance mismatch');
 const t=participant(s,e.targetId),actor=participant(s,a.playerId);
 if(e.type==='BLOCK'&&a.skillId===SUPPORT_SKILLS[34]&&e.key===NIGHT_LOCK){
  if(t.currentFaction!=='dan'||NIGHT_WALKER_IMMUNE_IDS.has(t.currentCharacterId))throw new KernelError('RULE_UNRESOLVED','Invalid night lock target');
  t.effects.push({id:`wv34-${a.actionId}`,kind:NIGHT_LOCK,sourceId:a.playerId,expiresAtRound:s.round,
   payload:{sourceRule:'VH10',startedAtRound:s.round}});
  return {type:'OFFICIAL_NIGHT_LOCK_APPLIED',targetId:t.playerId,payload:{sourceRule:'VH10'}};
 }
 if(e.type==='PROTECTION'&&a.skillId===SUPPORT_SKILLS[31]&&e.key===GUARD_LAYER){
  t.effects.push({id:`wv31-layer-${a.actionId}`,kind:GUARD_LAYER,sourceId:a.playerId,expiresAtRound:s.round,
   payload:{startedAtRound:s.round,provenanceRule:'CHARACTER_31'}});
  actor.effects.push({id:`wv31-last-${a.actionId}`,kind:GUARD_HISTORY,expiresAtRound:s.round,
   payload:{targetId:t.playerId}});
  return {type:'OFFICIAL_PROTECTION_RECORDED',targetId:t.playerId,payload:{sourceRule:'CHARACTER_31'}};
 }
 if(e.type==='PROTECTION'&&a.skillId===SUPPORT_SKILLS[9]&&e.key===SNOW_LAYER){
  t.effects.push({id:`wv9-layer-${a.actionId}`,kind:SNOW_LAYER,sourceId:a.playerId,expiresAtRound:s.round+1,
   payload:{startedAtRound:s.round,provenanceRule:'CHARACTER_9'}});
  actor.effects.push({id:`wv9-used-${a.actionId}`,kind:SNOW_HISTORY,payload:{targetId:t.playerId}});
  return {type:'OFFICIAL_PROTECTION_RECORDED',targetId:t.playerId,payload:{sourceRule:'CHARACTER_9'}};
 }
 throw new KernelError('RULE_UNRESOLVED','Unsupported official support effect');
}

/** Actor-local history only. Never exposes the target's private role, faction or
 * protection from another actor. Same predicate feeds validation and own UI. */
function protectionHistoryError(s:GameState,actorId:string,skillId:string,targetId:string|undefined):{code:'TARGET_INVALID'|'RESOURCE_INSUFFICIENT';message:string}|undefined {
 const actor=participant(s,actorId);
 if(skillId===SUPPORT_SKILLS[31]&&actor.effects.some(e=>e.kind===GUARD_HISTORY&&e.payload?.targetId===targetId&&e.expiresAtRound===s.round-1))return {code:'TARGET_INVALID',message:'Guard cannot target the same player on consecutive nights'};
 if(skillId===SUPPORT_SKILLS[9]){
  const used=actor.effects.filter(e=>e.kind===SNOW_HISTORY);
  if(used.length>=3)return {code:'RESOURCE_INSUFFICIENT',message:'Snow Angel has already protected three different people'};
  if(used.some(e=>e.payload?.targetId===targetId))return {code:'TARGET_INVALID',message:'Snow Angel cannot protect the same player twice'};
 }
}
export function protectionSelection(s:GameState,actorId:string,skillId:string):{eligibleTargetIds:string[];remainingUses?:number}|undefined {
 if(skillId!==SUPPORT_SKILLS[9]&&skillId!==SUPPORT_SKILLS[31])return undefined;
 const actor=participant(s,actorId);
 if(actor.currentCharacterId!==(skillId===SUPPORT_SKILLS[9]?9:31))return undefined;
 const eligibleTargetIds=s.participants.filter(p=>!p.publicReportedDead&&!protectionHistoryError(s,actorId,skillId,p.playerId)).map(p=>p.playerId);
 return {eligibleTargetIds,...(skillId===SUPPORT_SKILLS[9]?{remainingUses:Math.max(0,3-actor.effects.filter(e=>e.kind===SNOW_HISTORY).length)}:{})};
}
function assertGuardTarget(s:GameState,a:GameAction):void{
 const error=protectionHistoryError(s,a.playerId,SUPPORT_SKILLS[31],a.targetIds[0]);if(error)throw new KernelError(error.code,error.message);
}
function assertSnowTarget(s:GameState,a:GameAction):void{
 const error=protectionHistoryError(s,a.playerId,SUPPORT_SKILLS[9],a.targetIds[0]);if(error)throw new KernelError(error.code,error.message);
}
