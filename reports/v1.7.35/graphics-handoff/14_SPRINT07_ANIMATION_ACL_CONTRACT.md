# S07 — Event to Animation / Information Contract (developer + graphics)

| Event from server | Audience | Public payload | Suggested Dark Fantasy animation | Reconnect behavior | Status |
|---|---|---|---|---|---|
| `ACTION_ACCEPTED` | Server internal; sender receives action receipt | No public action target or cause | Button pending visual for sender only | Rebuild from authorized pending state | IMPLEMENTED & TESTED |
| `PLAYER_ELIMINATED` | ROOM_PUBLIC only when certified closed-deck death | `{playerId}` only | Whole-screen night fade/candle extinguish; never infer killer/role | Read current public death state, do not re-trigger as new | IMPLEMENTED & TESTED |
| `MATCH_COMPLETED` | ROOM_PUBLIC once commit succeeds | `{winnerIds:[playerId]}` only | Winner reveal screen + restrained light effect | Render persistent winner panel from server snapshot | IMPLEMENTED & TESTED |
| `ROLE_OBSERVED` | PLAYER_PRIVATE (inspector only) | Role-information to owning player, not broadcast | Private card reveal without global reveal | Rehydrate only to authorized inspector | IMPLEMENTED & TESTED |
| `VOTING_OPENED`, `VOTING_CLOSED` | Authorized room projection | Non-secret voting phase status | Day panel/ballot UI | Reconcile status from server | PARTIAL |
| `VOTE_RESOLVED` / generic `PLAYER_HANGED` | Not emitted | None | Leave placeholder in design preview only | No live handler | BLOCKED BY RULE |
| `MATCH_COMPLETED` for ordinary games | Not emitted | None | Only design preview | No real gameplay | BLOCKED BY RULE |

**Strict safeguards:** Animation never computes gameplay, winners, roles, targets, cause of death or faction. Never reveal raw action event IDs/seed. Do not stream text letter-by-letter. Respect `prefers-reduced-motion`, making text and result visible immediately; animation must not delay content or block controls. The original artwork, Wheel/Grid Codex and village map remain unchanged.
