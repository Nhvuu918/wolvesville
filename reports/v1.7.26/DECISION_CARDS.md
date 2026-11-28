# Decision cards — not automatically applied

## DC-PRIV-01 — post-resolution boundaries / target revoked after KEEP

Source: WV-RD-BB-2026-01 (DEC-BT-01, BB-01, BB-02, BB-03, KEEP), SYS-05/06, VH62. Current live `pack.ts` records blind receipts; secret rejection is not a valid choice. If a formerly valid choice becomes ineligible before lock, `lockPack` returns TARGET_REVOKED internally and OWNER_APPROVAL_REQUIRED, without an attack. No fallback is authorized. #93/#94 conversion and redirect are especially relevant.

Counterexample: A submitted target X while X was a legally attackable villager. X changes allegiance before lock; A sends empty. B submits X. KEEP and unanimity alone do not state whether a revoked old choice counts as a completed response with no valid choice, or whether the window must remain open for a new selection. Do not let a secret rejection reason be sent to ordinary players. Options for owner review only:
- A: require a new choice if a retained target becomes ineligible; generic request for re-selection, without revealing reason. Consider whether this reveals an event indirectly.
- B: count response as received; no attack unless all still have an identical legal target set; no automatic replacement.
- C: separate rule explicitly defines public post-resolution feedback for revocation and the information that pack members are permitted to receive.

Keep existing fail-closed behavior until a decision. Normal lawful public deaths can be observed and inferred from; no blanket suppression of public outcomes.

## DC-TRAP-01 — same-night placement vs already executed actions

Source: DEC-BT-02, BB-05, BB-PENDING-03, SYS-02, VH08. The source fixes grouping of valid actions in a night and persistence, but staged live QA intentionally excludes same-night placement/guard or potion execution. Counterexample: investigation has already executed before placement, then a second investigation is accepted in another window. Determine exactly which actions may be inverted and whether an already reported result can be revised. Options: prospective-only after placement execution; group-wide only for actions not yet resolved; explicitly specified retroactive effects if owner authorizes them. No retroactive rule is activated here. Where the existing approved phase dependencies already determine ordering, implement without requesting a new rule.

## DC-TRAP-02 — revival and trap mapping

Source: character.json#10/#26/#23, VH73/VH76/VH82, BB-04/05. A saved preliminary death and actual resurrection are different effects. No source-backed inversion of all revival classes is established in the current mapping. Example: #26 already marked revives X who died in a prior night: (A) suppress resurrection, (B) revive then apply an explicitly defined counter-effect, (C) another owner-defined mapping. Resolve using approved sources if sufficient; do not treat any proposed option as a rule. Separately preserve any already-defined mark retention through death/revival when implementing the real combined deck.

## #23 technical blocker, not a decision request for already established law

`data/character.json#23` + VH82/VH06: first death is public; next night secret revival with two bullets; no vote after first death; second death final; waiting counts in Village for victory and cannot force a new round once a win is reached. Legacy Excel text conflicts with VH82, use VH82. `s13-mechanics.ts` deliberately excludes #23 as a lethal target; implementing only a shield or a public `PLAYER_REVIVED` event would be wrong. Need secret-life lifecycle, protected recipient-only feedback, resource and per-night action validation, two distinct death cycles, correct victory count, and real browser/restart/replay evidence. The exact interpretation of any additional interaction not already settled should be isolated, not used to defer the established branch.
