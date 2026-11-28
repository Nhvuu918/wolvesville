# S07 — Screen Transition Matrix / Graphics Handoff

| From | Trigger | To | Server source | Test evidence |
|---|---|---|---|---|
| Lobby | User selects room marker | Room preview (NOT auto-join) | HTTP room list/detail | Inherited lobby E2E |
| Room preview | User clicks Join | Room members/host | Membership mutation + WS | Inherited lobby E2E |
| Room locked | Host selects [8,25], begins | Private Role Reveal/End of preparation | Game Session, randomized role assignment | S07-01 + Browser S07 |
| Night | Player submits own skill | Pending indicator | HTTP action accepted | S07-01 + Browser S07 |
| Night | Host resolves | Night finalize | Kernel transaction | S07-01,05 |
| Night finalize | Seer is dead, knight last alive; all effects settled | Victory screen | `MATCH_COMPLETED` after commit | S07-01,04, Browser S07 |
| Victory screen | User selects return | Lobby | Navigation only, does not mutate completed match | Browser S07 |
| Day discussion | Host opens voting | Voting interface | Authorized vote-intent ledger | Inherited Sprint06 |
| Vote closed unresolved | Any generic tie/target | No elimination or winner displayed | `RULE_UNRESOLVED` | S07-03 |

**Information privacy:** Neither opponent sees another's role assignment until explicitly permitted by a skill; winner IDs public only after completion; public death event does not disclose killer. On reconnect, render snapshot without replaying animations as new events. For reduced motion, instant full text and no flashing transitions. This table is a contract for graphics, not an authorization for frontend to infer match state.
