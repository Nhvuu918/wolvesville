# Graphics Handoff v2.14 — additive WIP
Inherit v2.13, existing Dark Fantasy UI, role wheel, composition, chat. No produced animation assets. Reduced-motion fallback = existing static notices, seat state and result panels.

| Trigger | Audience / payload | UI hook | Replay / reconnect |
|---|---|---|---|
| S15_BREAK_HANGING_PREVENTED | SERVER_INTERNAL; candidate, source rule | no client exposure | audit only |
| OFFICIAL_VOTE_RESULT NO_HANGING_IMMUNE | ROOM_PUBLIC; round/outcome, no source or target | generic no elimination notice | public result restored |
| S15_BREAK_STONE_SPENT | PLAYER_PRIVATE; roleName | private ordinary wolf label, spent ability | projected from durable marker |
| S15_BREAK_BALLOT_OFFER | PLAYER_PRIVATE, recipient; directed target and round, no sender ID | private prompt / accept-decline skill controls | authorized event and capability |
| S15_BREAK_BALLOT_RESPONSE / SETTLED | PLAYER_PRIVATE, respective parties; status, round only | private feedback | persisted ACL |
| S15_BREAK_HANGING_REDIRECTED / SWAP_PLACED | SERVER_INTERNAL; original and actual target, provenance | no public mapping; ordinary action acknowledgement | internal audit only |
| S15_BREAK_EFFIGY_PLACED | SERVER_INTERNAL; source and target | no public mapping | internal audit only |
| S15_BREAK_ALIGNMENT_CHANGED | PLAYER_PRIVATE; faction | own faction HUD, private notice | current faction and history persisted |
| PLAYER_ELIMINATED / MATCH_COMPLETED | ROOM_PUBLIC; actual eliminated player / winner IDs | existing seat and results | server-authoritative |
