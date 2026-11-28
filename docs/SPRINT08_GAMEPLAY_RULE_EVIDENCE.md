# Sprint 08 — Rule Evidence and Policy Gate

| Source | Exact operative substance | Implemented scope | Confidence |
|---|---|---|---|
| `character.json#8` | “Mỗi đêm, bạn có thể lấy mạng một người chơi”; “Bạn thắng nếu bạn là người chơi cuối cùng” | Closed two-person night kill followed by sole-survivor victory | CONFIRMED source |
| `character.json#25` | Mỗi đêm có thể xem vai người khác | Simultaneous accepted inspect while #8 attacks, only private feedback | CONFIRMED source |
| `character.json#28` | “Bạn phải lừa dân làng treo cổ bạn. Nếu họ treo cổ bạn, bạn thắng.” | #28 killed **at night** by #8 has **not** satisfied hanging-only win; no other death reaction in catalog. Exact two-person closed deck only. | CONFIRMED source; certified closed-world composition |
| `character.json#79` | Once per match reveal role and prevent daytime vote | #79 in existing `[25,74,79]` closed deck only | CONFIRMED source |
| `PH-02` | #79 keeps completed day events, cancels pending day actions and vote, transitions to night | Persist a distinct `CANCELLED_NO_ELIMINATION` outcome and public `VOTE_OUTCOME_CONFIRMED` after commit | CONFIRMED |
| `Q13-09` | Cancelled day has no final valid vote; specific Oscar exception when #6 exists | `#6` Oscar branch NOT enabled; cancelled vote never triggers hanging | CONFIRMED with scoped conditions |
| `VH03` | Finish current effect chain, then jointly evaluate win conditions | Post-elimination chain gate is mandatory before `MATCH_COMPLETED` | CONFIRMED |
| `VH58` | Do not finish by faction count while independent winner can still compete | No generic faction win or premature endgame | CONFIRMED |
| `VH01` | At least 2 FINAL valid ballots for a specific special condition, after vote manipulation | Cannot be misused as a general hanging threshold | CONFIRMED, narrow scope |
| V02 / V03 in earlier technical QA | Proposed vote transformation and highest-tie rules; source marks confirmation still unanswered | `ADJUDICATION_UNRESOLVED` with immutable private audit, never a hanging outcome | AMBIGUOUS / MISSING final decision |

**Source distinction:** `data/rules/tests_207.json` is a set of 207 scenario specifications, **not** 207 executed rule tests or new confirmations. `T-MC-21` and `T-MC-36` reinforce that cancelled votes must not fabricate final ballots. Fixture adapters and browser prototype data were not used as official evidence.

**Why Metric B remains zero:** No verified final-ballot transformation for #33/#91 or general V03 handling of ties, abstentions, no-vote and hanging triggers. Raw-vote leaders—even uniquely highest—cannot be declared a hanging victim from the source.
