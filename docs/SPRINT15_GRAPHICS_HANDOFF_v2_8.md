# Graphics extension v2.8 — WIP, inherits v2.7
No animation assets produced. Existing hooks remain unchanged. Rendering and reconnect use authorized projection only.
| Event | Audience | Payload and hook/fallback |
|---|---|---|
| S15_MAGE_SHIELD_REVEAL | ACTOR_PRIVATE (mage) | Role information feedback, context SHIELD_SUCCESS; role name text only; never show protection source publicly. |
| S15_GUARD_OBSERVED | ACTOR_PRIVATE (guard) | Protected player IDs only, render authorized display names, no protector ID. |
| S15_VIOLIN_RESULT | ACTOR_PRIVATE (violinist) | Same/different faction result, text only. No actual faction disclosure. |
| S15_PUBLIC_ROLE_REVEALED | ROOM_PUBLIC | Target player and role name; no internal Character ID in projected payload. |
| PUBLIC_CHAT_MUTED | existing scope | Existing muted notice; authorized vote capability independently disables voting for sedative. |
Replay and reconnect use persisted events and authorized snapshot. Reduced-motion fallback is text. Backend + frontend connected; browser acceptance partial. Animation production and generic deck support not certified.
