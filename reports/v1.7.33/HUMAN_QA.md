# Human QA — v1.7.33 (pending actual owner feedback)
Mac Apple Silicon: ARM64 Node >=22.13, `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`.
`DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1733-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 WV_OWNER_DC_QA=0 npm run dev`.
Open http://127.0.0.1:3212 using independent browser contexts. These are existing official QA decks, not new Normal Gameplay.
- `s15-final-revenge` [25,33,74,84]: night1 #84 mutes #33, verify composer disabled and #33 receives other players' public messages; reconnect; #33 submits blank ballot; next night #84 mutes #74; #33 restored, #74 muted. Use vote on #33 and choose revenge skip for real victory, verify replay. Public chat UI has no legitimate arbitrary group/DM feature; do not interpret absent feature as VH57 positive acceptance.
- `s15-deep-jester-peace` [25,28,79]: day1 vote #28, #79 cancels and receives role privately, no death, day2 actual vote #28 can win. Retry does not reset one-use limit. Multiwolf/Director interactions remain unavailable in this deck.
Run `npm run test:23:new` for focused backend acceptance. Native Mac, PostgreSQL and human QA not certified here.
