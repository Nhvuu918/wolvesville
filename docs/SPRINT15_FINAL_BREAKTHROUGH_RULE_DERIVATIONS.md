# Final Breakthrough — rule derivations

## character.json#88, character.json#28, VH03, VH65, S11-V03

Hunter marks a player each night; actual killed or hanged Hunter pulls marked player; Jester wins on own real hanging only.

Apply secondary death on same-round mark before terminal check; never count secondary death as hanging; dead target no duplicate.

Limits: Protection-free verified decks only. Stale mark fails atomically, no arbitrary duration; no general village winner.

Evidence: `tests/sprint15-final-breakthrough.test.mjs`.

## character.json#33, VH03, VH65, S11-V03

Hanged Trickster may select a villager to die.

Private pending response after actual elimination, choice/skip, block premature advance, atomic chain closure and replay.

Limits: All other players villagers, no secret-faction oracle. Mixed factions and competing death effects not enabled; no inferred village win.

Evidence: `tests/sprint15-final-breakthrough.test.mjs`.

## character.json#93, character.json#94, VH74, P04, WIN-03

Partner true death converts exile to wolf; pack may bite up to two; no stacking above two.

One current wolf only: one authoritative submission with 1 or 2 distinct targets; close all deaths before existing parity predicate.

Limits: Only two new decks, no hidden faction selection, no other defenses, multi-wolf consensus, post-conversion aura or retained seal behavior inferred.

Evidence: `tests/sprint15-final-breakthrough.test.mjs`.

## character.json#87, VH64

Pharmacist sees all wolf bite victims; one flask rescues one person.

Reuse preliminary death window; one victim per flask, includes own pending life (no source self exclusion), no final death revival.

Limits: Self-rescue is a logical derivation, not a separately approved owner rule; only pack bite, no other damage classes or overlapping rescue.

Evidence: `tests/sprint15-final-breakthrough.test.mjs`.

## WIN-03, VH03

Wolf parity or majority wins only with no contesting third faction; village majority continues.

Reuse existing wolf parity after stable chain, no generalized village predicate.

Limits: No source-confirmed terminal village condition; #8/#9 counterexample remains, no last-survivor default.

Evidence: `tests/sprint15-final-breakthrough.test.mjs`.
