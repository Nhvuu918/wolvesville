/** #10 first-night investigation interaction, approved current rules only.
 * Source: character.json#10, SK-05, Q13-06, VH08, VH84. The source does not
 * settle trap lifetime across nights or all possible skill inversions. This
 * QA domain deliberately refuses a later-round inspection by a trapped actor
 * rather than guessing whether their trap persists. Never admitted to normal.
 */
import {trapRevivalDomain} from './revival-capability.js';
import {liveWitchDomain} from '../experimental/owner-bb-v2/live-witch-domain.js';
import {APPROVED_RULESET_VERSION,isApprovedRuleVersion,type Effect,type GameState,type GameAction} from '../../../shared/contracts/index.js';
import type {RuleRegistry,RuleContext} from '../engine/rules.js';
import {participant} from '../engine/state.js';
import {KernelError} from '../common/errors.js';
export const ENGINEER_TRAP='official.10.trap';
export const ENGINEER_RULE='S15_DEEP_CHAR_10_INSPECTION_TRAP';
export const ENGINEER_MARK='S15_ENGINEER_TRAP';
const HISTORY='S15_ENGINEER_TRAP_USED';
export function engineerDeckIds(ids:readonly number[]):boolean{return ids.length===4&&[...ids].sort((a,b)=>a-b).join(',')==='5,10,25,74';}
export function engineerDeck(s:GameState):boolean{return isApprovedRuleVersion(s.ruleVersion)&&(trapRevivalDomain(s)||liveWitchDomain(s)||engineerDeckIds(s.participants.map(p=>p.initialCharacterId))||s.qaProfile==='owner-bb-live-trap-qa-v1'&&s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='5,10,25,31,74')&&!s.links.length&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function engineerReady(s:GameState,id:string):boolean{const p=participant(s,id);return engineerDeck(s)&&(s.round===1||s.qaProfile==='owner-bb-live-trap-qa-v1')&&p.currentCharacterId===10&&p.life==='ALIVE'&&p.effects.filter(x=>x.kind===HISTORY).length<2;}
function validate(s:GameState,a:GameAction){if(!engineerReady(s,a.playerId))throw new KernelError('RULE_UNRESOLVED','Engineer trap: verified first-night QA domain only');if(a.targetIds.length!==1||a.targetIds[0]===a.playerId||participant(s,a.targetIds[0]!).life!=='ALIVE'||participant(s,a.playerId).effects.some(x=>x.kind===HISTORY&&x.payload?.targetId===a.targetIds[0]))throw new KernelError('TARGET_INVALID','Choose an eligible untrapped player');}
export function registerEngineerTrap(r:RuleRegistry){r.register({characterId:10,skillId:ENGINEER_TRAP,ruleId:ENGINEER_RULE,ruleVersion:APPROVED_RULESET_VERSION,priority:50,phases:['NIGHT_COLLECT'],target:{min:1,max:1,allowSelf:false,aliveOnly:true},maxUsesPerPhase:1,validateSubmission:validate,evaluate(s,a){validate(s,a);return [{type:'STATUS',key:ENGINEER_MARK,targetId:a.targetIds[0]!,causeId:a.playerId}];}});return r;}
export function applyEngineerTrap(s:GameState,e:Effect,a:GameAction){validate(s,a);if(e.type!=='STATUS'||e.key!==ENGINEER_MARK||e.causeId!==a.playerId||e.targetId!==a.targetIds[0])throw new KernelError('RULE_UNRESOLVED','Invalid engineer trap provenance');participant(s,e.targetId).effects.push({id:`engineer-mark-${a.actionId}`,kind:ENGINEER_MARK,sourceId:a.playerId,payload:{round:s.round,sourceRule:'character.json#10',...(s.qaProfile?{qaProfile:s.qaProfile,ruleVersion:s.ruleVersion}:{})}});participant(s,a.playerId).effects.push({id:`engineer-use-${a.actionId}`,kind:HISTORY,payload:{targetId:e.targetId,round:s.round}});return {type:'S15_ENGINEER_TRAP_PLACED',targetId:e.targetId,payload:{sourceRule:'character.json#10'}};}
export function engineerDistorts(s:GameState,actorId:string):boolean{if(!engineerDeck(s))return false;const mark=participant(s,actorId).effects.find(e=>e.kind===ENGINEER_MARK);if(!mark)return false;if(s.qaProfile!=='owner-bb-live-trap-qa-v1'&&mark.payload?.round!==s.round)throw new KernelError('RULE_UNRESOLVED','Trap lifetime across nights is not verified');return true;}
/** No exact-role/aura substitution: each observation retains its own type. */
export function invertEngineerAura(real:string,allowUnknown=false):string{if(real==='Thiện')return 'Ác';if(real==='Ác'||(allowUnknown&&real==='Không xác định'))return 'Thiện';throw new KernelError('RULE_UNRESOLVED','No unknown-aura target in this verified trap domain');}
export function engineerFalseRoleDomain(s:GameState,real:number):string[]{return [...new Set(s.participants.map(p=>p.initialCharacterId))].filter(id=>id!==real).map(String).sort();}
export function engineerFalseRole(s:GameState,real:number,ctx:RuleContext):number{return Number(ctx.random(engineerFalseRoleDomain(s,real),'Q13-06: locked composition excluding true role'));}
