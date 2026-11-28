/** Owner-approved core B (unanimity), NOT a published ruleset or live adapter.
 * Scope is built exclusively by trusted server code from a GameState and a
 * server-authorized bite entitlement. The candidate never emits live attacks.
 * VH54, VH74/P04, VH52, VH10, VH41, DEC-BT-01. */
import type {GameState} from '../../../../shared/contracts/index.js';
import {canonical,clone} from '../../common/canonical.js';
import {candidateMatchBinding} from './binding.js';
import {candidateActionBlocked} from './locks.js';
import {APPROVED_RULESET_VERSION} from '../../../../shared/contracts/index.js';
export const PROFILE='owner-bb-candidate-v1' as const;
export interface Entitlement {wolfIds:string[]; targetIds:string[]; maxTargets:1|2; representativeId:string|null}
export interface PackContext {state:GameState; entitlement:Entitlement}
export interface Intent {actorId:string; key:string; targets:string[]; revision:number; kind:'TARGET_SELECTION'|'EMPTY_PENDING'}
export interface CandidateAttack {sourceId:string; targetId:string; index:number; ruleRefs:string[]; candidateOnly:true}
export interface PackResult {kind:'UNANIMOUS'|'NO_CONSENSUS'|'OWNER_APPROVAL_REQUIRED'; unanimousTargets:string[]; commonTargets:string[]; blockers:string[]; candidateAttacks:CandidateAttack[]}
export interface PackState {profile:typeof PROFILE; gameId:string; ruleVersion:string; matchBinding:string; round:number; gameRevision:number; revision:number; locked:boolean; initial:Entitlement; entries:Intent[]; final?:Entitlement; result?:PackResult}
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
 // A fixed representative supplied by the authorized pre-match policy may
 // become ineligible. Do not elect a replacement silently.
 check(e.representativeId===null||s.participants.some(p=>p.playerId===e.representativeId),'INVALID_REPRESENTATIVE');
 return {wolfIds,targetIds,maxTargets:e.maxTargets,representativeId:e.representativeId};
}
function scope(p:PackState,c:PackContext){const e=entitlement(c),s=c.state;check(p.profile===PROFILE&&p.gameId===s.gameId&&p.ruleVersion===s.ruleVersion&&p.round===s.round&&p.matchBinding===candidateMatchBinding(s),'SCOPE_MISMATCH');check(s.revision>=p.gameRevision,'STALE_GAME_SNAPSHOT');check(e.representativeId===p.initial.representativeId,'REPRESENTATIVE_POLICY_CHANGED');return e;}
export function openPack(c:PackContext):PackState{const e=entitlement(c),s=c.state;check(e.wolfIds.length>0,'NO_ELIGIBLE_WOLVES');return {profile:PROFILE,gameId:s.gameId,ruleVersion:s.ruleVersion,matchBinding:candidateMatchBinding(s),round:s.round,gameRevision:s.revision,revision:0,locked:false,initial:e,entries:[]};}
export function submitPack(p:PackState,c:PackContext,authenticatedActorId:string,cmd:PackCommand):{state:PackState;duplicate:boolean}{
 const e=scope(p,c);check(e.wolfIds.includes(authenticatedActorId),'FORBIDDEN');check(typeof cmd.key==='string'&&/^[\w-]{8,128}$/.test(cmd.key),'INVALID_KEY');const targets=ids(cmd.targets);
 const prior=p.entries.find(x=>x.actorId===authenticatedActorId&&x.key===cmd.key);
 if(prior){check(canonical(prior.targets)===canonical(targets),'IDEMPOTENCY_CONFLICT');return {state:p,duplicate:true};}
 check(!p.locked,'PACK_LOCKED');check(cmd.expectedRevision===p.revision,'STALE_REVISION');check(targets.length<=e.maxTargets&&targets.every(t=>e.targetIds.includes(t)),'INVALID_TARGET');
 // Empty is recorded as a distinct observation, never an implicit abstention
 // or permission to bite. Its policy is still pending.
 const revision=p.revision+1;return {state:{...p,revision,gameRevision:c.state.revision,entries:[...p.entries,{actorId:authenticatedActorId,key:cmd.key,targets,revision,kind:targets.length?'TARGET_SELECTION':'EMPTY_PENDING'}]},duplicate:false};
}
export function lockPack(p:PackState,c:PackContext,expectedRevision:number):PackState{
 const e=scope(p,c);check(!p.locked,'PACK_LOCKED');check(expectedRevision===p.revision,'STALE_REVISION');
 const last=new Map<string,Intent>();for(const x of p.entries)last.set(x.actorId,x);
 const choices=e.wolfIds.map(id=>last.get(id));const blockers:string[]=[];
 if(canonical(e.wolfIds)!==canonical(p.initial.wolfIds))blockers.push('MEMBERSHIP_CHANGED_AT_LOCK');
 if(e.maxTargets!==p.initial.maxTargets)blockers.push('TARGET_LIMIT_CHANGED_AT_LOCK');
 if(!choices.length)blockers.push('NO_ELIGIBLE_WOLVES');
 if(choices.some(x=>!x))blockers.push('MISSING_SUBMISSION');
 if(choices.some(x=>x?.targets.length===0))blockers.push('EMPTY_SUBMISSION');
 if(choices.some(x=>x&&(x.targets.length>e.maxTargets||x.targets.some(t=>!e.targetIds.includes(t)))))blockers.push('TARGET_REVOKED');
 const complete=choices.length>0&&choices.every((x):x is Intent=>!!x&&x.targets.length>0&&x.targets.length<=e.maxTargets&&x.targets.every(t=>e.targetIds.includes(t)));
 const commonTargets=complete?choices[0]!.targets.filter(t=>choices.every(x=>x!.targets.includes(t))):[];
 const identical=complete&&choices.every(x=>canonical(x!.targets)===canonical(choices[0]!.targets));
 const unanimousTargets=identical?[...choices[0]!.targets]:[];
 if(complete&&!identical&&commonTargets.length)blockers.push('PARTIAL_MULTI_TARGET_CONSENSUS');
 if(identical&&(!e.representativeId||!e.wolfIds.includes(e.representativeId)))blockers.push('REPRESENTATIVE_UNAVAILABLE');
 if(identical&&unanimousTargets.length===2)blockers.push('TWO_ATTACK_ATTRIBUTION_PENDING');
 const kind=blockers.length?'OWNER_APPROVAL_REQUIRED':identical?'UNANIMOUS':'NO_CONSENSUS';
 const candidateAttacks:CandidateAttack[]=kind==='UNANIMOUS'?unanimousTargets.map((targetId,index)=>({targetId,index,sourceId:e.representativeId!,ruleRefs:['DEC-BT-01','VH54','VH74'],candidateOnly:true})):[];
 return {...p,locked:true,revision:p.revision+1,gameRevision:c.state.revision,final:e,result:{kind,unanimousTargets,commonTargets,blockers,candidateAttacks}};
}
/** No actor IDs of other wolves, membership lists, choices, or audit data. */
export function ownPack(p:PackState,c:PackContext,actorId:string){const e=scope(p,c);check(e.wolfIds.includes(actorId),'FORBIDDEN');const own=p.entries.filter(x=>x.actorId===actorId);return {round:p.round,revision:p.revision,locked:p.locked,latestValidTargets:clone(own.filter(x=>x.kind==='TARGET_SELECTION').at(-1)?.targets??[]),ownEntries:clone(own.map(({actorId:_,...x})=>x))};}
