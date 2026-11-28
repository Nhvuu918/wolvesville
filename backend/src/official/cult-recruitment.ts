/** Candidate only. Bound at game creation; no retroactive rule activation.
 * The current live domain contains #90, #25, #74, #84 and optionally #28.
 * No unimplemented protection, resurrection or faction-change paths admitted.
 */
import type {GameState,GameAction,Participant,Effect} from '../../../shared/contracts/index.js';
import {isApprovedRuleVersion,RULESET_VERSION} from '../../../shared/contracts/index.js';
import type {RuleRegistry} from '../engine/rules.js';
import {invariant} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {grantCommittedCultChat,revokeSystemChatMember} from './group-chat.js';
import {full50CandidateEnabled} from './life02.js';
import type {EffectOutcome} from '../engine/effects.js';
export const CULT_POLICY='WV-DC-2026-11-25-S27-CULT' as const;
export const FULL50_CULT_POLICY='WV-FULL50-CULT-V2' as const;
export const CULT_RECRUIT='official.90.recruit';
export const CULT_SACRIFICE='official.90.sacrifice';
export const CULT_FACTION='cult';
export const cultDeckIds=(ids:readonly number[])=>['25,74,84,90','25,28,74,84,90'].includes([...ids].sort((a,b)=>a-b).join(','));
export const cultEnabled=()=>process.env.WV_OWNER_CULT_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export function cultDeck(s:GameState):boolean{
 return (s.qaCultPolicy===CULT_POLICY||s.qaCultPolicy===FULL50_CULT_POLICY)&&isApprovedRuleVersion(s.ruleVersion)&&cultDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life)&&[p.initialFaction,CULT_FACTION].includes(p.currentFaction));
}
export function initCult(s:GameState){
 s.qaCultPolicy=full50CandidateEnabled()?FULL50_CULT_POLICY:CULT_POLICY;
 const owner=s.participants.find(p=>p.initialCharacterId===90)!;
 owner.currentFaction=CULT_FACTION; owner.currentWinGroup=`cult:${owner.playerId}`;owner.cultMembership=owner.playerId;
 invariant(cultDeck(s),'RULE_UNRESOLVED','Unsupported cult scope');
}
/** Classification is authoritative at resolution. Never feed this into public
 * target policy. In the admitted roster #28 is an independent winner; no
 * general killer classification is guessed from ATTACK capability. */
export function cultRecruitable(s:GameState,owner:Participant,target:Participant):boolean{
 return owner.life==='ALIVE'&&target.life==='ALIVE'&&target.playerId!==owner.playerId&&target.currentFaction==='dan'&&!target.winLinks.length&&!target.cultMembership&&!target.currentWinGroup&&s.participants.filter(p=>p.playerId!==owner.playerId&&p.cultMembership===owner.playerId&&p.life==='ALIVE').length<5;
}
function validateCult(s:GameState,a:GameAction){invariant(cultDeck(s)&&participant(s,a.playerId).currentCharacterId===90,'RULE_UNRESOLVED','Cult candidate not enabled');invariant(Object.keys(a.payload).length===0,'INVALID_ARGUMENT','Unexpected skill payload');}
export function registerCult(r:RuleRegistry){
 for(const [skillId,count,priority] of [[CULT_RECRUIT,1,120],[CULT_SACRIFICE,2,150]] as const)r.register({characterId:90,skillId,ruleId:skillId===CULT_RECRUIT?'WV-CH90-S01':'WV-CH90-S02',ruleVersion:RULESET_VERSION,priority,phases:['NIGHT_COLLECT'],target:{min:count,max:count,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validateCult,evaluate:(s,a)=>{validateCult(s,a);return [{type:'STATUS',key:skillId,targetId:a.targetIds[0]!}];}});
 return r;
}
/** Only final death revokes membership. Never infer restoration on revival. */
export function cultFinalDeath(s:GameState,id:string):string[]{
 invariant(cultDeck(s),'RULE_UNRESOLVED','Unverified cult death domain');
 const p=participant(s,id);invariant(p.life==='ALIVE','RULE_UNRESOLVED','Cult death target not alive');
 const group=s.systemChatGroups?.find(g=>g.kind==='CULT_DAY');
 const victims=[p,...(p.currentCharacterId===90?s.participants.filter(q=>q.playerId!==id&&q.cultMembership===id&&q.life==='ALIVE'):[])];
 for(const v of victims){v.life='DEAD_FINAL';v.publicReportedDead=true;delete v.cultMembership;if(group&&v.playerId!==group.ownerId&&group.memberIds.includes(v.playerId))revokeSystemChatMember(s,group.id,v.playerId);}
 return victims.map(v=>v.playerId);
}
export function applyCult(s:GameState,e:Effect,a:GameAction):EffectOutcome{
 validateCult(s,a);invariant(s.phase==='NIGHT_RESOLVE'&&e.type==='STATUS'&&e.key===a.skillId&&e.targetId===a.targetIds[0],'RULE_UNRESOLVED','Invalid cult effect');
 const owner=participant(s,a.playerId),target=participant(s,e.targetId);
 if(a.skillId===CULT_RECRUIT){
  const success=cultRecruitable(s,owner,target);
  if(success){grantCommittedCultChat(s,owner.playerId,target.playerId,a.actionId);target.currentFaction=CULT_FACTION;target.currentWinGroup=owner.currentWinGroup;target.cultMembership=owner.playerId;}
  return {type:'CULT_RECRUITMENT_RESOLVED',targetId:target.playerId,payload:{success}};
 }
 // VH50/VH55: validate follower membership at resolution after recruitment.
 // Other sacrifice domains (stacked shields, rescues, independent links) are
 // not admitted by cultDeck; no protection bypass is inferred.
 invariant(a.skillId===CULT_SACRIFICE,'RULE_UNRESOLVED','Unknown cult skill');
 const victim=participant(s,a.targetIds[1]!);
 if(owner.life!=='ALIVE'||target.life!=='ALIVE'||target.cultMembership!==owner.playerId||victim.life!=='ALIVE')return {type:'CULT_SACRIFICE_RESOLVED',targetId:target.playerId,payload:{success:false,deaths:[]}};
 const deaths=[...cultFinalDeath(s,target.playerId),...cultFinalDeath(s,victim.playerId)];
 return {type:'CULT_SACRIFICE_RESOLVED',targetId:target.playerId,payload:{success:true,deaths}};
}
/** Only the approved living-members predicate. Dead follower awards are not
 * specified: signal an unresolved result instead of guessing winnerIds. */
export function cultWin(s:GameState):{winnerIds:string[];unresolvedDeadFollowers:boolean}|undefined{
 if(!cultDeck(s)||s.completed||!['NIGHT_FINALIZE','DAY_RESOLVE'].includes(s.phase))return undefined;
 const owner=s.participants.find(p=>p.currentCharacterId===90&&p.life==='ALIVE');if(!owner)return undefined;
 const living=s.participants.filter(p=>p.life==='ALIVE');if(!living.every(p=>p.cultMembership===owner.playerId&&p.currentFaction===CULT_FACTION&&p.currentWinGroup===owner.currentWinGroup))return undefined;
 // The existing final-death path retains faction and win group, while revoking live chat.
 if(s.qaCultPolicy===FULL50_CULT_POLICY)return {winnerIds:s.participants.filter(p=>p.currentFaction===CULT_FACTION&&p.currentWinGroup===owner.currentWinGroup).map(p=>p.playerId),unresolvedDeadFollowers:false};
 return {winnerIds:living.map(p=>p.playerId),unresolvedDeadFollowers:s.participants.some(p=>p.life==='DEAD_FINAL'&&p.currentWinGroup===owner.currentWinGroup)};
}
