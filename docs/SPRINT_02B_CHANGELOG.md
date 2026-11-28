# 02B code changes relative to Sprint 02A

**Preserved:** all approved 107 frontend source files and `data/character.json` exactly; 118 Wolvesville rules and 207 rule-based test specification JSON; existing auth, profile, rooms and WebSocket endpoints; unchanged Engine state, action validation, priority, effects, replay, RNG and official ruleset version.

**Added:**

- `backend/src/game/archive.ts`: isolated temporary Kernel execution and durable SQLite-archive bridge for SQLite/PG transaction consistency.
- `backend/src/game/coordinator.ts`: room→game starts, server-only deterministic role assignment, private projections, fixture actions, test-only phase transitions, replay and role draw verification.
- `backend/src/game/types.ts`: typed boundary for session repository and atomic operations.
- `backend/src/persistence/migrations/004_game_sessions_{sqlite,postgresql}.sql`: additive session, role assignment, private archive, event/action/snapshot/random draw projections.
- `backend/src/multiplayer/sqlite-store.ts`: 02B game store methods using `BEGIN IMMEDIATE` and correlated Room/Session atomic transaction.
- `backend/src/multiplayer/pg-store.ts`: 02B game store methods using PG transactions and `FOR UPDATE`, plus isolated-test schema option.
- `backend/src/multiplayer/server.ts`: game HTTP API and game WebSocket messages; existing routes remain unchanged.
- `backend/src/persistence/sqlite.ts`: narrow query helpers (`listGameIds`, `listActions`) for archive construction; original sync Kernel repository methods remain intact.
- `scripts/serve-02b.mjs`, `scripts/demo-02b.mjs`, `scripts/migrate-pg-02b.mjs`.
- `tests/game-integration.test.mjs` (15 new executed local tests), `tests/postgres-game.test.mjs` (1 conditional real-PG test).
- New documentation and execution logs in `docs/` and `reports/`.

**Why no replacement of kernel:** Sprint 01's synchronous `EngineService` was verified with 24 tests. 02B avoids an untested async PostgreSQL port that might break its atomic event+state semantics. The archive bridge is explicitly transitional with an isolated temporary SQLite workspace and a *single* durable database transaction per game mutation.
