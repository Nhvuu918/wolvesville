# Sprint 10 — unresolved / next implementation register

Only open items are recorded here. Sprint 01–09 completed features are not reopened and no automatic rule decisions are made.

| Topic | Status | Root cause | Required next action |
|---|---|---|---|
| **V02** conflicting vote modifiers | BLOCKED BY RULE | Deletion/force/Huyết Ấn priority and restoration semantics not formally approved | Approve one version in `SPRINT10_RULE_POLICIES_V02_V03.md`; test collisions on the S09 #33 vote pipeline |
| **V03** vote-to-hanging | BLOCKED BY RULE | Unique top / tie / zero / one ballot / quorum / muted / abstention / vote changes not approved | Approve V03 then implement source-backed versioned adjudication, restricted role hanging and post-death outcome tests |
| Generic elimination / postdeath | PARTIAL | Not every damage cause/defense/revival/death link has complete source interaction | Extend typed cause and atomic chain **by verified role groups**, with replay / ACL |
| General victory resolver | PARTIAL | Special factions, simultaneous outcomes, revived units and independently completed conditions are role-specific | Gate additional certified packs on complete win predicates and tests |
| Multi-round completed match configurations | NOT YET CERTIFIED | S09 voting ends as unresolved without hanging; QA-only phase advance is not an official vote | Verify complete official day→night→vote→hanging→victory path after policy approval |
| Remaining characters | PARTIAL / SOURCE ONLY | 11 have at least one restricted branch, but 0 are independently certified fully implemented | Use `skill_dependency_audit_145.json` as implementation dependency map; update 97-role matrix after tests |
| PostgreSQL live | PENDING ENVIRONMENT | No running PostgreSQL service or DATABASE_URL in this environment | Mac Apple Silicon setup against *dedicated test DB*, run strict migration/rollback/restart/ACL tests |
| Graphics for hanging / full competitive | BLOCKED BY RULE | No authorized hanging event exists | Keep storyboard-only; hook when official adjudication and elimination commit are implemented |
| Browser teardown warning | NONBLOCKING QA DEBT | Async Playwright TargetClosedError appeared while closing a passed 3-client suite in aggregate run | Investigate teardown lifecycle; assertions and process exit were PASS; do not hide traceback |

**Current next milestone:** Once V02 and V03 are confirmed, wire a **versioned official Vote Adjudication policy** to day elimination (with proper role exemptions and postdeath chain) and advance Metric B by a real SQLite + Browser E2E verified vote-to-elimination-to-victory match. Keep experimental code separated from official match.
