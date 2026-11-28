# Sprint 15 Verified Completion Scale-Up — rule provenance

Baseline 1.7.9-s15-approved-wip; current 1.7.10-s15-scaleup-wip. Rule version remains wolvesville-official-v1.3.3. The previously approved decisions are unchanged. No new owner decision is implied.

## #64 Bell Ringer
- VERIFIED: data/character.json#64: at night select two players, may change selection before a selected player dies, reveal the other player's role on death.
- LOGICALLY DERIVED / SOURCE CONFLICT: Ma_Soi_Quy_Tac_Da_Chot_Va_De_Xuat.xlsx, sheet `04 Char nguon`, row 65 (legacy source ID 67, canonical character ID 64), contains answer `được thay cả hai mục tiêu, nếu cả hai cùng chết thì lộ vai trò cả hai cho người rung chuông`. Status is `ĐÃ CÓ TRẢ LỜI – CHƯA ĐÁNH DẤU CHỐT`, not a separate owner-approved decision. The narrative VH reference does not mark this answer settled. For the simultaneous event, symmetric reveal of both is consistent with the definition; restricted QA implementation records the answer and does not certify a global interaction rule.
- ENGINEERING INTERPRETATION: pair is replaced atomically, frozen after first death batch; evaluate once after the batch, no partial disclosure; private role name only, no public pair marker. An alive owner and two distinct living *other* players are the admitted target constraints. Self-targeting and a dead owner's entitlement are not resolved globally. No claim of FULL.
- Implementation: `backend/src/official/bell-rules.ts`, `engine/service.ts`, `official/s13-mechanics.ts`, `official/capabilities.ts`, `engine/elimination-chain.ts`, `frontend/integration.js`.
- Evidence: three Scale #64 tests, browser_s15_scale_bell_e2e.py. No private result when unmarked player dies, cannot select again after observation, two simultaneous deaths produce two observations exactly once.

## #48 pack protection / rescue
- VERIFIED: character.json#48 sole remaining wolf may bite twice; P04/VH74 maximum two, #9 night shield blocks one attack for two nights; VH64/#87 recovery applies to a wolf bite victim.
- DERIVED: in a one-wolf, one-layer domain each independent bite target is checked for protection before preliminary death; a protected player is not a rescue candidate. No new priority among multiple shields. Use the existing authoritative rescue window and stable ledger.
- Admitted decks: [9,25,48,74], [9,25,48,74,87], [25,48,64,74]. Rule 1.3.3 only. New death/rescue interactions remain QA scopes.
- Evidence: Scale leader tests + scale rescue browser; invalid candidate rejection, resource retry, rescue exhaustion, restart, privacy, QD-01 dead Village co-winner.

## Multi-wolf pack: decision gap
Original VH source reference: `Hệ thống hỏi mục tiêu cắn bầy theo luật phòng; áp dụng P04 tối đa 2 mục tiêu dù nhiều hiệu ứng tăng lượt kích hoạt.` VH54 addresses who receives trap retaliation, not who selects targets. No verified rule for disagreement, abstention, lock or selection authority found in reviewed materials. Alternatives requiring owner/room rule: designated leader; plurality with explicit tie/abstention policy; unanimous agreement with explicit conflict fallback. None is logically necessary from P04. Do not grant multiple independent bites or private team chat. Existing one-wolf guard retained. No official multi-wolf engine or metrics claimed.

## Revival and census
VH06/VH82 explicitly say pending Village revival counts and do not open a new round merely for revival when victory is already valid after the current chain. `countsTowardFaction` already distinguishes that census fact. `hasClosedDeathLedger` is a non-resurrection proof and refuses transient life states; current QD-01 resolver intentionally does not certify a revival composition. Do not interpret future revival as an indefinitely pending current-chain event, and do not replace the proof with a guessed ledger. Need actual pending-revival lifecycle, trigger and finalization tests before admitting a revival deck; no gameplay changed here.

## QA versus playable certification correction
`GameCoordinator.start` requires `WV_OFFICIAL_RULE_TEST_MODE=1`, and admits only exact supported compositions, mode INTEGRATION_TEST. Room capacity does not confer an official gameplay start. C historical metric is QA certification; current reports split QA C and playable C. No change in room minimum or production gate. [8,25] and [8,74] are QA-only.
