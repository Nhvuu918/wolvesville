# Sprint 15 restricted interaction evidence
| Deck | New evidence | Unsupported broader path |
|---|---|---|
| 25,43; 23,25,43 | sniper day/night, shield interaction | team bite/victory and other targets |
| 8,25,36 | mage shield vs knight, private role feedback | general layered shields and victory |
| 23,25,36 | fire and shield coexist | arbitrary deck |
| 25,66,67 | observer excludes own shield/provider | other protection sources |
| 25,74,87 | sedative blocks REST/WS public chat and vote; expiry | healing, positive hanging, special chat |
| 25,54,74 | reveal after day 1 vote | shoot, other phases and positive hanging |
| 8,25,80; 25,32,80 | same/different faction using previous-night death facts | revival, transformations and other death sources |
Evidence: tests/sprint15-roles.test.mjs and S15 metrics. No new match completion or official vote-to-victory certification.

## v1.7.3 continuation (supersedes earlier completion counts above)

| Deck | Executed path | Boundary |
|---|---|---|
| 25,72,84 | VH39 target aura curse; expiry; private feedback | No exact-role distortion or pack bite |
| 25,49,84 | VH25 global aura illusion, two charges | No concurrent competing modifiers or pack bite |
| 25,54,74 | Day 2+ pre-vote shot; same-day reveal exclusion; next-day reveal | Positive hanging / team endgame not certified |
| 8,28,74 | Night elimination, exact-role investigation, official hanging, co-winners | Branch completeness not certified |
| 8,25,74 | Night elimination, exact-role investigation, official hanging, sole-survivor | Branch completeness not certified |

Evidence: tests/sprint15-aura-expansion.test.mjs; reports/S15_METRICS.json. Total A=10, B=8, C=0 (derived by metrics runner).

## v1.7.4 accelerated
Seven additional durable GAME_COMPLETED decks: 8,74; 8,9,74; 8,25,28,74; 8,9,25,74; 8,9,28,74 (official vote-to-victory); 15,25; 25,58,74 (night skill sole-survivor). Other new decks provide scoped skill execution only. All remain C=0: not branch-complete. See reports/S15_METRICS.json.
