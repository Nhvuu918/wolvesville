/** Owner record WV-RD-BB-2026-01 Art. 3. Separate RNG domain from role and
 * gameplay draws; immutable initial archive. Legacy QA orders rank initial wolves only. New archives bind the owner-approved all-player policy. */
import {createHmac} from 'node:crypto';
import {draw} from '../../engine/rng.js';
import type {GameState,RandomRecord} from '../../../../shared/contracts/index.js';
export function representativeTape(s:Pick<GameState,'seed'|'gameId'|'participants'>):{order:string[];tape:RandomRecord[]}{
 const seed=createHmac('sha256',s.seed).update('wolvesville:bb-representative:WV-RD-BB-2026-01').digest('hex');
 const pool=s.participants.filter(p=>p.initialFaction==='soi').map(p=>p.playerId),order:string[]=[],tape:RandomRecord[]=[];
 while(pool.length){const i=order.length,d=draw(seed,s.gameId,i,pool,'BB_REPRESENTATIVE_ORDER',`bb-representative-${i}`);tape.push(d);order.push(d.result);pool.splice(pool.indexOf(d.result),1);}
 return {order,tape};
}

/** BB-REP-NEW-01=B. One immutable all-player permutation; eligibility is
 * determined separately by the effective rules, never by rank. */
export const ALL_PLAYER_POLICY='BB-REP-NEW-01-B' as const;
export function allPlayerRepresentativeTape(s:Pick<GameState,'seed'|'gameId'|'participants'|'ruleVersion'>):{order:string[];tape:RandomRecord[]}{
 const seed=createHmac('sha256',s.seed).update(`wolvesville:bb-representative:${ALL_PLAYER_POLICY}:${s.ruleVersion}`).digest('hex');
 const pool=s.participants.map(p=>p.playerId),order:string[]=[],tape:RandomRecord[]=[];
 while(pool.length){const i=order.length,d=draw(seed,s.gameId,i,pool,'BB_ALL_PLAYER_REPRESENTATIVE_ORDER',`bb-all-player-representative-${i}`);tape.push(d);order.push(d.result);pool.splice(pool.indexOf(d.result),1);}
 return {order,tape};
}
export function boundRepresentativeOrder(s:GameState):string[]{
 if(!s.qaRepresentativeOrder)throw Error('MISSING_REPRESENTATIVE_ORDER');
 if(!s.qaRepresentativePolicy)return [...s.qaRepresentativeOrder]; // historical QA archive, unchanged
 if(s.qaRepresentativePolicy!==ALL_PLAYER_POLICY)throw Error('UNKNOWN_REPRESENTATIVE_POLICY');
 const order=s.qaRepresentativeOrder;
 if(new Set(order).size!==s.participants.length||order.length!==s.participants.length||order.some(id=>!s.participants.some(p=>p.playerId===id)))throw Error('INVALID_REPRESENTATIVE_PERMUTATION');
 return [...order];
}
/** Rank conveys no entitlement; caller must supply legal current members. */
export function selectRepresentative(order:readonly string[],eligible:readonly string[]):string|null{
 if(new Set(order).size!==order.length||new Set(eligible).size!==eligible.length||eligible.some(id=>!order.includes(id)))throw Error('INVALID_REPRESENTATIVE_MEMBERSHIP');
 const current=new Set(eligible);return order.find(id=>current.has(id))??null;
}
