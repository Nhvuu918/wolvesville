import {life02RescueDomain,previewLife02Victims,rescueLife02Preliminary} from './life02.js';
import {liveWitchDomain} from '../experimental/owner-bb-v2/live-witch-domain.js';
import {isModernRuleVersion} from '../../../shared/contracts/index.js';
import {isPharmacistPack,pharmacistWindow,PHARMACIST_RESCUE,PACK_BITE_RULE} from './final-pack.js';
/** character.json#29, Q13-12, PH-01 and NV32 (Excel): calculate preliminary
 * night deaths, privately notify witch by player, resolve rescue before poison,
 * allow self-rescue, and only then commit final death. Initial scope has no
 * links, transformations or competing protections; never reuse for day deaths. */
import {RULESET_VERSION,type GameState,type Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
export const PRELIMINARY='S15_DEEP_PRELIMINARY_DEATH';
export const WITCH_RESCUE='official.29.rescue';
export function isDeepRescueDeck(s:GameState):boolean {
 return isModernRuleVersion(s.ruleVersion)&&(liveWitchDomain(s)||s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='8,25,29')&&s.links.length===0&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&p.winLinks.length===0);
}
export function isPreliminaryRescueDeck(s:GameState):boolean{return isDeepRescueDeck(s)||isPharmacistPack(s);}
export function pendingVictims(s:GameState):Participant[]{if(life02RescueDomain(s))return previewLife02Victims(s);return s.participants.filter(p=>p.life==='PENDING_DEATH'&&p.effects.some(e=>e.kind===PRELIMINARY&&e.expiresAtRound===s.round));}
export function queuePreliminaryDeath(s:GameState,p:Participant,ruleId:string){
 if(!isPreliminaryRescueDeck(s)||!['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase)||p.life!=='ALIVE'||p.publicReportedDead||p.effects.some(e=>e.kind===PRELIMINARY))throw new KernelError('RULE_UNRESOLVED','Invalid preliminary death transition');
 p.life='PENDING_DEATH';p.effects.push({id:`preliminary-${s.round}-${p.playerId}`,kind:PRELIMINARY,expiresAtRound:s.round,payload:{ruleId}});
}
export function canWitchActWhilePending(s:GameState,id:string,skill:string):boolean{return (pharmacistWindow(s)&&s.phase==='WITCH_WINDOW'&&skill===PHARMACIST_RESCUE&&s.participants.some(p=>p.playerId===id&&p.currentCharacterId===87&&p.life==='PENDING_DEATH'))||isDeepRescueDeck(s)&&s.phase==='WITCH_WINDOW'&&s.participants.some(p=>p.playerId===id&&p.currentCharacterId===29&&p.life==='PENDING_DEATH')&&[WITCH_RESCUE,'official.29.poison'].includes(skill);}
export function rescuePreliminary(s:GameState,p:Participant){
 if(life02RescueDomain(s)){rescueLife02Preliminary(s,p.playerId);return;}
 if(!isPreliminaryRescueDeck(s)||s.phase!=='WITCH_WINDOW'||!pendingVictims(s).includes(p))throw new KernelError('TARGET_INVALID','Only a preliminary night victim can be rescued');
 p.effects=p.effects.filter(e=>e.kind!==PRELIMINARY);p.life='ALIVE';
}
export function finalizePreliminary(s:GameState):{victimId:string;ruleId:string}[]{
 if(!isPreliminaryRescueDeck(s)||s.phase!=='WITCH_WINDOW')throw new KernelError('RULE_UNRESOLVED','Unsupported preliminary death closure');
 const victims=pendingVictims(s);if(s.participants.some(p=>p.life==='PENDING_DEATH'&&!victims.includes(p)))throw new KernelError('RULE_UNRESOLVED','Unknown pending death');
 return victims.map(p=>{const ruleId=String(p.effects.find(e=>e.kind===PRELIMINARY)!.payload?.ruleId);if(!['OFFICIAL_CHAR_8_NIGHT_KILL','S14_CHAR_29_DIRECT_ATTACK',PACK_BITE_RULE].includes(ruleId))throw new KernelError('RULE_UNRESOLVED','Unknown death provenance');p.effects=p.effects.filter(e=>e.kind!==PRELIMINARY);p.life='DEAD_FINAL';p.publicReportedDead=true;return {victimId:p.playerId,ruleId};});
}
