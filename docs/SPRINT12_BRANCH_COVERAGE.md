# Restricted configurations — branch coverage
All six configurations have successful endgame, official vote/hanging, closed elimination, multi-client privacy, restart/replay evidence in tests/sprint12-metrics.test.mjs. They are not branch-complete.

| Deck | Tested | Remaining |
|---|---|---|
| 8,25 | Knight wins after night or hanging; legacy votes | Village winner after knight hanging unresolved |
| 8,28 | Knight wins at night; simultaneous hanging winners; zero/tie/blank | Sole surviving #28 without hanging unresolved |
| 8,9,25 | Shield blocked attack, expires (shared #9 tests), caster death, retry, knight winner; knight hanging blocked | Village faction victory unresolved |
| 8,9,28 | Expiration, knight hanging CONTINUE then #28 wins; knight and #28 co-win | Other terminal branches not certified |
| 8,25,28 | Night death plus hanging and simultaneous winners | Other branches not certified |
| 8,9,25,28 | Three rounds, persistent shield, three deaths, simultaneous winners | Other branches not certified |

Pending-effect classifier unit tested; new real pending-effect chain/fault-injection coverage missing. General secondary death, revival, transformation, multi-shield ordering not certified. Metric C zero. Browser evidence and PostgreSQL status separate from backend metrics.
