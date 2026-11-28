# DC-PACK-PRIVACY-BOUNDARY — Rule Decision Required

**Not approved. No live activation. Existing 18 choices unchanged.**

## Provenance
`data/rules/owner_dc_decisions_20261125.json` DC-PACK-KEEP=A; `data/rules/owner_bb_final_decisions_20261125.json` BB-01, BB-02, BB-03, KEEP, BB-PENDING-01, BB-PENDING-02, SAME/RESOLVE; `data/rules/owner_bb_rep_new_01_20261125.json` BB-REP-NEW-01=B. VH68 defaults to no notification except as required by rule/action entitlement. None expressly authorizes a private target revocation oracle before resolution.

## Minimal counterexample and executable evidence
One eligible wolf submits X (or all eligible wolves submit the identical pair X,Y). Every public player state, actor-visible entitlement, submission history and receipt is the same. The only hidden difference is whether X is a legal non-wolf target. At lock, S1 must be allowed to commit the valid unanimous set, S2 must stay open and require a replacement; no deadline, fallback, automatic vote, or illegal attack. The existing reducer exposes locked/unlocked and the live protocol necessarily exposes either usable next-phase capabilities or the still-open submission window if it advances the match. The test `S21 PACK KEEP privacy counterexample: two identical receipts but unavoidable distinct lock outcomes` verifies equivalent blind receipts and different lock outcomes using two targets. This is a state-level counterexample, not proof of a reachable mixed-deck transition or a successful privacy test. Even concealing the `locked` flag does not hide whether the next lawful action/phase becomes available. Waiting indefinitely in S1 merely to match S2 would defeat liveness. This conclusion assumes that the client is entitled to observe whether its window remains open and can choose a replacement; no quantitative timing claim is made. A legitimate game result can also disclose information once legally permitted.

## Threat model and status
| Observation | Analysis / status |
|---|---|
| Target list, selected targets and intake receipt | `publicPackTargetIds` and blind `ownPack` preserve public-death/self filtering and submitted targets; paired pre-lock receipt equality is proved in state-level test. |
| Waiting state, phase transitions, actual actions | Minimal counterexample above: unavoidable distinction at lock if valid consensus can advance while revoked selection must wait. |
| Revisions, event counts, timing | The old live projection still has globally visible revision/timing risks. No fresh claim of equivalence or constant latency. Candidate reducer also exposes locked/revision to its trusted lab API; not permitted to publish directly. |
| REST/WebSocket/reconnect | Existing mixed live QA is not bound to S21 policy. Its regression is not new KEEP privacy evidence. |
| Replay | Serialization of revocation state is tested; no new live replay acceptance for S21 pack. Legacy event journals remain pinned by archived policy; no retrospective mutation. |
| Public invalidation (e.g. public death) | Candidate revalidates observed server snapshots on submit and lock, permanently revokes latest invalid selections even for temporarily ineligible authors, preserves other choices. A transient invalidation never observed by reducer is not proven. |
| Hidden invalidation | Counterexample; no live activation. |
| Two targets, representative, KEEP | State-level test: revoke pair when any target invalid, retain fixed representative order, require explicit replacement, no auto-selection. |

## Owner choices (only this new privacy boundary)
A — Authorize disclosure of **generic replacement required** to the affected eligible wolf at the lock boundary, after a trusted revalidation (not at intake). Continue waiting and do not disclose cause, role, faction, the offending seat within a multi-target set, another wolf's private choice or RNG. This preserves DC-PACK-KEEP=A, unanimity, no deadline/fallback, and committed attacks. **It deliberately permits the inference that a previously submitted set cannot be used**. The accepted leakage boundary must include the fact that the window stays open. Additional transport, timing, membership, restart and replay tests are still necessary. Recommended only if owner accepts this narrow observable fact.

B — Retain strict noninterference even at lock; keep current candidate disabled until a new gameplay rule changes the observable distinction (e.g. a public eligibility checkpoint or a common resolution procedure). Such a rule would require explicit reconciliation with DC-PACK-KEEP=A and BB-PENDING-01; there is no authorized implementation yet. Do not secretly make an invalid attempt count as consensus, commit a no-op, or advance both states.

Neither option is activated by this report. Do not request re-approval of the 18 previous decisions. Strict privacy for the existing behavior remains PARTIAL.
