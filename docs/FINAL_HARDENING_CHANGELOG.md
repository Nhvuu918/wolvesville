# Sprint 03 Final Hardening — Changelog v0.5.1

| File | Change | Purpose |
|---|---|---|
| `frontend/app.js` | Bound room marker to Room ID; stable three-slot map; tracked pointer/key gesture and defers network-driven map replacement; keyboard-only click fallback | Reliable, accessible room choice without changing Dark Fantasy map/art |
| `frontend/integration.js` | Added `previewRoom`, preview panel, explicit guarded `openRoom` join, room-directory preview, stale-room error handling | Selection no longer mutates room membership |
| `frontend/player-ux.css` | Enlarged true button hitbox, decorative pointer-events none, focus-visible, touch behavior and responsive size | Pointer/touch accessibility |
| `.env.example` | SQLite as safe first-run default, PG URL optional unless provider postgres | Fix SQLite quick-start |
| `scripts/local-env.mjs` | Added `startupConfig()` validation | One source of startup configuration; no secret log |
| `scripts/serve-03.mjs` | Loads validated provider/port and reports PG vs SQLite failures | Fail-fast startup without database reset |
| `package.json` | Version 0.5.1; added `dev`, separate acceptance and test commands | Reproducible Developer Experience |
| `tests/postgres.test.mjs` | Isolated schema and cleanup | No test writes into app default schema |
| `tests/postgres-game.test.mjs` | Cleanup temporary schema | Prevent schema residue |
| `tests/postgres-official.test.mjs` | Cleanup temporary schema after closing pools; no early close of admin client | Safe transaction tests |
| `tests/startup-config.test.mjs` | Six real subprocess/env tests | SQLite, missing PostgreSQL URL, Demo, port safety |
| `tests/interactive-lobby.test.mjs` | Six Room ID/slot/interaction tests | Stable room identity and preview-only design |
| `tests/browser_lobby_e2e.py` | Real pointer, keyboard, mobile touch, locked/full state, join and WS tests | No static-only assertions |
| `scripts/run-browser-final.mjs`, `scripts/run-browser-lobby.mjs` | Disposable DB browser runners | No impact on existing application DB |
| `docs/FINAL_HARDENING_*.md`, README, `reports/` | Acceptance, Mac setup, audit and evidence | Transparent deliverables |

**Unmodified:** Engine core, Character JSON, rules ledger, 207 original test specifications, original Bách khoa styling and approved artworks, migrations 002/004/005/006.
