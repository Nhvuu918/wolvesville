import {life02Domain,life02NameOverride} from '../official/life02.js';
import {cultDeck} from '../official/cult-recruitment.js';
import {ownerDc} from '../experimental/owner-dc-policy.js';
import {soulDeck} from '../official/soul-shooter.js';
import {mixedExileIds} from '../official/final-pack.js';
import {STONE_SPENT} from '../official/breakthrough-rules.js';
import type {EngineEvent,GameState,Participant} from '../../../shared/contracts/index.js';
import {isPreliminaryRescueDeck} from '../official/preliminary-death.js';
import {participant} from './state.js';
/** Scope by immutable initial roster, not a secret current faction. */
export function mixedPackPrivacyScope(state:GameState):boolean {
 return state.qaProfile==='owner-bb-live-pack-qa-v1'&&mixedExileIds(state.participants.map(p=>p.initialCharacterId));
}
export type ViewContext={viewerId:string;admin?:boolean;postgame?:boolean};
export function canReadEvent(state:GameState,e:EngineEvent,ctx:ViewContext):boolean {
  if(ctx.admin)return true;
  const viewer=state.participants.find(p=>p.playerId===ctx.viewerId);
  if(!viewer)return false;
  switch(e.visibility){
    case 'SERVER_INTERNAL':return false;
    case 'ROOM_PUBLIC':return true;
    case 'PLAYER_PRIVATE':return e.recipientId===viewer.playerId;
    // Historical ACL must be frozen when the event is created, never
    // recomputed from the viewer's current team after conversion.
    case 'FACTION_RESTRICTED':return !!e.audience?.includes(viewer.playerId);
    case 'GROUP_RESTRICTED':return !!e.audience?.includes(viewer.playerId);
    case 'POSTGAME_AUTHORIZED':return state.completed&&!!ctx.postgame;
    default:return false;
  }
}
// Crucially this endpoint is not GameState serialization.
export function projectState(state:GameState,viewerId:string):Record<string,unknown>{
  const me=participant(state,viewerId);
  return {
    gameId:state.gameId,roomId:state.roomId,phase:state.phase,round:state.round,ruleVersion:state.ruleVersion,
    revision:state.revision,completed:state.completed,...(state.life02DevelopmentScope?{developmentScope:state.life02DevelopmentScope}:{}),...(state.qaProfile?{qaProfile:state.qaProfile,...(state.qaBbPolicyVersion?{qaBbPolicyVersion:state.qaBbPolicyVersion,qaNightWindow:state.qaNightWindow??null}:{})}:{}),
    ...(state.resolutionGate?{resolutionStatus:state.resolutionGate.status}:{}),
    ...(state.completed?{winnerIds:[...state.winnerIds]}:{}),
    players:state.participants.map(p=>({playerId:p.playerId,publicReportedDead:p.publicReportedDead,
      ...(p.playerId===me.playerId?{self:{initialCharacterId:p.initialCharacterId,currentCharacterId:p.currentCharacterId,
        currentFaction:p.currentFaction,...(life02Domain(state)&&life02NameOverride(p)?{roleNameOverride:life02NameOverride(p)}:{}),...(p.effects.some(e=>e.kind===STONE_SPENT)?{roleNameOverride:'Sói thường'}:{}),life:state.qaDeferredNightDeaths?.some(d=>d.victimId===p.playerId)&&p.currentCharacterId!==29?'ALIVE':isPreliminaryRescueDeck(state)&&p.life==='PENDING_DEATH'&&![29,87].includes(p.currentCharacterId)?'ALIVE':p.life,resources:{...p.resources},skillLocks:[...p.skillLocks]}}:{})})),
  };
}
// Even events marked public must carry a minimal, author-approved projection payload.
export function projectEvents(state:GameState,events:EngineEvent[],ctx:ViewContext):Array<Record<string,unknown>>{
  participant(state,ctx.viewerId);
  const redactLedgerPosition=(mixedPackPrivacyScope(state)||soulDeck(state)||ownerDc(state)||cultDeck(state)||life02Domain(state))&&!ctx.admin;
  // The append-only ledger retains real positions. A player gets a stable
  // viewer-local ordinal over the authorized stream (frozen event audiences).
  // A group chat event does not advance gameplay revision. Remove unauthorized
  // group-only ledger positions even for legacy raw-position projections;
  // otherwise a subsequent visible event ID would reveal the private message.
  let hiddenGroupMessages=0,visible=0;
  return events.flatMap(e=>{
    if(!canReadEvent(state,e,ctx)){if(e.eventType==='GAME_GROUP_CHAT')hiddenGroupMessages++;return [];}
    const seq=redactLedgerPosition?++visible:e.sequence-hiddenGroupMessages;
    return [{eventId:redactLedgerPosition?`${state.gameId}:visible:${seq}`:`${state.gameId}:${seq}`,seq,eventType:e.eventType,
    payload:e.payload, ...(e.actorId?{actorId:e.actorId}:{}), ...(e.targetId?{targetId:e.targetId}:{})}];
  });
}
