# FULL contract delta — v1.7.34 (not a new certificate)

Continuation of v1.7.33/FULL_CONTRACT_CLOSURE.md, which remains immutable. PRIMARY #84; SECONDARY #79. No role completion obligation removed. All role/skill source data preserved. See `dependency-graph.json` for deduplicated associations from the existing 97-ID matrix; these are not counts of guaranteed FULL unlocks. No new owner choice; DC-PACK-PRIVACY-BOUNDARY remains PENDING.

## #84 Phù Thủy Câm — WV-A84-SILENCE / WV-CH84-S01

| Obligation | Provenance | Implementation / current evidence | Status and exact remaining work |
|---|---|---|---|
| 84-01 Nightly one-target silence; valid actor/phase/target; repeated actions | JSON#84, PH-01, WV-CH84-S01 | Existing official/s13-mechanics.ts (isS14ChatDeck, S13_SKILLS.silence), engine/validate.ts; S23 #84 actual existing deck | Bounded runtime, unchanged. All valid life/lock/transform and new compositions still unverified. |
| 84-02 Public mute only; receives legitimate public chat, vote independent | VH57, V03 | official/public-chat-access.ts, group-chat.ts; S23 actual existing deck plus S24 ACL fixture | Positive group transport PASS on trusted grant fixture, not a live muted cult member. In the fixture public chat is also outside the admitted public-chat deck domain; S23 establishes actual mute behavior separately. |
| 84-03 Group ACL independent of win links, membership server-issued | VH57, VH59, VH78, REL-02, Q13-08, PRIV-01 | New SystemChatGroup in shared contracts; grantCommittedCultChat/revokeSystemChatMember, prepareSystemGroupChat, engine/service.ts, game/coordinator.ts, engine/visibility.ts; two S24 tests and S24 browser fixture | **Shared transport implemented and fixture-tested, NOT whole dependency closed.** No production caller of grantCommittedCultChat yet. #90 must implement eligible recruitment, event provenance and private notification (VH59, VH50/55, Q13-08, target exclusions and capacity); link grants to actual resolved action in same transaction. Other functional groups need their own profiles/producers. No permission inferred from faction or client request. |
| 84-04 Expiry and overlapping statuses | JSON#84, VH57 | Existing engine/state.ts, S23 existing real game | Unchanged, bounded; still lacks overlapping valid locks, expiry while dead/revived/role-changed. |
| 84-05 Authorized UI/REST/WS/reconnect | VH57/VH68/PRIV-01 | New frontend/integration.js composer driven only by groupChat view, actual HTTP/WS, replay and browser with five authenticated clients using trusted persisted archive | UI/transport PASS in fixture; normal grant creation not available. No new supported public deck. |
| 84-06 PH-01 action survives actor death unless exception; independent skill lock, valid target and group interactions | PH-01, VH10, BB-05 | Existing engine/validate.ts and official/s13-mechanics.ts unchanged | NOT CLOSED. Live combinations of accepted silence, lock, death/return and group rights; do not invent #10 inversion of silence. |
| 84-07 Resource/round/victory, persistence/replay | VH03, QD-01/02/03, PH-01, PRIV-01 | Existing S23 #84 real session and S24 SQLite/replay fixture | Replay validates group authorization at message commit, frozen audience and unique idempotency key. Whole role requires actual gameplay-created group membership and victory; no Normal Gameplay admission. |

The S24 fixture constructs an internal trusted initial archive using actual role assignment RNG and the test-only store method; it is not a client API or a recruitment action. The grant helper is intentionally not a recruitment resolver. `sourceActionId` is recorded, but the future producer must bind it to its committed recruitment action/event. The fixture uses an explicit sourceActionId label, not gameplay proof. Group IDs are opaque, and only entitled clients receive group metadata. The currently implemented life domain is ALIVE/public living and owner ALIVE, active 1.3.3, day discussion/vote collect; no unsupported role-change or death policy is inferred. Frozen event audiences preserve historical rights without admitting new members to old messages. Timing and all other group/pack privacy channels remain outside this scoped acceptance.

## #79 Sói Hòa Bình — WV-A79-CANCEL (secondary, no new role runtime in S24)

| Obligation | Provenance / current code | Status and exact remaining work |
|---|---|---|
| 79-01 open vote, once per match, valid target | JSON#79, official/peace-rules.ts | Existing two one-wolf decks only. |
| 79-02 cancel pending day skills and vote, preserve already executed effects | PH-02 in decisions_21_v1_2_UNCHANGED.json, engine/queue.ts, engine/service.ts | S23 queue cutoff unchanged; actual game with co-queued eligible day skills not admitted. |
| 79-03 result only to actor and authorized other wolves | JSON#79, VIS-03, engine/service.ts private ROLE_OBSERVED | Current actor-only result; general wolf membership, entitlements and frozen audience not implemented. Do not infer entitlement from secret faction alone, do not change PACK-PRIVACY-BOUNDARY. |
| 79-04 cancelled substitute mission awards Oscar | Q13-09 B in q13_12_user_confirmed.json | #6 mission runtime, substitute assignment, Oscar event and resource ledger missing. Q13-09 is already approved; no new question required. |
| 79-05/06 actual victory, restart/replay and UI | PH-02, JSON#28, VH03, QD-01/02/03, existing vote-adjudicator and browser deep-jester | Existing bounded proofs. Actual multi-wolf and director interactions absent. |

## Other alternatives
- #25 BT-25-2: reflection #35 on the second inspection, #3 transformation and trap/unknown aura/noise combinations. Code `official/inspection-rules.ts`, `official/inspection-effects.ts`; no S24 implementation. 
- #74 BT-74-2: #57 disguise, #18 role changes, Q13-06 false-role combinations; same inspection code, no S24 implementation.
- No new Normal Gameplay deck, FULL certificate, branch certificate or metric change. The session did not complete the requested full role factory or F breakthrough. The remaining implementation work is technical, not blocked by an absent owner approval for VH59 or Q13-09. No claim that the group ACL solves all privacy or makes #90 FULL.
