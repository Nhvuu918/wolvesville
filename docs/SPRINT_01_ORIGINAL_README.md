# WOLVESVILLE — Sprint 01 Engine Kernel (TypeScript)

**Status:** an executable, tested **engine kernel**, not a complete Wolvesville game engine. **Do not enable all 97 character skills in production.**

## Provenance and safety

- Official character data: `data/character.json` **97 roles**, SHA-256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`.
- 118 confirmed decisions are copied into `data/rules/official_merged_118.json` and the original VH/v1.2/Q13 datasets beside it.
- 207 source test specifications copied to `data/rules/tests_207.json`: **these are not automatically 207 passing tests**.
- Approved `wolvesville-main (1).zip` UI is copied **unaltered** into `frontend/`; hash list in `docs/APPROVED_FRONTEND_MANIFEST.json`.
- No LPTV data or rules are used. The project does not merge `Ma_Soi_*` spreadsheets into this kernel.
- `fixture.*` adapters are intentionally **test-only**, gated by `allowFixtures:true`. Production `RuleRegistry()` has zero registered character skills and responds `RULE_UNRESOLVED`.

## Requirements (Windows 10/11, VS Code)

Install **Node.js 22.13 or newer** (Node 22 LTS recommended) and VS Code. In VS Code, choose `File → Open Folder` and open this project's root folder; then `Terminal → New Terminal` (PowerShell).

```powershell
node --version
npm --version
npm install
npm run verify:source
npm run build
npm test
npm run demo
```

`npm install` only installs **TypeScript** for build; the runtime has no external npm dependencies. Node's built-in `node:sqlite` currently prints an `ExperimentalWarning` on Node 22; this is expected, **not an SQL error**. You do not need PostgreSQL, Redis, Java, Python, or Docker to run Sprint 01 locally.

If you have prebuilt `dist/` in this archive and cannot run `npm install` immediately, you can run:

```powershell
node scripts/demo.mjs
node --test tests/kernel.test.mjs
```

This verifies the compiled artifact; use `npm test` after installing dependencies to also prove a fresh TypeScript build.

## Project structure

```text
Wolvesville_Sprint_01_Engine_Kernel/
├── frontend/                # APPROVED HTML/CSS/JS and art; not modified
├── backend/src/
│   ├── common/              # Typed errors, canonical hash and clone
│   ├── engine/
│   │   ├── state.ts          # Finite state machine and participant invariants
│   │   ├── validate.ts       # Admission + resolution-time revalidation
│   │   ├── queue.ts          # Deterministic queue ordering
│   │   ├── rng.ts            # Reproducible HMAC-SHA256 RNG
│   │   ├── rules.ts          # RuleRegistry / RuleContext / adapter contract
│   │   ├── effects.ts        # Safe fixture-only primitive effect logic
│   │   ├── events.ts         # Append-only event ledger / hash chain
│   │   ├── replay.ts         # Event and RNG-tape verification, snapshots
│   │   ├── visibility.ts     # Server-side access-filtered projections
│   │   └── service.ts        # Atomic EngineService orchestration
│   ├── fixtures/            # Test fixtures ONLY, not real character rules
│   └── persistence/         # GameRepository abstraction and SQLite migration
├── shared/contracts/       # Cross-module TypeScript types
├── data/                   # Immutable source / official decision indexes
├── tests/                  # Actual Node test runner integration tests
├── scripts/                # Demo, source integrity, build schema copy
├── docs/                   # Architecture, API, blockers, Sprint 02
└── reports/                # Actual test and audit results
```

## What's deliberately not implemented

- Login/signup, public HTTP API, WebSocket or Socket.IO integration, frontend-to-engine binding.
- Character-specific abilities, 97-role interactions, group chat/DM, real voting, real win predicates, timer/AFK orchestration, competitive ranking, role assignment RNG, authority-driven UI.
- PostgreSQL/Prisma production adapter. Sprint 01 runs with built-in SQLite for reproducibility and local tests; the repository contract defines the migration seam.
- Arbitrary gameplay damage/protection/revival is **not exposed as official Wolvesville rules**; the only demonstration implementation uses test fixture namespace.

**Do not submit actual ranked matches to this kernel yet.** See `docs/SPRINT_02.md` for staged integration.
