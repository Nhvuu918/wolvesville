# Sprint 02B — HTTP and WebSocket contracts

All previous Sprint 02A routes are retained: `POST /api/auth/register`, `/login`, `/logout`; `GET /api/auth/me`, `GET/PATCH /api/profile/me`; `GET/POST /api/rooms`; room detail, `/join`, `/leave`, `/lock`, `/unlock`; `GET /health`. Bearer tokens required except registration/login/health. Status and error payloads: `{ "error": { "code": "...", "message": "..." } }`.

## Game HTTP routes

All routes require `Authorization: Bearer <token>`. Actor identity is taken from token only.

| Method | Path | Result / authorization |
|---|---|---|
| `POST` | `/api/rooms/:roomId/games/start` | Host only, locked room, test mode; `{characterIds:[25,31],idempotencyKey:"start-unique-001"}`. Returns `{game:{created,gameId,roomId,mode,revision}}` and HTTP 201 (new) / 200 (idempotent). Character IDs are a *configuration pool*, not client assignments. |
| `GET` | `/api/games/:gameId` | Participant only; `{game:{gameId,roomId,phase,round,revision,players:[{playerId,publicReportedDead,self?:{initialCharacterId,currentCharacterId,currentFaction,life,resources,skillLocks}}]}}`. `self` exists ONLY on viewer's row. |
| `POST` | `/api/games/:gameId/actions` | Participant only, test fixture skill only. Intent `{actionId,idempotencyKey,skillId:"fixture.protect",targetIds:[playerId],payload?:{},expectedRevision?:number}`; response `{action:{gameId,actionId,status:"ACCEPTED",duplicate:boolean,revision}}`. |
| `POST` | `/api/games/:gameId/resolve` | Room host only, test mode. Optional `{expectedRevision}`. Resolves accepted actions and advances the test phase. `{resolution:{gameId,resolved,cancelled,randomDraws,revision,phase,verified}}`. |
| `GET` | `/api/games/:gameId/replay` | Participant only; `{replay:{gameId,verified,roleAssignmentsVerified,events,draws,assignmentDraws,revision}}`; no raw seed, archive, or internal log. |
| `GET` | `/api/games/:gameId/events` | Participant only; `{events:[]}` filtered for viewer with Kernel `projectEvents`, not raw event database rows. |

Server rejects competitive starts with `RULE_UNRESOLVED` unless `WV_INTEGRATION_TEST_MODE=1` is **explicitly** configured; even then only fixture actions are available. Invalid skill resolver yields `RULE_UNRESOLVED` (409), stale revision `REVISION_CONFLICT` (409), reused action/key with altered contents `IDEMPOTENCY_CONFLICT` (409), unauthorized access 401/403.

## WebSocket

Existing `ws://127.0.0.1:3210/ws`: connect → `{type:"auth",token}` → `auth.ok`. 02A room `{type:"subscribe",roomId}` → `room.snapshot` / `room.updated` remains.

02B additions:

```json
{"type":"game.subscribe","gameId":"<UUID>"}
{"type":"game.unsubscribe","gameId":"<UUID>"}
{"type":"game.action","gameId":"<UUID>","action":{"actionId":"private-action-001","idempotencyKey":"action-private-001","skillId":"fixture.private","targetIds":["<targetPlayerUUID>"]}}
```

Server messages:

```json
{"type":"game.created","gameId":"<UUID>","roomId":"<UUID>","mode":"INTEGRATION_TEST"}
{"type":"game.snapshot","game":{"gameId":"<UUID>","phase":"NIGHT_COLLECT","revision":2,"players":[]}}
{"type":"game.state_updated","game":{"gameId":"<UUID>","phase":"DAY_DISCUSS","revision":7,"players":[]}}
{"type":"game.action_accepted","action":{"actionId":"private-action-001","status":"ACCEPTED","duplicate":false}}
{"type":"error","error":{"code":"FORBIDDEN","message":"..."}}
```

The sample `players:[]` above denotes a **shape illustration**, not an actual game response. Each snapshot/update is regenerated individually for the authorized viewer. `game.action_accepted` goes to the sender, **not broadcast to other players**; even a generic `game.state_updated` is not broadcast merely because a private action was accepted. `game.created` contains no role data. WS token authorization is checked before every post-auth message and every game projection. On reconnect: auth + `game.subscribe` gives a fresh snapshot. Keep a `revision` on client to ignore stale messages; do not send full Kernel `GameState`.

## Not implemented / not emitted

No `game.completed` / victory events: Victory Resolver is not implemented. Official skill result message formats are not defined. No server-side action timeout, AFK scheduling, chat or bot AI is implemented. There are no fabricated success messages for those features.
