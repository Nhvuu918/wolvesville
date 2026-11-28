# Sprint 02B architecture — working implementation

## Runtime components

```text
HTTP/WS client -> AuthService (02A) -> RoomService (02A)
              -> GameCoordinator (02B, test-gated)
              -> role selection / deterministic RNG
              -> unchanged EngineService + RuleRegistry (fixture registry in test mode only)
              -> portable private Kernel SQLite archive + projections
              -> one backend store transaction [Room + Session + Archive + Event rows]
              -> GameCoordinator.view() authorized projection
              -> authenticated WebSocket `game.*` after commit
```

**Reused unchanged as business logic:** `backend/src/engine/*`, action validation, event hash chain, replay, deterministic RNG and `backend/src/fixtures/test-adapters.ts` (the latter remains clearly marked TEST_FIXTURE). The only change to the Kernel persistence class adds internal `listGameIds`/`listActions` query helpers to support the archive bridge. All existing endpoints of Sprint 02A remain.

## Game startup

1. Session token is verified server-side. Only room host is allowed to start.
2. Room must be `LOCKED`; client sends `characterIds` (one valid, distinct ID per **actual** member), `idempotencyKey`. 97 valid roles; capacity 1–100 does not change game max 97.
3. Membership/revision snapshot is read for preparation, but checked again under the **same database transaction** as the final start. PG uses row `FOR UPDATE`, SQLite `BEGIN IMMEDIATE`.
4. Server creates fresh `gameId`, private 256-bit seed; uses HMAC separated role-assignment seed; draws from remaining role IDs in stable player-ID order. No client result/seed is accepted.
5. Kernel `createGame`, `ROLE_ASSIGNED` and `NIGHT_COLLECT` transitions are executed in a temporary archive and replay-verified before commit.
6. Same database transaction commits `room.status=IN_GAME`, game session, role participants, private assignment draws, private Kernel image, initial Event Log + snapshot projection. `start_fingerprint` and `idempotencyKey` prevent double-start or changed-input replay.
7. Only **after** commit does server broadcast a role-free `game.created` announcement. Role data is retrieved with a per-user projection on `game.subscribe` or `GET /api/games/:id`.

## Action handling and fixture phase resolution

- Client supplies action intention; backend derives `playerId`, `roleVersion`, `phase`, `round`, zero logical `timestamp` itself. It **ignores** forged actor / role / priority / RNG fields.
- Only `fixture.*` is whitelisted (integration mode). Kernel `EngineService.submit` owns true validation and idempotency. Accepted is not Resolved.
- Archive read/mutation runs under game row lock / SQLite transaction. Successful commit updates private archive + event/action/snapshot projections **atomically**. Any thrown error rolls back the entire enclosing write.
- `POST /api/games/:id/resolve` is restricted to host and technical test mode. It transitions NIGHT_COLLECT → NIGHT_RESOLVE → NIGHT_FINALIZE → DAY_DISCUSS, or DAY_DISCUSS → DAY_RESOLVE → NIGHT_COLLECT, invoking unchanged Kernel `resolve`. No actual victory calculation. Production disables this endpoint via test-mode guard.
- Publicly relevant resolved changes become `game.state_updated` **individual per-user** WebSocket projections. Private action acceptance is acknowledged only to its actor and is not broadcast before resolution. No sensitive action or other players' roles are included.
- Reconnect reauthorizes the token and membership and delivers current private `game.snapshot`.

## Persistence / replay contract

- SQLite/PG store is the transactional authority. Kernel archive is a private internal BLOB/BYTEA containing its original SQLite event store, including seed. SQLite 004 / PostgreSQL 004 relational tables index role assignments, events, actions, snapshots (state hashes) and random draws. These tables are **projections**, not a second independently committed game.
- Game state replay uses `EngineService.replay` against the private kernel archive. Role assignment RNG is verified by replaying every stored candidate set with the separately-derived assignment seed and comparing initial roles. Seed commitment is checked against the saved hash.
- The `Event Log` is *never* sent directly. `/events` is filtered by unchanged `projectEvents`, `/replay` returns verification metadata only.
- No snapshots or role assignments enter room updates, public discovery or client-received room events.

## Current limits

- Only one game per room is supported in 02B. A rematch lifecycle with retained room is not implemented; do not silently overwrite the archive or create extra sessions.
- 02B does not supply a web graphical game HUD; the unchanged official UI source is copied for later integration. A real CLI-driven 2-WebSocket demo proves backend flow.
- Local server is one process; in-memory WS subscriptions do not synchronize horizontally. For production: TLS, maintained WS library, shared broker/presence and capacity/load tests.
- Archive round trips duplicate SQLite file bytes per command. This is a correctness-first adapter; a native async PG Kernel Repository is needed for performance before competitive release.
- No official 97-role skills, timers, chat, bots, AFK policy execution or Victory Resolver. Fixtures create no competitive points.
