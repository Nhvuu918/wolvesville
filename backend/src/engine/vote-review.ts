/** Raw ballot audit only. Source V02/V03 is a design proposal with unanswered
 * V03 question, not a fully confirmed rule; NEVER elect a hanging target here.
 * Persisted inside server-private Kernel State, absent from client projection.
 */
import type {VoteIntent} from '../../../shared/contracts/index.js';
export interface VoteAudit {schemaVersion:1;ballots:number;counts:Array<{targetId:string;count:number}>;
 highest:number;leaders:string[];equalTop:boolean;adjudication:'RULE_UNRESOLVED';
 blockers:string[];finalBallotsVerified?:boolean;effectiveCounts?:Array<{targetId:string;count:number}>;appliedDirectives?:number;}
export function auditRawBallots(intents:readonly VoteIntent[]):VoteAudit {
 const tally=new Map<string,number>();
 for(const b of intents)if(b.targetId)tally.set(b.targetId,(tally.get(b.targetId)||0)+1);
 const counts=[...tally].map(([targetId,count])=>({targetId,count})).sort((a,b)=>b.count-a.count||a.targetId.localeCompare(b.targetId));
 const highest=counts[0]?.count??0,leaders=counts.filter(x=>x.count===highest).map(x=>x.targetId);
 return {schemaVersion:1,ballots:intents.length,counts,highest,leaders,equalTop:leaders.length>1,
  adjudication:'RULE_UNRESOLVED',blockers:['V02_FINAL_BALLOT_TRANSFORMATION','V03_TIE_AND_NO_VOTE','HANGING_AND_POST_DEATH_CHAIN']};
}
