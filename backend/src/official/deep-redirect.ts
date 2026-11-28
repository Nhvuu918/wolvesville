import {isModernRuleVersion} from '../../../shared/contracts/index.js';
/** VH45, VH61 + character.json#63/#85: one certified redirect in a night.
 * Closed QA decks only; no unresolved shield ordering or redirect loops. */
import {RULESET_VERSION,type GameState,type Participant,type GameAction} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {participant} from '../engine/state.js';
export const REDIRECT_MARK='S15_DEEP_REDIRECT_MARK';
export const REDIRECT_USED='S15_DEEP_REDIRECT_USED';
export const REDIRECT_SKILLS={flag:'official.63.redirect',hypnosis:'official.85.hypnotize'} as const;
export function isDeepRedirectDeck(s:GameState):boolean{return isModernRuleVersion(s.ruleVersion)&&['8,25,63','8,25,63,74','8,25,85'].includes(s.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(','))&&s.links.length===0&&s.participants.every(p=>p.initialCharacterId===p.currentCharacterId&&p.initialFaction===p.currentFaction&&!p.winLinks.length);}
export function redirectUses(s:GameState,id:string){return participant(s,id).effects.filter(e=>e.kind===REDIRECT_USED).length;}
export function redirectReady(s:GameState,id:string):boolean{
 const p=participant(s,id);if(!isDeepRedirectDeck(s)||p.life!=='ALIVE')return false;
 if(p.currentCharacterId===63)return s.round>=2&&redirectUses(s,id)<2&&!p.effects.some(e=>e.kind===REDIRECT_USED&&e.payload?.round===s.round-1)&&s.participants.filter(t=>t.playerId!==id&&t.life==='ALIVE').length>=2;
 return p.currentCharacterId===85&&s.participants.some(t=>t.playerId!==id&&t.life==='ALIVE'&&!p.effects.some(e=>e.kind===REDIRECT_MARK&&e.expiresAtRound===s.round-1&&e.payload?.redirectId===t.playerId));
}
export function redirectEligible(s:GameState,id:string):string[]{const p=participant(s,id);return s.participants.filter(t=>t.playerId!==id&&t.life==='ALIVE'&&(p.currentCharacterId!==85||!p.effects.some(e=>e.kind===REDIRECT_MARK&&e.expiresAtRound===s.round-1&&e.payload?.redirectId===t.playerId))).map(t=>t.playerId);}
export function validateRedirect(s:GameState,a:GameAction){if(!redirectReady(s,a.playerId)||!a.targetIds.every(id=>redirectEligible(s,a.playerId).includes(id)))throw new KernelError('RULE_UNRESOLVED','Redirect resource, cooldown or target unavailable');}
export function placeRedirect(s:GameState,a:GameAction){
 validateRedirect(s,a);const actor=participant(s,a.playerId),isFlag=actor.currentCharacterId===63;
 actor.effects.push({id:`redirect-${a.actionId}`,kind:REDIRECT_MARK,expiresAtRound:s.round,payload:{protectedId:isFlag?a.targetIds[0]:actor.playerId,redirectId:isFlag?a.targetIds[1]:a.targetIds[0],ruleId:isFlag?'VH61':'VH45'}});
}
/** Return the actual death recipient before committing a lethal attack.
 * In the initial scopes no other protection or death trigger is admitted. */
export function resolveRedirect(s:GameState,target:Participant):{target:Participant;ruleId:string}|null{
 if(!isDeepRedirectDeck(s)||s.phase!=='NIGHT_RESOLVE')return null;
 const matches=s.participants.flatMap(p=>p.effects.filter(e=>e.kind===REDIRECT_MARK&&e.expiresAtRound===s.round&&e.payload?.protectedId===target.playerId).map(e=>({p,e})));
 if(!matches.length)return null;if(matches.length!==1)throw new KernelError('RULE_UNRESOLVED','Multiple redirects require verified order');
 const {p,e}=matches[0]!,recipient=participant(s,String(e.payload?.redirectId));
 if(p.life!=='ALIVE'||recipient.life!=='ALIVE'||recipient.playerId===target.playerId||s.participants.some(x=>x.effects.some(z=>!['S13_SKILL_USE',REDIRECT_MARK,REDIRECT_USED].includes(z.kind))))throw new KernelError('RULE_UNRESOLVED','Uncertified redirect interaction');
 if(p.currentCharacterId===63)p.effects.push({id:`redirect-use-${e.id}`,kind:REDIRECT_USED,payload:{round:s.round,ruleId:'VH61'}});
 recipient.life='DEAD_FINAL';recipient.publicReportedDead=true;
 return {target:recipient,ruleId:String(e.payload?.ruleId)};
}
