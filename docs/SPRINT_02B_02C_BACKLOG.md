# Sprint 02B / 02C — actionable next work

## Sprint 02B: Room → Kernel (not implemented in 02A)

1. Introduce a single authoritative service for room/seat role locking and game start; validate player + bot seats 1–100 but initial character IDs unique (≤97). Reject incompatible room configurations, don't mutate role catalog.
2. Align PostgreSQL and Kernel game event persistence transactionally. Port synchronous `GameRepository` to async if PG is selected; write game state/events/actions/snapshots in one transaction, test rollback and deterministic replay. No unsupported distributed transaction across databases.
3. Bind authenticated `Account.id` to `GameState.playerId` before role assignment; never trust client-supplied player ID in action bodies.
4. Add server projection of secret role, faction, chat and events strictly per rule visibility; test no unauthorized reads.
5. Implement reconnect to active game with filtered state and remaining phase deadline; action idempotency per Kernel.
6. Room WebSocket event transport should carry actual Game Engine projections, never raw state/event log. Replace restricted WebSocket implementation with maintained library for production.
7. Add cross-client E2E in supported game configuration. Starting a game without confirmed victory resolution stays blocked.

## Sprint 02C: Official role pack (not implemented in 02A)

1. Choose explicitly whitelisted roles from `CHARACTER_SKILL_SPEC.md` with no result-altering unresolved interactions; bind each implemented skill to original IDs and source codes.
2. Implement all branches and victory predicates for the permitted configuration; expose `RULE_UNRESOLVED` for anything outside it.
3. Replay RNG tapes and commit final state deterministically; execute official role test specifications with actual expected result.
4. NEVER enable all 97 roles merely because the UI renders them.

## Acceptance gates

- `npm run test:all` passes on developer Mac.
- `npm run test:pg` passes against Docker PostgreSQL.
- Concurrent joins never overbook; authz prevents a nonmember from subscribing.
- 24 Kernel tests stay green after wiring a real game.
- An actual official role adapter and victory predicate end-to-end test pass before calling any match “playable”.
