import {bellLinkDomain,bellLocalEffect} from './bell-rules.js';
import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** character.json#15/NV16: private, once-per-target pair. VH03/VH65:
 * close linked death before winner evaluation. Initial scope has no rescue
 * or protection (NV16 rescue of both needs a separate integration). */
import {RULESET_VERSION,type GameState,type GameAction} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const SECRET_PAIR='S15_DEEP_SECRET_PAIR';
export const CUPID_TARGET='S15_DEEP_CUPID_TARGET';
export function deepKey(s:GameState){return s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');}
export function isDeepPairDeck(s:GameState){return isModernRuleVersion(s.ruleVersion)&&(['15,25,74','15,25,28'].includes(deepKey(s))||bellLinkDomain(s))&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length)&&s.links.every(l=>l.type===SECRET_PAIR&&l.memberIds.length===2&&new Set(l.memberIds).size===2&&l.memberIds.every(id=>s.participants.some(p=>p.playerId===id&&p.currentCharacterId!==15)));}
export function isDeepDemonDeck(s:GameState){return isModernRuleVersion(s.ruleVersion)&&deepKey(s)==='25,28,58'&&s.links.length===0&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function isDeepJesterDeck(s:GameState){return isModernRuleVersion(s.ruleVersion)&&deepKey(s)==='25,28,79'&&s.links.length===0&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function isDeepVoteDeck(s:GameState){return isDeepPairDeck(s)||isDeepDemonDeck(s)||isDeepJesterDeck(s);}
export function cupidEligible(s:GameState,id:string){const p=participant(s,id);return s.participants.filter(t=>t.playerId!==id&&t.life==='ALIVE'&&!p.effects.some(e=>e.kind===CUPID_TARGET&&e.payload?.targetId===t.playerId)).map(t=>t.playerId);}
export function validateCupid(s:GameState,a:GameAction){if(!isDeepPairDeck(s)||!a.targetIds.every(id=>cupidEligible(s,a.playerId).includes(id)))throw new KernelError('TARGET_INVALID','Cupid target has already been selected or is unavailable');}
export function rememberCupid(s:GameState,a:GameAction){const p=participant(s,a.playerId);for(const id of a.targetIds)p.effects.push({id:`cupid-used-${a.actionId}-${id}`,kind:CUPID_TARGET,payload:{targetId:id}});}
export function createSecretPair(s:GameState,a:GameAction){validateCupid(s,a);if(a.targetIds.length!==2||s.links.length)throw new KernelError('RULE_UNRESOLVED','Only disjoint pair admitted');rememberCupid(s,a);s.links.push({id:`pair-${a.actionId}`,type:SECRET_PAIR,memberIds:[...a.targetIds],active:true,createdSeq:s.revision+1});}
export function deepLinkedDeath(s:GameState,victimId:string):string[]{
 if(!isDeepPairDeck(s))return [];
 const result:string[]=[];for(const l of s.links.filter(l=>l.active&&l.memberIds.includes(victimId))){
  const p=participant(s,l.memberIds.find(id=>id!==victimId)!);if(p.life!=='ALIVE'||p.effects.some(e=>!(bellLinkDomain(s)&&bellLocalEffect(p,e.kind)))||p.winLinks.length)throw new KernelError('RULE_UNRESOLVED','Unverified linked protection or life state');
  p.life='DEAD_FINAL';p.publicReportedDead=true;l.active=false;result.push(p.playerId);
 }return result;
}
