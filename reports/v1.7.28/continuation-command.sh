#!/bin/bash
cd /tmp/wv28
while [ ! -f reports/v1.7.28/browser.exit ]; do sleep 3; done
export WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST=reports/v1.7.28/BROWSER_MANIFEST.json
node scripts/s15-bb-official-browser-matrix.mjs reports/v1.7.28/browser-atomic browser_s15_play_guard_e2e.py browser_s15_growth_dog_thief_e2e.py browser_s15_deep_engineer_e2e.py browser_s15_deep_medium_e2e.py browser_s15_breakthrough_medium_e2e.py browser_s15_mage_target_e2e.py browser_s15_bb_mixed_e2e.py browser_s15_bb_conversion_e2e.py > reports/v1.7.28/browser-atomic-run.log 2>&1
echo $? > reports/v1.7.28/browser-atomic.exit
# backend monolithic only after browser runner ended
unset WV_E2E_DIRECT WV_BROWSER_MANIFEST WV_ARCHIVED_RULE_REGRESSION WV_OWNER_BB_LIVE_QA WV_REQUIRE_POSTGRES
printf '%s\n' 'node --test tests/*.test.mjs' > reports/v1.7.28/backend-full.command
node --test tests/*.test.mjs > reports/v1.7.28/backend-full.log 2>&1
echo $? > reports/v1.7.28/backend-full.exit
