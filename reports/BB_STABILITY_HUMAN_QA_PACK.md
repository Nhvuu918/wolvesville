# Human QA — v1.7.22-s15-stability-completion-wip
Build source fingerprint: `35a5c2302d5f68a3c35978cf9ec2171c1d357cb16842d4a84512b9ca7f439853`.

PENDING until owner feedback; only use local QA, not production. Builds are not official 1.3.4.

## Setup on Mac Apple Silicon
Install ARM64 Node 22.13+; extract the ZIP and open Terminal at its root. Run `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`.

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/bb-official-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```
Open the local URL printed by Terminal. Register each player using independent browser profiles. Create a room, join enough accounts, lock it, select the named QA deck and start. The server assigns roles; inspect each player's own view. Host uses night resolution and the QA day close control. For ordinary play use a separate database and disable all QA flags. No database edits or manual API requests.

## QA-REL-01 — Two wolves, unanimity and protection (5 accounts)
Deck “QA B/B — Hai Sói và Thiên Sứ Tuyết”. #9 shields #25; one wolf votes #25, the other has not responded. Try resolve: must wait. Other wolf agrees; first may submit blank after valid selection. Resolve: shield holds. Next night both choose one unshielded villager. Resolve to parity victory. Reconnect and check each player's own selection; villagers must not see pack submissions. Evidence: waiting, shield, victory, reconnect screenshots. Impact: consensus, KEEP, authorized projection, attack count.

## QA-REL-04 — Cross-window group (4 accounts, same deck as QA-REL-02)
Night 1: #10 places a trap on #29, no knight attack; resolve night and empty potion window, close day. Night 2: #8 attacks #25. Resolve to witch window. #29 submits rescue on #25 only. Host clicks “Chốt bình cứu, mở lượt độc”. Confirm stage changes to poison and #10 still sees active trap. Other clients must not receive public elimination notice yet. Reconnect #29 and/or host; then #29 submits poison on #10, host resolves. Expected: #25 dies once (public only after final night resolution), #10 survives, both resources used, mark consumed once; no extra effect on retry. Save screenshots of each window, waiting mark, final death, reconnect. Impact: Article 5, NightActionGroup, PH-01, privacy and replay. Do not edit DB or use manual API. Scope: staged #29 fixture, not arbitrary cross-phase skill mapping or resurrection.

## QA-STAB-01 — Winner screen and reconnect (2 accounts, Normal Gameplay)
Stop QA server first. Use a separate local SQLite database and all QA flags disabled:
```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/stability-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 npm run dev
```
Create a 2-player room and choose the regular Kỵ Sĩ / Tiên Tri deck [8,25] (repeat with [8,74] if desired). Use independent accounts, mark ready, start. Let the knight attack the seer at night. Before the host resolves, disconnect the other player using browser network offline or close that browser tab. Resolve the night, then reconnect the other player. Expected: the result screen shows the authorized winner name and role, not the previous night panel; server-confirmed result remains unchanged after refresh. Repeat a village-win route by voting out the knight. Evidence: winner screen for both accounts and after reconnect. Impact: WV-BR-2026-1125-01 and inherited playable certificates. No manual API calls or database edits.

## Feedback / bug intake
Reply with `QA-ID | build | PASS/FAIL/KHÁC KỲ VỌNG/CHƯA RÕ/CẦN CẢI THIỆN UX | phase and step | expected | actual | screenshots/logs`. For a failure stop at the affected phase and preserve evidence. Developer records a bug with exact build, deck, step, expected/actual, evidence and retest status; never convert a missing reply to PASS. Template: `BB_STABILITY_HUMAN_QA_FEEDBACK.json`. Human QA cannot replace automated regression.
