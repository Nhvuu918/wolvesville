# Sprint after 02C — staged delivery, do not start without 02C acceptance

1. Validate **real PostgreSQL** 02B/02C end-to-end on the user's Mac with strict `WV_REQUIRE_POSTGRES=1`; fix any test failure, connection leak or migration issue without modifying prior migrations or Docker volumes.
2. Add test coverage of more official skill adapters only when **complete, source-backed contract** and interaction testing exist; do not mark a character READY based on a single positive test.
3. Implement phase orchestration and a separately verified Victory Resolver for controlled minimum compatible role packs; no unverified win-rule inference.
4. Provide incremental WS event sync with stable cursor and reconnect gap repair. Retain frozen-at-event visibility boundaries.
5. Connect official frontend via a data bridge without modifying the approved artistic CSS, assets or layout; 107 source files currently untouched.
6. Build security hardening: session expiry under websocket load, confidential game archives at rest, concurrency, transaction recovery and CI PG testing.
7. Only after gates are met consider the first noncompetitive multi-role playable match; competitive remains disabled until role+victory coverage is complete.
