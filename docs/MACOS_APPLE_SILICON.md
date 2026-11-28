# How to run Sprint 02A on macOS Apple Silicon (VS Code + Docker)

Validated hardware details supplied by project owner: macOS 26.4 arm64, M5, 24 GiB RAM, Node 24.22.3, npm 11.19.1, Docker Desktop installed and `docker version` last showed a working server. The development environment that generated this package is Linux / Node 22; actual PG tests must be repeated on your Mac.

1. Unzip `Wolvesville_Sprint_02A_Backend_Integration.zip` into `~/Projects/wolvesville`.
2. Run `cd ~/Projects/wolvesville/Wolvesville_Sprint_02A_Backend_Integration && code .`.
3. In VS Code Terminal:

```bash
node --version
npm install
npm run verify:source
npm run build
npm run test:all
npm run demo:02a
```

4. Run the durable SQLite backend in Terminal tab A:

```bash
npm run serve:02a
```

5. In Terminal tab B, verify HTTP:

```bash
curl http://127.0.0.1:3210/health
curl -sS -X POST http://127.0.0.1:3210/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"hello_wolves","password":"change_me_very_secure_123","displayName":"Hello"}'
curl -sS -X POST http://127.0.0.1:3210/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"hello_wolves","password":"change_me_very_secure_123"}'
```

Use the `token` returned by login with `Authorization: Bearer <token>` on room endpoints. For a complete two-client test, `npm run demo:02a` starts its own temporary service and runs real HTTP+WS clients.

## PostgreSQL via Docker Desktop (on your Mac)

Start Docker Desktop from Applications, then verify `docker info` and `docker compose version`. For local testing only, run:

```bash
docker compose up -d postgres
docker compose ps
export DATABASE_URL='postgresql://wolvesville:local_only_change_before_deployment@127.0.0.1:5433/wolvesville'
npm run db:migrate:pg
npm run test:pg
DB_PROVIDER=postgres PORT=3211 npm run serve:02a
```

If `pg` was omitted because you installed dependencies offline, run `npm install pg` before migrating. `psql` is optional: the migration uses the Node `pg` driver; Docker Desktop supplies PostgreSQL. `5433` avoids conflicting with any locally running PostgreSQL on `5432`. Data persists in the named Docker volume.

**IMPORTANT:** Default Docker Compose credentials are *local development placeholders*. Change `POSTGRES_PASSWORD` (and the `DATABASE_URL` password) before connecting externally. Do not commit credentials or tokens to Git. Keep the database bound to loopback. Avoid `docker compose down -v` if you need to retain test data.

## Common issues

- `docker info` says no daemon: launch Docker Desktop, then retry.
- `npm run db:migrate:pg` says missing `pg`: `npm install pg`.
- `EADDRINUSE`: choose `PORT=3211` or stop the other server.
- `ExperimentalWarning: SQLite`: expected on some Node 22 versions, not a database failure.
- Frontend files under `frontend/` remain the approved design snapshot, **not yet wired to `/api`**. Do not assume visiting `frontend/index.html` runs a real multiplayer game.
