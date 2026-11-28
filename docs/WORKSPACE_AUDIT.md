# Workspace audit — sources and reuse decisions

## Files inspected

- `wolvesville-main (1).zip` (approved frontend reference): separate `index.html`, `style.css`, `app.js`, official design assets and 97-character display data; 107 files copied byte-for-byte to `frontend/`, verified by SHA manifest.
- `Wolvesville_Foundation_v0_1.zip`: earlier demo with Node.js/SQLite authentication, rooms, wheel, SSE. Its room/auth implementation was **not grafted** into the engine kernel; no existing deployment is overwritten. Its persistence direction informed the local offline-friendly SQLite choice.
- `Wolvesville_Rules_Confirmed_v1_3_1.zip`: official `character.json` and immutable 85 VH + 21 v1.2 + 12 Q13 decisions, plus the audit deltas and 207 text specs.
- `Wolvesville_Game_Engine_Readiness_Audit_v1_3_1.zip`: 7 audit docs, 145 branch inventory, 22 issues, 207 spec trace and GO/NO-GO boundaries; `RULE_TRACEABILITY_MATRIX.xlsx` imported and its 10 sheets checked.

## Technology choice

Node.js 22.16.0 and TypeScript 5.8.3 were present in the build environment. No external database server or npm app framework was installed. Chosen: TypeScript ESM + built-in `node:sqlite` with a repository interface; `node:test` runner; no third-party runtime dependencies. Compiled JS is packaged to allow running offline on Windows with Node 22.13+.

**Postgres/Prisma** is a planned production adapter, not falsely presented as deployed. SQL source of truth for Sprint 01 is `backend/src/persistence/schema.sql`.

## Safety checks

- No editing or replacing of approved frontend files.
- No change to official `character.json` bytes (source hash checked).
- No `Ma_Soi_*` / LPTV source imported.
- Engine SkillRegistry has no official character skill entries, preventing accidental activation of guessed skills.
