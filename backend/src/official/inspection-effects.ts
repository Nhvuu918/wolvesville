import {groupedNight} from '../experimental/owner-bb-v2/night-action-group.js';
import {recordMirrorScan} from './mirror-investigation.js';
import {engineerDistorts,engineerFalseRoleDomain,invertEngineerAura} from './engineer-trap.js';
import {KernelError} from '../common/errors.js';
import type {Effect,GameAction,GameState} from '../../../shared/contracts/index.js';
import type {EffectOutcome} from '../engine/effects.js';
import {isAuraSeer,officialSeerAura,officialInspectedRole,SEER_AURA_RULE,isConvertedVillagerObservation,VILLAGER_ROLE_RESULT} from './inspection-rules.js';
/** Distinct, versioned inspection outcomes. */
export function applyOfficialInspection(state:GameState,e:Effect,a:GameAction):EffectOutcome{
 if(e.type!=='INFORMATION_RESULT'||e.visibility!=='PLAYER_PRIVATE'||e.recipientId!==a.playerId||e.targetId!==a.targetIds[0])
  throw new KernelError('RULE_UNRESOLVED','Invalid official inspection effect contract');
 if(isAuraSeer(state,a.skillId)){
  const actualAura=officialSeerAura(state,e.targetId);
  const verdict=engineerDistorts(state,a.playerId)?invertEngineerAura(actualAura,groupedNight(state)):actualAura;
  if(e.key!==SEER_AURA_RULE||e.value!==verdict)throw new KernelError('RULE_UNRESOLVED','Seer aura must be resolved by the server');
  recordMirrorScan(state,a,e.targetId);
  return {type:'SEER_AURA_OBSERVED',targetId:e.targetId,payload:{verdict,sourceRule:SEER_AURA_RULE}};
 }
 if(isConvertedVillagerObservation(state,e.targetId)){
  if(e.key!==VILLAGER_ROLE_RESULT||e.value!=='Dân thường'||engineerDistorts(state,a.playerId))throw new KernelError('RULE_UNRESOLVED','Invalid converted role observation');
  return {type:'ROLE_OBSERVED',targetId:e.targetId,payload:{roleName:'Dân thường',skillId:a.skillId}};
 }
 if(e.key===VILLAGER_ROLE_RESULT)throw new KernelError('RULE_UNRESOLVED','Unexpected converted role observation');
 const actual=officialInspectedRole(state,e.targetId);
 const distorted=engineerDistorts(state,a.playerId);
 if(distorted?typeof e.value!=='number'||!engineerFalseRoleDomain(state,actual).includes(String(e.value)):e.value!==actual)throw new KernelError('RULE_UNRESOLVED','Invalid server observation domain');
 return {type:'ROLE_OBSERVED',targetId:e.targetId,payload:{characterId:e.value,skillId:a.skillId}};
}
