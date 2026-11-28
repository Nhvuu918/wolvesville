# WOLVESVILLE — v1.7.30 OWNER DECISION INTEGRATION & GAMEPLAY COMPLETION
## FOUR NEW OWNER DECISIONS · SOUL SHOOTER · TRAP REVIVAL · PACK KEEP · FULL ROLE CLOSURE

**PROJECT OWNER DIRECTIVE**

**SOURCE CHECKPOINT:** `v1.7.29 — HANDOFF CLOSURE / CERTIFICATES RECOVERED / GAMEPLAY WIP`

**ACTIVE RULESET:** `wolvesville-official-v1.3.3`

**CANDIDATE RULESET:** `wolvesville-official-v1.3.4`

# I. CHỈ THỊ CHÍNH THỨC CỦA CHỦ DỰ ÁN

Tôi xác nhận bốn lựa chọn gameplay mới:

**DC-SOUL-01=A.**

**DC-SOUL-02=A.**

**DC-TRAP-02=A.**

**DC-PACK-KEEP=A.**

Đây là các lựa chọn của chủ dự án, bổ sung cho 14 quyết định Owner B/B đã phê duyệt trước đó.

Tổng cộng có 18 lựa chọn được ghi nhận trong nhóm quyết định này, nhưng phải phân biệt:

- 14 quyết định trước: đã được ghi trong hồ sơ cũ.
- 4 quyết định mới: OWNER APPROVED, cần kiểm tra rule provenance và tính nhất quán trước khi triển khai chính thức.
- Các tương tác hoặc ngoại lệ chưa được quy định: vẫn PENDING.
- Official v1.3.4: CANDIDATE, chưa ACTIVE.

**KHÔNG HỎI LẠI BỐN LỰA CHỌN A NÀY.**

**KHÔNG HỎI LẠI 14 QUYẾT ĐỊNH B/B TRƯỚC ĐÓ.**

Tôi yêu cầu bạn thực hiện kiểm tra luật nguồn, triển khai những phần đủ căn cứ, hoàn thiện gameplay, chạy regression và bàn giao Full Source.

Không chỉ tạo thêm Decision Cards.

Không chỉ sửa JSON trạng thái.

Không tự mở rộng luật chưa có nguồn.

# II. SOURCE SAFETY

Tiếp tục trực tiếp từ Full Source v1.7.29.

Baseline theo báo cáo:

| Metric | Baseline |
|---|---:|
| Character IDs | 97 |
| Historical Decisions | 118 |
| Legacy Specifications | 207 |
| Existing B/B Decisions | 14 |
| New Owner Choices | 4 |
| R | 52 |
| F | 1 |
| A | 49 |
| B | 37 |
| QA C | 2 |
| Playable C | 7 |
| Atomic PASS | 79/108 |
| Normal Gameplay Decks | 12 |
| Backend | 454 PASS, 0 FAIL, 11 SKIPPED |
| Browser Manifest | 23 PASS, 0 FAIL, 52 INCOMPLETE |
| Rule-version Matrix | 23 PASS, 0 FAIL, 87 INCOMPLETE |
| FULL Revalidation | 1/1 |
| QA C Revalidation | 2/2 |
| Playable C Revalidation | 7/7 |
| Atomic Revalidation | 79/79 |

Phải xác minh bằng source và logs.

Không khởi tạo lại dự án.

Bảo toàn QD-01/02/03, Voting V02/V03, luật VH, Historical Decisions, Legacy Specifications, Game Session, Replay, Privacy và các certificates đã có.

Không ghi đè v1.3.3.

# III. PRIORITY ZERO — FORMALIZE FOUR OWNER DECISIONS

Đọc chính xác:

- `reports/v1.7.29/DECISION_CARDS.md`
- Character Registry.
- Character Specifications.
- Effective Rule Registry.
- Historical Decisions.
- Owner B/B Decision Records.
- Completion Contracts.

Đối chiếu bốn quyết định mới với:

- #23 Xạ Thủ Linh Hồn.
- #26 Thầy Đồng.
- #10 Sói Kỹ Sư.
- #8 Kỵ Sĩ Không Đầu.
- Các nhân vật bắn hoặc gây sát thương có quyền được chỉ định.
- Các nhân vật thuộc bầy Sói.
- VH06, VH13, VH54, VH82, LIFE-01.
- BB-03=A.
- KEEP.
- BB-PENDING-01=A.
- BB-PENDING-03=B.
- BB-REP-NEW-01=B.

Không mặc định rằng các dẫn chiếu trên đã đủ bao phủ toàn bộ luật. Phải tìm đúng nguồn áp dụng trong source.

Với mỗi quyết định:

1. Ghi Owner Choice=A.
2. Dẫn rule provenance.
3. Xác định miền áp dụng.
4. Kiểm tra xung đột.
5. Xác định code path.
6. Xác định các interaction classes.
7. Tạo acceptance tests.
8. Cập nhật Decision Registry bằng record mới, không sửa lịch sử cũ.
9. Đánh dấu những phần đủ căn cứ để triển khai.
10. Giữ riêng các vấn đề thật sự chưa được quy định.

Nếu phát hiện mâu thuẫn với luật nguồn, không tự sửa luật nguồn hoặc tự bỏ qua quyết định của tôi.

Ghi CONFLICT_REQUIRES_REVIEW cùng dẫn chiếu cụ thể và tiếp tục công việc độc lập.

# IV. PRIORITY ONE — IMPLEMENT DC-SOUL-01=A

**Quyết định: Cho phép những kỹ năng sát thương được chỉ định nhắm vào ghế đã chết công khai, với tiêu hao tài nguyên đối với lượt thử hợp lệ.**

Yêu cầu:

1. Xác định chính xác những kỹ năng thuộc phạm vi.
2. Không tự mở quyền này cho mọi loại sát thương.
3. Tách public player state và true player state.
4. Server-authoritative action validation.
5. Public target projection không tiết lộ hồi sinh bí mật.
6. Valid attempt được ghi nhận có idempotency.
7. Tiêu hao tài nguyên đúng luật.
8. Nếu mục tiêu chết thật, không tạo duplicate death.
9. Nếu mục tiêu còn sống bí mật, phân giải sát thương theo protection/death-chain.
10. Replay deterministic.
11. SQLite restart.
12. Reconnect.
13. REST/WebSocket privacy.

**Bắt buộc có Acceptance Matrix:**

- Người sống công khai.
- Người chết công khai và chết thật.
- Người chết công khai nhưng sống bí mật.
- Người có bảo vệ.
- Người mất bảo vệ.
- Kỹ năng còn tài nguyên.
- Kỹ năng hết tài nguyên.
- Retry trùng lệnh.
- Restart trước phân giải.
- Replay sau phân giải.

Phân biệt quyền gửi lượt thử với quyền gây sát thương.

Đừng để target list trở thành oracle tiết lộ trạng thái thật của #23.

Chỉ mở những kỹ năng có rule provenance hợp lệ.

# V. PRIORITY TWO — IMPLEMENT DC-SOUL-02=A

**Quyết định: #23 bắn nhầm Dân tiêu hao một viên đạn và gây sát thương thông thường nếu không được bảo vệ.**

Triển khai qua shared damage resolver.

Yêu cầu:

1. Xác minh quy định chính thức của #23 về mục tiêu và phe.
2. Không tự miễn sát thương chỉ vì mục tiêu cùng phe.
3. Tiêu hao đúng một viên đạn khi lượt bắn hợp lệ.
4. Không tiêu hao hai lần do retry.
5. Kiểm tra protection.
6. Kiểm tra shield consumption.
7. Kiểm tra death-chain.
8. Kiểm tra revival.
9. Kiểm tra winner evaluation.
10. Không tiết lộ phe qua validation/receipt trái luật.
11. SQLite restart.
12. Replay.

Acceptance bắt buộc:

- Bắn Dân không có bảo vệ.
- Bắn Dân có bảo vệ.
- Bắn Sói không có bảo vệ.
- Bắn mục tiêu có trạng thái bí mật theo luật.
- Không còn đạn.
- Retry trùng lệnh.
- Hồi sinh/reconnect.
- Trận tiếp tục sau bắn.
- Trận kết thúc sau bắn nếu điều kiện thắng hợp lệ.

Nếu luật gốc có ngoại lệ xung đột, báo chính xác thay vì tự ghi đè.

# VI. PRIORITY THREE — IMPLEMENT DC-TRAP-02=A

**Quyết định: #26 bị bẫy khi thực hiện hồi sinh thì hồi sinh thất bại, tiêu hao bẫy và lượt hồi sinh.**

Phải phân biệt:

**CASE A — Người được hồi sinh còn bẫy:**

Đã có QA evidence trong các phiên trước.

**CASE B — Người thực hiện hồi sinh đang bị bẫy:**

Là trường hợp mới cần triển khai.

Yêu cầu:

1. Kiểm tra kỹ năng hồi sinh của #26 thuộc phạm vi tác động của bẫy.
2. Xác định valid action boundary.
3. Không kích hoạt bẫy từ lệnh không hợp lệ.
4. Khi kích hoạt, hồi sinh thất bại.
5. Giữ nguyên trạng thái người đã chết.
6. Tiêu hao đúng một lượt hồi sinh.
7. Tiêu hao đúng một dấu bẫy.
8. Không tạo tử vong mới từ riêng việc hồi sinh thất bại.
9. Không tạo duplicate death-chain.
10. Tuân thủ BB-05=B và NightActionGroup.
11. Tuân thủ BB-PENDING-03=B nếu cùng đêm có nhiều cửa sổ.
12. Idempotency.
13. SQLite restart.
14. Replay.
15. Privacy.
16. Authorized frontend.

Acceptance bắt buộc:

- #26 không bị bẫy, hồi sinh bình thường.
- #26 bị bẫy, hồi sinh thất bại.
- Người chết đang mang bẫy được hồi sinh bởi #26 không bị bẫy.
- Lệnh hồi sinh không hợp lệ.
- Hết lượt hồi sinh.
- Retry.
- Reconnect.
- Crash/restart giữa submit và commit.
- Nhiều hành động hợp lệ cùng đêm.
- Không tiêu hao bẫy lần thứ hai.
- Victory correctness.

Không nhầm hồi sinh với chữa trị hoặc cứu người theo các luật riêng.

Không tự bổ sung hiệu ứng giết người cho trường hợp đã chọn A.

# VII. PRIORITY FOUR — IMPLEMENT DC-PACK-KEEP=A

**Quyết định: Khi lựa chọn cũ không còn hợp lệ trước lock, thu hồi hiệu lực lựa chọn và tiếp tục chờ chọn lại.**

Các luật bắt buộc phải giữ:

- DEC-BT-01=B — Đồng thuận tuyệt đối.
- KEEP — Phiếu trống giữ lựa chọn còn hợp lệ.
- BB-03=A — Eligible membership tại thời điểm chốt.
- BB-PENDING-01=A — Không tự deadline.
- BB-PENDING-02=A — Thứ tự đại diện được tạo trước trận.
- BB-REP-NEW-01=B — RNG toàn phòng.
- SAME/RESOLVE.

Triển khai:

1. Server đánh giá lại tính hợp lệ trước lock.
2. Nếu lựa chọn cũ mất tính hợp lệ, không dùng lựa chọn đó để commit.
3. Không tự chọn mục tiêu thay thành viên.
4. Không tự suy ra đã đồng thuận.
5. Giữ cửa sổ mở theo quyết định A.
6. Đợi lựa chọn hợp lệ thay thế.
7. Không làm mất các lựa chọn khác vẫn hợp lệ.
8. Không thu hồi lượt đã khóa và commit hợp lệ.
9. Reconnect khôi phục đúng trạng thái được phép thấy.
10. Không tiết lộ nguyên nhân mất hợp lệ nếu đó là thông tin bí mật.

**PRIVACY REQUIREMENT:**

Không gửi cho client một thông báo giúp phân biệt mục tiêu đã đổi phe bí mật với mục tiêu vẫn thuộc phe cũ.

Kiểm tra paired-state privacy giữa các GameState chỉ khác nhau về thông tin mà Sói không có quyền biết.

Nếu không thể vừa thông báo chính xác lý do phiếu không còn hợp lệ, vừa bảo vệ thông tin bí mật, ưu tiên bảo toàn luật và Authorized Projection; đề xuất cơ chế phản hồi an toàn kèm test.

Không tự tạo thông báo từ chối tiết lộ phe.

Acceptance:

- Target mất tính hợp lệ trước lock.
- Target vẫn hợp lệ.
- Phiếu trống KEEP.
- Thành viên mất quyền.
- Thành viên mới gia nhập.
- Hai Sói chọn khác nhau.
- Hai Sói chọn giống nhau.
- Restart khi đang chờ.
- Retry.
- Reconnect.
- Representative selection.
- Replay.
- Privacy.
- Victory.

# VIII. PRIORITY FIVE — CLOSE FULL ROLE CONTRACTS

F hiện bằng 1/97.

Sau khi hoàn thiện những phần luật mới liên quan #23/#26/#10, phải rà soát Completion Contracts để tìm nhân vật có thể đạt FULL.

Ưu tiên:

- #23 Xạ Thủ Linh Hồn.
- #36 Pháp Sư.
- #26 Thầy Đồng.
- #10 Sói Kỹ Sư.
- #9 Thiên Sứ Tuyết.
- #25 Tiên Tri.
- #74 Tiên Tri Huyền Bí.
- #31 Bảo Vệ.
- Những ứng viên khác gần FULL hơn.

Chọn ứng viên theo số nghĩa vụ còn thiếu thực tế.

Với mỗi ứng viên:

1. Đọc toàn bộ Finite Completion Contract.
2. Xác định các blocker có nguồn.
3. Hoàn thiện Engine.
4. Hoàn thiện Game Session.
5. Hoàn thiện REST/WebSocket.
6. Hoàn thiện UI.
7. Kiểm tra interaction classes.
8. Kiểm tra resource/cooldown.
9. Kiểm tra privacy.
10. Kiểm tra persistence/replay.
11. Chạy backend/browser acceptance.
12. Cấp FULL Certificate nếu toàn bộ nghĩa vụ đạt.

Không cấp FULL từ một QA deck giới hạn.

Không hạ tiêu chuẩn.

Không tiếp tục chỉ tạo thêm Completion Contract mà không giải quyết nhánh gameplay.

Nếu một vai còn blocker thật sự, chuyển sang ứng viên khác.

# IX. PRIORITY SIX — BROWSER REGRESSION

Baseline:

- 75 suites.
- 23 PASS.
- 0 FAIL.
- 52 INCOMPLETE.
- Rule-version Matrix: 23 PASS, 0 FAIL, 87 INCOMPLETE.

Yêu cầu:

1. Chạy impacted browser suites cho bốn luật mới.
2. Revalidate FULL #28.
3. Revalidate QA C 2/2.
4. Revalidate Playable C 7/7.
5. Revalidate Atomic 79/79 theo phạm vi áp dụng.
6. Chạy các shards còn thiếu.
7. Giữ resource admission.
8. Lưu source fingerprint.
9. Lưu exit codes, timings, logs.
10. Không xóa assertions.
11. Không tăng timeout vô căn cứ.
12. Không tính kết quả source cũ là PASS hiện hành.

Mục tiêu là giảm thực chất Browser INCOMPLETE.

Nếu môi trường có giới hạn, ưu tiên critical release paths và certificates, báo trung thực phần chưa thực hiện.

Không chỉ chạy thêm vài backend tests rồi dừng toàn bộ Browser Regression.

# X. PRIORITY SEVEN — OFFICIAL v1.3.4 RELEASE READINESS

Active:

`wolvesville-official-v1.3.3`

Candidate:

`wolvesville-official-v1.3.4`

Bảo toàn 14 Owner B/B Decisions.

Bổ sung bốn Owner Choices mới bằng Decision Records riêng.

Phân biệt:

- OWNER_APPROVED.
- SOURCE_VERIFIED.
- IMPLEMENTED.
- LIVE_QA_VERIFIED.
- RELEASE_SCOPE_COMPLETE.
- READY_FOR_APPROVAL.
- APPROVED_FOR_RELEASE.
- ACTIVE.

Không tự gộp OWNER_APPROVED với SOURCE_VERIFIED hoặc ACTIVE.

Đối với mỗi nghĩa vụ phải ghi:

- Rule provenance.
- Code path.
- Backend tests.
- Browser tests.
- Privacy.
- Replay.
- Status.
- Blocker.
- Exit criteria.

Không âm thầm loại interaction classes bắt buộc.

Không ghi READY_FOR_APPROVAL khi còn blocker release nghiêm trọng.

Không kích hoạt v1.3.4 khi chưa đủ release gates và quyết định phát hành theo quy trình dự án.

# XI. GAMEPLAY METRICS

Baseline:

| Metric | v1.7.29 |
|---|---:|
| R | 52 |
| F | 1 |
| A | 49 |
| B | 37 |
| QA C | 2 |
| Playable C | 7 |
| Atomic PASS | 79/108 |
| Normal Gameplay | 12 |

Báo cáo:

BASELINE → CURRENT → DELTA → EVIDENCE.

Đặc biệt phải nêu:

- Số Decision Cards mới đã source-verified.
- Số Decision Cards đã implement.
- Số Live QA PASS.
- Số FULL mới.
- Số Playable C mới.
- Browser PASS/FAIL/INCOMPLETE.
- Certificate Revalidation.
- Privacy Gate.
- v1.3.4 Release Readiness.

Không sửa định nghĩa metrics.

Không cộng candidate tests vào Normal Gameplay.

Không tính trùng certificate.

# XII. SOURCE DELIVERY

Bàn giao:

`Wolvesville_v1.7.30_Owner_Decisions_Gameplay_Completion_Full_Source.zip`

Bao gồm:

- Full Frontend.
- Full Backend.
- Game Engine.
- Game Session.
- Character Registry.
- Effective Rule Registry.
- Historical Decisions.
- 14 Owner B/B Decision Records.
- 4 New Owner Decision Records.
- #23 Soul Shooter.
- #26 Medium.
- #10 Engineer Trap.
- Pack Consensus/KEEP.
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
- Release Gate Matrix.
- Human QA Pack.
- Changelog.
- README Mac Apple Silicon.

Bắt buộc xác minh:

- ZIP CRC.
- Clean Extraction.
- Source Integrity.
- TypeScript Build.
- Rules Build.
- Monolithic Backend Regression.
- Critical Browser E2E.
- Certificate Revalidation.
- Privacy/Replay.
- Metrics Verification.

Không chỉ xuất patch.

Không chứa secrets, `.env` thật, node_modules hoặc runtime database.

Giữ WIP nếu chưa đủ nghiệm thu.

# XIII. FINAL REPORT FORMAT

Báo cáo bắt buộc trả lời:

1. Cả bốn lựa chọn A đã được ghi Decision Records chưa?
2. Những mục nào đã kiểm tra đầy đủ luật nguồn?
3. Có xung đột thật sự không?
4. DC-SOUL-01 đã mở đúng phạm vi kỹ năng chưa?
5. DC-SOUL-02 đã xử lý đạn, bảo vệ và death-chain chưa?
6. DC-TRAP-02 đã hoạt động trong Game Session thật chưa?
7. DC-PACK-KEEP đã có privacy acceptance chưa?
8. Có nhân vật FULL mới không?
9. Browser Acceptance đã tăng bao nhiêu?
10. Official v1.3.4 đang ở trạng thái nào?
11. Full Source ZIP và checksum ở đâu?

Mỗi mục phải có bằng chứng cụ thể.

Không chỉ mô tả đã tạo code.

Không tự báo FULL hoặc release-ready khi chưa đủ acceptance.

# XIV. CHỈ THỊ CUỐI CÙNG

Tôi đã lựa chọn:

**DC-SOUL-01=A.**

**DC-SOUL-02=A.**

**DC-TRAP-02=A.**

**DC-PACK-KEEP=A.**

Tôi yêu cầu bạn sử dụng những lựa chọn này để giải quyết các blocker gameplay, nhưng phải bảo toàn luật nguồn, privacy, tài nguyên, death-chain, Replay và 14 quyết định B/B đã có.

**KHÔNG HỎI LẠI NHỮNG LỰA CHỌN ĐÃ CHỐT.**

**KHÔNG TỰ PHÁT HÀNH LUẬT MỚI KHI CHƯA NGHIỆM THU.**

**KHÔNG CHỈ CẬP NHẬT DECISION RECORDS RỒI DỪNG.**

Hãy thực hiện:

**VERIFY RULE SOURCE → RECORD FOUR DECISIONS → IMPLEMENT GAME SESSION → VERIFY PRIVACY/DEATH-CHAIN → CLOSE FULL CONTRACTS → RUN BROWSER REGRESSION → PREPARE v1.3.4 RELEASE.**

Tiếp tục trực tiếp từ Full Source v1.7.29.

**CODE THẬT · LIVE GAMEPLAY · TEST THẬT · CERTIFICATES THẬT · FULL SOURCE ZIP.**