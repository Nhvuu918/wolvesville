# IMMERSIVE-02 — checkpoint

Source fingerprint: `79d494ee52642633fe5cf48e22f1e84421eb9bcc85fc6a21cb47d8b45267c454`. Baseline IMMERSIVE-01 verified; preserved 5187 paths; historical F=1/97 frozen. No fresh FULL certification.

## Changes
- Three-zone game room and persistent HUD; authorized role/actions, journal, in-match codex, voting progress and own ballot only. No fake deadline or public target tally.
- Room full notices for all and ready notice for host; SQLite persisted 4+1 records in fresh game journey.
- Career from final committed ledger; actual DEV Normal match yields 1 match/1 win for guard, official Normal remains 0. Five inherited relationship thresholds, derived eligibility only; no persisted award or notification. Initial faction used for pair stats; final role changes are not a count of all intermediate transitions.
- No new migration; existing schema 009 reused. No game rule change. Historical reports preserved.

## Fresh verification
- Focused API/unit: 6 pass, 0 fail. Build and source check PASS (system dependencies, not clean network install).
- Game browser: PASS; social browser: PASS. Actual Chromium using repository HTTP/WS bridge. First game run failed navigation allowlist; fixed and rerun. DEV test database only, not competitive.
- Monolithic: INCOMPLETE; exit 124, {"observedPass": 370, "observedFail": 0, "observedSkipped": 11}. If incomplete, observed subtests are not overall acceptance.

## Remaining
Full Game Room scope (random stage, server deadline, all capacities/themes, accessibility, host progress), durable achievements, richer stats/charts, full day/night/vote journal, social media/replies and moderation, completed-match detail/replay viewer, AI effective knowledge and live provider, PostgreSQL live, migration of user DB, performance benchmarks, Mac-native and complete QA still pending. Existing history detail projection timestamp/sequence issue remains. No new competitive release. No background tasks at delivery.

See `docs/immersive-handover/HUMAN_QA.md`, `PRODUCT_ACCEPTANCE.md`, `SESSION_HANDOVER.md` and `reports/IMMERSIVE-02`.
