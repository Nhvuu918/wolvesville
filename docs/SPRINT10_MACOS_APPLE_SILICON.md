# Sprint 10 — chạy Full Source trên macOS Apple Silicon (M5 / ARM64)

## Prerequisites

- Node.js **≥22.13** / npm, Python 3 with pip, Chromium via Playwright if testing browser. PostgreSQL 16 **only when actually available**, and use a **disposable development database**, not any live user database.
- Unzip `Wolvesville_Sprint_10_Gameplay_Completion_Full_Source.zip` into a **new** folder. No need to merge any old ZIP.

```bash
cd Wolvesville_Sprint_10_Gameplay_Completion_Full_Source
npm install
cp .env.example .env
# For local game: DB_PROVIDER=sqlite (or compatible setting shown in .env.example)
# Keep DATABASE_URL empty in SQLite mode; do not commit .env.
# For restricted local gameplay packs, set WV_OFFICIAL_RULE_TEST_MODE=1.
# To use Demo Login locally, set WV_ENABLE_DEMO_AUTH=1.
# Both must be 0 in production; NODE_ENV=production also disables Demo Auth.
npm run verify:source
npm run build
npm run rules:build
npm run test:09:all
npm run test:10:all
npm run dev
```

Open `http://127.0.0.1:3212` (unless `PORT` differs). Create 3 separate Demo accounts and a room with 3 seats. Available new restricted training decks include **Thẩm Phán Linh Hồn · Cân Phán Quyết**, **Thẩm Phán · Sói Gai Độc**, **Sói Ác Mộng · Điều tra**, **Sói Ác Mộng · Cân Phán Quyết**. Engine assigns roles server-side; inspect your own role and available night skill. These are **restricted QA packs**, not a general competitive room or certified full voting-to-winner match.

## Browser testing

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:10
npm run test:browser:10:all
# Legacy browser suite remains available:
npm run test:browser:09:all
```

Browser runner starts real local backend and uses independent browser contexts; screenshots are captured under `reports/`. If macOS system permissions restrict browser launches, check Playwright setup first. Browser success only proves flows exercised, not all 97 roles.

## PostgreSQL live test (requires your own disposable database)

```bash
# Supply a connection string for a dedicated LOCAL DEV/TEST DB only.
export DATABASE_URL='postgres://local_test_user:password@127.0.0.1:5432/wolvesville_test'
npm run test:pg:10
npm run test:pg:10:all
```

**Safety:** `tests/postgres-s10.test.mjs` creates its own randomly suffixed schema, runs existing migrations, and drops **only that schema**. It never resets the PostgreSQL cluster, removes Docker volumes, drops the database, or commits secrets. The strict command **fails** when `DATABASE_URL` is absent: this is expected and means **PENDING ENVIRONMENT**, not PASS. Run against a database that can safely create/drop test schemas. Never execute migrations against production data for acceptance testing.

## Technical boundaries

- S09 source/graphics retained and appends v2.3 actor-private feedback events.
- Vote outcome remains `ADJUDICATION_UNRESOLVED` until V02/V03 are approved.
- `vote-policy-sandbox.ts` is developer-only, has no official API endpoint, writes no game state and does not appear in competitive gameplay.
- Do not put `.env`, secrets, runtime SQLite DBs or `node_modules` into a delivery archive.
