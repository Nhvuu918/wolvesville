# Sprint 02A architecture, persistence boundaries and safe rollout

## Modules

- `backend/src/multiplayer/auth.ts`: scrypt accounts, 256-bit bearer sessions stored as SHA-256 hashes; expiry/revocation.
- `backend/src/multiplayer/rooms.ts`: room request validation and membership service.
- `backend/src/multiplayer/server.ts`: native HTTP API, WebSocket gateway, room broadcast, server authz.
- `backend/src/multiplayer/ws.ts`: restricted RFC6455 text transport for local tests; replace before public release.
- `backend/src/multiplayer/sqlite-store.ts`: transactional single-process lobby store; `BEGIN IMMEDIATE` serializes competing joins.
- `backend/src/multiplayer/pg-store.ts`: optional PostgreSQL store; transactions lock room row `FOR UPDATE` on join/leave/host changes. PG tests remain pending in this build environment.
- `backend/src/engine/`: original unchanged Sprint 01 Kernel with internal deterministic replay; NOT connected to real lobby/game starts yet.

## Databases and transaction boundary

`SqliteMultiplayerStore` uses `002_multiplayer_sqlite.sql` as a separate lobby database (`./local/02a_lobby.sqlite` by default). **Do not point it at the Sprint 01 kernel database** to infer a game has started. The Kernel's `GameRepository` and transaction remain intact. The alternative `PostgresMultiplayerStore` uses `002_multiplayer_postgresql.sql` for accounts, sessions, rooms, members and future `room_game_links`.

The `003_engine_postgresql_schema_DRAFT.sql` is an **unapplied structural draft** for a future single-DB state/event transaction. Sprint 01 Kernel's repository API is synchronous; `pg` is async. Sprint 02B must port that interface and prove atomic state/event/replay semantics before attaching PostgreSQL to actual games. A two-database coordinated write is NOT considered atomic. Use a single transactional repository or transactional outbox for cross-module notifications.

## Runtime flow supported now

`HTTP login -> session DB lookup -> room CRUD -> atomic membership commit -> WebSocket authorization check -> room state projection -> broadcast`. WebSocket subscriptions are *not* membership entries; room membership must pre-exist in the DB.

## Runtime flow NOT supported yet

`room role lock -> allocate 97 unique role IDs -> createGame -> submit official action -> effects -> victory -> replay -> player projection`. No route in Sprint 02A pretends to execute this. Engine fixture resolvers remain gated test-only; production has none.

## Multinode deployment gate

Current online presence and subscription tables are in memory. For more than one server process, deploy a durable broker (Redis streams/pubsub or equivalent) and distributed presence tracking. Horizontal scaling without this change may miss broadcasts. Use a maintained WebSocket server and reverse proxy TLS for internet exposure.

## Source and rule traceability

`npm run verify:source` compares 97 official role entries, 118 rule decisions, 207 rule specifications and 107 frontend assets against the Sprint 01 manifests and source hashes. No Wolvesville rule or UI changes were introduced in this sprint.
