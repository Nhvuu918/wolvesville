# 1.7.18-s15-owner-bb-finalization-wip

Baseline: v1.7.17 owner B/B preparation, ZIP SHA-256 02a13802d179d4de54a08e9e30a6c0d5c23255e365a6d3c037461d2591c03664. Published version remains wolvesville-official-v1.3.3. This is a bounded unpublished lab, not a new official rule version.

## Owner selections
See `data/rules/owner_bb_candidate_v2_decisions.json` for exact selections and provenance. BB-01=B (hold until all eligible respond), blank KEEP, BB-02=A (full set consensus), BB-03=A (recompute eligible roster, immutable pre-ranked representative order), SAME, RESOLVE, BB-04=B (direct lethal inversion), BB-05=B (all executed actions in the sealed group).

## Implementation
- `owner-bb-v2/pack.ts`: same-target set comparison, keep last valid choice, missing response holds window, all responded but unequal sets = no bite. Current roster selected from trusted entitlement provider. Representative order is fixed before match; replacement is first eligible in that supplied order. Two sealed attacks share representative. No deadline or random fallback invented.
- `owner-bb-v2/runtime.ts`: executes bounded candidate attacks on a copied GameState, reuses official protection layer helpers and closed death proof, preserves second attack after first kills representative, deduplicates death, direct inverted guard/rescue bypass guard/snow and preliminary rescue; fails closed on unknown mandatory chains, unknown statuses, unsupported stacking/rescue windows. Does not evaluate winner or progress official phase. The direct inverted-rescue case finalizes a pending death once, not a permanent revival prohibition.
- `owner-bb-v2/trap.ts`: waiting mark persists, only executed valid actions trigger, group is sealed by trusted caller, applies supported transformations to all actions and consumes mark once, unknown effect aborts whole group, private info and deterministic RNG. BB-05 group boundary in the bounded adapter is actor/round/phase; multi-window and unsupported multi-effect cases still pending.
- `owner-bb-v2/journal.ts`: distinct v2 SQLite event table and stream names, commit candidate state/effect/mark/event in one journal transaction; replay verifies hashes and recomputes reducers. Does not commit official Game Session archive. Historical v1 reducers and table untouched.
- `owner-bb-v2/gateway.ts`: authenticated QA session shadow commit, host receives receipt only, independent users submit own selections; official archive unchanged. Pack gateway refuses queued official actions. Trap gateway reads actual accepted queue; `trap-night.ts` reuses official phase transition, priority ordering, validation, inspection/judgment evaluation and #5 usage tracking. This bridge resolves the existing [5,10,25,74] QA deck on a copied state, not a multi-night live candidate room. V2 journal's TRAP_NIGHT_COMMIT is one shadow commit per match; multi-night persistence/group tests exercise the separate trusted group reducer.

## Release gates not met
No public REST/WS route for v2 and no live official adapter. Trusted lab entitlement/representative source not a production allocator. No combined pack/trap live transaction with official database; no general death chain, multi-shield priority or mixed rescue window integration; no browser E2E for new candidate; PostgreSQL live not tested. Official #10 first-night restriction is unchanged. No new FULL, C or R metric claimed. Do not enable candidate in normal gameplay or alter historical replays. No release of v1.3.4.

## Reproduce (Mac ARM64 Node >=22.13)
`npm install`; `npm run verify:source`; `npm run build`; `npm run rules:build`; `npm run test:15:owner-bb:v2`.
Legacy browser runner after Python Playwright setup: `node scripts/s15-breakthrough-browser-matrix.mjs reports/local-bb-v2-run browser_s15_deep_engineer_e2e.py browser_s15_approved_pin_e2e.py browser_s15_approved_revenge_e2e.py browser_s15_normal_guard_e2e.py`.
Do not reuse result directories from older fingerprints. For full matrix omit suite names and use `--shard=i/n` in a distinct directory per shard. Current gate results in `reports/OWNER_BB_V2_ACCEPTANCE.json`.
