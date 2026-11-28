# Sprint 15 Scale-Up QA — WIP

Backend: 321 PASS / 0 FAIL / 11 SKIPPED, exit 0. Clean extracted candidate. Application and test payload unchanged after the run; metadata/registry audit and evidence runner updated separately.

| Browser scope | Required | PASS | FAIL | INCOMPLETE |
|---|---:|---:|---:|---:|
| Archived 1.3.2 | 38 | 34 | 2 | 2 |
| Current environment 1.3.3 | 44 | 30 | 2 | 12 |
| Combined inherited manifest | 44 | 40 | 2 | 2 |
| Combined all unique suites | 47 | 43 | 2 | 2 |

Only completed runner exit 0 + PASS marker without cleanup error is certified. Incomplete jobs stopped at delivery; no background completion promised. Fixture-only suites may not create an official 1.3.3 match. Full log and exact version/status for every manifest item in reports/S15_SCALEUP_ACCEPTANCE.json.

New integration: 9/9 PASS. Metrics: R49 F1 A43 B35 QA C2 Playable C0, S49/63 on 30 roles. Role #28 acceptance re-executed; no extra FULL. All official starts remain QA-gated. PostgreSQL 11 SKIPPED; production NO-GO.

## Non-PASS browser evidence
- 1.3.3 browser_s12_attack_e2e.py: FAIL (cleanup exception); reports/s15-scale/current-browser_s12_attack_e2e.log
- 1.3.3 browser_s10_gameplay_e2e.py: FAIL (cleanup exception); reports/s15-scale/current-browser_s10_gameplay_e2e.log
- 1.3.3 browser_s15_voting_information_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_voting_information_e2e.log
- 1.3.3 browser_s15_accelerated_exile_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_accelerated_exile_e2e.log
- 1.3.3 browser_s15_accelerated_combat_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_accelerated_combat_e2e.log
- 1.3.3 browser_s15_deep_rescue_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_deep_rescue_e2e.log
- 1.3.2 browser_s15_deep_redirect_e2e.py: FAIL (cleanup exception); reports/s15-scale/archived-browser_s15_deep_redirect_e2e.log
- 1.3.3 browser_s15_deep_redirect_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_deep_redirect_e2e.log
- 1.3.3 browser_s15_deep_pair_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_deep_pair_e2e.log
- 1.3.3 browser_s15_deep_jester_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_deep_jester_e2e.log
- 1.3.3 browser_s15_break_stone_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_break_stone_e2e.log
- 1.3.3 browser_s15_break_exile_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_break_exile_e2e.log
- 1.3.3 browser_s15_break_contract_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_break_contract_e2e.log
- 1.3.3 browser_s15_final_hunter_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_final_hunter_e2e.log
- 1.3.2 browser_s15_final_pack_e2e.py: FAIL (cleanup exception); reports/s15-scale/archived-browser_s15_final_pack_e2e.log
- 1.3.2 browser_s15_closure_snow_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/archived-browser_s15_closure_snow_e2e.log
- 1.3.3 browser_s15_closure_snow_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/current-browser_s15_closure_snow_e2e.log
- 1.3.2 browser_s15_closure_revenge_e2e.py: INCOMPLETE (no completed runner result); reports/s15-scale/archived-browser_s15_closure_revenge_e2e.log
