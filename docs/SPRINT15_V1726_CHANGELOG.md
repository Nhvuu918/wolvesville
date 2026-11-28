# v1.7.26 — Completion & Release Convergence (partial)

- Retained 97 characters, all decision records, original ruleset and historical certificate/report files.
- `backend/src/engine/visibility.ts`: scoped immutable-roster detection and viewer-local ordinals for mixed QA authorized events. Ledger IDs stay intact on disk; projected identifiers are presentation IDs, not audit identifiers.
- `backend/src/game/coordinator.ts`: mixed QA replay count is authorized-view only; internal draw counts and raw revision removed from replay response. Phase controller receipts omit private execution totals. Full replay verification still runs server-side.
- `backend/src/multiplayer/server.ts`: idempotent pack retries no longer broadcast redundant state refreshes; REST acknowledgement remains idempotent.
- `backend/src/experimental/owner-bb-v2/pack.ts`: a waiting banner does not remain true after currently eligible missing participants disappear. No new fallback, no change to lock policy.
- `frontend/integration.js`: generic night result when resolution receipt intentionally lacks count.
- Tests added to the existing backend live and candidate suites; no assertion weakened or browser inventory removed.
- No new gameplay law or certificate. #23 secret revival and #10 revival/same-night interaction remain blockers. The v1.3.4 release gate remains PARTIAL.
