# macOS Apple M5 (arm64) — Sprint 02B using VS Code + Docker Desktop

Supported local environment: macOS 26.4 / arm64 / Apple M5, Node.js 24.22.3, npm 11.19.1, Docker Desktop 4.98, PostgreSQL 16. The provided source was built/tested here on Node.js 22.16 with SQLite. PostgreSQL test was **not** executed here; follow the steps below on your Mac.

## Step 1 — Extract and baseline

```bash
mkdir -p ~/Projects/wolvesville
unzip ~/Downloads/Wolvesville_Sprint_02B_Room_Game_Integration.zip -d ~/Projects/wolvesville
cd ~/Projects/wolvesville/Wolvesville_Sprint_02B_Room_Game_Integration
code .
node --version
npm install
npm run verify:source
npm run test:02b:all
npm run demo:02b
```

The script `npm run demo:02b` starts an actual local HTTP server, connects **two real WebSocket clients**, creates a room, starts a test session, prints each player's *own* assigned role in the developer terminal, submits one `fixture.protect` action and verifies replay. Nothing is fake UI and **nothing is a real official character skill**.

## Step 2 — Inspect existing PostgreSQL before creating anything

```bash
docker info
docker compose ps
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Ports}}'
```

If the existing Wolvesville PostgreSQL 16 container is already mapped to **127.0.0.1:5433**, **reuse that container**; do not create another instance or volume. If there is no PostgreSQL running and port 5433 is free, `docker compose up -d postgres` uses the existing repository's unchanged `docker-compose.yml`. Check available ports first. Do not use `docker compose down -v` (that deletes volume data).

## Step 3 — Explicitly migrate PostgreSQL (non-destructive)

Review the URL and ensure it points to **your Wolvesville development database**, not an unrelated project. Replace the sample password with your actual local value:

```bash
export DATABASE_URL='postgresql://wolvesville:local_only_change_before_deployment@127.0.0.1:5433/wolvesville'
npm run db:migrate:pg:02b
```

This executes additive migration `002` and `004` inside a single transaction. It does **not** modify the approved frontend or official character files. On an existing database, take a backup first and review the SQL in `backend/src/persistence/migrations/004_game_sessions_postgresql.sql`.

## Step 4 — Execute REAL PostgreSQL tests

```bash
npm run test:pg:02b
npm run test:02b:all
```

The isolated `test:pg:02b` creates a uniquely named test schema `wv02b_test_*` and leaves it for inspection; it does not delete any other tables or drop schemas. A failure here is an actual unmet Sprint 02B acceptance gate, not a local SQLite PASS. If migration failed or `pg` is missing, run `npm install` and confirm `DATABASE_URL`.

## Step 5 — Start PostgreSQL backend and test-mode game

```bash
export DB_PROVIDER=postgres
export WV_INTEGRATION_TEST_MODE=1
export PORT=3211
npm run serve:02b
```

Check in a second Terminal:

```bash
curl -s http://127.0.0.1:3211/health
```

`gameIntegrationTestMode:true` confirms test mode; use only on localhost. To disable test gameplay, stop server, remove the flag (`unset WV_INTEGRATION_TEST_MODE`) and restart. In production, official game start must remain disabled until Sprint 02C official adapters have individually passed their acceptance gates.

## Step 6 — Manual API flow

Use REST Client in VS Code or `curl` to register/login two users, create a room with capacity 2, join/lock and start game with `{ "characterIds": [25,31], "idempotencyKey": "start-2026-001" }`. See `SPRINT_02B_HTTP_WS_CONTRACTS.md` for all paths. A game snapshot includes `self` only on the viewer's player row. Use the two-client CLI demo to check WebSocket behavior without editing the approved frontend.

## Development hygiene

- Database credentials belong in environment variables, never commit `.env` to Git.
- Server HTTP and WebSocket listen on `127.0.0.1` by default; do not expose unencrypted localhost test mode via public proxy.
- Mac Docker Compose context may take a few seconds after Docker Desktop starts. Verify `docker version` shows **Server** and `docker ps` succeeds.
- If the existing `02A` server already owns port 3210, use `PORT=3211` for Sprint 02B.
- Do not install another Node.js or Docker just for this project. Node.js 24 already meets the `>=22.13` requirement.
