# Sprint 13 — Engineering Decision Log

- VERIFIED — character.json#11 and VH08 justify maintenance protecting #25 from #76 current-night lock. The actor #76 still spends the confirmed skill use. Tested by S13-01.
- VERIFIED — character.json#16, #24, #66, #67 define night protection/immunity in their respective scopes. Individual layers protect #25 from one certified #8 attack, but stacking remains fail-closed. Tests S13-02 to S13-05.
- VERIFIED — character.json#16 next-night poison blocks non-village skills; #59 / VH31 stone injures current day and next night; #17 / SYS-10 public wolf judgment permanently blocks ability. Tests S13-02/S13-06/S13-07.
- ENGINEERING INFERENCE — allow exactly eight new closed test decks. No change to approved six completed decks, replay version or competitive mode. All events are authoritative; protected/poisoned/jail secret effects are server-only.
- ENGINEERING INFERENCE — new role capabilities are derived from server state, not client-generated. Existing Dark Fantasy artwork and layouts are preserved. Frontend adds only deck selection and multiple skill choice, with public #17 event rendering.
- UNVERIFIED GAME RULE — stacking multiple shields, generic target deaths, full competing-faction victory, post-death chains, general transformation. No default introduced.
