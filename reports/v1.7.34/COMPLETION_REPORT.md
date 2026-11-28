# Wolvesville v1.7.34 — Shared Group ACL / Full Role Factory WIP

**F: 1/97 → 1/97. Δ0. No new FULL certificate. Main breakthrough target NOT MET.**

Primary #84; secondary #79. Continuation of verified v1.7.33. No new normal/QA deck or role admission. Added reusable CULT_DAY system-group grant/transport/authorized UI and deterministic replay verification, not actual #90 recruitment. Positive acceptance starts from a **trusted archive fixture**; neither that fixture nor technical browser PASS is Normal Gameplay evidence. The fixture's public-chat deck is not admitted for public chat, so actual mute enforcement is established separately by the existing #84 acceptance. #79/#25/#74 runtime unchanged.

## Release scorecard

| Metric | Before | After | Δ | Evidence |
|---|---:|---:|---:|---|
| F | 1 | 1 | 0 | Inherited certificate registry, no new qualification |
| R | 52 | 52 | 0 | Inherited certificate registry, no new qualification |
| A | 49 | 49 | 0 | Inherited certificate registry, no new qualification |
| B | 37 | 37 | 0 | Inherited certificate registry, no new qualification |
| qaC | 2 | 2 | 0 | Inherited certificate registry, no new qualification |
| playableC | 7 | 7 | 0 | Inherited certificate registry, no new qualification |
| S_pass | 79 | 79 | 0 | Inherited certificate registry, no new qualification |
| normalDecks | 12 | 12 | 0 | Inherited certificate registry, no new qualification |
| Backend PASS | 469 | 471 | 2 | backend-full.log |
| Backend FAIL | 0 | 0 | 0 | backend-full.log |
| Backend SKIP | 11 | 11 | 0 | backend-full.log |
| Browser PASS | 20 | 21 | 1 | browser-results.json |
| Browser FAIL | 0 | 0 | 0 | browser-results.json |
| Browser INCOMPLETE | 61 | 61 | 0 | browser-results.json |
| Rule-version PASS | 22 | 23 | 1 | browser-results.json |
| Rule-version INCOMPLETE | 94 | 94 | 0 | browser-results.json |
| Privacy release | PARTIAL | PARTIAL | — | Scoped fixture ACL; PACK boundary pending |
| PostgreSQL Live | PENDING | PENDING | — | Live PostgreSQL not tested |
| Human QA | PENDING | PENDING | — | HUMAN_QA.md |

Fresh revalidation: FULL 1/1, QA C 2/2, Playable C 7/7, Atomic 79/79. Accumulated certs preserved independently of revalidation.

Backend command: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`. Exit code 0; monolithic complete as expected: True; footer {'tests': 482, 'pass': 471, 'fail': 0, 'cancelled': 0, 'skipped': 11, 'todo': 0}; durationMs 174177.144119. Missing historical tests: []; changed historical status: []. Browser matrix commands and per-obligation exit codes in browser-results.json; raw logs under browser-group/, browser-candidate/, browser-critical/. A matrix exit 1 due to unexecuted obligations is not a suite PASS or FAIL. The suite inventory includes one new technical-only fixture obligation. Full browser acceptance is not asserted.

## Changes and exact blockers

- GROUP ACL and frozen event audiences: `backend/src/official/group-chat.ts`; typed persisted grants in `shared/contracts/index.ts`; engine/service, visibility/replay, coordinator and public-chat-access; `frontend/integration.js` real group composer. Server alone authorizes. `CULT_DAY` only; the real recruitment effect must provide membership and sourceActionId bound to a committed gameplay event. No faction-based implicit grant, no general DM, no new role admitted. Two focused backend tests and browser fixture isolate content, receipt, group-only WS refresh, global revision, event positions/counts, retries, reconnect, SQLite restart and replay. No broad timing guarantee.
- #84-03 now has transport, but no production grant producer (VH59/VH78, #90 recruitment and eligibility, capacity, private notification and life/role exceptions); other group profiles and producers still needed. #84-06 valid lock/death/revival interactions, #84-05/07 normal gameplay absent. No FULL.
- #79 unchanged: 79-03 authorized multiwolf result audience; 79-04 Q13-09 already approved but no #6 substitute mission/Oscar runtime; 79-02 real co-queued day-skill cancellation. No new owner decision needed for Q13-09.
- #25 BT-25-2 reflection #35 / #3 transformation / unknown aura noise; #74 BT-74-2 disguise #57 / #18 changes / Q13-06 false-role combinations. No new implementation in S24.
- See FULL_CONTRACT_CLOSURE.md for all seven #84 obligations and #79 specifics, dependency-graph.json for deduplicated existing readiness tags. The factory is not complete; this session did not achieve F-first exit criteria.

## Integrity and delivery

Input ZIP CRC and payload hash PASS (4162 entries). All 3288 prior reports retained byte-for-byte, 29 rule/character files preserved. Source fingerprint `aa748258cd09a9884f95cdb9bb591cbfc208558acdbd9f48abba4f4d26ae703d`. Official v1.3.3 ACTIVE; v1.3.4 CANDIDATE/not activated. 18 owner choices preserved; PACK-PRIVACY-BOUNDARY PENDING. Competitive production NO-GO. No node_modules, runtime DB, real env or build cache in delivery. Native Mac dependency install not tested; clean build uses local toolchain.
