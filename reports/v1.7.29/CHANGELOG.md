# v1.7.29 changes

- Fix authenticated restore/handoff race in `frontend/integration.js`: projection updates seat mapping before DOM paint, game navigation before auxiliary reads, stale room revision guard, ignore replaced socket frames.
- Keep full normal gameplay browser assertions; extend the same suite with a role-seer handoff scenario and a controlled hold on real feedback GET during restore in both handoff branches.
- Add two adapter regressions (same tests fail on v1.7.28), live [8,74] handoff with private role, vote, restart and replay, and #23 self-shield → hanging → secret revival → second death QA acceptance.
- No new role implementation, no rule changes, no FULL certificate or normal deck promotion. No backend source modified. SHARED-23, FULL-36, TRAP-04/05, PACK-05 and PACK-PRIVACY-01 remain PARTIAL.
- Browser pre-final diagnostic retained but excluded from final fingerprint acceptance.
