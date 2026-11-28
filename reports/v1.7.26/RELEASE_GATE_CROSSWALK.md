# Official v1.3.4 — required gate crosswalk

All policy decisions remain OWNER APPROVED; activation NOT AUTHORIZED. Evidence is current-source only where named in `acceptance.json` and `focused.log`. Historical evidence is under `BB_PRIVACY_STABILITY_*` and is not current acceptance.

| Gate | Rule / implementation / test | State / remaining exit condition |
|---|---|---|
| Rule consistency | 14 B/B records; `data/rules/owner_bb*`; `verify:source`, `rules:build` | Registry integrity PASS; runtime consistency PARTIAL; resolve DC cards and dependencies |
| Authorized projection | SYS-05/06, VH62; `engine/visibility.ts`; new live privacy test | Bounded backend PASS; timing/global revision/postgame remain |
| Mixed pack privacy | PACK-PRIVACY-01; `privacy-acceptance.json` | PARTIAL; all 12 surfaces and browser must pass |
| Membership changes | BB-03, BB-REP-NEW-01; `pack.ts`, `live-profile.ts`; new state test and existing live conversion test | State/known live branches PASS; lawful mid-window transitions not complete |
| Representative order | BB-REP-NEW-01; `representative-order.ts`, `engine/replay.ts`; existing B/B tests | Bounded backend PASS; scoped Mixed Wolf browser PASS; remaining browser obligations |
| Consensus | DEC-BT-01, BB-01/02/03; `pack.ts`; BBv2 01–04 and live pack | Bounded backend PASS; additional live membership interactions |
| SAME/RESOLVE | Owner rules; `runtime.ts`; live mixed retaliation tests | Bounded backend PASS; remaining defense/death interactions |
| Persistent trap | DEC-BT-02; `trap.ts`, `official/engineer-trap.ts`; live trap tests | Bounded backend PASS; same-night/revival scope |
| NightActionGroup | BB-05, BB-PENDING-03; `night-action-group.ts`, `live-witch-domain.ts`; cross-window B/B tests | Bounded #29 backend PASS; other mappings |
| Same-night interaction | TRAP-04; `live-profile.ts`; staged deck restrictions | BLOCKED; complete approved order or resolve DC-TRAP-01 |
| Trap + Revival | TRAP-05; VH73/76/82; `official/revival.ts`, `trap.ts` | BLOCKED; actual combined deck + defined inversion/retention + replay |
| Death-chain | VH03, VH06, VH82; `stable-death-proof.ts`, `s13-mechanics.ts`; 12 medium/mage tests | Existing branches retested; #23 secret lifecycle missing |
| Resource/Cooldown | BB-04/05, PH-01; `runtime.ts`, `live-witch-domain.ts`; B/B guard/witch tests | Bounded PASS; missing revival and same-night scope |
| REST/WS | `game/coordinator.ts`, `multiplayer/server.ts`; B/B live tests | Bounded PASS; scoped Mixed Wolf browser PASS; timing, post-resolution, other browser obligations remain |
| Frontend | `frontend/integration.js`; browser manifest | Build source present; Mixed Wolf browser accepted via bridge; remaining suites pending |
| SQLite restart | `game/archive.ts`, `multiplayer/sqlite-store.ts`; B/B live tests | Bounded PASS; missing new role domains |
| Historical Replay | `engine/replay.ts`; focused tests and full regression | Server ledger unchanged; current full regression see acceptance |
| Critical Browser | 72-suite/107-obligation inventory; runner unchanged | Current source status from `browser-results.json`; no fabricated PASS |
| Regression | `tests/*.test.mjs`; `acceptance.json` | See actual completed TAP and exit code; PostgreSQL skips do not count as pass |
| Human QA | `HUMAN_QA.md` | PENDING; requires owner evidence |
| PostgreSQL | live test files; DATABASE_URL | PENDING for production; no live DB supplied |
| Official activation | `data/rules/owner_bb_v1_3_4_effective_registry_preview_rep_new_01.json` | BLOCKED; no automatic effective-date or activation, requires release gates and separate authorization |

Feature Readiness: PARTIAL; competitive production: NO-GO. No certificate/metric increase from QA-only evidence.
