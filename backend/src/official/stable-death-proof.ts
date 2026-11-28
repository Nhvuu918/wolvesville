import {life02Domain,SLEEP_MARK,full50Lifecycle,WAKE_PUBLIC_PENDING,PROLONG_ACTIVE,prolongDomain} from './life02.js';
/** Engineering interpretation of VH03: candidate predicates cannot finalize a
 * match until the authoritative death ledger closes every actual death.
 * This validator is for the admitted non-resurrection domains only. It never
 * invents a team victory or a death transition and is independent of deck IDs.
 */
import {soulDeck,soulStage} from './soul-shooter.js';
import type {GameState} from '../../../shared/contracts/index.js';
export type DeathProofEvent={eventType:string;payload:Record<string,unknown>};
export function hasClosedDeathLedger(s:GameState,events:readonly DeathProofEvent[]):boolean {
 if(life02Domain(s)){
  for(const p of s.participants){let stage:'ALIVE'|'PROLONGED'|'SLEEP_ANNOUNCE'|'SLEEP'|'WAKE_ANNOUNCE'|'DEATH_OPEN'|'DEAD_FINAL'='ALIVE';let wakeRound:number|undefined;
   for(const e of events){
    if(e.eventType==='FULL5_PROLONG_STARTED'&&e.payload.playerId===p.playerId){if(!prolongDomain(s)||stage!=='ALIVE')return false;stage='PROLONGED';}
    else if(e.eventType==='FULL5_PROLONG_ENDED'&&e.payload.playerId===p.playerId){if(stage!=='PROLONGED')return false;stage='ALIVE';}
    else if(e.eventType==='RC01_HIBERNATION_STARTED'&&e.payload.playerId===p.playerId){if(stage!=='ALIVE'||!Number.isInteger(e.payload.wakeRound)||Number(e.payload.wakeRound)!==Number(e.payload.round)+1)return false;stage='SLEEP_ANNOUNCE';wakeRound=Number(e.payload.wakeRound);}
    else if(e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId){if(stage==='SLEEP_ANNOUNCE')stage='SLEEP';else if(stage==='ALIVE')stage='DEATH_OPEN';else return false;}
    else if(full50Lifecycle(s)&&e.eventType==='FULL50_HIBERNATION_FATAL'&&e.payload.playerId===p.playerId){if(stage!=='SLEEP')return false;stage='DEATH_OPEN';wakeRound=undefined;}
    else if(e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId){if(stage!=='DEATH_OPEN'||e.payload.pendingEffects!==0)return false;stage='DEAD_FINAL';}
    else if(e.eventType==='RC01_HIBERNATION_ENDED'&&e.payload.playerId===p.playerId){if(stage!=='SLEEP'||e.payload.round!==wakeRound)return false;stage='WAKE_ANNOUNCE';}
    else if(full50Lifecycle(s)&&e.eventType==='FULL50_COUPLE_REVIVED'&&e.payload.playerId===p.playerId){if(stage!=='DEAD_FINAL')return false;stage='WAKE_ANNOUNCE';}
    else if(e.eventType==='PLAYER_REVIVED'&&e.payload.playerId===p.playerId){if(stage!=='WAKE_ANNOUNCE')return false;stage='ALIVE';wakeRound=undefined;}
   }
   const sleep=p.effects.filter(e=>e.kind===SLEEP_MARK);
   if(stage==='ALIVE'){if(p.life!=='ALIVE'||p.publicReportedDead||sleep.length)return false;}
   else if(stage==='PROLONGED'){if(!prolongDomain(s)||p.life!=='PROLONGED'||p.publicReportedDead||sleep.length||p.effects.filter(e=>e.kind===PROLONG_ACTIVE&&e.payload?.round===s.round).length!==1)return false;}
   else if(stage==='SLEEP'){if(p.life!=='HIBERNATING'||!p.publicReportedDead||sleep.length!==1||sleep[0]?.payload?.wakeRound!==wakeRound)return false;}
   else if(stage==='DEAD_FINAL'){if(p.life!=='DEAD_FINAL'||!p.publicReportedDead||sleep.length)return false;}
   else if(stage==='WAKE_ANNOUNCE'&&full50Lifecycle(s)){if(s.phase!=='NIGHT_RESOLVE'||p.life!=='ALIVE'||!p.publicReportedDead||sleep.length||p.effects.filter(e=>e.kind===WAKE_PUBLIC_PENDING&&e.payload?.round===s.round).length!==1)return false;}
   else return false;
   if(stage!=='PROLONGED'&&p.effects.some(e=>e.kind===PROLONG_ACTIVE))return false;
   if(stage!=='WAKE_ANNOUNCE'&&p.effects.some(e=>e.kind===WAKE_PUBLIC_PENDING))return false;
  }return true;
 }
 if(soulDeck(s)){
  for(const p of s.participants){
   const deaths=events.filter(e=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId);
   const closes=events.filter(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0);
   const finals=events.filter(e=>e.eventType==='SOUL_FINAL_DEATH_CLOSED'&&e.payload.victimId===p.playerId);
   const stage=p.currentCharacterId===23?soulStage(p):undefined;
   if(stage){if(deaths.length!==1||closes.length!==1||!p.publicReportedDead)return false;
    if(stage==='PENDING'&& (p.life!=='PENDING_REVIVAL'||finals.length))return false;
    if(stage==='REVIVED'&&(p.life!=='ALIVE'||finals.length))return false;
    if(stage==='FINAL'&&(p.life!=='DEAD_FINAL'||finals.length!==1))return false;
    if(!['PENDING','REVIVED','FINAL'].includes(String(stage)))return false;
   }else if(p.life==='ALIVE'){if(deaths.length||closes.length||finals.length||p.publicReportedDead)return false;}
   else if(p.life!=='DEAD_FINAL'||deaths.length!==1||closes.length!==1||!p.publicReportedDead||finals.length)return false;
  }
  return true;
 }
 if(s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.effects.some(e=>e.kind==='S15_FINAL_REVENGE_PENDING'||e.kind==='S15_DEEP_PRELIMINARY_DEATH'||e.kind==='S15_DEEP_REVIVE_PENDING')))return false;
 // Historical non-revival chains keep their exact prior predicate. A revived
 // participant must have a closed death cycle before each revival, and a
 // subsequent elimination starts a new cycle rather than duplicating death.
 if(events.some(e=>e.eventType==='PLAYER_REVIVED')){
  for(const p of s.participants){let life:'ALIVE'|'DEAD_OPEN'|'DEAD_CLOSED'='ALIVE';
   for(const e of events){
    if(e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId){if(life!=='ALIVE')return false;life='DEAD_OPEN';}
    if(e.eventType==='POST_ELIMINATION_CHAIN_PENDING'&&e.payload.victimId===p.playerId){if(life!=='DEAD_OPEN')return false;}
    if(e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.victimId===p.playerId&&e.payload.pendingEffects===0){if(life!=='DEAD_OPEN')return false;life='DEAD_CLOSED';}
    if(e.eventType==='PLAYER_REVIVED'&&e.payload.playerId===p.playerId){if(life!=='DEAD_CLOSED')return false;life='ALIVE';}
   }
   if(life==='DEAD_OPEN'||(life==='ALIVE')!==(p.life==='ALIVE')||p.publicReportedDead!==(life==='DEAD_CLOSED'))return false;
  }
  return true;
 }
 for(const p of s.participants){
  const deaths=events.flatMap((e,i)=>e.eventType==='PLAYER_ELIMINATED'&&e.payload.playerId===p.playerId?[i]:[]);
  if(p.life==='ALIVE'){if(deaths.length)return false;continue;}
  if(!p.publicReportedDead||deaths.length!==1)return false;
  let lastPending=deaths[0]!,lastClosed=-1;
  events.forEach((e,i)=>{
   if(e.payload.victimId!==p.playerId)return;
   if(e.eventType==='POST_ELIMINATION_CHAIN_PENDING')lastPending=Math.max(lastPending,i);
   if(e.eventType==='POST_ELIMINATION_CHAIN_CLOSED'&&e.payload.pendingEffects===0)lastClosed=i;
  });
  if(lastClosed<=lastPending)return false;
 }
 return true;
}
