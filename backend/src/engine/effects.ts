import type {Effect,GameState} from '../../../shared/contracts/index.js';
import {KernelError,invariant} from '../common/errors.js';
import {participant} from './state.js';
export interface EffectOutcome {type:string;targetId:string;payload:Record<string,unknown>}
// Sandbox-only primitive mechanics: no real character's skill is implemented.
// If an interaction requires a role-specific ruling, this module refuses it.
export function applyFixtureEffect(state:GameState,e:Effect):EffectOutcome {
  const p=participant(state,e.targetId);
  switch(e.type){
    case 'STATUS': {
      invariant(typeof e.key==='string'&&e.key.length>0,'INVALID_ARGUMENT','Invalid status key');
      p.effects.push({id:`fixture-status-${state.revision}-${p.effects.length}`,kind:e.key});
      return {type:'STATUS_APPLIED',targetId:p.playerId,payload:{kind:e.key}};
    }
    case 'BLOCK':{
      const skill=typeof e.key==='string'?e.key:'*';
      if(!p.skillLocks.includes(skill))p.skillLocks.push(skill);
      return {type:'SKILL_LOCKED',targetId:p.playerId,payload:{skill}};
    }
    case 'RESOURCE_MODIFICATION':{
      invariant(typeof e.key==='string'&&typeof e.value==='number'&&Number.isInteger(e.value),'INVALID_ARGUMENT','Invalid resource delta');
      const next=(p.resources[e.key]??0)+e.value;
      invariant(next>=0,'RESOURCE_INSUFFICIENT','Negative resource balance');
      p.resources[e.key]=next;
      return {type:'RESOURCE_CHANGED',targetId:p.playerId,payload:{resource:e.key,balance:next}};
    }
    case 'PROTECTION':{
      // Fixture protection token, not Wolvesville's character-specific shield policy.
      const key='fixture:protection';
      p.resources[key]=(p.resources[key]??0)+1;
      return {type:'PROTECTION_GRANTED',targetId:p.playerId,payload:{token:key}};
    }
    case 'DAMAGE':{
      invariant(p.life==='ALIVE'||p.life==='PROLONGED','RULE_UNRESOLVED','Damage on a non-active life state needs a domain rule');
      const shield=p.resources['fixture:protection']??0;
      if(shield>0){p.resources['fixture:protection']=shield-1;return {type:'DAMAGE_ABSORBED',targetId:p.playerId,payload:{remaining:shield-1}};}
      p.life='PENDING_DEATH';
      return {type:'PRELIMINARY_DEATH',targetId:p.playerId,payload:{life:p.life}};
    }
    case 'HEAL':{
      invariant(p.life==='PENDING_DEATH','RULE_UNRESOLVED','Fixture heal supports preliminary death only');
      p.life='ALIVE';return {type:'PRELIMINARY_DEATH_CURED',targetId:p.playerId,payload:{life:p.life}};
    }
    case 'DEATH_TRANSITION':{
      invariant(p.life==='PENDING_DEATH','RULE_UNRESOLVED','Cannot finalize unconfirmed preliminary death');
      p.life='DEAD_FINAL';p.publicReportedDead=false;
      return {type:'TRUE_DEATH',targetId:p.playerId,payload:{life:p.life}};
    }
    case 'INFORMATION_RESULT':{
      invariant(e.visibility==='PLAYER_PRIVATE'&&!!e.recipientId,'RULE_UNRESOLVED','Fixture information must be player-private');
      return {type:'PRIVATE_INFORMATION',targetId:p.playerId,payload:{observation:e.value??null}};
    }
    default:
      throw new KernelError('RULE_UNRESOLVED',`No confirmed effect policy for ${e.type}`);
  }
}
