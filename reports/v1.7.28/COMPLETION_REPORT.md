# Wolvesville v1.7.28 — Gameplay Closure & Browser Recovery (WIP)

## Executive results
- Backend monolithic: 450 PASS / 0 FAIL / 11 SKIP; exit 0; completion PASS; focused 6/6 PASS.
- Browser suites: 22 PASS / 1 FAIL / 52 INCOMPLETE of 75; matrix 22 / 1 / 87 of 110. Historical inventory retained; added one S18 suite and one obligation.
- Fresh certificate revalidation: FULL 1/1; QA C 2/2; Playable C 5/7; Atomic 79/79. No new certificates.
- Source fingerprint `1a1d7bfc38d8e6184fb5ca56a5f69a64f62f4597642d13511f1a50965dcfd874`; inherited ZIP SHA256 `ac25116a25d7f9c4678e70f1f97cb36cc2be184014ad0edd4f763c444a58df60`; 2902/2902 historical report files byte-preserved; all 3758 inherited paths retained.
- 97 Character IDs, 118 historical decisions, 207 inherited specs and 14 approved B/B decisions retained. Official 1.3.3 ACTIVE, 1.3.4 CANDIDATE, production NO-GO; PostgreSQL/Human QA pending.

## Owner questions
1. QA C and Playable C: fresh counts above, calculated from current named backend tests and browser obligations, not old certificates.
2. Browser: exact final fingerprint above; PASS/FAIL/INCOMPLETE counts above. `browser-results.json` lists all runs, commands, durations, exits and logs. The one normal suite FAIL is a real handoff vote-selection timeout; no environment-only claim or weakened assertion. Four cases of that suite passed, but the suite remains FAIL.
3. SHARED-23: PARTIAL. QA [8,23,25,36] integrates first death, secret revival, two bullets, no vote, pending faction count, two already accepted lethal hits, victory before revival, restart/replay; now fresh #8 blind attack can kill secretly revived #23 with identical accepted attempt on final-dead target, no repeated public death. S18 HTTP/SQLite and browser PASS. #23 shot now uses actual faction rather than hardcoded role #8 within QA, but hostile-only target rejection can still expose faction. Wrong-faction shot resource/feedback policy, finite-resource blind attack, all target/defense/death-chain classes, no-third-shot while game continues, global revision/timing and post-resolution privacy are open. See decision cards.
4. FULL #36 and other new FULL: zero. Existing FULL #28 revalidation above. No promotion of QA-only game to normal gameplay.
5. TRAP-04/05: inherited same-night trap + inspection, trap persists on revival target and inverts later inspection PASS focused and browser. No new trap implementation in this version. Trapped revival actor effect is not source-resolved; complex classes and privacy remain open.
6. PACK-05/PACK-PRIVACY-01: PARTIAL, no new code in this version. Separate basic pack, conversion and mixed suite PASS; before/after-lock membership and revoked KEEP, timing/global revision, post-resolution privacy remain open. No new fallback, AFK or release-wide policy.
7. Official v1.3.4 CANDIDATE, no activation or release approval. Release matrix retains original gate inventory.
8. Human QA: new QA-SOUL-02, old QA-SOUL-01, QA-TRAP-REV-01, QA mixed pack; see HUMAN_QA.md. Local test flags only.
9. Full source archive `Wolvesville_v1.7.28_Gameplay_Closure_Full_Source.zip`; checksum in external delivery verification file; archive excludes actual .env, node_modules, runtime DB and build cache.

## Code changes
| Path | Implementation |
|---|---|
| backend/src/official/soul-shooter.ts | Narrow QA-only blind #8 intent predicate |
| backend/src/engine/validate.ts | Permit symmetric blind intent at validation and resolution |
| backend/src/official/solo-rules.ts | Truly dead target yields internal no-op; existing private final-death handling for revived #23 |
| backend/src/engine/service.ts, backend/src/official/capabilities.ts | Publicly symmetric #8 target list in bounded QA |
| backend/src/official/s13-mechanics.ts | #23 actual hostile faction predicate in same QA deck, not hardcoded role #8 |
| tests/sprint17-soul-lifecycle.test.mjs | One additional S18 game-session HTTP/SQLite test |
| tests/browser_s18_soul_second_death_e2e.py | Actual four-player browser journey |
| package.json, README.md, data/rule-intelligence/source_inventory.json | Version, run notes, derived inventory hash |

## Metrics (historical cumulative, not fresh revalidation)
R 52→52; F 1→1; A 49→49; B 37→37; QA C 2→2; Playable C 7→7; Atomic 79/108→79/108; Normal decks 12→12. No metric definitions changed. Delta zero.

## Browser run details
| Suite | Version | Status | Exit | Seconds |
|---|---|---|---|---|
| browser_s15_approved_village_e2e.py | 1.3.3 | PASS | 0 | 13.3 |
| browser_s15_approved_revenge_e2e.py | 1.3.3 | PASS | 0 | 19.7 |
| browser_s15_approved_knight_e2e.py | 1.3.3 | PASS | 0 | 12.6 |
| browser_s15_approved_pin_e2e.py | 1.3.3 | PASS | 0 | 19.8 |
| browser_s15_scale_mystic_e2e.py | 1.3.3 | PASS | 0 | 18.4 |
| browser_s15_normal_e2e.py | 1.3.3 | FAIL | 1 | 87.3 |
| browser_s15_play_guard_e2e.py | 1.3.3 | PASS | 0 | 18.5 |
| browser_s15_continued_three_e2e.py | 1.3.3 | PASS | 0 | 65.0 |
| browser_s15_normal_guard_e2e.py | 1.3.3 | PASS | 0 | 51.2 |
| browser_s15_normal_rescue_e2e.py | 1.3.3 | PASS | 0 | 58.9 |
| browser_s15_normal_guard_rescue_e2e.py | 1.3.3 | PASS | 0 | 57.7 |
| browser_s15_growth_dog_thief_e2e.py | 1.3.3 | PASS | 0 | 12.1 |
| browser_s15_deep_normal_knight_snow_e2e.py | 1.3.3 | PASS | 0 | 25.9 |
| browser_s15_deep_engineer_e2e.py | 1.3.3 | PASS | 0 | 20.2 |
| browser_s15_deep_medium_e2e.py | 1.3.3 | PASS | 0 | 22.9 |
| browser_s15_breakthrough_medium_e2e.py | 1.3.3 | PASS | 0 | 21.8 |
| browser_s15_bb_live_pack_e2e.py | 1.3.3+qa-bb | PASS | 0 | 30.2 |
| browser_s15_bb_conversion_e2e.py | 1.3.3+qa-bb | PASS | 0 | 20.0 |
| browser_s15_bb_mixed_e2e.py | 1.3.3+qa-bb | PASS | 0 | 33.2 |
| browser_s15_mage_target_e2e.py | 1.3.3 | PASS | 0 | 28.1 |
| browser_s17_soul_e2e.py | 1.3.3 | PASS | 0 | 24.0 |
| browser_s17_trap_revival_e2e.py | 1.3.3+qa-bb | PASS | 0 | 24.2 |
| browser_s18_soul_second_death_e2e.py | 1.3.3 | PASS | 0 | 23.4 |

## Certificate details
| Kind | Deck/role | Fresh result | Missing backend | Missing browser |
|---|---|---|---:|---|
| F | 28 | PASS | 0 | — |
| qaC | [8, 25] | PASS | 0 | — |
| qaC | [8, 74] | PASS | 0 | — |
| playableC | [8, 25] | INCOMPLETE | 0 | browser_s15_normal_e2e.py |
| playableC | [8, 74] | INCOMPLETE | 0 | browser_s15_normal_e2e.py |
| playableC | [8, 25, 74] | PASS | 0 | — |
| playableC | [8, 9] | PASS | 0 | — |
| playableC | [25, 31, 48, 74] | PASS | 0 | — |
| playableC | [25, 31, 48, 74, 87] | PASS | 0 | — |
| playableC | [9, 25, 48, 74, 87] | PASS | 0 | — |

## Limitations and decision disclosure
- New blind #8 attempt is a technical QA policy, not a general owner-approved gameplay rule. No changes to all other attacks, voting or Normal Gameplay eligibility. Cannot certify full #23 privacy while wrong-faction error and remaining-ammo oracle remain unresolved.
- No new trap/pack code; release blockers not closed. Full browser inventory remains incomplete and normal handoff FAIL is unresolved. No new FULL/C or normal certificate.
- Browser resource admission unchanged, no timeout/assertion changes; no backend monolithic concurrent with browser matrix. Individual browser exits shown; aggregate incomplete matrix exit 1 is expected.
- First backend invocation omitted WV_ARCHIVED_RULE_REGRESSION=1, violating the historical regression configuration. Three named legacy assertions failed; the wrong-mode run was stopped, its log/command/exit retained in backend-wrong-mode.*, and the complete documented archived regression was launched with unchanged source. Correct-mode outcomes are reported separately.
- Native Mac installation/acceptance and PostgreSQL Live not exercised. Human QA pending. ZIP clean-build uses installed toolchain, not a fresh network installation.
- See `DECISION_CARDS.md`, `HUMAN_QA.md`, `COMPLETION_CONTRACT_DELTA.json`, `release-gates.json`, `acceptance.json`, `browser-results.json`, `certificate-revalidation.json`, raw TAP and runner logs, and `build_acceptance.py --verify`.

Release: **WIP / PARTIAL GAMEPLAY CLOSURE — not an official release**.
