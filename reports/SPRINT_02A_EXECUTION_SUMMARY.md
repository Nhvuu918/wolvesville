# WOLVESVILLE — Sprint 02A execution report

**Date:** 2026-11-24. **Environment:** container Linux, Node v22.16.0; PostgreSQL server/Docker not available to this execution environment. The user's Apple M5 / Node v24 setup can be used for next acceptance run.

## Baseline

- Sprint 01 original `npm test`: **24 passed / 0 failed** before any source changes.
- Sprint 01 engine implementation and kernel tests preserved.

## Delivered implementation

- Built TypeScript HTTP API and authentication/account/profile service.
- Built SQLite room/membership store with transaction-controlled capacity, idempotent join, host handover, room lock/unlock.
- Built session-authorized WebSocket transport, subscription filtering and reconnect snapshots.
- Auth hardening: scrypt password hash, hashed session tokens, expiry/revocation, server ACL, no roles/secret Engine state exposed.
- Added asynchronous PostgreSQL lobby repository, SQL migration, Docker Compose and a real-DB integration test. **Not locally executed against PostgreSQL.**
- Existing Kernel SQLite persistence and official UI unchanged. No character resolvers activated.

## Real tests executed

`npm run test:all`: **36 tests discovered: 35 PASS, 0 FAIL, 1 SKIPPED**.

- 24/24 original Kernel tests PASS.
- 11/11 HTTP/WebSocket/SQLite backend tests PASS.
- PostgreSQL integration is SKIPPED without `DATABASE_URL`, not a pass.

`npm run demo:02a` -> `TWO_CLIENTS_SYNCED` with two actual WebSocket connections, revision 3 after locking room.

`npm run verify:source`: **PASS** — 97 official character entries, 118 decisions, 207 source test specs, 107 original frontend files.

## Acceptance status

| Criterion | Status |
|---|---|
| TypeScript backend builds | PASS |
| HTTP registration/login/session/room/profile | PASS on SQLite |
| Two WS clients synchronize a room | PASS |
| Concurrent join obeys room capacity | PASS on SQLite |
| Unauthorized subscribe blocked | PASS |
| Reconnect snapshot | PASS |
| SQLite database persists across server restart | PASS |
| PostgreSQL migration/connect/transaction | PENDING on macOS Docker |
| Kernel regression | PASS (24/24) |
| Engine joined to actual game session | NOT IN 02A (02B) |
| Official rule adapters & victory | NOT IN 02A (02C) |
| Official frontend modified | NO (hash checked) |
| First playable competitive match | NOT READY |

**Readiness verdict:** `GO` for locally running the **Sprint 02A SQLite lobby prototype**; `CONDITIONAL` for PostgreSQL 02A acceptance until the Mac Docker test passes; `NO-GO` for full Sprint 02 multiplayer match.
