# Sprint 03 Final Hardening — Root cause & corrective actions

**Basis:** Full source v0.5.0 upgraded to v0.5.1, no rewrite. No official rule or character mutation.

## BUG-LOBBY-001 — Room Marker hard to click

**Observed with Playwright Chromium against actual SQLite backend:** a pointerdown event targeted `BUTTON#villagePin-room-<uuid>`, but pointerup was delivered to an underlying `DIV`, and the subsequent native click was not dispatched to the marker. Mouse-click retries were previously required. This evidence comes from temporary event tracing during the failing browser test, not from a screenshot. The normal browser test now exercises physical pointer gestures and checks server state.

Three interacting weaknesses were identified in source:

1. Only `onclick` activated the marker. Its delivery was unreliable when SVG/composited layers retargeted pointerup.
2. `WolvesLive.openRoom()` silently POSTed `/join` after `GET /api/rooms/:id` reported `NOT_MEMBER`; a marker click was therefore both selection and unintended join.
3. Marker keys used list indexes, not authoritative Room IDs. Reordering/discovery could map a visual marker to a different Room.

**Fix:** keep native `<button>` and accessible keyboard click; add server-ID-bound pointer gesture capture from actual pointerdown through pointerup (primary pointer, maximum 14 px movement), then activate the **preview** rather than mutation. Keyboard uses the normal native click with `event.detail===0`; pointer uses the gesture path, so it never causes duplicate join. Network-driven re-renders are deferred while a pointer/key gesture is in progress. Child decorations don't intercept the hitbox; touch is supported. Back-end join occurs only after an explicit **Tham gia phòng** click and is revalidated by server. Visible marker slots persist per Room ID across updates. The directory always contains all rooms, even if map limits markers to three.

**Change scope:** `frontend/app.js`, `frontend/integration.js`, `frontend/player-ux.css`. No backend authorization/transaction changes needed. E2E proof: `tests/browser_lobby_e2e.py` and `reports/final_lobby_room_preview.png` / `final_lobby_mobile_preview.png`.

## BUG-02 — SQLite startup requested DATABASE_URL

`.env.example` previously suggested `DB_PROVIDER=postgres` even for the documented quick-start SQLite path. Environment values from a previously exported shell variable may also override `.env`. `scripts/serve-03.mjs` checked `DB_PROVIDER` and demanded `DATABASE_URL` if PostgreSQL was chosen.

**Fix:** default example and missing provider to SQLite. `startupConfig()` validates exactly `sqlite` or `postgres`, validates port, requires URL only for `postgres`. The `dev` script now exists and executes `build` + the same real server. Tests spawn actual subprocesses and verify health with SQLite and no URL, missing PG URL fail-fast, occupied port diagnosis, correct Demo flag and production disablement. No silent fallback from an explicit invalid provider.

## BUG-03 — Demo Authentication env mismatch

The *only* supported flag remains `WV_ENABLE_DEMO_AUTH`. `/health` reports whether the server actually enabled Demo; `NODE_ENV=production` disables it even if the flag is `1`. No shared demo password. Original demo session isolation/cleanup retained.

## BUG-04 — Port already occupied

`PORT` is validated; `EADDRINUSE` returns an understandable message pointing at `lsof`, without killing any process or silently changing the port. Test starts two real server processes and confirms the first remains healthy.

## BUG-05 — PostgreSQL acceptance contamination / stale tests

02A PG test originally used the live/default database schema for generated test accounts; it now creates a unique temporary schema with additive migrations 002/004/005/006, then removes only that test schema. PG game and official rule tests also clean up their isolated schemas after closing servers. Tests requiring PG fail rather than SKIP when `WV_REQUIRE_POSTGRES=1`. No live PG instance was reachable in this execution environment; changes have passed syntax validation, not real PG acceptance.

## Known behavioral boundaries

- Only the officially supported #25/#74 test skill pack remains active; competitive is off.
- If rooms exceed three markers, the complete real directory remains the access route. Map placement is stable during the current client session, not a shared permanent global coordinate assignment.
- The public history/rankings and official win resolver remain unavailable; no fabricated results.
