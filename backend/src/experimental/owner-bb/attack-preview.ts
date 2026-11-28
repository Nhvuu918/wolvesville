/** Candidate pack attack emission contract, not a live attack. Reuse the
 * published single-defense helper for a narrow known interaction, without
 * altering the authoritative state or choosing a new protection priority. */
import type {GameState} from '../../../../shared/contracts/index.js';
import {clone} from '../../common/canonical.js';
import {GUARD_LAYER,SNOW_LAYER,protectionLayers} from '../../official/support-rules.js';
import {selectSingleDefense,consumeDefense} from '../../official/protection-consumption.js';
import {candidateMatchBinding} from './binding.js';
import type {PackState} from './pack.js';
export function previewCandidateAttack(pack:PackState,state:GameState){
 if(!pack.locked||pack.result?.kind!=='UNANIMOUS'||pack.result.candidateAttacks.length!==1)throw Error('NO_AUTHORIZED_CANDIDATE_ATTACK');
 if(state.gameId!==pack.gameId||state.ruleVersion!==pack.ruleVersion||state.round!==pack.round||state.phase!=='NIGHT_RESOLVE'||state.completed||state.revision<pack.gameRevision||candidateMatchBinding(state)!==pack.matchBinding)throw Error('SCOPE_MISMATCH');
 const attack=pack.result.candidateAttacks[0]!,copy=clone(state),target=copy.participants.find(p=>p.playerId===attack.targetId),source=copy.participants.find(p=>p.playerId===attack.sourceId);
 if(!target||target.life!=='ALIVE'||target.currentFaction==='soi'||!source||source.currentFaction!=='soi'||source.life!=='ALIVE'||source.skillLocks.includes('*'))throw Error('ATTACK_ENTITLEMENT_CHANGED');
 if(copy.links.some(x=>x.active)||target.effects.some(e=>![GUARD_LAYER,SNOW_LAYER,'OFFICIAL_31_LAST_GUARD','OFFICIAL_9_USED_TARGET'].includes(e.kind)))return {status:'PENDING_INTERACTION' as const,attack,candidateOnly:true};
 const layers=protectionLayers(copy,target.playerId);
 const defense=selectSingleDefense(layers,l=>l.kind===SNOW_LAYER&&copy.participants.some(p=>p.playerId===l.sourceId&&p.currentCharacterId===9)||l.kind===GUARD_LAYER&&copy.participants.some(p=>p.playerId===l.sourceId&&p.currentCharacterId===31),'Multiple/unknown protection order is not certified');
 if(!defense)return {status:'LETHAL_EFFECT_NOT_COMMITTED' as const,attack,candidateOnly:true};
 const consumedId=consumeDefense(target,defense,defense.kind===SNOW_LAYER);
 return {status:'BLOCKED' as const,attack,consumedId,consumable:defense.kind===SNOW_LAYER,remainingLayerIds:target.effects.map(x=>x.id),candidateOnly:true};
}
