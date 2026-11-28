# Wolvesville Sprint 02B acceptance report (2026-11-24)

## Evidence

- `npm run build` — TypeScript compilation successful.
- `npm run verify:source` — PASS: 97 character records unchanged (SHA-256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`), 118 confirmed decisions, 207 legacy rule test specs, 107 unchanged approved frontend files.
- `npm run test:02b:all` — **50 PASS / 0 FAIL / 2 SKIP** across 52 tests. This includes **24 Kernel, 11 Backend 02A and 15 new Sprint 02B** executed tests. The two skipped PostgreSQL tests were not connected to a real database here.
- `npm run demo:02b` — PASS: two real WebSocket clients, private distinct role assignment, room locked and started, test fixture action ACCEPTED and RESOLVED, event/replay verified (15 events, 2 assignment draws).
- SQLite stored role draws, role roster, action/event/snapshot projections and private archive in one transaction. Restart and rollback tested in local SQLite. PostgreSQL 02B test is available, but **not executed** here.

## Decision

**PASS: Sprint 02B local SQLite/Kernel/WebSocket integration.**

**PENDING: Sprint 02B full cross-DB acceptance.** Run PostgreSQL migration and isolated PG integration test on the developer's macOS ARM64 Docker PostgreSQL 16. Do not call it PASS until result is recorded.

**NO-GO: Competitive play.** No official character skills or victory condition are enabled; `fixture.*` is an explicit, local test-only capability gated by `WV_INTEGRATION_TEST_MODE=1`.

## Risk controls

1. Official characters, VH/Q13 source and approved frontend remain byte-identical to inherited source data.
2. No client role-selection result, RNG seed, internal GameState or Event Log is broadcast.
3. Every role assignment and fixture resolution is server-authoritative.
4. Same-datastore transaction prevents partially started games and partially applied fixture effects.
5. Duplicate start/action and stale revision are rejected or idempotently answered.
6. Missing rule adapter is `RULE_UNRESOLVED`; unfinished Victory Resolver cannot claim game completion.
7. Test-mode HTTP/WS server listens on loopback by default. Do not publish with test fixtures enabled.

## Not claimed

No production load/security test, multi-node broadcast, native async PostgreSQL EngineRepository, final graphical UI integration, competitive character Rule Pack or 97-character complete game. The 207 preexisting specifications have NOT all been executed.
