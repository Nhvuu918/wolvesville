"""Generate a short delivery scorecard from actual source acceptance, not targets."""
from pathlib import Path as P
import json
root=P('reports/v1.7.34'); a=json.loads((root/'acceptance.json').read_text()); base=json.loads(P('reports/v1.7.33/acceptance.json').read_text()); integ=json.loads((root/'source-integrity.json').read_text()); f=a['freshCertificateRevalidation'];b=a['backend'];br=a['browser'];m=a['ruleVersionMatrix'];oldbr=base['browser'];oldm=base['ruleVersionMatrix'];c=a['currentCumulativeMetrics'];s=f'''# Wolvesville v1.7.34 — Shared Group ACL / Full Role Factory WIP

**F: 1/97 → 1/97. Δ0. No new FULL certificate. Main breakthrough target NOT MET.**

Primary #84; secondary #79. Continuation of verified v1.7.33. No new normal/QA deck or role admission. Added reusable CULT_DAY system-group grant/transport/authorized UI and deterministic replay verification, not actual #90 recruitment. Positive acceptance starts from a **trusted archive fixture**; neither that fixture nor technical browser PASS is Normal Gameplay evidence. The fixture's public-chat deck is not admitted for public chat, so actual mute enforcement is established separately by the existing #84 acceptance. #79/#25/#74 runtime unchanged.

## Release scorecard

| Metric | Before | After | Δ | Evidence |
|---|---:|---:|---:|---|
'''
for k in ('F','R','A','B','qaC','playableC','S_pass','normalDecks'):
 v=c[k];s+=f'| {k} | {base["currentCumulativeMetrics"][k]} | {v} | {v-base["currentCumulativeMetrics"][k]} | Inherited certificate registry, no new qualification |\n'
s+=f'''| Backend PASS | {base['backend']['counts']['PASS']} | {b['counts']['PASS']} | {b['counts']['PASS']-base['backend']['counts']['PASS']} | backend-full.log |
| Backend FAIL | 0 | {b['counts']['FAIL']} | {b['counts']['FAIL']} | backend-full.log |
| Backend SKIP | 11 | {b['counts']['SKIP']} | {b['counts']['SKIP']-11} | backend-full.log |
| Browser PASS | {oldbr['PASS']} | {br['PASS']} | {br['PASS']-oldbr['PASS']} | browser-results.json |
| Browser FAIL | {oldbr['FAIL']} | {br['FAIL']} | {br['FAIL']-oldbr['FAIL']} | browser-results.json |
| Browser INCOMPLETE | {oldbr['INCOMPLETE']} | {br['INCOMPLETE']} | {br['INCOMPLETE']-oldbr['INCOMPLETE']} | browser-results.json |
| Rule-version PASS | {oldm['PASS']} | {m['PASS']} | {m['PASS']-oldm['PASS']} | browser-results.json |
| Rule-version INCOMPLETE | {oldm['INCOMPLETE']} | {m['INCOMPLETE']} | {m['INCOMPLETE']-oldm['INCOMPLETE']} | browser-results.json |
| Privacy release | PARTIAL | PARTIAL | — | Scoped fixture ACL; PACK boundary pending |
| PostgreSQL Live | PENDING | PENDING | — | Live PostgreSQL not tested |
| Human QA | PENDING | PENDING | — | HUMAN_QA.md |

Fresh revalidation: FULL {f['F']}/1, QA C {f['qaC']}/2, Playable C {f['playableC']}/7, Atomic {f['atomicPass']}/79. Accumulated certs preserved independently of revalidation.

Backend command: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`. Exit code {b['exitCode']}; monolithic complete as expected: {b['complete']}; footer {b['tapFooter']}; durationMs {b['durationMs']}. Missing historical tests: {b['missingHistoricalTests']}; changed historical status: {b['changedHistoricalStatus']}. Browser matrix commands and per-obligation exit codes in browser-results.json; raw logs under browser-group/, browser-candidate/, browser-critical/. A matrix exit 1 due to unexecuted obligations is not a suite PASS or FAIL. The suite inventory includes one new technical-only fixture obligation. Full browser acceptance is not asserted.

## Changes and exact blockers

- GROUP ACL and frozen event audiences: `backend/src/official/group-chat.ts`; typed persisted grants in `shared/contracts/index.ts`; engine/service, visibility/replay, coordinator and public-chat-access; `frontend/integration.js` real group composer. Server alone authorizes. `CULT_DAY` only; the real recruitment effect must provide membership and sourceActionId bound to a committed gameplay event. No faction-based implicit grant, no general DM, no new role admitted. Two focused backend tests and browser fixture isolate content, receipt, group-only WS refresh, global revision, event positions/counts, retries, reconnect, SQLite restart and replay. No broad timing guarantee.
- #84-03 now has transport, but no production grant producer (VH59/VH78, #90 recruitment and eligibility, capacity, private notification and life/role exceptions); other group profiles and producers still needed. #84-06 valid lock/death/revival interactions, #84-05/07 normal gameplay absent. No FULL.
- #79 unchanged: 79-03 authorized multiwolf result audience; 79-04 Q13-09 already approved but no #6 substitute mission/Oscar runtime; 79-02 real co-queued day-skill cancellation. No new owner decision needed for Q13-09.
- #25 BT-25-2 reflection #35 / #3 transformation / unknown aura noise; #74 BT-74-2 disguise #57 / #18 changes / Q13-06 false-role combinations. No new implementation in S24.
- See FULL_CONTRACT_CLOSURE.md for all seven #84 obligations and #79 specifics, dependency-graph.json for deduplicated existing readiness tags. The factory is not complete; this session did not achieve F-first exit criteria.

## Integrity and delivery

Input ZIP CRC and payload hash PASS ({integ['inputFiles']} entries). All {integ['historicalReportsUnchanged']} prior reports retained byte-for-byte, {integ['rulesAndCharactersUnchanged']} rule/character files preserved. Source fingerprint `{a['sourceFingerprint']}`. Official v1.3.3 ACTIVE; v1.3.4 CANDIDATE/not activated. 18 owner choices preserved; PACK-PRIVACY-BOUNDARY PENDING. Competitive production NO-GO. No node_modules, runtime DB, real env or build cache in delivery. Native Mac dependency install not tested; clean build uses local toolchain.
'''
(root/'COMPLETION_REPORT.md').write_text(s)
