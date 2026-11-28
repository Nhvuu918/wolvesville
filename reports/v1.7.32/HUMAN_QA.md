# v1.7.32 Human QA — PENDING owner execution

Use Node ARM64 >=22.13 on Mac, `npm install; npm run verify:source; npm run build; npm run rules:build`, `mkdir -p local`, then run the local QA command in README. Create four independent accounts in four browser profiles. Lock the room and select the indicated QA deck. No database editing; each participant sees their own identity. Normal mode must reject the new QA-only decks.

## S22 dual swap [25,28,37,74]
- Both seers target #28. #37 swaps #28 and #25. Resolve night.
- #25 receives aura Thiện; #74 receives exact role #25, original requested seat is #28. Neither observer gets the other observer's private result; other players do not see swap/internal results.
- Open and close voting without a hanging. Next night both inspect #28 again without a fresh swap: #25 sees Không xác định; #74 sees #28. The old swap no longer applies.
- Vote to hang #28; actual hanging gives #28 victory. Verify replay and reconnect. Repeat with a restart after submitting night actions; no duplicate action.

## S22 third-faction revival [8,25,26,28]
- Night 1 #8 targets #28. #28 dies, no hanging victory, game continues. End day with empty vote.
- Night 2 #26 chooses #28 to revive. Restart before resolution if desired. After resolution #28 is alive with original role and faction; public revival announces only player ID/name, not role or faction. No extra revival charge.
- Day 2 vote for #28; actual hanging gives #28 victory, replay verifies. There are two deaths and one revival, not duplicate death records. Repeat with retry and reconnect.

## Regression
Use normal [8,25] and [8,74] to check reconnect/handoff; previously certified [8,10,25,26] for trapped medium; prior Soul and Mixed Wolf scenarios. New pack boundary policy is not approved: do not attempt to activate it. Human QA is not counted PASS until actual owner execution. No certificate is issued by this checklist.
