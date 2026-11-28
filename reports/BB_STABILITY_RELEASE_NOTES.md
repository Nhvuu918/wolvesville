# Stability completion — v1.7.22 WIP

## Scope
Active 1.3.3 unchanged, proposed 1.3.4 still CANDIDATE. Owner record WV-RD-BB-2026-01 and all 13 choices retained. No activation. Finite release contract in BB_STABILITY_RELEASE_SCOPE.json; actual run results in BB_STABILITY_ACCEPTANCE.json. Mandatory in-scope interactions are not removed to achieve release readiness.

## Root cause and correction
`frontend/integration.js`: completed projection used to become visible in JavaScript before the DOM was refreshed, waiting on auxiliary feedback/events. A real REST reconnect case with feedback held reproduced TERMINAL_REST_RENDER_GAP before the correction. Render a newly accepted terminal projection immediately and ignore late resync responses for another opened game. This demonstrates a real defect matching the prior symptom, not proof that the historical incident followed exactly the same network sequence. See diagnostic-winner-before.log and final matrix. No deadline or winner assertions changed.

## Evidence added
`tests/sprint15-bb-live.test.mjs`: empty rescue/poison windows and invalid rescue do not consume mark; restart, later valid poison-only window consumes once. `tests/sprint15-normal.test.mjs`: both five-player rescue decks, two resources, self-rescue, status expiry, dead pharmacist no phantom rescue window, QD-01, restart/replay. Initial ROOM_OFFLINE fixture errors corrected by connecting actual participants. No new official R/F/A/B/C or atomic counts awarded; no general B/B runtime expansion in this build. Five-player reduced-roster exhaustive obligation coverage remains incomplete.

## FULL closure
Previous contracts and evidence retained. Selected independent five-player resource/status branches to reduce certification debt; no new full role meets all existing obligations. #39 still lacks co-win with other third parties; #9/#31 need further source-backed protection interactions; #10 needs same-night activation, revival and other applicable mappings; #25/#74 need remaining interference interactions, including source-backed exceptional roles. #87 needs cross-domain sedative/rescue coverage. Do not add hypothetical requirements or count a scoped test as global FULL.

## Pending release decision (only if new entrants are admitted)
Article 3 and current representative-order.ts rank initial wolves. For a converted wolf (#93 or another lawful faction change), an initial order entry is absent. Source does not unambiguously determine its rank. Options: (A) pre-record a server-RNG reserve ordering of non-wolves before the match, use after ranked initial wolves if eligible; (B) generate a full roster ordering before the match and always filter to eligible wolves. These differ in priority for a newly converted wolf. Recommendation A preserves precedence of the initial pack and avoids mid-game reshuffling, but is not approved. Neither is applied. Conversion decks remain outside enabled B/B QA; no new policy for any of the 13 already-approved choices.

## Verification
Use the existing runner, with the same 69 suites and 104 version obligations, no exclusions. `npm run test:15:stability`; `npm run test:browser:15:bb-official:matrix -- reports/local-stability-shard --shard=1/4`; `python3 reports/s15-stability/build_reports.py --verify` from source root. The scorecard distinguishes historical certificates and current revalidation. Human QA and live PostgreSQL pending.
