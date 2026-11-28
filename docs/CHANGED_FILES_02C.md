# Sprint 02C — Source Change Log

Base: Sprint 02B, no destructive replacement, original frontend and characters unchanged. 002/004 migrations unchanged. 005 is new and additive. Code diff below excludes rebuilt `dist/`, `node_modules/`, `reports/`.

## Changed source files

- `README.md`
- `.gitignore`
- `package.json`
- `.env.example`
- `tests/postgres.test.mjs`
- `tests/postgres-game.test.mjs`
- `scripts/serve-02b.mjs`
- `scripts/migrate-pg-02b.mjs`
- `scripts/copy-schema.mjs`
- `scripts/migrate-pg.mjs`
- `backend/src/game/types.ts`
- `backend/src/game/coordinator.ts`
- `backend/src/game/archive.ts`
- `backend/src/multiplayer/sqlite-store.ts`
- `backend/src/multiplayer/pg-store.ts`
- `backend/src/multiplayer/server.ts`
- `backend/src/engine/service.ts`

## New source files

- `docs/NEXT_SPRINT_BACKLOG.md`
- `docs/SPRINT_02C_HTTP_WS.md`
- `docs/SPRINT_02C_ARCHITECTURE.md`
- `docs/RULE_GAPS_02C.md`
- `docs/RULE_TRACEABILITY_02C.md`
- `docs/BUG_02B_FIX_LOG.md`
- `docs/CHANGED_FILES_02C.md`
- `docs/MACOS_POSTGRESQL_02C.md`
- `docs/CHARACTER_READINESS_MATRIX.md`
- `tests/postgres-official.test.mjs`
- `tests/official-rules.test.mjs`
- `tests/regression-hardening.test.mjs`
- `scripts/serve-02c.mjs`
- `scripts/local-env.mjs`
- `scripts/demo-02c.mjs`
- `data/character_readiness_02c.csv`
- `backend/src/official/inspection-effects.ts`
- `backend/src/official/inspection-rules.ts`
- `backend/src/persistence/migrations/005_official_rule_pack_postgresql.sql`
- `backend/src/persistence/migrations/005_official_rule_pack_sqlite.sql`

## Removed files

None.
