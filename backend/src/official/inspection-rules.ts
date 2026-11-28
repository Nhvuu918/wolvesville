import {groupedNight} from '../experimental/owner-bb-v2/night-action-group.js';
import {life02Domain,isCupidVillager,composedLife02} from './life02.js';
import {cultDeck} from './cult-recruitment.js';
import {reflectedAura} from './mirror-investigation.js';
import {isMixedExileDeck} from './final-pack.js';
import {engineerDeckIds,engineerDeck,engineerDistorts,engineerFalseRole,invertEngineerAura} from './engineer-trap.js';
import {isModernRuleVersion} from '../../../shared/contracts/index.js';
import {swappedTarget} from './swap-rules.js';
/** Official rule pack v1.3.2, *restricted noncompetitive test configuration*.
 * S15 owner correction S15-OWNER-SEER-01: #25 observes aura only in new games.
 * Legacy v1.3.1 archives retain the former exact-role semantics.
 * Character #74 Tiên Tri Huyền Bí: each night reveal the selected player's exact role.
 * Sources: character.json#25/#74; VH08; VH68; PH-01; SK-05/Q13-06
 * (Engineer trap NOT in this pack, therefore no trap distortion is inferred).
 * Technical skill IDs are adapter IDs, not modifications of character.json.
 */
import {isS12DeckIds} from './death-interactions.js';
import {isS13DeckIds,hasS15AuraDistortion,isS15ExileDeck,S13_STATUS} from './s13-mechanics.js';
import {KernelError} from '../common/errors.js';
import {RuleRegistry} from '../engine/rules.js';
import type {RuleAdapter} from '../engine/rules.js';
import {LEGACY_RULESET_VERSION,RULESET_VERSION} from '../../../shared/contracts/index.js';
import {readFileSync} from 'node:fs';
import type {GameState} from '../../../shared/contracts/index.js';

export const VILLAGER_ROLE_RESULT='CURRENT_ROLE_VILLAGER';
export function isConvertedVillagerObservation(s:GameState,targetId:string):boolean {
 const t=s.participants.find(p=>p.playerId===swappedTarget(s,targetId));
 return composedLife02(s)&&!!t&&isCupidVillager(t);
}
export const SEER_AURA_RULE='S15-OWNER-SEER-01';
export function isAuraSeer(s:GameState,skillId:string):boolean {return skillId===INSPECTION_SKILLS[25]&&s.ruleVersion!==LEGACY_RULESET_VERSION;}
// Supported decks have no implemented aura disguise or transformation. Fail closed if this changes.
export function officialSeerAura(s:GameState,targetId:string):string {
 const t=s.participants.find(p=>p.playerId===swappedTarget(s,targetId));
 if(!t||t.currentCharacterId!==t.initialCharacterId||t.currentFaction!==t.initialFaction&&!cultDeck(s)&&!life02Domain(s))throw new KernelError('RULE_UNRESOLVED','Transformed aura inspection is not yet supported');
 if(life02Domain(s)&&isCupidVillager(t))return 'Thiện';
 const reflected=reflectedAura(s,t);if(reflected!==undefined)return reflected;
 if(hasS15AuraDistortion(s,targetId))return 'Ác';
 if(isModernRuleVersion(s.ruleVersion)&&t.effects.some(e=>e.kind===S13_STATUS.portrait))return 'Không xác định';
 if(isModernRuleVersion(s.ruleVersion)&&t.currentCharacterId===3&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='3,25,49,74'){if(!s.participants.some(p=>p.currentCharacterId===49&&p.life==='ALIVE'))throw new KernelError('RULE_UNRESOLVED','Last-wolf transformation is not yet supported');return 'Thiện';}
 if(isS15ExileDeck(s)&&t.currentCharacterId===93&&s.participants.some(p=>p.currentCharacterId===94&&p.life==='ALIVE'))return 'Thiện';
 const roles=JSON.parse(readFileSync('data/character.json','utf8')) as Array<{id:number;aura:string}>;
 const aura=roles.find(r=>r.id===t.currentCharacterId)?.aura;
 if(!aura||!['Thiện','Ác','Không xác định'].includes(aura))throw new KernelError('RULE_UNRESOLVED','Unknown official aura');
 return aura;
}
// The exact-role and aura paths resolve the same transposition, but retain their
// distinct result types and original requested seat in the observation.
export function officialInspectedRole(s:GameState,targetId:string):number {
 const t=s.participants.find(p=>p.playerId===swappedTarget(s,targetId));
 if(!t)throw new KernelError('TARGET_INVALID','Inspection target missing');
 return t.currentCharacterId;
}
export const OFFICIAL_TEST_PACK='OFFICIAL_ROLE_INSPECTION_V1' as const;
export const OFFICIAL_TEST_CHARACTERS=[25,74] as const;
export const OFFICIAL_PASSIVE_CHARACTERS=[20] as const;
/** Exact allowed closed-deck combinations; #20 passive is triggered only by inspected roles. */
export function isApprovedInspectionDeck(ids:readonly number[]):boolean {
 const set=new Set(ids);
 if(set.size!==ids.length)return false;
 if(engineerDeckIds(ids)||isS12DeckIds(ids)||isS13DeckIds(ids))return true;
 if(set.size===2&&set.has(8)&&(set.has(25)||set.has(28)))return true;
 if(set.size===3&&set.has(5)&&set.has(25)&&(set.has(20)||set.has(74)||set.has(76)))return true;
 if(set.size===3&&set.has(76)&&set.has(25)&&set.has(74))return true;
 return set.size===ids.length && [25,74].every(id=>set.has(id)) &&
  (set.size===2 || (set.size===3 && (set.has(20)||set.has(79)||set.has(33))) ||
   (set.size===5 && [9,25,31,34,74].every(id=>set.has(id))));
}
export const INSPECTION_SKILLS={25:'official.25.inspect-role',74:'official.74.inspect-role'} as const;
/** Only exact locked 2-role games can use this pack. No victory or competitive gameplay. */
export function registerOfficialInspection(registry:RuleRegistry):RuleRegistry {
 for(const characterId of OFFICIAL_TEST_CHARACTERS){
  const adapter:RuleAdapter={
   characterId,skillId:INSPECTION_SKILLS[characterId],ruleId:`OFFICIAL_CHAR_${characterId}_ROLE_INSPECTION`,
   ruleVersion:RULESET_VERSION,priority:100,phases:['NIGHT_COLLECT'],
   target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,
   evaluate:(state,action,ctx)=>{
    const target=state.participants.find(p=>p.playerId===action.targetIds[0]);
    if(!target)throw new KernelError('TARGET_INVALID','Target missing during inspection');
    // This guard checks real domain data. Not supplied by client.
    if(target.life!=='ALIVE'&&target.life!=='PROLONGED')throw new KernelError('RULE_UNRESOLVED','Inspection requires live target in the approved restricted pack');
    if(!life02Domain(state)&&!cultDeck(state)&&!isApprovedInspectionDeck(state.participants.map(p=>p.initialCharacterId))&&!(state.qaProfile==='owner-bb-live-trap-qa-v1'&&engineerDeck(state))&&!isMixedExileDeck(state))
     throw new KernelError('RULE_UNRESOLVED','Inspection adapter is restricted to the 25/74 pair or 20/25/74 closed deck');
    // Inspection is read-only. Same-level ordering cannot change final information.
    const distorted=engineerDistorts(state,action.playerId);
    const aura=isAuraSeer(state,action.skillId);
    if(!aura&&isConvertedVillagerObservation(state,target.playerId)){
     if(distorted)throw new KernelError('RULE_UNRESOLVED','Transformed role trap not admitted');
     return [{type:'INFORMATION_RESULT',targetId:target.playerId,recipientId:action.playerId,visibility:'PLAYER_PRIVATE',key:VILLAGER_ROLE_RESULT,value:'Dân thường'}];
    }
    const value=aura?officialSeerAura(state,target.playerId):officialInspectedRole(state,target.playerId);
    return [{type:'INFORMATION_RESULT',targetId:target.playerId,recipientId:action.playerId,visibility:'PLAYER_PRIVATE',...(aura?{key:SEER_AURA_RULE}:{}),value:distorted?(aura?invertEngineerAura(String(value),groupedNight(state)):engineerFalseRole(state,Number(value),ctx)):value}];
   }
  };
  registry.register(adapter);
 }
 return registry;
}
