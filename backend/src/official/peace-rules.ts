/** Sói Hòa Bình #79 — restricted closed-deck implementation.
 * Sources: character.json#79 + PH-02, Q13-09; action once per match.
 * Only the {25,74,79} deck is enabled. Thus the only wolf recipient is #79.
 * No generic voting/hanging logic, no application to other characters or spectator ACL.
 */
import type {GameState,GameAction,Effect} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {RuleRegistry} from '../engine/rules.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {isDeepJesterDeck} from './deep-links.js';
import {resolveCertifiedCancellation} from '../engine/vote-adjudicator.js';
export const PEACE_WOLF_ID=79;
export const PEACE_SKILL='official.79.cancel-vote-reveal';
export const PEACE_USED='OFFICIAL_79_USED_ONCE';
export const PEACE_RULE='OFFICIAL_CHAR_79_PEACE_WOLF';
export function registerOfficialPeace(registry:RuleRegistry):RuleRegistry {
 registry.register({ruleId:PEACE_RULE,skillId:PEACE_SKILL,characterId:79,ruleVersion:RULESET_VERSION,
  priority:5,phases:['DAY_VOTE_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{
   if(s.voting?.status!=='OPEN'||s.voting.round!==s.round)throw new KernelError('OUT_OF_PHASE','Voting not open');
   if(participant(s,a.playerId).effects.some(x=>x.kind===PEACE_USED))throw new KernelError('RESOURCE_INSUFFICIENT','Peace wolf already used their once-per-match action');
   const roles=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b);
   if(JSON.stringify(roles)!==JSON.stringify([25,74,79])&&!isDeepJesterDeck(s))throw new KernelError('RULE_UNRESOLVED','Peace wolf may be used only in the verified closed deck');
  },
  evaluate:(s,a)=>{
   const target=participant(s,a.targetIds[0]);
   if(target.life!=='ALIVE'&&target.life!=='PROLONGED')throw new KernelError('RULE_UNRESOLVED','Target status changed');
   return [{type:'INFORMATION_RESULT',targetId:target.playerId,recipientId:a.playerId,visibility:'PLAYER_PRIVATE',value:target.currentCharacterId,key:PEACE_RULE}];
  }
 });return registry;
}
export function applyOfficialPeace(s:GameState,e:Effect,a:GameAction){
 if(a.skillId!==PEACE_SKILL||e.key!==PEACE_RULE||e.type!=='INFORMATION_RESULT'||e.targetId!==a.targetIds[0]||e.recipientId!==a.playerId||e.visibility!=='PLAYER_PRIVATE')
  throw new KernelError('RULE_UNRESOLVED','Invalid peace wolf effect provenance');
 const actor=participant(s,a.playerId),target=participant(s,e.targetId);
 if(actor.currentCharacterId!==79||actor.effects.some(x=>x.kind===PEACE_USED)||s.voting?.status!=='OPEN'||e.value!==target.currentCharacterId)
  throw new KernelError('RULE_UNRESOLVED','Peace wolf effect cannot be safely resolved');
 actor.effects.push({id:`wv79-used-${a.actionId}`,kind:PEACE_USED,payload:{sourceRule:'PH-02',actionId:a.actionId}});
 const outcome=resolveCertifiedCancellation(s,a.playerId);
 s.voting={...s.voting,status:'CANCELLED',outcome};
 return {type:'ROLE_OBSERVED',targetId:target.playerId,payload:{characterId:target.currentCharacterId,skillId:a.skillId}};
}
