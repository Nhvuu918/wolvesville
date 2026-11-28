#!/bin/bash
cd "$(dirname "$0")/../.."
r=reports/s15-privacy-stability
export WV_BROWSER_MANIFEST=reports/BB_PRIVACY_STABILITY_BROWSER_MANIFEST.json
while [ ! -f "$r/backend-full.exit" ]; do sleep 2; done
mkdir -p "$r/controlled-final-parallel"
for pair in 'rescue browser_s15_normal_rescue_e2e.py' 'guard browser_s15_normal_guard_rescue_e2e.py'; do
 read -r n s <<< "$pair"
 (WV_BROWSER_SCHEDULER=parallel-diagnostic node scripts/run-browser-s06.mjs "$s" > "$r/controlled-final-parallel/$n.log" 2>&1; echo $? > "$r/controlled-final-parallel/$n.exit") &
done
wait
# Primary scheduled acceptance. Both shard processes launched concurrently, admission
# serializes resource-intensive scenarios. No retries or deadline changes.
run(){ local n=$1; shift; node scripts/s15-bb-official-browser-matrix.mjs "$r/browser-$n" "$@" > "$r/$n-runner.log" 2>&1; echo $? > "$r/$n-runner.exit"; }
run five-rescue browser_s15_normal_rescue_e2e.py & a=$!
run five-guard browser_s15_normal_guard_rescue_e2e.py & b=$!
wait "$a" "$b"
# Primary required certificates and mixed QA, then additional obligations.
run critical browser_s15_approved_revenge_e2e.py browser_s15_approved_pin_e2e.py browser_s15_normal_e2e.py browser_s15_continued_three_e2e.py browser_s15_deep_normal_knight_snow_e2e.py browser_s15_normal_guard_e2e.py browser_s15_approved_village_e2e.py browser_s15_approved_knight_e2e.py browser_s15_scale_mystic_e2e.py browser_s15_deep_medium_e2e.py browser_s15_deep_engineer_e2e.py browser_s15_scale_bell_e2e.py browser_s15_play_guard_e2e.py browser_s15_growth_dog_thief_e2e.py & a=$!
run bb browser_s15_bb_live_pack_e2e.py browser_s15_bb_live_trap_e2e.py browser_s15_bb_live_guard_e2e.py browser_s15_bb_live_witch_e2e.py browser_s15_bb_live_retaliation_e2e.py browser_s15_bb_cross_window_e2e.py browser_s15_bb_conversion_e2e.py browser_s15_bb_mixed_e2e.py browser_s15_mage_target_e2e.py & b=$!
wait "$a" "$b"
if [ ! -e "$r/STOP_ALL" ]; then
 run legacy browser_s12_attack_e2e.py browser_s11_voting_e2e.py browser_s11_seer_e2e.py browser_s10_gameplay_e2e.py browser_s15_deep_redirect_e2e.py browser_s15_final_pack_e2e.py browser_s15_scale_rescue_e2e.py browser_s15_breakthrough_medium_e2e.py browser_s15_deep_normal_leader_e2e.py browser_s15_deep_normal_leader_snow_e2e.py browser_s15_deep_normal_knight_snow_aura_e2e.py browser_s15_deep_normal_knight_snow_role_e2e.py browser_s15_deep_normal_knight_snow_dual_e2e.py & c=$!
 wait "$c"
fi
echo COMPLETE > "$r/browser-orchestration.done"
