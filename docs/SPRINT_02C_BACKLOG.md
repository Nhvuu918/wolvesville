# Sprint 02C — official character Rule Pack, after 02B acceptance

**Gate 0:** Run Sprint 02B PostgreSQL integration tests on macOS Docker, fix any failures, verify replay/restart with real PG, and sign off transaction/authorization invariants. If PG tests are skipped or fail, 02B remains conditionally complete and 02C should not be implemented yet.

When Gate 0 passes:

1. Choose a minimal, internally consistent role set from `CHARACTER_SKILL_SPEC.md`, `RULE_TRACEABILITY_MATRIX.xlsx`, `UNRESOLVED_RULES.md` and VH/Q13 decisions. Do not select by popularity. Reject any character lacking complete allowed target/phase/effect/victory definition for the permitted match configuration.
2. Build one official `RuleAdapter` per validated skill, with explicit `ruleId`, `skillId`, `characterId`, and `ruleVersion`, cost/targets/priority, status effects and conditional branches. Register official adapters only in a separately validated role-pack configuration, never by rebranding `fixture.*`.
3. Implement victory predicates for the allowed role subset and enforce end-of-cascade simultaneous-winner rules VH03/VH58. Distinguish `ROLE_LOCKED`, `PENDING_DEATH`, `DEAD_FINAL`, `HIBERNATING`, `PENDING_REVIVAL` in tests.
4. Add scenario test traces from each official Rule ID → Skill ID → expected state / event / visibility. Run mixed interaction tests and invalid/unresolved interaction tests, not only isolated skill tests.
5. Add backend-issued action prompts/deadlines, then wire only real data/auth/rooms/projections into the **unchanged** approved frontend. Mark unsupported components clearly. Do not redesign colors, cards, map or motion.
6. Performance, TLS, maintained WS transport, shared connection broker and a native async PostgreSQL Kernel Repository can follow after behavioral correctness is proven.

**Do not ship a 97-role mixed competitive lobby until all enabled skills and victory/visibility interactions are actually verified.**
