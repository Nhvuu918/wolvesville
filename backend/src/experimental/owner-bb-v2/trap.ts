/** DEC-BT-02=B, candidate-only persistent mark ledger. Runs at trusted
 * resolution boundary, not at client submission. No live ruleset imports it.
 * Original effects are already validated by the caller; this is a pure
 * transformation plan, not a substitute for attack/death-chain resolution. */
import {APPROVED_RULESET_VERSION,type Effect,type GameState,type GameAction,type RandomRecord} from '../../../../shared/contracts/index.js';
import {canonical,clone} from '../../common/canonical.js';
import {draw} from '../../engine/rng.js';
import {PROFILE} from './pack.js';
import {candidateMatchBinding} from '../owner-bb/binding.js';
import {candidateActionBlocked} from '../owner-bb/locks.js';
export interface TrapMark {id:string;sourceId:string;targetId:string;placedRound:number;ruleVersion:string;state:'WAITING'|'CONSUMED';consumedBy?:string;consumedRound?:number}
export interface TrapOutcome {actionId:string;kind:'NO_TRIGGER'|'NO_MARK'|'TRANSFORMED'|'IMMUNE'|'PENDING';effects:Effect[];proposedEffects?:Effect[];rng?:RandomRecord;blocker?:string;markId?:string}
interface Receipt {actionId:string;fingerprint:string;outcome:TrapOutcome}
export interface TrapState {profile:typeof PROFILE;gameId:string;ruleVersion:string;matchBinding:string;lockedRoleIds:number[];marks:TrapMark[];receipts:Receipt[];randomCursor:number;gameRevision:number;groups?:GroupReceipt[]}
export interface Resolution {state:GameState;action:GameAction;status:'EXECUTED'|'REJECTED'|'CANCELLED'|'BLOCKED'|'SKIPPED';effects:Effect[];acceptedWhileAlive?:boolean}
const check=(ok:unknown,code:string)=>{if(!ok)throw Error(code);};
const find=(s:GameState,id:string)=>{const p=s.participants.find(p=>p.playerId===id);if(!p)throw Error('UNKNOWN_PARTICIPANT');return p;};
export function openTraps(s:GameState):TrapState{check(s.ruleVersion===APPROVED_RULESET_VERSION&&!s.completed,'INVALID_GAME_SCOPE');return {profile:PROFILE,gameId:s.gameId,ruleVersion:s.ruleVersion,matchBinding:candidateMatchBinding(s),lockedRoleIds:s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b),marks:[],receipts:[],randomCursor:0,gameRevision:s.revision};}
function scope(t:TrapState,s:GameState,a:GameAction){check(t.profile===PROFILE&&t.gameId===s.gameId&&s.gameId===a.gameId&&t.ruleVersion===s.ruleVersion&&s.ruleVersion===a.ruleVersion&&s.ruleVersion===APPROVED_RULESET_VERSION&&!s.completed&&s.round===a.round&&t.matchBinding===candidateMatchBinding(s),'SCOPE_MISMATCH');check(s.revision>=t.gameRevision,'STALE_GAME_SNAPSHOT');check(typeof a.actionId==='string'&&a.actionId.length>0,'INVALID_ACTION');}
/** Placement is called only for an already validated and actually executed
 * trap action; no arbitrary client-supplied state or resolution accepted. */
export function placeTrap(t:TrapState,s:GameState,a:GameAction,acceptedWhileAlive=false):TrapState{
 scope(t,s,a);const actor=find(s,a.playerId);check(actor.currentCharacterId===10&&a.skillId==='official.10.trap'&&a.phase==='NIGHT_COLLECT'&&s.phase==='NIGHT_RESOLVE','INVALID_PLACEMENT');
 const target=a.targetIds[0];check(a.targetIds.length===1&&target!==a.playerId,'INVALID_TARGET');find(s,target);
 const prior=t.marks.find(m=>m.id===a.actionId);if(prior){check(prior.sourceId===a.playerId&&prior.targetId===target&&prior.placedRound===a.round,'IDEMPOTENCY_CONFLICT');return t;}
 check(actor.life==='ALIVE'||acceptedWhileAlive,'INVALID_ACTOR');check(!candidateActionBlocked(s,a.playerId,a.skillId),'BLOCKED');check(find(s,target).life==='ALIVE','INVALID_TARGET');
 const history=t.marks.filter(m=>m.sourceId===a.playerId);check(history.length<2,'RESOURCE_EXHAUSTED');check(!history.some(m=>m.targetId===target),'TARGET_ALREADY_TRAPPED');check(!history.some(m=>m.placedRound===s.round),'ONE_PLACEMENT_PER_NIGHT_EXISTING_SCOPE');
 check(!t.marks.some(m=>m.targetId===target&&m.state==='WAITING'),'MULTIPLE_TRAPS_PENDING_POLICY');
 return {...t,gameRevision:s.revision,marks:[...t.marks,{id:a.actionId,sourceId:a.playerId,targetId:target,placedRound:s.round,ruleVersion:s.ruleVersion,state:'WAITING'}]};
}
const aura='official.25.inspect-role',role='official.74.inspect-role',judgment='official.5.weigh-soul',guard='official.31.guard',poison='official.29.poison',rescue='official.29.rescue';
function resolveSingle(t:TrapState,r:Resolution):{state:TrapState;outcome:TrapOutcome;duplicate:boolean}{
 const {state:s,action:a}=r;scope(t,s,a);const actor=find(s,a.playerId);const fp=canonical({action:a,status:r.status,effects:r.effects,acceptedWhileAlive:!!r.acceptedWhileAlive});
 const prior=t.receipts.find(x=>x.actionId===a.actionId);if(prior){check(prior.fingerprint===fp,'IDEMPOTENCY_CONFLICT');return {state:t,outcome:clone(prior.outcome),duplicate:true};}
 const base={actionId:a.actionId,effects:clone(r.effects)};let outcome:TrapOutcome;let marks=t.marks;let cursor=t.randomCursor;
 const mark=t.marks.find(m=>m.targetId===a.playerId&&m.state==='WAITING');
 if(r.status!=='EXECUTED')return {state:t,outcome:{...base,effects:[],kind:'NO_TRIGGER'},duplicate:false};
 // Only execution after the normal lock/target/resource validator may invoke
 // this hook. PH-01 permits accepted-while-alive actions to finish after death.
 check(actor.life==='ALIVE'||actor.life==='PROLONGED'||actor.life==='PENDING_DEATH'&&[poison,rescue].includes(a.skillId)||r.acceptedWhileAlive,'INVALID_EXECUTION_ACTOR');
 check(!candidateActionBlocked(s,a.playerId,a.skillId),'BLOCKED_EXECUTION');
 check(a.phase==='NIGHT_COLLECT'&&s.phase==='NIGHT_RESOLVE'||a.phase==='WITCH_WINDOW'&&s.phase==='WITCH_WINDOW'||a.phase==='DAY_DISCUSS'&&s.phase==='DAY_DISCUSS','INVALID_EXECUTION_PHASE');
 if(!mark)outcome={...base,kind:'NO_MARK'};
 else{
  const e=r.effects[0];const one=r.effects.length===1&&a.targetIds.length===1&&e?.targetId===a.targetIds[0];
  if(one&&a.skillId===judgment&&actor.currentCharacterId===5&&e.type==='INFORMATION_RESULT'&&e.recipientId===a.playerId&&e.visibility==='PLAYER_PRIVATE'){
   const target=find(s,e.targetId);const truth=target.currentFaction==='dan'?'Thiện':target.currentFaction==='soi'?'Ác':'Không xác định';check(e.value===truth,'JUDGMENT_MUST_BE_TRUE');outcome={...base,kind:'IMMUNE',markId:mark.id};
  }else if(one&&a.skillId===aura&&actor.currentCharacterId===25&&e.type==='INFORMATION_RESULT'&&e.recipientId===a.playerId&&e.visibility==='PLAYER_PRIVATE'){
   // SYS-25 + #10 source: unknown -> good; #25 never returns role IDs.
   check(['Thiện','Ác','Không xác định'].includes(String(e.value)),'AURA_TYPE_MISMATCH');outcome={...base,kind:'TRANSFORMED',markId:mark.id,effects:[{...e,value:e.value==='Thiện'?'Ác':'Thiện'}]};
  }else if(one&&a.skillId===role&&actor.currentCharacterId===74&&e.type==='INFORMATION_RESULT'&&e.recipientId===a.playerId&&e.visibility==='PLAYER_PRIVATE'){
   check(typeof e.value==='number'&&e.value===find(s,e.targetId).currentCharacterId,'ROLE_TYPE_MISMATCH');const domain=[...new Set(t.lockedRoleIds)].filter(id=>id!==e.value).map(String);
   if(!domain.length)outcome={...base,effects:[],kind:'PENDING',markId:mark.id,blocker:'Q13-06_EMPTY_RNG_DOMAIN'};
   else{const rng=draw(s.seed,`${s.gameId}|${PROFILE}|trap`,cursor,domain,'Q13-06',a.actionId);cursor++;outcome={...base,kind:'TRANSFORMED',markId:mark.id,rng,effects:[{...e,value:Number(rng.result)}]};}
  }else if(one&&a.skillId===guard&&actor.currentCharacterId===31&&e.type==='PROTECTION'&&e.causeId===a.playerId){
   // BB-04=B: direct death is applied at candidate runtime boundary.
   outcome={...base,kind:'TRANSFORMED',markId:mark.id,effects:[{type:'DEATH_TRANSITION',key:'CANDIDATE_INVERTED_GUARD',targetId:e.targetId,causeId:a.playerId}]};
  }else if(one&&a.skillId===poison&&actor.currentCharacterId===29&&e.type==='DEATH_TRANSITION'&&e.causeId===a.playerId){outcome={...base,kind:'TRANSFORMED',markId:mark.id,effects:[]};}
  else if(one&&a.skillId===rescue&&actor.currentCharacterId===29&&e.type==='HEAL'&&e.causeId===a.playerId){outcome={...base,kind:'TRANSFORMED',markId:mark.id,effects:[{type:'DEATH_TRANSITION',key:'CANDIDATE_INVERTED_RESCUE',targetId:e.targetId,causeId:a.playerId}]};}
  else outcome={...base,effects:[],kind:'PENDING',markId:mark.id,blocker:'UNSUPPORTED_INVERSION_OR_MULTI_EFFECT'};
  // Do not consume on a pending transaction. The group adapter commits the mark and candidate effects together.
  if(outcome.kind==='TRANSFORMED'||outcome.kind==='IMMUNE')marks=t.marks.map(m=>m.id===mark.id?{...m,state:'CONSUMED',consumedBy:a.actionId,consumedRound:s.round}:m);
 }
 if(outcome.kind==='PENDING')return {state:t,outcome,duplicate:false};
 return {state:{...t,marks,randomCursor:cursor,gameRevision:s.revision,receipts:[...t.receipts,{actionId:a.actionId,fingerprint:fp,outcome:clone(outcome)}]},outcome,duplicate:false};
}
/** Trap provenance is server internal. Players never receive mark state; only
 * the normal authorized skill result, without a trap flag or RNG audit. */
export function projectTrapOutcome(outcome:TrapOutcome,actorId:string){if(!['TRANSFORMED','IMMUNE','NO_MARK'].includes(outcome.kind))return [];return outcome.effects.filter(e=>e.type==='INFORMATION_RESULT'&&e.visibility==='PLAYER_PRIVATE'&&e.recipientId===actorId).map(e=>({type:e.type,targetId:e.targetId,value:e.value}));}

/** BB-05=B: caller provides the COMPLETE sealed action group from the same
 * actor/turn; never allow the client to split it. Ordered by the upstream
 * resolution plan, not network arrival. Unknown mappings abort whole group. */
export interface GroupReceipt {groupId:string;fingerprint:string;actorId:string;round:number;phase:string;outcomes:TrapOutcome[]}
export function resolveTrapGroup(t:TrapState,groupId:string,items:readonly Resolution[]){
 check(typeof groupId==='string'&&/^[\w-]{1,128}$/.test(groupId)&&items.length>0,'INVALID_GROUP');
 const first=items[0]!,fp=canonical(items);const prior=t.groups?.find(g=>g.groupId===groupId);
 if(prior){check(prior.fingerprint===fp,'IDEMPOTENCY_CONFLICT');return {state:t,outcomes:clone(prior.outcomes),duplicate:true,pending:false};}
 check(items.every(r=>r.action.playerId===first.action.playerId&&r.action.round===first.action.round&&r.action.phase===first.action.phase&&r.action.gameId===first.action.gameId)&&new Set(items.map(r=>r.action.actionId)).size===items.length,'INVALID_GROUP_SCOPE');
 check(!t.groups?.some(g=>g.actorId===first.action.playerId&&g.round===first.action.round&&g.phase===first.action.phase),'TURN_GROUP_ALREADY_SEALED');
 check(!items.some(r=>t.receipts.some(x=>x.actionId===r.action.actionId)),'ACTION_ALREADY_GROUPED');
 let work=clone(t);const outcomes:TrapOutcome[]=[];const mark=t.marks.find(m=>m.targetId===first.action.playerId&&m.state==='WAITING');let consumedBy:string|undefined;
 for(const item of items){
  // A known consumed mark is temporarily held open within this one group.
  if(mark&&consumedBy)work.marks=work.marks.map(m=>m.id===mark.id?{...mark}:m);
  const r=resolveSingle(work,item);if(r.outcome.kind==='PENDING')return {state:t,outcomes:[r.outcome],duplicate:false,pending:true};
  work=r.state;outcomes.push(r.outcome);if(mark&&['TRANSFORMED','IMMUNE'].includes(r.outcome.kind))consumedBy??=item.action.actionId;
 }
 if(mark&&consumedBy)work.marks=work.marks.map(m=>m.id===mark.id?{...mark,state:'CONSUMED',consumedBy,consumedRound:first.action.round}:m);
 return {state:{...work,groups:[...(work.groups??[]),{groupId,fingerprint:fp,actorId:first.action.playerId,round:first.action.round,phase:first.action.phase,outcomes:clone(outcomes)}]},outcomes,duplicate:false,pending:false};
}
