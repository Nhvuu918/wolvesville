# Sprint 02B — actual test execution report

Environment used to produce this artifact: **Node.js 22.16.0**, TypeScript 5.8.3, SQLite via `node:sqlite`. **No Docker daemon, PostgreSQL client, `pg` driver or `DATABASE_URL` available inside the build container.** Claims below are limited to this environment.

## Baseline from unmodified Sprint 02A

Executed `npm run test:all` before any edits (log: `reports/02B_BASELINE_02A.log`). Results: **36 specifications invoked, 35 passed, 0 failed, 1 PostgreSQL skipped**.

## Sprint 02B final suite

Executed `npm run test:02b:all` after 02B integration (log: `reports/02B_FULL_TEST_EXECUTION.log`). Results: **52 specifications invoked, 50 PASS, 0 FAIL, 2 SKIPPED**. The skipped cases are both real PostgreSQL tests requiring `DATABASE_URL` and a running PG 16 database. No skipped test is treated as passed.

**Breakdown:**

| Group | Executed and passed | Skipped |
|---|---:|---:|
| Sprint 01 Kernel | 24 | 0 |
| Sprint 02A Auth/Rooms/WS | 11 | 0 |
| Sprint 02B Room→Game Integration | 15 | 0 |
| PostgreSQL 02A | 0 | 1 |
| PostgreSQL 02B | 0 | 1 |
| **Total** | **50** | **2** |

New tests include two-client game WebSocket, host-only start/resolve, unique role assignment, private per-viewer role, no seed or internal event leakage, fixture action and official-action refusal, idempotent starts/commands, stale revisions, concurrent join/start/submit, server rollback, replay and restart persistence, per-user game WS reconnect, role-draw record integrity and Event Log projection coherence.

`npm run demo:02b` was also executed (log: `reports/02B_TWO_CLIENT_DEMO.log`): server started, two actual WebSocket clients joined, the developer CLI saw two **distinct** assigned official Character IDs, one fixture action was accepted/resolved, an authorized participant received the phase update, and Replay including assignment RNG verified successfully.

`npm run verify:source`: **97 official roles, 118 decisions, 207 legacy specs, 107 approved frontend files unchanged**. These 207 documents are **legacy test specifications**, not 207 executed tests.

## Acceptance status

- **PASS (local SQLite integration):** Compilation, 50 tests, two-WebSocket demo, rollback/replay, idempotency, server-side authorization, unchanged UI and `character.json`.
- **PENDING (real PostgreSQL):** Execute `npm run db:migrate:pg:02b` then `npm run test:pg:02b` with PG16 on Mac. The PostgreSQL transaction path is implemented but not honestly verified in this build environment.
- **NOT IN SCOPE:** Competitive play, all 97 official role resolvers, victory, timers/chat, graphical HUD changes.

Sprint 02B **must not be marked fully accepted** until the PostgreSQL test succeeds on the intended development environment, and any resulting issues are fixed.
