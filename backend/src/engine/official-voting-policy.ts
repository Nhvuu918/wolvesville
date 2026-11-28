/** Additive policy version, owner-approved Sprint 11. The base engine ruleset
 * version stays frozen for historical archives and registered skill adapters. */
export const OFFICIAL_VOTING_POLICY = Object.freeze({
 version:'S11_OFFICIAL_V1' as const, source:'Owner-confirmed Sprint 11',
 invalidation:'TERMINAL', tie:'NO_HANGING', zero:'NO_HANGING', quorum:0,
 uniquePositiveLeader:true, blankTarget:'', mutedMayVote:true, changeBeforeLock:true
});
