# Feature status / blockers

| Feature | State | Evidence / boundary |
|---|---|---|
| Official source integrity | VERIFIED | `npm run verify:source` |
| Kernel regression | EXECUTED_PASS | Original 24 tests |
| Auth, login/logout, user profile/public ID | IMPLEMENTED_VERIFIED_SQLITE | API + 11 backend tests |
| Room create/join/leave/host/lock | IMPLEMENTED_VERIFIED_SQLITE | Atomic SQLite commits; no overbook |
| WS sync, reconnect, member ACL | IMPLEMENTED_VERIFIED_LOCAL | 2-client network test and CLI demo |
| PostgreSQL schema and migration | IMPLEMENTED_UNVERIFIED | Docker/pg not available in sandbox |
| PostgreSQL room transaction | IMPLEMENTED_UNVERIFIED | `tests/postgres.test.mjs` awaits Mac run |
| SQLite Engine persistence/replay | PRESERVED_REGRESSION_PASS | Sprint 01 tests |
| PostgreSQL Engine state/event migration | DESIGN_DRAFT_ONLY | `003_engine_postgresql_schema_DRAFT.sql`; not wired |
| Room->Game ID, role assignment, bot seats | NOT_IMPLEMENTED | Sprint 02B |
| Game action API & filtered secret game state | NOT_IMPLEMENTED | Sprint 02B |
| Official Wolvesville skill adapters | NOT_IMPLEMENTED | Sprint 02C; `RULE_UNRESOLVED` |
| Victory and full gameplay E2E | NOT_IMPLEMENTED | Sprint 02C |
| Production-grade WebSocket transport | NOT_IMPLEMENTED | restricted local WS; use maintained package later |
| Official UI data binding | NOT_IMPLEMENTED | approved frontend unchanged |

## Rule and source blockers

All existing 22 findings and rule-specific uncertainties from the Readiness Audit still apply. New Sprint 02A service does not manufacture skill outcomes, role abilities or victory conditions. The three outstanding boundary cases (no fake result domain; witch + revival seed; censored vote's Oscar exception) remain outside the activated rule set. **No official character skill can be executed through the backend at this stage.**
