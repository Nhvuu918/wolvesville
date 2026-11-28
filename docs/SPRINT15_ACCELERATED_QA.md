# Sprint 15 Accelerated QA — v1.7.4 WIP

## Backend and metrics
- Baseline ZIP: 1221 files, CRC PASS, 243 PASS / 0 FAIL / 11 SKIPPED.
- Clean candidate: Source Integrity, TypeScript Build, Rules Build PASS, 267 tests: 256 PASS / 0 FAIL / 11 PostgreSQL SKIPPED, exit 0.
- 13 new integration tests PASS. Metrics clean candidate: 55/55 PASS exit 0. R=42, F=0, A/B/C=17/13/0. S=18 identified S15 adapter/passive branches, 21 outcome variants; overall denominator uncertified.
- All application, data and backend test files are byte-identical to clean-tested candidate; final differences are browser runner strict diagnostic gate and S11/S14 browser contract alignment. See tested payload manifest.
- PostgreSQL live PENDING, competitive NO-GO.

## Browser
25 manifest suites. Current strict runner rejects known unclean runtime warnings even if exit 0. Voting & Information aggregate timeout was traced to a blocked HTTP callback during reveal; no proof of a universal root cause. Three cases isolated with unchanged assertions, same 65-second per-process deadline. Async HTTP bridge experiment was rejected after TargetClosedError; original recovery bridge restored byte-identically. S11 wait selector targeted a hidden chat unread button; now waits for the exact visible Phiếu trắng vote button, waits for committed ballot AND pending=false before selecting a new target, and asserts selectedTarget before click; no gameplay assertions deleted. S14 legacy hidden-composer assertion updated to the owner-approved S15 visible-but-disabled composer contract (both input and send disabled); existing backend mute/reconnect/privacy assertions retained. Prior failed/partial logs retained. Earlier same-gameplay PASS evidence is not final runner certification.

| Suite | Strict current | Exit | Earlier same-gameplay clean log |
|---|---|---:|---|
| browser_s12_attack_e2e.py | PASS | 0 | — |
| browser_s11_voting_e2e.py | PASS | 0 | — |
| browser_s11_seer_e2e.py | PASS | 0 | PASS |
| browser_s10_gameplay_e2e.py | PASS | 0 | — |
| browser_s09_e2e.py | PASS | 0 | — |
| browser_s08_gameplay_e2e.py | PASS | 0 | — |
| browser_s07_e2e.py | PASS | 0 | — |
| browser_s06_e2e.py | PASS | 0 | — |
| browser_s05_e2e.py | PASS | 0 | — |
| browser_lobby_e2e.py | PASS | 0 | — |
| browser_codex_e2e.py | PASS | 0 | — |
| browser_demo_e2e.py | PASS | 0 | — |
| browser_e2e.py | PASS | 0 | — |
| browser_ux_e2e.py | PASS | 0 | — |
| browser_s13_skills_e2e.py | PASS | 0 | — |
| browser_s14_gameplay_e2e.py | PASS | 0 | — |
| browser_s14_transport_regression.py | PASS | 0 | PASS |
| browser_s15_protection_e2e.py | PASS | 0 | — |
| browser_s15_voting_information_e2e.py | PASS | 0 | — |
| browser_s15_gameplay_ux_e2e.py | PASS | 0 | — |
| browser_s15_aura_expansion_e2e.py | PASS | 0 | — |
| browser_s15_guard_shot_e2e.py | PASS | 0 | — |
| browser_s15_accelerated_witch_e2e.py | PASS | 0 | PASS |
| browser_s15_accelerated_exile_e2e.py | PASS | 0 | PASS |
| browser_s15_accelerated_combat_e2e.py | PASS | 0 | PASS |

Strict runner counts: {'PASS': 25, 'FAIL': 0, 'UNCLEAN': 0, 'INCOMPLETE': 0, 'NOT_RUN': 0}. Earlier additional same-gameplay clean PASS: 0. Browser acceptance: PASS_INDIVIDUAL_SUITES_QA_BRIDGE. No pending process result is treated as PASS.

## Scope blockers
F/C remain zero: no general wolf team attack/victory, no complete preliminary death/rescue or arbitrary multi-layer protection/death interactions. See rule derivations/backlog and 97-role matrix. No rule or data changed just to satisfy metrics.
