# Final Hardening — Known Limitations / Next Gates

1. **PostgreSQL live acceptance PENDING:** only negative missing-URL validation was executed; real DB transaction/restart/privacy test remains required on Mac. All five PG tests must run with a proper test DB connection.
2. **Native macOS Browser E2E PENDING:** actual Linux Chromium + HTTP/WS bridge PASSED; run `WV_E2E_DIRECT=1 npm run test:browser:final` on Mac for native acceptance.
3. **Room density:** map shows at most three stable room markers in existing approved slots. Every other room remains accessible in complete directory; permanent positions across client restarts and collision-free more-than-3 spatial layout were not added.
4. **Stale room deletion:** UI guards invalid room data and handles server errors, but no new dedicated browser case was run for deletion between preview and joining. Add one before public production.
5. **Game rules:** ONLY the confirmed limited #25/#74 inspection skill adapters are enabled in test mode; official victory, competitive, chat/vote and 97-rule full integration remain blocked.
6. **Developer install:** source ZIP intentionally excludes dependencies and private `.env`; a fully offline fresh `npm install` was not certified in this environment, but TS compile and tests were executed with installed dependencies.
7. **UI:** original Dark Fantasy art, Codex Wheel/Grid and 97 official characters remain as approved. Only purposeful marker hitbox and room preview were changed.

**Gate:** Do not declare production-ready until live PostgreSQL, native Mac E2E, operational rate limits and competitive rule completeness are separately accepted.
