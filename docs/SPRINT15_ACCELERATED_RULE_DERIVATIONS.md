# S15 accelerated — derivation records, v1.7.4 WIP

This is additive; no edit to the 118 historical decisions, 207 legacy specifications, 97 character definitions or the owner #25/#74 override. Gameplay is scoped to explicit QA decks, not competitive. New actions require the same authoritative validation and transactional commit as inherited adapters. All references are local source references; no other Werewolf rules imported.

| ID | Premises and classification | Executable conclusion and counterexample | Boundaries / missing dependency |
|---:|---|---|---|
| 3 | VERIFIED character.json#3 + S15-OWNER-SEER-01 | #25 sees Thiện; #74 still sees actual role. Deck includes second wolf #49 to avoid last-wolf premise; fail closed on aura if that wolf is no longer alive. | Functional-role investigation; renunciation/last-wolf conversion and wolf team engine absent. #49's global skill is not exposed in this four-seat deck. |
| 15 | VERIFIED character.json#15 (one target dies; last player wins); VH03 stable-chain closure | One target dies, no link created. Sole-survivor win is DERIVED from explicit predicate and confirmed closure. Self-target is rejected in this QA deck. | Two-target secret links, once-per-target across rounds, wolf immunity, broader targets/protection. |
| 29 | VERIFIED character.json#29, VH60 | One poison use per match; valid shield prevents death but consumes poison; invalid phase/self/duplicate retry rejected. | ENGINEERING: WITCH_WINDOW placed after night resolution in closed decks without preliminary deaths; not a complete rescue pipeline. Rescue, notification of initial death, both potions and protection order outstanding. |
| 58 | VERIFIED character.json#58, VH03 | Same faction => private faction result; self + different faction => only other dies. Sole survivor wins after stable closure. Counterexample: duplicate/single target rejected. | No two non-self different-faction targets in current deck; broader protection, wolf immunity, cross-faction victory outstanding. |
| 71 | VERIFIED character.json#71 and VH38; DERIVED from owner aura-only #25 and role #71 aura Không xác định | Disguised living target has aura Không xác định in current and later rounds. Exact-role #74 absent from deck; no distortion inferred for that role. | Day mass killing, immunity, removal, death interactions not covered. |
| 77 | VERIFIED character.json#77 and VH51 | Trap blocks one lethal knight attack and counter-kills attacker; victim lives. Public event contains only victim player ID, not skill or source. | VH54 pack representative, multi-protection precedence, wolf frenzy and village victory not implemented. |
| 93 | VERIFIED character.json#93, VH10, VH57 | Seal blocks current-night skills and the following public day chat/vote. Separate vote restriction rather than assuming mute stops voting. | Other skill types and conflict with passive #94, partner death/transformation/pack bite, nonpublic channels not certified. |
| 94 | VERIFIED character.json#94, S15-OWNER-SEER-01 | While alive, #25 result for #93 is Thiện. No role mapping exposed. | Redirection to doll, death/cycle handling, passive disable interaction not certified. |
| 8/9/25/28/74 | VERIFIED inherited restricted knight/snow/jester predicates, official V02/V03, #74 read-only role inspection | DERIVED five additional explicit deck scopes with identical voting and victory predicates; #74 information has no effect on life/vote state. Durable multi-client tests validate tie/blank and winner branches as applicable. | This does not certify all possible branches for any deck or arbitrary team victory. |

ENGINEERING: reuse typed action/effect registry, status lifetime, consumption and death-chain closure; store events transactionally; no client-side rule computation. Rule IDs and sources are recorded in the source and S15 coverage report. No proposed rule extension is included in the metrics. No random selection mechanic was added in this batch.

## Dependency backlog (ranked engineering priorities, not rules)

| Rank | Dependency | Unlocks / rationale | Risk / remaining prerequisite |
|---:|---|---|---|
| 1 | Preliminary death + rescue + atomic protection | #29 rescue, #87 heal, #24 execution and other pending life effects; enables fuller roles | High; resolve timing and layer interactions from source, then test death and victory |
| 2 | Shared final death / multi-death / secret links | #15 two-target link, #58 double death, #94 redirect, #23 resurrection; more completed matches | High; cycles, pending effects, protection and victory |
| 3 | Wolf team action and faction victory | #3, #49, #72, #52, #77, #93 and village wins; largest FULL dependency | High; pack composition, target selection, representative and transformation |
| 4 | Resource modifier and private notifications | #11 upgrade, #17 blessing, #36 shield, #66 observation | Medium; avoid unconfirmed stacking |
| 5 | Role-specific investigation and distortion | #3 functional-role query, #71 exact-role conflict, #72/#49 cross-inspection | Medium; rule provenance and authorized result schema |
| 6 | QA branch matrix and live DB | F/C certification, PostgreSQL, browser coverage | Medium; explicit per-branch tests and live PG environment |

Dependency graph: skill -> validation/capability -> action queue -> status/protection/inspection/death -> stable closure -> predicate -> authorized event -> persistence/replay -> UI. Any missing stage blocks a FULL certificate, not necessarily a narrow executable branch. The 97-row readiness matrix preserves provisional source groups; no full role is certified.
