# Test execution / verification evidence

## Executed in build environment

- Runtime: Linux, Node 22.16.0; native `node --test` and TypeScript compiler.
- **Sprint 01 unchanged Kernel tests:** 24 / 24 PASS (baseline before editing and after integration).
- **Sprint 02A backend tests:** 11 / 11 PASS (real localhost HTTP and RFC6455 WebSocket clients).
- **PostgreSQL integration:** 0 PASS / 0 FAIL, 1 SKIPPED because no database daemon or pg driver available in current container. Test is executable on macOS with Docker and `DATABASE_URL`.
- `npm run demo:02a`: successfully started two authenticated WS clients, joined same room and observed room.lock updates via both connections.
- `npm run verify:source`: original 97 character records, 118 decisions, 207 specifications and 107 unchanged frontend files PASS.

## Mechanism coverage

| Mechanism | Test IDs / Description | Status |
|---|---|---|
| Kernel state, RNG, replay, events, transaction | Existing `tests/kernel.test.mjs` | 24 PASS |
| Account registration, login, invalid credentials and logout | `02A: registration/login...` | PASS |
| Room lifecycle + idempotent membership + host transfer | `02A: room create/join...` | PASS |
| Concurrent join, capacity max | `02A: concurrent join...` | PASS SQLite |
| Host-only room locking | `02A: lock/unlock...` | PASS |
| WebSocket two-client sync & outsider denial | `02A: two authenticated WebSocket...` | PASS |
| Reconnect and filtered snapshot | `02A: WebSocket reconnect...` | PASS |
| Persistent accounts/rooms after restart | `02A: SQLite store...` | PASS |
| 1–100 room slots (not game roles) | `02A: room limits...` | PASS |
| Profile rename broadcast | `02A: profile update...` | PASS |
| Logout revokes active socket | `02A: logout closes...` | PASS |
| WS auth/subscribe frame ordering | `02A: ordered WebSocket frames...` | PASS |
| PostgreSQL serial join and persistence | `tests/postgres.test.mjs` | SKIPPED (requires real DB) |
| 97 official character rule integration | No live adapter enabled | NOT IMPLEMENTED |
| Room-to-game / gameplay E2E | Sprint 02B/02C | NOT IMPLEMENTED |

## Do not confuse counts

207 existing `data/rules/tests_207.json` entries are **specifications only**. 35 PASS are actual Node test cases implemented in this codebase. PostgreSQL test is explicitly marked SKIPPED if no `DATABASE_URL`.
