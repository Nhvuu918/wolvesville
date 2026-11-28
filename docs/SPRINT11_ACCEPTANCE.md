# Sprint 11 implementation / acceptance

Version 1.3.0-s11. Source unchanged for 97 characters, 118 historical decisions and 207 legacy specs. New source `data/rules/sprint11_official_voting_decisions.json`; version pinned in initial state, existing archive replay untouched. Engine base ruleset remains frozen for old adapter IDs. Changes: shared vote contracts; official-voting-policy, vote-adjudicator, vote-control-review, vote-review, elimination-chain, engine service, victory resolver, game coordinator, frontend integration JS/CSS. No migrations required. All old tests retained.

## Readiness
| Deck | Evidence | A | B |
|---|---|---|---|
| 8/28 | Three rounds zero, tie, blank/change, hang #28, both win by #28 and #8 predicates plus VH03; SQLite restart, replay, ACL, two browser contexts | 1 | 1 |
| 8/25 | Seer night inspection, concurrent HTTP revision, hang #25, #8 sole survivor; replay, multi-client, browser | 1 | 1 |
| Other inherited packs | Restricted skills/legacy vote diagnostics/cancellation; no new hanging certificate | 0 | 0 |

Metric A=2 (same distinct decks); B=2 (new exercised paths). Historical S08/S10 metric scripts intentionally continue reporting their baseline and are not S11 metric evidence. Characters with executable skill branches remain 11; no new character adapter. #28 in source is Thằng Ngố, not a renamed character. No claim all possible trajectories are complete. If #8 is hanged, no certified survivor predicate for remaining #25 or #28; commit death and hold DAY_RESOLVE, no fabricated winner. Full wolf/faction rules and #33 on-hang revenge, #23 resurrection, protection/link chains, other modifier ordering remain unimplemented. Legacy #79 cancellation and #33 coercion unchanged. V02 invalidation and câm tested in pure policy unit, not a real applied invalidation or silence adapter; no competitive claim. New policy only enabled automatically for two exact closed decks. No arbitrary public tallies. Voting host driven, no production timers. No live PG available; existing 11 skips, no new live S11 PG certification.

## QA
`npm run test:11:all`: exit 0, 201 tests, 190 PASS, 0 FAIL, 11 PostgreSQL SKIPPED. `tests/sprint11-voting.test.mjs`: four tests including two real HTTP games. New Chromium suites both pass; see reports. Browser initial race in test harness (host still working after async update) corrected by waiting for UI request completion; failed run recorded separately. Historical test files are unchanged. Full production NO-GO. Full match and vote-to-elimination GO restricted to verified paths. Graphics v2.4 partial (text integration tested, additional animation assets not created).

Full browser command `test:browser:11:all` was interrupted by execution timeout after three verified suite completions (two S11 and one S10); the remaining ten suites were not confirmed in that run. Separate S11 browser runner exit 0, both suites passed. Do not count interrupted suites as PASS. See reports/s11_browser_all_partial.log.
