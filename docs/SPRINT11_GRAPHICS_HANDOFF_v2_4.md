# Graphics v2.4 — additive to v2.3

No artwork, typography, scene or layout replacement. The machine-readable delta is `gameplay-flow-handoff/S11_GRAPHICS_CONTRACT_v2_4.json`.

| State | Authorized trigger | Audience | Hook / fallback | Status |
|---|---|---|---|---|
| Vote open/change/blank | phase DAY_VOTE_COLLECT, ownBallot, canVote | Own selection private | vote-panel-open / instant buttons | Implemented, tested |
| Vote locked | VOTE_LOCKED round | Room | vote-lock / status text | Implemented, tested |
| Tie / zero | OFFICIAL_VOTE_RESULT outcome NO_HANGING_TIE / NO_HANGING_ZERO | Room | vote-result / next-round banner | Implemented, tested |
| Hanging | PLAYER_ELIMINATED playerId and committed OFFICIAL_VOTE_RESULT HANGING_COMPLETED | Room | elimination-reveal / mark seat dead | Implemented, tested restricted decks |
| Victory | MATCH_COMPLETED winnerIds | Room | match-result / win/loss text | Implemented, tested restricted decks |
| Pending win rule | VICTORY_PENDING_RULE round | Room | pending-result / wait text | Partial |

HANGING_AUTHORIZED, OFFICIAL_BALLOT_AUDIT, POST_ELIMINATION_CHAIN_CLOSED, VICTORY_EVALUATED and tallies are server-only. No animation may compute a victim, reveal hidden role, or choose winner. On reconnect use latest projection and own ballot, deduplicate eventId and never replay a stale death animation. Replay respects authorized event sequence. Motion optional; instant status text and reduced-motion fallback required. Existing v2.3 and older event payloads remain compatible; the legacy vote intent payload receives an additive round field only for new policy. New animation hooks are specifications, not implemented art. Mobile/keyboard visual validation of new statuses remains partial; inherited responsive suites remain available.
