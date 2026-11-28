import {mirrorMixedIds,mirrorMixedEnabled,mirrorMixedDomain} from '../../official/mirror-investigation.js';
/** Explicit local QA profile, bound to the initial archive. NOT an active ruleset.
 * New games bind owner-approved representative order; historical QA games retain
 * their recorded order. Only the listed interaction domains may run. */
import {trapRevivalIds} from '../../official/revival-capability.js';
import type {GameState} from '../../../../shared/contracts/index.js';
import {APPROVED_RULESET_VERSION} from '../../../../shared/contracts/index.js';
import {boundRepresentativeOrder,ALL_PLAYER_POLICY,selectRepresentative} from './representative-order.js';
import {isFinalPackDeck,packReady,isMixedExileDeck,mixedExileIds,exileBiteEntitled} from '../../official/final-pack.js';
import {liveWitchIds,liveWitchDomain} from './live-witch-domain.js';
import {candidateActionBlocked} from '../owner-bb/locks.js';
import {openPack,ownPack,publicPackTargetIds,type PackContext,type PackState} from './pack.js';
export const LIVE_TRAP='owner-bb-live-trap-qa-v1' as const;
export const LIVE_PACK='owner-bb-live-pack-qa-v1' as const;
export type LiveProfile=typeof LIVE_TRAP|typeof LIVE_PACK;
export const liveEnabled=()=>process.env.WV_OWNER_BB_LIVE_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export const liveRetaliationIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='25,48,74,77';
export const liveRetaliationDomain=(s:GameState)=>s.qaProfile===LIVE_PACK&&s.ruleVersion===APPROVED_RULESET_VERSION&&liveRetaliationIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length);
export const liveConversionIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='74,84,93,94';
export const liveConversionDomain=(s:GameState)=>s.qaProfile===LIVE_PACK&&s.qaRepresentativePolicy===ALL_PLAYER_POLICY&&liveConversionIds(s.participants.map(p=>p.initialCharacterId))&&isFinalPackDeck(s);
// Only the certified pre-conversion domain has no wolf turn at all. A blocked
// or absent eligible member of an existing pack is NOT a skip.
export const packTurnRequired=(s:GameState)=>s.qaProfile===LIVE_PACK&&!((liveConversionDomain(s)||isMixedExileDeck(s))&&!s.participants.some(p=>p.currentFaction==='soi'&&p.life==='ALIVE'));
export const liveDeck=(profile:unknown,ids:number[])=>profile===LIVE_TRAP&&(['5,10,25,74','5,10,25,31,74'].includes([...ids].sort((a,b)=>a-b).join(','))||liveWitchIds(ids)||trapRevivalIds(ids))||profile===LIVE_PACK&&([ ...ids].sort((a,b)=>a-b).join(',')==='9,25,48,74,76'||liveRetaliationIds(ids)||liveConversionIds(ids)||mixedExileIds(ids)&&(!mirrorMixedIds(ids)||mirrorMixedEnabled()));
export function packContext(s:GameState):PackContext{
 if(s.qaProfile!==LIVE_PACK||s.ruleVersion!==APPROVED_RULESET_VERSION||!s.qaRepresentativeOrder)throw Error('LIVE_PACK_DOMAIN');
 if((liveConversionIds(s.participants.map(p=>p.initialCharacterId))&&!liveConversionDomain(s))||(mixedExileIds(s.participants.map(p=>p.initialCharacterId))&&!isMixedExileDeck(s)))throw Error('UNVERIFIED_CONVERSION_DOMAIN');
 const wolfIds=s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='soi'&&(!liveConversionDomain(s)||packReady(s,p.playerId))&&(!isMixedExileDeck(s)||p.currentCharacterId===48||mirrorMixedDomain(s)&&p.currentCharacterId===35||exileBiteEntitled(s,p))&&!candidateActionBlocked(s,p.playerId,p.currentCharacterId===48?'official.48.pack-bite':p.currentCharacterId===93?'official.93.pack-bite':'candidate.pack-bite')).map(p=>p.playerId);
 const order=boundRepresentativeOrder(s);
 return {state:s,blindTargetIntake:isMixedExileDeck(s),entitlement:{wolfIds,targetIds:s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='dan').map(p=>p.playerId),maxTargets:(isMixedExileDeck(s)&&s.participants.some(p=>exileBiteEntitled(s,p))||s.participants.filter(p=>p.life==='ALIVE'&&p.currentFaction==='soi').length===1&&s.participants.some(p=>wolfIds.includes(p.playerId)&&(p.currentCharacterId===48||liveConversionDomain(s)&&packReady(s,p.playerId))))?2:1,representativeOrder:order,representativeId:selectRepresentative(order,wolfIds)}};
}
export function currentPack(s:GameState):PackState{const old=s.qaPack as PackState|undefined;return old?.round===s.round?old:openPack(packContext(s));}
export function livePackView(s:GameState,id:string){if(s.qaProfile!==LIVE_PACK||s.phase!=='NIGHT_COLLECT'||s.completed)return undefined;const c=packContext(s);if(!c.entitlement.wolfIds.includes(id))return undefined;const p=currentPack(s);return {...ownPack(p,c,id),eligibleTargetIds:c.blindTargetIntake?publicPackTargetIds(s,id):c.entitlement.targetIds,maxTargets:c.entitlement.maxTargets};}
export function liveSkillAllowed(s:GameState,skill:string){
 if(liveWitchDomain(s)){if(s.qaNightWindow==='WITCH_POISON'&&skill==='official.29.rescue')return false;if(skill==='official.10.trap')return s.round===1;if(['official.29.poison','official.29.rescue'].includes(skill))return s.round>=2;}
 if(isMixedExileDeck(s))return [...(mirrorMixedDomain(s)?['official.25.inspect-role','official.31.guard']:[]),'official.74.inspect-role','official.84.silence','official.93.seal','official.94.effigy','official.77.trap'].includes(skill);
 if(liveConversionDomain(s))return ['official.74.inspect-role','official.84.silence','official.93.seal','official.94.effigy'].includes(skill);
 if(s.qaProfile===LIVE_PACK)return skill==='official.9.snow-protection'||liveRetaliationDomain(s)&&skill==='official.77.trap';
 // Explicit staged guard QA: placement night 1, guard from night 2. This
 // applies regardless of selected target so rejection cannot leak a mark.
 if(s.qaProfile===LIVE_TRAP&&s.participants.some(p=>p.initialCharacterId===31)){
  if(skill==='official.10.trap')return s.round===1;
  if(skill==='official.31.guard')return s.round>=2;
 }
 return true;
}
