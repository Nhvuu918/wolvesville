/** EXPERIMENTAL V02/V03 vote policy laboratory — NO gameplay/state writes.
 * Unapproved policy versions may NOT be registered by the official game,
 * competitive API, persistence or client. Pure input -> hypothetical review.
 * No code path here emits PLAYER_ELIMINATED, ELIMINATION_AUTHORIZED or winners.
 */
import {KernelError} from '../common/errors.js';
export const RULE_EXPERIMENT_STATUS='UNAPPROVED_RULE_EXPERIMENT' as const;
export type BallotModification =
 |{kind:'INVALIDATE';voterId:string;ruleSource:string}
 |{kind:'FORCE';voterId:string;controllerId:string;ruleSource:string}
 |{kind:'BLOOD_SEAL_EXPERIMENT';voterId:string;targetId:string;ruleSource:string};
export interface ExperimentalVotePolicy {
 version:string;
 status:typeof RULE_EXPERIMENT_STATUS;
 eligibility:{requireLivingVoter:boolean;allowMutedVoter:boolean;allowAbstention:boolean};
 modification:{order:['INVALIDATE','FORCE','BLOOD_SEAL_EXPERIMENT'];invalidatedTerminal:boolean};
 effectiveBallot:{rejectMissingControllerVote:boolean;allowChangeBeforeLock:boolean};
 tie:{mode:'NO_HANG'|'REVOTE_REQUIRED'};
 quorum:{mode:'NONE'|'MAJORITY_ELIGIBLE'};
 hanging:{mode:'TOP_UNIQUE'|'DISABLED'};
 postVote:{mode:'NO_SIDE_EFFECTS'};
}
export interface SandboxAccess {environment:'developer_sandbox'|'production'|'official_test';separateTestStorage:boolean;explicitOptIn:boolean;competitive:boolean}
export interface SandboxVoter {playerId:string;life:'ALIVE'|'DEAD_FINAL'|'PENDING_REVIVAL'|'HIBERNATING'|'PROLONGED';muted?:boolean}
export interface SandboxBallot {voterId:string;targetId:string}
export interface SandboxVoteInput {voters:SandboxVoter[];ballots:SandboxBallot[];modifications:BallotModification[];locked:boolean}
export type SandboxVerdict={status:typeof RULE_EXPERIMENT_STATUS;policyVersion:string;result:'HYPOTHETICAL_HANG'|'NO_HANG'|'REVOTE_REQUIRED'|'BLOCKED';proposedTargetId:string|null;effectiveCounts:Array<{targetId:string;count:number}>;qualifiedBallots:number;eligibleVoters:number;issues:string[];stateCommitted:false;deathAuthorized:false;competitiveMetricEligible:false};
const base:ExperimentalVotePolicy={
 version:'s10-v02v03-exp-B-1',status:RULE_EXPERIMENT_STATUS,
 eligibility:{requireLivingVoter:true,allowMutedVoter:true,allowAbstention:true},
 modification:{order:['INVALIDATE','FORCE','BLOOD_SEAL_EXPERIMENT'],invalidatedTerminal:true},
 effectiveBallot:{rejectMissingControllerVote:true,allowChangeBeforeLock:false},
 tie:{mode:'NO_HANG'},quorum:{mode:'NONE'},hanging:{mode:'TOP_UNIQUE'},postVote:{mode:'NO_SIDE_EFFECTS'}
};
/** Two explicitly *unapproved* source-inspired variants; not official presets. */
export const SANDBOX_POLICIES=Object.freeze({
 B:structuredClone(base),
 A:{...structuredClone(base),version:'s10-v02v03-exp-A-1',modification:{...base.modification,invalidatedTerminal:false},
  quorum:{mode:'MAJORITY_ELIGIBLE' as const}}
});
export function evaluateVoteSandbox(input:SandboxVoteInput,policy:ExperimentalVotePolicy,access:SandboxAccess):SandboxVerdict{
 if(access.environment!=='developer_sandbox'||access.separateTestStorage!==true||access.explicitOptIn!==true||access.competitive!==false)
  throw new KernelError('UNAUTHORIZED','Experimental vote policies require explicit, isolated noncompetitive developer sandbox');
 if(policy.status!==RULE_EXPERIMENT_STATUS||policy.postVote.mode!=='NO_SIDE_EFFECTS'||
    !Object.values(SANDBOX_POLICIES).some(p=>JSON.stringify(p)===JSON.stringify(policy)))
  throw new KernelError('RULE_UNRESOLVED','Unregistered or modified experimental vote policy rejected');
 const issues:string[]=[];
 const viewers=new Map(input.voters.map(p=>[p.playerId,p]));
 if(viewers.size!==input.voters.length)issues.push('DUPLICATE_PLAYER');
 if(!input.locked)issues.push('VOTE_NOT_LOCKED');
 const eligible=(p:SandboxVoter)=>
  (!policy.eligibility.requireLivingVoter||['ALIVE','PROLONGED'].includes(p.life))&&
  (policy.eligibility.allowMutedVoter||!p.muted);
 const eligibleIds=new Set(input.voters.filter(eligible).map(p=>p.playerId));
 const ballots=new Map<string,string|null>();
 for(const b of input.ballots){
  if(!eligibleIds.has(b.voterId)||!eligibleIds.has(b.targetId)){issues.push('INVALID_VOTER_OR_TARGET');continue;}
  if(ballots.has(b.voterId)){issues.push('MULTIPLE_BALLOTS_UNRESOLVED');continue;}
  ballots.set(b.voterId,b.targetId);
 }
 if(!policy.eligibility.allowAbstention&&ballots.size<eligibleIds.size)issues.push('MISSING_BALLOT');
 const invalidated=new Set<string>();
 const grouped={INVALIDATE:[] as BallotModification[],FORCE:[] as BallotModification[],BLOOD_SEAL_EXPERIMENT:[] as BallotModification[]};
 for(const m of input.modifications){
  if(!eligibleIds.has(m.voterId)||!m.ruleSource){issues.push('INVALID_MODIFIER_SOURCE_OR_VOTER');continue;}
  grouped[m.kind].push(m);
 }
 // Controllers are frozen on RAW accepted ballots, never cascading through modifier order.
 const raw=new Map(ballots);
 for(const kind of policy.modification.order){
  const seen=new Set<string>();
  for(const m of grouped[kind]){
   if(seen.has(m.voterId)){issues.push('OVERLAPPING_SAME_PRIORITY');continue;}
   seen.add(m.voterId);
   if(!ballots.has(m.voterId)){issues.push('MODIFIED_MISSING_BALLOT');continue;}
   if(kind==='INVALIDATE') {ballots.set(m.voterId,null);invalidated.add(m.voterId);continue;}
   if(invalidated.has(m.voterId)&&policy.modification.invalidatedTerminal)continue;
   if(m.kind==='FORCE'){
    const controller=raw.get(m.controllerId);
    if(!controller||!eligibleIds.has(m.controllerId)){
     if(policy.effectiveBallot.rejectMissingControllerVote)issues.push('MISSING_VALID_CONTROLLER_BALLOT');
     continue;
    }
    ballots.set(m.voterId,controller);continue;
   }
   if(m.kind==='BLOOD_SEAL_EXPERIMENT'){
    if(!eligibleIds.has(m.targetId)){issues.push('INVALID_SEAL_TARGET');continue;}
    ballots.set(m.voterId,m.targetId);
   }
  }
 }
 const tally=new Map<string,number>();for(const target of ballots.values())if(target)tally.set(target,(tally.get(target)??0)+1);
 const effectiveCounts=[...tally].map(([targetId,count])=>({targetId,count})).sort((a,b)=>b.count-a.count||a.targetId.localeCompare(b.targetId));
 const counted=[...ballots.values()].filter(Boolean).length;
 let result:SandboxVerdict['result']='NO_HANG',proposedTargetId:string|null=null;
 if(issues.length)result='BLOCKED';
 else if(policy.quorum.mode==='MAJORITY_ELIGIBLE'&&counted<=eligibleIds.size/2)result='NO_HANG';
 else if(effectiveCounts.length&&effectiveCounts[0]!.count===(effectiveCounts[1]?.count??0))result=policy.tie.mode==='REVOTE_REQUIRED'?'REVOTE_REQUIRED':'NO_HANG';
 else if(effectiveCounts.length&&policy.hanging.mode==='TOP_UNIQUE'){
  result='HYPOTHETICAL_HANG';proposedTargetId=effectiveCounts[0]!.targetId;
 }
 return {status:RULE_EXPERIMENT_STATUS,policyVersion:policy.version,result,proposedTargetId,effectiveCounts,
  qualifiedBallots:counted,eligibleVoters:eligibleIds.size,issues,stateCommitted:false,deathAuthorized:false,competitiveMetricEligible:false};
}
