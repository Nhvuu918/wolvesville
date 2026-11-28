import {isFinalRevengeDeck} from './post-hanging-revenge.js';
/** Official #33 one-use daylight coercion, source character.json#33.
 * Bound to exact [25,33,74] deck, with no overlapping controls/invalidations.
 * This implements a vote transformation, NEVER a generic execution policy.
 */
import type {GameState,GameAction,Effect} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {RuleRegistry} from '../engine/rules.js';
export const VOTE_CONTROL_SKILL='official.33.force-vote';
export const VOTE_CONTROL_RULE='OFFICIAL_CHAR_33_VOTE_COERCION';
export const VOTE_CONTROL_USED='OFFICIAL_33_FORCE_VOTE_USED';
export function isVerifiedVoteControlDeck(s:GameState):boolean {
 const chars=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b);
 return isFinalRevengeDeck(s)||JSON.stringify(chars)===JSON.stringify([25,33,74]) &&
  s.participants.every(p=>p.initialCharacterId===p.currentCharacterId);
}
export function registerOfficialVoteControl(r:RuleRegistry){
 r.register({skillId:VOTE_CONTROL_SKILL,ruleId:VOTE_CONTROL_RULE,characterId:33,
  ruleVersion:RULESET_VERSION,priority:4,phases:['DAY_VOTE_COLLECT'],
  target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{
   if(!isVerifiedVoteControlDeck(s)||s.voting?.status!=='OPEN'||s.voting.round!==s.round)
    throw new KernelError('RULE_UNRESOLVED','Outside certified isolated vote-control deck');
   if(participant(s,a.playerId).effects.some(e=>e.kind===VOTE_CONTROL_USED))
    throw new KernelError('RESOURCE_INSUFFICIENT','Vote coercion already consumed');
  },evaluate:(s,a):Effect[]=>{
   if(!isVerifiedVoteControlDeck(s)||s.voting?.status!=='OPEN'||participant(s,a.playerId).effects.some(e=>e.kind===VOTE_CONTROL_USED))
    throw new KernelError('RULE_UNRESOLVED','Unverified vote-control state');
   return [{type:'STATUS',targetId:a.targetIds[0]!,key:VOTE_CONTROL_RULE}];
  }});
 return r;
}
export function applyOfficialVoteControl(s:GameState,e:Effect,a:GameAction){
 if(a.skillId!==VOTE_CONTROL_SKILL||e.type!=='STATUS'||e.key!==VOTE_CONTROL_RULE||
  e.targetId!==a.targetIds[0]||!isVerifiedVoteControlDeck(s)||s.voting?.status!=='OPEN')
  throw new KernelError('RULE_UNRESOLVED','Unsupported coerced-vote provenance');
 const actor=participant(s,a.playerId);participant(s,e.targetId);
 if(actor.currentCharacterId!==33||actor.effects.some(x=>x.kind===VOTE_CONTROL_USED)||
  s.voting.directives?.some(d=>d.voterId===e.targetId))
  throw new KernelError('RULE_UNRESOLVED','Conflicting or reused vote directive');
 actor.effects.push({id:`wv33-used-${a.actionId}`,kind:VOTE_CONTROL_USED,payload:{sourceRule:'character.json#33'}});
 s.voting.directives??=[];
 s.voting.directives.push({voterId:e.targetId,controllerId:a.playerId,sourceActionId:a.actionId,ruleId:VOTE_CONTROL_RULE});
 return {type:'VOTE_CONTROL_SCHEDULED' as const,targetId:e.targetId,
  payload:{ruleId:VOTE_CONTROL_RULE,round:s.round}};
}
