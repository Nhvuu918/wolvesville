# Match readiness — 1.7.5-s15-deep-wip

A=24; B=18; C=0. Unique sorted initial Character IDs; duplicate winning routes in a single deck never increment A twice.

## New completed decks
- 8,25,29 — Kỵ Sĩ Không Đầu / Tiên Tri / Phù Thủy
- 8,25,85 — Kỵ Sĩ Không Đầu / Tiên Tri / Thầy Thôi Miên
- 15,25,74 — Thần Tình Yêu Hắc Ám / Tiên Tri / Tiên Tri Huyền Bí
- 25,28,58 — Tiên Tri / Thằng Ngố / Thám Tử Ác Ma
- 8,9 — Kỵ Sĩ Không Đầu / Thiên Sứ Tuyết
- 8,9,25,28,74 — Kỵ Sĩ Không Đầu / Thiên Sứ Tuyết / Tiên Tri / Thằng Ngố / Tiên Tri Huyền Bí
- 25,28,79 — Tiên Tri / Thằng Ngố / Sói Hòa Bình

## C counterexample
The real HTTP match [8,9] with #9 voting to hang #8 commits #8 death but reaches BLOCKED_BY_RULE: no explicit certified village victory predicate. It does not create MATCH_COMPLETED. The same general gap prevents C certification in other village-containing decks. The night attack, shield, no-vote, positive hanging and knight winner path are tested, but the counterexample is a valid alternate branch, not excluded.
