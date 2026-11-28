# WOLVESVILLE — v1.7.36 CORE ENGINE RESCUE & FULL CERTIFICATE ACCELERATION
## BREAK THE DEADLOCK · CLOSE REAL GAMEPLAY · RECOVER REGRESSION · STOP PARTIAL-ONLY DEVELOPMENT

**PROJECT OWNER DIRECTIVE — CONTINUE DIRECTLY FROM FULL SOURCE v1.7.35**

**ACTIVE RULESET:** `wolvesville-official-v1.3.3`

**CANDIDATE RULESET:** `wolvesville-official-v1.3.4`

# I. ĐÁNH GIÁ VÀ CHỈ THỊ CỦA CHỦ DỰ ÁN

Tôi đã đọc toàn bộ báo cáo phát hành v1.7.35.

Tôi ghi nhận:

- Nguồn đồ họa wolfville.zip đã được tích hợp có chọn lọc.
- 97 portrait minh họa bổ sung đã được đưa vào dự án.
- 97 portrait gốc được bảo toàn.
- Giữ đủ 16 theme.
- Authentication sử dụng backend thật.
- Normal Visual Journey với deck [8,25] đã PASS.
- 51 ảnh PNG đã được chụp từ website thực tế.
- Toàn bộ chứng nhận kế thừa được bảo toàn.

Tuy nhiên, kết quả gameplay vẫn không đạt yêu cầu:

- F = 1/97.
- R = 52.
- A = 49.
- B = 37.
- QA C = 2.
- Playable C = 7.
- Atomic Coverage = 79/108.
- Normal Gameplay = 12.
- Browser INCOMPLETE = 61.
- Backend Regression phát sinh 1 FAIL.
- Privacy Release Gate vẫn PARTIAL.
- Competitive Production vẫn NO-GO.

**TÔI KHÔNG MUỐN TIẾP TỤC MỘT PHIÊN BẢN CHỈ THÊM HAI HOẶC BA BÀI TEST NHƯNG TẤT CẢ CHỈ SỐ GAMEPLAY VẪN GIỮ NGUYÊN.**

Qua nhiều phiên bản, bạn đã lập Readiness Matrix, xây dựng Completion Contracts, xác định Shared Dependencies, phát triển Shared Resolvers và bổ sung nhiều bài kiểm thử.

Nhưng các thành phần này chưa được chuyển hóa thành kết quả gameplay hoàn chỉnh.

Tôi yêu cầu thay đổi chiến lược:

**CORE ENGINE RESCUE + FINITE ROLE COMPLETION + DEPENDENCY DEADLOCK REMOVAL.**

Không tiếp tục mở rộng đồ họa diện rộng.

Không tiếp tục tạo thêm QA Deck không trực tiếp đóng nghĩa vụ FULL.

Không tiếp tục phân tích lại toàn bộ 97 nhân vật nếu đã có dữ liệu đủ để triển khai.

Không cố định PRIMARY ROLE vào một nhân vật đang phụ thuộc quá nhiều luật chưa được xác định.

Tập trung phần lớn nguồn lực vào việc hoàn thiện nhân vật thực tế.

# II. SOURCE BASELINE

Tiếp tục trực tiếp từ:

`Wolvesville_v1.7.35_Visual_Integration_Full_Gameplay_Breakthrough_Full_Source.zip`

SHA-256 theo báo cáo:

`b1c2e561686efcf423b6323e3534cbe91657f3f1b4e7e9385b608529316a4363`

Source Fingerprint:

`aff57845d025a893b8504743b631d16b54347c84d378eaf2a7b481d8eb109221`

Xác minh lại source thực tế trước khi thực hiện.

Bảo toàn:

- 97 Character IDs.
- 118 Historical Decisions.
- 207 Legacy Specifications.
- 18 Owner Choices hiện có.
- FULL #28.
- 2 QA C Certificates.
- 7 Playable C Certificates.
- 79 Atomic Certificates.
- 12 Normal Gameplay decks.
- Toàn bộ tài nguyên đồ họa đã tích hợp.
- 16 theme.
- 97 portrait gốc và 97 portrait minh họa bổ sung.
- Shared Group Chat ACL.
- Server-authoritative architecture.
- Privacy và Hidden Information.
- Các Browser Acceptance đã PASS.

Không downgrade source.

Không khởi tạo lại dự án.

Không tự thay đổi Official Rules.

# III. P0 — RECOVER MONOLITHIC BACKEND REGRESSION

Ưu tiên đầu tiên là sửa lỗi:

`S25 cult grant boundary: Q13-08 and wolf rejection before group mutation`

Theo báo cáo v1.7.35, lỗi xuất phát từ test mới kế thừa biến môi trường:

`WV_ARCHIVED_RULE_REGRESSION`

Khiến fixture được tạo theo ruleset archive, trong khi Group Chat ACL yêu cầu ruleset active.

Tôi yêu cầu:

1. Xác định chính xác đường truyền cấu hình ruleset vào test fixture.
2. Tách rõ ngữ cảnh active ruleset và archived ruleset.
3. Kiểm tra khả năng ảnh hưởng chéo giữa các test suite.
4. Cô lập môi trường kiểm thử phù hợp với cơ chế concurrency hiện tại.
5. Giữ nguyên các điều kiện nghiệp vụ của Group Chat ACL.
6. Không sửa engine để chấp nhận ruleset sai chỉ nhằm làm test PASS.
7. Không bỏ test bị FAIL khỏi inventory.
8. Không chuyển test sang SKIPPED để che lỗi.
9. Chạy lại toàn bộ monolithic regression.

Số lượng test cuối cùng phải được xác định từ inventory thực tế.

Mục tiêu:

**MONOLITHIC BACKEND REGRESSION — 0 FAIL — EXIT CODE 0.**

Sau khi đạt mục tiêu, tiếp tục ngay công việc gameplay.

Không kết thúc phiên bản chỉ vì đã sửa thành công một lỗi regression.

# IV. FULL ROLE DEADLOCK ANALYSIS

Tôi yêu cầu sử dụng Readiness Matrix 97/97 và các FULL Contracts hiện hành để xác định nhân vật có đường hoàn thiện ngắn nhất.

Không bắt buộc giữ #84 làm PRIMARY.

Phân biệt rõ hai nhóm blocker:

## Nhóm A — ENGINEERING BLOCKERS

Bao gồm:

- Thiếu implementation.
- Thiếu Shared Resolver.
- Thiếu API integration.
- Thiếu Frontend integration.
- Thiếu Game Session orchestration.
- Thiếu Browser evidence.
- Thiếu Privacy evidence.
- Thiếu Replay evidence.
- Lỗi regression.

Đây là những công việc bạn phải chủ động triển khai.

## Nhóm B — OWNER RULE BLOCKERS

Chỉ bao gồm các trường hợp thực sự không thể xác định hành vi hợp lệ từ:

- Official Rules ACTIVE.
- Owner Decision Records.
- Historical Decisions.
- Character Registry.
- Effective Rule Registry.
- Skill Specifications.
- VH01–VH85.
- Các quyết định Q/A và đặc tả đã chốt.

Không biến một vấn đề thiếu implementation thành lý do yêu cầu Owner quyết định lại.

Đối với mỗi ứng viên FULL, xác định:

- Tổng số obligation còn thiếu.
- Obligation có thể hoàn thiện bằng code.
- Obligation phụ thuộc nhân vật khác.
- Obligation thực sự phụ thuộc Owner.
- Shared Resolver cần hoàn thiện.
- Existing Browser Coverage.
- Khả năng tạo Normal Gameplay.
- Đường thực thi ngắn nhất đến FULL.

Chọn ứng viên dựa trên khả năng đóng toàn bộ FULL Contract, không dựa đơn thuần vào số lượng test hiện có.

Chỉ lập bảng đánh giá đủ để ra quyết định và chuyển ngay sang implementation.

# V. FINITE COMPLETION — CHỌN NHÂN VẬT CÓ THỂ HOÀN THÀNH

Ưu tiên kiểm tra lại:

- #25 Tiên Tri.
- #74 Tiên Tri Huyền Bí.
- #84 Phù Thủy Câm.
- #79 Sói Hòa Bình.
- #36 Pháp Sư.
- #37 Ảo Thuật Gia.
- #26 Thầy Đồng.
- #23 Xạ Thủ Linh Hồn.

Đồng thời kiểm tra những ứng viên FULL khác đã được xác định trong Readiness Matrix.

Không tự giới hạn trong danh sách trên nếu có nhân vật khác gần FULL hơn.

Chọn PRIMARY ROLE thỏa các điều kiện:

1. Không có blocker luật chưa được xác định hoặc blocker đó đã có quyết định hợp lệ.
2. Có FULL Contract rõ ràng.
3. Có thể triển khai các nghĩa vụ còn thiếu trên Game Engine hiện tại.
4. Có thể đưa vào Normal Gameplay.
5. Có thể thực hiện Browser Acceptance thực tế.
6. Có thể xác minh privacy, replay và tương tác cần thiết.

Tập trung đóng toàn bộ PRIMARY ROLE.

Không liên tục chuyển sang nhân vật khác khi gặp blocker kỹ thuật.

Chỉ chuyển PRIMARY khi xác định có blocker luật hoặc điều kiện thực thi không thể giải quyết trong phiên làm việc.

Nếu phải chuyển, ghi rõ blocker và tiếp tục ứng viên thay thế.

# VI. INVESTIGATION CLUSTER — ƯU TIÊN #25 VÀ #74

Tôi yêu cầu xem xét khả năng sử dụng Investigation Cluster làm hướng đột phá chính, thay vì tiếp tục bị mắc kẹt hoàn toàn tại #84 và #90.

## #25 TIÊN TRI — BT-25-2

Kiểm tra và triển khai các nghĩa vụ liên quan đến:

- #35 Sói Gương.
- Hào quang phản chiếu.
- Trạng thái trước và sau khi bị soi.
- Sự kiện chuyển vai của #3 Sói Tiên Tri.
- Các nguồn nhiễu hào quang.
- Kết quả soi hợp lệ.
- Quyền nhận kết quả.
- Action Capabilities.
- Tài nguyên và giới hạn sử dụng.
- Event Log.
- Replay.

Không lấy mô tả cũ trong character.json thay thế Effective Rule Registry nếu đã có quyết định mới hơn.

## #74 TIÊN TRI HUYỀN BÍ — BT-74-2

Kiểm tra và triển khai:

- #57 Kẻ Biến Hình.
- #18 Sói Biến Hình.
- Phân biệt sao chép chức năng và ngụy trang danh tính.
- Vai trò gốc.
- Vai trò hiện tại.
- Phe hiện tại.
- Hào quang.
- Nhóm phân loại kỹ năng.
- Các nguồn gây sai kết quả soi.
- Thông tin được phép trả cho người soi.
- Privacy và Replay.

Không đánh đồng hai Tiên Tri.

Không tạo một quy tắc soi chung nếu điều đó làm sai nghĩa vụ riêng của từng nhân vật.

## SHARED INVESTIGATION RESOLVER

Nếu source chưa có resolver đủ khả năng xử lý các trường hợp trên, hãy mở rộng hoặc refactor thành thành phần có thể tái sử dụng.

Resolver phải truy xuất dữ liệu có hiệu lực tại đúng thời điểm phân giải.

Phải xử lý thứ tự hiệu ứng và các ngoại lệ theo luật hiện hành.

Phải kiểm tra sự thay đổi trạng thái trước và sau sự kiện.

Không hardcode kết quả chỉ để một deck cụ thể PASS.

Nếu hoàn thiện Shared Investigation Resolver có thể đóng đồng thời #25 và #74, thực hiện cả hai FULL Contracts và nghiệm thu riêng từng nhân vật.

# VII. #90 GIÁO CHỦ — DEPENDENCY UNBLOCKING

Theo báo cáo v1.7.35:

- WV-CH90-S01 đang BLOCKED_BY_RULE.
- WV-CH90-S02 đang BLOCKED_BY_RULE.
- DC-CULT-WIN-01 chưa được chốt.
- Resolver tuyển mộ thật chưa hoàn thành.
- Membership hiện vẫn chủ yếu được chứng minh qua fixture.
- #84 vẫn bị chặn tại 84-03, 84-05, 84-06 và 84-07.

Tôi yêu cầu phân tách #90 thành những phần đã có luật đầy đủ và những phần thực sự còn thiếu luật.

## PHẦN ĐÃ CÓ NGUỒN LUẬT

Đối chiếu trực tiếp:

- Character #90.
- VH50.
- VH55.
- VH57.
- VH59.
- VH78.
- Q13-08.
- Các Owner Decisions mới nhất.

Triển khai những phần đã đủ căn cứ:

- Xác thực người sử dụng kỹ năng.
- Xác thực mục tiêu tuyển mộ.
- Giới hạn tối đa 5 tín đồ còn sống.
- Từ chối mục tiêu không hợp lệ.
- Không tuyển Sói và kẻ giết người theo định nghĩa đang có hiệu lực.
- Không ghi đè liên kết thắng độc lập trái Q13-08.
- Membership mutation có kiểm soát.
- Thông báo riêng khi tuyển mộ thành công.
- Chat giáo phái vào ban ngày.
- Không mở DM riêng.
- Phân giải hiến tế sau tuyển mộ thành công khi đủ điều kiện.
- Death-chain khi Giáo Chủ chết theo các quy tắc đã xác định.
- Privacy.
- Replay.
- Persistence.
- Reconnect.

Không tự xác định những phần chưa đủ luật.

Có thể triển khai và kiểm thử riêng các thành phần đã đủ căn cứ nhưng không kích hoạt toàn bộ nhân vật trong Normal Gameplay nếu những blocker còn lại khiến ván không thể vận hành đúng luật.

## OWNER DECISION PACK

Tổng hợp một lần các quyết định thực sự còn thiếu của #90 và các FULL Contracts liên quan.

Đặc biệt kiểm tra:

- Điều kiện thắng Giáo Chủ.
- Điều kiện thắng tín đồ.
- Quan hệ giữa phe hiện tại và nhóm thắng.
- Kỹ năng gốc của tín đồ.
- Tài nguyên gốc sau tuyển mộ.
- Việc tiêu hao lượt khi chọn nhầm.
- Thông báo khi tuyển mộ thất bại.
- Các tương tác chuyển phe, hồi sinh và liên kết độc lập.

Mỗi câu hỏi phải có:

- Decision ID.
- Nguồn hiện tại.
- Mâu thuẫn hoặc phần còn thiếu.
- Tình huống cụ thể.
- Phương án A/B/C.
- Phương án đề xuất.
- Số FULL Contracts bị ảnh hưởng.
- Các phần code đang bị chặn.

Không hỏi những luật đã được chốt.

Không tự phê duyệt phương án đề xuất.

Không ngừng toàn bộ tiến độ chỉ vì đang chờ một quyết định của Owner.

# VIII. #84 PHÙ THỦY CÂM — COMPLETE THE REAL GAMEPLAY

Tiếp tục hoàn thiện các nghĩa vụ:

- 84-03.
- 84-05.
- 84-06.
- 84-07.

Không tiếp tục coi việc tạo membership bằng fixture là Normal Gameplay.

Phải có luồng cấp quyền nhóm thật thông qua kỹ năng hợp lệ khi đủ luật.

Kiểm tra:

- Chỉ chặn chat công khai khi bị câm.
- Không chặn chat nhóm hợp lệ.
- Không tự chặn vote nếu luật không yêu cầu.
- Không tự chặn kỹ năng.
- Thời điểm bắt đầu hiệu ứng câm.
- Thời điểm hết hiệu lực.
- Bị khóa trước khi sử dụng kỹ năng.
- Chết trước phân giải.
- Hồi sinh.
- Thay đổi trạng thái quyền chat.
- Reconnect.
- Replay.

Nếu #90 chưa đủ quyết định để đóng FULL #84, giữ nguyên blocker chính xác.

Không cấp FULL giả.

Không thay đổi FULL Contract nhằm loại bỏ tương tác với #90.

# IX. #79 SÓI HÒA BÌNH — GAMEPLAY CLOSURE

Tiếp tục xử lý:

- 79-02.
- 79-03.
- 79-04.

## PH-02

Nghiệm thu nhiều kỹ năng ban ngày trong cùng một Game Session.

Đảm bảo thứ tự thực thi, hành động đang chờ phân giải và phase transition đúng luật.

Không tự hủy các sự kiện đã commit.

## WOLF PACK INFORMATION

Triển khai các phạm vi nhận thông tin đã được xác định trong Official Rules.

Không tự kích hoạt:

`DC-PACK-PRIVACY-BOUNDARY`

khi còn PENDING.

Phải làm rõ sự khác biệt giữa quyền nhận kết quả kỹ năng và quyền tham gia chat bầy.

Không mở rộng toàn bộ thông tin bí mật cho mọi thành viên chỉ vì cần công bố kết quả của Sói Hòa Bình.

## Q13-09

Triển khai nhiệm vụ Kẻ Chết Thay và cơ chế Oscar của #6 trong Game Session theo quyết định đã có.

Kiểm tra trường hợp Sói Hòa Bình hủy bỏ biểu quyết hợp lệ.

Không chỉ bổ sung một hàm tính Oscar riêng biệt mà thiếu tích hợp runtime thật.

# X. SHARED ENGINE COMPLETION

Tôi yêu cầu các Shared Mechanics đã được triển khai phải thực sự kết nối với runtime.

Đối với mỗi resolver, xác minh chuỗi:

**ACTION REQUEST → VALIDATION → RESOLUTION → STATE MUTATION → EVENT COMMIT → AUTHORIZED PROJECTION → CLIENT RENDER → REPLAY.**

Không chấp nhận một resolver chỉ tồn tại trong file code hoặc chỉ được gọi từ test fixture nhưng chưa được sử dụng trong Game Session thực tế.

Ưu tiên hoàn thiện thành phần theo nhu cầu đóng FULL Contract.

Không xây dựng một hệ thống framework mới quá lớn nếu không trực tiếp giải quyết các nghĩa vụ hiện tại.

Có thể refactor sâu khi cần nhưng phải bảo toàn luật và gameplay kế thừa.

# XI. CONTINUOUS EXECUTION — BẮT BUỘC TẠO KẾT QUẢ THỰC TẾ

Thực hiện theo vòng lặp:

**IMPLEMENT → BUILD → TEST → FIX → RETEST → NORMAL GAMEPLAY → FULL ACCEPTANCE → CERTIFY → NEXT ROLE.**

Không dừng ở việc tạo tài liệu hoặc xác định blocker.

Mỗi khi hoàn thành một Shared Mechanic:

1. Tích hợp trực tiếp vào nhân vật liên quan.
2. Chạy backend.
3. Chạy browser.
4. Kiểm tra privacy.
5. Kiểm tra replay.
6. Đóng các obligation tương ứng.
7. Xác minh toàn bộ FULL Contract.
8. Cấp chứng nhận khi đủ điều kiện.

Nếu PRIMARY đạt FULL, tiếp tục SECONDARY.

Nếu SECONDARY đạt FULL, tiếp tục ứng viên tiếp theo.

Không giới hạn phiên bản chỉ tăng một FULL nếu có khả năng hoàn thiện nhiều hơn.

Mục tiêu triển khai:

- Minimum: F ≥ 2.
- Main target: F ≥ 3.
- Stretch target: F ≥ 5.

F chỉ được tăng khi có FULL Certificate hợp lệ theo đúng tiêu chuẩn hiện hành.

Nếu F không tăng, không tuyên bố FULL BREAKTHROUGH thành công.

# XII. BROWSER ACCEPTANCE DEBT REDUCTION

Tôi nhận thấy Browser INCOMPLETE đã giữ nguyên ở mức 61 qua nhiều phiên bản.

Trong khi đó, số Browser PASS tăng chủ yếu do thêm suite mới.

Tôi yêu cầu thay đổi cách theo dõi tiến độ browser.

Phân biệt:

- Existing INCOMPLETE được chuyển thành PASS.
- Existing FAIL được sửa thành PASS.
- Existing PASS được tái nghiệm thu.
- Newly Added Suite.
- Newly Added PASS.
- Newly Added INCOMPLETE.

Ưu tiên hoàn thiện các suite INCOMPLETE trực tiếp liên quan đến FULL Contract đang triển khai.

Không chỉ thêm suite mới mà bỏ nguyên những nghĩa vụ nghiệm thu còn tồn đọng.

Đối với mỗi Browser INCOMPLETE, phân loại nguyên nhân:

- Chưa có implementation.
- Chưa có Frontend integration.
- Chưa đủ luật.
- Chưa có test.
- Chưa chạy.
- Môi trường thực thi không hỗ trợ.
- Regression.

Không chuyển INCOMPLETE thành PASS nếu chưa có bằng chứng.

Không xóa suite cũ để giảm mẫu số.

Browser Acceptance phải chạy trên source fingerprint cuối cùng.

# XIII. VISUAL POLISH — CHỈ SỬA NHỮNG LỖI CÒN TỒN ĐỌNG

Bảo toàn toàn bộ giao diện đồ họa đã tích hợp trong v1.7.35.

Không tiếp tục thiết kế lại toàn bộ ứng dụng.

Không nhập lại toàn bộ wolfville.zip.

Tập trung xử lý các lỗi đã phát hiện:

## P1 — HIGH PRIORITY

### 1. Mobile phase banner

- Sửa lỗi cắt chữ.
- Cho phép nội dung xuống dòng đúng cách.
- Không làm che khu vực gameplay.
- Kiểm tra 390 × 844 và các viewport nhỏ liên quan.

### 2. Theme contrast

Sửa độ tương phản của Player Cards và HUD trong:

- Basic Light.
- Cream.
- Sage.

Đảm bảo chữ thông thường đạt contrast tối thiểu 4,5:1 theo các trường hợp áp dụng.

Kiểm tra cả trạng thái sống, chết, được chọn, disabled và đang bỏ phiếu.

### 3. Stale voting receipt

Xóa trạng thái hiển thị phiếu cũ khi ván đã kết thúc.

Đồng bộ UI theo server phase và match result.

Không xóa dữ liệu vote hợp lệ trong Event Log hoặc Replay.

## P2 — MEDIUM PRIORITY

### 4. Toast notification

- Không chồng lên tiêu đề.
- Không che nút kỹ năng.
- Không che thời gian.
- Giới hạn vùng hiển thị và số lượng toast.

### 5. Mobile chat

- Tối ưu bố cục chat.
- Giảm số lần cuộn không cần thiết.
- Giữ nút gửi và thao tác chính dễ tiếp cận.
- Không làm mất tab nhóm được cấp quyền.

### 6. Role Reveal

Hoàn thiện modal hiển thị thẻ vai riêng nếu không ảnh hưởng đến ưu tiên gameplay.

Chỉ nhận dữ liệu được server cấp quyền.

Có nút bỏ qua hoặc Reduced Motion.

### 7. Replay

Cải thiện giao diện timeline trên dữ liệu Event Log thực tế trong phạm vi có thể.

Không tạo thêm thông tin giả.

Không làm thay đổi Replay ACL.

Không dành phần lớn phiên bản cho animation hoặc thiết kế thêm theme.

# XIV. REAL SCREENSHOT ACCEPTANCE

Tôi yêu cầu tiếp tục gửi hình ảnh thực tế sau khi sửa giao diện.

Không cần chụp lại toàn bộ 51 ảnh nếu không có thay đổi đáng kể.

Tập trung chụp bằng chứng cho những vấn đề vừa được giải quyết.

Bắt buộc nếu đã triển khai:

1. Mobile phase banner trước và sau.
2. Mobile Night Gameplay.
3. Mobile Day Gameplay.
4. Basic Light HUD.
5. Cream HUD.
6. Sage HUD.
7. Endgame không còn voting receipt cũ.
8. Role Reveal nếu đã hoàn thiện.
9. Gameplay của PRIMARY ROLE.
10. Gameplay của FULL ROLE mới.
11. Chat nhóm được cấp quyền từ gameplay thật nếu đã triển khai.
12. Replay của ván mới.

Tất cả ảnh phải chụp từ ứng dụng đang chạy.

Không sử dụng mockup.

Không sử dụng ảnh AI.

Không sử dụng ảnh cũ làm bằng chứng cho source mới.

Phân biệt rõ Normal Gameplay, QA và fixture trong manifest.

Đính kèm trực tiếp những hình ảnh quan trọng nhất trong báo cáo cuối.

Nếu có thể, cung cấp thêm video hoặc browser trace thực tế ghi lại luồng chơi của FULL ROLE mới.

# XV. REGRESSION & RELEASE QUALITY GATES

Bắt buộc chạy trên source cuối cùng:

- Source Verification.
- TypeScript Build.
- Rules Build.
- Monolithic Backend Regression.
- Existing Browser Regression.
- Required FULL Role Browser Acceptance.
- Normal Gameplay Acceptance.
- Privacy.
- Replay.
- Reconnect.
- Visual Regression.
- Certificate Revalidation.

Mục tiêu:

- Backend FAIL = 0.
- Browser FAIL = 0 trong các suite đã thực thi.
- Không làm mất chứng nhận cũ.
- Không làm giảm các chỉ số gameplay đã đạt.
- Không làm tăng phạm vi rò rỉ thông tin.
- Không thay đổi luật trái Owner Decisions.

Human QA chưa thực hiện phải giữ PENDING.

PostgreSQL Acceptance chưa thực hiện phải giữ PENDING.

Native Mac Acceptance chưa thực hiện phải ghi rõ.

Competitive Production vẫn NO-GO nếu chưa vượt qua toàn bộ release gates cần thiết.

# XVI. RELEASE SCORECARD

Báo cáo:

| Metric | v1.7.35 | v1.7.36 | Delta |
|---|---|---|---|
| F | 1 | | |
| R | 52 | | |
| A | 49 | | |
| B | 37 | | |
| QA C | 2 | | |
| Playable C | 7 | | |
| Atomic | 79/108 | | |
| Normal Gameplay | 12 | | |
| Backend PASS | 473 | | |
| Backend FAIL | 1 | | |
| Backend SKIPPED | 11 | | |
| Browser PASS | 23 | | |
| Browser INCOMPLETE | 61 | | |
| Privacy | PARTIAL | | |
| PostgreSQL | PENDING | | |
| Human QA | PENDING | | |

Bổ sung:

- PRIMARY ROLE được chọn.
- SECONDARY ROLE được chọn.
- Lý do lựa chọn.
- FULL obligations trước và sau.
- Shared Dependencies được đóng.
- Gameplay thực tế được bổ sung.
- Existing Browser INCOMPLETE được xử lý.
- FULL Certificates mới.
- Code files thay đổi.
- Commands và exit codes.
- Owner Decisions còn thiếu.
- UI/UX defects được sửa.
- Screenshot Evidence.

Không dùng số lượng dòng code hoặc số lượng file thay đổi làm thước đo thay thế cho kết quả.

Nếu F vẫn bằng 1, phải giải trình cụ thể vì sao tất cả ứng viên có khả năng hoàn thành đều chưa thể đạt FULL.

Không sử dụng lại các mô tả chung chung đã xuất hiện qua nhiều phiên bản.

# XVII. FULL SOURCE DELIVERY

Bàn giao:

`Wolvesville_v1.7.36_Core_Engine_Rescue_Full_Source.zip`

Bao gồm toàn bộ source hiện tại:

- Backend.
- Frontend.
- Game Engine.
- Shared Resolvers.
- Character Registry.
- Effective Rule Registry.
- Official Rules.
- Owner Decision Records.
- Graphics Assets.
- Themes.
- Group Chat ACL.
- Completion Contracts.
- FULL Certificates.
- QA và Playable C Certificates.
- Atomic Coverage.
- Tests.
- Regression Evidence.
- Screenshot Evidence.
- Replay.
- Database Migrations.
- Human QA Pack.
- Changelog.
- README Mac Apple Silicon.

Bàn giao thêm:

`Wolvesville_v1.7.36_Screenshot_Evidence.zip`

`Wolvesville_v1.7.36_Visual_Acceptance_Report.html`

`Wolvesville_v1.7.36_Owner_Decision_Pack.md`

Xác minh:

- ZIP CRC.
- SHA-256.
- Clean Extraction.
- Payload Integrity.
- Build.
- Regression.
- Certificate Revalidation.
- Metrics Verification.

Không chỉ giao patch.

Không chứa runtime database, node_modules, secrets, .env thật hoặc build cache.

# XVIII. MỆNH LỆNH CUỐI CÙNG

Tôi đã cho phép phát triển theo nhiều chiến lược qua các phiên bản trước:

- F-FIRST.
- FULL CERTIFICATE BREAKTHROUGH.
- FULL ROLE FACTORY.
- DEPENDENCY CLOSURE.
- VISUAL INTEGRATION.

Tuy nhiên F vẫn bằng 1.

Từ phiên bản này, tôi yêu cầu tập trung vào việc hoàn thiện sản phẩm thực sự.

Không để #84 và #90 trở thành chuỗi phụ thuộc làm đình trệ toàn bộ dự án.

Tìm nhân vật có đường hoàn thiện khả thi.

Đóng toàn bộ FULL Contract.

Triển khai Shared Resolver cần thiết.

Tích hợp vào Normal Gameplay.

Kiểm thử và nghiệm thu bằng hành vi thực tế.

Bảo toàn giao diện đồ họa hiện tại.

Sửa các lỗi UX đã phát hiện.

Gửi hình ảnh sản phẩm thật.

**KHÔNG DỪNG SAU KHI THÊM HAI BÀI TEST.**

**KHÔNG DỪNG SAU KHI TẠO MỘT SHARED RESOLVER CHƯA ĐƯỢC TÍCH HỢP.**

**KHÔNG DỪNG SAU KHI PHÂN TÍCH BLOCKER.**

**KHÔNG HẠ TIÊU CHUẨN FULL.**

**RECOVER REGRESSION → REMOVE DEADLOCK → COMPLETE ROLE → PLAY → CERTIFY → NEXT ROLE → DELIVER.**