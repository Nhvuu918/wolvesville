import type {EngineEvent,Visibility} from '../../../shared/contracts/index.js';
import type {GameRepository} from '../persistence/sqlite.js';
import {hash} from '../common/canonical.js';
export interface PendingEvent {
  eventType:string;payload:Record<string,unknown>;visibility:Visibility;
  actorId?:string;targetId?:string;recipientId?:string;faction?:string;
  groupId?:string; audience?:string[];correlationId:string;
}
// Append-only events written inside the same repository transaction as state.
export class EventLedger {
  constructor(private readonly repo:GameRepository) {}
  append(gameId:string,ruleVersion:string,events:PendingEvent[]):number {
    for(const p of events){
      const row=this.repo.get(gameId);
      const data={eventId:`${gameId}:${row.lastSeq+1}`,gameId,sequence:row.lastSeq+1,
        eventType:p.eventType,timestamp:Date.now(),actorId:p.actorId,targetId:p.targetId,
        payload:p.payload,visibility:p.visibility,recipientId:p.recipientId,
        faction:p.faction,groupId:p.groupId,audience:p.audience,
        ruleVersion,correlationId:p.correlationId,prevHash:row.lastHash};
      const e:EngineEvent={...data,eventHash:hash(data)};
      this.repo.recordEvent(e);
    }
    return this.repo.get(gameId).lastSeq;
  }
}
