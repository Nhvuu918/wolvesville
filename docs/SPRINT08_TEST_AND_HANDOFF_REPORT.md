# Sprint 08 — Addendum Acceptance Test & Graphics Handoff Report

**Date:** 2026-11-24. **Scope:** Mandatory criteria XVI–XXI implemented as acceptance infrastructure over inherited Sprint 07 v0.9.0; **NOT** a full Sprint 08 official-gameplay release.

## Automated execution in current environment

| Kiểm tra | Kết quả | Bằng chứng |
|---|---|---|
| Source integrity | PASS | `reports/S08_SOURCE_VERIFY.log`; 97 characters, 118 decisions, 207 specs, verified frontend reference |
| TypeScript Build | PASS | `npm run test:08:all` builds all inherited code |
| Inherited S01–S07 Node tests | **153 PASS, 8 PostgreSQL SKIPPED, 0 FAIL** | `reports/S08_AUTOMATED_TESTS.log` |
| 6 new acceptance tests | **6 PASS, 0 FAIL, 0 SKIPPED** | `reports/S08_AUTOMATED_TESTS.log`, S08-A01–A06 |
| Combined `npm run test:08:all` | **159 PASS, 0 FAIL, 8 SKIPPED; exit 0** | `reports/S08_AUTOMATED_TESTS.log` |
| Runtime backend Metric A proof | PASS, **1 pack** | `scripts/s08-verify-match-readiness.mjs`; HTTP, commit, ACL, Events, SQLite restart/replay |
| Runtime Metric B guard | PASS, **0 packs** | Same script; vote intake/close is not adjudication/elimination |
| Browser E2E S07 limited full match | **1 suite PASS; exit 0** | `reports/S08_BROWSER_VERIFICATION.log`; real Chromium + real SQLite backend bridge |
| PostgreSQL acceptance | **PENDING** | No `DATABASE_URL`, `psql` or Docker available in workspace; no fake PASS |
| Graphics handoff | **READY — scoped**, 19 states | `S08_GRAPHICS_READY_CONTRACT.json`, `S08_GRAPHICS_TEAM_HANDOFF.md` |
| Player-first 12-question audit | **MIXED/SCOPED** | `docs/S08_PLAYER_FIRST_ACCEPTANCE.md`; generic vote result BLOCKED |

**Notes on runner:** The first combined command timed out after inherited tests, while the standalone Metric A/B verifier passed. Updated the verifier with `Connection: close` and explicit idle-connection cleanup. Verified standalone 3 consecutive times and reran the entire `test:08:all` successfully (exit 0). This runner-only improvement does not change the Engine.

**Important:** 159 automated passes are not 159 characters or game configurations. Only Metric A and B establish full-match-specific progress. Existing browser E2E suites beyond S07 were inherited unchanged but **not reexecuted in this acceptance addendum run**.

## Match Readiness

**Metric A = 1:** exact deck #8 + #25, server eliminates #25 through committed #8 night attack, server evaluates #8 last survivor and emits `MATCH_COMPLETED`. HTTP clients verify winner, replay and ACL, and SQLite restart preserves outcome.

**Metric B = 0:** exact #25 + #74 deck collected day votes and locked them without adjudicated hanging. This satisfies only Voting Intake, **not** Vote Resolution or Elimination. All other decks are listed in the matrix as scope available from prior sprints, not counted without a new certified run.

**Formal independence:** Metric B requires the vote chain through Victory Check, not necessarily a committed `GAME_COMPLETED`; hence B could exceed A in a future build. The scoring gate encodes this explicitly.

## Player-first and Graphics

There are 19 machine-readable UI states and 12 player journey questions. Graphics events and permissions are not inferred from screenshot. The existing S06–S07 contracts are retained, while S08 v2 scopes night `PLAYER_ELIMINATED` and `MATCH_COMPLETED` to #8/#25. `VOTE_RESOLVED`/generic hanging remain non-runtime placeholders. Instant text and reduced motion are mandatory.

## Files changed / preservation

Only `README.md`, `package.json`, `scripts/s08-*`, `tests/sprint08-*`, `docs/SPRINT08_*`, added `docs/gameplay-flow-handoff/S08_*`, and acceptance reports were modified/added. No changes to `backend/src`, `frontend`, `shared`, `data/character.json`, rule decisions, specs, or migrations. Full source is inherited.

## Remaining blockers to full Sprint 08 gameplay acceptance

- Authoritative vote tally/tie/no-vote resolution and vote manipulation source conflicts (S07-V02/V03).
- Generic hanging/elimination with reactions and immunity (S07-E01).
- General co-winner/victory chain (S07-W01/W02).
- PostgreSQL 16 live test on Mac M5 and broader native browser E2E.

**Overall status of acceptance addendum:** PASS (criteria and executable gates implemented). **Sprint 08 full gameplay status:** NOT EVALUATED / PARTIAL base inheritance; no new official voting or victory rule implemented by this addendum.
