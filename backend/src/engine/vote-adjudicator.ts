/** Sprint 08 gameplay: official vote-outcome adjudication, NOT a generic hanging rule.
 * PH-02 / Q13-09: #79 cancelling an actual open day vote means there is no
 * final valid vote and no elimination from THIS vote. V02/V03 are unresolved,
 * therefore raw ballot leaders can NEVER be promoted to a hanging target.
 */
import {soulDeck,soulNoVote} from '../official/soul-shooter.js';
import type {GameState,VoteLedger} from '../../../shared/contracts/index.js';
import {isS15VoteBlocked} from '../official/s13-mechanics.js';
import {KernelError} from '../common/errors.js';
import {auditRawBallots} from './vote-review.js';
import {auditCertifiedCoercion,reviewOfficialBallots} from './vote-control-review.js';

export function resolveCertifiedCancellation(s:GameState,actorId:string):NonNullable<VoteLedger['outcome']>{
 const actor=s.participants.find(p=>p.playerId===actorId);
 if(!['DAY_RESOLVE','DAY_VOTE_COLLECT'].includes(s.phase)||s.voting?.status!=='OPEN'||s.voting.round!==s.round||actor?.currentCharacterId!==79)
  throw new KernelError('RULE_UNRESOLVED','PH-02 cancellation prerequisites not met');
 return {kind:'CANCELLED_NO_ELIMINATION',sourceRules:['character.json#79','PH-02','Q13-09'],noElimination:true,resolvedAtRound:s.round};
}
export function closeWithoutOfficialBallotRule(voting:VoteLedger):Pick<VoteLedger,'review'|'outcome'>{
 if(voting.status!=='OPEN')throw new KernelError('OUT_OF_PHASE','Vote is not open');
 return {review:auditCertifiedCoercion(voting,auditRawBallots(voting.intents)),outcome:{kind:'ADJUDICATION_UNRESOLVED',
   sourceRules:['VH01','V02_UNCONFIRMED','V03_UNCONFIRMED'],noElimination:false,resolvedAtRound:voting.round}};
}
/** Never conclude a hanging target from raw counts. For any future vote deck,
 * an entirely new source-backed final-ballot policy must be registered first. */
export function certifiedVoteEliminationTarget(voting:VoteLedger):null {
 if(voting.status==='CANCELLED' && voting.outcome?.kind==='CANCELLED_NO_ELIMINATION')return null;
 if(voting.status==='CLOSED_UNRESOLVED')throw new KernelError('RULE_UNRESOLVED','Final ballot transform and tie policy are unconfirmed');
 throw new KernelError('OUT_OF_PHASE','No final certified voting result exists');
}

/** Owner-confirmed S11. This produces authorization, not a committed death. */
export function adjudicateOfficialVote(s:GameState):{outcome:NonNullable<VoteLedger['outcome']>;audit:NonNullable<VoteLedger['officialAudit']>}{
 const v=s.voting!;
 if(!v||v.status!=='OPEN'||v.round!==s.round||s.phase!=='DAY_VOTE_COLLECT'||s.votingPolicy!=='S11_OFFICIAL_V1')throw new KernelError('RULE_UNRESOLVED','Official policy not enabled');
 const eligible=(id:string)=>s.participants.some(p=>p.playerId===id&&['ALIVE','PROLONGED'].includes(p.life));
 if(v.intents.some(b=>!eligible(b.voterId)||s.participants.some(p=>p.playerId===b.voterId&&soulNoVote(s,p))||isS15VoteBlocked(s,b.voterId)||(b.targetId!==''&&(!eligible(b.targetId)||soulDeck(s)&&s.participants.some(p=>p.playerId===b.targetId&&p.publicReportedDead)))))throw new KernelError('RULE_UNRESOLVED','Ballot eligibility changed');
 const audit=reviewOfficialBallots(v),counts=audit.counts;
 const leaders=counts.filter(x=>x.count===counts[0]?.count);
 const base={sourceRules:['S11-V02','S11-V03'],resolvedAtRound:s.round};
 if(!leaders.length)return {audit,outcome:{...base,kind:'NO_HANGING_ZERO',noElimination:true}};
 if(leaders.length>1)return {audit,outcome:{...base,kind:'NO_HANGING_TIE',noElimination:true}};
 const target=s.participants.find(p=>p.playerId===leaders[0]!.targetId);
 if(!target||target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Unverified hanging target');
 return {audit,outcome:{...base,kind:'HANGING_AUTHORIZED',noElimination:false,targetId:target.playerId}};
}
