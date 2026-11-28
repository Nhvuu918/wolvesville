#!/bin/bash
cd /tmp/wv28
export WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST=reports/v1.7.28/BROWSER_MANIFEST.json
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.28/browser browser_s15_approved_village_e2e.py browser_s15_approved_knight_e2e.py browser_s15_scale_mystic_e2e.py browser_s15_approved_pin_e2e.py browser_s15_approved_revenge_e2e.py browser_s15_normal_e2e.py browser_s15_continued_three_e2e.py browser_s15_deep_normal_knight_snow_e2e.py browser_s15_normal_guard_e2e.py browser_s15_normal_guard_rescue_e2e.py browser_s15_normal_rescue_e2e.py browser_s17_soul_e2e.py browser_s18_soul_second_death_e2e.py browser_s17_trap_revival_e2e.py browser_s15_bb_live_pack_e2e.py > reports/v1.7.28/browser-run.log 2>&1
echo $? > reports/v1.7.28/browser.exit
