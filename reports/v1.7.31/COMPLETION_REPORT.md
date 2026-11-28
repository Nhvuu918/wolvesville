# Wolvesville v1.7.31 — bounded gameplay extension, privacy counterexample, regression recovery

Checkpoint: v1.7.30. Input SHA-256 `282306b772183752ba4761f830e2cc0193fa2922da26c28b4fd9b60a7f184027`; input ZIP CRC and 3947 payload hashes verified. All 3083 historical report files preserved byte-identically. 97 characters, 118 historical decisions, 207 legacy specs and 18 owner choices retained. Source fingerprint `365978e5a045721c62837c3a5854127aec663e224dc9e787d316caeb9c898ea2`. Official 1.3.3 remains active; 1.3.4 candidate, NOT ACTIVE, competitive NO-GO.

## Results
- PACK-KEEP: added S21 candidate revalidation on trusted snapshots, including latest choices of temporarily ineligible members. State-level two-target tests passed, including permanent revocation, KEEP, replacement and fixed representative. Secret lock/wait counterexample demonstrates unresolved noninterference. No live mixed activation. See PACK_PRIVACY_DECISION_CARD.md for the single new owner choice; no earlier choice re-opened.
- Primary FULL candidate #26: new live wolf revival path (same QA deck [8,10,25,26]), with immutable S21 policy scope. #8 can now kill #10 in that policy; #26 revives #10, retaining identity, faction, spent trap resource; #10 later uses remaining trap and dies again. Actual HTTP SQLite restart, duplicate command, closed death ledger, minimal authorized public revival and replay PASS; fresh four-client browser PASS. This extends BT-26-2 but does not certify all factions, exclusions or global interactions. No new FULL.
- SHARED-23: no new runtime implementation; source skill designation review and existing bounded revalidation only. Finite public-dead target rights remain SOURCE_SCOPE_PENDING. No wolf shot in current Soul deck. FULL-36 still PARTIAL.
- TRAP-05: extends revival of a wolf that already spent a trap use; old trapped actor / target paths preserved. Third-faction, exclusion, broader multi-window and complex death classes remain. PARTIAL.

## Evidence and metrics
| Metric | v1.7.30 | v1.7.31 |
|---|---:|---:|
| R | 52 | 52 |
| F | 1 | 1 |
| A | 49 | 49 |
| B | 37 | 37 |
| QA C | 2 | 2 |
| Playable C | 7 | 7 |
| Atomic PASS | 79/108 | 79/108 |
| Normal Gameplay | 12 | 12 |
| Backend PASS | 461 | 464 |
| Backend FAIL | 0 | 0 |
| Backend SKIP | 11 | 11 |
| Browser PASS/FAIL/INCOMPLETE | 26/0/51 | 31/0/47 |
| Rule matrix PASS/FAIL/INCOMPLETE | 26/0/86 | 31/0/82 |
| FULL fresh | 1/1 | 1/1 |
| QA C fresh | 2/2 | 2/2 |
| Playable C fresh | 7/7 | 7/7 |
| Atomic fresh | 79/79 | 79/79 |

Monolithic complete: True; exit: 0; duration ms: 310869.340798. New backend tests: 3; historical missing: 0; historical changed result: 0. Browser 78 suites / 113 version obligations, old inventory retained. Browser matrix exit 1 when remaining INCOMPLETE; per-suite exit/log recorded. Four previously incomplete B/B suites now run and a new wolf revival suite. Full browser acceptance not reached. PostgreSQL live and Human QA pending. Native Mac not tested.

## Code and safeguards
`backend/src/official/s13-mechanics.ts`, `backend/src/engine/service.ts`, `shared/contracts/index.ts`, `backend/src/experimental/owner-dc-policy.ts` (new policy stored only in new opt-in trap QA games, old archives keep behavior). `backend/src/experimental/owner-bb-v2/pack.ts` (new revocation refresh in S21 candidate only). New tests `tests/sprint21-revival.test.mjs`, `tests/sprint21-pack.test.mjs`, `tests/browser_s21_wolf_revival_e2e.py`; no assertions removed from previous tests. `package.json` version/script; generated source inventory hash refresh; README and new report files. No approved rule registry or decision history rewritten.

## Decisions and limitations
- DC-PACK-PRIVACY-BOUNDARY requires new decision: authorize a minimal replacement-required observation at lock (allows limited inference), or keep strict noninterference and leave mixed candidate disabled until a new compatible gameplay rule is approved. Existing 18 choices unchanged. No deadline/auto ballot/illegal commit.
- FULL #26 remains blocked by actual third-faction revival, excluded roles and full global interactions. Exclusion target list could itself reveal hidden role; no claim of full privacy. QA policy scope is engineering containment, not release.
- No SHARED-23 expansion, FULL-36 expansion, new FULL, new R/A/B/QA C/Playable C/Atomic or normal deck certification. No fake certificates or current PASS from old logs.

Detailed evidence: CLOSURE_EVIDENCE.md, FULL_CLOSURE_REVIEW.md, PACK_PRIVACY_DECISION_CARD.md, SOUL_SCOPE.md, acceptance.json, browser-results.json, certificate-revalidation.json, release-gates.json, focused.log, backend-full.log and per-suite matrices. Human QA instructions in HUMAN_QA.md.

Status: **v1.7.31 — BOUNDED REVIVAL EXTENSION / PRIVACY DECISION REQUIRED / GAMEPLAY WIP**.
