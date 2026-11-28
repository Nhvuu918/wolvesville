# Graphics source integration — v1.7.35

Authority: full v1.7.34; active 1.3.3. Never imported B's Sprint07 engine, schema, rules, authentication, replay or demo logic. ZIP CRC and SHA-256 checked: main `2b77938cea4b53c8bb37ae46eeee62a51166134bb4e8355457222c2afa5f72d6`; graphics `f2f9df3287ca3b5b3f2cba05a2ced0d642177cb3362a6e5f73cdc3e2e2fee140`. Inventory and per-portrait provenance JSON retained. Graphics archive includes Apple resource forks; none imported. A has 101 assets already identical by SHA-256 to baseline; preserve all. No graphical design preview is a game.

| Component | Source | Current | Decision | API/event | Result |
|---|---|---|---|---|---|
| Original village, title artwork, 97 portraits, redhood | A assets; B approved reference | approved frontend original + frontend/assets | PRESERVE | room list, self projection | inherited artwork kept intact; screenshots |
| Rich 97 SVG chibis | B frontend/assets/portraits | frontend/assets/illustrated/{id}.svg | ADAPT | Character Registry; own authorized role | 97/97 unique files, passive SVG audit; internal style and numeric label removed; legacy original kept |
| 16 theme tokens | A style.css | same baseline style.css | MERGE | theme preference only | retained all 16; new integration.css panel/control overrides and nav; preview all in Codex, not whole-app verification |
| A app/index | A app.js,index.html | latest app.js/index.html and integration.js | ADAPT | auth/rooms/character APIs | no copy of demo auth/game simulation; new role portrait and honest landing copy |
| B integration.js/.css, player-ux.js/.css | Sprint07 frontend | current integration.js/.css, player-ux.js/.css | MERGE contract, not old runtime | current ACL, game projection, feedback, vote, replay | responsive panels, own role, reconnect, reduced motion, persistent terminal panel |
| B codex-data.js / codex.css | Sprint07 | existing current codex-data/css | PRESERVE + ADAPT presentation | 97 current character registry | grid/wheel verified, detail selected but standalone detail below viewport not captured |
| B animation-dispatcher.js/.css | Sprint07 animation modules | current player-ux.js and integration CSS | ADAPT | committed authorized projection + events | role, day, night, vote, completion; private generic event cue, dedupe, no state mutation |
| B sfx-engine.js | Sprint07 | current existing audioCtx, state.sfxVolume | ADAPT | user-unlocked context, committed cue | optional short cue; no forced playback; acoustic listening acceptance pending |
| Source C 15 diagrams, README, event catalogue | gameplay-flow-handoff | reports/v1.7.35/graphics-handoff | REFERENCE ONLY | current API/event crosswalk | all 17 Markdown/JSON files copied byte-identically; preview HTML not deployed |
| A/B local fake rooms, fake role/death/winner, old auth | old demo | integration server authority | REJECT as runtime authority | real backend | inherited demo renderer only used as presentation; all seats neutral, all authoritative outcomes from server |
| Sprint07 database/backend/dist/old evidence, MAC metadata | B | current backend | REJECT | n/a | not copied; no runtime DB |

## Handoff crosswalk

01–03: Sprint07 says final hanging/normal endgame BLOCKED; current existing Normal Game Session supports 12 admitted decks and actual vote/hanging and victory for tested deck [8,25]. No general all-role claim. 04/06: action acceptance versus resolution remains separate; skill capability, target and outcome authorized by server. 05: original intent-only vote restrictions not transplanted; active V02/V03 permits own change and white ballot within supported normal modes. 07/08: death and victory now server commits in admitted decks; no visual inference. 09/10: existing authentication, room, codex, HUD, chat, endgame and lobby return; profile route exists but not screenshot verified; unsupported history/statistics/features remain locked. 11/14: current UI only cues authorized events/projection; ACTION_ACCEPTED represented by receipt UI, not public animation. 12: keep authorized self, private feedback, no seed or raw archive. 13/15: old early-night endgame remains historical; actual normal voting journey exercised in S25, not replaying old screen capture.

## Event-to-visual map

| Current source | UI effect | Boundary |
|---|---|---|
| Game view new game + own self | own card and generic role-received notice | no role assignments of others |
| Phase DAY_DISCUSS/NIGHT_COLLECT/DAY_VOTE_COLLECT | background and immediate text cue | committed projection only |
| ACTION_ACCEPTED receipt | own feedback panel | no outcome before resolution |
| ROLE_OBSERVED / SEER_AURA_OBSERVED | generic private notice plus existing authorized feedback | only client authorized event stream |
| VOTING_CANCELLED | generic authorized notice | no inference of target/role |
| PLAYER_ELIMINATED/PLAYER_REVIVED | generic committed notice + public state | no killer or hidden life |
| completed view | result panel from winnerIds | no frontend win evaluation |
| reconnect/hydration | sync snapshot and suppress toast replay | no animation-based rules |

## Acceptance limits

Two new visual suites PASS. 51 real PNG including four viewports each lobby/room/night, 16 theme previews on Codex. No visible broken `<img>` and no top-level document overflow at sampled capture points. Mobile banner clips despite no whole-document overflow. No complete contrast, focus order, per-theme gameplay, full replay timeline, before/after matched run, role-reveal modal capture, or all-state screenshot inventory. Profile/history not captured; live group chat from recruitment not available. Native loopback blocked; actual server via project's existing bridge. Screenshot evidence is scoped, not full visual acceptance.
