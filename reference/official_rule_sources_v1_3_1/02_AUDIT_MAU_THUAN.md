# BÁO CÁO ĐỐI CHIẾU MÂU THUẪN — v1.3.1

**Phân loại:** RESOLVED = đã có quyết định; RESOLVED_SCOPED = áp đúng phạm vi; BOUNDARY_NOT_CONTRADICTION = chưa đủ luật ở trường hợp biên, không phải phủ định quyết định mới.

| Mã | Trạng thái | Ưu tiên | Vấn đề | Căn cứ mới |
| --- | --- | --- | --- | --- |
| AUD-01 | RESOLVED | P0 | AFK target eligibility | Q13-02 |
| AUD-02 | RESOLVED_WITH_EXCEPTION | P0 | x2 resources | Q13-01 |
| AUD-03 | RESOLVED_SCOPED | P0 | Link restoration vs same-level creation | Q13-03 |
| AUD-04 | RESOLVED | P0 | Role uniqueness after transform | Q13-04 |
| AUD-05 | RESOLVED | P0 | HIBERNATING team count and actions | Q13-05 |
| AUD-06 | RESOLVED | P0 | False role RNG domain | Q13-06 |
| AUD-07 | RESOLVED_SCOPED | P0 | Delayed life and hibernation | Q13-07 |
| AUD-08 | RESOLVED_SPECIFIC_EXCEPTION | P0 | Cult enrolment vs link overwrite | Q13-08 |
| AUD-09 | RESOLVED | P0 | Canceled vote and Oscar | Q13-09 |
| AUD-10 | RESOLVED_WITH_ATTRIBUTION | P0 | Sói Điên Cuồng protector causality | Q13-10 |
| AUD-11 | RESOLVED_TYPED | P0 | Role-class inspection trap | Q13-11 |
| AUD-12 | RESOLVED_PHASE_ORDER | P0 | Witch before seed hibernation | Q13-12 |
| AUD-13 | BOUNDARY_NOT_CONTRADICTION | P1 | Trận chỉ có một role giả hợp lệ | NO_NEW_DECISION |
| AUD-14 | BOUNDARY_NOT_CONTRADICTION | P1 | Hạt khi chết được cứu | NO_NEW_DECISION |
| AUD-15 | BOUNDARY_NOT_CONTRADICTION | P1 | Kẻ Vu Khống khi vote bị hủy | NO_NEW_DECISION |
| AUD-16 | BOUNDARY_NOT_CONTRADICTION | P1 | Phạm vi hành động trong ngủ đông | NO_NEW_DECISION |
| AUD-17 | BOUNDARY_NOT_CONTRADICTION | P1 | Nhóm thắng độc lập có nhiều loại | NO_NEW_DECISION |
| AUD-18 | DERIVED | P1 | Source bảo vệ đã chết | NO_NEW_DECISION |

### AUD-01 — AFK target eligibility

- **Nguồn cũ:** PH-04
- **Nguồn mới:** Q13-02
- **Kết luận kiểm toán:** Trong phát biểu cũ “toàn bộ người còn sống” chưa lọc cấm mục tiêu; mới bắt buộc sống + hợp lệ, không phân phe. Tập rỗng = không có hành động bắt buộc, không tính AFK.
- **Cách triển khai / giới hạn:** Không giữ bộ random toàn bộ người sống bất kể target rules.

### AUD-02 — x2 resources

- **Nguồn cũ:** SK-02;VH05;VH85
- **Nguồn mới:** Q13-01
- **Kết luận kiểm toán:** Buff tăng số lượt tối đa cho kỹ năng thật sự sử dụng, không tăng kho tài nguyên. Dùng 2 lượt cần 2 charge trừ ngoại lệ Phù Thủy cứu VH05.
- **Cách triển khai / giới hạn:** X2 tự hết hiệu lực khi không dùng/hết charge.

### AUD-03 — Link restoration vs same-level creation

- **Nguồn cũ:** REL-01;REL-03;VH04
- **Nguồn mới:** Q13-03
- **Kết luận kiểm toán:** Ưu tiên loại link trước; trong candidates khôi phục thì recent-first. VH04 first-created vẫn áp cho liên kết mới tạo cùng cấp.
- **Cách triển khai / giới hạn:** Phân biệt restore arbitration với create arbitration.

### AUD-04 — Role uniqueness after transform

- **Nguồn cũ:** ROOM-02;VH71
- **Nguồn mới:** Q13-04
- **Kết luận kiểm toán:** Uniqueness chỉ là bất biến phân vai gốc; currentRoleId được phép trùng do chuyển đổi hợp lệ.
- **Cách triển khai / giới hạn:** Không tự coi copy-skill là đổi team.

### AUD-05 — HIBERNATING team count and actions

- **Nguồn cũ:** LIFE-02;VH06;VH63
- **Nguồn mới:** Q13-05
- **Kết luận kiểm toán:** Vẫn cộng quân số; ngừng chat/vote/skill; không phát death-link chỉ vì public death message.
- **Cách triển khai / giới hạn:** Sự kiện hibernating là state riêng.

### AUD-06 — False role RNG domain

- **Nguồn cũ:** SK-05
- **Nguồn mới:** Q13-06
- **Kết luận kiểm toán:** Dùng locked roleset, exclude true role; server RNG; projection chỉ kết quả giả.
- **Cách triển khai / giới hạn:** Không dùng toàn 97 vai khi trận chỉ có một phần.

### AUD-07 — Delayed life and hibernation

- **Nguồn cũ:** VH26;VH67;LIFE-02
- **Nguồn mới:** Q13-07
- **Kết luận kiểm toán:** Hiệu ứng prolong hợp lệ trước; khi hết hạn mới xét hạt ngủ đông.
- **Cách triển khai / giới hạn:** Không suy rộng sang mọi hiệu ứng cứu không được mô tả.

### AUD-08 — Cult enrolment vs link overwrite

- **Nguồn cũ:** REL-01;VH59
- **Nguồn mới:** Q13-08
- **Kết luận kiểm toán:** Người đã trong winGroup độc lập không được kết nạp; ngoại lệ cụ thể thắng luật generic link mới ghi đè.
- **Cách triển khai / giới hạn:** Phân biệt nhóm chat và nhóm thắng.

### AUD-09 — Canceled vote and Oscar

- **Nguồn cũ:** VH01;PH-02
- **Nguồn mới:** Q13-09
- **Kết luận kiểm toán:** Kẻ Chết Thay tính thất bại khi vote bị hủy; Oscar vẫn ghi; không nhầm thất bại với phiếu cuối không tồn tại.
- **Cách triển khai / giới hạn:** Chỉ áp dụng Kẻ Chết Thay theo câu hỏi.

### AUD-10 — Sói Điên Cuồng protector causality

- **Nguồn cũ:** VH42;VH27;SK-06
- **Nguồn mới:** Q13-10
- **Kết luận kiểm toán:** Những nguồn tạo/cấp bảo vệ được xem là protector dù là chó/vật phẩm; phản sát trap là nhánh riêng.
- **Cách triển khai / giới hạn:** Lưu source participant cho các lớp bảo vệ.

### AUD-11 — Role-class inspection trap

- **Nguồn cũ:** SK-05;VH84;P05
- **Nguồn mới:** Q13-11
- **Kết luận kiểm toán:** Random khác giá trị thật trong đúng domain class; các phép miễn nhiễu không bị bẫy.
- **Cách triển khai / giới hạn:** Không ép category → roleId hay aura.

### AUD-12 — Witch before seed hibernation

- **Nguồn cũ:** LIFE-02;VH05;VH63
- **Nguồn mới:** Q13-12
- **Kết luận kiểm toán:** Phù Thủy có thể xem/cứu một chết sơ bộ khi hạt chưa phát tác; sau cứu không có death trigger tương ứng.
- **Cách triển khai / giới hạn:** Không dùng kết quả public chết để quyết định prompt cứu.

### AUD-13 — Trận chỉ có một role giả hợp lệ

- **Nguồn cũ:** Q13-06;Q13-11
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Nếu pool loại true rỗng, RNG không thể trả giá trị khác một cách hợp lệ; hệ thống phải báo yêu cầu luật chưa xác định thay vì random sai.
- **Cách triển khai / giới hạn:** Gắn RULE_UNRESOLVED tại trường hợp hiếm.

### AUD-14 — Hạt khi chết được cứu

- **Nguồn cũ:** Q13-12;JSON#97
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Chết được cứu thì không kích hoạt hạt vì death trigger chưa xảy ra; việc hạt tồn tại qua các đêm/có tiêu hao vì được cứu vẫn chưa được mô tả dứt khoát.
- **Cách triển khai / giới hạn:** Không tự trừ hạt chỉ vì Phù Thủy đã cứu.

### AUD-15 — Kẻ Vu Khống khi vote bị hủy

- **Nguồn cũ:** Q13-09;JSON#6
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Q13-09 chỉ chốt Kẻ Chết Thay. Kẻ Vu Khống có điều kiện bỏ phiếu đầu tiên khác; phải đánh giá từ mô tả vai, chưa tự tổng quát Oscar khi vote bị hủy.
- **Cách triển khai / giới hạn:** Để role pack riêng nếu làm khác kết quả.

### AUD-16 — Phạm vi hành động trong ngủ đông

- **Nguồn cũ:** Q13-05;Q13-12
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Chat/vote/skill bị khóa; việc miễn/không miễn khỏi tấn công và danh sách target của các kỹ năng khác vẫn theo guard từng kỹ năng.
- **Cách triển khai / giới hạn:** Không mặc định sleep là invulnerable.

### AUD-17 — Nhóm thắng độc lập có nhiều loại

- **Nguồn cũ:** Q13-08;REL-01
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Có thể xác định từ winGroup đã áp dụng; nếu role chưa định nghĩa win group thì phải giữ unresolved riêng, không coi mọi phe3 như cùng nhóm.
- **Cách triển khai / giới hạn:** Sử dụng winGroup thực, không dùng team=phe3.

### AUD-18 — Source bảo vệ đã chết

- **Nguồn cũ:** Q13-10;PH-01
- **Nguồn mới:** NO_NEW_DECISION
- **Kết luận kiểm toán:** Nguồn tạo khiên vẫn có thể có hiệu ứng còn hiệu lực nếu luật cho; không làm chuyển tử vong hai lần khi nguồn đã chết.
- **Cách triển khai / giới hạn:** Giữ danh sách nguồn và trạng thái đối tượng.

## Các lưu ý chưa chuyển thành câu hỏi mới

1. **Pool RNG rỗng** (Q13-06/Q13-11): với một vai hoặc một nhãn duy nhất không thể sinh giá trị *khác* trong domain; fail-safe `RULE_UNRESOLVED` khi role pack thực sự xuất hiện tình huống, không bốc trái luật.
2. **Hạt sau khi được cứu** (Q13-12): việc “chưa kích hoạt” là suy luận theo điều kiện death; thời hạn/tiêu hao của hạt sau một lần dự kiến chết được cứu chưa đủ nguồn để khóa toàn cục.
3. **Kẻ Vu Khống khi vote bị hủy**: Q13-09 chốt cho Kẻ Chết Thay, không mặc định hiệu lực y hệt Kẻ Vu Khống.
4. **Người bảo vệ đã chết**: quy tắc chết theo #75 không được tạo thêm một lần chết cho cùng người; cần giữ nguyên nhân và nguồn bảo vệ.

Các điểm này không làm mất hiệu lực 12 câu đã chốt, nhưng role pack liên quan vẫn phải được kiểm thử.
