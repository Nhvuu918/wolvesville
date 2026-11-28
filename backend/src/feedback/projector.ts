/** Generic server-only feedback projector. Future skills must explicitly register
 * event result handlers; unregistered event types NEVER release payloads. */
import type {SkillFeedback,ResultType} from './contract.js';

export interface AuthorizedResult {resultType:ResultType;payload:Record<string,unknown>}
export interface AuthorizedEvent {
 seq:number;eventType:string;actorId?:string;targetId?:string;
 payload?:Record<string,unknown>;
}
export interface OwnedAction {
 actionId:string;playerId:string;skillId:string;status:string;
}
export interface ActionEventTimestamp {actionId:string;type:'ACTION_ACCEPTED'|'ACTION_RESOLVED'|'ACTION_CANCELLED';timestamp:number}
export type ResultProjector=(event:AuthorizedEvent)=>AuthorizedResult|null;
/** No arbitrary event body or serialized state crosses this boundary. */
export class SkillResultRegistry {
 private readonly projectors=new Map<string,ResultProjector>();
 register(eventType:string,projector:ResultProjector){
  if(this.projectors.has(eventType))throw new Error('SKILL_FEEDBACK_DUPLICATE_EVENT');
  this.projectors.set(eventType,projector);return this;
 }
 project(event:AuthorizedEvent):AuthorizedResult|null{return this.projectors.get(event.eventType)?.(event)??null;}
}
/** Read-only role inspection is the first approved result schema, NOT the only possible schema. */
export const approvedFeedbackResults=new SkillResultRegistry().register('ROLE_OBSERVED',(e)=>{
 if(e.payload?.roleName==='Dân thường'&&e.payload?.characterId===undefined&&typeof e.targetId==='string')return {resultType:'ROLE_INFORMATION',payload:{roleName:'Dân thường',targetId:e.targetId}};
 const id=e.payload?.characterId;
 if(!Number.isInteger(id)||Number(id)<1||Number(id)>97||typeof e.targetId!=='string')return null;
 return {resultType:'ROLE_INFORMATION',payload:{characterId:id,targetId:e.targetId}};
}).register('S15_MAGE_SHIELD_REVEAL',(e)=>{
 const id=e.payload?.characterId;
 if(!Number.isInteger(id)||Number(id)<1||Number(id)>97||typeof e.targetId!=='string')return null;
 return {resultType:'ROLE_INFORMATION',payload:{characterId:id,targetId:e.targetId,context:'SHIELD_SUCCESS'}};
}).register('SEER_AURA_OBSERVED',(e)=>{
 const verdict=e.payload?.verdict;
 if(!['Thiện','Ác','Không xác định'].includes(String(verdict))||typeof e.targetId!=='string')return null;
 return {resultType:'AURA_INFORMATION',payload:{verdict,targetId:e.targetId,context:'SEER_AURA'}};
}).register('SOUL_JUDGMENT_OBSERVED',(e)=>{
 const verdict=e.payload?.verdict;
 if(!['Thiện','Ác','Không xác định'].includes(String(verdict))||typeof e.targetId!=='string')return null;
 return {resultType:'AURA_INFORMATION',payload:{verdict,targetId:e.targetId}};
});

export function projectSkillFeedback(args:{
 gameId:string;viewerId:string;ruleVersion:string;revision:number;
 actions:OwnedAction[];visibleEvents:AuthorizedEvent[];
 actionTimestamps?:ActionEventTimestamp[];
 registry?:SkillResultRegistry;
}):{schemaVersion:1;gameId:string;revision:number;items:SkillFeedback[]} {
 const {gameId,viewerId,ruleVersion,revision,actions,visibleEvents,actionTimestamps=[]}=args;
 const registry=args.registry??approvedFeedbackResults;
 const items:SkillFeedback[]=[];
 for(const a of actions){
  // This invariant is checked again despite repository filtering.
  if(a.playerId!==viewerId)continue;
  const resolvedEvent=visibleEvents.filter(e=>e.payload?.actionId===a.actionId)
    .map(e=>({event:e,result:registry.project(e)})).find(x=>x.result!==null);
  const status=a.status==='RESOLVED'?'RESOLVED':a.status==='CANCELLED'?'CANCELLED':'PENDING_RESOLUTION';
  const result=status==='RESOLVED'?resolvedEvent?.result:null;
  const accepted=actionTimestamps.find(e=>e.actionId===a.actionId&&e.type==='ACTION_ACCEPTED')?.timestamp??null;
  const finished=actionTimestamps.find(e=>e.actionId===a.actionId&&['ACTION_RESOLVED','ACTION_CANCELLED'].includes(e.type))?.timestamp??null;
  items.push({schemaVersion:1,feedbackId:`${gameId}:${a.actionId}:feedback`,gameId,actionId:a.actionId,
   actorPlayerId:viewerId,skillId:a.skillId,ruleVersion,
   actionStatus:a.status==='ACCEPTED'?'ACCEPTED':status,resolutionStatus:status,
   resultType:result?.resultType??'NONE',visibilityScope:'PLAYER_PRIVATE',audience:[viewerId],
   resultPayload:result?.payload??null,eventSequence:result?resolvedEvent?.event.seq??null:null,
   eventRevision:revision,createdAt:accepted,resolvedAt:finished});
 }
 return {schemaVersion:1,gameId,revision,items};
}
