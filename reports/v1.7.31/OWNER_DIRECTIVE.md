# WOLVESVILLE — v1.7.31 PRIVACY RESOLUTION & FULL ROLE BREAKTHROUGH
## PACK KEEP PRIVACY · COMPLETE SOUL/TRAP MECHANICS · CERTIFY FIRST NEW FULL ROLE · BROWSER RECOVERY

**PROJECT OWNER DIRECTIVE**

**SOURCE:** `v1.7.30 — OWNER DECISIONS INTEGRATED / LIVE QA VERIFIED / GAMEPLAY COMPLETION WIP`

**ACTIVE RULESET:** `wolvesville-official-v1.3.3`

**CANDIDATE RULESET:** `wolvesville-official-v1.3.4`

---

# I. CHỈ THỊ CHÍNH

Tôi đã xem báo cáo v1.7.30.

Tôi ghi nhận:

- 18/18 Owner Choices đã được ghi nhận.
- DC-SOUL-02=A đã hoạt động trong Game Session QA.
- DC-TRAP-02=A đã hoạt động trong Game Session QA.
- DC-SOUL-01=A đã có implementation trong phạm vi #8.
- DC-PACK-KEEP=A đã có candidate logic.
- Backend Regression đạt 461 PASS / 0 FAIL / 11 SKIPPED.
- Browser Acceptance đạt 26 PASS / 0 FAIL / 51 INCOMPLETE.
- FULL 1/1, QA C 2/2, Playable C 7/7 và Atomic 79/79 đã được tái nghiệm thu.

Nhưng:

- F vẫn bằng 1/97.
- DC-PACK-KEEP chưa bảo đảm privacy.
- SHARED-23 vẫn PARTIAL.
- TRAP-04/TRAP-05 vẫn PARTIAL.
- FULL-36 chưa hoàn thành.
- Full Browser Acceptance chưa đạt.
- Official v1.3.4 chưa READY_FOR_APPROVAL.

**TÔI YÊU CẦU v1.7.31 ƯU TIÊN ĐÓNG DỨT ĐIỂM NHỮNG BLOCKER THỰC SỰ, KHÔNG CHỈ TIẾP TỤC TĂNG SỐ LƯỢNG TESTS.**

Không hỏi lại 18 lựa chọn đã được phê duyệt.

Không thay đổi luật cũ.

Không tự kích hoạt v1.3.4.

---

# II. SOURCE BASELINE & SAFETY

Tiếp tục trực tiếp từ Full Source v1.7.30.

Baseline:

| Metric | Current |
|---|---:|
| Character IDs | 97 |
| Historical Decisions | 118 |
| Legacy Specifications | 207 |
| Owner Choices | 18 |
| R | 52 |
| F | 1 |
| A | 49 |
| B | 37 |
| QA C | 2 |
| Playable C | 7 |
| Atomic PASS | 79/108 |
| Normal Gameplay Decks | 12 |
| Backend | 461 PASS / 0 FAIL / 11 SKIPPED |
| Browser | 26 PASS / 0 FAIL / 51 INCOMPLETE |
| Rule-version Matrix | 26 PASS / 0 FAIL / 86 INCOMPLETE |
| FULL Revalidation | 1/1 |
| QA C Revalidation | 2/2 |
| Playable C Revalidation | 7/7 |
| Atomic Revalidation | 79/79 |

Xác minh source và evidence trước khi triển khai.

Bảo toàn:

- 97 Character IDs.
- 118 Historical Decisions.
- 207 Legacy Specifications.
- 18 Owner Choices.
- QD-01/02/03.
- Voting V02/V03.
- Các quyết định VH.
- Historical Replay.
- Authentication.
- Privacy.
- Gameplay Certificates hiện hữu.

Không tạo project mới.

Không quay lại checkpoint cũ.

Không sửa lịch sử quyết định.

---

# III. PRIORITY ZERO — RESOLVE DC-PACK-KEEP PRIVACY

**BLOCKERS: PACK-05 / PACK-PRIVACY-01**

Owner Choice:

**DC-PACK-KEEP=A.**

Quy tắc đã được chủ dự án lựa chọn:

Khi lựa chọn mục tiêu của Sói mất tính hợp lệ trước lock, thu hồi hiệu lực lựa chọn và giữ cửa sổ mở cho đến khi có lựa chọn hợp lệ thay thế.

Không tự chọn mục tiêu.

Không tự tạo lựa chọn mới.

Không đặt deadline hoặc AFK fallback.

Không tự commit một tập mục tiêu không hợp lệ.

### Vấn đề hiện tại

Hai trạng thái chỉ khác nhau về thông tin bí mật:

**State S1:** Mục tiêu X vẫn hợp lệ.

**State S2:** Mục tiêu X mất tính hợp lệ vì một điều kiện bí mật.

Khi Sói gửi cùng tập mục tiêu:

- S1 có thể commit.
- S2 phải tiếp tục chờ.

Việc chuyển pha hay không chuyển pha có thể tiết lộ thông tin bí mật, ngay cả khi biên nhận và target list giống nhau.

### Nhiệm vụ bắt buộc

1. Đọc Effective Rule Registry và 18 Owner Decisions.
2. Xác định thông tin nào được phép tiết lộ cho Sói trước và sau resolution.
3. Xây dựng threat model dựa trên quan sát hợp lệ của client.
4. Liệt kê mọi kênh quan sát:
   - Phase transitions.
   - Waiting state.
   - Vote acknowledgments.
   - REST payloads.
   - WebSocket messages.
   - Target lists.
   - Selected targets.
   - Revisions.
   - Event counts.
   - Timing.
   - Reconnect.
   - Replay.
5. Xây dựng paired-state privacy tests.
6. Kiểm tra trường hợp lựa chọn mất hợp lệ bởi thông tin công khai.
7. Kiểm tra trường hợp mất hợp lệ bởi thông tin bí mật.
8. Kiểm tra thành viên bầy thay đổi trước lock.
9. Kiểm tra retry/KEEP.
10. Kiểm tra server restart.
11. Kiểm tra representative order.
12. Kiểm tra cùng một tập hai mục tiêu.

### Phân tích tính khả thi

Tôi yêu cầu bạn phân biệt:

**A. Có thể giải quyết bằng cơ chế hiện có:**

Triển khai và nghiệm thu ngay.

**B. Có thể giải quyết bằng thay đổi protocol không ảnh hưởng luật gameplay:**

Chứng minh việc thay đổi protocol không làm sai BB-PENDING-01, KEEP, BB-03 và DC-PACK-KEEP=A; sau đó triển khai.

**C. Không thể vừa bảo vệ thông tin vừa giữ nguyên tất cả hành vi quan sát được:**

Tạo chứng minh phản ví dụ tối thiểu.

Giải thích rõ xung đột giữa privacy, liveness và consensus.

Đề xuất một Decision Card bổ sung chỉ cho xung đột đó.

**KHÔNG ĐƯỢC TỰ ĐẶT DEADLINE, DÙNG PHIẾU GIẢ, TỰ COMMIT HOẶC TỰ THAY ĐỔI DC-PACK-KEEP=A.**

Không áp dụng một cách che thông tin khiến client vẫn suy luận được từ chuyển pha.

Không công bố Privacy Release Gate PASS khi chưa có acceptance toàn diện.

---

# IV. PRIORITY ONE — COMPLETE ONE FULL ROLE CONTRACT

**ĐÂY LÀ MỤC TIÊU GAMEPLAY QUAN TRỌNG NHẤT CỦA PHIÊN NÀY.**

Hiện tại:

F = 1/97.

Tôi không muốn tiếp tục nhiều phiên chỉ mở rộng các cơ chế PARTIAL.

### A. Candidate Selection

Đọc các Completion Contracts hiện có.

Rà soát:

- #23 Xạ Thủ Linh Hồn.
- #36 Pháp Sư.
- #26 Thầy Đồng.
- #10 Sói Kỹ Sư.
- #9 Thiên Sứ Tuyết.
- #25 Tiên Tri.
- #74 Tiên Tri Huyền Bí.
- #31 Bảo Vệ.
- Những nhân vật khác có ít nghĩa vụ còn thiếu hơn.

Xếp hạng dựa trên:

- Required interaction classes.
- Rule completeness.
- Missing implementation.
- Existing backend evidence.
- Existing browser evidence.
- Privacy dependencies.
- Replay dependencies.
- Khả năng hoàn thành với source hiện có.

### B. Select One Primary FULL Candidate

Chọn nhân vật có Completion Contract khả thi nhất.

Không bắt buộc phải chọn #23 hoặc #36 nếu có nhân vật khác gần FULL hơn.

Tôi muốn bạn tập trung đóng toàn bộ nghĩa vụ của một nhân vật trước khi mở thêm nhiều nhân vật khác.

Với vai được chọn:

1. Đọc luật nguồn.
2. Xác định mọi nghĩa vụ còn thiếu.
3. Triển khai Engine.
4. Triển khai Game Session.
5. Hoàn thiện REST/WebSocket.
6. Hoàn thiện UI.
7. Hoàn thiện action validation.
8. Hoàn thiện resource/cooldown.
9. Hoàn thiện attack/protection/death-chain.
10. Hoàn thiện privacy.
11. Hoàn thiện SQLite restart.
12. Hoàn thiện Replay.
13. Chạy Backend Acceptance.
14. Chạy Browser E2E.
15. Cấp FULL khi đủ điều kiện.

Nếu một nhân vật bị blocker luật thật sự, chuyển sang ứng viên khả thi kế tiếp.

Không hạ chuẩn FULL.

Không cấp FULL từ một QA deck giới hạn.

### C. Closure Evidence

Phải có bảng:

| Role | Missing Obligation | Rule Source | Code | Test | Status |
|---|---|---|---|---|---|

Đối với những nghĩa vụ đã hoàn thành, ghi file code và evidence.

Đối với những nghĩa vụ chưa hoàn thành, ghi blocker chính xác.

**MỤC TIÊU F = 2+, NHƯNG KHÔNG ĐƯỢC TẠO CERTIFICATE GIẢ.**

---

# V. PRIORITY TWO — CLOSE SHARED-23 USING THE NEW OWNER DECISIONS

Owner Choices:

- DC-SOUL-01=A.
- DC-SOUL-02=A.

Đã có:

- Secret revival.
- First death.
- Second death trong phạm vi QA.
- Two bullets.
- Friendly-fire trong QA.
- Shield interaction.
- Vote restriction.
- Replay.
- Restart.

Chưa có:

- Hoàn chỉnh miền mục tiêu sát thương hữu hạn.
- Mọi lớp phòng thủ áp dụng.
- Các nguồn sát thương khác.
- Death-chain phức tạp.
- Privacy đầy đủ.

### Yêu cầu

1. Kiểm tra danh sách kỹ năng được chỉ định theo DC-SOUL-01=A.
2. Không mở quyền nhắm ghế chết công khai cho mọi kỹ năng.
3. Kiểm tra #23 bắn Sói, Dân và phe Ba.
4. Kiểm tra tiêu hao đạn.
5. Kiểm tra bảo vệ.
6. Kiểm tra second death.
7. Kiểm tra victory.
8. Kiểm tra privacy.
9. Kiểm tra resource lifecycle.
10. Kiểm tra retry/restart.
11. Kiểm tra Replay.
12. Chạy Browser E2E.

Đối với mỗi kỹ năng hữu hạn, ghi rõ có hay không có căn cứ được nhắm ghế chết công khai.

Nếu chưa có căn cứ, không mở quyền mới và ghi SOURCE_SCOPE_PENDING.

Không dùng policy QA để âm thầm thay đổi Normal Gameplay v1.3.3.

---

# VI. PRIORITY THREE — CLOSE TRAP + REVIVAL

Owner Choice:

**DC-TRAP-02=A.**

Đã có Live QA:

- Thầy Đồng bị bẫy.
- Hồi sinh thất bại.
- Tiêu một lượt hồi sinh.
- Tiêu một dấu bẫy.
- Không tạo death event giả.
- Backend và Browser E2E PASS.

### Nhiệm vụ tiếp theo

1. Đối chiếu VH73 và VH76.
2. Kiểm tra toàn bộ miền người có thể được hồi sinh.
3. Kiểm tra các nhân vật bị loại trừ theo luật.
4. Kiểm tra hồi sinh Dân, Sói và phe Ba khi hợp lệ.
5. Kiểm tra target đang mang bẫy.
6. Kiểm tra revival actor đang mang bẫy.
7. Kiểm tra same-night ordering.
8. Kiểm tra NightActionGroup.
9. Kiểm tra resource/cooldown.
10. Kiểm tra death-chain.
11. Kiểm tra victory.
12. Kiểm tra privacy.
13. Kiểm tra SQLite restart.
14. Kiểm tra Replay.

Không tự mở quyền hồi sinh cho những Character IDs mà VH76 loại trừ.

Không coi một QA deck bốn người là bằng chứng cho mọi interaction class.

Khi đủ nghĩa vụ, đóng TRAP-05.

---

# VII. PRIORITY FOUR — BROWSER DEBT REDUCTION

Baseline:

Browser Manifest:

26 PASS / 0 FAIL / 51 INCOMPLETE.

Rule-version Matrix:

26 PASS / 0 FAIL / 86 INCOMPLETE.

Tôi yêu cầu:

1. Giữ Resource Admission.
2. Không chạy backend monolithic đồng thời với Browser Matrix.
3. Chạy những shard còn INCOMPLETE.
4. Revalidate FULL #28.
5. Revalidate QA C 2/2.
6. Revalidate Playable C 7/7.
7. Revalidate Atomic 79/79.
8. Chạy các test impacted bởi Owner Choices mới.
9. Chạy thêm các suite ảnh hưởng Official v1.3.4.
10. Lưu fingerprint, logs, duration và exit codes.

Không xóa assertions.

Không tăng timeout chỉ để đạt PASS.

Không chỉ chọn suite dễ.

Không thay đổi định nghĩa test suite.

**MỤC TIÊU LÀ GIẢM THỰC CHẤT 51 BROWSER INCOMPLETE VÀ 86 RULE-VERSION INCOMPLETE.**

Nếu giới hạn môi trường, sử dụng checkpoint/resume đúng cách và báo phần chưa thực thi.

Không ghi Full Browser Acceptance PASS khi còn nghĩa vụ chưa hoàn thành.

---

# VIII. PRIORITY FIVE — OFFICIAL v1.3.4 RELEASE READINESS

Bảo toàn 18 Owner Choices đã phê duyệt.

Active:

`wolvesville-official-v1.3.3`

Candidate:

`wolvesville-official-v1.3.4`

Cập nhật Release Scope Contract.

Phân biệt:

- OWNER_APPROVED.
- SOURCE_VERIFIED.
- IMPLEMENTED.
- LIVE_QA_VERIFIED.
- RELEASE_SCOPE_COMPLETE.
- READY_FOR_APPROVAL.
- APPROVED_FOR_RELEASE.
- ACTIVE.

Không tự đánh đồng các trạng thái.

Release Obligations:

- Multi-Wolf Consensus.
- KEEP.
- DC-PACK-KEEP.
- Representative Order.
- Mixed Wolf Pack.
- Membership Changes.
- Persistent Trap.
- Same-night interactions.
- NightActionGroup.
- Trap + Revival.
- Soul Shooter.
- Privacy.
- Replay.
- Browser Acceptance.
- Human QA.
- Official Activation Path.

Với từng nghĩa vụ:

- Rule provenance.
- Code path.
- Backend evidence.
- Browser evidence.
- Privacy evidence.
- Replay evidence.
- Status.
- Exact blocker.
- Exit criteria.

Không tự thu hẹp các interaction classes bắt buộc.

Không tự kích hoạt v1.3.4.

Không công bố Production GO nếu còn blocker nghiêm trọng.

---

# IX. QUALITY GATES

Bắt buộc:

- Source Integrity.
- Character Registry 97/97.
- Historical Decisions 118/118.
- Legacy Specifications 207/207.
- Owner Choices 18/18.
- TypeScript Build.
- Rules Build.
- Monolithic Backend Regression.
- FULL/QA C/Playable C Revalidation.
- Atomic Revalidation.
- Critical Browser E2E.
- Privacy.
- SQLite restart.
- Replay.
- Metrics Verification.
- ZIP CRC.
- Clean Extraction.

Không sửa metrics bằng tay.

Không lấy kết quả từ source cũ làm current-source PASS.

Nếu quality gate FAIL, ghi đúng trạng thái.

---

# X. METRICS SCORECARD

Baseline:

| Metric | v1.7.30 |
|---|---:|
| R | 52 |
| F | 1 |
| A | 49 |
| B | 37 |
| QA C | 2 |
| Playable C | 7 |
| Atomic PASS | 79/108 |
| Normal Gameplay | 12 |
| Browser PASS | 26 |
| Browser FAIL | 0 |
| Browser INCOMPLETE | 51 |

Báo cáo:

BASELINE → CURRENT → DELTA → EVIDENCE.

Tách:

- New Certificates.
- Revalidated Certificates.
- Official Normal Gameplay.
- Candidate QA Gameplay.
- Regression Results.
- Pending Decisions.

Không cộng trùng.

---

# XI. FULL SOURCE DELIVERY

Bàn giao:

`Wolvesville_v1.7.31_Privacy_Full_Completion_Full_Source.zip`

Bao gồm toàn bộ:

- Frontend.
- Backend.
- Game Engine.
- Game Session.
- Character Registry.
- Rule Registry.
- 18 Owner Decision Records.
- #23 Soul Shooter.
- #26 Medium.
- #10 Engineer Trap.
- Pack Consensus.
- Representative Order.
- NightActionGroup.
- Privacy Projection.
- Completion Contracts.
- FULL Certificates.
- QA/Playable C Certificates.
- Backend Tests.
- Browser Tests.
- Browser Manifest.
- Rule-version Matrix.
- Database Migrations.
- Event Log/Replay.
- Release Scope Contract.
- Human QA Pack.
- Changelog.
- README Mac Apple Silicon.

Kiểm tra:

- ZIP CRC.
- Clean Extraction.
- Source Integrity.
- Build.
- Rules Build.
- Backend Regression.
- Applicable Browser Acceptance.
- Certificate Revalidation.
- Privacy.
- Replay.
- Metrics Verification.

Không chỉ xuất patch.

Không chứa secrets, `.env` thật, node_modules hoặc runtime database.

---

# XII. FINAL REPORT

Báo cáo cuối phải trả lời:

1. DC-PACK-KEEP privacy đã giải quyết chưa?
2. Nếu chưa, có phản ví dụ chứng minh xung đột không?
3. Có cần thêm quyết định gameplay hay không?
4. Nhân vật nào được chọn làm ứng viên FULL?
5. Có FULL Certificate mới không?
6. SHARED-23 đóng được những nghĩa vụ nào?
7. TRAP-05 tiến triển đến đâu?
8. Browser INCOMPLETE giảm bao nhiêu?
9. FULL/C/Atomic Revalidation có được bảo toàn?
10. Official v1.3.4 đang ở trạng thái nào?
11. Full Source ZIP và checksum ở đâu?

Đối với mọi blocker, cung cấp:

- Rule provenance.
- Code changed.
- Backend evidence.
- Browser evidence.
- Privacy.
- Replay.
- Status.
- Remaining obligations.

Không chỉ đưa roadmap.

Không báo những việc chưa làm thành đã hoàn thành.

---

# XIII. MỆNH LỆNH CUỐI

**TÔI MUỐN v1.7.31 THẬT SỰ ĐƯA WOLVESVILLE TIẾN GẦN HƠN ĐẾN HOÀN THIỆN SẢN PHẨM.**

Không tiếp tục chỉ mở rộng các module PARTIAL.

Không tiếp tục chỉ tăng Backend PASS.

Không tiếp tục tạo hàng chục Completion Contracts mà không cấp được FULL.

**HÃY TẬP TRUNG:**

**RESOLVE PACK-KEEP PRIVACY → COMPLETE ONE FULL ROLE → CLOSE SHARED-23/TRAP OBLIGATIONS → REDUCE BROWSER DEBT → PREPARE OFFICIAL v1.3.4.**

Tiếp tục trực tiếp từ:

`v1.7.30 — OWNER DECISIONS INTEGRATED / LIVE QA VERIFIED / GAMEPLAY COMPLETION WIP`

**CODE THẬT · GAMEPLAY THẬT · PRIVACY CÓ BẰNG CHỨNG · FULL CERTIFICATES ĐÚNG CHUẨN · VERIFIED FULL SOURCE ZIP.**