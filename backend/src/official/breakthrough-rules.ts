import {isModernRuleVersion} from '../../../shared/contracts/index.js';
import {isFinalPackDeck} from './final-pack.js';
/** Sprint 15 breakthrough: hanging is a selection, not a death. Source #8,
 * #55, #28, VH03/VH58, WIN-03. New QA decks only; no invented pack action.
 * Stone's ordinary-wolf state is represented by a durable spent marker, not
 * a fabricated character ID. No conflicting protection ordering is inferred. */
import {isContractDeck,contractPreventsHanging} from './ballot-contract.js';
import {RULESET_VERSION,type GameState,type GameAction,type Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {canHangHeadlessKnight,countsTowardFaction,type VictoryFact} from './victory-predicates.js';
export const STONE_SKILL='official.55.stone-protection';
export const STONE_LAYER='S15_BREAK_STONE_LAYER';
export const STONE_SPENT='S15_BREAK_STONE_SPENT';
export const EXILE_DOLL_SKILL='official.94.effigy';
export const EXILE_DOLL='S15_BREAK_EFFIGY';
export const EXILE_TRANSITION='S15_BREAK_EXILE_ALIGNMENT';
const key=(s:GameState)=>s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');
export function isBreakStoneDeck(s:GameState):boolean{return isModernRuleVersion(s.ruleVersion)&&['25,28,55','8,25,55','8,25,28,55'].includes(key(s))&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function isBreakExileDeck(s:GameState):boolean{return isModernRuleVersion(s.ruleVersion)&&(key(s)==='8,25,93,94'||isFinalPackDeck(s))&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&!p.winLinks.length&&(p.currentFaction===p.initialFaction||(p.currentCharacterId===93&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind===EXILE_TRANSITION))));}
export function stoneReady(s:GameState,id:string){const p=participant(s,id);return isBreakStoneDeck(s)&&p.currentCharacterId===55&&p.life==='ALIVE'&&!p.effects.some(e=>e.kind===STONE_SPENT);}
export function validateStone(s:GameState,a:GameAction){if(!stoneReady(s,a.playerId)||a.targetIds.length!==1||participant(s,a.targetIds[0]!).life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Stone protection unavailable');}
export function placeStone(s:GameState,a:GameAction){validateStone(s,a);const p=participant(s,a.targetIds[0]!);p.effects.push({id:`stone-layer-${a.actionId}`,kind:STONE_LAYER,sourceId:a.playerId,expiresAtRound:s.round+1,payload:{round:s.round}});}
export type HangingBlock={ruleId:string;ownerId?:string};
/** Pure selection then transactional consumption. No vote is revived. The selected
 * candidate is not replaced by the runner-up. #55 explicitly includes hanging. */
export function evaluateHangingImmunity(s:GameState,target:Participant):HangingBlock|null{
 if(!isBreakStoneDeck(s)&&!isContractDeck(s))return null;
 if(s.phase!=='DAY_RESOLVE'||s.voting?.outcome?.kind!=='HANGING_AUTHORIZED'||s.voting.outcome.targetId!==target.playerId||target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Invalid hanging immunity context');
 if(isContractDeck(s))return contractPreventsHanging(s,target)?{ruleId:'character.json#19'}:null;
 const layers=target.effects.filter(e=>e.kind===STONE_LAYER&&e.payload?.round===s.round&&e.expiresAtRound===s.round+1);
 const immune=!canHangHeadlessKnight(s,target.playerId);
 if(layers.length>1||(immune&&layers.length))throw new KernelError('RULE_UNRESOLVED','Competing hanging immunities need verified precedence');
 if(immune)return {ruleId:'character.json#8'};
 if(!layers.length)return null;
 const layer=layers[0]!,owner=participant(s,layer.sourceId!);
 if(owner.currentCharacterId!==55||owner.life!=='ALIVE'||owner.effects.some(e=>e.kind===STONE_SPENT))throw new KernelError('RULE_UNRESOLVED','Unverified post-death or already-spent stone protection');
 target.effects=target.effects.filter(e=>e.id!==layer.id);
 owner.effects.push({id:`stone-spent-${layer.id}`,kind:STONE_SPENT,payload:{round:s.round,sourceRule:'character.json#55'}});
 return {ruleId:'character.json#55',ownerId:owner.playerId};
}
/** WIN-03 + VH58. This reusable arithmetic predicate is deliberately separate
 * from the certified-domain and stable-death gates. It does not establish dead
 * wolf winner membership or village victory. */
export function evaluateStableWolfParity(s:GameState):VictoryFact[]{
 if(s.completed||s.links.some(l=>l.active)||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)||p.winLinks.length))return [];
 const living=s.participants.filter(p=>countsTowardFaction(s,p.playerId));
 if(living.some(p=>p.currentFaction==='phe3'||!['dan','soi'].includes(p.currentFaction)))return [];
 const wolves=living.filter(p=>p.currentFaction==='soi'),village=living.filter(p=>p.currentFaction==='dan');
 // Dead wolf membership has not been certified. Do not invent a winner set.
 if(!wolves.length||wolves.length<village.length||s.participants.some(p=>p.currentFaction==='soi'&&p.life==='DEAD_FINAL'))return [];
 return wolves.map(p=>({playerId:p.playerId,predicateId:'WV_WOLF_PARITY',ruleSources:['WIN-03','VH03','VH58'],conclusion:'CONDITION_MET_PENDING_END_OF_CHAIN'}));
}
export function breakContinuation(s:GameState):boolean{
 if(isBreakExileDeck(s)&&!isFinalPackDeck(s)&&s.participants.some(p=>p.effects.some(e=>e.kind===EXILE_TRANSITION)))return false; // new pack action unresolved
 const live=s.participants.filter(p=>p.life==='ALIVE');return live.length>1&&live.some(p=>p.currentFaction==='phe3'||p.currentFaction==='soi');
}
export function validateEffigy(s:GameState,a:GameAction){if(!isBreakExileDeck(s)||a.targetIds.length!==1||participant(s,a.playerId).life!=='ALIVE'||participant(s,a.targetIds[0]!).life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Effigy unavailable');
 // Any living target is valid; no role-dependent rejection may reveal the pair.
}
export function placeEffigy(s:GameState,a:GameAction){validateEffigy(s,a);participant(s,a.playerId).effects.push({id:`effigy-${a.actionId}`,kind:EXILE_DOLL,expiresAtRound:s.round,payload:{targetId:a.targetIds[0]}});}
/** #94 sends the lethal blow to the doll, not a second independent attack.
 * No protection or competing redirect is admitted by this new deck. */
export function resolveEffigy(s:GameState,target:Participant):Participant|null{
 if(!isBreakExileDeck(s)||target.currentCharacterId!==93||s.phase!=='NIGHT_RESOLVE')return null;
 const owner=s.participants.find(p=>p.currentCharacterId===94&&p.life==='ALIVE');const marks=owner?.effects.filter(e=>e.kind===EXILE_DOLL&&e.expiresAtRound===s.round)??[];
 if(!marks.length)return null;
 if(marks.length!==1)throw new KernelError('RULE_UNRESOLVED','Ambiguous effigy');
 const actual=participant(s,String(marks[0]!.payload?.targetId));
 if(actual.life!=='ALIVE'||actual.winLinks.length)throw new KernelError('RULE_UNRESOLVED','Unverified effigy recipient');
 if(actual.playerId===target.playerId)return null; // identity redirect is not a recursive attack
 actual.life='DEAD_FINAL';actual.publicReportedDead=true;return actual;
}
/** #93 changes faction, NOT character ID/aura. The pack's next action and
 * post-conversion aura require distinct rules. This function does not grant them. */
export function transitionExileAfterDeath(s:GameState,victimId:string):Participant|null{
 if(!isBreakExileDeck(s)||!s.participants.some(p=>p.playerId===victimId&&p.currentCharacterId===94&&p.life==='DEAD_FINAL'))return null;
 const exile=s.participants.find(p=>p.currentCharacterId===93&&p.life==='ALIVE'&&p.currentFaction==='phe3');if(!exile)return null;
 exile.currentFaction='soi';exile.effects.push({id:`exile-transition-${s.round}-${victimId}`,kind:EXILE_TRANSITION,payload:{round:s.round,from:'phe3',to:'soi',sourceRule:'character.json#93'}});return exile;
}
