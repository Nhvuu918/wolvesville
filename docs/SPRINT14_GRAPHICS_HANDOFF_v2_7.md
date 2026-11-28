# Graphics extension 2.7 (WIP)
Inherits v2.6; no animation produced. Existing event contracts remain unchanged.
| Event | Audience | Hook / fallback |
|---|---|---|
| GAME_PUBLIC_CHAT | authorized room participants, frozen recipient list | render escaped sender/message, replay authorized events only |
| PUBLIC_CHAT_MUTED | ROOM_PUBLIC | display permitted mute notice; server capability controls input |
| S14_STONE_ROLE_REVEALED | ROOM_PUBLIC | reveal actor role only; text fallback |
| S14_DEATH_FOLLOW_AUDIT | SERVER_INTERNAL | no client hook |
| PLAYER_ELIMINATED / GAME_COMPLETED | existing audience | existing animation hooks, no payload expansion |
Skill options/resources/second target and chat UI connected in frontend integration.js/css. Reconnect uses authorized game snapshot. Reduced motion uses existing text feedback. Browser S14 gameplay and inherited regression passed after transport recovery; no event or payload change in recovery revision. Never publish internal protection/attack audit or source of mute.
