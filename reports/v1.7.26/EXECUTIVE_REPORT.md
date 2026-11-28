# Wolvesville v1.7.26 — Completion & Release Convergence

**Partial engineering checkpoint; not a completed release.** Direct continuation from v1.7.25-s15-privacy-stability-wip. Official v1.3.3 stays active; v1.3.4 remains CANDIDATE, activation not authorized. Competitive production NO-GO.

## A. Executive summary
Implemented bounded Mixed Wolf privacy improvements and current membership waiting-state correction. Full monolithic regression completed: 444 PASS, 0 FAIL, 11 SKIP; exit 0; 290.5 s. All 453 historical test outcomes retained, two new cases PASS. No new FULL role or deck certificate. #23 secret revival/death-chain, #36 FULL, #10 trap/revival and full live membership closure were not implemented in this checkpoint. Privacy PARTIAL. Human QA and PostgreSQL live PENDING.

## B. Metric comparison
| Metric | v1.7.25 cumulative | v1.7.26 cumulative | Delta |
|---|---:|---:|---:|
| R | 52 | 52 | 0 |
| F | 1 | 1 | 0 |
| A | 49 | 49 | 0 |
| B | 37 | 37 | 0 |
| QA C | 2 | 2 | 0 |
| Playable C | 7 | 7 | 0 |
| Atomic PASS | 79/108 | 79/108 | 0 |
| Normal gameplay | 12 | 12 | 0 |
| Backend PASS | 442 | 444 | +2 |

Historical browser manifest (36/0/36) and version matrix (42/0/65) retained unchanged. Fresh v1.7.26 browser manifest: 1 PASS, 0 FAIL, 71 INCOMPLETE; fresh version matrix: 1 PASS, 0 FAIL, 106 INCOMPLETE. These are not cumulative metric gains or evidence of a new gameplay failure. Direct Chromium blocked by environment; retry evidence in `browser-bridge-direct-run.log`. No suite removed. Historical certificates preserved, fresh revalidation: FULL 0/1; QA C 0/2; playable C 0/7; atomic 72/79 (7 previously certified branches need fresh browser evidence). See `certificate-revalidation.json` for exact missing evidence.

## C. Implementation evidence
- `backend/src/engine/visibility.ts`: authorized per-viewer event ordinals, preserving internal ledger.
- `backend/src/game/coordinator.ts`: Mixed QA replay and phase receipts omit raw private aggregate counters; visible event count only.
- `backend/src/multiplayer/server.ts`: no redundant snapshot for idempotent pack submission.
- `backend/src/experimental/owner-bb-v2/pack.ts`: recompute missing responses using current eligible membership; preserve KEEP and fixed representative order.
- `frontend/integration.js`: generic completion feedback when private counts omitted.
- `tests/sprint15-bb-live.test.mjs`, `tests/sprint15-owner-bb-v2.test.mjs`: two new tests, no original assertion removed.
- `focused.log`: 36/36 PASS; `medium-mage.log`: 12/12 PASS. These are subsets of the monolithic run, not additional metric credit. `backend-full-retry.log` and `.exit`: completed 455-case regression; prior interrupted run retained separately.
- Source fingerprint: `1415b2aa3e9579830a12fc82878506527c3519ea32ed1c1bc688ec52cafb9e4d`.
- `source-integrity.json`: all 850 source and 2,830 report checksum entries matched input before edits. 841/850 source entries unchanged afterwards; all historical reports unchanged. `clean-source-build.log` records clean staging build with Node 22.16.0, TypeScript 5.8.3 and @types/node 22.15.33. `build.log`, `source-final.log`, `rules.log`: successful build/source/rules checks. No package registry install or native Mac acceptance performed.

## D. Remaining blockers and acceptance
| ID | Rule and roles | Existing evidence / technical gap | Exit criteria |
|---|---|---|---|
| PACK-PRIVACY-01 | SYS-05/06, VH62, BB-01/02/03; #48/#93/#94 | paired secret worlds and live REST/replay PASS; global revision, timing, revoked target after KEEP, post-resolution and postgame scope incomplete | prove all 12 surfaces including browser and lawful post-resolution disclosure |
| SHARED-23 / FULL-36 | character #23, VH06/VH82/VH12/VH13 | medium/mage existing 12 tests PASS; secret life, bullets, no-vote, distinct death cycles absent | implement lawful #23 lifecycle and #36 interaction classes; actual session, restart, replay, browser, full contract |
| TRAP-04/05 | DEC-BT-02, BB-04/05, BB-PENDING-03, VH73/76/82; #10/#26/#23/#29 | existing persistent and cross-window tests PASS; same-night ordering and revival mapping not fully implemented | combined real deck, rule-backed inversions, retention, resource/chain/replay/browser |
| PACK-05 | BB-03, KEEP, BB-REP-NEW-01; #48/#93/#94 | new state invariant PASS and existing legal conversion; not lawful mid-window live closure | real eligible transition where legal, loss/rejoin, restart/replay/browser |
| BROWSER | 72-suite / 107-version inventory | current results above; environment blocked direct Chromium | all required version obligations and critical release paths accepted |
| HUMAN-QA / PG-LIVE / ACTIVATION | release policy | no owner evidence or PostgreSQL live database | owner feedback, live database validation, all gates and separate approval |

See `privacy-acceptance.json`, `release-gates.json`, `RELEASE_GATE_CROSSWALK.md`, and `DECISION_CARDS.md`. No proposed rule adopted; separate unclear interaction boundaries from established technical work. No v1.3.4 activation.

## E. Human QA
Three UI-only tasks, see `HUMAN_QA.md` and root README: Mixed Wolf [48,74,77,84,93,94] 6 accounts; Medium [8,25,26] 3 accounts; Engineer cross-window [8,10,25,29] 4 accounts. Trap + revival and #23 secret life not offered as playable QA. No manual API or database edits. Owner feedback PENDING.

## F. Delivery
Full source ZIP includes original source and historical records plus current code/evidence. No runtime database, .env, node_modules or dist. Per-file payload digest manifest `delivery-payload-sha256.json` excludes itself. ZIP SHA-256, CRC, clean extraction build and validation results are recorded in the separate delivery verification TXT.
