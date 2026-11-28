# Owner decisions — acceptance matrix (candidate only)

Legend: **PASS (scope)** = actual new focused test, not full certificate. **PENDING** = not covered or not permitted. Historical evidence is separate; see generated `owner-decision-acceptance.json` for current browser rows and exact test names.

| Decision | Required case | New result / residual |
|---|---|---|
| SOUL-01 | Public-living target / true-dead / secret revived #23 | PASS (existing #8 QA, new live test for true-dead and second death) |
| SOUL-01 | Protected vs unprotected target | Existing #23/mage path verified in bounded deck; broad defense classes PENDING |
| SOUL-01 | Valid attempt consumes applicable resource | PASS nightly action slot for #8, repeated same-night command blocked. Finite-cost blind attempts PENDING designation |
| SOUL-01 | Retry / replay | PASS HTTP same command and replay in new test |
| SOUL-01 | Restart before blind resolve / reconnect / timing | Inherited restart test coverage for #23 lifecycle, new blind-specific full transport matrix PENDING |
| SOUL-02 | Village, shielded village | PASS shared damage + one bullet consumed per action |
| SOUL-02 | Third faction | PASS #8; wolf-specific branch PENDING broader deck |
| SOUL-02 | No bullet, second charge, retry | PASS ongoing game, no third shot, duplicate HTTP command, SQLite restart |
| SOUL-02 | Continue and endgame | PASS QD-01 current village membership incl. dead; no premature victory |
| SOUL-02 | Secret-target / death links / complex revival | PENDING full domain; no public-dead designation for finite bullet |
| SOUL-02 | Browser | New owner-specific suite `browser_s20_owner_soul_e2e.py` |
| TRAP-02 | Prior trap / same-night placement on actor | PASS both new live tests; priority 50 before 200, no retroactive application |
| TRAP-02 | Trapped actor fails; no synthetic death | PASS one use, original victim death event once, NightActionGroup trap consumed once, no revival |
| TRAP-02 | Invalid action / exhausted use / retry / restart before resolve | PASS HTTP and SQLite |
| TRAP-02 | Nontrapped actor revives target carrying trap | Inherited `sprint17-trap-revival.test.mjs`; preserve existing behavior; check fresh regression |
| TRAP-02 | Other valid skills across windows / all factions / independent death chains | PENDING; bounded deck cannot certify all interaction classes |
| TRAP-02 | Public projection / replay | PASS new live test excludes internal failure/consumption events; new policy redacts counts; revision/timing not closed |
| TRAP-02 | Browser | New owner-specific suite `browser_s20_owner_trap_e2e.py` |
| PACK-KEEP | Invalid selection, replacement, other selections and KEEP | PASS state-level permanent revocation, no automatic replacement, old target later eligible still revoked |
| PACK-KEEP | Membership before lock / representative / after lock | PASS state-level explicit replacement, fixed order, no re-lock |
| PACK-KEEP | Restart | PASS serialization state-level, NOT live SQLite restart |
| PACK-KEEP | Secret paired state | PASS blinded own receipt before lock; `publicPackTargetIds` uses public death and self only. At lock observable outcome differs; privacy PENDING, not live-enabled |
| PACK-KEEP | Real transition / transport / browser / replay / victory | PENDING; no unlawful fixture treated as live game evidence |

Reference: `tests/sprint20-owner-decisions.test.mjs`, `tests/sprint20-pack-keep.test.mjs`, `focused.log`, `browser-results.json`, `release-gates.json`.
