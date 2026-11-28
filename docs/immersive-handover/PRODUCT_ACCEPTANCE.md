# Product acceptance P01–P35
Status is for the entire requested scope, not just tested subsets. PASS in a subset does not mean the whole product group is E2E PASS.

| ID | Group | Status | Evidence / missing |
|---|---|---|---|
| P01 | App shell/lobby | PARTIAL | Navigation and existing lobby; new browser routes pass; full visual redesign pending |
| P02 | Authentication/profile | INTEGRATION VERIFIED | Real register/login, profile edits, token restoration; full account settings/journey pending |
| P03 | Avatar/cover/bio/media | INTEGRATION VERIFIED | API validates WebP dimensions, persists restart; browser built-in avatar and bio; image crop upload UI not E2E |
| P04 | Friends/requests | E2E PASS | Fresh two-account core request/accept browser pass; block/remove API scope separate. |
| P05 | Presence/invitation | INTEGRATION VERIFIED | Friend presence and invite API; invitation room navigation not E2E |
| P06 | Newsfeed/social | PARTIAL | Image posts and authorized media load, reactions/comments and dedup notifications API/browser; replies/moderation/pagination incomplete |
| P07 | Statistics dashboard | PARTIAL | Career endpoint and dashboard from completed committed matches; period/scope filters and win/loss/faction/role/activity metrics. No full chart suite, resurrection/death counts or competitive ranking. |
| P08 | Character statistics | PARTIAL | Initial-role counts, wins, survival, resolved actions, final-role difference; not full transition history/skill effectiveness. |
| P09 | Top 5 friends | PARTIAL | Top 5 by shared completed matches, initial faction and both-win counts, first/last dates and duo streaks in API. No full relationship profile UI. |
| P10 | Achievements | PARTIAL | Five inherited thresholds implemented as derived eligibility/progress for non-demo Normal; no durable awards, award date, badge gallery, pin or notification. |
| P11 | Match history | PARTIAL | Own-match list and empty history API; completed-match UI unverified |
| P12 | Match detail/replay | PARTIAL | Completed-match authorized timeline and replay controls verified in browser; access after leaving room, filters/cinematic replay incomplete |
| P13 | Notification center | PARTIAL | Full/ready, reaction/comment and committed phase notices in DB/WS. No achievement/reply notification; deep links/preferences partial. |
| P14 | Room full notice | INTEGRATION VERIFIED | All members receive persisted room-full notice; focused API and browser journey observed; toast/audio and refill-cycle semantics not complete. |
| P15 | Ready check | INTEGRATION VERIFIED | Ready progress and host notice from actual server state; full UX not fully accepted. |
| P16 | Host progress notices | PARTIAL | Private committed phase-resolution notice; aggregate accepted status and crash-atomic delivery not complete |
| P17 | Room creation/discovery | PARTIAL | Existing create/join verified; new discovery design pending |
| P18 | Personal Wheel of Fate | PARTIAL — integrated and browser verified | Real personal rotating compass, private list, audio, public vote apply, 16-theme smoke, actual video; native refresh/large game/skill matrix/Internet acceptance pending. See reports/WHEEL-OF-FATE/ACCEPTANCE.md |
| P19 | Game room layout | PARTIAL | Three-region stage, persistent HUD, actual player seats; server phase clock for compatible new Normal; no actual deadline for manual phases; not all supported capacities/themes. |
| P20 | Role panel | PARTIAL | Reorganized own role artwork, role/faction/life/resources; cooldown and transformation journey not fully tested. |
| P21 | Action panel | PARTIAL | Existing authorized capability actions in central panel, target selection and receipts; full state model/recovery matrix incomplete. |
| P22 | Live voting | PARTIAL | Scoped public ordinary declared counts verified across multi-client HTTP/WS, change/restart/close; hidden/effective counts excluded; broad compatibility not certified. |
| P23 | Night/day results | PARTIAL | Own ledger journal grouped by round/phase, action role at acceptance, result subset and public events. Own vote journal and authorized timeline added; full summary/tabs/filters pending. |
| P24 | Match character encyclopedia | PARTIAL | In-match modal uses authorized composition; search and full ruleset-specific detail not complete. |
| P25 | Character wheel/codex | PARTIAL | Existing 97-role assets and codex kept; new wheel/codex experience incomplete |
| P26 | Chat experience | PARTIAL | Existing authorized channels unchanged; new chat UX not completed |
| P27 | Themes/audio | PARTIAL | Existing assets/themes preserved; all-theme and audio acceptance not repeated |
| P28 | AI rule knowledge | PARTIAL | Public corpus 97+118+50, source lookup; full effective-rule precedence not implemented |
| P29 | AI assistant integration | PARTIAL | Real source lookup API/UI PASS; optional provider adapter not live verified |
| P30 | Database persistence | PARTIAL | SQLite upgrade from two 02 test DBs and image restart verified. Migration 010 and PG startup/migration configs prepared; PG live pending. |
| P31 | Realtime synchronization | PARTIAL | Room full/ready server updates and existing gameplay WS; no full outage/order/multiple-tab matrix. |
| P32 | Responsive/accessibility | PARTIAL | Responsive new CSS and limited screenshots; full theme/viewport/keyboard/accessibility suite pending. |
| P33 | Performance | PARTIAL | Feed repository benchmark: 50 posts/500 comments; 51→2 SQL queries, median 3.823→3.094 ms; not whole-site benchmark |
| P34 | Security/privacy | PARTIAL | Scoped API, block, media validation, no hidden-state context; comprehensive audit pending |
| P35 | Local startup | PARTIAL | Linux build/local scoped tests; cloud startup guard/ready added; npm network install, Docker/CI, PG live and Mac native pending |


## IMMERSIVE-03 evidence
See reports/IMMERSIVE-03/acceptance.json and logs; status reflects the entire P group, not just tested subsets. FULL-5/FULL-50 frozen.

## IMMERSIVE-04 delta (all affected groups remain PARTIAL overall)
| ID | Fresh evidence / missing |
|---|---|
| P07/P08 | XP/career own UI and official game browser; complete career charts and mode classification pending |
| P09/P10 | Persisted XP, 36 personal + 5 pair definitions, titles, gallery, own pin, reward notification; invalidation/profile/animations/complete badge matrix pending |
| P13/P16 | Compatible host aggregate and persistent confirmation banner, ready and resolution notices; no universal readiness, no full notification matrix |
| P19/P21 | Waiting/confirmation and result cards, browser DEV pass; other roles still pending |
| P23 | Public closed-period summary and own bell/vote journal; result queue, comprehensive personal outcomes pending |
| P26 | Saved day/night policy opt-in, actual cult Candidate ACL/restart; Wolf runtime absent; Cupid and group browser pending |
| P30/P31/P34 | Migration 011, actual official XP restart/ACL and cult WS; PG/live upgrade/invalidation/realtime audit pending |
| P18 | Wheel files unchanged, focused math/assets regression pass; full Wheel browser not rerun |

Other P01–P35 evidence remains historical unless explicitly retested. No new metric or FULL certificate.

## IMMERSIVE-05 delta — current evidence, not complete product release
| ID | Fresh scope / limits |
|---|---|
| P01/P05/P13/P14/P15/P16/P17 | Global alerts, invitation on feed, full on career, resume/moderator outside room, custom deck and saved drafts, authorized revision, 2-account browser. Other alert types, expiry/audio/multitab, complete UX pending. |
| P02/P03/P04/P06 | Account login, new context, focused social/media regression; unified all-data browser journey and recovery pending. |
| P07/P10/P11/P12 | Own profile level/title/pins, committed official match and persisted XP; previous replay subset regression, full career/award reversal pending. |
| P18 | Wheel source preserved; fresh math/assets and browser status in acceptance.json. |
| P27/P30/P31/P34 | Account preferences/decks, server revision/ACL, restart and two SQLite migration copies; PG/live, security and all preferences matrix pending. |
| P32/P33/P35 | Mobile builder screenshot, scoped local startup/health; full responsive, performance benchmark, Mac/CI/Docker/cloud pending. |
No change to FULL-5/FULL-50. All prior untested obligations remain open.
