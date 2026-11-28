/** Sprint 03 universal feedback. Only the server issues audience-specific results. */
export const FEEDBACK_SCHEMA_VERSION=1 as const;
export type FeedbackStatus='SUBMITTED'|'ACCEPTED'|'PENDING_RESOLUTION'|'RESOLVED'|'CANCELLED'|'REJECTED'|'RULE_UNRESOLVED';
export type ResultType='ROLE_INFORMATION'|'AURA_INFORMATION'|'NONE'|'UNSUPPORTED_RESULT_TYPE';
export interface SkillFeedback {
 schemaVersion:typeof FEEDBACK_SCHEMA_VERSION;
 feedbackId:string;
 gameId:string;
 actionId:string;
 actorPlayerId:string;
 skillId:string;
 ruleVersion:string;
 actionStatus:FeedbackStatus;
 resolutionStatus:FeedbackStatus;
 resultType:ResultType;
 visibilityScope:'PLAYER_PRIVATE';
 audience:string[];
 /** Only authorized, minimal result fields; never a GameState or event archive. */
 resultPayload:Record<string,unknown>|null;
 eventSequence:number|null;
 eventRevision:number;
 createdAt:number|null;
 resolvedAt:number|null;
}
export type PrivateSkillFeedbackView={schemaVersion:1;gameId:string;revision:number;items:SkillFeedback[]};
