import {life02Domain} from './life02.js';
/** #64 character definition and owner answer, Ma_Soi_Quy_Tac_Da_Chot_Va_De_Xuat.xlsx,
 * sheet 04 Char nguon row 65: may replace both choices; if both die, reveal both.
 * Admitted domains: single Wolf Leader, linked pair, and Medium revival.
 * Transformations and non-final death interactions are not admitted.
 * Do not disclose pair membership outside the Bell Ringer's private projection. */
import {isApprovedRuleVersion,type GameAction,type GameState} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const BELL_SKILL='official.64.pair';
export const BELL_MARK='S15_SCALE_BELL_PAIR';
export const BELL_SPENT='S15_SCALE_BELL_RESOLVED';
export const BELL_DECK=[25,48,64,74] as const;
export const BELL_REVIVAL_DECK=[8,25,26,64] as const;
export const BELL_LINK_DECK=[15,25,64,74] as const;
const idsKey=(ids:readonly number[])=>[...ids].sort((a,b)=>a-b).join(',');
export const bellRevivalIds=(ids:readonly number[])=>idsKey(ids)===BELL_REVIVAL_DECK.join(',');
export const bellLinkIds=(ids:readonly number[])=>idsKey(ids)===BELL_LINK_DECK.join(',');
export const bellNewIds=(ids:readonly number[])=>bellRevivalIds(ids)||bellLinkIds(ids);
export const bellRevivalDomain=(s:GameState)=>isApprovedRuleVersion(s.ruleVersion)&&bellRevivalIds(s.participants.map(p=>p.initialCharacterId));
export const bellLinkDomain=(s:GameState)=>isApprovedRuleVersion(s.ruleVersion)&&bellLinkIds(s.participants.map(p=>p.initialCharacterId));
export function isBellDeck(s:GameState):boolean{
 return life02Domain(s)||isApprovedRuleVersion(s.ruleVersion)&&(idsKey(s.participants.map(p=>p.initialCharacterId))===BELL_DECK.join(',')||bellRevivalDomain(s)||bellLinkDomain(s))&&(!s.links.length||bellLinkDomain(s)&&s.links.every(l=>l.type==='S15_DEEP_SECRET_PAIR'&&l.memberIds.length===2&&new Set(l.memberIds).size===2))&&s.participants.every(p=>p.currentCharacterId===p.initialCharacterId&&p.currentFaction===p.initialFaction&&!p.winLinks.length&&['ALIVE','DEAD_FINAL'].includes(p.life));
}
export const bellLocalEffect=(p:GameState['participants'][number],kind:string)=>p.currentCharacterId===64&&[BELL_MARK,BELL_SPENT].includes(kind);
export function bellReady(s:GameState,id:string):boolean {const p=participant(s,id);return isBellDeck(s)&&p.currentCharacterId===64&&p.life==='ALIVE'&&!p.effects.some(e=>e.kind===BELL_SPENT)&&s.participants.filter(t=>t.playerId!==id&&t.life==='ALIVE').length>=2;}
export function validateBell(s:GameState,a:GameAction):void {if(!bellReady(s,a.playerId)||a.targetIds.length!==2||new Set(a.targetIds).size!==2||a.targetIds.some(id=>id===a.playerId||participant(s,id).life!=='ALIVE'))throw new KernelError('TARGET_INVALID','Choose two distinct living other players before the bell resolves');}
export function placeBell(s:GameState,a:GameAction){validateBell(s,a);const p=participant(s,a.playerId);p.effects=p.effects.filter(e=>e.kind!==BELL_MARK);p.effects.push({id:`bell-${a.actionId}`,kind:BELL_MARK,sourceId:p.playerId,payload:{targetIds:[...a.targetIds],actionId:a.actionId,round:s.round,ruleVersion:s.ruleVersion}});}
/** Call once after a whole atomic death batch, not between the two pack victims. */
export function settleBell(s:GameState,eliminated:readonly string[]):{recipientId:string;targetId:string;characterId:number;actionId:string}[]{
 if(!isBellDeck(s)||!eliminated.length)return [];
 const owner=s.participants.find(p=>p.currentCharacterId===64&&p.life==='ALIVE');if(!owner||owner.effects.some(e=>e.kind===BELL_SPENT))return [];
 const marker=owner.effects.find(e=>e.kind===BELL_MARK);if(!marker)return [];
 const pair=marker.payload?.targetIds;if(!Array.isArray(pair)||pair.length!==2||new Set(pair).size!==2||pair.some(x=>typeof x!=='string'))throw new KernelError('RULE_UNRESOLVED','Invalid bell pair');
 const dead=pair.filter(id=>eliminated.includes(id)&&participant(s,id).life==='DEAD_FINAL');if(!dead.length)return [];
 const revealed=dead.length===2?pair:pair.filter(id=>!dead.includes(id));
 owner.effects=owner.effects.filter(e=>e.kind!==BELL_MARK);owner.effects.push({id:`bell-resolved-${marker.id}`,kind:BELL_SPENT,payload:{round:s.round,ruleVersion:s.ruleVersion}});
 return revealed.map(id=>({recipientId:owner.playerId,targetId:id,characterId:participant(s,id).currentCharacterId,actionId:String(marker.payload?.actionId)}));
}
