/** VH77: a night-only one-to-one channel. Internal records carry provenance;
 * recipients receive two independently projected messages without actorId or
 * targetId. No generic private message feature or client-chosen identity. */
import {randomUUID} from 'node:crypto';
import type {GameState,EngineEvent} from '../../../shared/contracts/index.js';
import type {PendingEvent} from '../engine/events.js';
import {invariant} from '../common/errors.js';
import {revivalDeck} from './revival.js';
import {prolongDomain} from './life02.js';
const AUDIT='MEDIUM_CHAT_INTERNAL';
export const MEDIUM_CHAT_EVENT='MEDIUM_CHAT_MESSAGE';
function domain(s:GameState){return (revivalDeck(s)||prolongDomain(s))&&!s.completed&&s.phase==='NIGHT_COLLECT';}
function medium(s:GameState){return s.participants.find(p=>p.currentCharacterId===(prolongDomain(s)?51:26)&&p.life==='ALIVE'&&!p.skillLocks.includes('*'));}
function deadTargets(s:GameState){return s.participants.filter(p=>p.life==='DEAD_FINAL'&&p.publicReportedDead);}
// A reported-dead sleeper is a valid address, but receives no messages while asleep.
function addressTargets(s:GameState){return prolongDomain(s)?s.participants.filter(p=>p.publicReportedDead):deadTargets(s);}
function label(s:GameState){return prolongDomain(s)?{roleLabel:'Người Lái Đò'}:{ };}
function records(events:readonly EngineEvent[]){return events.filter(e=>e.eventType===AUDIT&&e.visibility==='SERVER_INTERNAL');}
function current(s:GameState,events:readonly EngineEvent[]){return records(events).filter(e=>e.payload.round===s.round);}
export function mediumChatView(s:GameState,viewerId:string,events:readonly EngineEvent[]){
 if(!domain(s))return undefined;const m=medium(s);if(!m)return undefined;
 const list=current(s,events);const dead=deadTargets(s);
 if(viewerId===m.playerId)return addressTargets(s).length?{kind:'MEDIUM' as const,...label(s),targets:addressTargets(s).map(p=>({playerId:p.playerId,sessionId:list.find(e=>e.payload.deadId===p.playerId)?.payload.sessionId??null}))}:undefined;
 if(!dead.some(p=>p.playerId===viewerId))return undefined;
 const opened=list.find(e=>e.payload.deadId===viewerId);return opened?{kind:'DEAD' as const,...label(s),sessionId:opened.payload.sessionId}:undefined;
}
export function prepareMediumChat(s:GameState,events:readonly EngineEvent[],actorId:string,body:any):{duplicate:boolean;refresh:string[];events:PendingEvent[]} {
 invariant(typeof body?.text==='string'&&body.text.trim().length>0&&body.text.length<=500&&typeof body?.messageId==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(body.messageId),'INVALID_ARGUMENT','Invalid chat message');
 const text=body.text.trim(),id=body.messageId as string,prior=records(events).filter(e=>e.actorId===actorId),retry=prior.find(e=>e.correlationId===id);
 const requestTarget=typeof body.targetId==='string'?body.targetId:null,requestSession=typeof body.sessionId==='string'?body.sessionId:null;
 if(retry){invariant(retry.payload.text===text&&retry.payload.requestTarget===requestTarget&&retry.payload.requestSession===requestSession,'IDEMPOTENCY_CONFLICT','Chat key reused');return {duplicate:true,refresh:[actorId],events:[]};}
 invariant(domain(s),'OUT_OF_PHASE','Private night channel unavailable');const m=medium(s);invariant(m,'UNAUTHORIZED','Private channel unavailable');
 const list=current(s,events);let deadId:string,sessionId:string;const asMedium=actorId===m.playerId;
 if(asMedium){invariant(requestTarget&&requestSession===null&&addressTargets(s).some(p=>p.playerId===requestTarget),'UNAUTHORIZED','Private channel unavailable');deadId=requestTarget;sessionId=String(list.find(e=>e.payload.deadId===deadId)?.payload.sessionId??randomUUID());}
 else {invariant(requestTarget===null&&requestSession&&deadTargets(s).some(p=>p.playerId===actorId)&&list.some(e=>e.payload.deadId===actorId&&e.payload.sessionId===requestSession),'UNAUTHORIZED','Private channel unavailable');deadId=actorId;sessionId=requestSession;}
 invariant(prior.filter(e=>Date.now()-e.timestamp<10000).length<5,'RESOURCE_INSUFFICIENT','Chat rate limit');
 const privateEvent=(recipientId:string,own:boolean):PendingEvent=>({eventType:MEDIUM_CHAT_EVENT,visibility:'PLAYER_PRIVATE',recipientId,correlationId:id,payload:{sessionId,round:s.round,text,own,...(recipientId===m.playerId?{deadPlayerId:deadId}:{})}});
 const deliver=deadTargets(s).some(p=>p.playerId===deadId);
 return {duplicate:false,refresh:deliver?[m.playerId,deadId]:[m.playerId],events:[{eventType:AUDIT,visibility:'SERVER_INTERNAL',actorId,correlationId:id,payload:{sessionId,round:s.round,deadId,mediumId:m.playerId,text,requestTarget,requestSession}},privateEvent(m.playerId,asMedium),...(deliver?[privateEvent(deadId,!asMedium)]:[{eventType:"MEDIUM_CHAT_UNDELIVERED",visibility:"SERVER_INTERNAL" as const,correlationId:id,payload:{round:s.round,sessionId}}])]};
}
