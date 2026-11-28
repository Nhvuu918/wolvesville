# Graphics contract v2.18 (WIP; compatible with v2.17)

| Event / projection | Server trigger | Audience | Payload / UI | Replay / fallback |
|---|---|---|---|---|
| S15_SCALE_BELL_OBSERVED | First actual death batch intersects stored pair | PLAYER_PRIVATE, living Bell Ringer only | roleName, authorized targetId; correlation to pair action. Text: Chuông báo. No pair ids or character IDs in visible text. | Authorized event survives reconnect/replay; plain text is reduced-motion fallback. |
| OFFICIAL_ATTACK_BLOCKED (existing) | Single valid snow layer absorbs one pack bite | Existing approved visibility | Existing shield feedback, no new secret attacker exposure | Existing event contract; no animation change. |
| S15_FINAL_PHARMACIST_PRELIMINARY (existing) | Unblocked bite creates preliminary death | Authorized pharmacist only | Eligible rescue targets; blocked victim excluded. | Private selection and persisted event; text fallback. |
| MATCH_COMPLETED (existing) | Stable death ledger, QD-01 or verified wolf victory | Room public | Existing winner set and names | Existing winner projection / replay. |

State: Engine implemented in listed QA compositions, frontend connected and browser tested; no new animation assets produced. Preserve role wheel, composition, chat and Dark Fantasy layout.
