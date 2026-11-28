# Sprint 15 Deep Completion — QA

Version `1.7.5-s15-deep-wip`. Backend 267 PASS / 0 FAIL / 11 SKIPPED, clean exit 0. Metrics 103/103 pass, clean exit 0. Source integrity/build/rules clean exit 0. 11 new integration cases.

Browser manifest: 29; {'PASS': 29, 'FAIL': 0, 'UNCLEAN': 0, 'INCOMPLETE': 0, 'NOT_RUN': 0}. Each run has separate SQLite; strict runner rejects cleanup errors.

| Suite | Status | Exit | Log |
|---|---|---:|---|
| `browser_s12_attack_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s12_attack_e2e.py.log` |
| `browser_s11_voting_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s11_voting_e2e.py.log` |
| `browser_s11_seer_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s11_seer_e2e.py.log` |
| `browser_s10_gameplay_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s10_gameplay_e2e.py.log` |
| `browser_s09_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s09_e2e.py.log` |
| `browser_s08_gameplay_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s08_gameplay_e2e.py.log` |
| `browser_s07_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s07_e2e.py.log` |
| `browser_s06_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s06_e2e.py.log` |
| `browser_s05_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s05_e2e.py.log` |
| `browser_lobby_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_lobby_e2e.py.log` |
| `browser_codex_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_codex_e2e.py.log` |
| `browser_demo_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_demo_e2e.py.log` |
| `browser_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_e2e.py.log` |
| `browser_ux_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_ux_e2e.py.log` |
| `browser_s13_skills_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s13_skills_e2e.py.log` |
| `browser_s14_gameplay_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s14_gameplay_e2e.py.log` |
| `browser_s14_transport_regression.py` | PASS | 0 | `reports/s15-deep/browser/browser_s14_transport_regression.py.log` |
| `browser_s15_protection_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_protection_e2e.py.log` |
| `browser_s15_voting_information_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_voting_information_e2e.py.log` |
| `browser_s15_gameplay_ux_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_gameplay_ux_e2e.py.log` |
| `browser_s15_aura_expansion_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_aura_expansion_e2e.py.log` |
| `browser_s15_guard_shot_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_guard_shot_e2e.py.log` |
| `browser_s15_accelerated_witch_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_accelerated_witch_e2e.py.log` |
| `browser_s15_accelerated_exile_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_accelerated_exile_e2e.py.log` |
| `browser_s15_accelerated_combat_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_accelerated_combat_e2e.py.log` |
| `browser_s15_deep_rescue_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_deep_rescue_e2e.py.log` |
| `browser_s15_deep_redirect_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_deep_redirect_e2e.py.log` |
| `browser_s15_deep_pair_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_deep_pair_e2e.py.log` |
| `browser_s15_deep_jester_e2e.py` | PASS | 0 | `reports/s15-deep/browser/browser_s15_deep_jester_e2e.py.log` |

Clean candidate browser spot checks: browser_s15_deep_rescue_e2e.py=PASS/0, browser_s14_transport_regression.py=PASS/0.

Payload SHA-256: 343 files identical to tested clean candidate, including final report-only script correction. Original 1342 baseline paths retained; immutable files compared byte-for-byte.

F=0 and C=0 remain: actual hanging immunity and village-only terminal branch unresolved. No global atomic skill denominator. PostgreSQL live pending. Competitive NO-GO. No new animation assets.
