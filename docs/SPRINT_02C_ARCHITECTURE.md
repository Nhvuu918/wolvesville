# 02C Architecture — Official read-only inspection pack

## Flow

`Login → Room JOIN/LOCK → POST /games/start {rulePack} → store.startGameAtomic() → Role assignment RNG → Kernel Archive → POST /games/{id}/actions → Action Validator → Queue → Official RuleAdapter → Official Information Effect → Atomic archive+relational projection commit → Authorized HTTP and WS → Replay`.

- `GameCoordinator` checks the persisted `rule_pack` on **each** action. `FIXTURE` is not interchangeable with `OFFICIAL_ROLE_INSPECTION_V1`.
- `withKernel` registers only the requested pack. `EngineService` supports a **narrow, audited** `INFORMATION_RESULT` path for two official skill IDs; no global inference of aura, attack or protection.
- `game.events` broadcasts **filtered lists per viewer**, not one shared payload. `ROLE_OBSERVED` uses `PLAYER_PRIVATE`. Role assignments and RNG seed remain server-only.
- `EngineService.resolve` commits a phase and event changes in the same SQLite archive transaction. `GameStore.withGameMutation` commits that binary archive and relational events atomically in either SQLite or PostgreSQL. PostgreSQL `rule_pack` uses additive migration 005. Existing 002/004 migrations are unmodified.
- `GAME_COMPLETED` is always blocked until a confirmed Victory Resolver exists. Both skill adapters are **official, noncompetitive, test-only**. Feature flag `WV_OFFICIAL_RULE_TEST_MODE=1` is required. Production default is OFF.
- Read-only investigations are independent of each other in the 25+74 pair. Stable technical tie-break under VH08 is non-semantic for these two results. No role replacement, kill or block permitted within the pack.
- No client may set actor ID, faction, priority, revision, Character ID or the role observation returned by the server. `currentCharacterId` from server state is the authority.

## Game State and persistence

Existing state model remains unchanged (PH-01, VH08, VH68, original 97 roles). Session has `mode='INTEGRATION_TEST'` and new `rule_pack` column. `OFFICIAL_ROLE_INSPECTION_V1` can be started only when exactly two real participants and IDs 25+74 were locked in the room. The role assignment RNG is replay-verifiable, each player sees only their own role. No competitive scoring/winner is available.

## Security

Backend re-authenticates each WebSocket message; per-user game subscriptions require membership. `game.events` carries the same authorized event projection as GET `/events`. Reconnect replays an authorized snapshot. The event stream currently sends the entire authorized history after resolution and client consumers must deduplicate by `seq` — this is a documented implementation limitation, not a claimed scalable delta stream.

## Pending

- PostgreSQL test execution in this workspace (no local PostgreSQL or `DATABASE_URL`).
- Full orchestration, mid-phase status changes, role transformations, faction victory and complicated skill dependencies. Not enabled.
- End-to-end frontend integration intentionally untouched; 107 approved UI files checksum-verifiable.
