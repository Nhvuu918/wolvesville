# Sprint 08 Gameplay Architecture — Executable Paths

The existing `EngineService` and `GameCoordinator` remain the authority. No second Engine and no new client-owned game state.

## 1. Voting settlement (confirmed PH-02 branch)

```
Authenticated voter -> GameCoordinator.castVote -> EngineService.submitVoteIntent
  -> persisted OPEN ledger (own ballot private)
#79 submits official day skill -> Kernel ACCEPTED (not resolved)
Host requests voting-close while queue nonempty -> PENDING_ACTIONS 409, no state/event change
Host requests resolve -> Kernel DAY_RESOLVE -> PH-02 Rule Adapter
  -> resolveCertifiedCancellation -> voting.outcome = CANCELLED_NO_ELIMINATION
  -> VOTING_CANCELLED + VOTE_OUTCOME_CONFIRMED (public, no target/actor)
  -> atomic STATE_COMMITTED -> GameCoordinator DAY_RESOLVE -> NIGHT_COLLECT round+1
  -> WebSocket per-viewer authorized projection + replay
```

**Unresolved ordinary vote:** `closeVoting` persists `review:auditRawBallots` *server-internal* and `outcome:ADJUDICATION_UNRESOLVED`. `certifiedVoteEliminationTarget()` never selects a player: it throws when V02/V03 are unresolved. There is no general hanging/execution API.

## 2. Knight elimination + winner (two exact decks)

```
[8,25] or [8,28] -> server-only assignment -> NIGHT_COLLECT
  -> official.8.night-kill accepted -> NIGHT_RESOLVE
  -> applyVerifiedKnightElimination (verify exact deck and unprotected live target)
  -> PLAYER_ELIMINATED {playerId} ROOM_PUBLIC (minimal ACL-safe payload)
  -> VERIFIED_ELIMINATION_AUDIT SERVER_INTERNAL
  -> certifyKnightPostElimination -> POST_ELIMINATION_CHAIN_CLOSED SERVER_INTERNAL
  -> ACTION_RESOLVED + STATE_COMMITTED
  -> NIGHT_FINALIZE -> resolveCertifiedVictory (no pending accepted action,
     closed post-death chain, verified provenance, #8 sole survivor)
  -> GAME_COMPLETED + MATCH_COMPLETED {winnerIds} ROOM_PUBLIC
  -> MATCH_COMPLETION_AUDIT SERVER_INTERNAL + snapshot + replay + WebSocket
```

An attacker cannot choose the target role or actor ID. The frozen game rule pack and server-side role assignment determine whether the skill exists. `#28` only wins by hanging, which this branch **does not perform**. Unsupported protections/links/revivals/role transformations fail closed; there is no generic attack/defense priority.

## New modules

| Source | Purpose |
|---|---|
| `backend/src/engine/vote-adjudicator.ts` | Confirmed PH-02 no-elimination outcome; fail-closed unresolved standard voting |
| `backend/src/engine/elimination-chain.ts` | Source-specific closed post-death effects certificate |
| `backend/src/official/victory-resolver.ts` | Source-specific sole-survivor final adjudication, requires actual committed event/audit |
| `backend/src/engine/service.ts` | Existing transaction + event log integration; safe vote-close preflight |
| `backend/src/official/solo-rules.ts` | Exact two-role whitelist expanded to #8/#28 |
| `frontend/integration.js` | Server-authored cancellation outcome, additional test deck |

## Persistence and security

- The pre-existing SQLite Kernel binary archive is atomically committed with game state metadata; PostgreSQL uses the same archival boundary.
- `STATE_COMMITTED` events and snapshots are replayed by revision/hash; no result is broadcast before transaction commit.
- `POST_ELIMINATION_CHAIN_CLOSED`, raw ballot review and `MATCH_COMPLETION_AUDIT` are **SERVER_INTERNAL**.
- `VOTE_OUTCOME_CONFIRMED` publishes **only** `{round,outcome}`. Private inspection remains isolated to its authorized audience.
- Database schema and migrations 002/004/005/006 unchanged: game voting outcome is inside the versioned Kernel state archive. Existing archives lacking `voting.outcome` remain backwards-compatible.
