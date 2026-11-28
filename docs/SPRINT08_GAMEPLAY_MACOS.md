# macOS Apple M5 — Sprint 08 Gameplay Implementation

## Development SQLite (no DATABASE_URL required)

```bash
unzip Wolvesville_Sprint_08_Gameplay_Implementation_Full_Source.zip
cd Wolvesville_Sprint_08_Gameplay_Implementation_Full_Source
npm install
cp .env.example .env
```

Edit `.env` (development only):

```dotenv
DB_PROVIDER=sqlite
DATABASE_URL=
WV_ENABLE_DEMO_AUTH=1
WV_OFFICIAL_RULE_TEST_MODE=1
WV_INTEGRATION_TEST_MODE=0
PORT=3212
HOST=127.0.0.1
```

```bash
npm run verify:source
npm run build
npm run test:08:gameplay:new
npm run test:08:gameplay:metrics
npm run test:08:gameplay:all
npm run dev
```

Open `http://127.0.0.1:3212`; two different accounts (separate browser/private windows), room capacity 2 → lock → choose **Kỵ Sĩ Không Đầu · Thằng Ngố** → start → #8 submits attack → host ends night → actual `GAME_COMPLETED`, winner shown from server. Button for #28 doesn't fabricate any ability.

## Browser

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:08:gameplay
npm run test:browser:08:all
```

These invoke real Chromium contexts and real SQLite backend using an isolated test directory; no stubbed API outcomes. Browser test runner has its own time-bound cleanup. If a run times out, record it as timeout, not PASS.

## PostgreSQL 16 in existing Docker Desktop

- Do not reinitialize PostgreSQL, drop user schemas or reset Docker volumes. Use an **explicit test database** in `DATABASE_URL` with CREATE SCHEMA privileges.
- `DB_PROVIDER=postgres`, `DATABASE_URL=postgresql://TEST_USER:ACTUAL_SECRET@127.0.0.1:5433/TEST_DB` in local `.env` only; never commit to ZIP.
- `npm run test:pg:08:gameplay` uses a new random test schema; success proves real PG, failure exits nonzero. A missing URL fails loudly instead of being treated as PASS.
- Other inherited test scripts: `npm run test:pg:acceptance`, `npm run test:pg:05`, `npm run test:pg:06`, `npm run test:pg:07`.
- No PostgreSQL binary/server/`DATABASE_URL` was present in the packaging environment; live PostgreSQL remains PENDING.

## Safe shutdown and port conflict

Use Ctrl+C in terminal. If `EADDRINUSE`: `lsof -nP -iTCP:3212 -sTCP:LISTEN` then inspect process and select a free `PORT`, do not kill other processes automatically. Browser-origin remains same-origin to this configured backend port.
