import {lifecycleComposition,lifecycleCapabilities,LIFE_COMPOSITION_VERSION} from './lifecycle-composition.js';
/** RC-01: bounded, opt-in LIFE-02 + Cupid interaction for the #64 contract.
 * Uses committed death transitions, never a public death announcement, as the
 * trigger for a linked death. No official ruleset activation or fixture grant.
 * Sources: character.json#27/#97, NV30, LIFE-02, Q13-05, VH63, VH03, VH65.
 * Q13-07/12: prolong/rescue precede this resolver; neither is admitted here.
 */
import {isApprovedRuleVersion,APPROVED_RULESET_VERSION,type GameState,type GameAction,type Effect,type Participant} from '../../../shared/contracts/index.js';
import {invariant} from '../common/errors.js';
import {hash} from '../common/canonical.js';
import type {RuleRegistry} from '../engine/rules.js';
import type {PendingEvent} from '../engine/events.js';
import {participant} from '../engine/state.js';
import {resolveComposedNightDefense} from './protection-consumption.js';
import {activeGuardProtection} from './support-rules.js';
export const LIFE02_POLICY='RC01-LIFE02-CUPID-V1' as const;
export const FULL50_LIFE02_POLICY='WV-FULL50-LIFE02-V2' as const;
export const full50CandidateEnabled=()=>process.env.WV_FULL50_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export const FULL50_LIFE02_M1_POLICY='WV-FULL50-LIFE02-V3' as const;
export const full50Lifecycle=(s:GameState)=>s.qaLife02Policy===FULL50_LIFE02_M1_POLICY;
export const full50Life02=(s:GameState)=>s.qaLife02Policy===FULL50_LIFE02_POLICY||full50Lifecycle(s);
export const WAKE_PUBLIC_PENDING='FULL50_WAKE_PUBLIC_PENDING';
export const PROLONG_SKILL='official.51.ferry';
export const PROLONG_MARK='FULL5_FERRY_MARK';
export const PROLONG_USED='FULL5_FERRY_USED';
export const PROLONG_ACTIVE='FULL5_PROLONG_ACTIVE';
export const SEED_SKILL='official.97.plant';
export const CUPID_SKILL='official.27.pair';
export const SEED_MARK='RC01_SEED';
export const SEED_USED='RC01_SEED_USED';
export const SLEEP_MARK='RC01_SLEEP';
export const CUPID_LINK='RC01_CUPID_PAIR';
export const CUPID_USED='RC01_CUPID_USED';
export const CUPID_VILLAGER='RC01_CUPID_VILLAGER';
const life02BaseIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,25,27,64,97';
const life02RescueIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,25,27,29,64,97';
const life02GuardIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,25,27,29,31,64,97';
export const life02Ids=(ids:readonly number[])=>life02BaseIds(ids)||full50CandidateEnabled()&&(life02RescueIds(ids)||life02GuardIds(ids));
export const life02Enabled=()=>process.env.WV_RC01_LIFE02_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export const composedLife02=(s:GameState)=>s.life02Composition===LIFE_COMPOSITION_VERSION&&full50Lifecycle(s)&&lifecycleComposition(s.participants.map(p=>p.initialCharacterId));
export const life02Domain=(s:GameState)=>(s.qaLife02Policy===LIFE02_POLICY||full50Life02(s))&&isApprovedRuleVersion(s.ruleVersion)&&(composedLife02(s)||life02BaseIds(s.participants.map(p=>p.initialCharacterId))||full50Lifecycle(s)&&(life02RescueIds(s.participants.map(p=>p.initialCharacterId))||life02GuardIds(s.participants.map(p=>p.initialCharacterId))));
export const life02RescueDomain=(s:GameState)=>life02Domain(s)&&full50Lifecycle(s)&&(composedLife02(s)?lifecycleCapabilities(s.participants.map(p=>p.initialCharacterId)).has('preliminary-rescue'):(life02RescueIds(s.participants.map(p=>p.initialCharacterId))||life02GuardIds(s.participants.map(p=>p.initialCharacterId))));
export const isCupidVillager=(p:Participant)=>p.currentCharacterId===27&&p.effects.some(e=>e.kind===CUPID_VILLAGER);
export const life02NameOverride=(p:Participant)=>isCupidVillager(p)?'Dân thường':undefined;
export const seedRemaining=(s:GameState,id:string)=>2-participant(s,id).effects.filter(e=>e.kind===SEED_USED).length;
export const seedReady=(s:GameState,id:string)=>life02Domain(s)&&participant(s,id).currentCharacterId===97&&participant(s,id).life==='ALIVE'&&seedRemaining(s,id)>0;
export const cupidReady=(s:GameState,id:string)=>life02Domain(s)&&s.round===1&&participant(s,id).currentCharacterId===27&&participant(s,id).life==='ALIVE'&&!participant(s,id).effects.some(e=>e.kind===CUPID_USED);
export function seedTargets(s:GameState,id:string){return s.participants.filter(p=>p.playerId!==id&&p.life==='ALIVE'&&!p.publicReportedDead&&!p.effects.some(e=>e.kind===SEED_MARK&&e.sourceId===id)).map(p=>p.playerId);}
function validateSeed(s:GameState,a:GameAction){invariant(seedReady(s,a.playerId),'RESOURCE_INSUFFICIENT','Seed unavailable');invariant(a.targetIds.length===1&&seedTargets(s,a.playerId).includes(a.targetIds[0]!),'TARGET_INVALID','Choose another living player without your seed');}
function validateCupid(s:GameState,a:GameAction){invariant(cupidReady(s,a.playerId),'RULE_UNRESOLVED','Cupid first-night skill unavailable');invariant(a.targetIds.length===2&&new Set(a.targetIds).size===2&&a.targetIds.every(id=>participant(s,id).life==='ALIVE'&&!participant(s,id).publicReportedDead),'TARGET_INVALID','Choose two distinct living players');}
/** #51 prolongation; resource is consumed only when an actual lethal root
 * is deferred, not when a passenger is selected (GD-FERRY-01). A passenger
 * may be selected again on a later night if never prolonged. */
export const prolongDomain=(s:GameState)=>composedLife02(s)&&lifecycleCapabilities(s.participants.map(p=>p.initialCharacterId)).has('prolonged-life');
export const prolongRemaining=(s:GameState,id:string)=>2-participant(s,id).effects.filter(e=>e.kind===PROLONG_USED).length;
export function prolongTargets(s:GameState,id:string){const owner=participant(s,id);return s.participants.filter(p=>p.playerId!==id&&p.life==='ALIVE'&&!p.publicReportedDead&&!owner.effects.some(e=>e.kind===PROLONG_USED&&e.payload?.targetId===p.playerId)).map(p=>p.playerId);}
export function prolongReady(s:GameState,id:string){const p=participant(s,id);return prolongDomain(s)&&p.currentCharacterId===51&&p.life==='ALIVE'&&prolongRemaining(s,id)>0&&prolongTargets(s,id).length>0;}
function validateProlong(s:GameState,a:GameAction){invariant(prolongReady(s,a.playerId),'RESOURCE_INSUFFICIENT','No ferry capacity');invariant(a.targetIds.length>=1&&a.targetIds.length<=prolongRemaining(s,a.playerId)&&new Set(a.targetIds).size===a.targetIds.length&&a.targetIds.every(id=>prolongTargets(s,a.playerId).includes(id)),'TARGET_INVALID','Choose up to remaining eligible passengers');}
function prolongLife(s:GameState,p:Participant,correlationId:string):PendingEvent|undefined{
 if(!prolongDomain(s)||!['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase)||p.life!=='ALIVE')return;
 const mark=p.effects.find(e=>e.kind===PROLONG_MARK&&e.payload?.round===s.round);if(!mark?.sourceId)return;
 const owner=participant(s,mark.sourceId);invariant(owner.currentCharacterId===51&&prolongRemaining(s,owner.playerId)>0,'RULE_UNRESOLVED','Invalid ferry provenance');
 p.effects=p.effects.filter(e=>e!==mark);p.life='PROLONGED';
 p.effects.push({id:`prolong-active-${mark.id}`,kind:PROLONG_ACTIVE,sourceId:owner.playerId,payload:{round:s.round}});
 owner.effects.push({id:`prolong-used-${mark.id}`,kind:PROLONG_USED,payload:{targetId:p.playerId,round:s.round}});
 return {eventType:'FULL5_PROLONG_STARTED',payload:{playerId:p.playerId,round:s.round},visibility:'SERVER_INTERNAL',correlationId};
}
function endProlong(s:GameState,p:Participant,correlationId:string):PendingEvent{
 const active=p.effects.find(e=>e.kind===PROLONG_ACTIVE);invariant(prolongDomain(s)&&s.phase==='DAY_RESOLVE'&&p.life==='PROLONGED'&&active?.payload?.round===s.round,'RULE_UNRESOLVED','Invalid prolongation expiry');
 p.effects=p.effects.filter(e=>e!==active);p.life='ALIVE';
 return {eventType:'FULL5_PROLONG_ENDED',payload:{playerId:p.playerId,round:s.round},visibility:'SERVER_INTERNAL',correlationId};
}
/** Day close settles passengers after hanging, before victory. A prior
 * hanging/linked death can already have ended their prolongation. */
export function expireLifeProlongations(s:GameState):PendingEvent[]{
 if(!prolongDomain(s)||s.phase!=='DAY_RESOLVE')return [];
 const events:PendingEvent[]=[];
 for(const p of s.participants)if(p.life==='PROLONGED')events.push(...resolveLife02Lethal(s,p.playerId,`ferry-expire-${s.round}-${p.playerId}`,'Q13-07'));
 for(const p of s.participants)p.effects=p.effects.filter(e=>e.kind!==PROLONG_MARK||Number(e.payload?.round)>s.round);
 return events;
}
export function registerLife02(r:RuleRegistry){
 r.register({characterId:51,skillId:PROLONG_SKILL,ruleId:'WV-CH51-PROLONG',ruleVersion:APPROVED_RULESET_VERSION,priority:35,phases:['NIGHT_COLLECT'],target:{min:1,max:2,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateProlong,evaluate(s,a){validateProlong(s,a);return [{type:'STATUS',key:PROLONG_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:97,skillId:SEED_SKILL,ruleId:'WV-CH97-S01',ruleVersion:APPROVED_RULESET_VERSION,priority:30,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateSeed,evaluate(s,a){validateSeed(s,a);return [{type:'STATUS',key:SEED_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 r.register({characterId:27,skillId:CUPID_SKILL,ruleId:'WV-CH27-S01',ruleVersion:APPROVED_RULESET_VERSION,priority:15,phases:['NIGHT_COLLECT'],target:{min:2,max:2,allowSelf:true,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateCupid,evaluate(s,a){validateCupid(s,a);return [{type:'LINK_MODIFICATION',key:CUPID_LINK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});
 return r;
}
/** No client-side direct mutation. Caller validates action and owns transaction. */
export function applyLife02Skill(s:GameState,e:Effect,a:GameAction):PendingEvent[]{
 invariant(e.targetId===a.targetIds[0]&&e.causeId===a.playerId&&s.phase==='NIGHT_RESOLVE','RULE_UNRESOLVED','Invalid LIFE-02 skill provenance');
 if(a.skillId===PROLONG_SKILL){validateProlong(s,a);invariant(e.type==='STATUS'&&e.key===PROLONG_MARK,'RULE_UNRESOLVED','Invalid ferry effect');for(const id of a.targetIds)participant(s,id).effects.push({id:`ferry-${a.actionId}-${id}`,kind:PROLONG_MARK,sourceId:a.playerId,payload:{round:s.round}});return [{eventType:'FULL5_FERRY_SELECTED',payload:{actionId:a.actionId,targetIds:[...a.targetIds]},visibility:'PLAYER_PRIVATE',recipientId:a.playerId,correlationId:a.actionId}];}
 if(a.skillId===SEED_SKILL){validateSeed(s,a);invariant(e.type==='STATUS'&&e.key===SEED_MARK,'RULE_UNRESOLVED','Invalid seed effect');const target=participant(s,e.targetId),actor=participant(s,a.playerId);
  invariant(!target.effects.some(x=>x.kind===SEED_MARK),'RULE_UNRESOLVED','VH63: only one unactivated seed');
  target.effects.push({id:`seed-${a.actionId}`,kind:SEED_MARK,sourceId:actor.playerId,payload:{round:s.round}});actor.effects.push({id:`seed-used-${a.actionId}`,kind:SEED_USED,payload:{targetId:target.playerId,round:s.round}});
  return [{eventType:'RC01_SEED_PLANTED',payload:{actionId:a.actionId,targetId:target.playerId,remainingUses:seedRemaining(s,actor.playerId)},visibility:'PLAYER_PRIVATE',recipientId:actor.playerId,correlationId:a.actionId}];
 }
 validateCupid(s,a);invariant(a.skillId===CUPID_SKILL&&e.type==='LINK_MODIFICATION'&&e.key===CUPID_LINK&&!s.links.length,'RULE_UNRESOLVED','Invalid Cupid effect');
 const owner=participant(s,a.playerId),id=`cupid-${hash([s.gameId,a.actionId]).slice(0,32)}`,members=[...new Set([owner.playerId,...a.targetIds])];
 invariant(members.every(pid=>!participant(s,pid).winLinks.length),'RULE_UNRESOLVED','Layered win links not admitted');
 s.links.push({id,type:CUPID_LINK,memberIds:[...a.targetIds],active:true,createdSeq:s.revision+1});owner.effects.push({id:`cupid-used-${a.actionId}`,kind:CUPID_USED,payload:{linkId:id,round:s.round}});
 for(const pid of members){const p=participant(s,pid);p.currentFaction='phe3';p.currentWinGroup=id;p.winLinks=[id];}
 // NV30: the system creates a group at pairing. Phase permission for this
 // isolated QA is day discussion/voting, not a new ACTIVE global chat rule.
 (s.systemChatGroups??=[]).push({id,kind:'CUPID_PAIR',sourceRule:'NV30',ownerId:owner.playerId,memberIds:members,grants:members.filter(pid=>pid!==owner.playerId).map(memberId=>({memberId,sourceActionId:a.actionId,round:s.round}))});
 const events:PendingEvent[]=[];for(const pid of members){events.push({eventType:'RC01_CUPID_JOINED',payload:{playerIds:[...members]},visibility:'PLAYER_PRIVATE',recipientId:pid,correlationId:a.actionId});}
 // Source grants role information to the pair; no inference that an outside
 // Cupid gets all role identities. The Cupid knows the identities it chose.
 for(const pid of a.targetIds){const other=a.targetIds.find(x=>x!==pid)!;events.push({eventType:'RC01_CUPID_PARTNER',payload:{characterId:participant(s,other).currentCharacterId},visibility:'PLAYER_PRIVATE',recipientId:pid,targetId:other,correlationId:a.actionId});}
 return events;
}
const publicDeath=(id:string,correlationId:string):PendingEvent=>({eventType:'PLAYER_ELIMINATED',payload:{playerId:id},visibility:'ROOM_PUBLIC',correlationId});
/** Death transition AFTER permitted defense/rescue. Never call this for an
 * already prevented attack. This scope admits no defense/rescue/prolong roles. */
export function resolveLife02Lethal(s:GameState,id:string,correlationId:string,sourceRule:string,previewBeforeProlong=false):PendingEvent[]{
 invariant(life02Domain(s)&&(['NIGHT_RESOLVE','DAY_RESOLVE'].includes(s.phase)||life02RescueDomain(s)&&s.phase==='WITCH_WINDOW'),'RULE_UNRESOLVED','LIFE-02 domain unavailable');
 const events:PendingEvent[]=[],seen=new Set<string>();
 const lethal=(victimId:string,rule:string)=>{if(seen.has(victimId))return;seen.add(victimId);const p=participant(s,victimId);
  if(p.life==='DEAD_FINAL')return;
  if(p.life==='PROLONGED'){if(s.phase!=='DAY_RESOLVE')return;events.push(endProlong(s,p,correlationId));}
  const sleeping=p.life==='HIBERNATING'&&full50Lifecycle(s);
  invariant(p.life==='ALIVE'||sleeping,'RULE_UNRESOLVED','No lethal rule for an already sleeping/prolonged participant');
  // GD-LIFE-GUARD-01: #31's night protection covers both direct night
  // lethal roots and Cupid death-follow, never hanging/day damage. It
  // is persistent for this night (WV-GUARD-MULTIHIT-01).
  const defense=composedLife02(s)?resolveComposedNightDefense(s,p):full50Lifecycle(s)&&life02GuardIds(s.participants.map(x=>x.initialCharacterId))&&activeGuardProtection(s,p.playerId)?'GUARD':undefined;
  if(defense){
   events.push({eventType:defense==='GUARD'?'FULL50_LIFE_GUARD_PREVENTED':'FULL50_LIFE_SNOW_PREVENTED',payload:{playerId:p.playerId,sourceRule:rule},visibility:'SERVER_INTERNAL',correlationId});return;
  }
  if(!previewBeforeProlong){const delayed=prolongLife(s,p,correlationId);if(delayed){events.push(delayed);return;}}
  const seeds=p.effects.filter(x=>x.kind===SEED_MARK);invariant(seeds.length<=1,'RULE_UNRESOLVED','VH63 seed invariant');
  if(seeds.length){const seed=seeds[0]!;p.effects=p.effects.filter(e=>e!==seed);p.life='HIBERNATING';p.publicReportedDead=true;
   // The public announcement belongs to the current day; the next morning
   // is the following round. NV100 timing is explicitly bounded QA pending
   // confirmation, not a silently activated global interpretation.
   p.effects.push({id:`sleep-${seed.id}`,kind:SLEEP_MARK,payload:{wakeRound:s.round+1,round:s.round,seedId:seed.id}});
   events.push({eventType:'RC01_HIBERNATION_STARTED',payload:{playerId:victimId,round:s.round,wakeRound:s.round+1},visibility:'SERVER_INTERNAL',correlationId},publicDeath(victimId,correlationId));return;
  }
  p.life='DEAD_FINAL';p.publicReportedDead=true;
  if(sleeping){
   p.effects=p.effects.filter(e=>e.kind!==SLEEP_MARK);
   // Already publicly reported dead; no duplicate announcement or leak.
   events.push({eventType:'FULL50_HIBERNATION_FATAL',payload:{playerId:victimId,round:s.round,ruleId:rule},visibility:'SERVER_INTERNAL',correlationId});
  }else events.push(publicDeath(victimId,correlationId));
  for(const l of s.links.filter(l=>l.active&&l.type===CUPID_LINK&&l.memberIds.includes(victimId))){const other=l.memberIds.find(x=>x!==victimId)!;if(participant(s,other).life!=='DEAD_FINAL')lethal(other,'character.json#27');
   if(l.memberIds.every(x=>participant(s,x).life==='DEAD_FINAL')){l.active=false;const cupid=s.participants.find(x=>x.currentCharacterId===27)!;
    if(cupid.life==='ALIVE'){cupid.currentFaction='dan';delete cupid.currentWinGroup;cupid.winLinks=cupid.winLinks.filter(x=>x!==l.id);cupid.effects.push({id:`cupid-villager-${l.id}`,kind:CUPID_VILLAGER,payload:{round:s.round}});events.push({eventType:'RC01_CUPID_VILLAGER',payload:{roleName:'Dân thường'},visibility:'PLAYER_PRIVATE',recipientId:cupid.playerId,correlationId});}
   }
  }
  events.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId,ruleId:rule,pendingEffects:0,sourceRules:[rule,'LIFE-02','VH03','VH65']},visibility:'SERVER_INTERNAL',correlationId});
 };
 lethal(id,sourceRule);return events;
}
/** Q13-12 / F03. Plan lethal roots without mutating life, seed, or link.
 * Only the admitted no-defense scope uses this plan. It is deliberately not
 * a generic protection/prolongation oracle. Preview and commit share the
 * same seed/linked-death precedence. No public announcement before commit. */
export function queueLife02Attack(s:GameState,targetId:string,correlationId:string,sourceRule:string):void{
 invariant(life02RescueDomain(s)&&['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase),'RULE_UNRESOLVED','LIFE-02 rescue window unavailable');
 const p=participant(s,targetId);if(p.life==='DEAD_FINAL')return;
 invariant(['ALIVE','HIBERNATING'].includes(p.life),'RULE_UNRESOLVED','Unsupported preliminary life state');
 const roots=s.life02PendingAttacks??(s.life02PendingAttacks=[]);
 invariant(!roots.some(x=>x.correlationId===correlationId),'IDEMPOTENCY_CONFLICT','Duplicate pending lethal root');
 roots.push({targetId,correlationId,sourceRule,round:s.round});
}
export function previewLife02Victims(s:GameState):Participant[]{
 if(!life02RescueDomain(s))return [];
 // Use the actual life resolver on a clone. No RNG, persistence, public event
 // or mutation escapes preview. This avoids different preview/commit rules.
 const copy=structuredClone(s),victims=new Set<string>();
 if(copy.phase!=='NIGHT_RESOLVE'&&copy.phase!=='WITCH_WINDOW')return [];
 for(const root of copy.life02PendingAttacks??[]){
  invariant(root.round===copy.round,'RULE_UNRESOLVED','Stale LIFE-02 lethal root');
  for(const e of resolveLife02Lethal(copy,root.targetId,root.correlationId,root.sourceRule,true)){
   if(e.eventType==='PLAYER_ELIMINATED'||e.eventType==='FULL50_HIBERNATION_FATAL')victims.add(String(e.payload.playerId));
  }
 }
 return s.participants.filter(p=>victims.has(p.playerId));
}
export function rescueLife02Preliminary(s:GameState,targetId:string):void{
 invariant(life02RescueDomain(s)&&s.phase==='WITCH_WINDOW'&&previewLife02Victims(s).some(p=>p.playerId===targetId),'TARGET_INVALID','Select a preliminary night victim');
 // SYS-13: one potion rescues both members of a still-active Cupid pair,
 // even if both were direct targets. Never consume an untriggered seed.
 const saved=new Set([targetId]);
 for(const link of s.links.filter(l=>l.active&&l.type===CUPID_LINK&&l.memberIds.includes(targetId)))for(const id of link.memberIds)saved.add(id);
 s.life02PendingAttacks=(s.life02PendingAttacks??[]).filter(root=>!saved.has(root.targetId));
}
export function finalizeLife02Attacks(s:GameState):PendingEvent[]{
 if(!life02RescueDomain(s))return [];
 invariant(['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase),'RULE_UNRESOLVED','LIFE-02 attack closure out of phase');
 const events:PendingEvent[]=[];
 for(const root of s.life02PendingAttacks??[]){
  invariant(root.round===s.round,'RULE_UNRESOLVED','Stale LIFE-02 lethal root');
  events.push(...resolveLife02Lethal(s,root.targetId,root.correlationId,root.sourceRule));
 }
 delete s.life02PendingAttacks;return events;
}
/** V3: wake in NIGHT_RESOLVE after current attacks, publish at dawn.
 * NV100 and WV-LIFE02-LINK-02. Only a still-active Cupid link may revive
 * the dead partner; do not create a new link or reanimate a canceled sleeper.
 * No rescue/prolong/protection decks are admitted by this policy yet. */
export function resolveLife02NightWake(s:GameState):PendingEvent[]{
 if(!life02Domain(s)||!full50Lifecycle(s)||(s.phase!=='NIGHT_RESOLVE'&&!(life02RescueDomain(s)&&s.phase==='WITCH_WINDOW'))||s.completed)return [];
 const events:PendingEvent[]=[];
 const wake=(p:Participant,correlationId:string,linked:boolean)=>{
  p.life='ALIVE';p.effects=p.effects.filter(e=>e.kind!==SLEEP_MARK);
  p.effects.push({id:`pending-${correlationId}-${p.playerId}`,kind:WAKE_PUBLIC_PENDING,payload:{round:s.round,correlationId}});
  events.push({eventType:linked?'FULL50_COUPLE_REVIVED':'RC01_HIBERNATION_ENDED',payload:{playerId:p.playerId,round:s.round},visibility:'SERVER_INTERNAL',correlationId});
 };
 for(const p of s.participants){const m=p.effects.find(e=>e.kind===SLEEP_MARK);
  if(p.life!=='HIBERNATING'||!m||Number(m.payload?.wakeRound)>s.round)continue;
  invariant(Number(m.payload?.wakeRound)===s.round,'RULE_UNRESOLVED','Missed LIFE-02 night checkpoint');
  const correlationId=`wake-${m.id}`;wake(p,correlationId,false);
  for(const l of s.links.filter(l=>l.active&&l.type===CUPID_LINK&&l.memberIds.includes(p.playerId))){
   const other=participant(s,l.memberIds.find(x=>x!==p.playerId)!);
   if(other.life==='DEAD_FINAL')wake(other,correlationId,true);
  }
 }
 return events;
}
/** Publish wake notifications only at dawn. V1/V2 retain historical behavior. */
export function wakeLife02(s:GameState):PendingEvent[]{
 if(!life02Domain(s)||s.phase!=='NIGHT_FINALIZE'||s.completed)return [];
 const events:PendingEvent[]=[];
 if(full50Lifecycle(s)){
  for(const p of s.participants){const m=p.effects.find(e=>e.kind===WAKE_PUBLIC_PENDING);if(!m)continue;
   invariant(p.life==='ALIVE'&&p.publicReportedDead&&m.payload?.round===s.round,'RULE_UNRESOLVED','Invalid pending wake publication');
   p.publicReportedDead=false;p.effects=p.effects.filter(e=>e!==m);
   events.push({eventType:'PLAYER_REVIVED',payload:{playerId:p.playerId},visibility:'ROOM_PUBLIC',correlationId:String(m.payload?.correlationId)});
  }return events;
 }
 for(const p of s.participants){const m=p.effects.find(e=>e.kind===SLEEP_MARK);if(p.life!=='HIBERNATING'||!m||Number(m.payload?.wakeRound)>s.round)continue;
  invariant(Number(m.payload?.wakeRound)===s.round,'RULE_UNRESOLVED','Missed LIFE-02 dawn checkpoint');p.life='ALIVE';p.publicReportedDead=false;p.effects=p.effects.filter(e=>e!==m);const correlationId=`wake-${m.id}`;
  events.push({eventType:'RC01_HIBERNATION_ENDED',payload:{playerId:p.playerId,round:s.round},visibility:'SERVER_INTERNAL',correlationId},{eventType:'PLAYER_REVIVED',payload:{playerId:p.playerId},visibility:'ROOM_PUBLIC',correlationId});
 }return events;
}
/** Victory facts for this specific admitted interaction domain. The exact
 * dead-Cupid winner policy is not inferred. Hibernators count (Q13-05). */
export function life02Winners(s:GameState):{ids:string[];predicate:'WV_CHAR_8_SOLE_SURVIVOR'|'WV_VILLAGE_ELIMINATION'|'WV_CUPID_PAIR';sources:string[]}|undefined{
 if(!life02Domain(s)||s.completed||!['NIGHT_FINALIZE','DAY_RESOLVE'].includes(s.phase))return;
 const live=s.participants.filter(p=>p.life==='ALIVE'||p.life==='HIBERNATING'||p.life==='PROLONGED');const link=s.links.find(l=>l.active&&l.type===CUPID_LINK);
 if(link){const cupid=s.participants.find(p=>p.currentCharacterId===27)!;if((full50Life02(s)||live.includes(cupid))&&link.memberIds.every(id=>live.some(p=>p.playerId===id))&&live.every(p=>p.currentWinGroup===link.id))return {ids:live.map(p=>p.playerId),predicate:'WV_CUPID_PAIR',sources:['character.json#27','VH03','Q13-05',...(full50Life02(s)?['WV-CUPID-WIN-DEAD-01']:[])]};return;}
 if(live.length===1&&live[0]!.currentCharacterId===8&&live[0]!.currentFaction==='phe3'&&!live[0]!.winLinks.length)return {ids:[live[0]!.playerId],predicate:'WV_CHAR_8_SOLE_SURVIVOR',sources:['character.json#8','VH03','Q13-05']};
 if(live.length&&live.every(p=>p.currentFaction==='dan'&&!p.winLinks.length))return {ids:s.participants.filter(p=>p.currentFaction==='dan'&&!p.winLinks.length).map(p=>p.playerId),predicate:'WV_VILLAGE_ELIMINATION',sources:['QD-01','character.json#27','VH03','Q13-05']};
}
