# UNRESOLVED_RULES — Wolvesville v1.3.1

**Không tạo thêm một vòng hỏi đáp vô hạn**. Chỉ các nhánh thật sự thiếu luật mới chặn; giữ tất cả trường hợp khác có thể lập trình ở mức framework / module.

| ID | Ưu tiên | Trạng thái | Vấn đề / căn cứ | Phạm vi phong tỏa |
|---|---|---|---|---|
| `F01` | P0 | `BLOCKED_BY_RULE` | #51 Người Lái Đò có chat ẩn danh người chết trong JSON, nhưng VH57 và tài liệu chỉ ghi ngoại lệ VH77/#26, VH79/#24. **[character.json#51; VH57/VH77/VH79]** | GAME_CHAT |
| `F02` | P1 | `BLOCKED_BY_RULE` | #10 bẫy role giả cần chọn khác role thật trong bộ vai khóa; khi only 1 unique role, domain trống. **[SK-05;Q13-06]** | INVESTIGATION |
| `F03` | P0 | `BLOCKED_BY_RULE` | Phù Thủy cứu người có hạt #97 trước phát tác: hạt chưa có chính sách giữ/tiêu hao cho lần chết đã cứu. **[Q13-12;Q13-07;VH63]** | REVIVAL |
| `F04` | P1 | `BLOCKED_BY_RULE` | Kẻ Vu Khống nhận nhiệm vụ vote đầu tiên nhưng Sói Hòa Bình hủy vote; Q13-09 chỉ quy định Kẻ Chết Thay. **[Q13-09;PH-02;character.json#6]** | VOTING |
| `F05` | P0 | `BLOCKED_BY_RULE` | Sói Kỹ Sư đảo ngược tác dụng bảo vệ/phù độc/soi; chưa có phép phủ định hợp lệ cho mọi loại kỹ năng và kỹ năng đa tác dụng. **[character.json#10;Q13-11;P05]** | SKILL_INVERSION |
| `F06` | P0 | `BLOCKED_BY_RULE` | Nhiều liên kết thắng/chết xếp chồng khác loại (Cupid, ngoại tình, xúi giục, giáo phái), có quan hệ ưu tiên mới/cũ nhưng bảng full predicate từng loại chưa đủ. **[REL-01/02/03;VH04;Q13-03;Q13-08]** | LINKS |
| `F07` | P0 | `BLOCKED_BY_RULE` | Danh sách điều kiện thắng riêng cho các phe Ba nhiều nhân vật chưa được chuẩn hóa thành predicate có trigger và trạng thái. **[VH03;VH58;WIN-01;character.json]** | VICTORY |
| `F08` | P1 | `RESOLVED_SCOPED` | Cấm trùng role ban đầu vs trùng currentRole do biến đổi. **[ROOM-02;Q13-04]** | ROLE_STATE |
| `F09` | P1 | `RESOLVED_SCOPED` | JSON #17 nói +1 nhưng Q13-01 và VH85 quyết định x2. **[character.json#17;VH85;Q13-01]** | RESOURCE |
| `F10` | P1 | `RESOLVED_SCOPED` | JSON #49 ghi hai lần trong đêm, VH25 ghi hai lần cả ván. **[character.json#49;VH25]** | RESOURCE |
| `F11` | P1 | `RESOLVED_SCOPED` | JSON #76 chọn ngày, VH41 quyết định chọn ban đêm và khóa cùng đêm. **[character.json#76;VH41]** | TIMING |
| `F12` | P1 | `RESOLVED_SCOPED` | JSON #26 hồi sinh dân chết đêm nhưng VH73 mở rộng mọi phe, VH76 ba ngoại lệ. **[character.json#26;VH73;VH76]** | REVIVAL |
| `F13` | P0 | `CONFLICTING` | Test v1.3 mô tả Tiên Tri #25 chỉ soi hào quang, nhưng character.json và lịch sử xác nhận riêng Wolvesville 21/11 ghi xem vai trò. **[character.json#25; T-MC-04;T-MC-33;T-COV-03;T-COV-35]** | INVESTIGATION |
| `F14` | P1 | `BLOCKED_BY_RULE` | Câm VH57 chặn chat công khai; JSON #93 mô tả cấm chat toàn bộ, chưa rõ là hiệu ứng câm hay khóa toàn kênh đặc thù. **[character.json#93;VH57]** | VISIBILITY |
| `F15` | P0 | `BLOCKED_BY_RULE` | Sự kiện phản sát, chết thay, cứu, chờ hồi sinh, khóa và role chuyển trong cùng chuỗi có thể tạo hiệu ứng không giao hoán nếu chưa phân giải đủ priority cạnh cụ thể. **[VH08;PH-01;VH03;Q13-07]** | ORDERING |
| `F16` | P1 | `SOURCE_METADATA_INCONSISTENCY` | ID 12/13 mang team=phe3 nhưng teamName=Không rõ. **[character.json#12,#13]** | METADATA |
| `F17` | P1 | `DERIVED_SCOPE` | SMU “100%” được ghi ở phân loại nhóm, không được ép thành xác suất sát thương 100% (#92 Huyết Cảm có RNG 25%). **[SMU58;character.json#92]** | RNG |
| `F18` | P1 | `TECHNICAL_GATE` | 207 test chỉ là text spec; nhiều test còn expected conditional/unresolved, chưa có fixture RNG, event snapshot, expected exact state chuẩn. **[test_specs_155;test_delta_52]** | TEST |
| `F19` | P0 | `BLOCKED_BY_RULE` | Cho phép phòng chỉ một người + bot, đồng thời 97 vai duy nhất: bộ vai phải tương thích số slot, mục tiêu hợp lệ và điều kiện kết thúc. **[ROOM-01;ROOM-02;Q13-04]** | ROOM |
| `F20` | P1 | `BLOCKED_BY_RULE` | Quy tắc phản đòn no-loop trong v1.3 được ghi là xác nhận nhưng không tìm được mã VH/Q13 cụ thể ở sổ 118. **[spec v1.3 §G.5; historical reference incomplete]** | COUNTERATTACK |
| `F21` | P0 | `BLOCKED_BY_SOURCE` | 4 test kế thừa dùng alias QA NVxx, trong khi tài liệu Wolvesville Q/A nhắc workbook Ma_Soi không được xác minh là nguồn Wolvesville độc lập. **[T-COV-03/T-COV-08/T-COV-16/T-COV-20; Wolvesville Q/A nguồn trộn]** | TEST_PROVENANCE |
| `F22` | P1 | `BLOCKED_BY_SOURCE` | 19 test v1.3 dẫn mã SYS-xx nhưng chưa xác định ánh xạ 1:1 sang 118 quyết định đã chốt; có nguy cơ đồng bộ sai expected. **[tests_v1_3.json: sources SYS-xx]** | TEST_PROVENANCE |

## Ba tình huống biên v1.3.1 — kết luận kiểm toán

### 1. Bẫy Sói Kỹ Sư khi không có vai giả hợp lệ — F02

- Đã chốt: Q13-06 trả ID khác role thật **trong locked deck**. Nếu locked deck chỉ chứa vai thật thì `candidateSet = []`.
- **Suy luận kỹ thuật đủ căn cứ:** không thể random một giá trị từ tập rỗng; không được quay lại vai thật vì trái Q13-06. Ghi `RULE_UNRESOLVED` đúng branch hoặc không cho kích hoạt kỹ năng trong cấu hình bất khả thi.
- **Chưa chốt nghiệp vụ:** hiển thị “không có kết quả” hay ngăn combo role từ lúc tạo trận. Không cần chặn toàn Game Engine, chỉ gate tổ hợp này.

### 2. Phù Thủy cứu người mang hạt Thần Thảo — F03

- Q13-12 xác nhận người mang hạt có trong danh sách chết sơ bộ; Phù Thủy được cứu trước hạt. Nếu cứu thành công thì không chuyển ngủ đông từ tử vong này.
- **Chưa đủ căn cứ** để quyết định hạt chưa kích hoạt sẽ còn gắn hay bị tiêu. Không thể mô phỏng đêm sau với độ chính xác nghiệp vụ nếu tự chọn.
- Gate: nhánh ghi `seedConsumptionPolicy: UNRESOLVED` và không chốt snapshot cuối nếu kết quả giữ/tiêu khác nhau.

### 3. Kẻ Vu Khống bị Sói Hòa Bình hủy vote — F04

- PH-02 hủy vote và lệnh chờ, Q13-09 xác nhận **Kẻ Chết Thay** thất bại/Oscar. Kẻ Vu Khống có điều kiện phải là người đầu tiên bỏ phiếu hợp lệ.
- **Không được suy rộng** Kẻ Chết Thay sang Kẻ Vu Khống; lưu `RULE_UNRESOLVED` ở việc cộng Oscar cho vai diễn này.
- Các match không có giao thoa `#6 / #79 / nhiệm vụ Kẻ Vu Khống` không bị chặn.

## Quy tắc an toàn kỹ thuật không cần hỏi người dùng

- Không thể cấp `roleId` ngoài deck bị khóa (Q13-06); domain rỗng không được fallback sang 97 vai.
- Không phân vai initialRoleId trùng (ROOM-02), nhưng Q13-04 không cấm currentRole trùng sau biến đổi.
- Retry/idempotency, ACL projection, deterministic RNG, causal event ledger là quyết định kiến trúc, không phải luật thắng.
- Chỉ giữ những câu chưa xác định ở cấp branch; không dùng một cờ global `all_97_blocked` làm ngừng nghiên cứu kiến trúc.

## Cổng quyết định nghiệp vụ thật sự còn cần chủ dự án

Không khuyến nghị mở biểu mẫu mới ở bước readiness này. Ba điểm có tác động thực tế nhất là **F03 (hạt sau cứu), F04 (Kẻ Vu Khống vote bị hủy), F01 (#51 quyền chat người chết)**. F02 có thể tạm chặn cấu hình/rút thăm bất khả thi để chuẩn bị MVP. Các nhánh khác chỉ tiếp tục mở khi fixtures chứng minh hai kết quả khác nhau trong một ván hợp lệ.