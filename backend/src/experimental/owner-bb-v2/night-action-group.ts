/** WV-RD-BB-2026-01 Art. 4–5. Persisted in the same archive transaction as
 * resolved effects. Earlier windows resolve dependencies immediately; the
 * mark remains active until dawn so subsequent windows are also inverted.
 * No new mapping of an unsupported skill is authorized by this ledger. */
import type {GameAction,GameState,Status,NightActionGroup} from '../../../../shared/contracts/index.js';
import type {PendingEvent} from '../../engine/events.js';
import {invariant} from '../../common/errors.js';
import {participant} from '../../engine/state.js';
export const BB_FINAL_POLICY='WV-RD-BB-2026-01';
const MARK='S15_ENGINEER_TRAP';
export const groupedNight=(s:GameState)=>s.qaBbPolicyVersion===BB_FINAL_POLICY&&s.qaProfile==='owner-bb-live-trap-qa-v1';
export const groupWindow=(s:GameState)=>s.phase==='WITCH_WINDOW'?(s.qaNightWindow??'WITCH_COMBINED'):s.phase;
export function recordNightAction(s:GameState,a:GameAction,mark:Status,events:PendingEvent[],windowId=groupWindow(s)){
 invariant(groupedNight(s)&&['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase)&&a.round===s.round&&a.gameId===s.gameId&&a.ruleVersion===s.ruleVersion,'RULE_UNRESOLVED','Invalid night-group scope');
 invariant(participant(s,a.playerId).effects.some(e=>e.id===mark.id&&e.kind===MARK),'RULE_UNRESOLVED','Night-group mark missing');
 const groups=s.qaNightGroups??=[];let g=groups.find(x=>x.trapId===mark.id);
 if(!g){g={gameId:s.gameId,ruleVersion:s.ruleVersion,policy:BB_FINAL_POLICY,round:s.round,actorId:a.playerId,trapId:mark.id,sourceId:mark.sourceId??'',status:'OPEN',actions:[]};groups.push(g);}
 invariant(g.status==='OPEN'&&g.round===s.round&&g.actorId===a.playerId&&!g.actions.some(x=>x.actionId===a.actionId),'IDEMPOTENCY_CONFLICT','Night-group action already resolved or closed');
 g.actions.push({actionId:a.actionId,skillId:a.skillId,windowId,phase:s.phase,resolvedAtRevision:s.revision+1,targetIds:[...a.targetIds]});
 events.push({eventType:'BB_QA_NIGHT_GROUP_ACTION',payload:{trapId:mark.id,round:s.round,actorId:a.playerId,windowId,actionId:a.actionId,skillId:a.skillId},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
}
/** A split rescue window can determine an irreversible death before the next
 * collection window. Keep the internal life state, but defer public notice to
 * dawn (W04/L02, reference §3.2 step 12). The admitted deck has no death links. */
export function deferInvertedRescueDeath(s:GameState,victimId:string,actionId:string,events:PendingEvent[]){
 const p=participant(s,victimId);invariant(groupedNight(s)&&s.phase==='WITCH_WINDOW'&&p.life==='DEAD_FINAL'&&p.publicReportedDead,'RULE_UNRESOLVED','Invalid deferred death');
 const list=s.qaDeferredNightDeaths??=[];invariant(!list.some(d=>d.victimId===victimId),'RULE_UNRESOLVED','Duplicate deferred death');
 p.publicReportedDead=false;list.push({victimId,actionId,round:s.round});events.push({eventType:'BB_QA_DEFERRED_DEATH',payload:{victimId,round:s.round,actionId},visibility:'SERVER_INTERNAL',correlationId:actionId});
}
export function closeNightGroups(s:GameState,events:PendingEvent[]){
 if(!groupedNight(s))return;
 invariant(s.phase==='NIGHT_FINALIZE','RULE_UNRESOLVED','Night group closes only at finalization');
 for(const g of s.qaNightGroups??[]){if(g.status==='CLOSED')continue;
  invariant(g.round===s.round&&g.actions.length>0,'RULE_UNRESOLVED','Invalid pending night group');
  const actor=participant(s,g.actorId);invariant(actor.effects.some(e=>e.id===g.trapId&&e.kind===MARK),'RULE_UNRESOLVED','Cannot close group without its mark');
  actor.effects=actor.effects.filter(e=>e.id!==g.trapId);g.status='CLOSED';
  events.push({eventType:'BB_QA_TRAP_CONSUMED',payload:{markId:g.trapId,actionIds:g.actions.map(a=>a.actionId),windows:[...new Set(g.actions.map(a=>a.windowId))],round:s.round},visibility:'SERVER_INTERNAL',correlationId:`bb-night-group-${g.trapId}`});
 }
 for(const d of s.qaDeferredNightDeaths??[]){
  const p=participant(s,d.victimId);invariant(d.round===s.round&&p.life==='DEAD_FINAL'&&!p.publicReportedDead,'RULE_UNRESOLVED','Invalid deferred death closure');
  p.publicReportedDead=true;events.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:d.victimId},visibility:'ROOM_PUBLIC',correlationId:d.actionId},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:d.victimId,pendingEffects:0,ruleId:'BB-04/INVERTED_RESCUE',sourceRules:['character.json#10','BB-04','BB-05','VH03','W04','L02']},visibility:'SERVER_INTERNAL',correlationId:d.actionId});
 }
 delete s.qaDeferredNightDeaths;delete s.qaNightWindow;
}
