import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** #19 Giao kèo Lá Phiếu / NV21: anonymous offer, immediate voluntary response.
 * One contract type per match. Only the ballot contract is implemented.
 * No punishment, self-contract or three-contract victory is inferred. */
import {RULESET_VERSION,type GameState,type GameAction,type Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const CONTRACT_SKILL={offer:'official.19.ballot-offer',accept:'official.19.ballot-accept',decline:'official.19.ballot-decline'} as const;
export const CONTRACT_MARK='S15_BREAK_BALLOT_CONTRACT';
export function isContractDeck(s:GameState){return isModernRuleVersion(s.ruleVersion)&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='19,25,28'&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function contractOfferReady(s:GameState,id:string){return isContractDeck(s)&&participant(s,id).currentCharacterId===19&&!s.participants.some(p=>p.effects.some(e=>e.kind===CONTRACT_MARK));}
function currentOffer(s:GameState,id:string){return participant(s,id).effects.find(e=>e.kind===CONTRACT_MARK&&e.payload?.round===s.round&&e.payload.status==='OFFERED');}
export function contractResponseReady(s:GameState,id:string){return isContractDeck(s)&&s.phase==='NIGHT_COLLECT'&&!!currentOffer(s,id);}
export function validateContract(s:GameState,a:GameAction){if(!isContractDeck(s)||s.phase!=='NIGHT_COLLECT')throw new KernelError('RULE_UNRESOLVED','Contract outside certified domain');
 if(a.skillId===CONTRACT_SKILL.offer){if(!contractOfferReady(s,a.playerId)||a.targetIds.length!==2||a.targetIds[0]===a.playerId)throw new KernelError('TARGET_INVALID','Contract unavailable or invalid recipient');}
 else if(![CONTRACT_SKILL.accept,CONTRACT_SKILL.decline].includes(a.skillId as any)||!currentOffer(s,a.playerId)||a.targetIds.length)throw new KernelError('RULE_UNRESOLVED','No pending contract response');
}
export function isImmediateContract(skill:string){return Object.values(CONTRACT_SKILL).some(s=>s===skill);}
export function applyContract(s:GameState,a:GameAction){validateContract(s,a);
 if(a.skillId===CONTRACT_SKILL.offer){const recipient=participant(s,a.targetIds[0]!);recipient.effects.push({id:`ballot-contract-${a.actionId}`,kind:CONTRACT_MARK,sourceId:a.playerId,payload:{round:s.round,targetId:a.targetIds[1],status:'OFFERED'}});return [{eventType:'S15_BREAK_BALLOT_OFFER',recipientId:recipient.playerId,payload:{targetId:a.targetIds[1],round:s.round}}];}
 const offer=currentOffer(s,a.playerId)!;const status=a.skillId===CONTRACT_SKILL.accept?'ACCEPTED':'DECLINED';offer.payload={...offer.payload,status};return [{eventType:'S15_BREAK_BALLOT_RESPONSE',recipientId:a.playerId,payload:{status,round:s.round}},{eventType:'S15_BREAK_BALLOT_RESPONSE',recipientId:offer.sourceId!,payload:{status,round:s.round}}];
}
/** Use only the final valid official ballot (V02/V03). An invalid/changed ballot
 * cannot satisfy the agreement. The anonymous source never enters public events. */
export function contractPreventsHanging(s:GameState,target:Participant){if(!isContractDeck(s))return false;const mark=target.effects.find(e=>e.kind===CONTRACT_MARK&&e.payload?.round===s.round&&e.payload.status==='ACCEPTED');if(!mark)return false;return !!s.voting?.officialAudit?.ballots.some(b=>b.voterId===target.playerId&&b.valid&&b.effectiveTargetId===mark.payload?.targetId);}
/** Record whether the agreement was fulfilled, even if its recipient was not
 * selected for hanging. This is not a new victory or punishment predicate. */
export function settleBallotContract(s:GameState){
 if(!isContractDeck(s))return [];
 const results:Array<{eventType:string;recipientId:string;payload:Record<string,unknown>}>=[];
 for(const p of s.participants)for(const mark of p.effects.filter(e=>e.kind===CONTRACT_MARK&&e.payload?.round===s.round&&e.payload.status==='ACCEPTED')){
  const status=s.voting?.officialAudit?.ballots.some(b=>b.voterId===p.playerId&&b.valid&&b.effectiveTargetId===mark.payload?.targetId)?'FULFILLED':'BREACHED';
  mark.payload={...mark.payload,status};
  for(const recipientId of [p.playerId,mark.sourceId!])results.push({eventType:'S15_BREAK_BALLOT_SETTLED',recipientId,payload:{status,round:s.round}});
 }
 return results;
}
