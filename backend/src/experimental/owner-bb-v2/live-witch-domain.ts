import type {GameState} from '../../../../shared/contracts/index.js';
import {APPROVED_RULESET_VERSION} from '../../../../shared/contracts/index.js';
/** QA fixture for #29 two potions in ONE WITCH_WINDOW (character.json#29).
 * Not a grant for #87 or cross-window grouping, BB-PENDING-03 remains open. */
export const liveWitchIds=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',')==='8,10,25,29';
export function liveWitchDomain(s:GameState):boolean{return s.qaProfile==='owner-bb-live-trap-qa-v1'&&s.ruleVersion===APPROVED_RULESET_VERSION&&liveWitchIds(s.participants.map(p=>p.initialCharacterId))&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length);}
