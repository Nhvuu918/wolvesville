import {life02Domain} from './life02.js';
import {cultDeck} from './cult-recruitment.js';
/** VH57, VH68, PRIV-01: public mute affects the public channel only.
 * Channel selection is fail-closed: an unsupported group/DM must never be
 * treated as public text. This does not invent or grant group memberships.
 * The same policy drives the read model and server mutation. */
import type {GameState} from '../../../shared/contracts/index.js';
import {invariant} from '../common/errors.js';
import {participant} from '../engine/state.js';
import {isApprovedInspectionDeck} from './inspection-rules.js';
import {isMixedExileDeck} from './final-pack.js';
import {isS14PublicMuted} from './s13-mechanics.js';
import {soulNoVote} from './soul-shooter.js';

export function requestedChatChannel(body:unknown):'PUBLIC'|'MEDIUM'|'GROUP'{
 invariant(body!==null&&typeof body==='object'&&!Array.isArray(body),'INVALID_ARGUMENT','Invalid chat message');
 const b=body as Record<string,unknown>;
 invariant(b.channel===undefined||b.channel==='PUBLIC'||b.channel==='MEDIUM'||b.channel==='GROUP','INVALID_ARGUMENT','Unsupported chat channel');
 if(b.channel==='MEDIUM')return 'MEDIUM';
 if(b.channel==='GROUP')return 'GROUP';
 invariant(b.targetId===undefined&&b.sessionId===undefined&&b.groupId===undefined&&b.recipientId===undefined,'INVALID_ARGUMENT','Public chat has no private address');
 return 'PUBLIC';
}
export function publicChatEnabled(s:GameState):boolean{
 return life02Domain(s)||cultDeck(s)||isApprovedInspectionDeck(s.participants.map(p=>p.initialCharacterId))||isMixedExileDeck(s);
}
export function publicChatView(s:GameState,playerId:string):{enabled:true;canSend:boolean;muted:boolean}|undefined{
 const p=participant(s,playerId);
 if(!publicChatEnabled(s))return undefined;
 const muted=isS14PublicMuted(s,playerId);
 return {enabled:true,canSend:s.phase==='DAY_DISCUSS'&&!s.completed&&(p.life==='ALIVE'||life02Domain(s)&&p.life==='PROLONGED')&&!soulNoVote(s,p)&&!muted,muted};
}
