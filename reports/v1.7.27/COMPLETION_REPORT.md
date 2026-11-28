# Wolvesville v1.7.27 — Engineering Completion & Regression Recovery (WIP)

## Executive decision
Actual code changes on v1.7.26, official 1.3.3 retained, 1.3.4 CANDIDATE, Competitive Production NO-GO. The two newly implemented QA domains have real HTTP/SQLite and browser acceptance. No new FULL/Normal Gameplay certificate; no B/B activation. Human QA and PostgreSQL Live pending.

- Backend monolithic: 449 PASS / 0 FAIL / 11 SKIP; exit 0; complete=True; focused new 5/5 PASS.
- Browser manifest: 5 PASS / 0 FAIL / 69 INCOMPLETE of 74; matrix 5 / 0 / 104 of 109. All inherited 72/107 retained; added 2/2 obligations.
- Fresh certificate revalidation: FULL 1/1; QA C 0/2; Playable C 0/7; Atomic 72/79.
- Source fingerprint: `f7d33dab14d9420c4192298059dcf3e09d8d52eb8873216a2305ef804a1245f6`.
- Historical 97 IDs, 118 decisions, 207 legacy specs and 14 B/B decisions retained. 3723 input payload hashes verified; 2873 historical reports byte-preserved.

## Ten owner questions
1. #23: Game Session QA [8,23,25,36] integrates first death, next-night secret revival, two bullets, no vote, pending faction count, two already accepted lethal hits cancel revival (LIFE-01), protection, victory, retry/restart/replay. Browser PASS. Remaining: fresh selection of publicly dead seats, wrong-faction shot semantics, final death after secret revival, full interaction and privacy acceptance.
2. #36: not FULL; fireball and shield interact with #23, but entire protection and death-chain contract remains incomplete.
3. New FULL: zero. Existing #28 browser Pin/Revenge PASS; fresh revalidation above.
4. Trap + Revival: live QA [8,10,25,26] backend and browser PASS for trap on Seer, death, Medium revival, one inverted inspection. Same-night trap + inspection backend PASS. Other interactions open.
5. PACK-05: PARTIAL, no new membership rewrite; prior invariants preserved. Lawful before/after-lock membership acceptance, revoked target under KEEP remain open.
6. PACK-PRIVACY-01: PARTIAL; no new release-wide revision/timing fix. #23 has a bounded target policy that itself can reveal hostile identity; not acceptable for production.
7. Browser: 5 PASS on this fingerprint. See `browser-results.json` for exact suites.
8. Certificates: see current counts above and `certificate-revalidation.json` for obligation-level evidence. No historical result promoted as new.
9. 1.3.4: CANDIDATE; not READY_FOR_APPROVAL, not ACTIVE.
10. Full source archive: `Wolvesville_v1.7.27_Engineering_Completion_Full_Source.zip`; SHA-256 provided in external verification file. No runtime DB, actual .env, node_modules or build cache.

## Implementation
| File | Actual change |
|---|---|
| `backend/src/official/soul-shooter.ts` | scoped secret-life transition and private event |
| `backend/src/engine/state.ts`, `service.ts` | next-night scheduling, vote guard, private event and fail-closed trap actions |
| `backend/src/engine/validate.ts`, `vote-adjudicator.ts`, `elimination-chain.ts` | authorization, public-dead targeting and hanging transition |
| `backend/src/official/s13-mechanics.ts`, `capabilities.ts`, `solo-rules.ts`, `effect-dispatch.ts` | authorized shot and resource/protection/death paths |
| `backend/src/official/stable-death-proof.ts`, `victory-predicates.ts`, `victory-resolver.ts` | lifecycle-aware death ledger and victory |
| `backend/src/engine/visibility.ts`, `backend/src/game/coordinator.ts` | scoped event/replay projection |
| `backend/src/official/revival-capability.ts`, `engineer-trap.ts`, `backend/src/experimental/owner-bb-v2/live-profile.ts` | opt-in trap + medium revival deck |
| `frontend/integration.js` | deck selection, private revival message |
| `tests/sprint17-soul-lifecycle.test.mjs`, `tests/sprint17-trap-revival.test.mjs` | five HTTP/SQLite tests |
| `tests/browser_s17_soul_e2e.py`, `tests/browser_s17_trap_revival_e2e.py` | four independent actual browsers per scenario |

## Metrics
Cumulative values are unchanged (QA-only implementation is not a completed or normal deck): R 52, F 1, A 49, B 37, QA C 2, Playable C 7, Atomic 79/108, Normal 12. Delta zero; fresh certificate counts separate. See `acceptance.json`, derived from logs and retained registry. No metric definition changed.

## Limitations and technical choices
- Exact four-role QA domains, not general runtime support. Secret soul revival uses a distinct marker and not public #26 revival. The restricted #8 target selection is a known role-oracle risk; do not enable competitively. Publicly dead fresh-target rejection is deliberately symmetric but does not implement all lawful second deaths. Death proof is bounded and needs event ordering checks. Tests cover two rounds of ammunition, but no independent extra round after zero ammo while match continues.
- Trap persistence uses existing placement and inspection priority, no retroactive effect. Unsupported revival inversion fails closed. See decision cards, no choices activated.
- Old rule versions and historical records remain intact. Browser obligations not executed are INCOMPLETE, not PASS or FAIL. Matrix process exit 1 for intentionally incomplete inventory, while individual successful obligations exit 0. Python environment emitted unrelated spreadsheet startup warnings; actual browser assertions and completion markers passed. Native Apple Silicon and live PostgreSQL were not exercised.
- Backend run is counted only if actual TAP results and exit code establish completion. Historical certificate revalidation uses required test names and current browser evidence; no new issuance from bounded QA tests.

## Evidence
`focused.log`, `backend-full.log`, `backend-full.exit`, `browser*/matrix.json`, per-suite logs, `browser-results.json`, `certificate-revalidation.json`, `COMPLETION_CONTRACT_DELTA.json`, `release-gates.json`, `DECISION_CARDS.md`, `HUMAN_QA.md`, `source-verification.txt`. `build_acceptance.py` derives reports and supports `--verify`. See README for Mac setup and opt-in QA flags.

Release state: **WIP / PARTIAL COMPLETION**, not a release candidate.
