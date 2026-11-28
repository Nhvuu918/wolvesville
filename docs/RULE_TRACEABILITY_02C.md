# Official Role Adapter Traceability — 02C

| Character | Adapter Skill ID | Original text source | Precondition / Target | Phase, cost, limit | Priority | Effect | Visibility | Test evidence |
|---|---|---|---|---|---|---|---|---|
| #25 Tiên Tri | `official.25.inspect-role` | `character.json#25`: “Mỗi đêm bạn có thể xem vai trò của người chơi khác.” | Active actor #25; other living member in approved test pack | `NIGHT_COLLECT`; 1 per night; no consumable named in source | Stable technical order among independent read-only inspections; VH08 | `ROLE_OBSERVED` with server current Character ID | Private to actor, VH68 | `official-rules.test.mjs` cases 1–6, PostgreSQL isolated test |
| #74 Tiên Tri Huyền Bí | `official.74.inspect-role` | `character.json#74`: exact function of selected person every night | Active actor #74; other living member in approved test pack | `NIGHT_COLLECT`; 1 per night; no consumable named in source | Same | `ROLE_OBSERVED` | Private to actor, VH68 | Same |

**Boundary:** Restricted test game contains exactly #25 + #74. The game never uses hostile illusion/disguise, so no conflict with SK-05/Q13-06 trap rules. No skill outside those two will execute in this pack. PH-01 preserves accepted actions after actor death in Kernel, and the limited pack has no death effect. No Victory Resolver or competitive win check is enabled.

**Sources:** 118 merged rule decisions in `data/rules/official_merged_118.json`; original `character.json`; v1.3.1 `CHARACTER_SKILL_SPEC.md`; test execution log. The technical IDs above are not in original JSON.
