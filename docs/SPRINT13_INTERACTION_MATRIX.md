# Sprint 13 — Interaction Matrix Delta

All inherited 4,656 pairs remain at `data/rule-intelligence/interaction_pairs_4656.json`; no automatic certification is given to pairs merely co-occurring in a test deck. The new verified directed interactions are:

| Actor | Target / counteraction | Outcome | Verification |
| --- | --- | --- | --- |
| #11 maintenance | #76 nightmare targeting #25 | Nightmare consumed but #25 inspection executes | S13-01 |
| #16 antidote | #8 attack against #25 | One shield absorbs one night attack | S13-02 |
| #16 poison | #76 acting on night N+1 | Nightmare rejected (next-night lock) | S13-02 |
| #24 jail | #25 inspection / #8 lethal attack | Queued inspection cancelled; prisoner survives attack | S13-03 |
| #66 guard | #8 lethal attack against #25 | Guard absorbs; charges bounded to three | S13-04 |
| #67 shield | #8 lethal attack against #25 | Shield absorbs; charges bounded to two | S13-05 |
| #59 stone | #25 inspection on next night | Skill denied via persistent injury | S13-06 |
| #17 judgment | #76 wolf target | Public role reveal + permanent disable | S13-07 |

Other pairings are **NOT CERTIFIED**.
