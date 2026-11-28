/** #39, VH17/VH18. Restricted QA composition: one wolf (#76), one village
 * (#25), one independent (#39). No shared bite or novel consensus is enabled.
 * Public target choices do not depend on secret faction. Captures are attributed
 * only to this skill, not to unrelated deaths. Third failed capture kills actor.
 */
import {isApprovedRuleVersion,type GameAction,type GameState,type Effect} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const DOG_THIEF_SKILL='official.39.capture';
export const DOG_THIEF_DECK=[25,39,76] as const;
export const DOG_THIEF_RULE='S15_GROWTH_CHAR_39_CAPTURE';
const MISS='S15_GROWTH_39_MISS',CAPTURE='S15_GROWTH_39_CAPTURE';
export function isDogThiefDeck(s:GameState):boolean{return isApprovedRuleVersion(s.ruleVersion)&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')===DOG_THIEF_DECK.join(',')&&!s.links.length&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length);}
export function dogThiefReady(s:GameState,id:string):boolean{const p=participant(s,id);return isDogThiefDeck(s)&&p.currentCharacterId===39&&p.life==='ALIVE'&&p.effects.filter(x=>x.kind===MISS).length<3&&!p.effects.some(x=>x.kind===MISS&&x.payload?.round===s.round-1)&&s.participants.some(x=>x.playerId!==id&&x.life==='ALIVE');}
export function validateDogThief(s:GameState,a:GameAction){if(!dogThiefReady(s,a.playerId))throw new KernelError('RESOURCE_INSUFFICIENT','Exciter unavailable for this night');if(a.targetIds.length!==1||a.targetIds[0]===a.playerId||participant(s,a.targetIds[0]!).life!=='ALIVE')throw new KernelError('TARGET_INVALID','Choose another living player');}
export function dogThiefEffect(s:GameState,a:GameAction):Effect{
 validateDogThief(s,a);const t=participant(s,a.targetIds[0]!),p=participant(s,a.playerId);
 if(t.currentFaction==='soi')return {type:'DEATH_TRANSITION',key:DOG_THIEF_SKILL,targetId:t.playerId,causeId:p.playerId};
 if(t.currentFaction!=='dan')throw new KernelError('RULE_UNRESOLVED','Unsupported capture domain');
 return {type:p.effects.filter(x=>x.kind===MISS).length===2?'DEATH_TRANSITION':'STATUS',key:DOG_THIEF_SKILL,targetId:p.playerId,causeId:p.playerId,recipientId:p.playerId};
}
export function applyDogThief(s:GameState,e:Effect,a:GameAction){const expected=dogThiefEffect(s,a);if(e.type!==expected.type||e.key!==expected.key||e.targetId!==expected.targetId||e.causeId!==expected.causeId)throw new KernelError('RULE_UNRESOLVED','Capture effect provenance mismatch');
 const owner=participant(s,a.playerId),target=participant(s,a.targetIds[0]!),hit=target.currentFaction==='soi';
 owner.effects.push({id:`wv39-${a.actionId}`,kind:hit?CAPTURE:MISS,payload:{round:s.round,...(hit?{targetId:target.playerId}:{})}});
 if(e.type==='DEATH_TRANSITION'){const victim=participant(s,e.targetId);victim.life='DEAD_FINAL';victim.publicReportedDead=true;return {type:'PLAYER_ELIMINATED' as const,targetId:victim.playerId,payload:{playerId:victim.playerId}};}
 return {type:'S15_GROWTH_DOG_THIEF_MISS' as const,targetId:owner.playerId,payload:{sourceRule:'VH18'}};
}
export function dogThiefWinner(s:GameState):string|undefined{if(!isDogThiefDeck(s)||s.completed||s.phase!=='NIGHT_FINALIZE'||s.participants.some(p=>!['ALIVE','DEAD_FINAL'].includes(p.life)))return;const owner=s.participants.find(p=>p.currentCharacterId===39&&p.life==='ALIVE');if(!owner)return;const wolves=s.participants.filter(p=>p.initialFaction==='soi');const victims=new Set(owner.effects.filter(e=>e.kind===CAPTURE).map(e=>e.payload?.targetId));return wolves.filter(p=>p.life==='DEAD_FINAL'&&victims.has(p.playerId)).length>wolves.length/2?owner.playerId:undefined;}
