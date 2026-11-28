# Graphics Handoff v2.13 — additive, WIP
Inherits v2.12 and all existing authoritative UI. No produced animation assets; static text and seat states are reduced-motion fallbacks. Backend role IDs remain internal to existing private assignment protocol, not displayed to players.

| Trigger / event | Audience and payload | Client UI / hook | Replay / reconnect |
|---|---|---|---|
| WITCH_WINDOW | Public phase only; no victim mapping | Existing phase title / host resolve button | phase snapshot restores |
| S15_DEEP_WITCH_PRELIMINARY | PLAYER_PRIVATE, witch only: playerIds, round | private names, rescue eligible targets from authorized capability | stored event remains private; text fallback |
| S15_DEEP_PRELIMINARY_QUEUED | SERVER_INTERNAL, pending target | no public notice/animation; public life remains alive | server state only |
| S15_DEEP_RESCUE_APPLIED | PLAYER_PRIVATE, witch only: playerId, actionId | confirmation, resource counter, no secret role | authorized replay and reconnect |
| S15_DEEP_REDIRECT_PLACED / OFFICIAL_ATTACK_BLOCKED redirect metadata | SERVER_INTERNAL: provenance and actual recipient | ordinary private action acknowledgement; no public source marker | persisted, internal only |
| S15_DEEP_SECRET_PAIR_CREATED | SERVER_INTERNAL: link provenance | optional second target; no member notification | link persisted but private, no public pairing |
| PLAYER_ELIMINATED | ROOM_PUBLIC: actual playerId only | existing seat and death log | actual death after rescue/link resolution |
| POST_ELIMINATION_CHAIN_CLOSED | SERVER_INTERNAL: victim, source, pending=0 | no public UI | audit only |
| MATCH_COMPLETED | ROOM_PUBLIC: authoritative winner IDs including verified co-winners | existing victory panel | no client recalculation |

Existing #25 aura-only, #74 exact role, #5 judgment, role composition, wheel, chat and S11 voting presentation retained.
