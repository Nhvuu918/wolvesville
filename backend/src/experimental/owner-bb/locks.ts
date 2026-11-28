import type {GameState} from '../../../../shared/contracts/index.js';
import {participant} from '../../engine/state.js';
import {hasActiveSoiGaiDocInjury} from '../../official/reactive-rules.js';
import {hasActiveNightWalkLock} from '../../official/support-rules.js';
import {hasActiveNightmareLock} from '../../official/nightmare-rules.js';
import {isS13SkillBlocked,isS13Maintenance} from '../../official/s13-mechanics.js';
/** Mirrors the current accepted-action lock checks; additional pack-specific
 * membership and eligibility must still be granted by a trusted provider. */
export function candidateActionBlocked(s:GameState,id:string,skillId:string){const a=participant(s,id);return a.skillLocks.includes('*')||a.skillLocks.includes(skillId)||hasActiveSoiGaiDocInjury(s,id)||(!isS13Maintenance(s,id)&&(hasActiveNightWalkLock(s,id)||hasActiveNightmareLock(s,id)))||isS13SkillBlocked(s,id);}
