# Human QA — pending owner execution

Use Node ARM64 >=22.13 and README v1.7.31 local QA setup with both `WV_OWNER_DC_QA=1` and `WV_OWNER_BB_LIVE_QA=1`. Create **new** games; old games deliberately retain old behavior.

| ID | Deck | Steps | Expected |
|---|---|---|---|
| QA-DC-SOUL-02 | [8,23,25,36] | Fire #36 at #23 N1; advance through vote without hanging; N2 #36 shields #25, #23 shoots #25; next night shoot #25 again. | After N2, #25 alive, one bullet left; after N3 #25 dead, zero bullets, no third shot; other players cannot see secret revival event. |
| QA-DC-TRAP-02 | [8,10,25,26] | N1 #10 traps #26 and #8 kills #25; N2 #26 revives #25. | #25 stays dead, one use consumed, mark consumed once at dawn, no duplicate death or public revival. |
| QA-SOUL-01 | [8,23,25,36] | #36 kills #23 and #8 kills #25 N1; #8 attempts dead #25 N2, then #23 N3. | All publicly-dead non-self seats selectable for #8, no second action same night; no new death of #25; #23 final death remains private; finite fire not expanded. |
| QA-TRAP-REV-01 | [8,10,25,26] | N1 trap #25, kill #25; N2 untrapped #26 revives #25; N3 #25 inspects #10. | #25 revived, mark retained, inverted inspection once. |

PACK-KEEP new candidate is not live enabled; no Human QA game advertised for revoked-secret target. All human QA remains PENDING. No public deployment.

New QA-VH73-WOLF: [8,10,25,26], new game only, both QA flags set. N1 #10 traps #25, #8 kills #10. Advance to N2; #26 revives #10. Expected: same player/role/faction, exactly one trap use remains. N3 #10 traps #26, #8 kills #10 again. Expected: one revival and two distinct closed death cycles, no role/cause in public revival event, replay verifies for all players. Do not treat this as a normal gameplay deck or all-faction certification.
