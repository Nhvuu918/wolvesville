# Human QA v1.7.29 (PENDING)

## Normal handoff: [8,25] and [8,74]
Run normal mode (WV_OFFICIAL_RULE_TEST_MODE=0, WV_INTEGRATION_TEST_MODE=0, WV_OWNER_BB_LIVE_QA=0). Use two independent browser profiles. Register, create two-seat room, join, lock, configure `knight` / `s15-mystic-knight`, ready both, start. Seer inspects Knight, coordinator advances night. In DAY_DISCUSS, close original coordinator's browser, successor claims control, reconnect original with same account. Successor opens voting, Seer chooses Knight and submits. Successor closes vote; Seer wins under V03. Verify exactly one private inspection result, own roles only, coordinator rights, replay, and terminal banner. Do not reveal roles in normal UI to the other player. Repeat both decks and whichever seat is assigned coordinator.

## QA #23
Run official local QA (not competitive). Deck [8,23,25,36]; QA-SOUL-01 and QA-SOUL-02 from v1.7.28 remain. New backend scenario: #23 shields self, #36 fireball targets #23; no first death. Then vote to hang #23, verify sticky public death and private two bullets at next night. #8 targets publicly dead #23 (bounded QA blind behavior), final death remains private and no public duplicate. Replay and SQLite restart. Do not promote blind targeting to a general normal rule.

## Trap + Revival / Mixed pack
Reuse the v1.7.28 Human QA tasks, no rules expanded. Verify [8,10,25,26] and [48,74,77,84,93,94]. No competitive deployment. Human acceptance requires owner feedback; automated evidence is not Human QA.
