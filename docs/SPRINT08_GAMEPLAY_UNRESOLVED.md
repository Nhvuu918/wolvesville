# Sprint 08 — True remaining official rule blockers

| ID | Source searched | Missing decision (not an already-implemented technique) | Gameplay effect |
|---|---|---|---|
| S08-V02 | `official_merged_118.json` VH01; `tests_207.json` #33/#91 cases; technical QA V02 | Final vote transformation order and who gets the final valid vote after manipulations | Cannot compute authoritative `finalVotes[]` for general decks |
| S08-V03 | Technical QA V03 proposal, 118 decisions | Actual decision for highest tie, zero votes, abstention, changing a vote, insufficient participation, and whether unique highest is sufficient for hanging | Cannot designate a person to hang or mark no hanging from raw vote counts |
| S08-E01 | `character.json` #8/#28/#33 and 118 decisions | Full hanging immunity / revenge / rescue / effect order across wider decks | Generic `HANGING_FINALIZED` and post-vote death chain must remain unavailable |
| S08-W01 | VH03/VH06/VH58/VH82; role descriptions | Complete combined-faction, simultaneous-win and pending revival rules for an open 97-character game | No general `MATCH_COMPLETED` predicate / competitive launch |

**Applied immediately without more user answers:** #79 cancellation and next night, closed deck [8,28], audited elimination and victory confirmation. No reason to ask for all 97 role rules again.

**Targeted future confirmation, if needed:** exact V02 final ballot transformation and V03 handling of tie/no-ballot/one-highest. Do NOT infer those from VH01's special two-vote threshold. These are the only blockers to raising Metric B in the present tested decks; other special roles require their own verified interaction rules.
