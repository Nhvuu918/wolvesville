# Human QA — PENDING

Use ARM64 Node >=22.13 on Mac. Run npm install, verify:source, build, rules:build. Separate databases for normal and QA. See README v1.7.34 for exact commands.

- Normal `[8,25]`, `[8,74]` etc: lobby ready state, room start, vote and night resolve, reconnect, winner and replay. All 12 existing normal compositions retained; no new group role allowed.
- QA `s15-final-revenge` `[25,33,74,84]`: #84 silences #33 at night; verify day public composer disabled but reads allowed; vote still possible, reconnect restores state, next night expiry. This is existing bounded gameplay, not FULL.
- QA `s15-deep-jester` `[25,28,79]`: verify once-per-match cancellation; no hanging after canceled vote; later legal hanging; role result private to #79. Multiwolf and director are not available.
- Technical subsystem only: `npm run test:24:new` (trusted persisted grant fixture) and `browser_s24_group_transport_e2e.py` through the standard isolated browser runner. Do not manually seed a user/production database or treat fixture as live recruitment. UI for group grants cannot be reached via a normal room yet.

Native Mac installation, PostgreSQL Live, and owner Human QA have not been executed in this environment.
