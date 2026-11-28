import {bellRevivalIds} from './bell-rules.js';
/** Bounded capability domain for #26 revival, not general deck authorization.
 * VH73/VH76 + PH-01: single medium, one sole-survivor attacker, optional
 * read-only investigators. No other death reactions, shields, links or wolves
 * are admitted. #25 and #74 retain their distinct observation semantics.
 */
import {isApprovedRuleVersion,type GameState} from '../../../shared/contracts/index.js';
export const REVIVAL_CAPABILITY = Object.freeze({id:'REVIVAL_WITH_SOLO_AND_READ_ONLY_INSPECTION',ruleSources:['VH73','VH76','PH-01','VH03','QD-01','character.json#8','S15-OWNER-SEER-01'],required:[8,26],optional:[25,74]});
export const trapRevivalIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,10,25,26';
export function trapRevivalDomain(s:GameState):boolean{return s.qaProfile==='owner-bb-live-trap-qa-v1'&&isApprovedRuleVersion(s.ruleVersion)&&trapRevivalIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life));}
// VH73 admits all factions; #28 has no night-death trigger, only actual
// hanging wins. Separate bounded domain leaves historical deck behavior intact.
export const jesterRevivalDeckIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,25,26,28';
export function jesterRevivalDomain(s:GameState):boolean {
 return isApprovedRuleVersion(s.ruleVersion)&&jesterRevivalDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life));
}
export function revivalDeckIds(ids:readonly number[]):boolean {
 const roles=new Set(ids);
 return bellRevivalIds(ids)||jesterRevivalDeckIds(ids)||roles.size===ids.length&&ids.length===3&&REVIVAL_CAPABILITY.required.every(id=>roles.has(id))&&ids.every(id=>REVIVAL_CAPABILITY.required.includes(id)||REVIVAL_CAPABILITY.optional.includes(id));
}
export function revivalCapabilityReady(s:GameState):boolean {
 return trapRevivalDomain(s)||isApprovedRuleVersion(s.ruleVersion)&&revivalDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life));
}
