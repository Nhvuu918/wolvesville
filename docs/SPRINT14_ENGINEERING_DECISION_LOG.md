# Engineering decisions (not new game rules)
- Preserve old versions and tests; isolate new exact QA decks; fail closed elsewhere.
- Public chat uses common server-side authorization for REST/WS, event audience, atomic store commit, 500-character limit and 5 messages per 10 seconds. Rate limit is an engineering policy. Ordinary direct messages remain unsupported.
- #32 day/night resource guard scoped to round based on existing source and QA interpretation; review if broader timing is needed.
- Death-follow closure only for explicit three-role test decks; pending/ambiguous states stay gated, no generic victory inference.
- F remains zero; S not certified because inherited 145 rows are composite. No retroactive rewrite of old reports.

## Browser recovery
ENGINEERING INFERENCE — Separate handshake/read lifecycle in QA bridge, propagate close, drain bridge calls before context closure. No change in gameplay semantics or approved rule data. Verified by idle-before/after logs.
