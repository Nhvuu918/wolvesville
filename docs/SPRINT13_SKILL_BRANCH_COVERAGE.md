# Sprint 13 — Official Skill Branch Coverage

- **R = 18/97** verified executable-role coverage (11 inherited + 7 new). Each new role has actual Game Session actions and a passed server integration test.
- **F = 0** certified full-character implementations. Partial role branches remain.
- **S exact = NOT CERTIFIED.** At least 19 distinct executable technical branches across the inherited and S13 verification. The 145 audit rows include composite skills: treating this as 19/145 *official atomic skill coverage* would be mathematically incorrect. Atomic branch enumeration is an outstanding task.
- **A/B/C = 6/6/0** based on independent 6-game real completion evidence re-executed this Sprint. Seven new S13 decks deliberately do **not** count as A, B or C.

| Role | Branch | Source | Test status |
| --- | --- | --- | --- |
| 11 | maintenance-vs-nightmare | character.json#11, VH08 | PASS / authoritative / replay |
| 16 | antidote | character.json#16 | PASS / authoritative / replay |
| 16 | delayed-poison | character.json#16 | PASS / authoritative / replay |
| 24 | jail-block-and-defense | character.json#24,VH79 | PASS / authoritative / replay |
| 66 | three-use-guard-attack-defense | character.json#66,VH34 | PASS / authoritative / replay |
| 67 | two-shield-defense | character.json#67,VH35,VH70 | PASS / authoritative / replay |
| 59 | day-injury-next-night-lock | character.json#59,VH31 | PASS / authoritative / replay |
| 17 | public-day-judgment-wolf-permanent-lock | character.json#17,SYS-10,VH57 | PASS / authoritative / replay |

Restrictions: no new general death chain, automatic competitive win, or complete single-role feature is claimed.
