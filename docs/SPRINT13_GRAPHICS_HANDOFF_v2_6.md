# Graphics Handoff v2.6 (additive)

Inherited v2.5 assets, scene, map, role wheel and graphic hooks are untouched. New event mapping:

| Event | Authorized audience | Integration | Animation |
| --- | --- | --- | --- |
| S13_DAY_JUDGMENT_REVEALED | ROOM_PUBLIC | FRONTEND_TEXT_CONNECTED_HOOK_READY_ANIMATION_NOT_PRODUCED | NOT PRODUCED |
| S13_OFFICIAL_EFFECT_APPLIED | SERVER_INTERNAL | ENGINE_IMPLEMENTED_PRIVATE | NOT PRODUCED |
| OFFICIAL_NIGHTMARE_RESISTED | SERVER_INTERNAL | ENGINE_IMPLEMENTED_PRIVATE | NOT PRODUCED |

**ENGINE IMPLEMENTED**: seven new character IDs, eight verified technical paths. **FRONTEND CONNECTED**: generic new skill capabilities, optional skill chooser, public #17 announcement. **ANIMATION HOOK READY**: public-judgment-reveal only. **ANIMATION PRODUCED**: none. **DESIGN PREVIEW**: inherited only. **BLOCKED BY RULE**: no generalized death/win reveal outside approved completed decks.

Reconnect/replay: use server sequence and event ACL; never expose internal protection, blocked attack, poison or custody identity. Reduced motion: instant role/name text with no motion dependency.
