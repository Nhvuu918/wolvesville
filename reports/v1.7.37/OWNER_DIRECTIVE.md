# WOLVESVILLE — v1.7.37 OWNER-APPROVED RULE EXECUTION & FULL ROLE BREAKTHROUGH

## 7 OWNER DECISIONS CONFIRMED · REMOVE RULE DEADLOCK · COMPLETE SHARED ENGINE · CERTIFY FULL ROLES · REAL GAMEPLAY ACCEPTANCE

**PROJECT OWNER DIRECTIVE — CONTINUE DIRECTLY FROM FULL SOURCE v1.7.36**

**ACTIVE RULESET:** `wolvesville-official-v1.3.3`

**CANDIDATE RULESET:** `wolvesville-official-v1.3.4`

# I. CHỈ THỊ CHIẾN LƯỢC CỦA CHỦ DỰ ÁN

Tôi đã đọc toàn bộ báo cáo phát hành v1.7.36.

Tôi ghi nhận:

- Monolithic Backend Regression đạt 476 PASS, 0 FAIL, 11 SKIPPED.
- R tăng từ 52 lên 53.
- A tăng từ 49 lên 50.
- B tăng từ 37 lên 38.
- Normal Gameplay tăng từ 12 lên 13.
- #35 Sói Gương đã được tích hợp vào Game Session thực tế.
- Deck [25,31,35,74] đã đạt Backend và Browser Acceptance.
- Browser PASS tăng từ 23 lên 27.
- Browser INCOMPLETE giảm từ 61 xuống 58.
- Ba Browser Acceptance tồn đọng đã chuyển thành PASS.
- Các lỗi UI ưu tiên cao đã được sửa trong phạm vi nghiệm thu.
- Toàn bộ chứng nhận kế thừa được bảo toàn.

Tuy nhiên:

**F VẪN BẰNG 1/97.**

Trong báo cáo v1.7.36, bạn đã xác định bảy quyết định luật đang cản trở Investigation Cluster và Cult Membership Cluster.

**TÔI CHÍNH THỨC XÁC NHẬN TOÀN BỘ BẢY QUYẾT ĐỊNH NÀY TRONG CHỈ THỊ BÊN DƯỚI.**

Không tiếp tục sử dụng việc thiếu các quyết định này làm lý do trì hoãn implementation trong phạm vi đã được xác nhận.

Không yêu cầu tôi chọn lại A/B/C.

Không tiếp tục ghi những quyết định đã được xác nhận dưới dạng đề xuất PENDING.

Không dừng ở việc cập nhật Decision Records hoặc viết tài liệu luật.

Tôi yêu cầu chuyển các quyết định đã được phê duyệt thành:

**RULE IMPLEMENTATION → LIVE GAMEPLAY → FULL CONTRACT CLOSURE → VERIFIED CERTIFICATION.**

# II. SOURCE BASELINE

Tiếp tục trực tiếp từ:

`Wolvesville_v1.7.36_Core_Engine_Rescue_Full_Source.zip`

SHA-256 theo báo cáo:

`8c78c3b08e804aeece0e7818a074ef65bc75a2e018418ecbde5484bbe308228c`

Source Fingerprint:

`0edd9aa78cd86efb60bfc56fc22417699ce2b956cfcf0d9a00a17fe9654f8447`

Xác minh source thực tế trước khi triển khai.

Bảo toàn:

- 97 Character IDs.
- 118 Historical Decisions kế thừa.
- 207 Legacy Specifications.
- 18 Owner Choices kế thừa.
- FULL #28.
- 2 QA C Certificates.
- 7 Playable C Certificates.
- 79 Atomic Certificates.
- 13 Normal Gameplay decks.
- 27 Browser PASS.
- Shared Group Chat ACL.
- Mirror Investigation Resolver.
- Toàn bộ hệ thống đồ họa đã tích hợp.
- 16 theme.
- 97 portrait gốc và 97 portrait minh họa bổ sung.
- Các sửa đổi UI/UX của v1.7.36.
- Privacy, Replay, Persistence và Server-authoritative architecture.

Không khởi tạo lại dự án.

Không downgrade backend, frontend, database schema hoặc ruleset.

# III. OFFICIAL OWNER DECISION RECORD — 7/7 APPROVED

Những quyết định sau được tôi xác nhận trực tiếp với tư cách chủ dự án.

## DECISION 01 — DC-CULT-WIN-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Giáo Chủ còn sống và tất cả người còn sống thuộc giáo phái thì giáo phái đạt điều kiện thắng.

### Implementation requirements

- Xét điều kiện thắng tại checkpoint hợp lệ sau khi hoàn thành chuỗi sự kiện hiện tại.
- Bảo toàn VH03, VH06, VH58 và các quy tắc trạng thái sống/chết đặc biệt.
- Không tự kết thúc giữa quá trình tuyển mộ, hiến tế, cứu hoặc death-chain.
- Phân biệt điều kiện thắng của giáo phái với chính sách ghi nhận thắng cho từng người chơi.
- Không bỏ qua người đang chờ hồi sinh hoặc ngủ đông khi quy tắc hiện hành yêu cầu tính họ.
- Không suy diễn quy tắc thắng cá nhân của tín đồ đã chết nếu nguồn luật chưa xác định.

## DECISION 02 — DC-CULT-RIGHTS-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Tín đồ giữ nguyên vai trò, kỹ năng, tài nguyên và cooldown; chuyển phe và nhóm thắng giáo phái theo luật đã chốt.

### Implementation requirements

Phân biệt và lưu độc lập:

- initialRoleId.
- currentRoleId.
- effectiveSkillSet.
- originalFaction.
- currentFaction.
- currentWinGroup.
- cultMembership.
- resources.
- cooldowns.
- statusEffects.
- groupChatPermissions.

Không reset tài nguyên.

Không tự cấp thêm lượt dùng kỹ năng.

Không xóa cooldown hoặc hiệu ứng đang có hiệu lực chỉ vì người chơi được tuyển mộ.

Không tự biến mọi tín đồ thành cùng một Character ID.

Không tự thay đổi hào quang nếu quy tắc hào quang tương ứng không yêu cầu.

Bảo toàn Q13-08 và các quy tắc liên kết thắng độc lập.

## DECISION 03 — DC-CULT-FAILED-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Nếu tuyển mộ thất bại, Giáo Chủ mất lượt tuyển đêm đó, nhận thông báo thất bại chung và mục tiêu không biết.

### Implementation requirements

- Tiêu hao lượt tuyển khi lượt tuyển hợp lệ được phân giải thành thất bại.
- Không thay đổi membership.
- Không đổi phe.
- Không đổi nhóm thắng.
- Không thay đổi tài nguyên hoặc kỹ năng của mục tiêu.
- Không gửi thông báo tuyển mộ cho mục tiêu.
- Không tiết lộ lý do thất bại có khả năng làm lộ thông tin bí mật.

Phân biệt:

1. Recruitment failure theo luật.
2. Invalid request.
3. Unauthorized request.
4. Duplicate request.
5. Network failure.
6. Retry.

Không tính trùng lượt tuyển khi retry.

Không biến lỗi kỹ thuật thành recruitment failure.

Không cho phép Action Capabilities, danh sách mục tiêu, API response hoặc UI làm lộ trước những phe và vai trò bí mật mà Giáo Chủ không có quyền biết.

Đóng câu hỏi NV93 trong đúng phạm vi quyết định này.

## DECISION 04 — DC-CULT-KILLER-DOMAIN-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Nhóm kẻ giết người không thể tuyển mộ được xác định là kẻ giết người độc lập; không tự động cấm Dân làng có kỹ năng sát thương.

### Implementation requirements

Không cho phép tuyển:

- Thành viên phe Sói theo luật hiện hành.
- Kẻ giết người độc lập.
- Người có nhóm hoặc liên kết thắng độc lập bị cấm theo Q13-08.
- Các mục tiêu không hợp lệ khác theo nguồn luật đang có hiệu lực.

Không từ chối người chơi chỉ vì nhân vật có ATTACK capability.

Sử dụng Character Registry, SMU Classification, Effective Rule Registry và trạng thái hiện hành của người chơi.

Kiểm tra các trường hợp:

- Dân có kỹ năng bắn.
- Dân có kỹ năng đầu độc.
- Nhân vật có kỹ năng sát thương bị động.
- Nhân vật độc lập có điều kiện thắng riêng.
- Nhân vật đã đổi phe.
- Nhân vật đã đổi nhóm thắng.
- Nhân vật có liên kết độc lập.

Không tự mở rộng miền cấm tuyển ngoài phạm vi luật đã được xác nhận.

## DECISION 05 — DC-CULT-REVIVAL-01

**OWNER CHOICE: B**

**APPROVED CONTENT:**

Không tự khôi phục membership giáo phái sau khi tín đồ được hồi sinh; phe, nhóm thắng và khả năng tuyển lại phải tuân theo luật hồi sinh đã chốt.

### Implementation requirements

Phân biệt:

- Pending Death.
- Final Death.
- Protected.
- Saved.
- Extended Life.
- Hibernating.
- Pending Revival.
- Revived.

Không thu hồi membership chỉ vì xuất hiện trong danh sách chết sơ bộ.

Không coi cứu thành công là hồi sinh sau khi đã chết chính thức.

Không tự cấp lại Cult Group Membership hoặc quyền chat khi một tín đồ chết chính thức được hồi sinh.

Không tự mặc định người được hồi sinh trở về phe Dân hoặc tiếp tục thuộc phe giáo phái nếu luật tương ứng chưa xác định.

Kiểm tra lại quyền truy cập trên REST, WebSocket, Replay và Reconnect.

Bảo toàn các ngoại lệ hồi sinh hiện hành, bao gồm VH73, VH76 và các trạng thái đặc biệt theo Q13.

## DECISION 06 — DC-MIRROR-MULTIVICTIM-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Sói Gương lấy hào quang của nạn nhân chết chính thức cuối cùng do bầy Sói cắn theo thứ tự phân giải ổn định; không tính người đã được cứu.

### Implementation requirements

- Xác định chính xác nguồn sát thương thuộc lượt cắn tập thể của bầy Sói.
- Phân biệt đòn cắn bầy với sát thương độc lập của nhân vật Sói.
- Không chọn nạn nhân chỉ vì chết trong cùng một đêm.
- Không tính người bị tấn công nhưng sống do bảo vệ hoặc cứu.
- Sử dụng hào quang thực sự tại thời điểm chết theo VH22.
- Lưu thứ tự phân giải ổn định theo VH08 và luật cắn bầy hiện hành.
- Không dựa trên thứ tự HTTP request.
- Không phụ thuộc tốc độ người chơi nhấn nút.
- Không random lại khi replay hoặc reconnect.
- Không sử dụng cái chết trong tương lai để sửa kết quả soi đã commit trước đó.

Nếu có nhiều nạn nhân đủ điều kiện, chọn nạn nhân chết chính thức cuối cùng theo thứ tự phân giải hợp lệ.

Nếu chỉ một nạn nhân đủ điều kiện, chọn nạn nhân đó.

Nếu không có nạn nhân mới đủ điều kiện, giữ phản chiếu gần nhất theo VH11.

Nếu chưa từng có phản chiếu, sử dụng hào quang thật theo VH11.

Bảo toàn:

- Quy tắc phản chiếu nạn nhân từ đêm trước.
- Cơ chế bị soi hai lần sẽ lộ nguyên hình.
- Phạm vi áp dụng của từng loại điều tra.
- Giới hạn lượt cắn theo VH74.

Không tự áp dụng bộ đếm soi hào quang sang mọi loại soi khác.

## DECISION 07 — DC-INSPECTION-ORDER-01

**OWNER CHOICE: A**

**APPROVED CONTENT:**

Chuyển hướng mục tiêu → xác định dữ liệu gốc → áp dụng giả danh/nhiễu → đảo kết quả; hiệu ứng miễn nhiễu loại bỏ đúng những tác động mà nó có quyền kháng. Giữ ngoại lệ từng vai.

### Implementation requirements

Xây dựng Shared Investigation Pipeline:

1. Xác thực quyền hành động.
2. Xử lý khóa và chống khóa đúng thời điểm.
3. Xác định mục tiêu ban đầu.
4. Áp dụng chuyển hướng hợp lệ đối với kỹ năng đang sử dụng.
5. Xác định mục tiêu cuối.
6. Xác định loại điều tra.
7. Truy xuất dữ liệu gốc tại checkpoint hợp lệ.
8. Áp dụng giả danh.
9. Áp dụng hiệu ứng hào quang và nhiễu theo P05.
10. Áp dụng đảo hoặc làm sai kết quả theo luật từng kỹ năng.
11. Bảo toàn phạm vi miễn nhiễu.
12. Xác định kết quả cuối.
13. Commit event.
14. Phân phối kết quả theo Authorized Audience.

Đây là pipeline điều tra, không phải quy định thay đổi toàn bộ thứ tự phân giải đêm.

Không đưa các hiệu ứng bảo trì chống khóa xuống sau thời điểm sử dụng kỹ năng.

Không áp dụng chuyển hướng sát thương vào kỹ năng soi nếu luật không cho phép.

Bảo toàn:

- SYS-03.
- SYS-25.
- P05.
- VH08.
- VH10.
- VH11.
- VH41.
- VH71.
- VH84.
- Q13-06.
- Q13-11.

Đặc biệt:

- Soi hào quang phải trả dữ liệu hào quang.
- Soi vai chính xác phải trả dữ liệu vai trò.
- Soi phân loại phải trả dữ liệu phân loại.
- Soi phe phải trả dữ liệu phe.
- Không dùng một phép đảo Thiện/Ác để xử lý mọi loại điều tra.
- Bẫy soi vai chính xác phải giữ tập random từ bộ vai đã khóa theo Q13-06.
- Bẫy soi phân loại phải trả giá trị sai cùng kiểu theo Q13-11.
- Thẩm Phán Linh Hồn phải bảo toàn miễn nhiễu theo VH84.
- Bảo trì chỉ kháng đúng những hiệu ứng thuộc phạm vi có hiệu lực.
- Không làm sai các tương tác riêng đã được Owner xác nhận.

Nếu vẫn còn xung đột cụ thể giữa hai hiệu ứng cùng cấp mà các quyết định trên chưa giải quyết, ghi nhận riêng trường hợp biên đó.

Không đánh dấu toàn bộ DC-INSPECTION-ORDER-01 là chưa được phê duyệt chỉ vì một trường hợp biên còn thiếu luật.

# IV. OWNER DECISION SYNCHRONIZATION

Cả bảy Decision ID trên đều đã được tôi phê duyệt trực tiếp.

Thực hiện:

- Ghi nguyên văn Owner Choices.
- Giữ nguyên lịch sử quyết định cũ.
- Kiểm tra xung đột với source thực tế.
- Ánh xạ Character IDs.
- Ánh xạ Skill IDs.
- Ánh xạ Rule IDs.
- Ánh xạ FULL obligations.
- Cập nhật Effective Rule Registry theo quy trình hiện hành.
- Cập nhật Character Specifications.
- Cập nhật Completion Contracts theo nội dung luật mới mà không hạ chuẩn nghiệm thu.
- Cập nhật test specifications và provenance.
- Triển khai implementation tương ứng.
- Kiểm thử.
- Xác minh runtime.

Expected Owner Choices: 18 + 7 = 25 nếu cả bảy mã mới là record riêng chưa được tính.

Xác minh số lượng thực tế, không hardcode metric.

Phân biệt rõ:

- OWNER APPROVED.
- SOURCE VERIFIED.
- IMPLEMENTED.
- RUNTIME VERIFIED.
- ACTIVE.

Không nhầm việc Owner phê duyệt với việc implementation đã hoàn thành.

Không tự động kích hoạt toàn bộ Official Rules v1.3.4.

Sử dụng cơ chế cập nhật ruleset hợp lệ của dự án; ghi rõ phiên bản, phạm vi và provenance cho các quyết định mới.

`DC-PACK-PRIVACY-BOUNDARY` vẫn chưa được phê duyệt trong đợt này.

Không tự thay đổi trạng thái của quyết định đó.

# V. EXECUTION STRATEGY — COMPLETE ONE, THEN SCALE

Tôi yêu cầu thay đổi phương pháp tổ chức công việc.

Không mở rộng đồng thời tất cả nhân vật rồi kết thúc phiên bản khi mỗi nhân vật mới được triển khai một phần.

Sử dụng Full Role Readiness Matrix hiện có để lựa chọn:

- PRIMARY ROLE.
- SECONDARY ROLE.
- BACKUP ROLE.

Ưu tiên các ứng viên #25, #74, #35, #84 và #90 vì bảy quyết định vừa được xác nhận trực tiếp ảnh hưởng đến những nhân vật này.

Tuy nhiên, việc lựa chọn PRIMARY phải dựa trên toàn bộ FULL Contract và source thực tế.

Nếu #35 hoặc nhân vật khác có đường đến FULL ngắn hơn #25, có thể điều chỉnh PRIMARY.

Sau khi lựa chọn:

1. Xác định tất cả obligation còn thiếu.
2. Xác định đường phụ thuộc tối thiểu để đóng contract.
3. Hoàn thiện code.
4. Tích hợp runtime.
5. Kiểm thử theo từng obligation.
6. Chạy Normal Gameplay.
7. Chạy Browser Acceptance.
8. Xác minh Privacy và Replay.
9. Đóng toàn bộ FULL Contract.
10. Cấp FULL Certificate nếu đủ chuẩn.
11. Tiếp tục nhân vật tiếp theo.

Chỉ chuyển PRIMARY khi có blocker luật thực sự chưa được xác định hoặc điều kiện thực thi không thể giải quyết.

Không chuyển PRIMARY chỉ vì công việc implementation phức tạp.

Không dừng sau khi một Shared Resolver mới chỉ có unit test PASS.

# VI. CLUSTER 01 — INVESTIGATION FULL COMPLETION

**Ưu tiên phát triển cụm điều tra và biến đổi nhân vật.**

Nhân vật liên quan:

- #25 Tiên Tri.
- #74 Tiên Tri Huyền Bí.
- #35 Sói Gương.
- #3 Sói Tiên Tri.
- #57 Kẻ Biến Hình.
- #18 Sói Biến Hình.

## A. MIRROR RESOLVER COMPLETION

Tiếp tục từ `mirror-investigation.ts`.

Triển khai DC-MIRROR-MULTIVICTIM-01.

Mở rộng khỏi giới hạn cấu hình một Sói và một mục tiêu.

Bắt buộc kiểm thử:

- Bầy nhiều Sói.
- Hai mục tiêu cắn hợp lệ.
- Hai mục tiêu đều chết chính thức.
- Mục tiêu thứ nhất được cứu.
- Mục tiêu thứ hai được cứu.
- Cả hai được cứu hoặc bảo vệ.
- Không có nạn nhân mới.
- Chết dây chuyền không trực tiếp do cắn.
- Hào quang nạn nhân đã bị thay đổi.
- Lần soi thứ nhất và thứ hai.
- Nhiều lượt soi hợp lệ.
- Nhiễu và miễn nhiễu.
- Retry.
- SQLite restart.
- Replay.
- Reconnect.

Tích hợp với Game Session thật và Wolf Pack hiện hành.

## B. ROLE TRANSFORMATION COMPLETION

Hoàn thiện các dependency:

### #3 Sói Tiên Tri

- Soi phân loại chức năng.
- Trường hợp đa kỹ năng.
- Hào quang đặc biệt.
- Chuyển thành Sói thường.
- Điều kiện trở thành Sói cuối cùng.
- Action Capabilities trước và sau biến đổi.
- Quyền cắn bầy và quyền chat theo luật.

### #57 Kẻ Biến Hình

- Ngụy trang danh tính.
- Điều kiện nạn nhân chết chính thức.
- Phân biệt vai gốc và vai giả.
- Không tự sao chép kỹ năng.
- Không tự chuyển phe hoặc nhóm thắng.
- Kết quả soi trước và sau ngụy trang.

### #18 Sói Biến Hình

- Chọn mục tiêu sao chép.
- Điều kiện kích hoạt khi mục tiêu chết chính thức.
- Không kích hoạt sai nếu mục tiêu được cứu.
- Sao chép kỹ năng theo VH71.
- Giữ phe Sói và điều kiện thắng phe Sói.
- Cập nhật Action Capabilities.
- Tài nguyên theo nguồn luật đã xác định.
- Kết quả soi và thông tin hiển thị sau biến đổi.

Không tự xác định những quy tắc tài nguyên hoặc hào quang còn thiếu nguồn luật.

## C. SHARED INVESTIGATION RESOLVER V2

Triển khai DC-INSPECTION-ORDER-01.

Tích hợp các cơ chế hiện có vào pipeline có khả năng tái sử dụng.

Không tạo một resolver mới song song nhưng không được Game Session sử dụng.

Bắt buộc có đường runtime:

ACTION REQUEST → VALIDATION → RESOLUTION → EVENT COMMIT → AUTHORIZED PROJECTION → FRONTEND → REPLAY.

Kiểm thử tương tác với những nhân vật và hiệu ứng bắt buộc theo FULL Contract, bao gồm các nguồn giả danh, phản chiếu, khóa, bẫy, nhiễu và miễn nhiễu.

## D. FULL CONTRACT CLOSURE

Đóng:

- BT-25-2.
- BT-74-2.
- FULL Contract #35.
- Những obligation liên quan còn thiếu.

Không chỉ chạy lại deck [25,31,35,74].

Bổ sung Normal Gameplay có đủ dependency cần thiết.

Kiểm thử từng nghĩa vụ riêng của #25, #74 và #35.

Không suy ra rằng cả ba nhân vật đều FULL chỉ vì Shared Investigation Resolver PASS.

Cấp chứng nhận riêng cho từng nhân vật khi đủ bằng chứng.

# VII. CLUSTER 02 — CULT MEMBERSHIP & GAMEPLAY

**Đây là cụm đã được tháo gỡ năm quyết định Owner.**

Tôi không muốn tiếp tục nhận một bản cập nhật chỉ bổ sung validation tại `group-chat.ts`.

Shared Group Chat ACL đã được xây dựng qua nhiều phiên bản.

Bây giờ phải đưa nó vào gameplay tuyển mộ thực tế.

## A. CULT RECRUITMENT RESOLVER

Triển khai #90 Giáo Chủ với năm quyết định CULT đã được phê duyệt.

Luồng thực thi:

1. Server cấp Action Capability hợp lệ.
2. Giáo Chủ chọn mục tiêu.
3. Server xác thực hành động.
4. Kiểm tra khóa và điều kiện sử dụng.
5. Kiểm tra miền mục tiêu tại thời điểm phân giải.
6. Phân giải thành công hoặc thất bại.
7. Tiêu hao lượt đúng luật.
8. Cập nhật phe và nhóm thắng.
9. Bảo toàn kỹ năng, tài nguyên và cooldown.
10. Cập nhật membership.
11. Commit event.
12. Gửi thông báo riêng.
13. Cấp quyền chat đúng giai đoạn.
14. Cập nhật authorized projection.

Nếu thất bại:

- Không thay đổi trạng thái mục tiêu.
- Mất lượt tuyển theo quyết định.
- Giáo Chủ nhận thông báo chung.
- Mục tiêu không nhận thông báo.

Không cho client trực tiếp mutate membership.

Không tiết lộ phe hoặc vai bí mật qua target validation.

Giới hạn tối đa năm tín đồ còn sống theo mô tả #90.

## B. CULT SACRIFICE RESOLVER

Triển khai hiến tế theo mô tả gốc và VH50/VH55.

Bắt buộc:

- Xác định tín đồ hợp lệ.
- Xác định mục tiêu sát thương hợp lệ.
- Kết nạp trước, hiến tế sau.
- Có thể hiến tế tín đồ vừa được tuyển mộ trong cùng đêm.
- Kiểm tra tài nguyên và giới hạn kỹ năng.
- Phân giải hiến tế.
- Phân giải sát thương theo luật.
- Xét bảo vệ, miễn nhiễm, cứu và death-chain đúng phạm vi.
- Không tạo đặc quyền xuyên bảo vệ nếu luật không quy định.
- Không xử lý lặp khi replay hoặc retry.

## C. CULT LIFECYCLE

Triển khai:

- Tín đồ chết.
- Giáo Chủ chết.
- Các thành viên giáo phái chết theo đúng mô tả và quy tắc phân giải hiện hành.
- Thu hồi quyền chat.
- Kiểm tra số tín đồ còn sống.
- Hồi sinh.
- Không tự khôi phục membership theo DC-CULT-REVIVAL-01.
- Cập nhật trạng thái phe và nhóm thắng theo luật tương ứng.
- Xét điều kiện thắng mới theo DC-CULT-WIN-01.

Kiểm thử điều kiện thắng sau khi toàn bộ chuỗi sự kiện đã hoàn thành.

Không suy diễn trường hợp thắng cá nhân hoặc hồi sinh chưa được xác định.

## D. LIVE GROUP CHAT

Kết nối Cult Recruitment Resolver với Shared Group Chat ACL hiện có.

Bảo toàn:

- VH57.
- VH59.
- VH78.
- Q13-08.
- Giới hạn năm tín đồ còn sống.
- Idempotency.
- Persistence.
- Replay.
- Reconnect.

Chỉ mở chat giáo phái vào ban ngày.

Không mở DM riêng.

Không để người ngoài nhóm nhận nội dung, notification hoặc metadata nhóm bí mật.

## E. FULL #84 PHÙ THỦY CÂM

Sau khi Cult Recruitment hoạt động thật, tiếp tục đóng:

- 84-03.
- 84-05.
- 84-06.
- 84-07.

Bắt buộc kiểm tra:

- Người bị câm không gửi chat công khai.
- Người bị câm vẫn gửi chat nhóm được cấp quyền.
- Tuyển mộ được thực hiện bằng kỹ năng thật.
- Người ngoài nhóm không nhận tin.
- Không tự tước quyền vote.
- Không tự tước kỹ năng.
- Khóa kỹ năng trước phân giải.
- Chết trước phân giải.
- Hồi sinh.
- Hiệu ứng câm hết hạn.
- Các nhóm chức năng khác theo FULL Contract.
- Reconnect.
- Replay.

Không sử dụng trusted fixture membership làm bằng chứng thay thế Normal Gameplay.

Nếu đủ toàn bộ nghĩa vụ, cấp FULL #84.

Nếu #90 cũng đủ toàn bộ nghĩa vụ, cấp FULL #90.

Không tự cấp FULL cho một trong hai nhân vật chỉ vì một nhánh tương tác đã PASS.

# VIII. CLUSTER 03 — #79 & #6

Tiếp tục các nghĩa vụ của Sói Hòa Bình và Đạo Diễn Tử Thần sau khi đã ưu tiên hoàn thành PRIMARY ROLE.

Q13-09 đã được Owner xác nhận trước đây.

Không yêu cầu quyết định lại.

Triển khai:

- Nhiệm vụ Kẻ Chết Thay.
- Phiếu hợp lệ cuối cùng theo VH01.
- Biểu quyết bị hủy.
- Nhiệm vụ thất bại theo Q13-09.
- Oscar được cộng đúng một lần cho từng trường hợp hợp lệ.
- Chống tính Oscar trùng.
- Nhiều kỹ năng ngày cùng chờ phân giải.
- PH-02.
- Phase Transition.
- Privacy.
- Replay.

Tích hợp toàn bộ vào Game Session thực tế.

Không chỉ viết hàm tính Oscar độc lập.

Đối với 79-03, thực hiện đúng phạm vi nhận thông tin bầy Sói đã được xác định.

Không tự kích hoạt DC-PACK-PRIVACY-BOUNDARY.

Nếu đây vẫn là blocker FULL #79, tiếp tục các ứng viên khác có đầy đủ luật.

# IX. ACCEPTANCE TEST MATRIX — BẢY QUYẾT ĐỊNH

Mỗi quyết định mới phải có traceability từ Owner Choice đến implementation và evidence.

| Decision | Positive Case | Negative Case | Boundary Case | Runtime | Privacy | Replay |
|---|---|---|---|---|---|---|
| DC-CULT-WIN-01 | | | | | | |
| DC-CULT-RIGHTS-01 | | | | | | |
| DC-CULT-FAILED-01 | | | | | | |
| DC-CULT-KILLER-DOMAIN-01 | | | | | | |
| DC-CULT-REVIVAL-01 | | | | | | |
| DC-MIRROR-MULTIVICTIM-01 | | | | | | |
| DC-INSPECTION-ORDER-01 | | | | | | |

Không điền PASS khi chưa thực thi.

Ưu tiên các bài kiểm thử có khả năng đóng nhiều nghĩa vụ FULL nhưng không bỏ sót kiểm thử riêng bắt buộc.

Không tạo hàng loạt deck gần giống nhau chỉ để tăng A hoặc B.

# X. FULL CERTIFICATE BREAKTHROUGH

Mục tiêu của phiên bản này:

- Minimum: F ≥ 2.
- Main target: F ≥ 3.
- Stretch target: F ≥ 5.

Các mục tiêu trên là yêu cầu định hướng triển khai, không phải quyền sửa định nghĩa FULL.

Tôi yêu cầu sử dụng bảy quyết định mới để đóng toàn bộ nghĩa vụ thực sự còn thiếu.

Nếu PRIMARY đạt FULL, tiếp tục SECONDARY.

Nếu SECONDARY đạt FULL, tiếp tục BACKUP.

Không giới hạn việc hoàn thiện một nhân vật mỗi phiên bản.

Không dừng sau một deck mới nếu vẫn còn khả năng đóng FULL Contract.

**KHÔNG TÍNH R, A, B, QA C HOẶC PLAYABLE C THAY THẾ CHO F.**

**KHÔNG TỰ CẤP FULL CHO CÁC NHÂN VẬT CHƯA VƯỢT TOÀN BỘ NGHĨA VỤ NGHIỆM THU.**

# XI. BROWSER ACCEPTANCE DEBT

Baseline:

- 27 PASS.
- 0 FAIL.
- 58 INCOMPLETE.
- 85 Browser Suites.

Tiếp tục ưu tiên giải quyết những suite INCOMPLETE liên quan trực tiếp đến FULL Contracts đang triển khai.

Phân biệt:

- Existing PASS revalidated.
- Existing INCOMPLETE → PASS.
- Existing FAIL → PASS.
- Newly Added PASS.
- Newly Added INCOMPLETE.
- Existing PASS bị regression.

Không xóa suite cũ.

Không giảm mẫu số để cải thiện tỷ lệ.

Không sử dụng ảnh chụp giao diện thay thế Functional Acceptance.

Không bỏ qua lỗi vì backend unit test đã PASS.

Nếu suite chưa được chạy trên fingerprint cuối, giữ trạng thái INCOMPLETE hoặc trạng thái phù hợp theo tiêu chuẩn hiện hành.

# XII. UI/UX FREEZE & REAL GAMEPLAY SCREENSHOTS

Bảo toàn toàn bộ đồ họa của v1.7.36.

Không nhập lại wolfville.zip.

Không thiết kế lại toàn bộ frontend.

Chỉ điều chỉnh UI để phục vụ kỹ năng mới và sửa những lỗi còn tồn đọng:

- Toast che tiêu đề.
- Toast che thao tác.
- Mobile chat cần cuộn nhiều.
- Role Reveal nếu có thể hoàn thiện trong phạm vi nhỏ.
- Replay timeline phục vụ gameplay mới.

Không làm mất 16 theme, portrait, artwork, animation và các sửa đổi responsive đã có.

Action UI phải lấy từ Action Capabilities và Authorized Projection thật.

Sau khi triển khai, chạy source thực tế và chụp ảnh:

1. Gameplay Sói Gương trong bầy nhiều Sói.
2. Kết quả điều tra của #25.
3. Kết quả điều tra của #74.
4. Sói Tiên Tri trước và sau chuyển đổi.
5. Sói Biến Hình sau sao chép.
6. Kẻ Biến Hình sau ngụy trang.
7. Giáo Chủ thực hiện tuyển mộ.
8. Thông báo tuyển mộ thành công.
9. Thông báo tuyển mộ thất bại.
10. Chat giáo phái từ gameplay thật.
11. Người bị câm vẫn chat nhóm hợp lệ.
12. Hiến tế nếu đã triển khai.
13. Kết thúc ván giáo phái nếu đã nghiệm thu.
14. Gameplay của FULL Role mới.
15. Replay.
16. Mobile Gameplay.

Chỉ cung cấp ảnh tương ứng với chức năng đã thực sự hoạt động.

Không sử dụng AI-generated mockup.

Không sử dụng DESIGN_PREVIEW.

Không lấy ảnh lịch sử làm bằng chứng của phiên bản mới.

Không dùng fixture để giả lập chức năng chưa có rồi tuyên bố là Normal Gameplay.

Mỗi ảnh cần có:

- Source fingerprint.
- Ruleset.
- Scenario.
- Viewport.
- Normal Gameplay/QA/fixture.
- Quyền của người xem.

Đính kèm trực tiếp những ảnh quan trọng nhất trong báo cáo cuối.

# XIII. REGRESSION & SOURCE INTEGRITY

Thực hiện tuần tự:

1. Focused Tests.
2. Build.
3. Rules Build.
4. Freeze Source Fingerprint.
5. Monolithic Backend Regression.
6. Browser Acceptance.
7. Privacy Acceptance.
8. Replay Acceptance.
9. Certificate Revalidation.
10. Delivery Verification.

Dừng các tiến trình kiểm thử chẩn đoán không còn sử dụng trước khi chạy nghiệm thu cuối.

Không chạy các tiến trình xung đột đồng thời.

Không sử dụng kết quả từ các fingerprint khác nhau làm một bộ nghiệm thu thống nhất.

Bảo toàn toàn bộ inventory 487 backend tests kế thừa, hoặc truy vết minh bạch mọi thay đổi hợp lệ mà không giảm coverage.

Mục tiêu monolithic:

- 0 FAIL.
- Exit code 0.
- Không chuyển test sang SKIPPED để che lỗi.

Bảo toàn:

- FULL #28.
- QA C.
- Playable C.
- Atomic Certificates.
- Normal Gameplay đã nghiệm thu.
- Browser PASS kế thừa.
- Historical Decisions.
- Provenance.

Nếu sourceRule bị thay đổi ngoài ý muốn, phải phát hiện, sửa và chạy lại nghiệm thu.

# XIV. PRIVACY & PRODUCTION RELEASE GATES

Kiểm tra:

- Không rò rỉ vai trò thật.
- Không rò rỉ phe bí mật.
- Không rò rỉ membership giáo phái.
- Không rò rỉ lý do tuyển mộ thất bại.
- Không rò rỉ kết quả điều tra trung gian.
- Không rò rỉ thông tin qua Action Capabilities.
- Không rò rỉ qua WebSocket, DOM, event count hoặc notification.
- Không làm suy giảm Replay ACL.

PostgreSQL Live chưa thực hiện phải giữ PENDING.

Human QA chưa được Owner thực hiện phải giữ PENDING.

Native Mac Acceptance chưa kiểm chứng phải ghi rõ.

Không tuyên bố Competitive Production Ready chỉ vì F tăng.

# XV. RELEASE SCORECARD

| Metric | v1.7.36 | v1.7.37 | Delta | Evidence |
|---|---|---|---|---|
| F | 1 | | | |
| R | 53 | | | |
| A | 50 | | | |
| B | 38 | | | |
| QA C | 2 | | | |
| Playable C | 7 | | | |
| Atomic | 79/108 | | | |
| Normal Gameplay | 13 | | | |
| Backend PASS | 476 | | | |
| Backend FAIL | 0 | | | |
| Backend SKIPPED | 11 | | | |
| Browser PASS | 27 | | | |
| Browser INCOMPLETE | 58 | | | |
| Owner Choices | 18 | | | |
| Privacy | PARTIAL | | | |
| PostgreSQL Live | PENDING | | | |
| Human QA | PENDING | | | |

Bổ sung Owner Decision Implementation Scorecard:

| Decision | Owner Approved | Source Verified | Implemented | Runtime Verified | FULL Impact |
|---|---|---|---|---|---|
| DC-CULT-WIN-01 | YES | | | | |
| DC-CULT-RIGHTS-01 | YES | | | | |
| DC-CULT-FAILED-01 | YES | | | | |
| DC-CULT-KILLER-DOMAIN-01 | YES | | | | |
| DC-CULT-REVIVAL-01 | YES | | | | |
| DC-MIRROR-MULTIVICTIM-01 | YES | | | | |
| DC-INSPECTION-ORDER-01 | YES | | | | |

Báo cáo riêng:

- PRIMARY, SECONDARY và BACKUP.
- FULL obligations trước và sau.
- Shared Dependencies thực sự đã đóng.
- Normal Gameplay mới.
- Chứng nhận mới.
- Existing INCOMPLETE được xử lý.
- File code thay đổi.
- Commands và exit codes.
- Privacy evidence.
- Replay evidence.
- Screenshot evidence.
- Những quyết định luật còn thiếu thực sự, nếu có.

Không lặp lại bảy câu hỏi Owner đã được xác nhận.

Nếu F vẫn bằng 1, phải chỉ ra đường phụ thuộc cụ thể, obligation, file/module và nguyên nhân chưa thể hoàn thành.

Không dùng câu giải thích chung chung rằng còn thiếu interaction coverage.

# XVI. FULL SOURCE DELIVERY

Bàn giao:

`Wolvesville_v1.7.37_Owner_Approved_FULL_Breakthrough_Full_Source.zip`

Bao gồm:

- Frontend.
- Backend.
- Game Engine.
- Game Session.
- Shared Resolvers.
- Character Registry.
- Effective Rule Registry.
- Official Rules.
- Owner Decision Records.
- Bảy quyết định mới được ghi nhận.
- Graphics Assets.
- Themes.
- FULL Contracts.
- FULL Certificates.
- QA và Playable C Certificates.
- Atomic Coverage.
- Backend Tests.
- Browser Tests.
- Regression Evidence.
- Privacy.
- Replay.
- Database Migrations.
- Changelog.
- README Mac Apple Silicon.
- Human QA Pack.

Bàn giao riêng:

- `OWNER_DECISION_INTEGRATION_REPORT.md`
- `FULL_CONTRACT_CLOSURE_REPORT.md`
- `CLUSTER_COMPLETION_REPORT.md`
- `Wolvesville_v1.7.37_Screenshot_Evidence.zip`
- `Wolvesville_v1.7.37_Visual_Acceptance_Report.html`
- `DELIVERY_VERIFICATION.txt`

Xác minh:

- ZIP CRC.
- SHA-256.
- Payload Integrity.
- Clean Extraction.
- TypeScript Build.
- Rules Build.
- Monolithic Backend Regression.
- Browser Acceptance.
- Certificate Revalidation.
- Metrics Verification.

Không chỉ giao patch.

Không chứa secrets, `.env` thật, node_modules, runtime database hoặc build cache.

Bảo toàn source và lịch sử dự án.

# XVII. MỆNH LỆNH CUỐI CÙNG

Ở phiên bản trước, bạn đã xác định bảy quyết định Owner là một phần nguyên nhân gây đình trệ.

**BÂY GIỜ TÔI ĐÃ PHÊ DUYỆT ĐỦ 7/7 QUYẾT ĐỊNH.**

Tôi yêu cầu bạn chuyển trực tiếp từ phê duyệt luật sang triển khai code.

Không chỉ cập nhật tài liệu.

Không chỉ bổ sung Decision Records.

Không chỉ sửa Group Chat ACL.

Không chỉ thêm một nhánh phản chiếu Sói Gương.

Không chỉ tạo thêm một deck.

Không chỉ tăng số lượng Backend Tests.

Hãy hoàn thiện Shared Mechanics cần thiết.

Tích hợp vào Game Session thật.

Đóng toàn bộ FULL Contracts.

Chứng nhận từng nhân vật.

Tiếp tục nhân vật tiếp theo.

Mục tiêu trọng tâm:

**F = 1 → 2 → 3 → 5 → 10.**

Bảo toàn toàn bộ tiêu chuẩn chất lượng.

Không hạ chuẩn FULL.

Không giả mạo kết quả.

Không tự tạo luật ngoài phạm vi đã phê duyệt.

Chạy sản phẩm thực tế.

Gửi hình ảnh thực tế.

Bàn giao Full Source đã xác minh.

**OWNER APPROVED → RULE INTEGRATION → IMPLEMENT → COMPLETE GAMEPLAY → TEST → CERTIFY → SCALE → DELIVER.**