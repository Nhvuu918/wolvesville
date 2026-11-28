# v1.7.22-s15-stability-completion-wip

- WV-BR-2026-1125-01: REST terminal projection now renders the active board synchronously before asynchronous feedback/events. Reconnect resync ignores a late response for a game no longer selected. No winner adjudication or role disclosure changed.
- Normal E2E deliberately disconnects one participant during the real terminal commit and gates auxiliary feedback; the original DOM assertion must pass before the gate is released. Additional assertions check visible winner names against the authenticated profile. The reproduction on the previous UI is retained in reports/s15-stability/diagnostic-winner-before.log.
- Added actual-room acceptance for both five-player normal rescue decks (#87 independent resources, self-rescue, mute/vote expiry, healer death, replay), and a live B/B empty cross-window / later poison-only path. These are incremental evidence, not FULL or Branch Complete certificates.
- Finite release scope contract: reports/BB_STABILITY_RELEASE_SCOPE.json. No changes to historical rule records or effective rule version.
- Human QA remains pending. Run the existing local QA setup documented in the prior README, with a new database file. See reports/BB_STABILITY_HUMAN_QA_PACK.md.
