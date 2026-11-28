# S07 — Verified Early-Night Endgame vs Generic Gameplay

## Executable vertical slice

```mermaid
flowchart TD
 A[Host locks 2-seat room] --> B[Server assigns #8 and #25 privately]
 B --> C[Night 1: player #8 submits official attack intent]
 C --> D[ACCEPTED + PENDING: do not display death/winner]
 D --> E[Host resolves all night actions]
 E --> F[Game Engine commits PLAYER_ELIMINATED #25]
 F --> G{Closed deck: #8 only survivor and no pending chain?}
 G -->|Yes| H[GAME_COMPLETED + MATCH_COMPLETED winner #8]
 G -->|No| J[DAY_DISCUSS, no winner]
 H --> I[Authorized winner screen/reconnect/replay]
```

### Runtime state table

| Moment | Backend state | Player can see | Status |
|---|---|---|---|
| Room LOCKED + deck selected | Locked room & selection request | Room host selects certified restricted deck | IMPLEMENTED & TESTED |
| Role assignment | `ROLE_ASSIGNED→NIGHT_COLLECT` | Each sees own role only | IMPLEMENTED & TESTED |
| Knight action | `NIGHT_COLLECT`, `ACTION_ACCEPTED` | Sender sees pending, nobody sees death yet | IMPLEMENTED & TESTED |
| Night resolve | `NIGHT_RESOLVE→NIGHT_FINALIZE` | Authorized state updated after commit | IMPLEMENTED & TESTED |
| Knight kills seer in closed deck | `DEAD_FINAL`, death event | Public **victim playerId** only | IMPLEMENTED & TESTED |
| Endgame knight sole survivor | `GAME_COMPLETED`, one winner | Winner panel, lobby navigation | IMPLEMENTED & TESTED |
| Discussion + generic ballot | `DAY_DISCUSS`, `DAY_VOTE_COLLECT`, `DAY_RESOLVE` | Voting receipt/status only | PARTIAL |
| Generic vote→hanging | Missing certified voting adjudication | NOT SHOWN | BLOCKED BY RULE |
| Multi-character general endgame | Missing general co-win chain | NOT SHOWN | BLOCKED BY RULE |

This early-end game **does not show a fabricated ballot/lynching**; designer should not imply that it does. Source: `character.json#8`, `character.json#25`, `VH03`.
