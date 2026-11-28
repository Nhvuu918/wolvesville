import {mirrorMixedIds,mirrorMixedDomain,mirrorDeck,MIRROR_BITE,MIRROR_MEMORY,MIRROR_SCAN} from './mirror-investigation.js';
import {selectSingleDefense,consumeDefense} from './protection-consumption.js';
import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** Source #93 + VH74/P04: after #94 dies, #93 joins wolves and the pack
 * may bite up to two different players per night. These two new compositions
 * have exactly ONE wolf after conversion, so there is no invented consensus
 * or representative election. No generic multi-wolf pack permission. */
import {RULESET_VERSION,isApprovedRuleVersion,type GameState,type GameAction} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {SNOW_LAYER,GUARD_LAYER,protectionLayers} from './support-rules.js';
import {BELL_DECK,BELL_MARK,BELL_SPENT} from './bell-rules.js';
export const PACK_BITE='official.93.pack-bite';
export const PACK_BITE_RULE='S15_FINAL_WOLF_PACK_BITE';
export const LEADER_BITE='official.48.pack-bite';
export const LEADER_DECK=[25,48,74] as const;
export const SCALE_LEADER_SNOW=[9,25,48,74] as const;
export const SCALE_LEADER_RESCUE=[9,25,48,74,87] as const;
export const PLAY_GUARD_DECK=[25,31,48,74] as const;
export const GROWTH_GUARD_RESCUE=[25,31,48,74,87] as const;
export const SCALE_LEADER_DECKS=[GROWTH_GUARD_RESCUE,SCALE_LEADER_SNOW,SCALE_LEADER_RESCUE,BELL_DECK,PLAY_GUARD_DECK] as const;
export function isScaleLeaderDeckIds(ids:readonly number[]):boolean{return SCALE_LEADER_DECKS.some(d=>d.join(',')===[...ids].sort((a,b)=>a-b).join(','));}
export function isApprovedLeaderDeck(s:GameState):boolean{return isApprovedRuleVersion(s.ruleVersion)&&(s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')===LEADER_DECK.join(',')||isScaleLeaderDeckIds(s.participants.map(p=>p.initialCharacterId)))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length);}
export function isApprovedSingleWolfPackDeck(s:GameState):boolean{return isApprovedLeaderDeck(s)||mirrorDeck(s);}
export function isPackBiteSkill(skill:string):boolean{return skill===PACK_BITE||skill===LEADER_BITE||skill===MIRROR_BITE;}
export const PHARMACIST_RESCUE='official.87.rescue';
export const PACK_DECKS=[[74,84,93,94],[74,84,87,93,94]] as const;
// A bounded QA composition, never admitted by the public official deck list.
// #93 grants the pack two targets after #94 dies (VH74/P04 cap), independent of #48.
export const MIXED_EXILE_DECK=[48,74,77,84,93,94] as const;
export const mixedExileIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')===MIXED_EXILE_DECK.join(',')||mirrorMixedIds(ids);
export function isMixedExileDeck(s:GameState):boolean{return s.qaProfile==='owner-bb-live-pack-qa-v1'&&s.qaRepresentativePolicy==='BB-REP-NEW-01-B'&&isApprovedRuleVersion(s.ruleVersion)&&mixedExileIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&!p.winLinks.length&&(p.currentFaction===p.initialFaction||(p.currentCharacterId===93&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind==='S15_BREAK_EXILE_ALIGNMENT'))));}
export function exileBiteEntitled(s:GameState,p:GameState['participants'][number]):boolean{return p.currentCharacterId===93&&p.life==='ALIVE'&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind==='S15_BREAK_EXILE_ALIGNMENT')&&s.participants.some(x=>x.currentCharacterId===94&&x.life==='DEAD_FINAL');}
export function isFinalPackDeck(s:GameState):boolean {
 return isMixedExileDeck(s)||isModernRuleVersion(s.ruleVersion)&&PACK_DECKS.some(d=>d.join(',')===s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(','))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&!p.winLinks.length&&(p.currentFaction===p.initialFaction||(p.currentCharacterId===93&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind==='S15_BREAK_EXILE_ALIGNMENT'))));
}
export function packReady(s:GameState,id:string):boolean {
 if(mirrorDeck(s)){const p=participant(s,id);return p.currentCharacterId===35&&p.currentFaction==='soi'&&p.life==='ALIVE';}
 if(isApprovedLeaderDeck(s)){const p=participant(s,id);return p.currentCharacterId===48&&p.currentFaction==='soi'&&p.life==='ALIVE'&&s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='soi').length===1;}
 if(!isFinalPackDeck(s)||!s.participants.some(p=>p.currentCharacterId===94&&p.life==='DEAD_FINAL'))return false;
 const p=participant(s,id);return p.currentCharacterId===93&&p.life==='ALIVE'&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind==='S15_BREAK_EXILE_ALIGNMENT')&&s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='soi').length===1;
}
export function isPharmacistPack(s:GameState):boolean{return s.participants.some(p=>p.currentCharacterId===87)&&(isApprovedLeaderDeck(s)||isFinalPackDeck(s)&&s.participants.some(p=>p.currentCharacterId===93&&p.currentFaction==='soi'));}
export function pharmacistWindow(s:GameState):boolean{return isPharmacistPack(s)&&s.participants.some(p=>p.currentCharacterId===87&&['ALIVE','PENDING_DEATH'].includes(p.life));}
export function validatePack(s:GameState,a:GameAction):void {
 if(!packReady(s,a.playerId)||a.targetIds.length<1||a.targetIds.length>(mirrorDeck(s)?1:2)||new Set(a.targetIds).size!==a.targetIds.length||a.targetIds.some(id=>{const p=participant(s,id);return p.life!=='ALIVE'||p.currentFaction!=='dan';}))throw new KernelError('RULE_UNRESOLVED','Pack action outside verified one-wolf domain or invalid target');
 if(s.participants.some(p=>!['ALIVE','DEAD_FINAL','PENDING_DEATH'].includes(p.life)||p.effects.some(e=>!['S13_SKILL_USE','S14_50_NIGHT_LOCK','S14_PUBLIC_MUTE','S15_87_VOTE_BLOCK','S15_BREAK_EFFIGY','S15_BREAK_EXILE_ALIGNMENT','S15_DEEP_PRELIMINARY_DEATH',...(mirrorDeck(s)?[MIRROR_MEMORY,MIRROR_SCAN]:[]),...(isApprovedSingleWolfPackDeck(s)?[SNOW_LAYER,'OFFICIAL_9_USED_TARGET',BELL_MARK,BELL_SPENT,...(s.participants.some(p=>p.currentCharacterId===31)?[GUARD_LAYER,'OFFICIAL_31_LAST_GUARD']:[])]:[])].includes(e.kind))))throw new KernelError('RULE_UNRESOLVED','Unverified pack protection or reaction');
}

/** #9 protects one night attack for two nights; independent bite recipients
 * are adjudicated individually, and no new layer priority is inferred. */
export function absorbPackProtection(s:GameState,targetId:string):string|undefined {
 if(!isApprovedSingleWolfPackDeck(s))return undefined;
 const layer=selectSingleDefense(protectionLayers(s,targetId),l=>l.kind===SNOW_LAYER||l.kind===GUARD_LAYER&&s.participants.some(p=>p.currentCharacterId===31&&p.playerId===l.sourceId),'Unverified pack protection order');
 return layer?consumeDefense(participant(s,targetId),layer,layer.kind===SNOW_LAYER):undefined;
}
