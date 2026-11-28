# IMMERSIVE-05 — Connected World & Persistent Player Experience
Baseline IMMERSIVE-04 (fingerprint 00682453002f61eba5f12878cdbe766eaaaf4144ecd302b3ddfa576a788dda8b) verified 5447 payload hashes. No new role/full certificate or rule promotion.

- Global account alerts: current room membership, invitations, full/ready, resume and compatible moderator readiness; account socket signal plus authorized refresh. No private other-player capabilities sent. Own voting/skill attention derived from own view. No Web Push or new automatic game actions.
- Custom deck library and account collection; owner-only configuration with revision. Exact admitted multiset only; unsupported combinations saved as drafts. Add/remove/count, preset copy, favorite, duplicate, rename, delete. Existing locked roster/ready workflow preserved.
- Preferences in database, restore on account login, optimistic revision. Profile own level/title/pinned badges. Friendly labels in main paths, not complete translation audit.
- Additive migration 012 SQLite and PostgreSQL scripts; SQLite upgraded two historical test DB copies (29 tables each, all rows hashes unchanged). See migration.json and ACCOUNT_PERSISTENCE_REPORT.md.
- Focused product regression 29 tests, knowledge regression 9 tests (separate sets); browser workspace test and Wheel retest status recorded in acceptance.json. Browser uses real backend HTTP/WS via bridge. Test accounts and DB not packaged. Full regression/PG/live cloud/Mac native/Human QA pending.
- Decisions: 100 saved decks/account and 100 draft role entries; 72-char deck name/500-char description; server preferences default for accounts without stored settings; no new runtime admission; alert fallback refresh every 5s while visible. Wheel files and existing Reward Policy remain unchanged. Not all requested social, group chat, admin, AI, recovery, result queue or progression features completed.

Source fingerprint: `ab252af9e357f5109160aa2f2a04368824b83cf2ebcd3b92695fb6cabb8c8e70`.
