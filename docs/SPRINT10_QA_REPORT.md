# Sprint 10 — test and acceptance report (source release 1.2.0-s10)

This document records commands **actually executed** and their exit codes. An earlier historical Sprint 09 report is not substituted for a current test. `reports/S10_*` are raw logs created during this run. Test tallies below refer to **this** source tree, not 97 finished gameplay roles.

## Integrity

- `npm run verify:source`: **PASS exit 0** (97 original characters, 118 official decisions, 207 legacy specifications, approved 105/107 frontend reference files unchanged, 2 adapted technical entrypoints with original backups). See `reports/S10_VERIFY_SOURCE.log`.
- `npm run build`: **PASS exit 0** (TypeScript compiled and schema copied). See `reports/S10_BUILD.log`.
- `npm run rules:build`: **PASS exit 0**; 145-source branch audit and 97-role Sprint10 overlay generated, no change to original 145/118/207. See `reports/S10_RULES_BUILD.log` and `data/rule-intelligence-s10/`.
- Source data SHA256: `character.json` **7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3**, `official_merged_118.json` **3bd590000aedbe46f5a5a62e43e18c5d247cb3d401ba60f980a050512e8376f3**, `tests_207.json` **0a6edd6b086ebe270519493c83a48d73113a80ffff3528aada51282d8f4a1860**. These are from uploaded Sprint09 ZIP baseline and retained byte-identically.

## Automated real-backend QA

| Command | Outcome | Notes |
|---|---|---|
| `npm run test:09:all` | **197 total / 186 PASS / 0 FAIL / 11 SKIPPED, exit 0** | Original full regression suite still runs including the new Sprint10 tests; see `reports/S10_LEGACY_09_REGRESSION.log` |
| `npm run test:10:all` | **197 total / 186 PASS / 0 FAIL / 11 SKIPPED, exit 0** | Full backend suite plus metric readiness; see `reports/S10_REGRESSION_ALL.log` |
| `npm run test:10:new` | **10 PASS / 0 FAIL, exit 0** | New #5/#76 backend, developer policy, matrix and 145-branch technical DAG coverage; see `reports/S10_NEW_TESTS.log` |
| `npm run test:browser:10:all` | **11/11 suites PASS, exit 0** | 3-client real backend UI #5/#76 plus all inherited real browser suites; `reports/S10_BROWSER_10_ALL.log`, `.exit` |
| `npm run test:browser:09:all` | **10/10 suites PASS, exit 0** | Legacy 10-suite browser rerun in this session: `reports/S10_BROWSER_09_ALL.log`, `.exit` |
| `npm run test:pg:10` | **EXPECTED FAIL exit 1** | Strict check with no DATABASE_URL; not a real PostgreSQL acceptance. See `reports/S10_PG_STRICT_NEGATIVE.log` |
| Non-strict `tests/postgres*.test.mjs` | **SKIPPED** | No PostgreSQL live connection configured; skip is not PASS |

Final backend summary **197 tests / 186 PASS / 0 FAIL / 11 SKIPPED / exit 0** is recorded in the final lines of `reports/S10_REGRESSION_ALL.log` (see actual test counts). Native macOS/Apple Silicon was not available for execution in the Linux QA environment.

### Scope of actual S10 gameplay tests

- #5 exact private verdict, two charges persisted across two night turns, current faction vs visual aura, #20 reactive injury (restricted), idempotent submissions and action revision.
- #76 high-priority two-charge current-night block, prevents previously accepted #25 or #5 action from resolving, actor-only cancellation and target-only lock notice, private event projection, replay and SQLite restart.
- Developer V02/V03 hypothetical policies: unique top, tied, no votes, single vote, quorum, invalid/voter/controller/duplicate ballots, production/competitive rejection. **No official elimination or winner permitted**.
- Actual Chromium browser: three independent authenticated demo users; server assigns exact restricted role pack; user actions through real Dark Fantasy UI; resolved feedback ACL; unauthorized user cannot see verdict; WebSocket reconnect restores private result. **Not a full voting-to-hanging game**.
- Previous certified full match decks `[8,25]`, `[8,28]` still end with real committed result in their inherited tests. **Metric A=2 / B=0**.

**Known limitations:** `test:browser:10:all` emitted a non-fatal Playwright async `TargetClosedError` during teardown of the new three-account suite, despite all 11 suite subprocesses returning zero and test assertions passing. This is not reported as application runtime failure or hidden; the log contains its traceback for debugging. Full PostgreSQL live and Mac native browser E2E remain unverified in this environment. V02/V03 remain unapproved, so no general official hanging test can honestly be PASS.

## Results acceptance

- Gate1 **GO**, Gate2 **GO SQLite / PENDING PostgreSQL**, Gate3 **GO restricted**, Gate4 **GO inherited restricted**, Gate5 **BLOCKED BY RULE**, Gate6 **GO v2.3 verified / PARTIAL overall**, Gate7 **PARTIAL / PENDING PostgreSQL**.
- **Never count** `SKIPPED` as passing, developer hypothetical deaths as actual deaths, QA-only night advancement as competitive multiround matches, a raw ballot as committed elimination, or a visual transition as committed victory.

## Clean full-source ZIP verification

First exported the full source into `Wolvesville_Sprint_10_Gameplay_Completion_Full_Source.zip`, validated **ZIP CRC on every entry**, extracted to a completely separate workspace, then re-ran:

- Clean `npm run verify:source` → **PASS, exit 0** (`reports/S10_CLEAN_ZIP_VERIFY.log`).
- Clean `npm run build` → **PASS, exit 0** (`reports/S10_CLEAN_ZIP_BUILD.log`).
- Clean `npm run rules:build` → **PASS, exit 0** (`reports/S10_CLEAN_ZIP_RULES.log`).
- Clean `npm run test:10:all` → **197 tests / 186 PASS / 0 FAIL / 11 PostgreSQL SKIPPED, exit 0** (`reports/S10_CLEAN_ZIP_REGRESSION.log`).
- Clean `npm run test:browser:10` → **1/1 new real Chromium suite PASS, exit 0**, 3 independent accounts (`reports/S10_CLEAN_ZIP_BROWSER.log`, `.exit`).

In this offline Linux verification runtime, the already-preinstalled `@types/node` dependency was **linked locally only inside the clean temporary workspace**; the ZIP itself contains **no node_modules**. On Mac use `npm install` instead. The full original S09 browser suite and 11-suite S10 suite had also passed before the clean-ZIP extraction. The final ZIP is regenerated to include these clean-verification logs; source and test implementation are unchanged by the regeneration.
