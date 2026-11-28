import {life02Domain,full50Lifecycle} from './life02.js';
/** Bounded current-rules QA interaction domain. No normal deck certification.
 * character.json#23, NV26 (night shooting), VH06/VH82, LIFE-01.
 * Public death is sticky; private revival does not reuse medium revival.
 */
import {isApprovedRuleVersion,type GameState,type Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import type {PendingEvent} from '../engine/events.js';
export const SOUL_MARK='S17_SOUL_LIFECYCLE', SOUL_SHOT='official.23.shoot', SOUL_AMMO='soulBullets';
export const soulDeckIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,23,25,36';
export function soulDeck(s:GameState){return isApprovedRuleVersion(s.ruleVersion)&&soulDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function soulMark(p:Participant){return p.effects.find(e=>e.kind===SOUL_MARK);}
export function soulStage(p:Participant){return soulMark(p)?.payload?.stage;}
export function soulNoVote(s:GameState,p:Participant){return soulDeck(s)&&p.currentCharacterId===23&&!!soulMark(p);}
export function soulAttackTarget(s:GameState,p:Participant){return p.life==='ALIVE'||soulDeck(s)&&p.currentCharacterId===23&&p.life==='PENDING_REVIVAL';}
/** LIFE-01 / #23: a public death cannot exclude a possible secret survivor.
 * In this bounded QA deck, #8 has one unmetered lethal attempt per night.
 * Admit every other publicly-dead seat identically; resolve only real life.
 * Limited to #8: no assumption about finite-cost blind attacks or votes. */
/** DC-SOUL-01 candidate scope: only the already source-backed #8 night attack.
 * No finite-cost attack is designated here. Per-phase usage is charged by the action ledger. */
export const SOUL_BLIND_QA_SKILLS=Object.freeze(['official.8.night-kill'] as readonly string[]);
export function soulBlindKnightIntent(s:GameState,skillId:string,p:Participant){return (soulDeck(s)||life02Domain(s)&&full50Lifecycle(s))&&SOUL_BLIND_QA_SKILLS.includes(skillId)&&p.publicReportedDead;}
export function soulDeath(s:GameState,p:Participant,actionId:string){
 if(!soulDeck(s)||p.currentCharacterId!==23||!soulAttackTarget(s,p))throw new KernelError('RULE_UNRESOLVED','Invalid soul lifecycle transition');
 const prior=soulMark(p);
 if(!prior){p.life='PENDING_REVIVAL';p.publicReportedDead=true;p.effects.push({id:`soul-${actionId}`,kind:SOUL_MARK,payload:{stage:'PENDING',firstDeathRound:s.round,firstDeathActionId:actionId}});return 'FIRST' as const;}
 if(!['PENDING','REVIVED'].includes(String(prior.payload?.stage)))throw new KernelError('RULE_UNRESOLVED','Soul death already finalized');
 prior.payload={...prior.payload,stage:'FINAL',finalDeathActionId:actionId};p.life='DEAD_FINAL';p.publicReportedDead=true;return 'SECOND' as const;
}
export function openSoulNight(s:GameState){
 if(!soulDeck(s)||s.phase!=='NIGHT_COLLECT'||s.completed)return;
 for(const p of s.participants){const m=soulMark(p);if(p.currentCharacterId===23&&p.life==='PENDING_REVIVAL'&&m?.payload?.stage==='PENDING'&&Number(m.payload.firstDeathRound)<s.round){
  m.payload={...m.payload,stage:'REVIVED',revivedRound:s.round};p.life='ALIVE';p.resources[SOUL_AMMO]=2;
 }}
}
export function soulRevivalEvents(before:GameState,after:GameState):PendingEvent[]{
 if(!soulDeck(after))return [];
 return after.participants.filter(p=>soulStage(p)==='REVIVED'&&soulStage(before.participants.find(x=>x.playerId===p.playerId)!)==='PENDING').map(p=>({eventType:'SOUL_SECRET_REVIVED',payload:{round:after.round,bullets:2},visibility:'PLAYER_PRIVATE',recipientId:p.playerId,correlationId:`soul-revival-${after.round}`}));
}
