# Regression & Requirement Matrix — Sprint 03 Final Hardening

| Bug / Requirement | Automated proof | Actual run | Boundary |
|---|---|---|---|
| Room Marker center / label / icon / padding | `browser_lobby_e2e.py` real pointer hit tests | PASS | Chromium with actual SQLite backend |
| Mouse double click does not join twice | `browser_lobby_e2e.py` | PASS | Preview only; no mutation |
| Enter/Space | `browser_lobby_e2e.py` | PASS | Native semantic button |
| Mobile touch & 44px hit target | `browser_lobby_e2e.py` | PASS | Chromium touch context |
| Full / locked room | `browser_lobby_e2e.py` | PASS | Join disabled; server join remains authoritative |
| Explicit join / 2-client WS | `browser_lobby_e2e.py` | PASS | Actual two sessions |
| Room IDs stable with list reorder | `interactive-lobby.test.mjs` | PASS | Client-session slot map |
| All rooms in directory | `interactive-lobby.test.mjs` | PASS | Three markers maximum |
| SQLite without DATABASE_URL | `startup-config.test.mjs` STARTUP-01,06 | PASS | Actual subprocess and `.env` loader |
| Invalid provider / port | STARTUP-03 | PASS | Fail-fast |
| PG missing URL in acceptance mode | STARTUP-02, `test:pg:acceptance` negative run | PASS for fail-closed; 5 intentional test FAIL | NOT PG acceptance |
| Demo env flag & production | STARTUP-05; Demo E2E | PASS | Demo off by default |
| EADDRINUSE safe behavior | STARTUP-04 | PASS | Existing server remains alive |
| Codex 97 / no hardcoded 52 | Inherited Codex Node + browser | PASS | Source unchanged |
| No role ID / JSON leaking into Codex | Inherited Codex browser | PASS | Authorized projection unchanged |
| Pending vs resolved feedback | Inherited feedback/gameplay tests | PASS | Only #25/#74 official test pack |
| Event Log rollback/replay | Kernel, game, official tests | PASS on SQLite | PG live still pending |
| URL shadowing; wrong event checkpoints | Inherited regression-hardening tests | PASS | Source preserved |
| No typewriter | Inherited instant-text tests | PASS | Current UI supported routes |
| PG session/rollback/privacy | Five isolated PG tests | SKIPPED (missing server) | Must run on Mac |
| Native Mac browser E2E | `WV_E2E_DIRECT=1` browser runner | NOT RUN on Mac | Run on user device |
| Deleted room after preview | Server error handling code | NOT COVERED BY BROWSER YET | Test candidate for follow-up |
| >3 real rooms, proximity handling | Bounded slot unit test | PARTIAL | Full map density browser audit remains future work |
