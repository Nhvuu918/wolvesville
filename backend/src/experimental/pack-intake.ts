/** EXPERIMENTAL ONLY. No official adapter, endpoint or deck imports this module.
 * VH54: representative must come from a pre-established authoritative policy.
 * VH74/P04: no more than two bite targets. A caller must derive actual limit.
 * No target-consensus rule is applied here. This is a deterministic, serializable
 * transport-independent intake ledger; only an authenticated server may build
 * the trusted eligibility snapshot. It does not grant bite rights or attack.
 */
export type PackScope={gameId:string;ruleVersion:string;round:number;revision:number;phase:'NIGHT_COLLECT'|'LOCKED';authorizedWolfIds:readonly string[];authorizedTargetIds:readonly string[];maxTargets:1|2;representativeId:string|null};
export type PackCommand={gameId:string;ruleVersion:string;round:number;expectedRevision:number;key:string;targetIds:readonly string[]};
export type PackEntry={actorId:string;key:string;targetIds:string[];revision:number;seq:number};
export type PackLedger={gameId:string;ruleVersion:string;round:number;revision:number;locked:boolean;entries:PackEntry[]};
const fail=(code:string):never=>{throw new Error(code);};
function scopeCheck(s:PackScope,l:PackLedger){if(s.gameId!==l.gameId||s.ruleVersion!==l.ruleVersion||s.round!==l.round)fail('SCOPE_MISMATCH');if(s.maxTargets!==1&&s.maxTargets!==2)fail('INVALID_LIMIT');if(s.revision!==l.revision)fail('STALE_REVISION');}
export function createPackLedger(s:PackScope):PackLedger{if(s.phase!=='NIGHT_COLLECT')fail('OUT_OF_PHASE');return {gameId:s.gameId,ruleVersion:s.ruleVersion,round:s.round,revision:s.revision,locked:false,entries:[]};}
export function submitPackIntent(s:PackScope,l:PackLedger,authenticatedActorId:string,c:PackCommand):{ledger:PackLedger;duplicate:boolean}{
 scopeCheck(s,l);if(!s.authorizedWolfIds.includes(authenticatedActorId))fail('FORBIDDEN');
 if(c.gameId!==s.gameId||c.ruleVersion!==s.ruleVersion||c.round!==s.round)fail('SCOPE_MISMATCH');
 if(typeof c.key!=='string'||c.key.length<8||c.key.length>128)fail('INVALID_KEY');
 if(!Array.isArray(c.targetIds)||c.targetIds.some(t=>typeof t!=='string'))fail('INVALID_TARGET');
 const ids=[...c.targetIds].sort();const previous=l.entries.find(e=>e.actorId===authenticatedActorId&&e.key===c.key);
 if(previous){if(JSON.stringify(previous.targetIds)!==JSON.stringify(ids))fail('IDEMPOTENCY_CONFLICT');return {ledger:l,duplicate:true};}
 if(l.locked||s.phase!=='NIGHT_COLLECT')fail('OUT_OF_PHASE');
 if(c.expectedRevision!==l.revision)fail('STALE_REVISION');
 if(ids.length<1||ids.length>s.maxTargets||new Set(ids).size!==ids.length||ids.some(t=>!s.authorizedTargetIds.includes(t)))fail('INVALID_TARGET');
 const entry:PackEntry={actorId:authenticatedActorId,key:c.key,targetIds:ids,revision:l.revision+1,seq:l.entries.length+1};
 return {ledger:{...l,revision:entry.revision,entries:[...l.entries,entry]},duplicate:false};
}
/** No target selection here. Revalidate membership at phase lock; revoked or
 * eliminated actors and invalid targets cannot produce an eligible intent.
 * This filtering is a candidate engineering contract, NOT an official ruling
 * about what occurs when the original representative loses eligibility. */
export function lockPackIntake(s:PackScope,l:PackLedger){
 scopeCheck(s,l);if(l.locked||s.phase!=='NIGHT_COLLECT')fail('OUT_OF_PHASE');
 const latest=new Map<string,PackEntry>();for(const e of l.entries)latest.set(e.actorId,e);
 const eligible=[...latest.values()].filter(e=>s.authorizedWolfIds.includes(e.actorId)&&e.targetIds.length<=s.maxTargets&&e.targetIds.every(t=>s.authorizedTargetIds.includes(t))).sort((a,b)=>a.seq-b.seq);
 const representative=s.representativeId&&s.authorizedWolfIds.includes(s.representativeId)?s.representativeId:null;
 return {ledger:{...l,revision:l.revision+1,locked:true},eligible,representativeId:representative,requiresConsensusPolicy:true as const};
}
/** Only actor-local intake is exposed; no cross-player choices from this module. */
export function projectOwnPackIntake(s:PackScope,l:PackLedger,actorId:string){scopeCheck(s,l);if(!s.authorizedWolfIds.includes(actorId))fail('FORBIDDEN');return {round:l.round,revision:l.revision,locked:l.locked,ownEntries:l.entries.filter(e=>e.actorId===actorId).map(e=>({...e,targetIds:[...e.targetIds]}))};}
