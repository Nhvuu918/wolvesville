# Unresolved Rules Register — không hỏi luật vô hạn

Tài liệu này gom các nhánh còn cần source/implementation thay vì hỏi lại toàn bộ 97 nhân vật. Giữ nguyên 22 phát hiện kiểm toán kế thừa và bổ sung #20 SHOOT không nằm trong deck.

## Những nhánh quan trọng nhất đối với triển khai tiếp theo

| Nhánh | Bằng chứng | Trạng thái hiện tại | Biện pháp |
|---|---|---|---|
| #20 bị bắn | `JSON#20`, `T-COV-20` | Luật mô tả có, **chưa có bộ bắn/phản ứng damage** | Không thêm #32 vào test deck |
| #10 bẫy không có giá trị giả hợp lệ | Q13-06/Q13-11 | Chưa chốt kết quả khi candidate pool rỗng | `RULE_UNRESOLVED`, không RNG ngoài deck |
| #29 cứu người mang hạt #97 | Q13-12 | Hạt còn hay tiêu sau khi cứu chưa xác minh | Chặn nhánh consume/refund |
| Kẻ Vu Khống khi hủy biểu quyết | Q13-09 | Không suy rộng Oscar của vai Kẻ Chết Thay | Không chạy nhánh chưa xác minh |
| #51 chat người chết | `JSON#51`, VH57/VH77/VH79 | Bất nhất phạm vi kênh chat | Fail-closed quyền DM |
| #25 legacy test soi hào quang | `T-MC-04`, `T-MC-33`, `T-COV-03` vs `JSON#25` | Xung đột **test với nguồn**, không sửa JSON | Quarantine expected/premise |
| Victory chung và co-win | VH03/VH58, các vai phe 3 | Chưa có Resolver đủ căn cứ | Competitive khóa |

## Danh sách phát hiện kế thừa cần truy xuất

| Mã | Loại | Phạm vi |
| --- | --- | --- |
| ROLE20_SHOOT_TRIGGER_NOT_EXECUTABLE | MISSING_IMPLEMENTATION | Gunshot injury trigger, collision with incoming damage and shooting action; none active in allowed deck |
| GLOBAL_VICTORY_PREDICATES | BLOCKED_BY_RULE_OR_IMPLEMENTATION | All packs including winner evaluation; special win groups |
| F01 | BLOCKED_BY_RULE | #51 Người Lái Đò có chat ẩn danh người chết trong JSON, nhưng VH57 và tài liệu chỉ ghi ngoại lệ VH77/#26, VH79/#24. |
| F02 | BLOCKED_BY_RULE | #10 bẫy role giả cần chọn khác role thật trong bộ vai khóa; khi only 1 unique role, domain trống. |
| F03 | BLOCKED_BY_RULE | Phù Thủy cứu người có hạt #97 trước phát tác: hạt chưa có chính sách giữ/tiêu hao cho lần chết đã cứu. |
| F04 | BLOCKED_BY_RULE | Kẻ Vu Khống nhận nhiệm vụ vote đầu tiên nhưng Sói Hòa Bình hủy vote; Q13-09 chỉ quy định Kẻ Chết Thay. |
| F05 | BLOCKED_BY_RULE | Sói Kỹ Sư đảo ngược tác dụng bảo vệ/phù độc/soi; chưa có phép phủ định hợp lệ cho mọi loại kỹ năng và kỹ năng đa tác dụng. |
| F06 | BLOCKED_BY_RULE | Nhiều liên kết thắng/chết xếp chồng khác loại (Cupid, ngoại tình, xúi giục, giáo phái), có quan hệ ưu tiên mới/cũ nhưng bảng full predicate từng loại chưa đủ. |
| F07 | BLOCKED_BY_RULE | Danh sách điều kiện thắng riêng cho các phe Ba nhiều nhân vật chưa được chuẩn hóa thành predicate có trigger và trạng thái. |
| F13 | CONFLICTING | Test v1.3 mô tả Tiên Tri #25 chỉ soi hào quang, nhưng character.json và lịch sử xác nhận riêng Wolvesville 21/11 ghi xem vai trò. |
| F14 | BLOCKED_BY_RULE | Câm VH57 chặn chat công khai; JSON #93 mô tả cấm chat toàn bộ, chưa rõ là hiệu ứng câm hay khóa toàn kênh đặc thù. |
| F15 | BLOCKED_BY_RULE | Sự kiện phản sát, chết thay, cứu, chờ hồi sinh, khóa và role chuyển trong cùng chuỗi có thể tạo hiệu ứng không giao hoán nếu chưa phân giải đủ priority cạnh cụ thể. |
| F19 | BLOCKED_BY_RULE | Cho phép phòng chỉ một người + bot, đồng thời 97 vai duy nhất: bộ vai phải tương thích số slot, mục tiêu hợp lệ và điều kiện kết thúc. |
| F20 | BLOCKED_BY_RULE | Quy tắc phản đòn no-loop trong v1.3 được ghi là xác nhận nhưng không tìm được mã VH/Q13 cụ thể ở sổ 118. |
| F21 | BLOCKED_BY_SOURCE | 4 test kế thừa dùng alias QA NVxx, trong khi tài liệu Wolvesville Q/A nhắc workbook Ma_Soi không được xác minh là nguồn Wolvesville độc lập. |
| F22 | BLOCKED_BY_SOURCE | 19 test v1.3 dẫn mã SYS-xx nhưng chưa xác định ánh xạ 1:1 sang 118 quyết định đã chốt; có nguy cơ đồng bộ sai expected. |


Không yêu cầu người dùng trả lời loạt câu hỏi mới. Chỉ khi một nhánh thực sự cần kích hoạt mới trình những lựa chọn hữu hạn, trích căn cứ và phạm vi tác động rõ ràng.
