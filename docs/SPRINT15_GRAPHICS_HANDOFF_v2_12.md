# Graphics Handoff v2.12 — additive, WIP
Inherits v2.11 and prior contracts. No new animation asset produced. Existing authoritative projections and text feedback are used; reduced motion is static text/seat state.

| Trigger / event | Audience and payload | UI / hook | Reconnect / replay |
|---|---|---|---|
| WITCH_WINDOW phase | Authorized room state phase; no private target mapping | phase label Đêm · Lượt Phù Thủy, host resolution control, authorized poison action | phase snapshot restored; text only |
| SEER_AURA_OBSERVED | #25 only, verdict/action/target; no true role, no modifier source | existing private aura panel | same authorized stored event, text fallback |
| ROLE_OBSERVED | #74 only, exact role result | existing private role panel | existing versioned behavior |
| #58 S15_DEMON_FACTION | actor only; faction and correlation, not public | existing result panel: Hai người cùng phe | private event persisted; static text |
| S13_OFFICIAL_EFFECT_APPLIED | server-internal status/protection/action provenance | ordinary authorized acknowledgement; no secret source marker | internal persisted, never public |
| PLAYER_ELIMINATED | public playerId only | existing elimination seat/log | public stored event; no attacker or cause |
| POST_ELIMINATION_CHAIN_CLOSED | internal audit only; victimId/rule/closure | no public animation or payload | audit only |
| MATCH_COMPLETED | public committed winner IDs | existing victory screen | committed winner replay; no recomputation by client |
| #93 mute/vote restriction | affected player sees own chat/vote capability; public mute only under existing authorized contract | existing chat feedback, vote disabled with server permission | restored from state; no source disclosure |

UI connected to generic skill selection and server capabilities, including optional self target only when permitted. Browser certification is per suite, see S15 accelerated acceptance report.
