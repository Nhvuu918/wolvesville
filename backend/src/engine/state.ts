import {openSoulNight,soulDeck} from '../official/soul-shooter.js';
import {isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import type {GameState,Phase,Participant} from '../../../shared/contracts/index.js';
import {KernelError,invariant} from '../common/errors.js';

const NEXT:Record<Phase,Phase[]> = {
  ROLE_LOCKED:['ROLE_ASSIGNED'], ROLE_ASSIGNED:['NIGHT_COLLECT'],
  NIGHT_COLLECT:['NIGHT_RESOLVE'], NIGHT_RESOLVE:['WITCH_WINDOW','NIGHT_FINALIZE'],
  WITCH_WINDOW:['NIGHT_FINALIZE'], NIGHT_FINALIZE:['DAY_DISCUSS','GAME_COMPLETED'],
  DAY_DISCUSS:['DAY_VOTE_COLLECT','DAY_RESOLVE'], DAY_VOTE_COLLECT:['DAY_RESOLVE'], DAY_RESOLVE:['NIGHT_COLLECT','GAME_COMPLETED'],
  GAME_COMPLETED:[]
};
export function transition(state:GameState,next:Phase): GameState {
  invariant(NEXT[state.phase].includes(next),'INVALID_TRANSITION',`${state.phase} -> ${next} is forbidden`);
  const round = state.phase==='DAY_RESOLVE' && next==='NIGHT_COLLECT'?state.round+1:state.round;
  const participants=next==='NIGHT_COLLECT'&&round>state.round&&isApprovedRuleVersion(state.ruleVersion)?state.participants.map(p=>{
    const effects=p.effects.filter(e=>!(p.currentCharacterId===88&&e.kind==='S14_DEATH_MARK')&&!(e.kind==='S14_PUBLIC_MUTE'&&e.payload?.permanent!==true&&e.expiresAtRound!==undefined&&e.expiresAtRound<round));
    return effects.length===p.effects.length?p:{...p,effects};
  }):state.participants;
  const result={...state,participants,phase:next,round,completed:next==='GAME_COMPLETED'||state.completed};
  if(next==='NIGHT_COLLECT'&&round>state.round&&soulDeck(result)){result.participants=structuredClone(result.participants);openSoulNight(result);}
  return result;
}
export function participant(state:GameState,id:string):Participant {
  const p=state.participants.find(v=>v.playerId===id);
  if(!p) throw new KernelError('UNAUTHORIZED',`Player ${id} does not participate in this match`);
  return p;
}
export function validateState(state:GameState): void {
  invariant(state.participants.length>0 && state.participants.length<=97,'INVALID_ARGUMENT','Invalid participant count');
  invariant(new Set(state.participants.map(p=>p.playerId)).size===state.participants.length,'INVALID_ARGUMENT','Duplicate player');
  invariant(new Set(state.participants.map(p=>p.initialCharacterId)).size===state.participants.length,'INVALID_ARGUMENT','Duplicate initial role (ROOM-02)');
  invariant(state.round>=1 && Number.isInteger(state.round),'INVALID_ARGUMENT','Bad round');
  for(const p of state.participants){
    invariant(p.resources && Object.values(p.resources).every(n=>Number.isInteger(n)&&n>=0),'INVALID_ARGUMENT','Resource ledger cannot go negative');
  }
}
export function ensureRevision(state:GameState,expected?:number):void {
  if(expected!==undefined) invariant(state.revision===expected,'REVISION_CONFLICT',`Expected ${expected}, now ${state.revision}`);
}
