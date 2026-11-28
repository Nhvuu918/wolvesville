# Human QA v1.7.28 — pending owner execution

Use Node ARM64 >=22.13, local SQLite, current QA flags as README. Four independent browser profiles, four verified accounts. Create a four-seat room, join all four, lock and select the QA deck. Host is a normal participant; roles are assigned server-side. Do not modify database or expose secret states to other players.

## QA-SOUL-01 [8,23,25,36]
1. #36 submits fireball on #23, resolve night. Publicly dead #23 appears dead; its own pending state persists.
2. Open and close vote with no ballots. #23 cannot vote. On night 2 only #23 receives secret revival, two bullets; other screens still show death.
3. #36 protects #8, #23 shoots #8. Resolve: #8 survives, #23 has one bullet. Open and close vote, #23 cannot vote.
4. Night 3 #23 shoots #8; resolve. Village wins, no third bullet. Replay is verified. Restart local server at a phase boundary to check state and retry.
5. Separate game: both #36 and #8 submit lethal attacks on #23 in the same night; #23 does not revive next night; public death appears once.
6. Separate game: #36 kills #8 while #8 kills #23; victory without opening another night.

## QA-TRAP-REV-01 [8,10,25,26] with B/B flag
1. #10 places trap on #25; #8 kills #25. Resolve night; no trap consumption.
2. Advance day, #26 revives #25; resolve. #25 publicly returns; restart SQLite server if desired.
3. Advance day, #25 inspects #10. Resolve. Private aura Thiện (inverted); next valid inspection normal Ác. No other player receives the result.
4. Separate game: #25 submits inspection before #10 submits trap on #25 in the same night; phase ordering applies trap first.
5. No support claimed for trapped #26 revival or other inversion classes.

## QA mixed pack
Follow retained `reports/v1.7.26/HUMAN_QA.md`. No new production rule activation.

## QA-SOUL-02 — second death after secret revival (new, opt-in QA)
1. In a new game [8,23,25,36], #36 uses fireball on #23 while #8 attacks #25. Both seats appear dead after resolution. Keep the mage and knight alive.
2. Open/close voting without ballots. Next night, only #23 sees secret revival, two bullets and no vote entitlement.
3. On #8's screen, both publicly-dead seats can be selected; neither indicates actual hidden life. Select the #23 seat and submit. Resolve: #23 sees DEAD_FINAL; no second public elimination announcement, no public role or secret-revival event. The match continues because #36 and #8 survive.
4. Next night #8 selects the already-final-dead #25 seat: the attempt has the same accepted status and no public effect. Confirm no duplicate deaths and verified replay, retry idempotency and restart at the night boundary.
5. The blind-target mechanic is limited to #8 in this QA deck; not yet an approved universal policy for finite-cost skills, voting, or normal gameplay.
