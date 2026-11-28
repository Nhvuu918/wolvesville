import type {GameState} from '../../../../shared/contracts/index.js';
import {hash} from '../../common/canonical.js';
/** Immutable match identity; current life, faction and role may change. */
export function candidateMatchBinding(s:GameState){return hash({gameId:s.gameId,roomId:s.roomId,ruleVersion:s.ruleVersion,characterHash:s.characterHash,seedHash:hash(s.seed),roster:s.participants.map(p=>({playerId:p.playerId,initialCharacterId:p.initialCharacterId,initialFaction:p.initialFaction})).sort((a,b)=>a.playerId.localeCompare(b.playerId))});}
