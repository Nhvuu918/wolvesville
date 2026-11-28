# Engine internal API (TypeScript)

Import from `dist/backend/src/index.js` after build, or directly from specific backend modules. These are **library calls**, not public HTTP endpoints.

| API | Result / invariant |
|---|---|
| `new SqliteRepository(':memory:' \| filePath)` | Persisted SQLite adapter; `schema.sql` applied automatically |
| `new RuleRegistry()` | Empty production registry: no official skills are implemented |
| `RuleRegistry.register(adapter)` | Explicit (skillId, ruleId, characterId, ruleVersion, phases, priority, target policy, cost, evaluation) |
| `new EngineService(repo, registry, characterPath, allowFixtures=false)` | Loads 97 roles, checks official cardinality; `allowFixtures` must be false for production |
| `createGame(roomId, participants, {gameId?,seed?})` | Stores ROLE_LOCKED state, unique initial Character ID / player ID, 1–97 participants |
| `transition(gameId,nextPhase,expectedRevision?)` | Rejects invalid phase movement and unsupported win completion |
| `submit(action)` | Returns `{status, actionId, duplicate}`; accepts only registered skill in allowed collecting phase; source action format below |
| `resolve(gameId)` | Resolves entire accepted queue atomically; `RULE_UNRESOLVED` on missing adapter/unsupported domain effect |
| `project(gameId,authenticatedPlayerId)` | Authorized player-safe state object (no seed, hidden roles, other factions) |
| `projectVisibleEvents(gameId,authenticatedPlayerId)` | Filters internal/private events and historical ACL |
| `replay(gameId)` | Verifies sequence, hashes, RNG tape, event-contained state and snapshots |
| `getInternalState(gameId)` | **Trusted server process/admin only**. Never expose raw in client APIs. |

### Action JSON

```json
{
  "actionId":"uuid-or-client-stable-id",
  "gameId":"game-id",
  "playerId":"server-authenticated-id",
  "skillId":"fixture.protect",
  "targetIds":["target-player-id"],
  "phase":"NIGHT_COLLECT",
  "round":1,
  "timestamp":1720000000000,
  "payload":{},
  "idempotencyKey":"request-unique-id",
  "ruleVersion":"wolvesville-official-v1.3.1"
}
```

The displayed `fixture.protect` is a **technical test adapter**, not a character skill. The RPC caller must pass a server-authenticated `playerId`, not accept it unauthenticated from HTTP JSON.

### Error codes (subset)

`INVALID_ARGUMENT`, `NOT_FOUND`, `UNAUTHORIZED`, `OUT_OF_PHASE`, `PHASE_CLOSED`, `TARGET_INVALID`, `RESOURCE_INSUFFICIENT`, `SKILL_LOCKED`, `RULE_UNRESOLVED`, `IDEMPOTENCY_CONFLICT`, `REVISION_CONFLICT`, `REPLAY_CORRUPTED`, `INVALID_TRANSITION`.

### SQLite tables

`games`, `participants`, `actions`, `events`, `snapshots`, `random_draws`, `rule_versions`, `kernel_audit_failures`. Migration: `backend/src/persistence/schema.sql`. Real PostgreSQL migration requires a new repository adapter and transaction tests; no Prisma migrations are falsely claimed in this sprint.
