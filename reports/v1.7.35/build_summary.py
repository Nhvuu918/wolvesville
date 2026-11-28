from pathlib import Path as P
import json
r=P('reports/v1.7.35'); a=json.loads((r/'acceptance.json').read_text()); b=a['backend']; f=a['freshCertificateRevalidation']; br=a['browser']; mx=a['ruleVersionMatrix']; i=json.loads((r/'source-integrity.json').read_text()); old=json.loads(P('reports/v1.7.34/acceptance.json').read_text()); oldbr=old['browser']; oldmx=old['ruleVersionMatrix']; c=a['currentCumulativeMetrics']; supplemental=(r/'supplemental.exit').exists() and (r/'supplemental.exit').read_text().strip()=='0'; extras=len(list((r/'screenshots-supplemental').glob('*.png')))
s=f'''# Wolvesville v1.7.35 — Visual Integration / FULL Target Not Met

**F: 1/97 → 1/97 (Δ0), no new FULL certificate. Track A target NOT MET.** Track B integrated real presentation code into v1.7.34; partial visual acceptance. Active v1.3.3, candidate v1.3.4 NOT ACTIVE, 18 owner choices retained, DC-PACK-PRIVACY-BOUNDARY PENDING, competitive NO-GO.

## Release scorecard

| Metric | Before | After | Delta | Evidence |
|---|---:|---:|---:|---|
'''
for k in ('F','R','A','B','qaC','playableC','S_pass','normalDecks'):s+=f'| {k} | {old["currentCumulativeMetrics"][k]} | {c[k]} | {c[k]-old["currentCumulativeMetrics"][k]} | inherited certificate metrics, no new qualifications |\n'
for label,prev,now in [('Backend PASS',old['backend']['counts']['PASS'],b['counts']['PASS']),('Backend FAIL',0,b['counts']['FAIL']),('Backend SKIP',11,b['counts']['SKIP']),('Browser PASS',oldbr['PASS'],br['PASS']),('Browser FAIL',oldbr['FAIL'],br['FAIL']),('Browser INCOMPLETE',oldbr['INCOMPLETE'],br['INCOMPLETE']),('Rule-version PASS',oldmx['PASS'],mx['PASS']),('Rule-version FAIL',oldmx['FAIL'],mx['FAIL']),('Rule-version INCOMPLETE',oldmx['INCOMPLETE'],mx['INCOMPLETE'])]:s+=f'| {label} | {prev} | {now} | {now-prev} | actual final-source TAP/matrix |\n'
s+=f'''| Privacy gate | PARTIAL | PARTIAL | — | inherited ACL, PACK boundary pending |
| PostgreSQL | PENDING | PENDING | — | no live service |
| Human QA | PENDING | PENDING | — | not performed by owner |

Fresh certificate revalidation: FULL {f['F']}/1, QA C {f['qaC']}/2, Playable C {f['playableC']}/7, Atomic {f['atomicPass']}/79. Accumulated certificates distinct from fresh evidence. Browser manifest {br['total']} suites, {mx['total']} version obligations. Full acceptance not claimed.

Backend command: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`; exit {b['exitCode']}, complete as expected {b['complete']}; footer {b['tapFooter']}, durationMs {b['durationMs']}; missing historical tests: {b['missingHistoricalTests']}; changed inherited status: {b['changedHistoricalStatus']}; new tests: {b['newTests']}. Browser per-suite commands and exit codes in `browser-results.json`; matrix exit 1 because not all obligations executed. Earlier diagnostic failure was return navigation asserted before async transition; reduced-motion path made synchronous and capture waits for real page. Diagnostic logs preserved outside final matrix. No timeout increase.

## Visual integration scorecard

| Component | Status / scope |
|---|---|
| Source A | 101/101 identical baseline assets retained; approved CSS retained |
| Source B | 97 passive illustrated SVGs adapted, 97 originals retained; no old backend/schema/auth copied |
| Source C | 17 Markdown/JSON handoff files retained; preview not deployed |
| Design system | Integrated theme-driven panel/control/nav, neutral seats and own role card; not a full redesign |
| Real user journey | VERIFIED: actual two-account registration/auth, create/join/lock/ready, server role assignment, night skill, private result, public chat, vote, result, replay verification, reconnect, return lobby |
| Responsive | 12 screenshot samples, 4 viewports × lobby/room/night; PARTIAL due mobile phase banner clipping |
| Themes | 16/16 switched and captured in Codex; no all-surface full-theme acceptance |
| Animation | New authorized snapshot cues and event dedupe; reduced motion and no state mutation tested; no full per-event/per-role animation acceptance |
| Sound | Existing controls reused, optional committed-event cue; acoustic QA not performed |
| Captures | 51 primary PNG originals + {extras} supplemental (supplement run {'PASS' if supplemental else 'not fully verified'}); manifest and gallery |
| Console errors | 0 Playwright pageerror in the two passing visual suites; not a full console/network trace |
| Missing visible images | 0 sampled image elements with broken loads; not an exhaustive every-asset browser render |
| Replay | verified receipt, not a full replay player or account match history |
| Group chat | S24 technical fixture re-captured authorized member and outsider; no live recruitment producer; no Normal Gameplay screenshot for group chat |
| Accessibility/visual regression | PARTIAL: keyboard seat focus/Space selection passed; 96 opaque HUD contrast samples, 3 below 4.5:1; six before/after pairs captured, seventh failed on baseline DOM; not full WCAG/pixel acceptance |

Known visual defects: mobile phase banner clips despite no top-level document overflow; chat requires vertical scrolling; terminal feedback can retain a pre-resolution vote receipt while authoritative winner panel is correct, and transient toast can overlap a heading; full typography/contrast and brand consistency still need review. Role reveal is own HUD/role wheel, not a fully redesigned modal. No unsupported profile/social/stat data fabricated. No screen claims based on old images. Gallery contains reduced-motion screenshots from real Chromium frontend, with existing bridge forwarding all HTTP/WS to actual local backend (native loopback blocked by environment); native Mac browser not verified.

## Track A exact blockers

See FULL_CONTRACT_CLOSURE.md. #84-03: group grant now rejects wolf and independent win-link target before mutation per Q13-08 and JSON#90. This is a shared ACL guard, not recruitment resolver, not new Normal Gameplay. WV-CH90-S01/S02 retain BLOCKED_BY_RULE and unresolved victory. #90 live recruitment, cap, independent target exclusions, private notification, same-night sacrifice, death closure and actual victory still require implementation; #84-05/06/07 remain open. The source also asks cult win and original role rights after conversion, plus NV93 failed attempt resource/notice. Need precise owner decision only on truly unresolved points, not VH57/VH59/VH78/Q13-08 again. #79-02/03/04 require co-queued day actions, frozen multiwolf audience and #6 director mission/Oscar runtime; Q13-09 already approved. #25/#74 no new shared investigation effects, BT-25-2/BT-74-2 still open. No new role admission or certificate. Technical work independent of owner choices remains possible and has not been completed.

## Integrity

Input {i['inputFiles']} files, {i['inputPayloadVerified']} SHA-256 payloads verified; {i['historicalReportsUnchanged']} inherited reports unchanged, {i['rulesAndCharactersUnchanged']} rule/character files unchanged. Source fingerprint `{a['sourceFingerprint']}`. See graphics integration matrix, actual screenshot manifest, browser logs, source integrity and verification files. Delivery excludes runtime database, secrets, node_modules, .env and build cache. Native dependency install and human QA not run. All release claims scoped to actual executed evidence.
'''
(r/'COMPLETION_REPORT.md').write_text(s)
