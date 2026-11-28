# BLOCKED branches — official Wolvesville v1.3.1

## How the kernel handles uncertainty

Production has an **empty RuleRegistry**; every real role skill returns `RULE_UNRESOLVED`. An official skill is not enabled merely because it is mentioned in `character.json`, a spreadsheet or a test scenario. Fixture skills run only with an explicit `allowFixtures=true` server configuration.

At action submission, missing adapters reject without queuing. If an adapter disappears before resolution, or a fixture hits an unresolved effect/target/deadline, the entire resolving transaction is rolled back. Queued commands and committed game state are preserved; a separate audit-failure row records the error. No guessed result is used to continue.

| Audit ID | Branch | Current gate |
|---|---|---|
| F01 | #51 Người Lái Đò's anonymous dead-chat vs VH57/VH77/VH79 | No role-specific DM implementation; `RULE_UNRESOLVED` |
| F02 | #10 Sói Kỹ Sư false-role output, locked deck has no different role | Empty RNG domain ⇒ `RULE_UNRESOLVED`; no fallback |
| F03 | #97 seed state after Witch saves preliminary death | No seed/cure real resolver; blocked |
| F04 | Kẻ Vu Khống #6 when vote is cancelled by #79 | No Oscar/vote real resolver; blocked |
| F05 | #10 inverse of multi-effect skills | No blanket inverse operator; blocked |
| F06 | Multiple independent victory/death-link predicates | No actual link resolver; blocked |
| F07 | Independent win predicates for all third-faction roles | No actual VictoryResolver; `GAME_COMPLETED` blocked |
| F08 | Initial unique roles / transformed current duplicates | Initial uniqueness implemented; transformations remain blocked |
| F09 | #17 x2 Q13-01 and VH85 | Only data model; no role-specific buff runtime |
| F10 | #49 once-per-match cap VH25 | No role-specific resource policy |
| F11 | #76 nightmare timing VH41 | Generic lock fixture; no official ability |
| F12 | #26 revival exceptions VH73/VH76 | No revival role pack |
| F13 | Tiên Tri #25 old aura-only test conflicts with official role investigation | Test data retained; not used as an executable role oracle |
| F14 | #93 mute across chat groups vs VH57 | No real chat resolver; deny unknown access |
| F15 | Cross-role multi-step priority DAG and counter-attack interactions | Technical queue only; no official per-skill DAG |
| F16 | #12/#13 teamName is 'Không rõ' in source | Original metadata preserved unchanged |
| F17 | SMU classification percentages vs actual random probability | No conversion of SMU '100%' into a probability |
| F18 | 207 textual specifications not yet executable | Copied as reference only; 24 kernel runtime tests added |
| F19 | One-person room + AI with 97-role uniqueness and win predicates | Only initial 1–97 participant state seeded; no valid match start checking role balance |
| F20 | Generic reflect loop cap lacks verified official source | No real reflect chain implemented |
| F21 | Four QA-alias legacy tests with unverifiable provenance | Not promoted to executable expected rules |
| F22 | Nineteen SYS-alias legacy tests without verified 118-decision mapping | Not promoted to executable expected rules |

This is a **branch-level gate**, not a declaration that all 97 character descriptions are invalid.
