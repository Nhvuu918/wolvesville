# Wolvesville v1.7.29 — Blocker Closure & Gameplay Completion

**Engineering checkpoint only; official v1.3.3 remains active; v1.3.4 CANDIDATE; Competitive Production NO-GO.**

Source fingerprint: `f8bb5fc5c9b8357900ad83988b3664302fbd69b3f137f0c07de97877c4452a50`. Input v1.7.28 ZIP SHA-256: `9bcf81bec5ae674d360b7502df8000d9e800d7b80ac27c4fe05d266df3e532e8`. Input 3812 payload hashes checked; 2956 historical report files unchanged.

## Executive results

| Obligation | Fresh result |
|---|---|
| Normal Handoff | CLOSED_TESTED_SCOPE; 6/6 browser scenarios incl. both [8,25] and [8,74]; deterministic 2 old FAIL / 2 new PASS |
| Backend monolithic | PASS: 454 PASS / 0 FAIL / 11 SKIP; exit 0 |
| Browser manifest | 23 PASS / 0 FAIL / 52 INCOMPLETE, total 75 |
| Rule-version matrix | 23 PASS / 0 FAIL / 87 INCOMPLETE, total 110 |
| FULL #28 | 1/1 |
| QA C | 2/2 |
| Playable C | 7/7 |
| Atomic | 79/79 |
| SHARED-23 | PARTIAL; new live self-shield / hanging / secret revival / second death acceptance, not new gameplay implementation |
| FULL new | 0 |
| TRAP-04 / TRAP-05 | PARTIAL; no new inversion implementation |
| PACK-05 / PACK-PRIVACY-01 | PARTIAL; no new gameplay/privacy implementation |
| Human QA / PostgreSQL live | PENDING |

## Handoff diagnosis and fix

The v1.7.28 historical browser failed while waiting for selectedTarget == id, before vote submission. A natural rerun of v1.7.28 passed: the historical failure is not deterministically reproduced in that run. Two controlled adapter tests, identical on both versions, reproduce the identified state-publication and auxiliary-read race (2 old FAIL / 2 new PASS). `frontend/integration.js` now synchronizes seat maps with the accepted snapshot before paint, navigates with valid game snapshot before auxiliary feedback/events, ignores superseded socket frames, avoids stale room-revision replacement, and drops invalid selected targets. No backend gameplay logic changed. Both normal decks are exercised with a real feedback GET held during reconnect in the browser; no payload/expected result altered; no timeout expanded. Focused HTTP/WS/SQLite/replay and adapter acceptance: 5 PASS. Evidence: `handoff-before.log`, `handoff-unit-before.log`, `handoff-unit-after.log`, `focused.log`, `browser-normal/`.

## Fresh browser inventory

The 75-suite/110-obligation inventory is preserved. The normal suite contains six scenarios (including added role-handoff). Pre-final diagnostic runs are archived but excluded. Matrix exit can be nonzero because unselected obligations are incomplete; individual run exit and fingerprint determine acceptance.

| Ruleset | Suite | Status |
|---|---|---|
| 1.3.3 | `browser_s15_approved_village_e2e.py` | PASS |
| 1.3.3 | `browser_s15_approved_revenge_e2e.py` | PASS |
| 1.3.3 | `browser_s15_approved_knight_e2e.py` | PASS |
| 1.3.3 | `browser_s15_approved_pin_e2e.py` | PASS |
| 1.3.3 | `browser_s15_scale_mystic_e2e.py` | PASS |
| 1.3.3 | `browser_s15_normal_e2e.py` | PASS |
| 1.3.3 | `browser_s15_play_guard_e2e.py` | PASS |
| 1.3.3 | `browser_s15_continued_three_e2e.py` | PASS |
| 1.3.3 | `browser_s15_normal_guard_e2e.py` | PASS |
| 1.3.3 | `browser_s15_normal_rescue_e2e.py` | PASS |
| 1.3.3 | `browser_s15_normal_guard_rescue_e2e.py` | PASS |
| 1.3.3 | `browser_s15_growth_dog_thief_e2e.py` | PASS |
| 1.3.3 | `browser_s15_deep_normal_knight_snow_e2e.py` | PASS |
| 1.3.3 | `browser_s15_deep_engineer_e2e.py` | PASS |
| 1.3.3 | `browser_s15_deep_medium_e2e.py` | PASS |
| 1.3.3 | `browser_s15_breakthrough_medium_e2e.py` | PASS |
| 1.3.3+qa-bb | `browser_s15_bb_live_pack_e2e.py` | PASS |
| 1.3.3+qa-bb | `browser_s15_bb_conversion_e2e.py` | PASS |
| 1.3.3+qa-bb | `browser_s15_bb_mixed_e2e.py` | PASS |
| 1.3.3 | `browser_s15_mage_target_e2e.py` | PASS |
| 1.3.3 | `browser_s17_soul_e2e.py` | PASS |
| 1.3.3+qa-bb | `browser_s17_trap_revival_e2e.py` | PASS |
| 1.3.3 | `browser_s18_soul_second_death_e2e.py` | PASS |

## Playable C per deck

| Deck | Fresh | Missing browser/tests |
|---|---|---|
| [8, 25] | PASS | None |
| [8, 74] | PASS | None |
| [8, 25, 74] | PASS | None |
| [8, 9] | PASS | None |
| [25, 31, 48, 74] | PASS | None |
| [25, 31, 48, 74, 87] | PASS | None |
| [9, 25, 48, 74, 87] | PASS | None |

## Gameplay certificate closure

#23 S19 new test uses existing server rules and bounded QA deck [8,23,25,36]: self shield absorbs mage fire; first death by hanging; secret revival next night with two ammo; restart; final death through existing bounded #8 blind attack; no duplicate public death; replay. This is additional interaction evidence, **not a new gameplay implementation**. No change to source-approved targeting domain or ammunition rules. #23 remains PARTIAL (wrong-faction shot and finite cost, other attack/protection classes, third-shot prevention in ongoing match, death-ledger and projection). #36 and other candidates have incomplete contract classes (see `FULL_CLOSURE_REVIEW.md`). No new certificate issued. No Normal Gameplay deck promoted.

TRAP-04/05: preserve prior same-night and trap retained on revived target. Trapped revival actor remains unresolved. PACK-05: current membership-at-lock invariants retained, no new live membership transition. PACK-PRIVACY-01: global revision/timing, revoked-target oracle, post-resolution and third-party coverage unresolved. No new backend source for these blockers. See `DECISION_CARDS.md` for four new policy boundaries requiring owner approval before expansion. All 14 previously approved B/B decisions unchanged.

## Cumulative metrics (unchanged)

| Metric | Baseline | Current | Delta |
|---|---:|---:|---:|
| R | 52 | 52 | 0 |
| FULL | 1 | 1 | 0 |
| A | 49 | 49 | 0 |
| B | 37 | 37 | 0 |
| QA C | 2 | 2 | 0 |
| Playable C | 7 | 7 | 0 |
| Atomic PASS | 79 | 79 | 0 |
| Normal Gameplay | 12 | 12 | 0 |
| Fresh browser PASS | 22 | 23 | +1 |
| Fresh browser FAIL | 1 | 0 | -1 |
| Fresh backend PASS | 450 | 454 | +4 |

## Backend integrity and evidence

Historical tests missing: 0; changed historical results: 0. Four expected new tests: 2 adapter, 1 handoff, 1 #23 QA. Actual new test names: 4.

`backend-full.command`, `backend-full.log`, `backend-full.exit`, `acceptance.json`, `browser-results.json`, `certificate-revalidation.json`, `release-gates.json`, `COMPLETION_CONTRACT_DELTA.json`, `DECISION_CARDS.md`, `HUMAN_QA.md`, `FULL_CLOSURE_REVIEW.md` and all runner logs are included. No old source certificate erased. Browser admission uses existing runner with bridge; no backend full run concurrently with browser. `npm run verify:source`, `npm run build`, `npm run rules:build` passed in local Linux toolchain. Native Mac and PostgreSQL live are unverified. Human QA remains pending. Full release acceptance remains incomplete.

Official v1.3.4 is not approved for activation. No production GO. Delivery ZIP integrity and clean build are reported separately in the delivery verification file.
