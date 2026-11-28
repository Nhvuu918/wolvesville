# Wolvesville FULL-50 — Owner lock + scoped candidate overlay

Not a new release. The original RC-01 ZIP remains untouched. Apply only to a fresh copy of RC-01. Historical reports and certificates are kept; RC-01's payload manifest does not validate the changed overlay. Do not interpret old certificate evidence as fresh evidence.

## What changed
- New persisted QA policy variants, selected only when `WV_FULL50_QA=1` in an existing non-production opt-in QA deck; no Normal Gameplay deck promoted.
- NV30 and WV-CUPID-WIN-DEAD-01: living Cupid pair may chat in night action collection and day phases; dead Cupid not a winner and cannot send.
- WV-CULT-DEAD-WIN-01: in the currently admitted cult QA decks, dead followers with retained cult faction and win group qualify for victory. Live group access remains revoked. This does not implement cult revival (answers 22–23).
- Owner registry records all 48 responses; 8 and 47 contain unclosed operational subpoints. Registry is not an automatic ACTIVE ruleset.

## Apply and verify (Mac / Linux)
Extract original RC-01 into a separate directory. Extract this overlay into another directory. From the overlay directory run:

```sh
python3 apply_overlay.py /path/to/extracted/RC-01
cd /path/to/extracted/RC-01
npm install
npm run verify:source
npm run build
node --test --test-concurrency=4 tests/sprint29-life02.test.mjs tests/sprint27-cult-runtime.test.mjs tests/full50-cupid-candidate.test.mjs tests/full50-cult-candidate.test.mjs
```

Node >=22.13. No production activation. New tests set WV_FULL50_QA internally. Old tests exercise the old pinned QA profiles with the flag unset. Do not run the original RC-01 certificate verifier against this overlay: its recorded fingerprint deliberately belongs to the original ZIP.

## Acceptance and remaining work
Fresh build PASS; source inventory verification PASS; focused API/SQLite/replay tests 7 PASS, 0 FAIL (2 new, 5 inherited). Browser, monolithic regression, PostgreSQL and native Mac were not run. F historical = 1/97; F newly certified = 0; F fresh revalidated = 0. F >= 50 not met. RC-01 remains release baseline. No release gate changed.

Priority: finish #64 life-cycle timing (revive during night, publish dawn), linked revival, additional death while hibernating, rescue/prolong order, defense, trap and lock, transformation, all normal gameplay obligations. Then complete reusable resolvers and finite contracts for >=50 characters, with fresh acceptance. No shortcuts in FULL criteria.
