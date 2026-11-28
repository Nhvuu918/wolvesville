import {KernelError} from '../common/errors.js';
import {OFFICIAL_VOTING_POLICY} from './official-voting-policy.js';
/** Converts certified #33-only coercion into a PRIVATE vote audit, never a hanging.
 * If a source vote is missing, the final ballot count is indeterminate, not zero.
 */
import type {VoteLedger} from '../../../shared/contracts/index.js';
import type {VoteAudit} from './vote-review.js';
export function auditCertifiedCoercion(v:VoteLedger,raw:VoteAudit):VoteAudit{
 const ds=v.directives??[];
 if(v.invalidatedVoters?.length){
  // No later modifier can restore an invalidated voter. Unsupported overlapping effects fail closed.
  if(ds.length)return {...raw,finalBallotsVerified:false,blockers:[...raw.blockers,'INVALIDATION_CONTROL_CONFLICT']};
  const counts=new Map<string,number>();for(const b of v.intents)if(b.targetId&&!v.invalidatedVoters.includes(b.voterId))counts.set(b.targetId,(counts.get(b.targetId)??0)+1);
  return {...raw,finalBallotsVerified:true,effectiveCounts:[...counts].map(([targetId,count])=>({targetId,count})).sort((a,b)=>b.count-a.count||a.targetId.localeCompare(b.targetId)),appliedDirectives:0};
 }
 if(!ds.length)return {...raw,finalBallotsVerified:true,effectiveCounts:raw.counts,appliedDirectives:0};
 const original=new Map(v.intents.map(b=>[b.voterId,b.targetId]));
 if(ds.some(d=>d.ruleId!=='OFFICIAL_CHAR_33_VOTE_COERCION'||!original.has(d.controllerId)||!original.has(d.voterId))){
  return {...raw,finalBallotsVerified:false,blockers:[...raw.blockers,'VOTE_CONTROLLER_OR_TARGET_BALLOT_MISSING']};
 }
 const final=new Map(original);
 // No overlapping directives can be certified by this narrow single-controller adapter.
 if(new Set(ds.map(d=>d.voterId)).size!==ds.length)
  return {...raw,finalBallotsVerified:false,blockers:[...raw.blockers,'OVERLAPPING_CONTROL_UNCONFIRMED']};
 for(const d of ds)final.set(d.voterId,original.get(d.controllerId)!);
 const tally=new Map<string,number>();for(const target of final.values())if(target)tally.set(target,(tally.get(target)??0)+1);
 return {...raw,finalBallotsVerified:true,appliedDirectives:ds.length,
  effectiveCounts:[...tally].map(([targetId,count])=>({targetId,count})).sort((a,b)=>b.count-a.count||a.targetId.localeCompare(b.targetId))};
}

/** S11 authoritative final-ballot calculation. Legacy diagnostic remains unchanged.
 * A certified invalidation is terminal for that voter, even under #33 coercion.
 * A controller whose own ballot is invalid/blank and overlapping controls lack
 * a complete source rule, so no verdict is returned for those combinations. */
export function reviewOfficialBallots(v:VoteLedger):NonNullable<VoteLedger['officialAudit']>{
 const ballots=v.intents.map(b=>({voterId:b.voterId,targetId:b.targetId,effectiveTargetId:b.targetId,valid:!v.invalidatedVoters?.includes(b.voterId)}));
 const lookup=new Map(ballots.map(b=>[b.voterId,b]));
 if(lookup.size!==ballots.length)throw new KernelError('RULE_UNRESOLVED','Duplicate final ballots');
 const directives=v.directives??[];
 if(new Set(directives.map(d=>d.voterId)).size!==directives.length||directives.some(d=>d.ruleId!=='OFFICIAL_CHAR_33_VOTE_COERCION'))throw new KernelError('RULE_UNRESOLVED','Unverified modifier conflict');
 for(const d of directives){
  const b=lookup.get(d.voterId),controller=lookup.get(d.controllerId);
  if(v.invalidatedVoters?.includes(d.voterId))continue;
  if(!b||!controller||!controller.valid||!controller.targetId||!b.targetId||directives.some(x=>x.voterId===d.controllerId))throw new KernelError('RULE_UNRESOLVED','Unverified coercion interaction');
  b.effectiveTargetId=controller.targetId;
 }
 const tally=new Map<string,number>();
 for(const b of ballots){if(!b.valid){b.effectiveTargetId='';continue;}if(b.effectiveTargetId)tally.set(b.effectiveTargetId,(tally.get(b.effectiveTargetId)??0)+1);}
 return {policyVersion:OFFICIAL_VOTING_POLICY.version,ballots,counts:[...tally].map(([targetId,count])=>({targetId,count})).sort((a,b)=>b.count-a.count||a.targetId.localeCompare(b.targetId))};
}
