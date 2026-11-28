/** #35 / VH11: the last committed pack kill supplies a reflected aura for
 * subsequent nights. Before any reflection, or from the second #25 aura
 * observation onwards, show the true aura. #74's exact-role observation is
 * a distinct data type, not an aura observation. This path is deliberately
 * restricted to the active-rule single-wolf composition and explicit
 * mixed-pack candidate: no overlapping P05 modifiers or transformations. */
import type {GameState,Participant,GameAction} from '../../../shared/contracts/index.js';
import {isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import {invariant} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {readFileSync} from 'node:fs';
export const MIRROR_DECK=[25,31,35,74] as const;
export const MIRROR_BITE='official.35.pack-bite';
export const MIRROR_MEMORY='S26_MIRROR_PACK_AURA';
export const MIRROR_SCAN='S26_MIRROR_AURA_SCAN';
export const mirrorDeckIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')===MIRROR_DECK.join(',');
export function mirrorDeck(s:GameState):boolean{
 return isApprovedRuleVersion(s.ruleVersion)&&mirrorDeckIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life));
}
/** Explicit new candidate composition. Admission requires the separate local
 * mirror QA switch; the immutable initial roster binds the selected policy. */
export const MIRROR_MIXED_DECK=[25,31,35,74,77,84,93,94] as const;
export const mirrorMixedIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')===MIRROR_MIXED_DECK.join(',');
export const mirrorMixedEnabled=()=>process.env.WV_OWNER_MIRROR_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export function mirrorMixedDomain(s:GameState):boolean{
 return s.qaProfile==='owner-bb-live-pack-qa-v1'&&s.qaRepresentativePolicy==='BB-REP-NEW-01-B'&&isApprovedRuleVersion(s.ruleVersion)&&mirrorMixedIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&!p.winLinks.length&&(p.currentFaction===p.initialFaction||(p.currentCharacterId===93&&p.currentFaction==='soi'&&p.effects.some(e=>e.kind==='S15_BREAK_EXILE_ALIGNMENT')))&&['ALIVE','DEAD_FINAL'].includes(p.life));
}
const auras=new Map<number,string>((JSON.parse(readFileSync('data/character.json','utf8')) as Array<{id:number;aura:string}>).map(p=>[p.id,p.aura]));
function trueAura(p:Participant):string{const a=auras.get(p.currentCharacterId);invariant(a&&['Thiện','Ác','Không xác định'].includes(a),'RULE_UNRESOLVED','Unknown aura');return a;}
/** Read-only: adapter evaluate and effect validation may both call this. */
export function reflectedAura(s:GameState,p:Participant):string|undefined{
 if(!(mirrorDeck(s)||mirrorMixedDomain(s))||p.currentCharacterId!==35)return undefined;
 if(p.effects.some(e=>e.kind===MIRROR_SCAN))return trueAura(p);
 const memory=p.effects.filter(e=>e.kind===MIRROR_MEMORY&&Number(e.payload?.round)<s.round);
 invariant(memory.length<=1,'RULE_UNRESOLVED','Ambiguous mirror memory');
 const aura=memory[0]?.payload?.aura;
 invariant(aura===undefined||typeof aura==='string'&&['Thiện','Ác','Không xác định'].includes(aura),'RULE_UNRESOLVED','Invalid reflected aura');
 return typeof aura==='string'?aura:trueAura(p);
}
/** Called after a real unblocked pack death, never on accepted/blocked bite. */
export function recordMirrorBite(s:GameState,a:GameAction,victim:Participant):void{
 invariant(mirrorDeck(s)&&s.phase==='NIGHT_RESOLVE'&&a.skillId===MIRROR_BITE&&a.targetIds.length===1&&a.targetIds[0]===victim.playerId&&victim.life==='DEAD_FINAL','RULE_UNRESOLVED','Unverified mirror bite provenance');
 const wolf=participant(s,a.playerId);invariant(wolf.currentCharacterId===35&&wolf.life==='ALIVE','RULE_UNRESOLVED','Invalid mirror actor');
 wolf.effects=wolf.effects.filter(e=>e.kind!==MIRROR_MEMORY);
 wolf.effects.push({id:`mirror-bite-${a.actionId}`,kind:MIRROR_MEMORY,sourceId:victim.playerId,payload:{round:s.round,aura:trueAura(victim),sourceActionId:a.actionId,sourceRule:'VH11'}});
}
/** Called only after the authoritative private aura observation resolves. */
export function recordMirrorScan(s:GameState,a:GameAction,targetId:string):void{
 if(!(mirrorDeck(s)||mirrorMixedDomain(s))||a.skillId!=='official.25.inspect-role')return;
 const target=participant(s,targetId);if(target.currentCharacterId!==35)return;
 invariant(s.phase==='NIGHT_RESOLVE'&&a.targetIds[0]===targetId,'RULE_UNRESOLVED','Invalid mirror scan provenance');
 const id=`mirror-scan-${a.actionId}`;
 if(!target.effects.some(e=>e.id===id))target.effects.push({id,kind:MIRROR_SCAN,sourceId:a.playerId,payload:{round:s.round,sourceActionId:a.actionId,sourceRule:'character.json#35'}});
}

/** Called only by the committed collective bite loop, AFTER direct final
 * death. The sequence is the existing locked canonical pack order. Neither
 * blocked attacks nor retaliation invoke this hook. No guessed death cause. */
export function recordMirrorPackVictim(s:GameState,victim:Participant,index:number):void{
 invariant(mirrorMixedDomain(s)&&s.phase==='NIGHT_RESOLVE'&&victim.life==='DEAD_FINAL'&&victim.publicReportedDead&&Number.isSafeInteger(index)&&index>=0,'RULE_UNRESOLVED','Unverified collective mirror death');
 const wolf=s.participants.find(p=>p.currentCharacterId===35&&p.life==='ALIVE');if(!wolf)return;
 wolf.effects=wolf.effects.filter(e=>e.kind!==MIRROR_MEMORY);
 wolf.effects.push({id:`mirror-pack-${s.round}-${index}`,kind:MIRROR_MEMORY,sourceId:victim.playerId,payload:{round:s.round,aura:trueAura(victim),attackIndex:index,sourceRule:'DC-MIRROR-MULTIVICTIM-01'}});
}
