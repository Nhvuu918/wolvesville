/** Partial, source-grounded victory facts. NOT a match-completion engine.
 * Sources: character.json#28, VH03, VH06/VH82, Q13-05.
 * A derived event MUST be from committed authoritative day-vote resolution.
 * This module is not wired to complete matches because official voting is not yet implemented.
 */
import {soulDeck} from './soul-shooter.js';
import {isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import type {GameState} from '../../../shared/contracts/index.js';
export type VictoryFact = {
  playerId:string;predicateId:string;ruleSources:string[];
  conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN';
};
export type AuthoritativeVictoryTrigger = {
  type:'HANGING_FINALIZED';playerId:string;committed:boolean;
};
export function evaluateVerifiedVictoryFacts(s:GameState,triggers:readonly AuthoritativeVictoryTrigger[]):VictoryFact[]{
 const facts:VictoryFact[]=[];
 if(s.completed)return facts;
 for(const event of triggers){
  if(event.type==='HANGING_FINALIZED' && event.committed){
   const player=s.participants.find(p=>p.playerId===event.playerId);
   if(player?.currentCharacterId===28){
    if(!facts.some(f=>f.playerId===player.playerId))facts.push({
      playerId:player.playerId,predicateId:'WV_CHAR_28_HANGED_WIN',
      ruleSources:['character.json#28','VH03'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'
    });
   }
  }
 }
 return facts;
}
/** Pure arithmetic input to a future faction victory evaluator, never an auto-win. */
export function countsTowardFaction(s:GameState,playerId:string):boolean {
 const p=s.participants.find(x=>x.playerId===playerId);if(!p)return false;
 if(p.life==='ALIVE'||p.life==='PROLONGED'||p.life==='HIBERNATING')return true;
 if(p.life==='PENDING_REVIVAL'&&p.currentFaction==='dan')return true;
 return false;
}

/** Kỵ Sĩ Không Đầu #8: verified sole-survivor fact (character.json#8).
 * Do not finalize while post-death reactions / simultaneous winner resolution
 * are unknown. This is pure; no state change, no endgame event. */
export function evaluateVerifiedSoleSurvivorFacts(s:GameState):VictoryFact[] {
 if(s.completed)return [];
 const alive=s.participants.filter(p=>p.life==='ALIVE'||p.life==='PROLONGED'||p.life==='HIBERNATING'||p.life==='PENDING_REVIVAL');
 if(alive.length!==1||alive[0]?.currentCharacterId!==8)return [];
 return [{playerId:alive[0].playerId,predicateId:'WV_CHAR_8_SOLE_SURVIVOR',
  ruleSources:['character.json#8','VH03','VH06','Q13-05'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'}];
}
/** #15 and #58 explicitly share the sole-survivor predicate with #8.
 * This is a candidate evaluator, not a grant of permission to play any deck.
 * Caller still certifies death-chain closure and applicable interaction scope. */
export function evaluateExplicitSoleSurvivorFacts(s:GameState,allowed:readonly number[]):VictoryFact[]{
 if(s.completed||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)))return [];
 const living=s.participants.filter(p=>p.life==='ALIVE');
 if(living.length!==1||!allowed.includes(living[0]!.currentCharacterId))return [];
 const p=living[0]!,id=p.currentCharacterId;
 if(id===8)return evaluateVerifiedSoleSurvivorFacts(s);
 if(id!==15&&id!==58)return [];
 return [{playerId:p.playerId,predicateId:`S15_CHAR_${id}_SOLE_SURVIVOR`,ruleSources:[`character.json#${id}`,'VH03','WIN-01'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'}];
}
/** #8 is immune to being hanged while any wolf is counted alive. Source character.json#8.
 * Pure guard only: never create a vote winner or apply a hanging event. */
export function canHangHeadlessKnight(s:GameState,playerId:string):boolean {
 const target=s.participants.find(p=>p.playerId===playerId);
 if(!target||target.currentCharacterId!==8)return true;
 return !s.participants.some(p=>p.playerId!==playerId&&p.currentFaction==='soi'&&countsTowardFaction(s,p.playerId));
}

/** QD-01: faction victory uses current membership, including dead teammates.
 * Unknown living independent roles conservatively contest; active revival/link
 * domains require their own closure proof. All-village training decks never
 * had an opponent to eliminate and are not competitive matches. */
export function evaluateApprovedVillageVictory(s:GameState):VictoryFact[]{
 if(!isApprovedRuleVersion(s.ruleVersion)||s.completed||!['DAY_RESOLVE','NIGHT_FINALIZE'].includes(s.phase)||s.participants.some(p=>!['ALIVE','DEAD_FINAL',...(soulDeck(s)?['PENDING_REVIVAL']:[])].includes(p.life)||p.winLinks.length)||s.links.some(l=>l.active))return [];
 if(!s.participants.some(p=>p.initialFaction!=='dan'||p.currentFaction!=='dan'))return [];
 const counted=s.participants.filter(p=>countsTowardFaction(s,p.playerId));
 if(!counted.some(p=>p.currentFaction==='dan')||counted.some(p=>p.currentFaction!=='dan'))return [];
 return s.participants.filter(p=>p.currentFaction==='dan').map(p=>({playerId:p.playerId,predicateId:'WV_VILLAGE_ELIMINATION',ruleSources:['WV-RULE-DECISION-2026-11-25-001/QD-01','VH03','VH58'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'}));
}
