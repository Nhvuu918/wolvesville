# Sprint 08 Gameplay — Traceable Regression Matrix

This matrix links *real implementation paths*, exact test files and browser scenarios. `PASS` only denotes a test actually executed; PostgreSQL acceptance must be run separately on a real test DB.

| Gameplay behavior | Code path | Test/evidence | Scope |
|---|---|---|---|
| Certified #8 → #28 death and sole-winner match | `solo-rules.ts`, `elimination-chain.ts`, `victory-resolver.ts`, `service.ts` | `S08-G01`, `S08-G02`, `S08-G09`; `browser_s08_gameplay_e2e.py` | Backend and two independent browser contexts |
| Existing #8 → #25 full early-night match | `solo-rules.ts`, `service.ts`, `coordinator.ts` | `S07-01`, `S07-05`; `browser_s07_e2e.py` | Regression preserved |
| No premature victory at ACCEPTED | Kernel action submission / completion gating | `S08-G01`, `S07-01`, Browser S08 | Only post-resolution commit wins |
| Internal death-chain audit not projected | `elimination-chain.ts`, `visibility.ts` | `S08-G01`, `S08-G02`, `S08-G06` | Client receives only `PLAYER_ELIMINATED {playerId}` |
| #28's hanging-only win is not triggered by night death | `solo-rules.ts`, `victory-resolver.ts` | `S08-G01` | Restricted 8/28 deck |
| Vote-cancel after #79 skill commit | `peace-rules.ts`, `vote-adjudicator.ts`, `service.ts` | `S08-G03`, `S08-G08`, `S06-07...`; `browser_s06_e2e.py` | No elimination from canceled vote |
| Prevent close with pending accepted day action | `service.closeVoting`, `PENDING_ACTIONS` | `S08-G03` | 409 with no state revision/event commit |
| Raw highest votes do not select hanging | `vote-adjudicator.ts`, internal audit | `S08-G04`, `S08-G05`, `S07-03` | `ADJUDICATION_UNRESOLVED`; Metric B stays 0 |
| Concurrent votes/idempotency and ACL | `submitVoteIntent`, GameStore mutation transaction | `S08-G07`, `S06-02`, `S06-03` | One vote per voter, private targets |
| Round 2 and once-per-match peace skill | `GameCoordinator.resolve`, `peace-rules.ts` | `S08-G08`, `browser_s06_e2e.py` | Actual multi-round non-elimination flow |
| JSON/Codex 97 and original artwork preserved | `frontend/codex-data.js` / original reference | `npm run verify:source`, `browser_codex_e2e.py` | No new player-facing technical ID |
| Room Marker tap and modal DOM lifecycle | `frontend/integration.js` | `browser_lobby_e2e.py` (desktop/touch/keyboard) | Avoid detaching unchanged preview |
| Demo Auth, room/game WebSocket and reconnect | Inherited backend and frontend | `browser_demo_e2e.py`, `browser_e2e.py`, `browser_s08_gameplay_e2e.py` | Distinct client sessions |
| Source frozen and all prior regression tests | `scripts/verify-sources.mjs` / full test manifest | `npm run test:08:gameplay:all` | No deleted Sprint 01–07 tests |
| PostgreSQL schema-isolated night match 8/28 | `postgres-s08-gameplay.test.mjs` | `npm run test:pg:08:gameplay` | **PENDING** external PostgreSQL (no local server) |

**Not claimable:** Generic vote→hanging→death→win, general faction victory/co-winners, 97 fully playable skills, real PostgreSQL PASS. These are tracked in `SPRINT08_GAMEPLAY_UNRESOLVED.md`.
