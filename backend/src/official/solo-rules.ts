import {soulDeck,soulAttackTarget,soulBlindKnightIntent,soulDeath} from './soul-shooter.js';
import {resolveEffigy} from './breakthrough-rules.js';
/** Source-limited, fully closed 2-person early-night finish.
 * Character JSON #8: may take one life each night; wins as last surviving player.
 * Character JSON #25: investigation only, no on-death trigger.
 * VH03: finish accepted action/effect chain before evaluating simultaneous winners.
 * L02/VH07: public death notification must not expose killer, role, or cause.
 * NOT a general attack or victory resolver; it may NEVER be used with other decks.
 */
import {isS12ClosedDeck,assertS12StableDomain,absorbCertifiedNightAttack,commitS12Death} from './death-interactions.js';
import type {GameState, GameAction, Effect} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {RuleRegistry} from '../engine/rules.js';
import {resolveRedirect} from './deep-redirect.js';
import {isS13AttackDeck,adjudicateS13Attack,isCertifiedS13AttackTarget} from './s13-mechanics.js';
/** Verified closed decks: #25 can inspect; #28 only wins if HANGED,
 * never when killed at night (character.json#28, VH03). Both have no on-death
 * effects in these strictly limited decks. NO generic knight vs 97 roles. */
export const SOLE_SURVIVOR_DECK=[8,25] as const;
export const SOLE_SURVIVOR_DECK_JESTER=[8,28] as const;
const VERIFIED_VICTIMS=new Set([25,28]);
export const KNIGHT_SKILL='official.8.night-kill';
export const KNIGHT_RULE='OFFICIAL_CHAR_8_NIGHT_KILL';
export function isKnightClosedDeck(s:GameState):boolean {
 const roles=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b);
 return roles.length===2 && roles[0]===8 && VERIFIED_VICTIMS.has(roles[1]!) &&
   s.participants.every(p=>p.currentCharacterId===p.initialCharacterId);
}
export function isSupportedKnightDeck(s:GameState):boolean {return isKnightClosedDeck(s)||isS12ClosedDeck(s)||isS13AttackDeck(s);}
export function registerOfficialKnight(r:RuleRegistry){
 r.register({skillId:KNIGHT_SKILL,ruleId:KNIGHT_RULE,characterId:8,ruleVersion:RULESET_VERSION,
  priority:150,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,
  validateSubmission:(s,a)=>{if(!isSupportedKnightDeck(s)||isS13AttackDeck(s)&&!isCertifiedS13AttackTarget(s,a.targetIds[0]!))throw new KernelError('RULE_UNRESOLVED','Knight attack only supported in the verified closed deck/target');},
  evaluate:(s,a)=>{
   if(isS13AttackDeck(s)){
    if(!isCertifiedS13AttackTarget(s,a.targetIds[0]!))throw new KernelError('RULE_UNRESOLVED','Only #25 lethal outcome has been certified in S13 decks');
    return [{type:'DEATH_TRANSITION',targetId:a.targetIds[0]!,key:KNIGHT_RULE}];
   }
   if(isS12ClosedDeck(s)){
    assertS12StableDomain(s);
    return [{type:'DEATH_TRANSITION',targetId:a.targetIds[0]!,key:KNIGHT_RULE}];
   }
   if(!isKnightClosedDeck(s)||s.participants.some(p=>p.effects.some(e=>e.kind.includes('PROTECTION')||e.kind.includes('REVIVAL')||e.kind.includes('LINK'))))
    throw new KernelError('RULE_UNRESOLVED','Unverified death or protection interaction');
   const target=participant(s,a.targetIds[0]!);
   if(!VERIFIED_VICTIMS.has(target.currentCharacterId)||target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Knight closed-deck target changed');
   return [{type:'DEATH_TRANSITION',targetId:target.playerId,key:KNIGHT_RULE}];
  }});
 return r;
}
export function applyVerifiedKnightElimination(s:GameState,e:Effect,a:GameAction){
 if(!isSupportedKnightDeck(s)||a.skillId!==KNIGHT_SKILL||e.type!=='DEATH_TRANSITION'||e.key!==KNIGHT_RULE||e.targetId!==a.targetIds[0])
  throw new KernelError('RULE_UNRESOLVED','Non-certified elimination provenance');
 const actor=participant(s,a.playerId),target=participant(s,e.targetId);
 if(actor.currentCharacterId!==8||(actor.life!=='ALIVE'&&!soulDeck(s))||(!soulAttackTarget(s,target)&&!soulBlindKnightIntent(s,a.skillId,target))||actor.playerId===target.playerId||(!isS12ClosedDeck(s)&&!isS13AttackDeck(s)&&!VERIFIED_VICTIMS.has(target.currentCharacterId)))
  throw new KernelError('RULE_UNRESOLVED','Elimination target or actor state changed');
 // A blind attempt on a genuinely dead seat is inert and has no public result.
 if(soulBlindKnightIntent(s,a.skillId,target)&&target.life==='DEAD_FINAL')return {type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{sourceRules:['character.json#23','LIFE-01'],reason:'NO_LIVING_TARGET'}};
 if(isS13AttackDeck(s)){
  const effigy=resolveEffigy(s,target);if(effigy)return {type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{sourceRules:['character.json#94'],redirectVictimId:effigy.playerId}};
  const redirect=resolveRedirect(s,target);if(redirect)return {type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{sourceRules:[redirect.ruleId],redirectVictimId:redirect.target.playerId}};
  const result=adjudicateS13Attack(s,target);
  if(result==='PENDING')return {type:'S15_DEEP_PRELIMINARY_QUEUED' as const,payload:{playerId:target.playerId}};
  if(result==='TRAP_COUNTER')return {type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{sourceRules:['VH51'],counterVictimId:a.playerId}};
  if(result==='ELIMINATED'&&soulDeck(s)&&target.currentCharacterId===23){const stage=soulDeath(s,target,a.actionId);return {type:stage==='FIRST'?'PLAYER_ELIMINATED':'SOUL_FINAL_DEATH',payload:{playerId:target.playerId}};}
  return result==='ABSORBED'?{type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{sourceRules:['character.json#8','S13_CERTIFIED_SINGLE_SHIELD']}}
   :{type:'PLAYER_ELIMINATED' as const,payload:{playerId:target.playerId}};
 }
 if(isS12ClosedDeck(s)){
  const absorbed=absorbCertifiedNightAttack(s,target);
  if(absorbed)return {type:'OFFICIAL_ATTACK_BLOCKED' as const,payload:{layerId:absorbed,sourceRules:['character.json#8','character.json#9']}};
  commitS12Death(s,target);
  return {type:'PLAYER_ELIMINATED' as const,payload:{playerId:target.playerId}};
 }
 if(s.links.length||target.effects.some(x=>x.kind.includes('PROTECTION')||x.kind.includes('REVIVAL')))
  throw new KernelError('RULE_UNRESOLVED','Cannot adjudicate an unverified rescue/link chain');
 target.life='DEAD_FINAL';target.publicReportedDead=true;
 return {type:'PLAYER_ELIMINATED' as const,payload:{playerId:target.playerId}};
}
export function knightSoloWinner(s:GameState):string|null {
 if(!isKnightClosedDeck(s)||s.completed||s.phase!=='NIGHT_FINALIZE'||s.links.length)return null;
 const knight=s.participants.find(p=>p.currentCharacterId===8),victim=s.participants.find(p=>VERIFIED_VICTIMS.has(p.currentCharacterId));
 if(!knight||!victim||knight.life!=='ALIVE'||victim.life!=='DEAD_FINAL')return null;
 if(s.participants.some(p=>p.life==='PENDING_REVIVAL'||p.life==='PENDING_DEATH'||p.life==='PROLONGED'||p.life==='HIBERNATING'||p.winLinks.length))return null;
 return knight.playerId;
}
