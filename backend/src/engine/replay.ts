import {life02Domain} from '../official/life02.js';
import {hasClosedDeathLedger} from '../official/stable-death-proof.js';
import {verifySystemGroupChatEvent,validateSystemChatGroups} from '../official/group-chat.js';
import {representativeTape,allPlayerRepresentativeTape,ALL_PLAYER_POLICY,boundRepresentativeOrder} from '../experimental/owner-bb-v2/representative-order.js';
import type {GameState,EngineEvent} from '../../../shared/contracts/index.js';
import type {GameRepository} from '../persistence/sqlite.js';
import {canonical,clone,hash} from '../common/canonical.js';
import {invariant} from '../common/errors.js';
import {verifyDraw} from './rng.js';
import type {RandomRecord} from '../../../shared/contracts/index.js';
export function replay(repo:GameRepository,gameId:string):{state:GameState;events:number;draws:number;verified:boolean}{
  const {initial,state:current,lastHash,lastSeq}=repo.get(gameId);
  let result=clone(initial),prev='GENESIS',seenDraw=0;
  validateSystemChatGroups(initial);
  const groupKeys=new Set<string>();
  if(initial.qaBbPolicyVersion&&initial.qaProfile==='owner-bb-live-pack-qa-v1'){
    boundRepresentativeOrder(initial);
    const r=initial.qaRepresentativePolicy===ALL_PLAYER_POLICY?allPlayerRepresentativeTape(initial):representativeTape(initial);
    invariant(canonical(r.order)===canonical(initial.qaRepresentativeOrder)&&canonical(r.tape)===canonical(initial.qaRepresentativeTape),'REPLAY_CORRUPTED','Invalid representative RNG tape');
  }
  const events=repo.events(gameId);
  invariant(events.length===lastSeq,'REPLAY_CORRUPTED','Event log truncated');
  for(let i=0;i<events.length;i++){
    const e=events[i];
    invariant(e.sequence===i+1&&e.eventId===`${gameId}:${i+1}`&&e.prevHash===prev,'REPLAY_CORRUPTED','Missing/out-of-order event');
    const {eventHash,...withoutHash}=e;
    invariant(hash(withoutHash)===e.eventHash,'REPLAY_CORRUPTED',`Event hash mismatch at ${e.sequence}`);
    invariant(e.ruleVersion===initial.ruleVersion,'REPLAY_CORRUPTED','Ruleset changed during replay');
    prev=e.eventHash;
    if(e.eventType==='GAME_GROUP_CHAT'){verifySystemGroupChatEvent(result,e);const key=JSON.stringify([e.actorId,e.correlationId]);invariant(!groupKeys.has(key),'REPLAY_CORRUPTED','Duplicate group message key');groupKeys.add(key);}
    if(e.eventType==='STATE_COMMITTED'){
      const next=e.payload.state as GameState;
      invariant(next.gameId===gameId && next.revision===result.revision+1&&next.qaProfile===initial.qaProfile&&next.qaCultPolicy===initial.qaCultPolicy&&next.qaLife02Policy===initial.qaLife02Policy&&next.qaBbPolicyVersion===initial.qaBbPolicyVersion&&next.qaRepresentativePolicy===initial.qaRepresentativePolicy&&canonical(next.qaRepresentativeTape??null)===canonical(initial.qaRepresentativeTape??null)&&canonical(next.qaRepresentativeOrder??null)===canonical(initial.qaRepresentativeOrder??null),'REPLAY_CORRUPTED','Invalid state revision sequence');
      validateSystemChatGroups(next);if(life02Domain(next))invariant(hasClosedDeathLedger(next,events.slice(0,i+1)),'REPLAY_CORRUPTED','Invalid LIFE-02 death ledger');result=clone(next);
    }
    if(e.eventType==='RANDOM_DRAWN'){
      const record=e.payload.draw as unknown as RandomRecord;
      invariant(record.drawIndex===seenDraw,'REPLAY_CORRUPTED','RNG draw indices are discontinuous');
      invariant(verifyDraw(initial.seed,gameId,record),'REPLAY_CORRUPTED','RNG tape was tampered with');
      seenDraw++;
    }
  }
  invariant(prev===lastHash,'REPLAY_CORRUPTED','Ledger tail hash mismatch');
  invariant(canonical(result)===canonical(current),'REPLAY_CORRUPTED','Replayed state differs from persisted state');
  if(initial.qaBbPolicyVersion&&initial.qaProfile==='owner-bb-live-trap-qa-v1'){
    const groups=current.qaNightGroups??[],groupEvents=events.filter(e=>e.eventType==='BB_QA_NIGHT_GROUP_ACTION'),consumeEvents=events.filter(e=>e.eventType==='BB_QA_TRAP_CONSUMED');
    const actionIds=groups.flatMap(g=>g.actions.map(a=>a.actionId));
    invariant(new Set(actionIds).size===actionIds.length&&groupEvents.length===actionIds.length,'REPLAY_CORRUPTED','Invalid night-group action tape');
    for(const g of groups){
      invariant(g.gameId===gameId&&g.ruleVersion===initial.ruleVersion&&g.policy===initial.qaBbPolicyVersion&&g.actions.every(a=>groupEvents.some(e=>e.payload.trapId===g.trapId&&e.payload.actionId===a.actionId&&e.payload.windowId===a.windowId&&e.payload.skillId===a.skillId&&e.payload.round===g.round&&e.payload.actorId===g.actorId)),'REPLAY_CORRUPTED','Night-group provenance mismatch');
      const consumed=consumeEvents.filter(e=>e.payload.markId===g.trapId);
      invariant(consumed.length===(g.status==='CLOSED'?1:0)&&(!consumed.length||canonical(consumed[0]!.payload.actionIds)===canonical(g.actions.map(a=>a.actionId))),'REPLAY_CORRUPTED','Night-group consumption mismatch');
    }
    invariant(consumeEvents.length===groups.filter(g=>g.status==='CLOSED').length,'REPLAY_CORRUPTED','Unbound trap consumption');
  }
  const draws=repo.draws(gameId);
  invariant(draws.length===seenDraw&&current.randomCursor===seenDraw,'REPLAY_CORRUPTED','Random draw table mismatch');
  for(let i=0;i<draws.length;i++)invariant(verifyDraw(initial.seed,gameId,draws[i]),'REPLAY_CORRUPTED','Stored draw invalid');
  const recordedDraws=events.filter(e=>e.eventType==='RANDOM_DRAWN').map(e=>e.payload.draw);
  invariant(canonical(recordedDraws)===canonical(draws),'REPLAY_CORRUPTED','Random draw tape does not match event stream');
  for(const snap of repo.snapshots(gameId)){
    invariant(hash(snap.state)===snap.stateHash,'REPLAY_CORRUPTED','Snapshot hash corrupted');
    const event=snap.seq===0?undefined:events[snap.seq-1];
    if(snap.seq===0)invariant(canonical(snap.state)===canonical(initial),'REPLAY_CORRUPTED','Initial snapshot corrupted');
    else invariant(event?.eventType==='STATE_COMMITTED' && canonical(event.payload.state)===canonical(snap.state),'REPLAY_CORRUPTED','Snapshot does not correspond to a state commit');
  }
  return {state:result,events:events.length,draws:draws.length,verified:true};
}
