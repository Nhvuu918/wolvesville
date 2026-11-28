# Provenance and boundaries — v1.7.23

The latest owner confirmation of BB-REP-NEW-01=B supersedes A before delivery. Record `owner_bb_rep_new_01_20261125.json` preserves that decision; previous 13 remain intact. The 1.3.4 preview is not an active registry entry.

- VH54 (`data/rule-intelligence/rules_118.json`): trap retaliates on one representative for the collective bite, representative fixed by rule before match. B resolves rank as a fixed full-participant permutation. The current legal eligibility set is separate from that order.
- Character #93: initially phe3 and does not wake with the pack; #94 death breaks the seal, #93 joins wolves, pack may bite two people per night. `transitionExileAfterDeath` is the existing source-bound transition; `packReady` still checks legal post-transition state. The new Live QA composition [74,84,93,94] exercises only a sole converted wolf. No new early entitlement.
- VH74/P04: extra collective bite rights do not stack, max two targets. #48 alone gives two only when sole living wolf; #93 after #94 death is a separate source grant. General simultaneous pack composition not admitted.
- VH52: resurrected wolf may bite that night if the pack action has not resolved. Related future entitlement/revival obligation, NOT the source of #93 conversion. No new revival+pack domain admitted.
- VH42 (#75): pierces defenses and immunities, kills target and protectors; VH72 (#1) theft at most one successful layer per match. These remain genuine completion obligations, not arbitrary unsupported permutations.
- SAME/RESOLVE: already owner-approved; same fixed representative for a committed attack list, no reshuffle or replacement between attacks. Prior live lone wolf #48 retaliation test applies; mixed conversion retaliation not generalized.

Technical decision: RNG tape verification deterministically recomputes expected stored transcript using the bound algorithm; Replay consumes stored state/tape and never samples fresh entropy. The actual game seed is server-generated randomBytes(32), HMAC-separated from assignment/gameplay RNG. `qaRepresentativePolicy` is optional solely for archive compatibility: missing field retains prior QA rank; official 1.3.3 archives are unchanged. No new migration/schema, no official activation.

No remaining owner choice on rank. Mixed pack conversion, mid-window membership, revival and general extra grant require actual integration and acceptance rather than assuming new rules or blocking on owner feedback. Existing zero-eligible/revoked-target edge cases remain outside admitted runtime until resolved with source evidence; no random fallback.
