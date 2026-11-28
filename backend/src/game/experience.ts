import type {GameState,EngineEvent} from '../../../shared/contracts/index.js';
/** Product projection only. Never read officialAudit, directives, hidden weights or effective ballots. */
export const PUBLIC_VOTE_POLICY='DECLARED_ORDINARY_V1' as const;
const ordinaryRoles=new Set([8,9,25,31,64,74]);
export function supportsPublicOrdinaryVote(ids:readonly number[]){return ids.length>0&&ids.every(id=>ordinaryRoles.has(id));}
export function publicVoting(state:GameState){
 if(state.publicVotePolicy!==PUBLIC_VOTE_POLICY||state.phase!=='DAY_VOTE_COLLECT'||state.voting?.status!=='OPEN'||state.voting.round!==state.round)return undefined;
 // Scope fixed at creation. The currently supported ordinary roster has no hidden vote transform.
 // The display is a count of declared choices, not a verdict or effective vote ledger.
 const targets=state.participants.filter(p=>!p.publicReportedDead).map(p=>({playerId:p.playerId,count:0}));
 const byId=new Map(targets.map(t=>[t.playerId,t]));let blankCount=0;
 for(const ballot of state.voting.intents){if(ballot.targetId==='')blankCount++;else{const t=byId.get(ballot.targetId);if(t)t.count++;}}
 return {policy:PUBLIC_VOTE_POLICY,round:state.round,targets,blankCount,totalDeclared:targets.reduce((n,t)=>n+t.count,blankCount)};
}
/** The phase clock uses committed event timestamps, not the client's arrival time.
 * Current gameplay uses manual phase closure; AFK-specific timeout is not a generic deadline. */
export function phaseTiming(state:GameState,events:readonly EngineEvent[],now=Date.now()){
 let startedAt:number|null=null;for(let i=events.length-1;i>=0;i--){const e=events[i]!;if(e.eventType!=='STATE_COMMITTED')continue;const s=e.payload.state as unknown as GameState;if(s.phase!==state.phase||s.round!==state.round)break;startedAt=e.timestamp;}
 return {phaseId:`${state.gameId}:${state.round}:${state.phase}`,phaseType:state.phase,startedAt,deadlineAt:null,serverTime:now,remainingTime:null,timingPolicy:'MANUAL_PHASE_NO_DEADLINE',phaseStatus:state.completed?'COMPLETED':state.phase.endsWith('RESOLVE')?'RESOLUTION_CHECKPOINT':'WAITING'};
}
export function ownVoteJournal(events:readonly EngineEvent[],viewer:string){
 let round=1;const out:Array<{round:number;targetId:string;submittedAt:number;status:'RECORDED'}>=[];
 for(const e of events){if(e.eventType==='PHASE_CHANGED'&&typeof e.payload.round==='number')round=e.payload.round;if(e.eventType==='VOTE_INTENT_RECORDED'&&e.recipientId===viewer&&typeof e.payload.targetId==='string')out.push({round:typeof e.payload.round==='number'?e.payload.round:round,targetId:e.payload.targetId,submittedAt:e.timestamp,status:'RECORDED'});}
 return out;
}

/** Ordinary vote readiness is public by construction; never inspect hidden weights. */
export function moderatorProgress(state:GameState,nightAllReceived=false){
 const pv=publicVoting(state),phaseId=`${state.gameId}:${state.round}:${state.phase}`;
 const expected=state.participants.filter(p=>!p.publicReportedDead).length;
 const allReceived=!!pv&&expected>0&&pv.totalDeclared===expected||state.phase==='NIGHT_COLLECT'&&state.publicVotePolicy===PUBLIC_VOTE_POLICY&&nightAllReceived;
 return {phaseId,allReceived,command:state.completed?null:state.phase==='NIGHT_COLLECT'?'advance-night':state.phase==='DAY_DISCUSS'?'voting-open':pv?'voting-close':null};
}
/** Small journal summary projection. Only explicitly public event types and
 * the caller's own delayed bell result; no internal lifecycle or ballots. */
export function journalSummaries(events:readonly EngineEvent[],viewer:string){
 let round=1,phase='ROLE_ASSIGNED';const groups=new Map<string,{period:string;round:number;events:Array<{type:string;playerId?:string;outcome?:string}>;closed:boolean}>();const privateResults:Array<{round:number;period:string;label:string;targetId:string;result:string}>=[];
 const periodFor=(p:string)=>p.startsWith('NIGHT')||p==='WITCH_WINDOW'?'Đêm':p.startsWith('DAY')?'Ngày':null;
 const ensure=(period:string,r:number)=>{const key=period+':'+r;if(!groups.has(key))groups.set(key,{period,round:r,events:[],closed:false});return groups.get(key)!;};
 for(const e of events){if(e.eventType==='PHASE_CHANGED'&&e.visibility==='ROOM_PUBLIC'){const next=String(e.payload.phase),nr=Number(e.payload.round),old=periodFor(phase),np=periodFor(next);if(old&&(old!==np||round!==nr))ensure(old,round).closed=true;phase=next;if(Number.isSafeInteger(nr))round=nr;if(np)ensure(np,round);continue;}
 const period=periodFor(phase);if(!period)continue;const g=ensure(period,round);
 if(e.visibility==='ROOM_PUBLIC'){if(e.eventType==='PLAYER_ELIMINATED'&&typeof e.payload.playerId==='string')g.events.push({type:'DEATH',playerId:e.payload.playerId});else if(e.eventType==='PLAYER_REVIVED'&&typeof e.payload.playerId==='string')g.events.push({type:'REVIVAL',playerId:e.payload.playerId});else if(['OFFICIAL_VOTE_RESULT','VOTE_OUTCOME_CONFIRMED'].includes(e.eventType)&&typeof e.payload.outcome==='string')g.events.push({type:'VOTE',outcome:e.payload.outcome});else if(e.eventType==='MATCH_COMPLETED'){g.events.push({type:'END'});g.closed=true;}}
 if(e.visibility==='PLAYER_PRIVATE'&&e.recipientId===viewer&&e.eventType==='S15_SCALE_BELL_OBSERVED'&&typeof e.payload.roleName==='string'&&e.targetId)privateResults.push({round,period,label:'Chuông báo',targetId:e.targetId,result:e.payload.roleName});
 }
 return {summaries:[...groups.values()].filter(g=>g.closed),privateResults};
}
