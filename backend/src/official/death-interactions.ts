import {selectSingleDefense,consumeDefense} from './protection-consumption.js';
/** Sprint 12: source-limited lethal interaction and stable death-chain gate.
 * This is not a universal damage resolver. Only the explicitly admitted decks
 * have no mandatory death triggers other than the hanging victory of #28.
 * #9's persistent shield is not an unresolved death trigger. It survives its
 * creator, absorbs one attack, and expires at the end of the following night.
 */
import type {GameState,Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {SNOW_LAYER,protectionLayers} from './support-rules.js';
export const S12_GAMEPLAY_POLICY='S12_KNIGHT_SNOW_V1' as const;
export function isS12DeckIds(ids:readonly number[]):boolean {
 const key=[...ids].sort((a,b)=>a-b).join(',');
 return ['8,9','8,9,25,28,74','8,9,25','8,9,28','8,25,28','8,9,25,28','8,28,74','8,25,74','8,74','8,9,74','8,25,28,74','8,9,25,74','8,9,28,74'].includes(key);
}
export function isS12ClosedDeck(s:GameState):boolean {
 return s.gameplayPolicy===S12_GAMEPLAY_POLICY&&isS12DeckIds(s.participants.map(p=>p.initialCharacterId))&&
 s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction);
}
export function assertS12StableDomain(s:GameState):void {
 if(!isS12ClosedDeck(s)||s.links.length||s.participants.some(p=>p.winLinks.length||p.skillLocks.length||!['ALIVE','DEAD_FINAL'].includes(p.life)||p.effects.some(e=>{
  if(e.kind==='OFFICIAL_9_USED_TARGET')return p.currentCharacterId!==9;
  if(e.kind===SNOW_LAYER)return !s.participants.some(src=>src.playerId===e.sourceId&&src.currentCharacterId===9)||!Number.isInteger(e.expiresAtRound)||!Number.isInteger(e.payload?.startedAtRound)||e.expiresAtRound!==Number(e.payload?.startedAtRound)+1;
  return true;
 }))||s.effects.some(e=>!['INFORMATION_RESULT','PROTECTION','DEATH_TRANSITION','DAMAGE'].includes(e.type)))
  throw new KernelError('RULE_UNRESOLVED','Unsupported death-chain dependency');
}
/** Source #9 grants one attack protection. No ordering between multiple
 * layers is assumed. Unknown layers are rejected before any state mutation. */
export function absorbCertifiedNightAttack(s:GameState,target:Participant):string|null {
 assertS12StableDomain(s);
 if(s.phase!=='NIGHT_RESOLVE'||target.life!=='ALIVE')throw new KernelError('RULE_UNRESOLVED','Invalid attack state');
 const layers=protectionLayers(s,target.playerId);
 const layer=selectSingleDefense(layers,l=>l.kind===SNOW_LAYER,'Uncertified protection ordering');
 return layer?consumeDefense(target,layer,true):null;
}
/** The only final-death transition admitted by this closed domain. No blanket
 * deletion of accepted actions, persistent shields, or historical resources. */
export function commitS12Death(s:GameState,target:Participant):void {
 assertS12StableDomain(s);
 if(target.life!=='ALIVE'||target.publicReportedDead)throw new KernelError('RULE_UNRESOLVED','Death transition already applied or not eligible');
 target.life='DEAD_FINAL';target.publicReportedDead=true;
}
/** VH58: a living independent contender can keep a nonterminal match open.
 * A sole Jester cannot be assumed to win; neither can an all-village remainder. */
export function canContinueS12AfterHanging(s:GameState):boolean {
 if(!isS12ClosedDeck(s))return false;
 assertS12StableDomain(s);
 const living=s.participants.filter(p=>p.life==='ALIVE');
 return living.length>1&&living.some(p=>[8,28].includes(p.currentCharacterId));
}
