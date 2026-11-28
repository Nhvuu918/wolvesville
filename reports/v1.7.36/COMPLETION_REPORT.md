# Wolvesville v1.7.36 — Core Engine Rescue

**WIP — P0 PASS; F=1/97; #35 bounded Normal Gameplay VERIFIED.**

Source fingerprint: `0edd9aa78cd86efb60bfc56fc22417699ce2b956cfcf0d9a00a17fe9654f8447`

Active ruleset v1.3.3, candidate v1.3.4 inactive. Competitive NO-GO; privacy PARTIAL; PostgreSQL/Human QA PENDING; native Mac untested.

## Scorecard

|Metric|v1.7.35|v1.7.36|Delta|
|---|---:|---:|---:|
|F|1|1|+0|
|R|52|53|+1|
|A|49|50|+1|
|B|37|38|+1|
|QA C|2|2|+0|
|Playable C|7|7|+0|
|Atomic PASS|79|79|+0|
|Normal Gameplay|12|13|+1|
|Backend PASS|473|476|+3|
|Backend FAIL|1|0|-1|
|Backend SKIP|11|11|+0|
|Browser PASS|23|27|+4|
|Browser FAIL|0|0|+0|
|Browser INCOMPLETE|61|58|-3|
|Rule-version PASS|25|30|+5|
|Rule-version INCOMPLETE|94|90|-4|

## P0 and regression

Monolithic `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs` — exit 0, 487 tests, 170984.498022 ms. S25 active-only fixture explicitly clears archive env per test worker; original checks preserved; runtime active-only gate unchanged. Focused: 7 PASS. Inherited statuses changed: ['S25 cult grant boundary: Q13-08 and wolf rejection before group mutation']; new tests: ['S26 cult grant: five living followers, duplicate and pre-mutation capacity boundary', 'S26 normal mirror: private reflection, guard, second scan, both victory routes, restart and replay']; missing inherited tests: [].

## Certificate revalidation

Fresh FULL 1/1; QA C 2/2; Playable C 7/7; Atomic 79/79. Historical certs preserved. No FULL certificate issued. No change to atomic denominator.

## Browser debt

Suite count 85; rule-version obligations 120. Runs and actual exit codes are in browser-results.json. Matrix exits 1 for incomplete inventory; individual runs distinguished by exit code and PASS marker.

- existingIncompleteToPass: 3 — browser_s15_aura_expansion_e2e.py, browser_s15_break_swap_e2e.py, browser_s22_dual_swap_e2e.py
- existingFailToPass: 0 — none
- existingPassRevalidated: 23 — browser_s14_gameplay_e2e.py, browser_s15_deep_jester_e2e.py, browser_s15_approved_village_e2e.py, browser_s15_approved_revenge_e2e.py, browser_s15_approved_knight_e2e.py, browser_s15_approved_pin_e2e.py, browser_s15_scale_mystic_e2e.py, browser_s15_normal_e2e.py, browser_s15_play_guard_e2e.py, browser_s15_continued_three_e2e.py, browser_s15_normal_guard_e2e.py, browser_s15_normal_rescue_e2e.py, browser_s15_normal_guard_rescue_e2e.py, browser_s15_growth_dog_thief_e2e.py, browser_s15_deep_normal_knight_snow_e2e.py, browser_s15_deep_engineer_e2e.py, browser_s15_deep_medium_e2e.py, browser_s15_breakthrough_medium_e2e.py, browser_s15_bb_mixed_e2e.py, browser_s23_mute_acl_e2e.py, browser_s24_group_transport_e2e.py, browser_s25_visual_e2e.py, browser_s25_themes_e2e.py
- existingPassNotRevalidated: 0 — none
- newPass: 1 — browser_s26_mirror_normal_e2e.py
- newIncomplete: 0 — none

## Gameplay and scope

PRIMARY #25 / SECONDARY #74. New real one-wolf normal [25,31,35,74], shared bite, guard, memory of actual bite victim, #25 second committed aura scan, exact-role #74, private projection, restart and replay, both victory routes. No unrestricted multiwolf, transformation, compound inspection or role-wide FULL. Read FULL_CONTRACT_CLOSURE.md for code path and missing obligations. #90 living-cap guard only; not recruitment, sacrifice or death chain. #79 Q13-09 runtime remains unimplemented; no new owner ruling needed for that rule. Owner Decision Pack has 7 PENDING proposed decisions. 18 approved choices unchanged.

## Visual evidence

Nine actual current screenshots from sequential browser S26. Historical/current banner crops are distinct match configurations. Fixed mobile banner wrap, light-theme seat name contrast (12 samples), terminal pending receipt. Toast overlap, scroll, broader HUD, full accessibility, full role reveal and replay UX remain pending. No graphical asset replacements or redesign. See screenshots/S26_SCREENSHOT_MANIFEST.json and VISUAL_ACCEPTANCE_REPORT.html.

## Known process and scope limitations

First browser diagnosis failed because of theme transition contrast; corrected CSS. Accidental temporary nonmirror sourceRule changes restored before final fingerprint. A diagnostic supervisor was not fully stopped and overlapped browser; terminated and archived all overlap logs, not used as fresh evidence. Final monolithic and browser run sequentially; exact commands in sequential-regression.sh and browser-suite-selection.txt. Browser bridge forwards to real local backend because direct loopback browser access is blocked. No test deadlines or assertions weakened. No network install or native Mac acceptance. No FULL breakthrough.

## Delivery checks

Package manifest contains per-file SHA-256. Run verify_delivery.py on ZIP and clean extraction. Build and rules build from clean extraction with existing toolchain. External delivery verification reports actual checks performed. All historical rules/decisions/reports preserved. No runtime DB, node_modules or real .env.
