#!/bin/bash
cd /tmp/wv34
export WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST=reports/v1.7.34/BROWSER_MANIFEST.json
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.34/browser-candidate browser_s23_mute_acl_e2e.py browser_s15_deep_jester_e2e.py browser_s14_gameplay_e2e.py > reports/v1.7.34/browser-candidate-run.log 2>&1
printf '%s\n' "$?" > reports/v1.7.34/browser-candidate.exit
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.34/browser-critical browser_s15_approved_village_e2e.py browser_s15_approved_revenge_e2e.py browser_s15_approved_knight_e2e.py browser_s15_approved_pin_e2e.py browser_s15_scale_mystic_e2e.py browser_s15_normal_e2e.py browser_s15_play_guard_e2e.py browser_s15_continued_three_e2e.py browser_s15_normal_guard_e2e.py browser_s15_normal_rescue_e2e.py browser_s15_normal_guard_rescue_e2e.py browser_s15_growth_dog_thief_e2e.py browser_s15_deep_normal_knight_snow_e2e.py browser_s15_deep_engineer_e2e.py browser_s15_deep_medium_e2e.py browser_s15_breakthrough_medium_e2e.py browser_s15_bb_mixed_e2e.py > reports/v1.7.34/browser-critical-run.log 2>&1
printf '%s\n' "$?" > reports/v1.7.34/browser-critical.exit
unset WV_E2E_DIRECT WV_BROWSER_MANIFEST WV_OWNER_DC_QA WV_OWNER_BB_LIVE_QA WV_REQUIRE_POSTGRES
printf '%s\n' 'WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs' > reports/v1.7.34/backend-full.command
WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs > reports/v1.7.34/backend-full.log 2>&1
printf '%s\n' "$?" > reports/v1.7.34/backend-full.exit
