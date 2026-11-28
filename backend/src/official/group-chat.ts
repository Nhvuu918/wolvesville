import {life02Domain,full50Life02,CUPID_LINK} from './life02.js';
/** System-issued functional chat groups. VH57/VH59/VH78, Q13-08, PRIV-01.
 * Membership is an independent authorization grant, NOT inferred from faction,
 * win links, seat selections or client requests. A role resolver must issue it
 * AFTER successful gameplay recruitment. Only the cult DAY profile has a
 * fully specified phase and identity policy here. No wolf/fan/director profile
 * is inferred; there is deliberately no client route for creation or grants.
 */
import type {EngineEvent, GameState, SystemChatGroup} from '../../../shared/contracts/index.js';
import {isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import {hash} from '../common/canonical.js';
import {invariant} from '../common/errors.js';
import type {PendingEvent} from '../engine/events.js';
import {participant} from '../engine/state.js';
import {soulNoVote} from './soul-shooter.js';
export const GROUP_CHAT_EVENT='GAME_GROUP_CHAT';
const idPattern=/^[a-zA-Z0-9_-]{8,128}$/;
const deny='Group chat unavailable';
/** Validate the persisted authorization data independently of group grants.
 * Old archives have no systemChatGroups and remain unchanged. */
export function validateSystemChatGroups(s:GameState):void {
 const groups=s.systemChatGroups??[];
 invariant(!groups.length||isApprovedRuleVersion(s.ruleVersion),'RULE_UNRESOLVED','Group chat requires active rules');
 invariant(new Set(groups.map(g=>g.id)).size===groups.length,'INVALID_ARGUMENT','Duplicate chat group');
 for(const g of groups){
  invariant(((g.kind==='CULT_DAY'&&g.sourceRule==='VH59/VH78')||(life02Domain(s)&&g.kind==='CUPID_PAIR'&&g.sourceRule==='NV30'&&s.links.some(l=>l.type===CUPID_LINK&&l.id===g.id&&g.memberIds.length===new Set([g.ownerId,...l.memberIds]).size&&g.memberIds.every(id=>id===g.ownerId||l.memberIds.includes(id)))))&&idPattern.test(g.id)&&s.participants.some(p=>p.playerId===g.ownerId),'INVALID_ARGUMENT','Invalid system group');
  invariant(g.memberIds.includes(g.ownerId)&&new Set(g.memberIds).size===g.memberIds.length&&g.memberIds.every(id=>s.participants.some(p=>p.playerId===id)),'INVALID_ARGUMENT','Invalid system group membership');
  invariant(g.grants.length===g.memberIds.length-1&&new Set(g.grants.map(x=>x.memberId)).size===g.grants.length&&g.grants.every(x=>x.memberId!==g.ownerId&&g.memberIds.includes(x.memberId)&&idPattern.test(x.sourceActionId)&&Number.isSafeInteger(x.round)&&x.round>=1&&x.round<=s.round),'INVALID_ARGUMENT','Invalid group grant provenance');
 }
}
/** Internal hook for a role resolver after a successful, validated recruitment.
 * Does not itself perform recruitment or decide whether a target is recruitable.
 * In particular do not call it for a failed attempt under Q13-08. */
export function grantCommittedCultChat(s:GameState,ownerId:string,memberId:string,sourceActionId:string):SystemChatGroup {
 invariant(isApprovedRuleVersion(s.ruleVersion)&&!s.completed&&s.phase==='NIGHT_RESOLVE','OUT_OF_PHASE',deny);
 const owner=participant(s,ownerId),member=participant(s,memberId);
 invariant(owner.currentCharacterId===90&&owner.life==='ALIVE'&&member.life==='ALIVE'&&ownerId!==memberId,'UNAUTHORIZED',deny);
 invariant(idPattern.test(sourceActionId),'INVALID_ARGUMENT','Missing committed recruitment action');
 // Q13-08 and character.json#90: independent win links and wolves are
 // explicitly ineligible. A future gameplay producer still must classify
 // independent killers, enforce capacity and resolve win/death links.
 invariant(member.winLinks.length===0&&member.currentFaction!=='soi','RULE_UNRESOLVED','Recruitment grant unavailable');
 // Character #90: at most five living followers. The owner is not a follower.
 const previousGroup=s.systemChatGroups?.find(g=>g.kind==='CULT_DAY'&&g.ownerId===ownerId);
 invariant(previousGroup?.memberIds.includes(memberId)||(previousGroup?.memberIds.filter(id=>id!==ownerId&&participant(s,id).life==='ALIVE').length??0)<5,'RESOURCE_INSUFFICIENT','Recruitment grant unavailable');
 // The role resolver owns recruitment eligibility, including Q13-08. This
 // hook receives only the successful branch; it is not callable by a client.
 const groups=s.systemChatGroups??(s.systemChatGroups=[]);
 let group=groups.find(g=>g.kind==='CULT_DAY'&&g.ownerId===ownerId);
 if(!group){group={id:`cult-${hash([s.gameId,ownerId,sourceActionId]).slice(0,32)}`,kind:'CULT_DAY',sourceRule:'VH59/VH78',ownerId,memberIds:[ownerId],grants:[]};groups.push(group);}
 if(!group.memberIds.includes(memberId)){group.memberIds.push(memberId);group.grants.push({memberId,sourceActionId,round:s.round});}
 validateSystemChatGroups(s);return group;
}
/** Explicit grant removal, only when the source gameplay resolver authorizes
 * revocation. REL-02 forbids inferring it from replacement of a win link. */
export function revokeSystemChatMember(s:GameState,groupId:string,memberId:string):void {
 const g=s.systemChatGroups?.find(x=>x.id===groupId);
 invariant(g&&memberId!==g.ownerId,'INVALID_ARGUMENT','Invalid group revocation');
 g.memberIds=g.memberIds.filter(id=>id!==memberId);g.grants=g.grants.filter(x=>x.memberId!==memberId);
}
function eligible(s:GameState,id:string):boolean {
 const p=participant(s,id);
 // Conservative supported life domain. A separate source-backed policy is
 // required before extending chat to prolonged/dead/hidden revived states.
 return (p.life==='ALIVE'||life02Domain(s)&&p.life==='PROLONGED')&&!p.publicReportedDead&&!soulNoVote(s,p);
}
function groupOpen(s:GameState,g:SystemChatGroup):boolean {
 // Owner IMMERSIVE-04: widen time only, retaining existing membership/life restrictions.
 if(s.groupChatTimePolicy==='WV-GROUP-DAY-NIGHT-1'&&g.kind==='CULT_DAY')return isApprovedRuleVersion(s.ruleVersion)&&!s.completed&&['NIGHT_COLLECT','DAY_DISCUSS','DAY_VOTE_COLLECT'].includes(s.phase)&&participant(s,g.ownerId).life==='ALIVE';
 if(s.groupChatTimePolicy==='WV-GROUP-DAY-NIGHT-1'&&g.kind==='CUPID_PAIR')return life02Domain(s)&&!s.completed&&s.links.some(l=>l.id===g.id&&l.active)&&['NIGHT_COLLECT','DAY_DISCUSS','DAY_VOTE_COLLECT'].includes(s.phase)&&(full50Life02(s)||participant(s,g.ownerId).life==='ALIVE');
 // NV30-B: new QA policy only. Owner death cannot revoke the living pair’s grant.
 if(g.kind==='CUPID_PAIR'&&full50Life02(s))return life02Domain(s)&&!s.completed&&s.links.some(l=>l.id===g.id&&l.active)&&['NIGHT_COLLECT','DAY_DISCUSS','DAY_VOTE_COLLECT'].includes(s.phase);
 return (g.kind!=='CUPID_PAIR'||s.links.some(l=>l.id===g.id&&l.active))&&isApprovedRuleVersion(s.ruleVersion)&&!s.completed&&['DAY_DISCUSS','DAY_VOTE_COLLECT'].includes(s.phase)&&participant(s,g.ownerId).life==='ALIVE';
}
export function systemGroupChatView(s:GameState,viewerId:string){
 participant(s,viewerId);
 return (s.systemChatGroups??[]).filter(g=>g.memberIds.includes(viewerId)&&(g.kind!=='CUPID_PAIR'||s.links.some(l=>l.id===g.id&&l.active))).map(g=>({id:g.id,kind:g.kind,canSend:groupOpen(s,g)&&eligible(s,viewerId)}));
}
export function prepareSystemGroupChat(s:GameState,events:readonly EngineEvent[],actorId:string,body:unknown):{duplicate:boolean;refresh:string[];events:PendingEvent[]} {
 participant(s,actorId);
 invariant(body!==null&&typeof body==='object'&&!Array.isArray(body),'INVALID_ARGUMENT','Invalid chat message');
 const b=body as Record<string,unknown>;
 invariant(b.channel==='GROUP'&&typeof b.groupId==='string'&&idPattern.test(b.groupId)&&typeof b.text==='string'&&b.text.trim().length>0&&b.text.length<=500&&typeof b.messageId==='string'&&idPattern.test(b.messageId)&&b.targetId===undefined&&b.recipientId===undefined&&b.sessionId===undefined&&Object.keys(b).every(k=>['channel','groupId','text','messageId'].includes(k)),'INVALID_ARGUMENT','Invalid group message');
 const text=b.text.trim(),key=b.messageId,groupId=b.groupId;
 // A private ID never authorizes the sender. Unknown and unauthorized groups
 // have the same error, including after membership revocation.
 const g=s.systemChatGroups?.find(x=>x.id===groupId&&x.memberIds.includes(actorId));
 invariant(g,'UNAUTHORIZED',deny);
 const prior=events.filter(e=>e.eventType===GROUP_CHAT_EVENT&&e.actorId===actorId);
 const retry=prior.find(e=>e.correlationId===key);
 if(retry){invariant(retry.groupId===groupId&&retry.payload.text===text,'IDEMPOTENCY_CONFLICT','Chat key reused');return {duplicate:true,refresh:[],events:[]};}
 invariant(groupOpen(s,g)&&eligible(s,actorId),'UNAUTHORIZED',deny);
 invariant(prior.filter(e=>Date.now()-e.timestamp<10000).length<5,'RESOURCE_INSUFFICIENT','Chat rate limit');
 // VH57: public mute never affects this permission. Freeze historical
 // audience at commit; new recruits do not get prior private content.
 const audience=g.memberIds.filter(id=>eligible(s,id));
 return {duplicate:false,refresh:audience,events:[{eventType:GROUP_CHAT_EVENT,visibility:'GROUP_RESTRICTED',groupId,audience,actorId,correlationId:key,payload:{groupId,text,round:s.round}}]};
}

/** Replay rechecks the frozen audience against the authorized state at the
 * point of append, not against membership at the end of the match. */
export function verifySystemGroupChatEvent(s:GameState,e:EngineEvent):void {
 validateSystemChatGroups(s);
 const g=s.systemChatGroups?.find(x=>x.id===e.groupId);
 invariant(g&&groupOpen(s,g)&&!!e.actorId&&g.memberIds.includes(e.actorId)&&eligible(s,e.actorId),'REPLAY_CORRUPTED','Invalid group message authorization');
 const audience=g.memberIds.filter(id=>eligible(s,id));
 invariant(e.visibility==='GROUP_RESTRICTED'&&JSON.stringify(e.audience)===JSON.stringify(audience)&&e.payload.groupId===g.id&&e.payload.round===s.round&&typeof e.payload.text==='string'&&e.payload.text.trim()===e.payload.text&&e.payload.text.length>0&&e.payload.text.length<=500&&idPattern.test(e.correlationId),'REPLAY_CORRUPTED','Invalid group message provenance');
}
