# Sprint 02B bug-fix merge register — 02C

All five fixes have **source changes** and evidence; PostgreSQL runtime validation remains pending in this execution environment.

| ID | Code fix | Evidence | Status |
|---|---|---|---|
| BUG-02B-001 | `scripts/local-env.mjs`, `scripts/migrate-pg-02b.mjs`, `pg-store.ts` verify URL and preflight connection; diagnostic 28P01 redacted | `regression-hardening.test.mjs`; no reset/volume deletes | Implemented; invalid/absent configuration tested; actual auth needs PostgreSQL |
| BUG-02B-002 | `tests/postgres-game.test.mjs`: rename connection string `URL` to `DATABASE_URL`; keep global `new URL(...)` | `regression-hardening.test.mjs` | Implemented; regression PASS |
| BUG-02B-003 | compare event count to `beforeFailedResolveReplay` after action ACCEPTED; verify after-failure replay and unchanged game state; no 15/17 hardcode | `postgres-game.test.mjs`, regression source guard | Implemented; actual PG transaction pending PostgreSQL |
| BUG-02B-004 | `finally` cleanup of test clients and server handles; `pg-store.ts` closes pool on failed connect | PostgreSQL tests in `tests/postgres*.test.mjs`; run `npm run test:pg:02c` | Implemented; failure cleanup under real PG still pending validation |
| BUG-02B-005 | `.env.example`, `.gitignore`, `local-env.mjs`; strict `WV_REQUIRE_POSTGRES=1` path fails when URL missing | strict negative test command exits code 1, 3 failed, 0 skipped | Implemented, verified negative path |

Additional changes: additive migration 005 (PostgreSQL + SQLite); persistent `rule_pack` discriminator; two role adapters and independent official effect handler; game WebSocket sends server-filtered `game.events` **after** transaction commit.

Do not treat negative configuration-check failures as a passed PostgreSQL integration test. Do not share real DATABASE_URL credentials in a bug report.
