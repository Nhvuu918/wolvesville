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

## v1.7.4 accelerated — additional verified restricted paths
See SPRINT15_ACCELERATED_RULE_DERIVATIONS.md and reports/S15_SKILL_BRANCH_COVERAGE.json. #29/#67 valid shield consumes poison; #3/#25 aura vs #74 exact; #93/#25 skill lock and day chat/vote lock; #94 concealment while alive; #71/#25 persistent aura; #15 one target death; #58 same/different faction self exception; #77/#8 trap counter-kill. All other cross-role combinations remain uncertified. No priority for multiple conflicting modifiers inferred.
