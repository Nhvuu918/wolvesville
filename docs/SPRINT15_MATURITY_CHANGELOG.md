# Sprint 15 maturity — v1.7.13 WIP

## Product change (ENGINEERING INTERPRETATION)
- Admit [25,31,48,74] in `normal-decks.ts`: same official closed domain as `PLAY_GUARD_DECK`; existing coordinator, random server assignment, Ready, online membership, current rule binding, normal phase control and privacy are unchanged.
- No new player-count law. This is a deployment allowlist for a distinct verified composition, not unrestricted role admission. One wolf only; #48's previously implemented maximum of two targets is preserved.
- Tests: `Normal four-human guard and leader...` uses real HTTP/WS, SQLite, restarts, both winners, private inspection, actual blocked bite and rejected outsider/dead action. New browser suite requires both Village and Wolf scenarios with both QA flags off, actual user-facing controls, and clean exit.

## Browser stabilization (ENGINEERING INTERPRETATION)
- Historical 1.7.10 logs show Channel.send TargetClosedError following gameplay assertions; first 1.7.13 parallel run also reached the deadline on Guard. No PASS is granted for these attempts.
- Bridge I/O callbacks now run off the Playwright event loop. Disposal disables new work, waits already pending JS operations, disconnects, drains binding tasks and context-owned protocol tasks, then closes. Asset cache retains real backend bytes only. No assertion dropped, no error suppression added, no deadline increased. The protocol drain uses Playwright Python internal channel ownership; retest when updating Playwright.
- Matrix now has 51 distinct suites, 86 version obligations. Old reports/logs remain historical. Completed current runs only determine current matrix.

## Multi-wolf intake (EXPERIMENTAL — NOT OFFICIAL)
- `backend/src/experimental/pack-intake.ts`: trusted eligibility snapshot input, phase/round/rule/revision binding, per-actor idempotency, distinct target cap <=2, lock-time filtering, immutable serializable ledger, actor-local projection; explicit pre-established representative input (VH54), no replacement election.
- No adapter registration, route, database migration or official attack emission. No client access or R/F/A/B/C credit. Caller must derive actual eligible wolves and targets from authoritative state; prototype does not grant bite rights.
- A proposed unique-plurality consensus with last valid choice and no bite on tie remains **PROPOSED GAMEPLAY EXTENSION**. Alternatives: representative-only choice (faster, centralizes power), unanimous choice (slow, permits veto), secret plurality (less centralization, ties may suppress bites). Multi-target consensus, eligibility changes, tie handling and representative removal need owner decision. VH54 determines retaliation attribution, not consensus; VH74 caps bite targets, not ballot mechanics. No official selection inferred.
- Prototype tests demonstrate serialized deterministic lock, rejection of revoked actors/targets, retry conflicts, privacy and target/phase caps. Not Game Session persistence or multi-client proof.

## Atomic source inventory (VERIFIED RULE / source-derived)
- Ten additional roles (3,5,11,17,20,24,34,36,52,66); 24 source-distinct branches. Inventory labels for missing adapters are not registered skill IDs. Source-backed branch evidence is limited to the documented runtime domain. No new FULL certification.
- Existing 97 IDs, rules and decisions unchanged. No new R, unique match A/B or branch-complete certificate counted by reusing the Guard deck.
