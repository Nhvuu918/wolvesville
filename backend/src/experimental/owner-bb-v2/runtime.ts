import {mirrorMixedDomain,recordMirrorPackVictim,MIRROR_MEMORY,MIRROR_SCAN} from '../../official/mirror-investigation.js';
/** Unpublished BB candidate resolution adapter. It commits only to a cloned
 * state in the candidate journal, never to a published game archive. The
 * bounded death domain deliberately rejects unknown reactions and links. */
import type {GameState,Participant,Visibility,GameAction,Effect} from '../../../../shared/contracts/index.js';
import {clone,canonical,hash} from '../../common/canonical.js';
import {candidateMatchBinding} from '../owner-bb/binding.js';
import {candidateActionBlocked} from '../owner-bb/locks.js';
import {GUARD_LAYER,SNOW_LAYER,protectionLayers,applyOfficialSupport} from '../../official/support-rules.js';
import {selectSingleDefense,consumeDefense} from '../../official/protection-consumption.js';
import {hasClosedDeathLedger,type DeathProofEvent} from '../../official/stable-death-proof.js';
import {isMixedExileDeck,exileBiteEntitled} from '../../official/final-pack.js';
import {liveConversionDomain} from './live-profile.js';
import {PROFILE,type PackState} from './pack.js';
import {resolveTrapGroup,type TrapState,type Resolution} from './trap.js';
export type CandidateEvent=DeathProofEvent&{visibility:Visibility;recipientId?:string};
export interface CandidateCommit {state:GameState;events:CandidateEvent[];candidateOnly:true;winnerEvaluated:false}
function check(ok:unknown,code:string):asserts ok{if(!ok)throw Error(code);}
const noReactionRoles=new Set([3,5,9,10,25,31,48,74,76,77]);
const knownStatus=new Set([GUARD_LAYER,SNOW_LAYER,'OFFICIAL_31_LAST_GUARD','OFFICIAL_9_USED_TARGET','S15_77_TRAP','S13_SKILL_USE','S15_DEEP_PRELIMINARY_DEATH']);
function person(s:GameState,id:string):Participant{const p=s.participants.find(p=>p.playerId===id);if(!p)throw Error('UNKNOWN_PARTICIPANT');return p;}
function safeDomain(s:GameState){check(!s.completed&&!s.links.some(x=>x.active)&&s.participants.every(p=>!p.winLinks.length&&['ALIVE','DEAD_FINAL','PENDING_DEATH'].includes(p.life)),'PENDING_DEATH_INTERACTION');}
function eliminate(s:GameState,id:string,events:CandidateEvent[],reason:string,sourceId:string,additionalStatus:readonly string[]=[]){
 const p=person(s,id);if(p.life==='DEAD_FINAL')return;check(['ALIVE','PENDING_DEATH'].includes(p.life)&&!p.publicReportedDead&&(noReactionRoles.has(p.currentCharacterId)||mirrorMixedDomain(s)&&p.currentCharacterId===35||(liveConversionDomain(s)||isMixedExileDeck(s))&&p.currentCharacterId===84||isMixedExileDeck(s)&&p.currentCharacterId===93)&&p.effects.every(e=>knownStatus.has(e.kind)||mirrorMixedDomain(s)&&[MIRROR_MEMORY,MIRROR_SCAN].includes(e.kind)||additionalStatus.includes(e.kind)||(liveConversionDomain(s)||isMixedExileDeck(s))&&e.kind==='S14_PUBLIC_MUTE'||isMixedExileDeck(s)&&['S15_BREAK_EXILE_ALIGNMENT','S14_50_NIGHT_LOCK','S15_87_VOTE_BLOCK'].includes(e.kind)),'PENDING_DEATH_INTERACTION');
 p.life='DEAD_FINAL';p.publicReportedDead=true;p.effects=p.effects.filter(e=>e.kind!=='S15_DEEP_PRELIMINARY_DEATH');
 events.push({eventType:'CANDIDATE_DEATH_PROVENANCE',visibility:'SERVER_INTERNAL',payload:{playerId:id,sourceId,reason}}, {eventType:'PLAYER_ELIMINATED',visibility:'ROOM_PUBLIC',payload:{playerId:id}}, {eventType:'POST_ELIMINATION_CHAIN_CLOSED',visibility:'SERVER_INTERNAL',payload:{victimId:id,pendingEffects:0,ruleId:reason}});
}
function finish(s:GameState,events:CandidateEvent[],history:readonly DeathProofEvent[]):CandidateCommit{
 // Pending deaths elsewhere are left for their original death chain; do not
 // falsely certify victory. If no pending life exists validate all cycles.
 if(s.participants.every(p=>['ALIVE','DEAD_FINAL'].includes(p.life)))check(hasClosedDeathLedger(s,[...history,...events]),'DEATH_LEDGER_NOT_CLOSED');
 return {state:s,events,candidateOnly:true,winnerEvaluated:false};
}
export function commitCandidatePack(pack:PackState,original:GameState,history:readonly DeathProofEvent[]=[]):CandidateCommit{
 check(pack.profile===PROFILE&&pack.locked&&pack.result&&['UNANIMOUS','NO_CONSENSUS'].includes(pack.result.kind)&&original.gameId===pack.gameId&&original.ruleVersion===pack.ruleVersion&&original.round===pack.round&&original.phase==='NIGHT_RESOLVE'&&original.revision>=pack.gameRevision&&candidateMatchBinding(original)===pack.matchBinding,'PACK_NOT_COMMITTABLE');
 safeDomain(original);const s=clone(original),events:CandidateEvent[]=[];const attacks=pack.result!.candidateAttacks;
 if(isMixedExileDeck(s)){
  const current=s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='soi'&&(p.currentCharacterId===48||mirrorMixedDomain(s)&&p.currentCharacterId===35||exileBiteEntitled(s,p))&&!candidateActionBlocked(s,p.playerId,p.currentCharacterId===48?'official.48.pack-bite':p.currentCharacterId===35?'candidate.pack-bite':'official.93.pack-bite')).map(p=>p.playerId).sort();
  check(canonical(current)===canonical(pack.final?.wolfIds),'PACK_MEMBERSHIP_CHANGED_AFTER_LOCK');
 }
 // No consensus does not create a target, AFK fallback or random bite.
 if(!attacks.length)return finish(s,events,history);
 check(pack.final&&attacks.length<=pack.final.maxTargets&&new Set(attacks.map(a=>a.targetId)).size===attacks.length&&attacks.every(a=>a.sourceId===pack.final!.representativeId),'INVALID_ATTACK_PLAN');
 const rep=person(s,attacks[0]!.sourceId);check(rep.life==='ALIVE'&&rep.currentFaction==='soi'&&!candidateActionBlocked(s,rep.playerId,rep.currentCharacterId===48?'official.48.pack-bite':rep.currentCharacterId===93?'official.93.pack-bite':'candidate.pack-bite'),'REPRESENTATIVE_CHANGED_AFTER_LOCK');
 // Rescue domains and priority between active layers still require a full
 // official adapter; never silently skip a rescue window in candidate mode.
 check(!s.participants.some(p=>['ALIVE','PENDING_DEATH'].includes(p.life)&&[29,87].includes(p.currentCharacterId)),'PENDING_RESCUE_WINDOW');
 for(const attack of attacks){const target=person(s,attack.targetId);check(target.life==='ALIVE'&&target.currentFaction!=='soi'&&(!isMixedExileDeck(s)||target.currentFaction==='dan')&&target.effects.every(e=>knownStatus.has(e.kind)||(liveConversionDomain(s)||isMixedExileDeck(s))&&e.kind==='S14_PUBLIC_MUTE'||isMixedExileDeck(s)&&['S15_BREAK_EXILE_ALIGNMENT','S14_50_NIGHT_LOCK','S15_87_VOTE_BLOCK'].includes(e.kind)),'PENDING_ATTACK_INTERACTION');
  const layers=[...protectionLayers(s,target.playerId),...target.effects.filter(e=>e.kind==='S15_77_TRAP'&&e.expiresAtRound===s.round)];
  const defense=selectSingleDefense(layers,l=>l.kind===SNOW_LAYER&&person(s,l.sourceId!).currentCharacterId===9||l.kind===GUARD_LAYER&&person(s,l.sourceId!).currentCharacterId===31||l.kind==='S15_77_TRAP'&&person(s,l.sourceId!).currentCharacterId===77,'Unverified protection ordering');
  if(defense){consumeDefense(target,defense,defense.kind!==GUARD_LAYER);events.push({eventType:'CANDIDATE_ATTACK_BLOCKED',visibility:'SERVER_INTERNAL',payload:{targetId:target.playerId,sourceId:rep.playerId,layerId:defense.id,index:attack.index}});
   if(defense.kind==='S15_77_TRAP'&&rep.life==='ALIVE'){check(!rep.effects.some(e=>[GUARD_LAYER,SNOW_LAYER,'S15_77_TRAP'].includes(e.kind)),'PENDING_COUNTER_PROTECTION');eliminate(s,rep.playerId,events,'VH51/VH54',target.playerId);}
  }else {eliminate(s,target.playerId,events,'DEC-BT-01/VH74',rep.playerId);if(mirrorMixedDomain(s))recordMirrorPackVictim(s,target,attack.index);}
  // BB-03 RESOLVE: do not invalidate the sealed second bite when the first
  // retaliates. A second counter against the same dead rep is not a new death.
 }
 return finish(s,events,history);
}
export function commitCandidateTrapGroup(t:TrapState,groupId:string,items:readonly Resolution[],history:readonly DeathProofEvent[]=[]){
 check(items.length>0,'INVALID_GROUP');const original=items[0]!.state;check(items.every(r=>canonical(r.state)===canonical(original)),'GROUP_STATE_MISMATCH');safeDomain(original);
 const result=resolveTrapGroup(t,groupId,items);if(result.pending)return {trap:t,commit:null,outcomes:result.outcomes,pending:true,duplicate:false};
 if(result.duplicate)return {trap:t,commit:null,outcomes:result.outcomes,pending:false,duplicate:true};
 const s=clone(original),events:CandidateEvent[]=[];
 for(const o of result.outcomes){
  for(const e of o.effects){
   if(e.type==='DEATH_TRANSITION'&&['CANDIDATE_INVERTED_GUARD','CANDIDATE_INVERTED_RESCUE'].includes(e.key??'')){
    // BB-04=B: bypass protection and other rescue, not linked death or other
    // post-death reactions. An already preliminary death is finalized once.
    const mark=t.marks.find(m=>m.id===o.markId);check(mark,'MISSING_TRAP_PROVENANCE');
    events.push({eventType:'CANDIDATE_TRAP_TRIGGER',visibility:'SERVER_INTERNAL',payload:{engineerId:mark.sourceId,markId:mark.id,actionId:o.actionId,targetId:e.targetId}});
    eliminate(s,e.targetId,events,e.key!,e.causeId!);
   }else if(e.type==='INFORMATION_RESULT'&&e.visibility==='PLAYER_PRIVATE'&&e.recipientId){events.push({eventType:'CANDIDATE_INFORMATION',visibility:'PLAYER_PRIVATE',recipientId:e.recipientId,payload:{targetId:e.targetId,value:e.value}});}
   else throw Error('PENDING_EFFECT_APPLICATION');
  }
 }
 return {trap:result.state,commit:finish(s,events,history),outcomes:result.outcomes,pending:false,duplicate:false};
}
export function candidateCommitHash(c:CandidateCommit){return hash(c);}

/** Live QA only: an already-active trap in the bounded guard scenario. Reuse
 * the exact protection adapter to charge cooldown, then discard the newly
 * created layer and apply the approved inverted death, not ordinary damage. */
export function commitLiveInvertedGuard(original:GameState,a:GameAction,e:Effect,history:readonly DeathProofEvent[]):CandidateCommit{
 check(original.qaProfile==='owner-bb-live-trap-qa-v1'&&original.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='5,10,25,31,74'&&original.phase==='NIGHT_RESOLVE'&&a.skillId==='official.31.guard','INVALID_LIVE_INVERSION_SCOPE');
 const s=clone(original);safeDomain(s);const actor=person(s,a.playerId),mark=actor.effects.find(x=>x.kind==='S15_ENGINEER_TRAP'&&Number(x.payload?.round)<s.round);check(mark,'PENDING_SAME_NIGHT_TRAP_ORDER');
 applyOfficialSupport(s,e,a);const target=person(s,e.targetId);target.effects=target.effects.filter(x=>x.id!==`wv31-layer-${a.actionId}`);
 const events:CandidateEvent[]=[{eventType:'BB_QA_INVERTED_GUARD',visibility:'SERVER_INTERNAL',payload:{sourceId:mark.sourceId,actorId:a.playerId,targetId:e.targetId,actionId:a.actionId}}];
 eliminate(s,e.targetId,events,'BB-04/CANDIDATE_INVERTED_GUARD',a.playerId,['S15_ENGINEER_TRAP','S15_ENGINEER_TRAP_USED','OFFICIAL_5_JUDGMENT_USED']);return finish(s,events,history);
}
