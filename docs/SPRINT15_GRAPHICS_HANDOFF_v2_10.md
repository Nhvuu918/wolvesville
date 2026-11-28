# Graphics Handoff v2.10 WIP — owner seer correction

Inherits v2.9 in full. Adds one private event; no artwork or other gameplay changes.

| Event | Audience | Payload / projection | UI / motion | Replay / reconnect |
|---|---|---|---|---|
| `SEER_AURA_OBSERVED` | Acting Tiên Tri only | Event verdict, sourceRule, actionId; authorized feedback `{verdict,targetId,context:"SEER_AURA"}`, `AURA_INFORMATION`; no character ID | `.wv-feedback-item`, `.wv-inspection-target`; instant text; no new animation | Stored event, same private projection |
| `ROLE_OBSERVED` | Unchanged | #74 and historical v1.3.1 exact-role results | Unchanged | Unchanged |
| `SOUL_JUDGMENT_OBSERVED` | Unchanged | #5 separate verdict context | Unchanged | Unchanged |

Source: S15-OWNER-SEER-01.

