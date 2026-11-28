# Wolvesville Sprint 02 — recommended backlog (not implemented in Sprint 01)

## Release boundary

**Sprint 01: technical kernel only.** Do not attach approved frontend client JS directly to raw `EngineService.getInternalState`. Real-world auth/authorization and frontend game experience belong to separate work items.

## Sequenced next increments

1. **S02-01 — Transport and authority.** Expose authenticated, versioned HTTP/Socket.IO endpoints through existing Wolvesville account/room services (from the separate Foundation v0.1), enforce server-side viewer identity and room membership; add multi-client API integration tests.
2. **S02-02 — PostgreSQL adapter.** Implement `GameRepository` using PostgreSQL transactions and a Prisma schema or parameterized SQL. Add identical repository-contract tests for both SQLite and Postgres; plan migrations and outbox delivery.
3. **S02-03 — Official rule adapter schema.** Pin immutable ruleset version, signed character registry hash, resolver source references and golden fixtures. Introduce action/event DTO validation at the network boundary.
4. **S02-04 — Dependency-aware DAG resolver.** Add explicit rule-based precedence edges, cycle detection, fan-out/causal closure and phase checkpoint support for Witch window and deferred effects. DO NOT use role ID/request order as a gameplay priority.
5. **S02-05 — Authorized small role pack.** Select a deliberately minimal combination of characters with verified source/expected state; implement true skill adapters, unit tests, 3–5-character interaction tests and visibility fixtures. Gate on zero unexplained `RULE_UNRESOLVED` for that specific allowed deck.
6. **S02-06 — Timers, disconnect and AFK.** Durable timeouts, failover, PH-03 two total missed required actions, PH-04 / Q13-02 eligible target selection; add simulated clock tests.
7. **S02-07 — Victory and safe match completion.** Implement actual per-team/individual win predicates only once independently sourced, track VH03/VH58 and coexistence with pending revival. Until then the kernel rejects match-completed transition.
8. **S02-08 — Safe UI adapter.** Read the approved frontend design unchanged and add a separate adapter layer / game shell consistent with its design tokens; no redesign of source-approved UI.

## Exit gates

- New network tests prove identity cannot be spoofed and raw events never reach non-admin clients.
- Postgres adapter proves rollback on unresolved effects, idempotency and replay equivalence.
- Every enabled real skill has Rule ID → Skill ID → Scenario ID → executable test → expected state provenance.
- The locked playable deck and victory predicate set are explicit, not the entire 97-role catalog by default.
- Any remaining ambiguity is a bounded `RULE_UNRESOLVED` with actionable source and error code, not a guessed outcome.
