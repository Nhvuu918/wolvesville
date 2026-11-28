# Ruleset release readiness — v1.7.20

Official ACTIVE: `wolvesville-official-v1.3.3`. Proposed `wolvesville-official-v1.3.4` remains DRAFT; `data/rules/owner_bb_release_readiness_draft.json` is not a registered/effective ruleset. The ten approved B/B choices are unchanged in `data/rules/owner_bb_candidate_v2_decisions.json`. No approval is inferred from test success.

| Archive/profile | Read/replay semantics | Migration policy |
|---|---|---|
| 1.3.2 historical | Original rule version and event log | Preserve existing bytes; archived regression flag only |
| 1.3.3 official | Unchanged binding and normal registry | No migration, no retroactive B/B |
| candidate-v1/v2 | Existing separate journal reducers | Preserve both streams |
| owner-bb-live-pack-qa-v1 | Bound QA profile, existing one-target fixture plus bounded sole-#48 two-target fixture | Existing archive contract; no conversion to official |
| owner-bb-live-trap-qa-v1 | Bound QA profile, bounded #29 potion group added | Existing archive contract; no conversion to official |
| proposed 1.3.4 | Not effective/registered | New sessions only after release approval, rule binding and complete acceptance; never relabel older archives |

No database schema changes in this checkpoint. Compatibility evidence: BB_RELEASE_BACKEND_REGRESSION.json and BB_RELEASE_BROWSER_RESULTS.json, only completed obligations count. No PostgreSQL live verification. Do not activate v1.3.4 until pending policies, remaining interaction classes, effective registry, official version binding, full regression, privacy and owner approval gates are closed. Historical QA archives must never be promoted by rewriting their version.

## Finite completion blockers (no new certificates)
- #10: staged live domains now cover delayed marks, inspection, guard inversion and #29 same-window potion group. Missing resurrection with active mark, same-night ordering combinations, unsupported target skill mappings, multiple-window #87 and death-chain with linked/retaliatory roles. No official B/B version active. Relevant paths: engine/service.ts, official/engineer-trap.ts, official/s13-mechanics.ts; tests/sprint15-bb-live.test.mjs.
- #25/#74: bounded B/B inversion implemented, but other source-backed interference/role identity interactions and official version acceptance remain; refer to BREAKTHROUGH_COMPLETION_CONTRACTS.json. #5 retains VH84.
- #31: guard history and inversion implemented in bounded QA; official complete interaction acceptance and multi-layer protection still incomplete.
- #87: distinct ability windows; cross-window grouping BB-PENDING-03, revival/death-chain interactions still open. #29 same-window tests cannot certify #87.
- Wolf pack: one-target two-wolf and sole-#48 two-target retaliation live; multi-wolf extra entitlement, order and missing-response policies remain open. Cannot grant #48 two bites with another living wolf.

## Normal Gameplay deck closure contracts
[25,31,48,74]: two existing guard acceptance tests cover 35 initial-night guard/bite combinations, cooldown, skip, self shield, guard death, voting ties/blank/change/retry, handoff and restart. Still need full reduced-roster attack/guard target and voting equivalence, subsequent night resources, terminal and reconnect/replay evidence across those branches. See tests/sprint15-owner-bb-guard-acceptance.test.mjs. No C increment.
[9,25,48,74,87] and [25,31,48,74,87]: existing completed gameplay tests and browser journeys are not exhaustive. Need legal rescue target set/skip/retry and resource exhaustion, first/second attacks and protection consumption, every reachable living roster, voting outcomes and victory/death chain, restart and reconnect per applicable branch. See tests/sprint15-normal.test.mjs and normal_rescue/normal_guard_rescue browser suites. No C increment.
