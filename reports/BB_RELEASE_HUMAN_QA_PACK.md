# Human QA — v1.7.20-s15-release-readiness-wip
PENDING until owner feedback; only use local QA, not production. Builds are not official 1.3.4.

## Setup on Mac Apple Silicon
Install ARM64 Node 22.13+; extract the ZIP and open Terminal at its root. Run `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`.

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/bb-release-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```
Open the local URL printed by Terminal. Register each player using independent browser profiles. Create a room, join enough accounts, lock it, select the named QA deck and start. The server assigns roles; inspect each player's own view. Host uses night resolution and the QA day close control. For ordinary play use a separate database and disable all QA flags. No database edits or manual API requests.

## QA-REL-01 — Two wolves, unanimity and protection (5 accounts)
Deck “QA B/B — Hai Sói và Thiên Sứ Tuyết”. #9 shields #25; one wolf votes #25, the other has not responded. Try resolve: must wait. Other wolf agrees; first may submit blank after valid selection. Resolve: shield holds. Next night both choose one unshielded villager. Resolve to parity victory. Reconnect and check each player's own selection; villagers must not see pack submissions. Evidence: waiting, shield, victory, reconnect screenshots. Impact: consensus, KEEP, authorized projection, attack count.

## QA-REL-02 — Persistent trap and grouped potions (4 accounts)
Deck “QA B/B — Bẫy và hai bình Phù Thủy”. Roles #8,#10,#25,#29. Night 1 #10 traps #29; no knight attack. Resolve night and empty potion window, close day. Night 2 #8 attacks #25; resolve to potion window. #29 selects poison on #10 and rescue on #25, submits both separately in same window. Resolve. Expected: #25 dies once; #10 survives; both potion resources consumed; #10 sees trap consumed; other players do not see private trap status. Reconnect. Evidence: pending victims, two selections, death and reconnect. Impact: BB-04, BB-05, group resource consumption. Staged QA: trap placement only night 1; avoid trapping #8, unsupported mapping blocks resolution. Cross-window grouping and revival are BLOCKED.

## QA-REL-03 — Sole wolf two bites and retaliation (4 accounts)
Deck “QA B/B — Sói đơn độc và bẫy phản sát”. #48 is the only wolf. #77 places retaliation trap on either seer; wolf selects both seers and submits. Resolve. Expected: trapped target survives, wolf dies, other target dies; village wins including dead villager. To specifically observe first-hit retaliation followed by second-hit commit, use the browser regression (which chooses the stable first target); normal UI need not expose internal ID ordering. Evidence: selected pair, trap choice, winner screen. Impact: #48 restriction, SAME/RESOLVE, VH54, QD-01. Multiple wolves with two authorized bites is not yet supported.

## Feedback / bug intake
Reply with `QA-ID | build | PASS/FAIL/KHÁC KỲ VỌNG/CHƯA RÕ/CẦN CẢI THIỆN UX | phase and step | expected | actual | screenshots/logs`. For a failure stop at the affected phase and preserve evidence. Developer records a bug with exact build, deck, step, expected/actual, evidence and retest status; never convert a missing reply to PASS. Template: `BB_RELEASE_HUMAN_QA_FEEDBACK.json`. Human QA cannot replace automated regression.
