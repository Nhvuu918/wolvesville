# Persistence, consistency and migrations (Sprint 02B)

## Additive migration files

- `backend/src/persistence/migrations/002_multiplayer_sqlite.sql` — inherited 02A lobby/accounts.
- `backend/src/persistence/migrations/002_multiplayer_postgresql.sql` — inherited 02A PG.
- `backend/src/persistence/migrations/004_game_sessions_sqlite.sql` — new; applied by `SqliteMultiplayerStore` at startup.
- `backend/src/persistence/migrations/004_game_sessions_postgresql.sql` — new; run **explicitly** with `npm run db:migrate:pg:02b`.

No previous migration is overwritten; the migration tool uses additive `CREATE TABLE IF NOT EXISTS`, no `DROP`/`TRUNCATE`. Back up any existing database before first application in non-test environments.

## Game data structures

- `game_sessions` / `wv_game_sessions`: stable game/room IDs, start idempotency key/fingerprint, phase/revision, mode, private kernel archive and seed commitment.
- `game_participants` / `wv_game_participants`: player IDs and distinct initial/current role/faction; **UNIQUE(game_id, initial_character_id)** only.
- `game_assignment_draws`: deterministic role candidate sets and results, internal-only.
- `game_events`: immutable event log projections with seq; original hash-chain events remain authoritative in private Kernel archive.
- `game_snapshots`: revision and state hash index; full snapshots remain in Kernel archive.
- `game_actions`: idempotency/status projection; full action contract and queue remain in Kernel archive.
- `game_random_draws`: Kernel random result projection; includes candidates and result, internal-only.

## Transaction boundary

**Start:** membership/host/revision check + room IN_GAME + game header + all participants/assignment draws + kernel archive + role-free game link + initial event/snapshot projection are ONE datastore transaction. PostgreSQL obtains a row lock on `wv_rooms`; SQLite uses `BEGIN IMMEDIATE`. Conflict or error triggers rollback. Start idempotency checks key **and** selected role-set fingerprint, never silently changes configuration.

**Action / resolve:** `wv_game_sessions` is selected `FOR UPDATE` (PostgreSQL) or SQLite transaction locks the writer; private archive bytes are loaded into an isolated temporary SQLite database, then the **unchanged** Kernel applies validation, effects, event logging, snapshots and replay. The resulting archive and relational projections are committed inside the original DB transaction. On exception the temporary archive is deleted and the outer DB transaction rolls back. WebSocket broadcasts occur only after awaited commit.

**No database split:** Even in PostgreSQL mode, no game is kept as an independent cross-database authoritative SQLite file. The temporary SQLite file is a processing workspace only. The durable single transactional authority remains PostgreSQL.

**Scope constraints:** file archive processing is correctness-first and potentially expensive for long games. Single process tested; cross-host websocket fanout and native async PostgreSQL EngineRepository are future work. Do not use a production multi-node deployment yet.

## PostgreSQL test isolation

`npm run test:pg:02b` (when `DATABASE_URL` is set) creates a **uniquely named schema** `wv02b_test_*`, executes both migrations within it and connects a test-scoped PostgreSQL store. It tests real start/resolve/rollback/restart/role-draw projections. The test schema is **preserved** for inspection, not dropped automatically. The database role must have CREATE privilege. For existing shared DBs, review `DATABASE_URL` and run against a dedicated development database; never point it at production.
