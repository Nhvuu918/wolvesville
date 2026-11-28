# Graphics contract v2.19 — additive, WIP
Keep v2.18; no replacement animation or approved artwork changes.
- Normal mode: server game projection carries actual mode/ruleVersion. UI text distinguishes Chơi thường vs Chế độ chơi thử. Role wheel uses only own authorized role. Public initial role composition is not a player mapping.
- Room configuration/readiness: authenticated room member projection; normal deck labels and ready status; not private role data. On reconnect re-fetch room/game. No animation required, reduced-motion unchanged.
- Coordinator handoff: ROOM-03 audited public coordination record for room participants, current coordinator updated; original assignment and archive unchanged. No internal character ID displayed. Reconnect restores current coordinator.
- Protection: existing authorized block projections; actual guard layer blocks pack bite in admitted QA deck. Private source attribution is not a public role reveal. No new animation asset; existing event display hooks reused.
- Historical event payloads/winner sets remain unchanged. Native macOS and PostgreSQL live still pending.
