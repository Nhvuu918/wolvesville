# HTTP and WebSocket delta — Sprint 02C

Existing Sprint 02B endpoints are unchanged.

## Start a restricted official test game

`POST /api/rooms/{roomId}/games/start` authenticated **host**, room locked, members=2, `WV_OFFICIAL_RULE_TEST_MODE=1`.

```json
{"characterIds":[25,74],"rulePack":"OFFICIAL_ROLE_INSPECTION_V1","idempotencyKey":"unique-start-attempt-123"}
```

Response `201 {game:{gameId,roomId,mode:"INTEGRATION_TEST",rulePack:"OFFICIAL_ROLE_INSPECTION_V1",revision}}`. Other character sets with this pack → HTTP 409 `RULE_UNRESOLVED`. Default `FIXTURE` remains available only under `WV_INTEGRATION_TEST_MODE=1`.

## Supported official action

`POST /api/games/{gameId}/actions` authenticated participant:

```json
{"actionId":"unique-action-id-123","idempotencyKey":"unique-action-key-123","skillId":"official.25.inspect-role","targetIds":["TARGET_PLAYER_UUID"],"expectedRevision":3}
```

`official.74.inspect-role` is available only to role #74. Server supplies actor, phase, round, version and resolved Character ID. Response is `ACCEPTED`, not `RESOLVED`. Locked/incorrect targets and phase limits are validated in Kernel. Unsupported actions → `RULE_UNRESOLVED`.

`POST /api/games/{gameId}/resolve` authenticated host in development mode; after successful commit, private observation events are projected. No game completion/winner endpoint.

`GET /api/games/{gameId}/events`: per-user authorized events including private `ROLE_OBSERVED` **only for actor**.

`GET /api/games/{gameId}/replay`: verified boolean, counts, role assignment RNG verified; does not return internal event log or RNG seed.

## WebSocket `/ws`

`auth` → `game.subscribe` → `game.snapshot` (per-player) → `game.action` → `game.action_accepted` (only submitting socket) → commit by host → `game.state_updated` → `game.events` (each subscriber receives only own permitted events).

`game.events` payload example:

```json
{"type":"game.events","gameId":"...","revision":7,"events":[{"seq":12,"eventType":"ROLE_OBSERVED","targetId":"...","payload":{"characterId":74,"skillId":"official.25.inspect-role","actionId":"..."}}]}
```

`game.events` is a **full authorized history** at each post-commit update; client must deduplicate `seq` until incremental cursor synchronization is implemented. No private action-accepted event is broadcast before resolve. Invisible events never appear in another participant's event batch.
