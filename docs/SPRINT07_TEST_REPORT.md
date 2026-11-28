# Sprint 07 — Real Test Execution & Acceptance

## Verification context

- Runtime Linux Node.js 22.16.0, `node:sqlite`, TypeScript. Mac Apple M5 Node24 not physically available here.
- No PostgreSQL server/Docker daemon, `DATABASE_URL` not defined. PostgreSQL test code exists, cannot record PG PASS.
- Source verification: original `character.json` SHA256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`; 97 unique IDs, 118 decisions, 207 legacy specifications and 107 approved UI reference files.

## Automated Node.js suite: `npm run test:07:all`

| Source suite | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|
| Sprint01–03 regression suite | 102 | 0 | 5 PG |
| Sprint03 final hardening | 12 | 0 | 0 |
| Sprint04 official Rule KB | 13 | 0 | 0 |
| Sprint05 support/interaction | 11 | 0 | 0 |
| Sprint05 PostgreSQL | 0 | 0 | 1 |
| Sprint06 lifecycle/voting | 9 | 0 | 0 |
| Sprint06 PostgreSQL | 0 | 0 | 1 |
| Sprint07 new engine + HTTP + ACL | 6 | 0 | 0 |
| Sprint07 PostgreSQL | 0 | 0 | 1 |
| **TOTAL** | **153** | **0** | **8** |

**Exit code 0**, no old test removed. These are executable test cases; the 207 legacy specs are NOT included as executed test cases.

Sprint07 tests actually exercise: two players and initial-roles no duplication; action accepted without premature death; server kill after night resolution; audit for death provenance; client privacy; correct last-survivor winner after full accepted chain; duplicate action/complete guard; no fake winner when no death; vote-count diagnostic not exposed; restart SQLite, replay; concurrent inspector action and attacker action; forgery/outsider denial. Full match generic voting and tie-break are not marked PASS.

## Browser E2E

- `npm run test:browser:07:all` completed **8/8 suites PASS, exit code 0**. Includes S07 certified full terminal match with two Chromium contexts, existing S06 day/vote, S05 gameplay, Lobby marker, Codex97, Demo Auth, prior gameplay, UX responsive.
- Chromium local loopback in this sandbox uses the existing HTTP+WS bridge to real backend SQLite. A direct browser-to-localhost test on Mac has not been run here.
- Real browser verifies UI skill capability, no premature result, winner screen, two WebSocket updates, reconnect, private role projections, session isolation.

The terminal scene also has a browser assertion for correct endgame banner, no visible role ID next to own role name and no day-voting discussion panel after an early-night finish. One combined runner invocation was interrupted by the calling shell while its child continued and printed `S06_BROWSER_ALL_8_PASS`; a separate previous invocation explicitly recorded exit code 0. This does not demonstrate all runs are free from environmental timing variation.

## PostgreSQL acceptance

- S07 test: `tests/postgres-s07.test.mjs` creates random `wvs07_test_*` PostgreSQL schema, runs additive migrations 002/004/005/006 in isolated schema, checks official #8 win/replay after restart, ACL and idempotency, and drops **only its temporary test schema** in `finally`.
- Environment lacks database server, so **SKIPPED, NOT PASS**. Mandatory `npm run test:pg:07` will FAIL if `DATABASE_URL` absent. Must verify on user Mac (Docker PostgreSQL 16 already installed).
- A prior long execution of the chained regression stalled and was interrupted; an independent full subsequent execution **succeeded with exit code 0**. Use final report log, not the interrupted attempt, as acceptance evidence. This is not a claim of proven zero flakiness on all hosts.

## Decision

- GO — SQLite Kernel, ACL, replay, restricted early-night #8 winner, terminal UI and browser integration.
- PARTIAL — Voting/Elimination generic, co-winner/faction victory, other 97 role interactions.
- PENDING — PostgreSQL live on Mac; direct browser localhost on Mac.
- NO-GO — Full competitive.
