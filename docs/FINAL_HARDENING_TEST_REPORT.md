# Final Hardening — Actual Verification Report

Date: 2026-11-24 · Local implementation environment: Node.js 22.16.0, TypeScript 5.8; no PostgreSQL daemon accessible.

## Automated Node tests (actually executed)

| Invocation | Total | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|---:|
| `npm run test:03:ux` inherited suite | 107 | 102 | 0 | 5 (PostgreSQL) |
| `node --test tests/startup-config.test.mjs tests/interactive-lobby.test.mjs` | 12 | 12 | 0 | 0 |
| **Total** | **119** | **114** | **0** | **5** |

TypeScript `npm run build` PASS. `npm run verify:source` PASS: 97 original characters, 118 rule decisions, 207 legacy test specs, approved frontend original. These 207 are *specifications*, not 207 executed tests.

## Browser E2E (actual Chromium, actual backend, SQLite)

Five scripts ran in the disposable SQLite browser runner. Scripts report PASS for:
1. `browser_lobby_e2e.py`: physical pointer at center/label/icon/padding, Enter/Space, double click safe, locked/full conditions, explicit join and two-client WebSocket, mobile touch, no JavaScript page errors.
2. `browser_codex_e2e.py`: 97 original characters, Wheel/Grid, filters and selection, reduced motion.
3. `browser_demo_e2e.py`: two independent demo sessions, lobby and reconnect.
4. `browser_e2e.py`: official limited skill test game, private result after commit, replay and reconnect.
5. `browser_ux_e2e.py`: responsive, room rights, profile/settings and offline banner.

The browser runner printed `PASS: five browser E2E scripts against REAL disposable Wolvesville backend`. Sandbox Linux Chromium used the documented HTTP/WebSocket transport bridge for requests to the *actual* backend. This was not native Mac browser execution and was not an API-mock test.

Screenshots: `reports/final_lobby_room_preview.png`, `reports/final_lobby_mobile_preview.png`. The approved design remains unchanged.

## PostgreSQL: mandatory gate, still pending

No reachable PostgreSQL 16 server was available in this execution environment. Five PostgreSQL tests were SKIPPED in the normal regression suite; **none is marked PASS**. Independently, `npm run test:pg:acceptance` was executed with no `DATABASE_URL` and correctly exited **1** with **0 PASS, 5 FAIL, 0 SKIPPED**. This is intentional negative configuration verification, not successful PG integration.

Isolated test schemas are created only by the PostgreSQL tests and cleaned up after test runs. Existing migrations 002/004/005/006 are preserved; no volumes or application database were reset. Real transaction, concurrency, restart and privacy tests need to be run on Mac using an accessible PostgreSQL test instance.

## Acceptance

**PASS for local SQLite / interactive lobby / existing UI/game integration. PARTIAL overall** until PostgreSQL tests and native Mac E2E are confirmed. 97-character competitive play remains NO-GO (only #25/#74 limited Rule Adapters).

See `reports/FINAL_NODE_REGRESSION.log`, `reports/FINAL_BROWSER_E2E.log`, and `reports/FINAL_PG_MISSING_URL_NEGATIVE.log` for captured evidence.

Verified command: node scripts/run-browser-final.mjs returned exit code 0.
