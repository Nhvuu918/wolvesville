/** Official passive, source-grounded: character.json#20 and legacy T-COV-20.
 * #20 SÓI GAI ĐỘC: an investigator inspecting this role is injured and cannot
 * use skills in the FOLLOWING night. The gunshot trigger is intentionally NOT
 * implemented: official test decks contain no shooter adapter.
 * Source VH31 concerns a DIFFERENT injury context; it is not copied here.
 * This rule is currently implemented only within the closed #20/#25/#74 deck.
 */
import type {GameState,GameAction} from '../../../shared/contracts/index.js';
import {participant} from '../engine/state.js';

export const SOI_GAI_DOC_ID = 20;
export const SOI_GAI_DOC_RULE_ID = 'OFFICIAL_CHAR_20_REACTIVE_INSPECTION';
export const SOI_GAI_DOC_INJURY = 'OFFICIAL_SOI_GAI_DOC_INJURY_NEXT_NIGHT';

/** True only for the *following* night. The initial inspection night is unaffected. */
export function hasActiveSoiGaiDocInjury(state:GameState,playerId:string):boolean {
 if(state.phase!=='NIGHT_COLLECT'&&state.phase!=='NIGHT_RESOLVE'&&state.phase!=='WITCH_WINDOW')return false;
 return participant(state,playerId).effects.some(x =>
  x.kind===SOI_GAI_DOC_INJURY && x.expiresAtRound===state.round);
}
/** Applied atomically in the same resolve transaction as the information result.
 * No event is projected to the inspector/room: the source does not license
 * announcing the hidden *cause* of the injury.
 */
export function onOfficialInspectionResolved(state:GameState,action:GameAction,observedId:string):{ruleId:string;injuredPlayerId:string;activeRound:number}|null {
 if(participant(state,observedId).currentCharacterId!==SOI_GAI_DOC_ID)return null;
 const inspector=participant(state,action.playerId);
 const activeRound=state.round+1;
 const id=`official20-${action.actionId}`;
 if(!inspector.effects.some(x=>x.id===id))inspector.effects.push({
  id,kind:SOI_GAI_DOC_INJURY,sourceId:observedId,expiresAtRound:activeRound,
  payload:{sourceRule:SOI_GAI_DOC_RULE_ID,triggerActionId:action.actionId}
 });
 return {ruleId:SOI_GAI_DOC_RULE_ID,injuredPlayerId:inspector.playerId,activeRound};
}
