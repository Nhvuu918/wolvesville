# Owner Decision Pack — v1.7.20 (not a new approval)
All ten B/B decisions in `data/rules/owner_bb_candidate_v2_decisions.json` are preserved. 1.3.4 remains DRAFT, not effective. The following questions are limited to policy gaps.

## BB-PENDING-01 — Indefinite wait and AFK
Current BB-01=B waits without automatic fallback while an eligible wolf has not responded. Technical reconnect and retry do not require another decision. A permanent absence policy is still open: A keep waiting until response/authorized existing match cancellation; B define a timeout and cancellation/forfeit policy. Recommend A for now, as B requires a separately specified timeout, affected participants and winner handling. Neither random target nor automatic bite is allowed. Unlocks production phase progression and missing-response tests (all wolf roles, pack C). Edge cases: no eligible wolves or revoked target at lock remain unresolved; no invented bite.

## BB-PENDING-02 — Representative order
VH54 and BB-03 specify a representative and fixed order, not how the initial order is produced. A server-seeded random permutation of eligible seats, persisted before first action (recommended, avoids seat advantage); B fixed initial seat order, deterministic but predictable. Live QA uses a fixed sorted player-ID fixture only. Affects all pack roles, #77 retaliation, attribution and replay; unlocks production initialization and changed-membership tests. The new sole-wolf QA does not require a choice between A/B.

## BB-PENDING-03 — Cross-window grouping
BB-05=B is implemented for both #29 potions in the same WITCH_WINDOW. For a role with separate legal windows (e.g. #87), A treat each legal resolution window as one group; B group all actions of that actor across the same night (requires deferred consumption and cross-window transaction design). Recommend A only for roles whose official windows are independent. Affects #10/#87 and resource/cooldown, death-chain, rescue and replay tests. No cross-window policy is active.

Reply e.g. `BB-PENDING-01=A; BB-PENDING-02=A; BB-PENDING-03=A`. These are requests, not approvals. Other unsupported interactions remain explicitly blocked; approval does not replace implementation or testing.
