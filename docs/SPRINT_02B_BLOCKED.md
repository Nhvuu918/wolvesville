# Sprint 02B — blocked, explicitly unsupported and rule-unresolved branches

## Test-only scope, not real role gameplay

- Official `character.json` is used for **role assignment and display only**. No resolver for any of its 97 actual characters is registered. `fixture.*` is for developer/integration tests, never mapped to a Wolvesville role's real action or win condition.
- `RULE_UNRESOLVED` blocks unrecognized skills. New official competitive game start is disabled without `WV_INTEGRATION_TEST_MODE=1`; when test mode is enabled, game remains `INTEGRATION_TEST` and cannot score competitive wins.
- Victory Resolver and `GAME_COMPLETED` transition deliberately remain blocked (Sprint 01 EngineService). No fake victory.
- Only one Game Session per Room currently. Repeat matches using same room, automated bots, live chat and in-game timers are not implemented.
- Room capacity 98–100 is valid, but current game start refuses more than 97 distinct initial roles; it does not invent or repeat IDs.

## Role and rule blockers inherited from v1.3.1 audit

- Sói Kỹ Sư: an empty legal fake-result set cannot be guessed.
- Phù Thủy / Thần Thảo: seed fate after rescue is unresolved; no fabricated status transition.
- Kẻ Vu Khống: canceled vote / Oscar interaction cannot be inferred from the different Kẻ Chết Thay decision.
- Người Lái Đò #51: private chat capability conflicts with the prior explicit 1–1 whitelist; no implicit private channel created.
- Reversal of multi-effect skills has no general safe algorithm. Bad inherited Tiên Tri #25 tests require correction against official original JSON.

All are **not executed** by the 02B integration mode, which uses isolated technical fixtures. No decision from another project is referenced.

## Technical readiness blockers

- PostgreSQL 16 live path is implemented but **not executed** in the build environment; run the isolated PG tests on Mac and inspect failure logs.
- Production WebSocket server uses 02A's restricted local RFC6455 transport; a maintained WS library + TLS + multi-node fanout is required before internet deployment.
- Native async PostgreSQL GameRepository migration is deferred. The temporary archive bridge is correct within the tested scope but has not had load/performance tests.
- Real frontend integration is deferred to a later sprint. Official graphics/CSS/animations were not changed.
- Expiring action deadlines, AFK/bot orchestration and correct role priorities require later official adapters; test fixtures do not imply these mechanics.
