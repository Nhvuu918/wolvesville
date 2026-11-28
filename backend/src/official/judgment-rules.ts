import {engineerDeck} from './engineer-trap.js';
/** Restricted source-backed branch: #5 Thẩm Phán Linh Hồn — Cân Phán Quyết.
 * character.json#5 + VH84 + the original answered Excel source:
 * exactly two uses per match, private exact Thiện/Ác/Không xác định based
 * on current real faction, not apparent aura. Does not implement the other
 * #5 ability Công Lý Tuyệt Đối or general interference interactions.
 * Restricted to [5,20,25], [5,25,74], [5,25,76] with unchanged roles/factions.
 */
import type {GameState,GameAction,Effect} from '../../../shared/contracts/index.js';
import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import {RuleRegistry} from '../engine/rules.js';
import {participant} from '../engine/state.js';
import {KernelError} from '../common/errors.js';

export const JUDGMENT_SKILL='official.5.weigh-soul';
export const JUDGMENT_RULE='OFFICIAL_CHAR_5_WEIGH_SOUL';
export const JUDGMENT_USED='OFFICIAL_5_JUDGMENT_USED';
export type SoulVerdict='Thiện'|'Ác'|'Không xác định';
export function isJudgmentDeck(s:GameState):boolean {
 const ids=s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',');
 return (engineerDeck(s)||ids==='5,20,25'||ids==='5,25,74'||ids==='5,25,76')&&
  s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction);
}
function validate(s:GameState,a:GameAction):void{
 if(!isJudgmentDeck(s))throw new KernelError('RULE_UNRESOLVED','Soul judgment limited to validated untransformed decks');
 const actor=participant(s,a.playerId);
 if(actor.effects.filter(x=>x.kind===JUDGMENT_USED).length>=2)
  throw new KernelError('RESOURCE_INSUFFICIENT','Cân Phán Quyết can be used only twice in one match');
}
export function registerOfficialJudgment(r:RuleRegistry):RuleRegistry{
 r.register({characterId:5,skillId:JUDGMENT_SKILL,ruleId:JUDGMENT_RULE,ruleVersion:RULESET_VERSION,
  priority:95,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},
  maxUsesPerPhase:1,validateSubmission:validate,evaluate:(s,a)=>{
   validate(s,a);
   const t=participant(s,a.targetIds[0]!);
   const verdict: SoulVerdict=t.currentFaction==='dan'?'Thiện':t.currentFaction==='soi'?'Ác':'Không xác định';
   return [{type:'INFORMATION_RESULT',targetId:t.playerId,recipientId:a.playerId,
    visibility:'PLAYER_PRIVATE',key:JUDGMENT_RULE,value:verdict}];
  }});
 return r;
}
export function applyOfficialJudgment(s:GameState,e:Effect,a:GameAction){
 if(a.skillId!==JUDGMENT_SKILL||e.type!=='INFORMATION_RESULT'||e.key!==JUDGMENT_RULE||
    e.visibility!=='PLAYER_PRIVATE'||e.recipientId!==a.playerId||e.targetId!==a.targetIds[0])
  throw new KernelError('RULE_UNRESOLVED','Soul judgment effect provenance mismatch');
 validate(s,a);
 const t=participant(s,e.targetId),actor=participant(s,a.playerId);
 const expected=t.currentFaction==='dan'?'Thiện':t.currentFaction==='soi'?'Ác':'Không xác định';
 if(e.value!==expected)throw new KernelError('RULE_UNRESOLVED','Soul judgment may not depend on apparent aura');
 actor.effects.push({id:`wv5-used-${a.actionId}`,kind:JUDGMENT_USED,
  payload:{sourceRule:'VH84',actionId:a.actionId,round:s.round}});
 return {type:'SOUL_JUDGMENT_OBSERVED' as const,targetId:t.playerId,
  payload:{verdict:expected,sourceRule:'VH84'}};
}
