/** Restricted character #76 Sói Ác Mộng active branch.
 * Source character.json#76 + confirmed VH41: two uses per MATCH,
 * target at night; block target's current-night abilities before their
 * accepted actions resolve. No additional immunity is inferred.
 * No extension to generic silence / vote cancellation or team victories.
 */
import type {GameState,GameAction,Effect} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {RuleRegistry} from '../engine/rules.js';
import {isS13Deck,isS13Maintenance} from './s13-mechanics.js';
export const NIGHTMARE_SKILL='official.76.nightmare';
export const NIGHTMARE_RULE='OFFICIAL_CHAR_76_NIGHTMARE';
export const NIGHTMARE_STATUS='OFFICIAL_76_NIGHTMARE_LOCK';
export const NIGHTMARE_USED='OFFICIAL_76_NIGHTMARE_USED';
export function isNightmareDeck(s:GameState):boolean{
 const roles=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');
 return (roles==='25,74,76'||roles==='5,25,76'||(isS13Deck(s)&&['11,25,76','16,25,76','17,25,76','25,39,76'].includes(roles)))&&
  s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.initialFaction===p.currentFaction);
}
export function hasActiveNightmareLock(s:GameState,id:string):boolean{
 return ['NIGHT_COLLECT','NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase)&&
  participant(s,id).effects.some(e=>e.kind===NIGHTMARE_STATUS&&e.expiresAtRound===s.round);
}
function validate(s:GameState,a:GameAction){
 if(!isNightmareDeck(s))throw new KernelError('RULE_UNRESOLVED','Nightmare only supported for closed skill-lock test decks');
 if(participant(s,a.playerId).effects.filter(e=>e.kind===NIGHTMARE_USED).length>=2)
  throw new KernelError('RESOURCE_INSUFFICIENT','Nightmare limited to two uses per match');
}
export function registerOfficialNightmare(r:RuleRegistry):RuleRegistry{
 r.register({characterId:76,skillId:NIGHTMARE_SKILL,ruleId:NIGHTMARE_RULE,ruleVersion:RULESET_VERSION,
  priority:9,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,
  validateSubmission:validate,evaluate:(s,a)=>{validate(s,a);return [{type:'BLOCK',targetId:a.targetIds[0]!,key:NIGHTMARE_RULE,causeId:a.playerId}];}});
 return r;
}
export function applyOfficialNightmare(s:GameState,e:Effect,a:GameAction){
 if(a.skillId!==NIGHTMARE_SKILL||e.type!=='BLOCK'||e.key!==NIGHTMARE_RULE||
    e.targetId!==a.targetIds[0]||e.causeId!==a.playerId)
  throw new KernelError('RULE_UNRESOLVED','Nightmare effect provenance mismatch');
 validate(s,a);
 if(isS13Maintenance(s,e.targetId)){
  const actor=participant(s,a.playerId);
  actor.effects.push({id:`wv76-used-${a.actionId}`,kind:NIGHTMARE_USED,payload:{sourceRule:'VH41',round:s.round}});
  return {type:'OFFICIAL_NIGHTMARE_RESISTED' as const,targetId:e.targetId,payload:{sourceRule:'VH41'}};
 }
 const victim=participant(s,e.targetId),actor=participant(s,a.playerId);
 victim.effects.push({id:`wv76-lock-${a.actionId}`,kind:NIGHTMARE_STATUS,sourceId:a.playerId,
  expiresAtRound:s.round,payload:{sourceRule:'VH41',startedAtRound:s.round}});
 actor.effects.push({id:`wv76-used-${a.actionId}`,kind:NIGHTMARE_USED,payload:{sourceRule:'character.json#76',round:s.round}});
 return {type:'OFFICIAL_NIGHTMARE_APPLIED' as const,targetId:victim.playerId,payload:{sourceRule:'VH41'}};
}
