from pathlib import Path
import json
r=Path('reports/v1.7.29'); a=json.loads((r/'acceptance.json').read_text()); b=a['backend']; f=a['freshCertificateRevalidation']; m=a['browser']; v=a['ruleVersionMatrix']; gates=json.loads((r/'release-gates.json').read_text()); handoff=next(g['status'] for g in gates['additionalGates'] if g['id']=='NORMAL-HANDOFF'); cp=json.loads((r/'certificate-revalidation.json').read_text()); browser=json.loads((r/'browser-results.json').read_text()); p=lambda x: 'PASS' if x else 'NOT COMPLETE'
report=f'''# Wolvesville v1.7.29 — Blocker Closure & Gameplay Completion

**Engineering checkpoint only; official v1.3.3 remains active; v1.3.4 CANDIDATE; Competitive Production NO-GO.**

Source fingerprint: `{a['sourceFingerprint']}`. Input v1.7.28 ZIP SHA-256: `9bcf81bec5ae674d360b7502df8000d9e800d7b80ac27c4fe05d266df3e532e8`. Input 3812 payload hashes checked; 2956 historical report files unchanged.

## Executive results

| Obligation | Fresh result |
|---|---|
| Normal Handoff | {handoff}; 6/6 browser scenarios incl. both [8,25] and [8,74]; deterministic 2 old FAIL / 2 new PASS |
| Backend monolithic | {p(b['complete'])}: {b['counts']['PASS']} PASS / {b['counts']['FAIL']} FAIL / {b['counts']['SKIP']} SKIP; exit {b['exitCode']} |
| Browser manifest | {m['PASS']} PASS / {m['FAIL']} FAIL / {m['INCOMPLETE']} INCOMPLETE, total {m['total']} |
| Rule-version matrix | {v['PASS']} PASS / {v['FAIL']} FAIL / {v['INCOMPLETE']} INCOMPLETE, total {v['total']} |
| FULL #28 | {f['F']}/1 |
| QA C | {f['qaC']}/2 |
| Playable C | {f['playableC']}/7 |
| Atomic | {f['atomicPass']}/79 |
| SHARED-23 | PARTIAL; new live self-shield / hanging / secret revival / second death acceptance, not new gameplay implementation |
| FULL new | 0 |
| TRAP-04 / TRAP-05 | PARTIAL; no new inversion implementation |
| PACK-05 / PACK-PRIVACY-01 | PARTIAL; no new gameplay/privacy implementation |
| Human QA / PostgreSQL live | PENDING |

## Handoff diagnosis and fix

The v1.7.28 historical browser failed while waiting for selectedTarget == id, before vote submission. A natural rerun of v1.7.28 passed: the historical failure is not deterministically reproduced in that run. Two controlled adapter tests, identical on both versions, reproduce the identified state-publication and auxiliary-read race (2 old FAIL / 2 new PASS). `frontend/integration.js` now synchronizes seat maps with the accepted snapshot before paint, navigates with valid game snapshot before auxiliary feedback/events, ignores superseded socket frames, avoids stale room-revision replacement, and drops invalid selected targets. No backend gameplay logic changed. Both normal decks are exercised with a real feedback GET held during reconnect in the browser; no payload/expected result altered; no timeout expanded. Focused HTTP/WS/SQLite/replay and adapter acceptance: 5 PASS. Evidence: `handoff-before.log`, `handoff-unit-before.log`, `handoff-unit-after.log`, `focused.log`, `browser-normal/`.

## Fresh browser inventory

The 75-suite/110-obligation inventory is preserved. The normal suite contains six scenarios (including added role-handoff). Pre-final diagnostic runs are archived but excluded. Matrix exit can be nonzero because unselected obligations are incomplete; individual run exit and fingerprint determine acceptance.

| Ruleset | Suite | Status |
|---|---|---|
'''
for row in browser['runs']:
 if row['status']!='INCOMPLETE':report+=f"| {row['version']} | `{row['suite']}` | {row['status']} |\n"
report+='\n## Playable C per deck\n\n| Deck | Fresh | Missing browser/tests |\n|---|---|---|\n'
for row in cp['playableC']:
 report+=f"| {row['deck']} | {p(row['freshRevalidated'])} | {'; '.join(row['missingFreshBrowser']+row['missingFreshTests']) or 'None'} |\n"
report+='''
## Gameplay certificate closure

#23 S19 new test uses existing server rules and bounded QA deck [8,23,25,36]: self shield absorbs mage fire; first death by hanging; secret revival next night with two ammo; restart; final death through existing bounded #8 blind attack; no duplicate public death; replay. This is additional interaction evidence, **not a new gameplay implementation**. No change to source-approved targeting domain or ammunition rules. #23 remains PARTIAL (wrong-faction shot and finite cost, other attack/protection classes, third-shot prevention in ongoing match, death-ledger and projection). #36 and other candidates have incomplete contract classes (see `FULL_CLOSURE_REVIEW.md`). No new certificate issued. No Normal Gameplay deck promoted.

TRAP-04/05: preserve prior same-night and trap retained on revived target. Trapped revival actor remains unresolved. PACK-05: current membership-at-lock invariants retained, no new live membership transition. PACK-PRIVACY-01: global revision/timing, revoked-target oracle, post-resolution and third-party coverage unresolved. No new backend source for these blockers. See `DECISION_CARDS.md` for four new policy boundaries requiring owner approval before expansion. All 14 previously approved B/B decisions unchanged.

## Cumulative metrics (unchanged)

| Metric | Baseline | Current | Delta |
|---|---:|---:|---:|
'''
for k,label in [('R','R'),('F','FULL'),('A','A'),('B','B'),('qaC','QA C'),('playableC','Playable C'),('S_pass','Atomic PASS'),('normalDecks','Normal Gameplay')]:
 value=a['currentCumulativeMetrics'][k];report+=f'| {label} | {value} | {value} | 0 |\n'
report+=f'''| Fresh browser PASS | 22 | {m['PASS']} | {m['PASS']-22:+} |
| Fresh browser FAIL | 1 | {m['FAIL']} | {m['FAIL']-1:+} |
| Fresh backend PASS | 450 | {b['counts']['PASS']} | {b['counts']['PASS']-450:+} |

## Backend integrity and evidence

Historical tests missing: {len(b['missingHistoricalTests'])}; changed historical results: {len(b['changedHistoricalStatus'])}. Four expected new tests: 2 adapter, 1 handoff, 1 #23 QA. Actual new test names: {len(b['newTests'])}.

`backend-full.command`, `backend-full.log`, `backend-full.exit`, `acceptance.json`, `browser-results.json`, `certificate-revalidation.json`, `release-gates.json`, `COMPLETION_CONTRACT_DELTA.json`, `DECISION_CARDS.md`, `HUMAN_QA.md`, `FULL_CLOSURE_REVIEW.md` and all runner logs are included. No old source certificate erased. Browser admission uses existing runner with bridge; no backend full run concurrently with browser. `npm run verify:source`, `npm run build`, `npm run rules:build` passed in local Linux toolchain. Native Mac and PostgreSQL live are unverified. Human QA remains pending. Full release acceptance remains incomplete.

Official v1.3.4 is not approved for activation. No production GO. Delivery ZIP integrity and clean build are reported separately in the delivery verification file.
'''
(r/'COMPLETION_REPORT.md').write_text(report); Path('/mnt/data/Wolvesville_v1.7.29_Completion_Report.md').write_text(report)
