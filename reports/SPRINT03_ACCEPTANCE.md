# SPRINT 03 — Acceptance & Test Execution Report

**Ngày báo cáo:** 2026-11-24. **Kết luận: PARTIAL — nguồn frontend↔backend chạy, PostgreSQL Sprint03 và browser native Mac chưa nghiệm thu trong workspace này.**

## Test thật, không gộp với test specification

| Suite | Executed | PASS | FAIL | SKIPPED | Evidence |
|---|---:|---:|---:|---:|---|
| Inherited Sprint01–02C tests | 63 | 60 | 0 | 3 | `reports/SPRINT03_FULL_TESTS.log` (inherited tests retained) |
| Sprint03 tests: feedback projection, HTTP+SQLite integration, instant-text, strict PG integration | 12 | 11 | 0 | 1 | `reports/SPRINT03_FULL_TESTS.log` |
| **Combined `npm run test:03`** | **75** | **71** | **0** | **4** | Node v22.16, TypeScript compile succeeds |
| Chromium Browser E2E (2 independent BrowserContexts, real HTTP/WS via bridge) | 1 multi-step scenario | **PASS** | 0 | 0 | `reports/SPRINT03_BROWSER_E2E.log` |
| Mandatory PostgreSQL (strict, without `DATABASE_URL`) | 4 | 0 | **4 expected config failures** | 0 | `reports/SPRINT03_PG_STRICT_NO_DB_NEGATIVE.log`; exit code 1; NOT a PG functionality pass |
| PostgreSQL integration against a running server | 4 defined | **0 executed** | — | **4 not run** | Missing server/driver in sandbox. Run on Mac |
| Direct browser→127.0.0.1 networking (native Chrome) | — | — | — | **Not verified** | Sandbox policy blocks localhost navigation; bridge used |

**The user reported 63/63 Sprint02C PASS on their Mac.** This pertains to a distinct environment and prior source; not treated as Sprint03 PostgreSQL PASS.

## Browser E2E steps actually passed

1. Two independent accounts register and log in using actual backend and real authenticated tokens.
2. Alice creates a 2-player room; Bob joins; both receive room membership.
3. Host locks room and starts official test pack #25 + #74; 97-character canonical role map loaded; #74 correct; other role undisclosed.
4. Actor submits `official.25.inspect-role` / `official.74.inspect-role`, receives PENDING (no premature result); other viewer has no feedback.
5. Host resolves; Engine commits; actor receives private role result; both clients see day phase, other viewer sees no private event.
6. User reconnects to WebSocket; action feedback not duplicated.
7. Fresh browser document with restored session authenticates against server and receives same authorized role result; dialogue is full text instantly; no page JS exceptions.

## Functional acceptance

| Criterion | Result | Limit |
|---|---|---|
| Full source inherited 01–02C + UI | PASS | 107 originals in `reference`, 2 entrypoints adapted |
| Backend HTTP and WS, authorized gameplay | PASS SQLite | PG must rerun on Mac |
| Universal feedback architecture | PASS for approved `ROLE_INFORMATION` | Other result kinds deliberately unregistered, no guessed laws |
| No result before RESOLVED | PASS | UI shows ACCEPTED/PENDING only |
| Server-side information secrecy | PASS in tested official pack | no faction/group policy enabled |
| No typewriter text | PASS tests and browser | graphic animations preserved |
| Reconnect/history from server | PASS in tested configuration | no cross-game post-game authorized history |
| Original source checksum | PASS `verify:source` | 105 byte-identical; 2 entrypoints changed technically; original 107 saved |
| No competitive full 97 | PASS: hard-gated | intentionally disabled |
| All PostgreSQL tests PASS | **PENDING** | strict test must run against Mac PG16 |
| Native browser two contexts Mac | **PENDING** | `WV_E2E_DIRECT=1` path provided; not run here |

## How to close Sprint03 on Mac

```bash
npm install
npm run verify:source
npm run test:03
# .env contains true existing PostgreSQL connection; no credentials in logs
npm run db:migrate:pg:02c
npm run test:pg:03
WV_OFFICIAL_RULE_TEST_MODE=1 DB_PROVIDER=postgres PORT=3212 npm run serve:03
# in second terminal
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_e2e.py
```

Only after all mandatory PostgreSQL integration tests and native two-context browser E2E actually PASS, confirm Sprint03 whole acceptance. Do not delete old migrations or reset existing DB/volume. Test fixture gameplay is not competitive.

## Final source conditions

- Original official `data/character.json`, 118 law decisions, 207 legacy test specs unchanged.
- No LPTV source or rules.
- **No player-secret result** published to public room or other participants.
- No unsupported role or skill promoted into a playable official pack.
- No `.env` credentials, `node_modules` binaries, or live SQLite DB included in ZIP.
