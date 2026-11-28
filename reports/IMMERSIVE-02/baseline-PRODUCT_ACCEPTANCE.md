# Product acceptance P01–P35
Status is for the entire requested scope, not just tested subsets. PASS in a subset does not mean the whole product group is E2E PASS.

| ID | Group | Status | Evidence / missing |
|---|---|---|---|
| P01 | App shell/lobby | PARTIAL | Navigation and existing lobby; new browser routes pass; full visual redesign pending |
| P02 | Authentication/profile | INTEGRATION VERIFIED | Real register/login, profile edits, token restoration; full account settings/journey pending |
| P03 | Avatar/cover/bio/media | INTEGRATION VERIFIED | API validates WebP dimensions, persists restart; browser built-in avatar and bio; image crop upload UI not E2E |
| P04 | Friends/requests | E2E PASS | Core search/request/accept on two real browser accounts; block/remove API scope separate |
| P05 | Presence/invitation | INTEGRATION VERIFIED | Friend presence and invite API; invitation room navigation not E2E |
| P06 | Newsfeed/social | PARTIAL | Posts, likes, comments, privacy E2E/API; media/reaction notifications and moderation missing |
| P07 | Statistics dashboard | NOT IMPLEMENTED | No fabricated stats |
| P08 | Character statistics | NOT IMPLEMENTED | Pending valid-match aggregation |
| P09 | Top 5 friends | NOT IMPLEMENTED | Pending real shared-match aggregation |
| P10 | Achievements | NOT IMPLEMENTED | Pending award/idempotency criteria |
| P11 | Match history | PARTIAL | Own-match list and empty history API; completed-match UI unverified |
| P12 | Match detail/replay | PARTIAL | Participant-authorized detail API; existing game replay verified; new history detail path not E2E |
| P13 | Notification center | PARTIAL | Social badge/realtime friend request UI, API marking read; preferences/other categories pending |
| P14 | Room full notice | PARTIAL | Host notification persisted in normal run; all-player/UI delivery incomplete |
| P15 | Ready check | PARTIAL | Inherited ready check exercised in Normal suite; new UX/notifications pending |
| P16 | Host progress notices | NOT IMPLEMENTED | No new progress notification pipeline |
| P17 | Room creation/discovery | PARTIAL | Existing create/join verified; new discovery design pending |
| P18 | Random wheel | PARTIAL | Existing random assignment; requested new wheel UI not completed |
| P19 | Game room layout | PARTIAL | Actual stage/HUD/action CSS adjustments, real Normal browser; full redesign pending |
| P20 | Role panel | PARTIAL | Existing own role, presentation adjustments; full redesign pending |
| P21 | Action panel | PARTIAL | Real action flow regression; full redesign pending |
| P22 | Live voting | PARTIAL | Existing Normal vote flow exercised; new voting UX not complete |
| P23 | Night/day results | PARTIAL | Real guard/Bell/endgame; new narrative results UI incomplete |
| P24 | Match character encyclopedia | PARTIAL | Existing role composition/codex; dedicated in-match UX not complete |
| P25 | Character wheel/codex | PARTIAL | Existing 97-role assets and codex kept; new wheel/codex experience incomplete |
| P26 | Chat experience | PARTIAL | Existing authorized channels unchanged; new chat UX not completed |
| P27 | Themes/audio | PARTIAL | Existing assets/themes preserved; all-theme and audio acceptance not repeated |
| P28 | AI rule knowledge | PARTIAL | Public corpus 97+118+50, source lookup; full effective-rule precedence not implemented |
| P29 | AI assistant integration | PARTIAL | Real source lookup API/UI PASS; optional provider adapter not live verified |
| P30 | Database persistence | PARTIAL | SQLite verified, PG migrations and adapter present; PG live pending |
| P31 | Realtime synchronization | PARTIAL | Friend request and gameplay WS tested; full social/outbox recovery pending |
| P32 | Responsive/accessibility | PARTIAL | 390px profile no horizontal overflow; other screens/themes/accessibility pending |
| P33 | Performance | NOT IMPLEMENTED | No new performance benchmark/optimization acceptance |
| P34 | Security/privacy | PARTIAL | Scoped API, block, media validation, no hidden-state context; comprehensive audit pending |
| P35 | Local startup | PARTIAL | Linux build/start PASS; clean network install and Mac native pending |

## Journeys
A: PARTIAL — registration/login, edit profile and token restoration E2E; actual image/cover API tested, full logout/login journey not tested.
B: PARTIAL — request/accept/realtime E2E; invite API only.
C: PARTIAL — publish/like/comment E2E, friends/privacy and persistence API, comment/reaction notifications missing.
D: PARTIAL — room/create/join/ready/start E2E; host room-full row verified, requested host/participant notices incomplete.
E: PARTIAL — actual Normal gameplay including action, private observation, guard, vote and endgame; all new game-room UX scope not complete.
F: PARTIAL — endgame/replay existing verified; new match detail and statistics pending.
G: PARTIAL — source lookup E2E; live AI not tested.
H: PARTIAL — token restoration/social, completed game reconnect Normal; broader recovery pending.
I: PARTIAL — mobile profile width at 390px only.
J: PARTIAL — SQLite restart persistence API; PostgreSQL and whole-system backup/recovery pending.
