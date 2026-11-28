# Sprint 01 QA / acceptance evidence

## Source-backed scope

- 97 official character records and 118 decision entries are checked by `npm run verify:source`.
- 207 historic test **specifications** are copied in `data/rules/tests_207.json`, not implemented as assertions and not claimed as PASS.
- Actual Sprint 01 test code: `tests/kernel.test.mjs`, executed with `node --test` after TypeScript compilation.
- Sample `reports/test_results.txt` is the captured runner output, not a manually typed pass assertion.
- No full character skill engine was executed. All effect tests run *namespaced fixtures* and test the transport-independent kernel contracts.

## Traceability by kernel mechanism

| Test set | Domain source / gate | What is executed |
|---|---|---|
| Source integrity | 97 official roles, VH/v1.2/Q13, Source G0 | Cardinality, official character SHA, 118/207 indexes and frontend file hashes |
| State machine | VH33, lifecycle design G1 | Allowed transitions, invalid transition, day/round boundary, blocked victory |
| Character assignment | ROOM-01/02, Q13-04 | Unique initial Character IDs, unknown ID, room participant count |
| Submission / target | PH-01, Q13-02 design, G1 | Membership, phase, target, payload and resource admission |
| Idempotency | G1 architecture | Same request idempotent, conflicting payload/action IDs rejected |
| Action priority | VH08 (framework only) | Technical fixture priority independent from HTTP request arrival |
| Actor death / lock | PH-01, VH10, VH41 (mechanism only) | Valid accepted action survives actor death; explicit lock cancels queued action |
| Resource | Q13-01 (mechanism only) | Reserved vs spent balances, no double charging |
| Random | Q13-06, Q13-11 (domain constraint only) | Seeded HMAC, domain sorting, reproducible draws, no empty fallback |
| Atomic failure | F02/F05/F15 | Full batch rollback on unsupported effect, missing rule or target status change |
| Visibility | VH57/62, PRIV-01 (framework only) | Server projection hides other roles and seed, private event ACL, historical audience fail closed |
| Replay | G1 deterministic event contract | Hash chain, snapshots, DB restart, RNG verification, tamper detection |

## Reality check / gaps

24 tests are runtime **kernel checks**. They do not validate actual PH/VH character implementation nor imply that 24 of the 207 old specifications have been faithfully ported. Most text-only specs contain compound skills and conditional outcomes; converting them into golden fixtures is a future Sprint 02–03 task and may require scoped business confirmation.

### Not implemented or not tested

- External HTTP auth, concurrent Socket.IO clients, horizontal-scale locking, database failover and PostgreSQL transactions.
- Actual role-specific attack/guard/resurrection, the 97-role interaction matrix and full victory resolver.
- Real action scheduling, user interactions, AFK timers, team-specific/group chat permissions in changing game state.
- Actual postgame chat replay; production role pack rule priority DAG, independent domain-event replay (current replay applies committed-state event payloads).
- Load/performance tests or security penetration tests.

## Acceptance decision

**PASS for scoped Game Engine Kernel:** TypeScript build, in-process SQLite transaction, stable submission and queue, seeded RNG, event replay, member-scoped projection and fail-closed unresolved rules. **NO-GO for competitive full match mode** until official character packs and victory rules are validated and the network/auth layer is integrated.
