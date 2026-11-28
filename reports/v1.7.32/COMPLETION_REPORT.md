# WOLVESVILLE v1.7.32 — FULL Role Acceleration (WIP)

**F 1 → 1 (Δ0), new FULL certificates: 0. Exit criterion not met.**

## FULL Role Scorecard

| Role | Before | After | Missing obligations |
|---|---|---|---|
| #28 | FULL | Inherited FULL | Fresh revalidation: 1/1 |
| #74 Tiên Tri Huyền Bí | PARTIAL | PARTIAL — new QA gameplay | BT-74-2: chưa nghiệm thu miền giả danh #57, biến đổi #18 và chuyển vai theo đúng từng nguồn; Q13-06 false-role khi phối hợp các nguồn nhiễu; BT-74-GLOBAL-0/1/2. |
| #25 Tiên Tri | PARTIAL | PARTIAL — new QA gameplay | BT-25-2: #35 phản chiếu lần soi thứ 2, #3 chuyển sói thường, #10 đảo aura Không xác định và các phối hợp che giấu; BT-25-GLOBAL-0/1/2. |
| #26 Thầy Đồng | PARTIAL | PARTIAL — new QA gameplay | BT-26-2: loại trừ #46/#47/#53 thực sự trong live domain, không tiết lộ vai qua target list; mọi tương tác link/death/phase và chat ẩn danh ngoài miền đã có; BT-26-GLOBAL-0/1/2. |
| #37 Ảo Thuật Gia | PARTIAL | PARTIAL — new QA gameplay | WV-A37-ATTACK: tráo từng đòn VH15, hai người cùng chịu đòn, chuyển hướng cạnh tranh, khiên, death-chain; điều kiện thắng riêng còn audit flag. |

## All-role audit

97/97 source traceability rows, 17 ranked roles; groups: {'C': 45, 'B': 48, 'D': 3, 'FULL_EXISTING': 1}. 61 registered adapter entries, 49 distinct active Character IDs plus 3 passive/reactive roles = R52. 145 composite skill specs, 108 atomic branches on 48 audited roles, 79 historical PASS, 11 separate finite breakthrough contracts. 57 historical audit flags are not 57 verified Owner Decisions.

| Rank | Role | Atomic historical | Group | Exact remaining obligations | Shared dependency | Rule sources | Code | Feasibility |
|---:|---|---|---|---|---|---|---|---|
| 1 | #74 Tiên Tri Huyền Bí | 1/1 | B | BT-74-2: chưa nghiệm thu miền giả danh #57, biến đổi #18 và chuyển vai theo đúng từng nguồn; Q13-06 false-role khi phối hợp các nguồn nhiễu; BT-74-GLOBAL-0/1/2. | inspection; transformation; authorized projection | character.json#74/#37; Q13-06; VH14; S15-OWNER-SEER-01 | backend/src/official/inspection-rules.ts; inspection-effects.ts; swap-rules.ts | Gần nhất tương đối: bộ soi chính xác và bẫy sai vai có runtime; S22 đã bổ sung trao đổi danh tính với #37. |
| 2 | #25 Tiên Tri | 1/1 | B | BT-25-2: #35 phản chiếu lần soi thứ 2, #3 chuyển sói thường, #10 đảo aura Không xác định và các phối hợp che giấu; BT-25-GLOBAL-0/1/2. | inspection; aura reflection; transformation | S15-OWNER-SEER-01; VH11/VH25/VH39; character.json#3/#35 | backend/src/official/inspection-rules.ts; inspection-effects.ts | Cùng một shared resolver với #74; S22 có bằng chứng song song cả hai loại soi. |
| 3 | #26 Thầy Đồng | 2/2 | B | BT-26-2: loại trừ #46/#47/#53 thực sự trong live domain, không tiết lộ vai qua target list; mọi tương tác link/death/phase và chat ẩn danh ngoài miền đã có; BT-26-GLOBAL-0/1/2. | revival; death ledger; ACL; forbidden-role privacy | VH73/VH76/VH77; VH03; DC-TRAP-02 | backend/src/official/revival.ts; revival-capability.ts; medium-chat.ts | Có hồi sinh và chat ẩn danh; Dân/Sói/phe Ba có kịch bản giới hạn, S22 bổ sung phe Ba. |
| 4 | #9 Thiên Sứ Tuyết | 1/1 | B | BT-9-2: #75 xuyên phòng thủ theo VH42, #1 cướp khiên theo VH72, lớp chồng/từng đòn; BT-9-GLOBAL-0/1/2. | protection; attack; theft; expiry | character.json#9; VH42/VH72 | backend/src/official/support-rules.ts; protection-consumption.ts | Một kỹ năng, tài nguyên và hết hạn đã có; dùng chung với #31. |
| 5 | #31 Bảo Vệ | 1/1 | B | BT-31-2: #75 xuyên phòng thủ, nhiều đòn và nhiều lớp, đảo bảo vệ #10 trong toàn miền; BT-31-GLOBAL-0/1/2. | protection; attack; trap | character.json#31; VH42; BB-04=B | backend/src/official/support-rules.ts; protection-consumption.ts | Bảo vệ và cooldown đã có, tận dụng shared defense với #9. |
| 6 | #64 Người Rung Chuông | 1/1 | B | BT-64-1: thay cặp khi cả hai sống, chết đồng thời, chết liên kết, hồi sinh rồi chết lại, đổi vai, điều kiện self-selection chưa có nghiệm thu; BT-64-GLOBAL-0/1/2. | death ledger; revival; private inspection | character.json#64; Excel 04 Char nguon row65 | backend/src/official/bell-rules.ts | Một hành động gắn cặp, đã có resolver settleBell; có thể tái dùng death ledger. |
| 7 | #84 Phù Thủy Câm | 1/1 | B | WV-A84-SILENCE: chat công khai bị cấm nhưng nhóm chức năng vẫn đúng quyền VH57; khóa/hết hiệu lực, nhiều kênh và reconnect trong game thật; contract toàn miền chưa được lập. | chat ACL; status expiry | character.json#84; VH57 | backend/src/official/s13-mechanics.ts; engine/service.ts | Kỹ năng câm công khai đã chạy; độc lập với consensus bí mật. |
| 8 | #79 Sói Hòa Bình | 1/1 | B | WV-A79-CANCEL: tiết lộ đúng nhóm Sói (không chỉ actor), trigger điều phối V01/PH-02, tương tác nhiều Sói, giai đoạn ngày, không cấp thắng sai; contract toàn miền chưa có. | voting; wolf group ACL; phase | character.json#79; V01; PH-02 | backend/src/official/peace-rules.ts | Một lần hủy vote và soi, engine đã có cancel. |
| 9 | #88 Thợ Săn | 2/2 | B | WV-A88-MARK / WV-A88-DEATH-FOLLOW: khóa đêm hỗn hợp, thời hạn dấu cũ, mọi nguồn chết, mọi bảo vệ hợp lệ VH65, cứu/hồi sinh; contract toàn miền chưa có. | death-chain; protection; mark expiry | character.json#88; VH65 | backend/src/official/hanging-follow.ts; s13-mechanics.ts | Đã có nhánh ghim, chết theo, khiên tuyết và nhiều kịch bản #28. |
| 10 | #37 Ảo Thuật Gia | 3/4 | B | WV-A37-ATTACK: tráo từng đòn VH15, hai người cùng chịu đòn, chuyển hướng cạnh tranh, khiên, death-chain; điều kiện thắng riêng còn audit flag. | redirect; attack; inspection; voting | character.json#37; VH14/VH15 | backend/src/official/swap-rules.ts; inspection-rules.ts | S22 thêm soi role; đã có tráo hào quang và treo cổ. |
| 11 | #87 Dược Sĩ | 2/2 | B | BT-87-1/2: cứu nạn nhân nhiều đòn cắn, tương tác phòng vệ/cứu, câm/phiếu trong nhóm hợp lệ; BT-87-GLOBAL-0/1/2. | preliminary death; rescue; group ACL | VH57/VH64; character.json#87 | backend/src/official/preliminary-death.ts; s13-mechanics.ts | Cả hai nhánh atomic PASS trong miền giới hạn. |
| 12 | #8 Kỵ Sĩ Không Đầu | 3/3 | B | WV-A08-ATTACK/HANG-IMMUNITY/VICTORY: cắn bầy có thể giết #8, miễn treo cổ khi còn Sói và các hiệu ứng vote, phòng thủ/chuyển hướng đa lớp, nhóm độc lập; contract toàn miền chưa có. | pack; defense; vote; victory | character.json#8; VH03/VH58 | backend/src/official/solo-rules.ts; victory-predicates.ts | Ba nhánh atomic PASS; nhiều deck chính thức đã chạy. |
| 13 | #36 Pháp Sư | 3/3 | B | BT-36-1: cầu lửa không xuyên VH13 với mọi lớp phòng thủ, khiên tiết lộ đúng, death-chain #23 và hồi sinh, target/resource; BT-36-GLOBAL-0/1/2. | attack; protection; secret revival | VH12/VH13/VH82/LIFE-01 | backend/src/official/s13-mechanics.ts | Ba nhánh atomic có bằng chứng, shared #23 vẫn còn phụ thuộc. |
| 14 | #39 Kẻ Trộm Chó | 4/5 | B | WV-A39-THIRD-PARTY-COWIN / BT-39-2: thắng cùng phe Ba khi không đạt mục tiêu, đếm Sói đầu ván VH17; BT-39-1 miền nhiều Sói, phòng thủ và mục tiêu phe Ba, global. | victory; capture; faction; cooldown | character.json#39; VH17/VH18 | backend/src/official/dog-thief.ts | Bốn trong năm atomic đã có; miền solo rõ hơn các vai phức tạp. |
| 15 | #48 Sói Thủ Lĩnh | 1/1 | D | WV-A48-LAST-WOLF-DOUBLE-BITE: nhiều Sói không mặc định 2 lượt, 14 B/B, PACK-05 và PACK-PRIVACY-01; quyền chờ/lock vẫn pending. | pack membership; consensus; privacy | character.json#48; VH74; BB-03; DC-PACK-KEEP | backend/src/official/final-pack.ts; experimental/owner-bb-v2/pack.ts | Sói đơn lẻ và hai mục tiêu có evidence; cần pack trước lock. |
| 16 | #23 Xạ Thủ Linh Hồn | 1/3 | D | WV-A23-REVIVAL/REVIVED-SHOOT: miền kỹ năng hữu hạn DC-SOUL-01 chưa chỉ định, bắn Sói, death-chain/defense và hidden targeting; global. | secret revival; damage; privacy | VH82; LIFE-01; DC-SOUL-01/02 | backend/src/official/soul-shooter.ts; s13-mechanics.ts | Secret revival, friendly fire và second death đã QA. |
| 17 | #5 Thẩm Phán Linh Hồn | 1/2 | B | BT-5-2 / WV-A05-JUSTICE: ngăn đổi phe, lựa chọn khi #5 đổi phe, mọi trigger hợp lệ; BT-5-GLOBAL-0/1/2. | alignment; investigation | VH84; character.json#5 | backend/src/official/judgment-rules.ts | Soi tuyệt đối rõ luật nhưng Công Lý Tuyệt Đối còn thiếu. |

## Actual implementation and acceptance

- Shared #25/#74/#37 typed inspection through the same swap resolver in approved 1.3.3 QA [25,28,37,74]. Code: inspection-rules.ts, inspection-effects.ts, swap-rules.ts, s13-mechanics.ts, service.ts, frontend/integration.js. Private result types, order, duplicate/limit, expiry, actual hanging, SQLite restart, replay. No full VH15 attack exchange or disguise/transform classes.
- #26 third-faction revival in QA [8,25,26,28]. Code: revival-capability.ts, s13-mechanics.ts, service.ts, elimination-chain.ts, frontend/integration.js. #28 night death does not win; one revival preserves identity/faction; later actual hanging wins. Death ledger, retry, restart, minimal revival event, replay. VH76 exclusions and target privacy remain. No trap + third-faction combined proof.
- New backend tests: `tests/sprint22-dual-swap.test.mjs`; two fresh browser suites `browser_s22_dual_swap_e2e.py` and `browser_s22_jester_revival_e2e.py`; actual evidence `focused.log`, `browser-candidate/matrix.json`, `browser-results.json`. No QA-only promotion, no new normal deck, no separate engine. See `CLOSURE_EVIDENCE.md` and `COMPLETION_CONTRACT_DELTA.json`.

## Regression and verification

Backend monolithic complete: True; exit: 0; results: {'PASS': 466, 'FAIL': 0, 'SKIP': 11}; footer: {'tests': 477, 'pass': 466, 'fail': 0, 'cancelled': 0, 'skipped': 11, 'todo': 0}; duration ms: 257179.400829. Historical missing: 0; changed statuses: 0. Focused PASS: 2.
Browser: {'total': 80, 'PASS': 35, 'FAIL': 0, 'INCOMPLETE': 45}. Rule-version: {'total': 115, 'PASS': 35, 'FAIL': 0, 'INCOMPLETE': 80}. Only same-fingerprint executed results counted. Matrix overall exit 1 if any obligations INCOMPLETE; per-suite PASS requires exit 0 and runner acceptance marker.
Fresh certificate revalidation: {'F': 1, 'qaC': 2, 'playableC': 7, 'atomicPass': 79}. No new certificate. Source fingerprint: `4ba194c57aa4a0e46739b06c503eaadadc1f858fe2fa193b6ce41b138e150183`.

| Metric | Before | After | Δ |
|---|---:|---:|---:|
| R | 52 | 52 | 0 |
| F | 1 | 1 | 0 |
| A | 49 | 49 | 0 |
| B | 37 | 37 | 0 |
| QA C | 2 | 2 | 0 |
| Playable C | 7 | 7 | 0 |
| Atomic PASS | 79 | 79 | 0 |
| Normal Gameplay | 12 | 12 | 0 |

## Release and blockers

- Active 1.3.3; candidate 1.3.4 NOT ACTIVE; 18 owner choices intact. `DC-PACK-PRIVACY-BOUNDARY` PENDING; no change to candidate or live pack policy. Privacy PARTIAL, Competitive NO-GO, Human QA and PostgreSQL Live PENDING. No new SHARED-23/Trap combination code. Neither PACK nor TRAP is global to independent roles.
- All original contracts retained; do not remove global domain requirements. Wave 2 and 3 remain incomplete; no near-full verified group A. Prioritize #74/#25 disguise/reflection across authorized source classes, #26 exclusions and privacy-safe validation, #9/#31 layered protection; these are next work, not current PASS.

## Input source and delivery

Input SHA-256 `00079cf9f889b285ad419acfe4f66657992b972c167427b0cdadc2131836fdda`; CRC PASS, 4014 hashes verified, 4015 paths retained; 3147 historical reports unchanged. Character and rule registry unchanged. Generated inventory updated code hashes only. Source verification, TS build and rules build logs included. Native Mac and live PostgreSQL not executed here.

For reproducibility: `python3 reports/v1.7.32/build_acceptance.py --verify`; `python3 reports/v1.7.32/audit_roles.py`; local QA instructions in README/HUMAN_QA.md. See external Delivery Verification for ZIP hash and clean-extraction checks.
