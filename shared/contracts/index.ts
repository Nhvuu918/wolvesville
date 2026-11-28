export const LEGACY_RULESET_VERSION = 'wolvesville-official-v1.3.1' as const;
export const RULESET_VERSION = 'wolvesville-official-v1.3.2' as const; // archived adapter base
export const APPROVED_RULESET_VERSION = 'wolvesville-official-v1.3.3' as const;
export function isApprovedRuleVersion(version:string):boolean{return version===APPROVED_RULESET_VERSION;}
export function isModernRuleVersion(version:string):boolean{return version===RULESET_VERSION||isApprovedRuleVersion(version);}
export type Phase = 'ROLE_LOCKED'|'ROLE_ASSIGNED'|'NIGHT_COLLECT'|'NIGHT_RESOLVE'|'WITCH_WINDOW'|'NIGHT_FINALIZE'|'DAY_DISCUSS'|'DAY_VOTE_COLLECT'|'DAY_RESOLVE'|'GAME_COMPLETED';
export type LifeState = 'ALIVE'|'PENDING_DEATH'|'DEAD_FINAL'|'PENDING_REVIVAL'|'HIBERNATING'|'PROLONGED';
export type Visibility = 'SERVER_INTERNAL'|'PLAYER_PRIVATE'|'FACTION_RESTRICTED'|'GROUP_RESTRICTED'|'ROOM_PUBLIC'|'POSTGAME_AUTHORIZED';
export type ActionStatus = 'SUBMITTED'|'ACCEPTED'|'REJECTED'|'CANCELLED'|'RESOLVED';
export type EffectType = 'DAMAGE'|'PROTECTION'|'HEAL'|'BLOCK'|'STATUS'|'RESOURCE_MODIFICATION'|'CHARACTER_TRANSFORMATION'|'FACTION_TRANSFORMATION'|'LINK_MODIFICATION'|'DEATH_TRANSITION'|'INFORMATION_RESULT';
export interface Effect {
  type: EffectType;
  targetId: string;
  value?: number|string|boolean;
  key?: string;
  causeId?: string;
  visibility?: Visibility;
  recipientId?: string;
  faction?: string;
  groupId?: string;
}
export interface Status {id:string; kind:string; sourceId?:string; phase?:Phase; expiresAtRound?:number; payload?:Record<string,unknown>}
export interface Participant {
  playerId:string; initialCharacterId:number; currentCharacterId:number;
  initialFaction:string; currentFaction:string; life:LifeState; publicReportedDead:boolean;
  resources:Record<string,number>; effects:Status[]; skillLocks:string[];
  winLinks:string[]; groupIds:string[];
  /** Candidate cult identity is independent of role and resource state. */
  currentWinGroup?:string; cultMembership?:string;
}
/** Server-private vote intent ledger. Not an official finalVote or elimination ruling. */
export interface VoteIntent {voterId:string;targetId:string;ballotId:string;idempotencyKey:string;acceptedRevision?:number;}
export interface VoteDirective {voterId:string;controllerId:string;sourceActionId:string;ruleId:'OFFICIAL_CHAR_33_VOTE_COERCION'}
export interface VoteLedger {round:number;status:'OPEN'|'CLOSED_UNRESOLVED'|'CANCELLED'|'RESOLVED';intents:VoteIntent[];
 /** Private confirmed #33 coercion instructions. No public vote-choice leakage. */
 directives?:VoteDirective[];
 history?:VoteIntent[]; invalidatedVoters?:string[];
 officialAudit?:{policyVersion:string;ballots:Array<{voterId:string;targetId:string;effectiveTargetId:string;valid:boolean}>;counts:Array<{targetId:string;count:number}>};
 /** Server-certified adjudication: cancellation is an actual no-elimination outcome,
  * unresolved raw ballots NEVER select an execution target. */
 outcome?: {kind:'CANCELLED_NO_ELIMINATION'|'ADJUDICATION_UNRESOLVED'|'NO_HANGING_TIE'|'NO_HANGING_ZERO'|'NO_HANGING_IMMUNE'|'HANGING_COMPLETED'|'HANGING_AUTHORIZED';sourceRules:string[];noElimination:boolean;resolvedAtRound:number;targetId?:string};
 /** Server-private raw count diagnostic, NOT a hanging verdict. Never include in projection. */
 review?:{schemaVersion:1;ballots:number;counts:Array<{targetId:string;count:number}>;highest:number;leaders:string[];equalTop:boolean;adjudication:'RULE_UNRESOLVED';blockers:string[];
 /** QA-only transformed vote audit, never an elimination verdict or public projection. */
 finalBallotsVerified?:boolean;effectiveCounts?:Array<{targetId:string;count:number}>;appliedDirectives?:number;};}
export interface NightActionGroup {
  gameId:string;ruleVersion:string;policy:'WV-RD-BB-2026-01';round:number;actorId:string;trapId:string;sourceId:string;status:'OPEN'|'CLOSED';
  actions:Array<{actionId:string;skillId:string;windowId:string;phase:Phase;resolvedAtRevision:number;targetIds:string[]}>;
}
/** Server-only grant registry. Independent of win/death links (REL-02). */
export interface SystemChatGroup {id:string;kind:'CULT_DAY'|'CUPID_PAIR';sourceRule:'VH59/VH78'|'NV30';ownerId:string;memberIds:string[];grants:Array<{memberId:string;sourceActionId:string;round:number}>}
export interface GameState {
  gameId:string; roomId:string; ruleVersion:string; characterHash:string; seed:string;
  revision:number; phase:Phase; round:number; participants:Participant[];
  qaProfile?:'owner-bb-live-trap-qa-v1'|'owner-bb-live-pack-qa-v1'; qaRepresentativeOrder?:string[]; qaRepresentativePolicy?:'BB-REP-NEW-01-B'; qaPack?:unknown;
  qaOwnerDecisionPolicy?:'WV-DC-2026-11-25-A'|'WV-DC-2026-11-25-A-S21';
  qaBbPolicyVersion?:'WV-RD-BB-2026-01'; qaRepresentativeTape?:RandomRecord[]; qaNightGroups?:NightActionGroup[]; qaNightWindow?:'WITCH_POISON'; qaDeferredNightDeaths?:Array<{victimId:string;actionId:string;round:number}>;
  systemChatGroups?:SystemChatGroup[];
  groupChatTimePolicy?:'WV-GROUP-DAY-NIGHT-1';
  qaCultPolicy?:'WV-DC-2026-11-25-S27-CULT'|'WV-FULL50-CULT-V2';
  qaLife02Policy?:'RC01-LIFE02-CUPID-V1'|'WV-FULL50-LIFE02-V2'|'WV-FULL50-LIFE02-V3';
  /** Persisted admission profile for new compositional LIFE-02 games. */
  life02Composition?:'LIFE-MODULES-1';
  life02DevelopmentScope?:'LIFE-MODULES-1-GUARD-OBSERVATION';
  /** Private pending lethal intents in the opt-in LIFE-02 rescue window. */
  life02PendingAttacks?:Array<{targetId:string;correlationId:string;sourceRule:string;round:number}>;
  links: Array<{id:string; type:string; memberIds:string[]; active:boolean; createdSeq:number}>;
  effects: Array<{id:string; type:EffectType; targetId:string; sourceActionId:string}>;
  resolutionGate?:{status:'CONTINUE'|'PENDING_EFFECT'|'BLOCKED_BY_RULE'|'GAME_COMPLETED';round:number;reason?:string};
  publicVotePolicy?:'DECLARED_ORDINARY_V1';
  randomCursor:number; gameplayPolicy?:'S12_KNIGHT_SNOW_V1'; votingPolicy?:'S11_OFFICIAL_V1'; voting?:VoteLedger; completed:boolean; winnerIds:string[];
}
export interface GameAction {
  actionId:string; gameId:string; playerId:string; skillId:string; targetIds:string[];
  phase:Phase; round:number; timestamp:number; payload:Record<string,unknown>;
  idempotencyKey:string; ruleVersion:string;
}
export interface AcceptedAction {action:GameAction; status:ActionStatus; costName?:string; costAmount?:number}
export interface EngineEvent {
  eventId:string; gameId:string; sequence:number; eventType:string; timestamp:number;
  actorId?:string; targetId?:string; payload:Record<string,unknown>;
  visibility:Visibility; recipientId?:string; faction?:string; groupId?:string; audience?:string[];
  ruleVersion:string; correlationId:string; prevHash:string; eventHash:string;
}
export interface RandomRecord {drawIndex:number; domain:string[]; result:string; algorithm:'HMAC-SHA256-v1'; reason:string; correlationId:string}
