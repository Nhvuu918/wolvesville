from pathlib import Path as P
import json
root=P('reports/v1.7.33');a=json.loads((root/'acceptance.json').read_text());b=a['backend'];f=a['freshCertificateRevalidation'];m=a['browser'];r=a['ruleVersionMatrix'];c=a['currentCumulativeMetrics'];i=json.loads((root/'source-integrity.json').read_text())
text=f'''# Wolvesville v1.7.33 — FULL Certificate Breakthrough WIP

## F scorecard
| Role | Before | After | Certificate |
|---|---|---|---|
| #28 | FULL | FULL historical, fresh {f['F']}/1 | retained |
| #84 PRIMARY | PARTIAL | public-chat ACL, mute lifecycle hardened | NOT ISSUED |
| #79 BACKUP | PARTIAL | PH-02 queue precedence/cutoff | NOT ISSUED |

F=1 → 1, delta 0. Main target not met. No new deck, no FULL certificate, no altered metric definition. Both selected candidates remain incomplete for source obligations documented in FULL_CONTRACT_CLOSURE.md. Active v1.3.3, v1.3.4 candidate; 18 owner choices retained, PACK-PRIVACY-BOUNDARY pending. NO-GO.

## Runtime changes and evidence
- #84: unknown WOLF/GROUP channel previously fell through to public. Reproduced HTTP 200 on old source (`before-fix.log`, exit 1). Fixed routing, shared projection/send policy, temporary expiry at next night on v1.3.3. Game Session test covers channel ACL, retry, WS, mute, vote, expiry, SQLite, victory and replay. Existing browser suite S14 both versions, new S23 mute browser PASS. Positive system-created group send/read while muted remains missing under VH57/VH78.
- #79: PH-02 queued day action preemption and cutoff implemented in existing engine. Unit/state helper and real existing single-wolf deck cancellation/restart/victory/replay PASS. No legal multi-skill co-queue acceptance or multiwolf audience; Q13-09 Director mission/Oscar unimplemented. Deep Jester browser PASS both versions.
- See FULL_CONTRACT_CLOSURE.md for exact obligation IDs, provenance, code and missing work. No removed obligations or invented NOT_APPLICABLE. No new rule decisions.

## Verification
Baseline ZIP SHA-256 7d8d651fcaa722721b18519492f634057018404febde3a6e864623c7a7875d0b, 4098 payload hashes, CRC PASS. {i['inputFiles']} inherited files present; {i['historicalReportsUnchanged']} historical reports unchanged; {i['rulesAndCharactersUnchanged']} rule/character files unchanged. 97 characters / 118 historical decisions / 207 legacy specifications / 18 owner choices. Verify source, TypeScript and rules build PASS in working directory.

Final source fingerprint: `{a['sourceFingerprint']}`.
Backend: {b['counts']['PASS']} PASS / {b['counts']['FAIL']} FAIL / {b['counts']['SKIP']} SKIP, total {b['tapFooter'].get('tests','incomplete')}; exit {b['exitCode']}; durationMs {b['durationMs']}; monolithic complete={b['complete']}. New test names: {b['newTests']}. Missing historical tests: {b['missingHistoricalTests']}; changed historical status: {b['changedHistoricalStatus']}.

Browser: {m['PASS']} PASS / {m['FAIL']} FAIL / {m['INCOMPLETE']} INCOMPLETE / {m['total']}; rule version matrix {r['PASS']} / {r['FAIL']} / {r['INCOMPLETE']} / {r['total']}. 22 actual version runs in focused + critical selection, not whole inventory. Matrix exits 1 because obligations remain incomplete, not individual suite failures. Historical 35 PASS not carried over as current proof.

Current-source certificate revalidation FULL {f['F']}/1, QA C {f['qaC']}/2, Playable C {f['playableC']}/7, Atomic {f['atomicPass']}/79. Historical/cumulative metrics: {c}. No new certificates.

Commands (run from source root): `npm run verify:source`; `npm run build`; `npm run rules:build`; `node --test tests/sprint23-role-closure.test.mjs`; `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`. Browser commands and per-version exits in browser-results.json and run-current.sh. `python reports/v1.7.33/build_acceptance.py --verify` regenerates and verifies acceptance from final logs. No native Mac, network install, human QA or PG live evidence.

## Next independent path
Positive group ACL implementation plus sourced membership/phase/visibility lifecycle (not a new law) is required for #84; alternatively continue #25/#74 finite contracts with BT-25-2 / BT-74-2 (reflection/concealment and false-role/disguise). #79 depends on Q13-09 and multiwolf disclosure. PACK privacy pending is not a global blocker. Do not treat these as completed work.
'''
(root/'COMPLETION_REPORT.md').write_text(text)
