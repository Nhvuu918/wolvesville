#!/bin/bash
cd "$(dirname "$0")/../.."
r=reports/s15-privacy-stability
while [ ! -f "$r/critical-runner.exit" ] || [ ! -f "$r/bb-runner.exit" ];do sleep 2; done
if [ -f "$r/STOP_ALL" ];then exit 0;fi
export WV_BROWSER_MANIFEST=reports/BB_PRIVACY_STABILITY_BROWSER_MANIFEST.json
suites=(browser_s15_protection_e2e.py browser_s15_guard_shot_e2e.py browser_s15_accelerated_witch_e2e.py browser_s15_deep_rescue_e2e.py browser_s15_break_exile_e2e.py browser_s15_accelerated_exile_e2e.py browser_s15_final_hunter_e2e.py browser_s15_closure_snow_e2e.py browser_s15_voting_information_e2e.py browser_s14_transport_regression.py browser_s15_deep_pair_e2e.py browser_s15_aura_expansion_e2e.py)
for n in 1 2;do
 (node scripts/s15-bb-official-browser-matrix.mjs "$r/browser-extra-$n" "${suites[@]}" --shard=$n/2 > "$r/extra-$n-runner.log" 2>&1; echo $? > "$r/extra-$n-runner.exit") &
done
wait
echo COMPLETE > "$r/extra-orchestration.done"
