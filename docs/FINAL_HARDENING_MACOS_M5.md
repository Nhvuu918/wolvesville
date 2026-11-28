# Wolvesville v0.5.1 — macOS Apple Silicon (M5) Setup

## SQLite quick start (no PostgreSQL, no Docker required)

Requirements already installed on user's Mac: Node 24.22.3, npm 11.19.1, VS Code, Docker Desktop. No reinstall required.

```bash
unzip Wolvesville_Sprint_03_Final_Hardened_Interactive_Lobby_Full_Source.zip
cd Wolvesville_Sprint_03_Final_Hardened_Interactive_Lobby_Full_Source
npm install
cp .env.example .env
```

`.env.example` defaults to:

```dotenv
DB_PROVIDER=sqlite
DATABASE_URL=
WV_ENABLE_DEMO_AUTH=0
WV_OFFICIAL_RULE_TEST_MODE=0
WV_INTEGRATION_TEST_MODE=0
PORT=3212
HOST=127.0.0.1
```

For **local** Demo + two-role official test mode, set `WV_ENABLE_DEMO_AUTH=1` and `WV_OFFICIAL_RULE_TEST_MODE=1`. Never enable these automatically in production. Demo Auth is forbidden by backend when `NODE_ENV=production`.

```bash
npm run verify:source
npm run dev
```

Open `http://127.0.0.1:3212`. `npm run dev` builds TypeScript and serves frontend, backend and WebSocket on the same origin. No `DATABASE_URL` is required for SQLite.

If your shell still exports `DB_PROVIDER=postgres` from a previous session, it overrides `.env`. Run `echo "$DB_PROVIDER"` and `unset DB_PROVIDER DATABASE_URL` before testing the SQLite .env; this does **not** affect the database.

## Tests

```bash
npm run test:03:final
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
WV_E2E_DIRECT=1 npm run test:browser:final
```

`test:03:final` runs all inherited tests plus 12 hardening cases; without PostgreSQL, five inherited PG tests are SKIPPED. Browser test runner creates a temporary SQLite database and uses a free port; no existing project DB is touched. `WV_E2E_DIRECT=1` makes Chromium open the actual local server directly on Mac; without it the Linux sandbox's HTTP/WebSocket bridge is used.

## Existing PostgreSQL 16 on Docker, no reset

1. `docker ps` and `docker compose ps`: locate your **existing** container. Do not create another one with duplicate name, delete volumes, or reset the database.
2. In `.env`, set `DB_PROVIDER=postgres` and supply the **actual** `DATABASE_URL` for that PostgreSQL instance, e.g. host 127.0.0.1, port 5433, correct user, correct DB and secret (not included in this ZIP). Do not use placeholder credentials.
3. Only when needed, run the additive production migrations:

```bash
npm run db:migrate:pg:02c
```

4. Run all **isolated temporary-schema** PostgreSQL acceptance tests:

```bash
npm run test:pg:acceptance
```

If `DATABASE_URL` is absent, the required test command FAILS with exit code 1 and 0 SKIPPED. That is intentional. Existing app DB and Docker volume remain unchanged. For running with PostgreSQL use `npm run dev` after setting the provider/URL in `.env`.

## Port conflict / safe shutdown

```bash
lsof -nP -iTCP:3212 -sTCP:LISTEN
```

Do not kill a process you do not own or understand. If it is your own old Wolvesville process, stop it in its original Terminal with `Control + C`, or choose an unused `PORT` in `.env` and use that exact URL in the browser. Backend does **not** silently switch ports. `Control + C` triggers graceful shutdown.

## Supported scope

Official playable skill test pack: only Seer #25 and Mystic Seer #74, with server-private skill feedback. Room capacity settings 1–100 remain valid, but this *test pack* can start only with two players and unique roles. Full competitive/victory rules are not active. The Codex lists all 97 official roles for reference only.
