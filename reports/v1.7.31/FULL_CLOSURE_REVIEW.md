# FULL candidate selection and closure evidence

Sources: `reports/BB_PRIVACY_STABILITY_ROLE_CLOSURE_TRIAGE.json`, `reports/BREAKTHROUGH_COMPLETION_CONTRACTS.json`, `reports/BB_PRIVACY_STABILITY_COMPLETION_CONTRACTS.json`, v1.7.30 FULL_CLOSURE_REVIEW. All historical mandatory obligations remain. The inherited ranking starts 9,25,26,31,64,74,36,87,5,39,10. The primary choice is #26 because VH73/VH76 give clear target eligibility and a bounded trap/revival runtime already exists; extending a missing wolf interaction has a lower immediate integration cost than implementing the new theft/piercing or disguise adapters for #9/#25. This is an engineering choice, not a replacement for the audited rank or a certification threshold.

| Role | Missing obligation | Rule source | Code/test | Status |
|---|---|---|---|---|
| #26 | WV-A26-REVIVE: preserve identity/faction/resources, minimal public PLAYER_REVIVED | VH73/VH76, PH-01, VH03 | revival.ts, s13-mechanics.ts, engine/service.ts; sprint21-revival.test.mjs; browser_s21_wolf_revival_e2e.py | Bounded Dân and Sói QA; wolf #10 live path extended |
| #26 | BT-26-2: dead any faction, exclude #46/#47/#53 | VH73/VH76 | eligibleRevivalTargets in revival.ts; sprint21-revival.test.mjs | Wolf path PASS; third-faction live scenario and actual excluded-role domain PENDING |
| #26 | BT-26-GLOBAL-0: authorized phase / target / resource checks | character.json#26, VH73/VH76 | existing revival-capability and validation | Bounded QA only; no global target authorization |
| #26 | BT-26-GLOBAL-1: privacy, restart, persistence, replay and frontend for all mandatory classes | VH62/VH68/VH77, character.json#26 | sprint21-revival.test.mjs + browser_s21_wolf_revival_e2e.py | Scoped public revival, restart, replay and browser PASS; global privacy and full domain PENDING |
| #26 | BT-26-GLOBAL-2: victory and death chain | VH03, QD-01, VH06 | stable-death-proof.ts, victory-resolver.ts; sprint21-revival.test.mjs | two closed death cycles and ongoing game PASS, complete all-faction victory/death-chain coverage PENDING |
| #9 | BT-9-2 piercing/theft and global domain | VH42/VH72 | existing snow implementation | no new code, retained |
| #25 | BT-25-2 unknown aura, reflection, concealment | SYS-25, #35/#3 | existing inspection and trap code | no new code, retained |
| #74 | BT-74-2 false role/disguise and global domain | Q13-06, character.json | existing inspection | no new code, retained |
| #31 | BT-31-2 trap/piercing and global domain | VH42, BB-04 | existing guard | no new code, retained |
| #64 | BT-64-1 linked/revival death observation | character.json#64 | existing bell-rules.ts | no new code, retained |
| #36 | BT-36-1 and global protection, death-chain, secret revival | VH12/VH13/VH82/LIFE-01 | existing soul/mage code | no new implementation |
| #23 | finite target scope, wolf shot, other defenses/links, privacy | DC-SOUL-01/02, LIFE-01, VH82 | existing soul code | no new implementation |
| #10 | broader inversion classes, complex death-chain and global scope | DEC-BT-02, BB-04/05, DC-TRAP-02 | existing trap code + S21 wolf revival | wolf revival preserves spent trap use, new evidence; not full |

**No new FULL certificate.** #26 cannot claim FULL until third-party revival, exclusions in the real runtime, full phase/action/domain checks, privacy and mandatory interaction/victory classes are supported. A four-player QA deck is not a universal contract. The new runtime specifically enables #8 to target #10 in the existing opt-in trap-revival deck, not a new normal game or blanket damage authorization. The prior policy continues to reject that target in its archived domain.

Privacy issue for full #26: `eligibleRevivalTargets` filters IDs by true role (#46/#47/#53), currently unreachable in admitted revival decks. If a later deck includes those roles, omission of a publicly dead seat could disclose an excluded hidden role. VH76 defines the exclusion, but the current source does not establish whether a blind revival attempt on an excluded role would spend a use or what may be reported privately. Do not introduce blind revival, fake success, or a public list that silently leaks the exclusion. Resolve the target/receipt policy and death-chain of those roles before admitting them. This is a remaining full-domain issue, not a proven leak in the bounded deck.
