# Sprint 07 — Mac Apple M5 Setup / Verification

## Requirements (already installed on user's Mac)

Node 24.22.3, npm 11.19.1, Docker Desktop 4.98.0, PostgreSQL 16, VS Code, macOS 26.4. No need to reinstall tools or create duplicate Docker projects.

1. Extract `Wolvesville_Sprint_07_Full_Match_Integration_Full_Source.zip` to a private folder, `cd` into extracted `Wolvesville_Sprint_07_Full_Match_Integration_Full_Source`.
2. Run:

```bash
npm install
cp .env.example .env
# Edit .env and enable ONLY locally:
# DB_PROVIDER=sqlite
# DATABASE_URL=
# WV_ENABLE_DEMO_AUTH=1
# WV_OFFICIAL_RULE_TEST_MODE=1
# WV_INTEGRATION_TEST_MODE=0
# PORT=3212
npm run verify:source
npm run build
npm run test:07:all
npm run dev
```

3. Open `http://127.0.0.1:3212` on the same machine. User A and User B (independent browser contexts) login or use Demo CTA. Create a two-seat room, join, LOCK, choose “Kỵ Sĩ Không Đầu · Ván ngắn”, start. Server assigns #8/#25, the player who gets #8 submits target #25, host resolves Night, both see match result. When Knight does not attack, match does not auto-end. Skills are server-authorized. No frontend timing heuristic.
4. Browser E2E with installed Playwright dependencies:

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:07
npm run test:browser:07:all
```

5. PostgreSQL 16 on **existing Docker**: Check `docker ps` first, don't start a duplicate Compose stack. Put a working `DATABASE_URL` in `.env` for a PostgreSQL database where you have `CREATE SCHEMA` privilege; tests use temporary random schemas but if you cannot afford a schema to be created/deleted use a separately provisioned test DB. Run:

```bash
npm run test:pg:acceptance
npm run test:pg:05
npm run test:pg:06
npm run test:pg:07
```

`WV_REQUIRE_POSTGRES=1` is set by npm scripts. `DATABASE_URL` is loaded from `.env` by test helper. **Do not put real passwords in bug reports or screenshots**. Don't run migration commands against production or reset a volume. When PostgreSQL isn't reachable, fix the URL/container status; SQLite dev does not depend on PG.

## Safe recovery

- EADDRINUSE: `lsof -nP -iTCP:3212 -sTCP:LISTEN`; decide if own old process can be closed, or set another `PORT`, and restart. Never indiscriminately kill a process.
- DATABASE_URL missing: verify `DB_PROVIDER=sqlite` for ordinary local dev; for PostgreSQL acceptance set actual URL, not placeholder.
- Demo button disabled: verify `WV_ENABLE_DEMO_AUTH=1`, and `NODE_ENV` is not `production`.
- `Invalid credentials` on legacy `moonwalker`: use Demo button, which requests unique backend Demo sessions; do not use old prototype password.
- Browser E2E failure: run standalone `npm run test:browser:07`, preserve log; inspect backend service and Python/Playwright versions.

## Production gate

Disable `WV_ENABLE_DEMO_AUTH`, `WV_OFFICIAL_RULE_TEST_MODE` and `WV_INTEGRATION_TEST_MODE`; no official win rule applied to general player matches. No PostgreSQL pass has been recorded from this Linux sandbox.
