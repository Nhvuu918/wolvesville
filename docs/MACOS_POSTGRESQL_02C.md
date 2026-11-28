# macOS Apple Silicon (M5) — run Sprint 02C in VS Code

Requirements **already installed on user Mac**: Node 24.22.3, npm 11.19.1, Docker Desktop, PostgreSQL 16 in existing Docker container mapped **127.0.0.1:5433 → 5432**, VS Code. Do **not** recreate containers, delete Docker volumes or reset prior databases.

1. Unzip `Wolvesville_Sprint_02C_Official_Rules.zip` anywhere, open extracted folder in VS Code.
2. Run `npm install`, `npm run verify:source`, `npm run build`, `npm run test:02c:all`.
3. Local SQLite demo (no PostgreSQL needed): `npm run demo:02c`. Expect two clients, official skill, private observation, verified replay. It is **not competitive gameplay**.
4. Inspect existing PostgreSQL: `docker ps`, `docker compose ps` if you already use a Compose project. Do not execute `docker compose up` unless deliberately restoring **your existing** database.
5. Create local configuration file **not committed to Git**: `cp .env.example .env`, then edit `.env` with your **existing real** connection string `DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:5433/<database>`. Do not copy `YOUR_PASSWORD` literally, and never paste credentials into chat/logs.
6. Run `npm run db:migrate:pg:02c`. Script performs read-only authentication preflight before transactional, additive migrations 002/004/005. Does not drop volume or database.
7. Run `npm run test:pg:02c`. Strict PostgreSQL mode sets `WV_REQUIRE_POSTGRES=1`; missing URL is FAIL, not SKIPPED. Tests 02B/02C isolate their data in fresh `wv02b_test_*`, `wv02c_test_*` schemas. The legacy 02A PostgreSQL test inserts randomized local-test records; never use a production database for test execution.
8. Start backend with `.env` values: `WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 DB_PROVIDER=postgres PORT=3211 npm run serve:02c`. Health: `curl http://127.0.0.1:3211/health`.

To inspect it locally without PostgreSQL, run `WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 DB_PROVIDER=sqlite PORT=3211 npm run serve:02c`.

## Troubleshooting

- `28P01` password authentication failed: confirm password in existing Docker container's configuration; do **not** reset volume or use a placeholder.
- `DATABASE_URL missing`: export it in current terminal or add to `.env`; the helper loads local `.env` if present.
- `pg` missing: run `npm install` (the dependency is optional for SQLite but required for PostgreSQL).
- PostgreSQL tests FAIL: check actual server output without sharing passwords, and do not count them as PASS.
- Terminal hangs: inspect test process and report; tests aim to close HTTP, WebSocket and DB handles in `finally`; force-exit is a diagnostic fallback, not default.
