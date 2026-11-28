# Mac Apple Silicon

Node >=22.13, npm, Python 3. Unzip full archive into a new directory. In that folder run:

```sh
npm install
cp .env.example .env
# edit .env: DB_PROVIDER=sqlite, WV_OFFICIAL_RULE_TEST_MODE=1, WV_ENABLE_DEMO_AUTH=1 (local only)
npm run verify:source
npm run build
npm run test:11:all
npm run dev
```
Open http://127.0.0.1:3212. Use two independent accounts or browser profiles; create room capacity 2, join and lock, choose Knight/Jester or Knight/Seer. To exercise voting do not use knight's night kill; resolve night, open vote, choose target or blank, close vote as host. Tie/zero advances next night. The verified hanging path targets #28 or #25. No competitive deployment.

`python3 -m pip install -r tests/requirements-browser.txt`; `python3 -m playwright install chromium`; `npm run test:browser:11:all`. PostgreSQL: supply DATABASE_URL for a disposable test DB, run `npm run test:pg:10:all` (inherited tests); new S11 live PostgreSQL flow not certified. Never use production DB. No schema migration needed for additive JSON archive state. Keep experimental/demo modes disabled in production.
