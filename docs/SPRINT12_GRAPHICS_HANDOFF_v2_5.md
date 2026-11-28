# Graphics handoff 2.5 (additive)
See gameplay-flow-handoff/S12_GRAPHICS_CONTRACT_v2_5.json. Keep all v2.4 hooks and assets. No new animation is claimed produced.

| State | Authorized input | Hook / fallback | Status |
|---|---|---|---|
| Night action | Own authorized skill feedback | Existing skill acknowledgement / instant text | Frontend connected |
| Attack or protection consumed | No public event; internal OFFICIAL_ATTACK_BLOCKED | None; never reveal secret shield or actor | Backend implemented |
| Death | PLAYER_ELIMINATED playerId only | elimination-reveal / instant player status | Inherited |
| Death chain | Internal POST_ELIMINATION_CHAIN_CLOSED | None | Backend implemented, restricted |
| Next round | PHASE_CHANGED phase, round | phase-transition / instant screen | Frontend connected |
| Pending resolution | Authorized resolutionStatus only | pending-result / instant Vietnamese message | Frontend connected |
| Match complete | MATCH_COMPLETED winnerIds | match-result / instant results | Inherited |

Reconnect uses newest authorized snapshot, deduplicates event IDs, never replays effects as commands. Replay uses authorized event sequence only. Reduced motion uses instant text and state updates; animations must never delay resolution. Keep existing desktop/mobile layout. Unknown fields ignored by old clients. No public attack or protection animation unless a future official audience rule authorizes it.
