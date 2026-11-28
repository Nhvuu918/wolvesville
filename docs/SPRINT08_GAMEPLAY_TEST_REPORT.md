# Sprint 08 Gameplay Implementation — Actual Test & Acceptance Report

**Built from:** Wolvesville Sprint 08 Acceptance Foundation v0.9.1, Node 22 / TypeScript, backend SQLite.

## Commands and observed exit codes

| Command / evidence | Result | Exit code |
|---|---|---:|
| `npm run verify:source` | **PASS** — 97 canonical characters, 118 decisions, 207 spec records, 107 reference UI files (105 byte-identical runtime + 2 approved technical entrypoint adaptations) | 0 |
| `npm run build` | **PASS** TypeScript | 0 |
| `npm run test:08:gameplay:all` | **178 definitions: 169 PASS, 0 FAIL, 9 SKIPPED** | 0 |
| `npm run test:08:gameplay:metrics` | **Metric A=2**, **Metric B=0**, two distinct certified HTTP/SQLite restarts/replays | 0 |
| `npm run test:browser:08:all` | **9/9 Browser E2E suites PASS**, Chromium real frontend + backend + WebSockets | 0 |
| `node --test tests/postgres-s08-gameplay.test.mjs` (missing URL) | SKIPPED; **not a PASS** | 0 |
| `WV_REQUIRE_POSTGRES=1 node --test tests/postgres-s08-gameplay.test.mjs` (missing URL) | Expected **FAIL 1**, 0 skipped; correct fail-closed config behavior | 1 |
| Live PostgreSQL 16 | **PENDING**: `DATABASE_URL`, `pg_ctl`, `postgres`, and `psql` absent in packaging environment | NOT EXECUTED |

The source-only `npm install` from an isolated pristine Mac has not been rerun in this offline environment. TypeScript/tests were rechecked using dependencies previously installed in the workspace; `node_modules` is excluded from the ZIP.

## Implementation tests (new)

- `tests/sprint08-gameplay.test.mjs`: 8 **PASS** (two-person #8/#28 actual endgame, restart, frozen closed elimination chain, PH-02 cancellation, vote close preflight, raw ballot fail-closed, concurrent votes, second-night once-per-game limitation).
- `tests/sprint08-gameplay-metrics.test.mjs`: 2 **PASS** (A=2 distinct backend configs, B=0 without fabricated vote elimination).
- `tests/postgres-s08-gameplay.test.mjs`: **SKIPPED**, not verified against a live DB.
- Browser: 9/9 including `browser_s08_gameplay_e2e.py` #8/#28 completed match and legacy eight suites; combined runner exited normally. Earlier combined browser attempt failed at an actual preview-room refresh DOM race; technical root cause fixed, rerun PASS. Logs preserve final evidence.

## Two gameplay metrics (source-backed)

| Metric | Before | After | Verification method |
|---|---:|---:|---|
| **A** — Completed Match Configurations | 1 | **2** | #8/#25, **#8/#28**, each separately runs backend role assignment → night kill → commit → final winner → ACL/restart/replay |
| **B** — Vote → Elimination Configurations | 0 | **0** | PH-02 now has confirmed cancellation/no-elimination outcome but this is **not** a hanging; ordinary vote raw tally remains unresolved due V02/V03 |

No character in the 97-role Codex is counted as fully competitive because of its mere presentation. Runtime skill-branch coverage remains the inherited **8 distinct characters** (#8, #9, #20, #25, #31, #34, #74, #79); the #28 deck does **not** add a new skill adapter for #28.

## Source and architecture guarantees

- `data/character.json`, `data/rules/official_merged_118.json`, `data/rules/tests_207.json`, approved frontend reference files, migrations 002/004/005/006 remain intact.
- **Only** room-public `{playerId}` death and `{winnerIds}` match events reach clients. Internal votes, author/skill/cause, death-chain audit and private inspection remain inaccessible.
- `ACCEPTED` never means resolved, `POST_ELIMINATION_CHAIN_CLOSED` and victory proof only after actual transactions; no fake winner.
- Ordinary final vote adjudication and public hanging remain **BLOCKED BY RULE**, so full competitive is **NO-GO**. Restricted closed-deck backend gameplay is **GO on SQLite**, PostgreSQL remains **PENDING**.

## Source logs

- `reports/SPRINT08_GAMEPLAY_FULL_REGRESSION.log`
- `reports/SPRINT08_GAMEPLAY_BROWSER_ALL.log`
- `reports/SPRINT08_GAMEPLAY_SOURCE_INTEGRITY.log`
- `reports/SPRINT08_GAMEPLAY_POSTGRESQL.log`
- `reports/SPRINT08_GAMEPLAY_PG_REQUIRED_NEGATIVE.log`
- `reports/S08_GAMEPLAY_MATCH_READINESS.json`

## Clean extraction cross-check

The **same final source** was packaged to ZIP, extracted in `/mnt/data/S08_GAMEPLAY_CLEAN_VERIFY`, and executed with previously installed dependencies linked because network npm install was not available in the sandbox. `verify:source`, `build`, `test:08:gameplay:new`, `test:08:gameplay:metrics`, and the **full `test:08:gameplay:all` all exited 0**. Consolidated counts: **178 total = 169 PASS + 9 PostgreSQL SKIPPED; 0 FAIL**. See `reports/SPRINT08_GAMEPLAY_CLEAN_ZIP_VERIFICATION.md` and `reports/SPRINT08_GAMEPLAY_CLEAN_ZIP_FULL_REGRESSION.log`.
