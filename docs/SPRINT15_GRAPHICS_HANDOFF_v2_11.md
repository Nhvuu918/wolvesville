# Graphics Handoff v2.11 — additive triggers, WIP
Inherits v2.10, v2.9 and previous contracts. No new animation asset produced.

| Trigger / event | Authorized audience and payload | UI / hook | Replay / reduced motion |
|---|---|---|---|
| #49/#72 S13_OFFICIAL_EFFECT_APPLIED | server internal; modifier kind, source/target, action correlation | actor gets normal authorized action acknowledgement, no public curse marker | persisted; existing instant-text fallback |
| SEER_AURA_OBSERVED | #25 only; verdict + sourceRule + actionId, no real role | existing aura feedback; no disclosure of modifier source | same private projection after reconnect/replay; text |
| #54 PLAYER_ELIMINATED | room public; victim playerId only, no attacker/cause | existing death-seat state and event log | public stored event; static seat marker fallback |
| #54 S15_PUBLIC_ROLE_REVEALED | room public; target playerId + roleName, no source actor | existing reveal text | existing replay/reconnect; static text |
| MATCH_COMPLETED | room public winnerIds from engine | existing victory screen | preserved committed outcome, text fallback |

Frontend connected, new animation production not claimed. No rule change to #74, wheel, composition, chat or owner seer version.
