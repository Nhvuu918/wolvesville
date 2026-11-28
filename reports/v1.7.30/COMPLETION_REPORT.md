# Wolvesville v1.7.30 — Owner Decision Integration & Gameplay Completion

**WIP / candidate QA engineering checkpoint. Active v1.3.3; proposed v1.3.4 CANDIDATE, NOT ACTIVE. Competitive Production NO-GO.**

Source fingerprint: `a4e3442df2161e9973fbd472fad22b8288f891862aa7a085f3376c22e59d9cac`. Input ZIP SHA-256: `8e55b2f00b0641ace6cbfb086695caf2102eeaa9a8ba1bc3925c299422e780e7`. Input payload 3879/3879 hashes match; 3022 historical report files unchanged. Source verification: 97 characters / 118 historical decisions / 207 legacy specs. Four new A records supplement the existing 14; no historical decision is replaced.

## Executive result

| Obligation | Fresh result |
|---|---|
| Owner-approved new decisions | 4/4 |
| Source-verified policies | 2/4; remaining 2 partial/design pending |
| New live runtime decisions | 2; live QA scoped backend + browser pass 2 |
| DC-SOUL-01 | Existing #8 QA scope explicitly allowlisted; no finite blind skill generalized |
| DC-SOUL-02 | New friendly fire: shared damage, shield, bullet, death ledger, QD-01, SQLite/replay; bounded QA |
| DC-TRAP-02 | New trapped-actor failure; shared NightActionGroup consumes trap once; no extra death; bounded QA |
| DC-PACK-KEEP | New state-level permanent revocation; not live-enabled; secret lock/wait oracle pending |
| Backend monolithic | PASS: 461 PASS / 0 FAIL / 11 SKIP; exit 0; 235.28 s |
| Browser Manifest | 26 PASS / 0 FAIL / 51 INCOMPLETE (77 suites) |
| Rule-version Matrix | 26 PASS / 0 FAIL / 86 INCOMPLETE (112 obligations) |
| Fresh FULL / QA C / Playable C / Atomic | 1/1, 2/2, 7/7, 79/79 |
| New certificates | 0 |
| Privacy release / Human QA / PostgreSQL | PARTIAL / PENDING / PENDING |

## Provenance and code

See `OWNER_CONFIRMATION.md`, `OWNER_DIRECTIVE.md`, `data/rules/owner_dc_decisions_20261125.json`, `data/rules/owner_v1_3_4_effective_registry_preview_dc.json` and `OWNER_DECISION_ACCEPTANCE_MATRIX.md`. No direct conflict found within bounded source review. Original #23 text describes killing wolves and third factions as a goal, not an explicit same-faction damage immunity. VH73/VH76 override the older #26 village-only description; BB-04 rescue/protection does not imply synthetic death on a failed revival of an already dead player. NV26 records secret revival; VH82 overrides its old population-count response.

`backend/src/experimental/owner-dc-policy.ts` binds an immutable QA marker to newly created existing soul/trap QA decks only, non-production and opt-in. Old games and normal decks are not migrated. `s13-mechanics.ts` removes team filter only for new QA #23. `revival.ts` records consumed revival and failure without pending revival. `engine/service.ts` admits the supported trap class and records it in existing NightActionGroup. `soul-shooter.ts` declares explicit #8 blind scope. `pack.ts` records revoked selection revisions and requires fresh replacement, but no new live pack binding. `visibility.ts` and `coordinator.ts` redact event/replay/action metadata for candidate QA. Global revision/timing and post-resolution privacy remain open.

## New tests (focused and current regression)

Focused: seven tests PASS. Initial focused attempt had one wrong expected winner set; QD-01 explicitly includes dead current village teammates. The expectation was corrected to include dead #25; engine and rule unchanged. Initial FAIL log retained in `focused-initial.log`.

- PASS: S20 DC-PACK-KEEP: blinded own receipt is unchanged when target becomes secretly invalid (before lock only)
- PASS: S20 DC-PACK-KEEP: revoked latest selection stays revoked through blank, restored eligibility and restart; explicit replacement only
- PASS: S20 DC-SOUL-01: designated #8 blind attempt on dead seat consumes nightly slot; no extra death, finite fire still restricted
- PASS: S20 DC-SOUL-02: friendly kill then enemy kill, victory after second shot; legacy policy remains pinned
- PASS: S20 DC-SOUL-02: friendly shot spends one bullet, shield blocks, unshielded villager dies, retry and restart
- PASS: S20 DC-TRAP-02: same-night placement precedes accepted revival; no duplicate death or revival
- PASS: S20 DC-TRAP-02: trapped medium fails revival, consumes mark and use once; invalid action and restart

## Browser evidence (current source only)

| Ruleset or QA policy | Suite | Result | Exit |
|---|---|---|---|
| 1.3.3 | `browser_s15_approved_village_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_approved_revenge_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_approved_knight_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_approved_pin_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_scale_mystic_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_normal_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_play_guard_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_continued_three_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_normal_guard_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_normal_rescue_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_normal_guard_rescue_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_growth_dog_thief_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_deep_normal_knight_snow_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_deep_engineer_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_deep_medium_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_breakthrough_medium_e2e.py` | PASS | 0 |
| 1.3.3+qa-bb | `browser_s15_bb_live_pack_e2e.py` | PASS | 0 |
| 1.3.3+qa-bb | `browser_s15_bb_cross_window_e2e.py` | PASS | 0 |
| 1.3.3+qa-bb | `browser_s15_bb_conversion_e2e.py` | PASS | 0 |
| 1.3.3+qa-bb | `browser_s15_bb_mixed_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s15_mage_target_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s17_soul_e2e.py` | PASS | 0 |
| 1.3.3+qa-bb | `browser_s17_trap_revival_e2e.py` | PASS | 0 |
| 1.3.3 | `browser_s18_soul_second_death_e2e.py` | PASS | 0 |
| 1.3.3+qa-dc | `browser_s20_owner_soul_e2e.py` | PASS | 0 |
| 1.3.3+qa-dc-bb | `browser_s20_owner_trap_e2e.py` | PASS | 0 |

No inherited browser PASS counted as current. 75 old suites and 110 old obligations retained; two new owner-specific suites/obligations. See `browser-results.json`, runner matrices and logs; a matrix exit 1 can reflect unselected INCOMPLETE obligations. No timeout/assertions weakened.

## Metric scorecard

| Metric | Baseline | Current cumulative | Delta |
|---|---:|---:|---:|
| R | 52 | 52 | 0 |
| F | 1 | 1 | 0 |
| A | 49 | 49 | 0 |
| B | 37 | 37 | 0 |
| QA C | 2 | 2 | 0 |
| Playable C | 7 | 7 | 0 |
| Atomic PASS | 79 | 79 | 0 |
| Normal Gameplay | 12 | 12 | 0 |

No new FULL certificate; see `FULL_CLOSURE_REVIEW.md`. New narrow QA runtime does not change Normal Gameplay. Historical certificates retained. `certificate-revalidation.json` computes current-source evidence; `release-gates.json` preserves all release obligations.

## Remaining blockers and disclosure

- SHARED-23: broader target authorization, finite blind skills, wolf/other protection and death-chain classes, full privacy/replay/browser scope. FULL-36 depends on wider interactions.
- TRAP-04/TRAP-05: new trapped actor case proven in existing QA deck; all-faction revival, other mandatory classes, multi-window and complex death chains not complete.
- PACK-05 and PACK-PRIVACY-01: candidate revocation core proven by two state-level tests; before-lock blinded own receipt equal, but secret invalidity changes lock/wait outcome. No live activation; no state fixture represented as live browser PASS.
- Global revision/timing and post-resolution privacy, full browser debt, Human QA, PostgreSQL live, release activation path remain incomplete. No candidate promotion or release authority.
- No native Mac installation/acceptance tested in this Linux environment. Local QA marker is opt-in and not release approval.

## Run and verify

`npm run test:20:new` for focused tests. Use README and HUMAN_QA.md. `python3 reports/v1.7.30/build_acceptance.py --verify` reproduces evidence-derived scorecard from packaged logs; `python3 reports/v1.7.30/verify_delivery.py` verifies payload hashes. See external Delivery_Verification.txt for final ZIP checksum and clean-extraction build.
