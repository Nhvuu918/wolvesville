# Graphics Handoff v2.1 — Sprint 08 Gameplay

This is an **additive** supplement to the approved S06–S07 event catalogue and Sprint 08 v2.0 graphics contract. No engine logic belongs in animation.

| Backend event | Player screen | ACL | Tested? | Animation hook |
|---|---|---|---|---|
| `VOTE_OUTCOME_CONFIRMED` (`CANCELLED_NO_ELIMINATION`) | Hội đồng bỏ phiếu bị hủy; chuyển sang đêm mới | ROOM_PUBLIC, no target/role | YES, PH-02 only | `voting.cancelled.v2` |
| `POST_ELIMINATION_CHAIN_CLOSED` | **No player-facing display** | SERVER_INTERNAL only | YES, #8 closed deck | None |
| `PLAYER_ELIMINATED` | Thông báo đã có một người bị loại | ROOM_PUBLIC `{playerId}` only | YES, #8 vs #25 or #28 | `night.death.reveal.v1` |
| `MATCH_COMPLETED` | Kết quả thắng/thua | ROOM_PUBLIC `{winnerIds}` only | YES, these exact decks | `match.finished.v1` |
| General vote outcome / hanging | Design Preview ONLY | no authoritative event | **BLOCKED BY RULE** | Design concept only |

The machine-readable contract `S08_GAMEPLAY_GRAPHICS_EVENTS_v2_1.json` specifies event trigger, authorized payload, transitions, loading/error/reconnect/reduced-motion behavior, assets and mobile layout; all animations follow committed server events. No typewriter or locally generated match winner.
