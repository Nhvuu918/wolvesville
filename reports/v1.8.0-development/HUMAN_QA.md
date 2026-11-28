# Human QA — PENDING

Use macOS arm64 Node 22.13+, npm install, npm run verify:source, npm run build, npm run rules:build. Separate SQLite DBs for normal and candidate. See README.

1. Normal 4 accounts, create and lock room, choose s28-bell-leader; #64 pair two other seats, #48 double bite both, #64 sees two roles privately and match ends. Repeat with #64 killed alongside a marked seat: no observation.
2. s28-bell-linked: #15 links the pair, #64 marks both. Vote out one, chain kills both; only #64 sees both. Next vote #15, village win. Replay/reconnect.
3. s28-bell-revival: #8 kills #25, #26 revives #25 next night. #64 pair #25 and #26, #8 kills #25 again; #64 sees #26 once, village hangs #8. Replay.
4. Candidate (not normal) WV_OWNER_CULT_QA=1 + official test mode: 4 accounts s27-cult. #90 recruits #25 as #84 mutes #25, public chat denied, group chat allowed. #74 outsider sees no group. Reconnect, recruit other living players, win. Candidate five-seat and mirror eight-seat domains via documented HTTP integration tests, not full UI certification.

Do not use candidate flags in production. No new FULL issued. PostgreSQL and native Mac execution remain unverified here.
