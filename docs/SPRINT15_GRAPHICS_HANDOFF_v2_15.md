# Graphics v2.15 additive WIP
Inherit v2.14. No new animation assets. Static text/seat feedback is reduced-motion fallback.

| Event | Audience / payload | UI and replay |
|---|---|---|
| S15_FINAL_REVENGE_AVAILABLE | PLAYER_PRIVATE; round only, dead #33 | private skill choice/skip, restored from pending marker on reconnect |
| POST_ELIMINATION_CHAIN_PENDING / CLOSED | SERVER_INTERNAL; victim and provenance | no public mapping, replay audit |
| S15_FINAL_PHARMACIST_PRELIMINARY | PLAYER_PRIVATE; bite victim player IDs, round | authorized rescue target selection, durable pending states |
| S15_DEEP_RESCUE_APPLIED | existing private audience | private feedback, existing replay |
| PLAYER_ELIMINATED / MATCH_COMPLETED | ROOM_PUBLIC; actual victim / winner IDs | existing seat/result panel; no attack origin, no mark or rescue leak |

Pack selection uses server-provided eligible IDs and 1–2 target controls. Alignment uses existing private event. No shared wolf chat is enabled.
