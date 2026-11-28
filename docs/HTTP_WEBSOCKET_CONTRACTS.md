# Sprint 02A — HTTP and WebSocket contracts

All endpoints use JSON. No character or game action may be resolved by this service; this API is an auth/lobby transport only. Server is bound to 127.0.0.1 by default. Errors are `{ "error": { "code": "...", "message": "..." } }`. HTTP bearer token is required except registration/login/health.

| Method | Path | Permission | Request | Response |
|---|---|---|---|---|
| GET | `/health` | anonymous | – | service status, `characterRulesEnabled:0` |
| POST | `/api/auth/register` | anonymous, rate limited | `{username,password,displayName?}` | `{profile:{id,publicId,displayName}}` |
| POST | `/api/auth/login` | anonymous, rate limited | `{username,password}` | `{token,profile,expiresAt}` |
| GET | `/api/auth/me` | bearer | – | `{profile}` |
| POST | `/api/auth/logout` | bearer | `{}` | `{ok:true,userId}`; revokes session, closes associated WS |
| GET | `/api/profile/me` | bearer | – | `{profile}` |
| PATCH | `/api/profile/me` | bearer | `{displayName}` | `{profile}`; notifies joined rooms |
| GET | `/api/rooms` | bearer | – | room list (no member secrets) |
| POST | `/api/rooms` | bearer | `{name,capacity}` | `{room}` (owner automatically joins) |
| GET | `/api/rooms/:uuid` | room member | – | `{room}` incl. member presence |
| POST | `/api/rooms/:uuid/join` | bearer | `{}` | `{room}`; idempotent join; serialized capacity |
| POST | `/api/rooms/:uuid/leave` | member | `{}` | `{room}` or null if room deleted |
| POST | `/api/rooms/:uuid/lock` | host | `{}` | `{room}` |
| POST | `/api/rooms/:uuid/unlock` | host | `{}` | `{room}` |

Registration: ASCII username 3–32 `[A-Za-z0-9_]`, case-insensitive, password 10–128 characters, display name 1–48 chars. Room capacity 1–100 (NOT number of assignable unique character roles; game creation is a separate later step).

## WebSocket `/ws` — server authoritative

After `101 Switching Protocols`, the server emits `{"type":"connected","authRequired":true}`. Client then sends `{"type":"auth","token":"opaque-token"}` and receives `auth.ok` or `error`. Access is authenticated via token hashing and database session lookup. A fresh socket authenticates again on reconnect.

| Client message | Server event | Behavior |
|---|---|---|
| `{type:"auth",token}` | `auth.ok` | Authenticate before subscribe |
| `{type:"subscribe",roomId}` | `room.snapshot` + `room.updated` | Join subscription **only when DB membership exists** |
| `{type:"unsubscribe",roomId}` | `unsubscribed` | Remove subscription |
| `{type:"ping"}` | `pong` | Transport keepalive |

Room mutations committed via HTTP yield `room.updated` to subscribed authorized clients. Every broadcast verifies current membership and current session. Removed members receive `room.access_revoked`; revoked sessions are disconnected. Messages do not include character role data, passwords or session tokens.

**Security limitations:** The restricted built-in WebSocket frame parser is designed for this offline/local Sprint 02A only. It enforces masking, frame size ≤64 KiB, UTF-8 validity, no binary, no compression, Origin check, auth timeout. For public internet, replace with a maintained package (`ws`/Socket.IO), set TLS proxy, distributed rate limits, DDoS controls and Redis pub/sub for multi-instance presence/broadcast. Browser origins other than exact server origin must be explicitly allowlisted using `ALLOWED_ORIGINS`.

## Errors

`UNAUTHORIZED` 401; `FORBIDDEN` or `NOT_MEMBER` 403; `ROOM_NOT_FOUND` 404; `ROOM_LOCKED`, `ROOM_FULL`, `USERNAME_TAKEN` 409; `RATE_LIMITED` 429; `INVALID_*` 400; unexpected error 500 with redacted message. No read access to private room details without membership.

## Public ID vs internal ID

`id` is a backend user UUID; `publicId` is a generated `WV-XXXXXXXXXXXX` label for display and search. Never substitute either for `room.id` or `gameId`; the latter only exists after 02B has created an Engine game session.
