# Sprint 07 — Unresolved Official Rules / Minimal Decision Register

| ID | Precise unresolved point | Evidence | Engine impact |
|---|---|---|---|
| S07-V02 | Are raw ballot intents transformed by special vote manipulators before final tally? Exact order, final valid votes, exceptions | VH01 references **final valid votes after manipulations**, not the generic procedure. Sprint06 notes #33/#91. | `auditRawBallots` diagnostic only; no hanging decision |
| S07-V03 | How tie-at-highest, no ballots, insufficient votes, abstentions and vote replacement work | Source technical QA `Wolvesville_Dac_ta_day_du...` proposes tie→no hang but V03 not answered as confirmed; no fully applicable rule in 118 | No general `VOTE_RESOLVED` or selected death target |
| S07-E01 | General hanging outcome: immunity #8 if wolves alive, delayed rescue, on-death skills, effect ordering | character #8/#28; VH03; VH06 | Cannot launch generic `ELIMINATION` from vote intents |
| S07-E02 | Knight attack protection/linked-death/transformation/revival outside the exact [8,25] deck | character #8, protect #9/#31, 118 decisions | Knight adapter refuses other decks; no false blanket immunity/kill |
| S07-W01 | Full faction/individual co-winning evaluation and conflict resolution when third-party alive | VH03, VH58, VH82, `character.json` | Generic win resolver remains partial facts only |
| S07-W02 | Multiple or simultaneous special-victory predicates and pending post-death effect chain | VH03 | No automatic match terminal beyond closed [8,25] exact branch |
| S07-QA01 | PostgreSQL live persistence verification on Mac Apple M5 | 8 PG tests skipped in this sandbox | Must run `npm run test:pg:acceptance`, `:05`, `:06`, `:07` locally |

No new rules invented, no changes to official evidence. Do not use LPTV werewolf sources. Preserve old original specs to inspect historical discrepancies instead of editing their expected results.
