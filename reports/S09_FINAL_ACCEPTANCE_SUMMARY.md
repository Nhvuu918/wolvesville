# Sprint 09 final acceptance — actual runs

| Item | Actual | Evidence |
|---|---|---|
| Canonical source and migrations | 97, 118, 207, 107 UI refs, PG 002/004/005/006 unchanged | `S09_SOURCE_HASHES_SHA256.txt`, verify:source log |
| Build/Node | **176 PASS, 0 FAIL, 10 SKIPPED**, exit 0 | `S09_FULL_TESTS_RELEASE.log`, `.exit` |
| Browser E2E aggregate after source corrections | **10/10 PASS, exit 0** | `S09_BROWSER_ALL_RELEASE.log`, `.exit` |
| Native Chromium UI with real SQLite + HTTP/WS bridge | **PASS** | `S09_BROWSER_AFTER_23_FIX.log`, `s09_voting_browser_real.png` |
| Official #33 coerced ballot | **IMPLEMENTED & TESTED**, isolated [25,33,74] | `tests/sprint09-voting.test.mjs` & browser test |
| #23 after-death vote ban | **CORRECTED** — alive can vote, dead cannot | `tests/sprint09-voting.test.mjs` S09-06 |
| Metric A | **2**, unchanged | `s08-gameplay-readiness.mjs` real-backend proof |
| Metric B | **0**, unchanged | vote→elimination unavailable until V02/V03 confirmed |
| PostgreSQL live | **PENDING** — no live instance / URL | `tests/postgres-s09.test.mjs` ready, strict-negative log exits 1 |
| Full competitive | **NO-GO** | 97 skills/interaction/victory not fully implemented |

**Evidence caveat**: One prior aggregate browser attempt failed UX after a reconnect rendered over a live create-room form; the UI was repaired and a dedicated reconnect-while-typing browser assertion added. Final **release aggregate** finished with exit 0. Previous failed attempts are retained for audit, not counted as PASS.

The browser harness uses genuine backend HTTP and WebSockets via a sandbox transport bridge, **not mocked rules or replies**. PostgreSQL 16 and native browser on Mac require the Mac acceptance commands in `docs/SPRINT09_MACOS_M5.md`.
