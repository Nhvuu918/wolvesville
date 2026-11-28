# DC-SOUL-01 finite damage scope — SOURCE_SCOPE_PENDING

Source read: `data/character.json` #8/#23/#29/#32/#36/#43/#54/#67/#78 and `data/rules/skills.json` corresponding skill IDs; `data/rules/official_merged_118.json` LIFE-01, VH06, VH82, PH-01, VH09, VH13; `data/rules/owner_dc_decisions_20261125.json`. LIFE-01 permits a second lethal attack and cancellation of pending secret revival, but does not designate every skill or prove that all public-dead seats are selectable. The owner choice DC-SOUL-01 explicitly limits designation.

| Skill | Source | Public-dead targeting |
|---|---|---|
| #8 night attack | WV-CH08-S01, LIFE-01, existing QA | Designated bounded QA, one attempt per night; unchanged |
| #23 two bullets | WV-CH23-S03, DC-SOUL-02, VH82 | SOURCE_SCOPE_PENDING; public-living non-self only in owner QA |
| #29 poison | WV-CH29-S02 | SOURCE_SCOPE_PENDING |
| #32 three shots | WV-CH32-S01, VH09 | SOURCE_SCOPE_PENDING |
| #36 two fireballs | WV-CH36-S01, VH13 | SOURCE_SCOPE_PENDING |
| #43 two sniper shots | WV-CH43-S01 | SOURCE_SCOPE_PENDING; "any player" does not explicitly settle public-dead attempt/consumption |
| #54 single shot | WV-CH54-S01 | SOURCE_SCOPE_PENDING |
| #67 sword | WV-CH67-S02, VH35/VH70 | SOURCE_SCOPE_PENDING |
| #78 meteor | WV-CH78-S02, VH43 | SOURCE_SCOPE_PENDING |
| Other finite, granted or transformed damage (including enhanced skills) | role-specific Character Specifications | No blanket designation; require exact skill-level review before opening |

No new SHARED-23 runtime code this turn. Existing tests for #8 attempts, #23 friendly-fire, secret revival, two bullets, protection, persistence, replay and victory were retained and must be revalidated on this fingerprint. The QA deck has no wolf, so cannot claim #23 shooting an actual wolf. No arbitrary extra character authorization added. Wider defense/chain classes and secret status across transport remain incomplete. Do not alter Normal Gameplay or activate v1.3.4.

Additional source audit: #2 water bucket gated by collected attributes; #4 granted one bullet; #7 Oscar-sacrifice attack (and separate reactive double); #22 granted two bullets after transfer; #24 one prisoner-only bullet; #38 one-use acquired soul attack; #59 lethal second stone with cap; #65 poison modifies later pack protection; #75 one-time frenzy; #90 sacrificial attack; #96 finite poison production. All remain SOURCE_SCOPE_PENDING for public-dead targeting. Source conditions such as prisoner-only, previous mark, grant/transfer, resource availability, and reactive damage must be preserved, not flattened into generic blind attack. #15 per-person uniqueness, #30 periodic wolf target and #39 vehicle state impose separate constraints; no new designation. #10/DC-TRAP-02 is an inversion of a valid action, not a grant of new attack target rights. #7 reactive death, #53 death link, #68/#88 death reactions and linked deaths must not be confused with a selectable public-dead target. This audit is not exhaustive certification of every transformed role/skill; any future designation needs exact code and source.
