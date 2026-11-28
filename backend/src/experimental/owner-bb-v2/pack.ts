import {ownerDc,ownerDcS21} from '../owner-dc-policy.js';
/** Owner-approved core B (unanimity), NOT a published ruleset or live adapter.
 * Scope is built exclusively by trusted server code from a GameState and a
 * server-authorized bite entitlement. The candidate never emits live attacks.
 * VH54, VH74/P04, VH52, VH10, VH41, DEC-BT-01. */
import type {GameState} from '../../../../shared/contracts/index.js';
import {selectRepresentative} from './representative-order.js';
import {canonical,clone} from '../../common/canonical.js';
import {candidateMatchBinding} from '../owner-bb/binding.js';
import {candidateActionBlocked} from '../owner-bb/locks.js';
import {APPROVED_RULESET_VERSION} from '../../../../shared/contracts/index.js';
export const PROFILE='owner-bb-candidate-v2' as const;
export interface Entitlement {wolfIds:string[]; targetIds:string[]; maxTargets:1|2; representativeId:string|null;representativeOrder:string[]}
export interface PackContext {state:GameState; entitlement:Entitlement; blindTargetIntake?:boolean}
export interface Intent {actorId:string; key:string; targets:string[]; revision:number; kind:'TARGET_SELECTION'|'EMPTY_PENDING'|'SECRET_REJECTED'}
export interface CandidateAttack {sourceId:string; targetId:string; index:number; ruleRefs:string[]; candidateOnly:true}
export interface PackResult {kind:'UNANIMOUS'|'NO_CONSENSUS'|'OWNER_APPROVAL_REQUIRED'|'WAITING_FOR_RESPONSES'; unanimousTargets:string[]; commonTargets:string[]; blockers:string[]; candidateAttacks:CandidateAttack[]}
export interface PackState {profile:typeof PROFILE; gameId:string; ruleVersion:string; matchBinding:string; round:number; gameRevision:number; revision:number; locked:boolean; initial:Entitlement; entries:Intent[]; revokedSelections?:number[]; final?:Entitlement; result?:PackResult}
export type PackCommand={key:string;expectedRevision:number;targets:string[]};
const check=(ok:unknown,code:string)=>{if(!ok)throw Error(code);};
const ids=(v:string[])=>{check(Array.isArray(v)&&v.every(x=>typeof x==='string'&&x.length>0)&&new Set(v).size===v.length,'INVALID_IDS');return [...v].sort();};
function entitlement(c:PackContext):Entitlement{
 const {state:s,entitlement:e}=c;
 check(s.ruleVersion===APPROVED_RULESET_VERSION&&!s.completed&&s.phase==='NIGHT_COLLECT','INVALID_GAME_SCOPE');
 check(e.maxTargets===1||e.maxTargets===2,'INVALID_LIMIT');
 const wolfIds=ids(e.wolfIds),targetIds=ids(e.targetIds);
 for(const id of wolfIds){const p=s.participants.find(x=>x.playerId===id);check(p&&p.life==='ALIVE'&&p.currentFaction==='soi'&&!candidateActionBlocked(s,id,p.currentCharacterId===48?'official.48.pack-bite':p.currentCharacterId===93?'official.93.pack-bite':'candidate.pack-bite'),'INVALID_WOLF_ENTITLEMENT');}
 for(const id of targetIds){const p=s.participants.find(x=>x.playerId===id);check(p&&p.life==='ALIVE'&&p.currentFaction!=='soi','INVALID_TARGET_ENTITLEMENT');}
 // BB-03=A: pre-match order is fixed; first currently eligible member represents.
 check(e.representativeId===null||s.participants.some(p=>p.playerId===e.representativeId),'INVALID_REPRESENTATIVE');
 const order=e.representativeOrder;check(Array.isArray(order)&&new Set(order).size===order.length&&order.every(id=>s.participants.some(p=>p.playerId===id))&&wolfIds.every(id=>order.includes(id)),'INVALID_REPRESENTATIVE_ORDER');
 const representativeId=selectRepresentative(order,wolfIds);check(e.representativeId===representativeId,'INVALID_REPRESENTATIVE');return {wolfIds,targetIds,maxTargets:e.maxTargets,representativeId,representativeOrder:[...order]};
}
function scope(p:PackState,c:PackContext){const e=entitlement(c),s=c.state;check(p.profile===PROFILE&&p.gameId===s.gameId&&p.ruleVersion===s.ruleVersion&&p.round===s.round&&p.matchBinding===candidateMatchBinding(s),'SCOPE_MISMATCH');check(s.revision>=p.gameRevision,'STALE_GAME_SNAPSHOT');check(canonical(e.representativeOrder)===canonical(p.initial.representativeOrder),'REPRESENTATIVE_POLICY_CHANGED');return e;}
export function openPack(c:PackContext):PackState{const e=entitlement(c),s=c.state;check(e.wolfIds.length>0,'NO_ELIGIBLE_WOLVES');return {profile:PROFILE,gameId:s.gameId,ruleVersion:s.ruleVersion,matchBinding:candidateMatchBinding(s),round:s.round,gameRevision:s.revision,revision:0,locked:false,initial:e,entries:[]};}
/** Revalidate all latest choices on a trusted snapshot, even if the author
 * temporarily lacks membership. Keep audit history; a later restoration of
 * entitlement must not revive a revoked choice. S21 candidate only, no live
 * mixed-pack enablement; archived candidate journals retain their reducer. */
function refreshRevocations(p:PackState,e:Entitlement):PackState{
 const revoked=new Set(p.revokedSelections??[]),latest=new Map<string,Intent>();
 for(const x of p.entries)if(x.kind==='TARGET_SELECTION')latest.set(x.actorId,x);
 for(const x of latest.values())if(x.targets.length>e.maxTargets||x.targets.some(t=>!e.targetIds.includes(t)))revoked.add(x.revision);
 return revoked.size?( {...p,revokedSelections:[...revoked].sort((a,b)=>a-b)} ):p;
}
export function submitPack(p:PackState,c:PackContext,authenticatedActorId:string,cmd:PackCommand):{state:PackState;duplicate:boolean}{
 const e=scope(p,c);check(e.wolfIds.includes(authenticatedActorId),'FORBIDDEN');check(typeof cmd.key==='string'&&/^[\w-]{8,128}$/.test(cmd.key),'INVALID_KEY');const targets=ids(cmd.targets);
 const prior=p.entries.find(x=>x.actorId===authenticatedActorId&&x.key===cmd.key);
 if(prior){check(canonical(prior.targets)===canonical(targets),'IDEMPOTENCY_CONFLICT');return {state:p,duplicate:true};}
 check(!p.locked,'PACK_LOCKED');check(cmd.expectedRevision===p.revision,'STALE_REVISION');// Structural/public validity is checked at intake. In the mixed profile a
 // faction-dependent rejection is NOT sent back to the client, nor is it a
 // valid choice. An authenticated, syntactically legal request is a response;
 // only actual valid TARGET_SELECTION entries participate in consensus/KEEP.
 const visible=publicPackTargetIds(c.state,authenticatedActorId);
 const publicValid=targets.length<=e.maxTargets&&targets.every(t=>visible.includes(t));
 const legal=targets.length<=e.maxTargets&&targets.every(t=>e.targetIds.includes(t));
 check(c.blindTargetIntake?publicValid:legal,'INVALID_TARGET');
 if(ownerDcS21(c.state))p=refreshRevocations(p,e);
 // BB-01 KEEP: record the empty response without removing the last valid choice.
 const revision=p.revision+1;const {result:_,...unlocked}=p;return {state:{...unlocked,revision,gameRevision:c.state.revision,entries:[...p.entries,{actorId:authenticatedActorId,key:cmd.key,targets,revision,kind:targets.length?(legal?'TARGET_SELECTION':'SECRET_REJECTED'):'EMPTY_PENDING'}]},duplicate:false};
}
export function lockPack(p:PackState,c:PackContext,expectedRevision:number):PackState{
 const e=scope(p,c);check(!p.locked,'PACK_LOCKED');check(expectedRevision===p.revision,'STALE_REVISION');
 if(ownerDcS21(c.state))p=refreshRevocations(p,e);
 const latest=new Map<string,Intent>(),valid=new Map<string,Intent>();for(const x of p.entries){latest.set(x.actorId,x);if(x.kind==='TARGET_SELECTION')valid.set(x.actorId,x);}
 const choices=e.wolfIds.map(id=>valid.get(id));const missing=e.wolfIds.filter(id=>!latest.has(id));
 // DC-PACK-KEEP: never resurrect an earlier choice after revocation. Preserve audit/idempotency entries.
 if(ownerDc(c.state)){
  const revoked=new Set(p.revokedSelections??[]);
  for(const choice of choices)if(choice&&(choice.targets.length>e.maxTargets||choice.targets.some(t=>!e.targetIds.includes(t))))revoked.add(choice.revision);
  const waiting=choices.some(x=>x&&revoked.has(x.revision));
  if(waiting)return {...p,revokedSelections:[...revoked].sort((a,b)=>a-b),gameRevision:c.state.revision,result:{kind:'WAITING_FOR_RESPONSES',blockers:['REPLACEMENT_REQUIRED'],unanimousTargets:[],commonTargets:[],candidateAttacks:[]}};
 }
 // BB-01=B: missing response holds the window. A blank is a response;
 // KEEP retains a prior nonempty selection. No timeout/random fallback.
 const result=(kind:PackResult['kind'],blockers:string[]=[],unanimousTargets:string[]=[],commonTargets:string[]=[],candidateAttacks:CandidateAttack[]=[]):PackResult=>({kind,blockers,unanimousTargets,commonTargets,candidateAttacks});
 if(!e.wolfIds.length)return {...p,gameRevision:c.state.revision,result:result('OWNER_APPROVAL_REQUIRED',['NO_ELIGIBLE_WOLVES'])};
 if(missing.length)return {...p,gameRevision:c.state.revision,result:result('WAITING_FOR_RESPONSES',['MISSING_SUBMISSION'])};
 if(choices.some(x=>x&&(x.targets.length>e.maxTargets||x.targets.some(t=>!e.targetIds.includes(t)))))return {...p,gameRevision:c.state.revision,result:result('OWNER_APPROVAL_REQUIRED',['TARGET_REVOKED'])};
 const complete=choices.every((x):x is Intent=>!!x&&x.targets.length>0);
 const commonTargets=complete?choices[0]!.targets.filter(t=>choices.every(x=>x!.targets.includes(t))):[];
 const identical=complete&&choices.every(x=>canonical(x!.targets)===canonical(choices[0]!.targets));
 const unanimousTargets=identical?[...choices[0]!.targets]:[];
 // BB-02=A: all responded but different full sets (or no valid selection)
 // => no attack. BB-03=A/SAME: choose first currently eligible pre-ranked wolf.
 const candidateAttacks:CandidateAttack[]=identical?unanimousTargets.map((targetId,index)=>({targetId,index,sourceId:e.representativeId!,ruleRefs:['DEC-BT-01','BB-01','BB-02','BB-03','VH54','VH74'],candidateOnly:true})):[];
 return {...p,locked:true,revision:p.revision+1,gameRevision:c.state.revision,final:e,result:result(identical?'UNANIMOUS':'NO_CONSENSUS',[],unanimousTargets,commonTargets,candidateAttacks)};
}
/** Only public death and self-exclusion; no role or faction oracle. */
export function publicPackTargetIds(s:GameState,actorId:string):string[]{return s.participants.filter(p=>!p.publicReportedDead&&p.playerId!==actorId).map(p=>p.playerId);}
/** No actor IDs of other wolves, membership lists, choices, or audit data. */
export function ownPack(p:PackState,c:PackContext,actorId:string){const e=scope(p,c);check(e.wolfIds.includes(actorId),'FORBIDDEN');const own=p.entries.filter(x=>x.actorId===actorId);return {round:p.round,revision:p.revision,locked:p.locked,waitingForResponses:p.result?.kind==='WAITING_FOR_RESPONSES'&&e.wolfIds.some(id=>!p.entries.some(x=>x.actorId===id)||(!c.blindTargetIntake&&ownerDc(c.state)&&p.revokedSelections?.includes(p.entries.filter(x=>x.actorId===id&&x.kind==='TARGET_SELECTION').at(-1)?.revision??-1))),...(c.state.qaBbPolicyVersion?{pendingParticipantCount:e.wolfIds.filter(id=>!p.entries.some(x=>x.actorId===id)).length}:{}),...(c.blindTargetIntake?{targetReceiptOnly:true,latestSubmittedTargets:clone(own.filter(x=>x.targets.length>0).at(-1)?.targets??[]),ownEntries:clone(own.map(({actorId:_,kind:__,...x})=>x))}:{latestValidTargets:clone(own.filter(x=>x.kind==='TARGET_SELECTION').slice(-1).filter(x=>!p.revokedSelections?.includes(x.revision)).at(-1)?.targets??[]),ownEntries:clone(own.map(({actorId:_,...x})=>x))})};}
