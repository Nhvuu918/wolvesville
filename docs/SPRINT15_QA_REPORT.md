# Sprint 15 QA — WIP

Clean candidate extraction: source integrity/build/rules PASS; full backend 235 PASS, 0 FAIL, 11 skipped, exit 0 (246 cases). New integration 8/8 PASS. Metrics re-run exit 0: R=31 F=0 A=8 B=6 C=0. PostgreSQL live PENDING. No full certification.

Tested code/data/config payload: 322 SHA256 entries. Inherited files and tests preserved; historical screenshot paths restored, new captures retained separately.

| Browser suite | Exit | Status | Evidence scope |
|---|---:|---|---|
| browser_s12_attack_e2e.py | 0 | CLEANUP_WARNING | workspace same implementation |
| browser_s11_voting_e2e.py | 0 | PASS | workspace same implementation |
| browser_s11_seer_e2e.py | 0 | PASS | workspace same implementation |
| browser_s10_gameplay_e2e.py | 0 | PASS | workspace same implementation |
| browser_s09_e2e.py | 0 | PASS | workspace same implementation |
| browser_s08_gameplay_e2e.py | 0 | PASS | workspace same implementation |
| browser_s07_e2e.py | 0 | CLEANUP_WARNING | workspace same implementation |
| browser_s06_e2e.py | 0 | PASS | workspace same implementation |
| browser_s05_e2e.py | 0 | PASS | workspace same implementation |
| browser_lobby_e2e.py | 0 | PASS | workspace same implementation |
| browser_codex_e2e.py | 0 | PASS | workspace same implementation |
| browser_demo_e2e.py | 0 | PASS | workspace same implementation |
| browser_e2e.py | 0 | PASS | workspace same implementation |
| browser_ux_e2e.py | 0 | PASS | workspace same implementation |
| browser_s13_skills_e2e.py | 0 | PASS | workspace same implementation |
| browser_s14_gameplay_e2e.py | 0 | PASS | workspace same implementation |
| browser_s14_transport_regression.py | 0 | PASS | clean extraction |
| browser_s15_protection_e2e.py | 1 | FAIL | clean extraction |
| browser_s15_voting_information_e2e.py | 1 | FAIL | clean extraction |

Cleanup warnings are not accepted as clean browser passes even with exit 0. Previous protection runner timeout retained in reports/s15-qa. Initial backend UX assertion failure fixed in authorized feedback context (inherited test unchanged); initial metrics TAP escaping error fixed in metrics parser. Historical S14 recovery reports retained, not new QA. No native macOS or PostgreSQL live certification.

Remaining implementation: #11 upgrade, #17 blessing, #23 secret revival, #24 anonymous chat/execution, #52 wolf dog, #65 delayed poison, #72 aura, #78 new moon; #87 healing, #54 shot, #66 broader protection sources. These are implementation/dependency gaps, not all missing rules. All roles remain partial. Global S denominator unverified.
