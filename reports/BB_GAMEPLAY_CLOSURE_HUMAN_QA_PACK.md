# Human QA — 1.7.24-s15-gameplay-closure-wip
Build fingerprint: `611eda16bbcf0f48530cc6174c03912206578aefd857f236fe255bf4bd066d52`.

Owner policy BB-REP-NEW-01=B, not an active official 1.3.4 ruleset. Human QA PENDING. No manual API or database changes.

## Setup (Mac Apple Silicon)
ARM64 Node.js 22.13+; extract ZIP, open Terminal at root, run `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`.

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/gameplay-closure-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```
Open local URL printed by server; use separate browser profiles, register different accounts, join room, lock, select QA deck and start. Server assigns roles. For normal play use separate database, set all QA flags to 0. No native Mac acceptance has yet been performed.

## QA-MIXED-01 — Bầy Sói sau chuyển phe (6 accounts)
Deck “QA B/B — Bầy Sói sau chuyển phe” [48,74,77,84,93,94]. Night 1: #93 must not have pack UI. #48 submits blank choice; host resolves. Open day voting, #74 votes #94; close voting. #93 becomes eligible. Night 2: #93 chooses #74 and #84, then submits blank (KEEP); host tries resolve, waiting for #48. Reconnect #93 and verify both targets still selected. #48 submits same two targets in reverse order; host resolves. Expected: #74/#84 die, wolves #48/#93 both win, no extra bite or exposed RNG rank. No #77 trap in this victory task; retaliation is tested separately in backend. Evidence: before/after conversion, waiting state, reconnect, both winners. Impact: #93 source, VH54/VH74, BB-REP-NEW-01, KEEP, archive/replay. This task is available only in local QA.

## QA-REV-01 — Hồi sinh và hành động đã nộp (3 accounts)
Deck “Kỵ Sĩ · Tiên Tri · Thầy Đồng” [8,25,26]. Night 1: #8 kills #25; resolve, close QA day. Night 2: wait until the skill UI stops loading, #26 selects dead #25 and submits revival. #8 then submits kill on #26. Resolve: #25 is alive, #26 dead; public event says #25 revived. Close day; #25 can inspect #8 next night. #8 kills #25; resolve. Expected: #8 wins, #26 cannot revive a second time, no hidden REVIVAL_SCHEDULED event shown. Evidence: target selection, resurrection, next-night inspection, final result. Impact: WV-BR-2026-1125-02, WV-A26-REVIVE, PH-01. Not a trap+revival combined test.

## QA-REL-04 — Bẫy xuyên hai cửa sổ (4 accounts)
Deck “QA B/B — Bẫy và hai bình Phù Thủy” [8,10,25,29]. Night 1: #10 traps #29, no knight attack; resolve night and empty potion window, close day. Night 2: #8 attacks #25; resolve to potion window. #29 submits rescue on #25 only. Host clicks “Chốt bình cứu, mở lượt độc”. Trap remains active, public death has not been announced. Reconnect #29, submit poison on #10, resolve. Expected: #25 dies once, #10 lives, both potions spent, mark consumed once, no duplicate effects. Evidence: screenshots before and after split, reconnect and results. Impact: NightActionGroup, BB-05=B, PH-01, privacy.

Prior QA-STAB-01 (winner/reconnect) and QA-REL-01 (unanimity) remain available in BB_STABILITY_HUMAN_QA_PACK.md; use current build fingerprint in feedback. Three new/prioritized tasks above are sufficient for this round. Do not infer any Human QA PASS from automated evidence.

## Feedback
`QA-ID | build fingerprint | PASS/FAIL/KHÁC KỲ VỌNG/CHƯA RÕ/CẦN CẢI THIỆN UX | phase/step | expected | actual | screenshots/logs`.
Stop at failing phase; preserve evidence. Report actual results only. See BB_GAMEPLAY_CLOSURE_HUMAN_QA_FEEDBACK.json.
