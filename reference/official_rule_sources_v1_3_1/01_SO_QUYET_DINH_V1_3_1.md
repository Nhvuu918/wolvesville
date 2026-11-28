# WOLVESVILLE — SỔ QUYẾT ĐỊNH CHÍNH THỨC v1.3.1

Ngày ghi nhận: 24/11/2026 · Nguồn: 12 câu trả lời trực tiếp của người dùng.

**Chỉ ghi lớp luật mới; không thay sửa 85 VH, 21 quyết định v1.2 hoặc 97 mô tả gốc.** Quy tắc chưa xác định không tự chuyển thành luật.

## Thứ tự nguồn

1. Xác nhận trực tiếp mới nhất trong phạm vi nội dung đã hỏi.
2. Các quyết định chính thức VH01–VH85 và 21 quyết định v1.2 không bị ghi đè.
3. `character.json` là dữ liệu nhân vật nguyên gốc.
4. Suy luận kỹ thuật là lớp riêng không có hiệu lực thay luật.

| Mã | Đáp án | Quy tắc hiệu lực (chuẩn hóa, không thay lời người dùng) | Đối chiếu |
| --- | --- | --- | --- |
| Q13-01 | A | Mỗi hành động phát sinh do x2 cần đủ charge riêng; buff không sinh charge. Chỉ nhân đôi những kỹ năng thực sự sử dụng đêm đó; kỹ năng không dùng hoặc hết charge không nhận lợi ích. VH05 Phù Thủy là ngoại lệ một bình cứu cho tối đa hai lượt trong đêm. | VH05, VH85, SK-01, SK-02, P04 |
| Q13-02 | B | Ở lần AFK cần random, tập mục tiêu là mọi người đang sống và hợp lệ cho kỹ năng, không phân biệt phe. Tập rỗng thì hành động bắt buộc không phát sinh và không cộng lần AFK đó. | PH-04, PH-03, SK-07 |
| Q13-03 | A | Khi nhiều liên kết cũ hợp lệ có thể phục hồi, trước tiên áp dụng ưu tiên loại liên kết đã chốt; trong tập ứng viên cùng mức còn lại, phục hồi liên kết gần nhất trong lịch sử. Không thay thế nguyên tắc tạo mới VH04. | REL-01, REL-03, VH04 |
| Q13-04 | A | Cấm trùng Character ID trong danh sách phân vai ban đầu. Sau khi bắt đầu, biến đổi hợp lệ có thể tạo currentRoleId trùng mà không phải hủy biến đổi; sao chép kỹ năng theo VH71 không đồng nghĩa đổi phe. | ROOM-02, VH71, VH32 |
| Q13-05 | A | Người ở trạng thái HIBERNATING do hạt Thần Thảo vẫn được tính vào quân số phe lúc đang ngủ đông; tạm ngưng chat, phiếu bầu và mọi kỹ năng đến khi tỉnh/hồi sinh theo điều kiện hợp lệ. Không phát sinh chết thật từ riêng trạng thái giả chết. | LIFE-02, VH06, VH63 |
| Q13-06 | B | Bẫy Sói Kỹ Sư đối với kỹ năng soi vai chính xác chọn ngẫu nhiên một roleId khác roleId thật từ bộ vai đã khóa trước trận; không chọn từ toàn bộ 97 vai. RNG trên server, lưu snapshot tập hợp và lần rút. | SK-05, VH08, JSON#10, JSON#74 |
| Q13-07 | B | Khi có hiệu ứng kéo dài sự sống hợp lệ và hạt Thần Thảo, áp dụng trạng thái sống kéo dài trước; tại mốc kết thúc trạng thái kéo dài mới xét điều kiện kích hoạt hạt ngủ đông, sau khi xử lý những cứu hợp lệ khác theo thứ tự tương ứng. | VH26, VH67, LIFE-02, Q13-05, JSON#51, JSON#95, JSON#97 |
| Q13-08 | A | Giáo Chủ không thể kết nạp một người đã thuộc nhóm/liên kết thắng độc lập; yêu cầu kết nạp không thành công, không đổi nhóm thắng, không cấp quyền chat giáo phái mới. Đây là ngoại lệ cụ thể so với cơ chế ghi đè quan hệ chưa có ưu tiên. | REL-01, VH50, VH59, VH78, JSON#62, JSON#90 |
| Q13-09 | B | Sói Hòa Bình chặn và hủy vote hợp lệ trong ngày mà Kẻ Chết Thay đã có nhiệm vụ: nhiệm vụ thất bại, Đạo Diễn Tử Thần nhận 1 Oscar theo mỗi trường hợp diễn sai hợp lệ. Không tự áp sang vai diễn khác nếu không được quy định. | VH01, PH-02, JSON#6, JSON#79 |
| Q13-10 | A | Khi Sói Điên Cuồng #75 kích hoạt đòn trúng mục tiêu có bảo vệ hợp lệ, những người cấp/tạo lớp bảo vệ đều thuộc tập người bảo vệ có thể bị chết theo, bao gồm chủ chó hoặc người cấp trang bị; phân giải đúng cơ chế tấn công/bảo vệ và tránh chuyển chết trùng. | VH42, VH27, VH51, SK-06, JSON#52, JSON#67, JSON#77 |
| Q13-11 | A | Bẫy Sói Kỹ Sư lên chức năng soi PHÂN LOẠI tạo ngẫu nhiên một kết quả cùng kiểu dữ liệu nhưng khác giá trị thật trong danh sách các giá trị phân loại hợp lệ; không tự thay bằng tên vai hay hào quang. Kết quả soi miễn nhiễu theo VH84 là ngoại lệ. | SK-05, VH84, P05, JSON#10, JSON#81 |
| Q13-12 | B | Nếu người mang hạt Thần Thảo thuộc danh sách chết sơ bộ ban đêm, tên vẫn hiện trong prompt Phù Thủy và có thể được cứu hợp lệ trước khi kích hoạt hạt. Nếu chết được ngăn thì không kích hoạt giả chết do hạt tại sự kiện chết đó. Nếu không được cứu, tiếp tục xét kéo dài sống và hạt theo Q13-07. | LIFE-02, Q13-07, VH05, VH63, PH-01, JSON#29, JSON#97 |

## Lựa chọn và ghi chú nguyên văn

### Q13-01 — A

**Đáp án người dùng:** Mỗi lượt phải đủ tài nguyên riêng; giữ ngoại lệ VH05.

**Ghi chú nguyên văn:** khi được x2 kỹ năng, nếu đêm đó ssử dụng kỹ năng gì mới được x2 toàn bộ kỹ năng đó, nếu không còn kỹ năng hoặc không sử dụng trong đêm đó thì x2 vô tác dụng

**Phạm vi áp dụng:** Mỗi hành động phát sinh do x2 cần đủ charge riêng; buff không sinh charge. Chỉ nhân đôi những kỹ năng thực sự sử dụng đêm đó; kỹ năng không dùng hoặc hết charge không nhận lợi ích. VH05 Phù Thủy là ngoại lệ một bình cứu cho tối đa hai lượt trong đêm.

**Nguồn đối chiếu:** VH05, VH85, SK-01, SK-02, P04.

### Q13-02 — B

**Đáp án người dùng:** Random mọi người sống hợp lệ theo kỹ năng, không phân phe; không có ứng viên thì bỏ hành động.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Ở lần AFK cần random, tập mục tiêu là mọi người đang sống và hợp lệ cho kỹ năng, không phân biệt phe. Tập rỗng thì hành động bắt buộc không phát sinh và không cộng lần AFK đó.

**Nguồn đối chiếu:** PH-04, PH-03, SK-07.

### Q13-03 — A

**Đáp án người dùng:** Khôi phục liên kết hợp lệ gần nhất, sau khi xét ưu tiên đã chốt.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Khi nhiều liên kết cũ hợp lệ có thể phục hồi, trước tiên áp dụng ưu tiên loại liên kết đã chốt; trong tập ứng viên cùng mức còn lại, phục hồi liên kết gần nhất trong lịch sử. Không thay thế nguyên tắc tạo mới VH04.

**Nguồn đối chiếu:** REL-01, REL-03, VH04.

### Q13-04 — A

**Đáp án người dùng:** Chỉ unique lúc phân vai gốc; biến đổi hợp lệ có thể làm vai hiện tại trùng.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Cấm trùng Character ID trong danh sách phân vai ban đầu. Sau khi bắt đầu, biến đổi hợp lệ có thể tạo currentRoleId trùng mà không phải hủy biến đổi; sao chép kỹ năng theo VH71 không đồng nghĩa đổi phe.

**Nguồn đối chiếu:** ROOM-02, VH71, VH32.

### Q13-05 — A

**Đáp án người dùng:** Vẫn tính quân số, tạm ngưng chat/vote/kỹ năng đến khi hồi sinh.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Người ở trạng thái HIBERNATING do hạt Thần Thảo vẫn được tính vào quân số phe lúc đang ngủ đông; tạm ngưng chat, phiếu bầu và mọi kỹ năng đến khi tỉnh/hồi sinh theo điều kiện hợp lệ. Không phát sinh chết thật từ riêng trạng thái giả chết.

**Nguồn đối chiếu:** LIFE-02, VH06, VH63.

### Q13-06 — B

**Đáp án người dùng:** Random từ bộ vai đã khóa của trận, trừ vai thật.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Bẫy Sói Kỹ Sư đối với kỹ năng soi vai chính xác chọn ngẫu nhiên một roleId khác roleId thật từ bộ vai đã khóa trước trận; không chọn từ toàn bộ 97 vai. RNG trên server, lưu snapshot tập hợp và lần rút.

**Nguồn đối chiếu:** SK-05, VH08, JSON#10, JSON#74.

### Q13-07 — B

**Đáp án người dùng:** Ưu tiên kéo dài sống; khi hết hạn mới xét hạt ngủ đông.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Khi có hiệu ứng kéo dài sự sống hợp lệ và hạt Thần Thảo, áp dụng trạng thái sống kéo dài trước; tại mốc kết thúc trạng thái kéo dài mới xét điều kiện kích hoạt hạt ngủ đông, sau khi xử lý những cứu hợp lệ khác theo thứ tự tương ứng.

**Nguồn đối chiếu:** VH26, VH67, LIFE-02, Q13-05, JSON#51, JSON#95, JSON#97.

### Q13-08 — A

**Đáp án người dùng:** Kết nạp thất bại nếu đang thuộc liên kết thắng độc lập.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Giáo Chủ không thể kết nạp một người đã thuộc nhóm/liên kết thắng độc lập; yêu cầu kết nạp không thành công, không đổi nhóm thắng, không cấp quyền chat giáo phái mới. Đây là ngoại lệ cụ thể so với cơ chế ghi đè quan hệ chưa có ưu tiên.

**Nguồn đối chiếu:** REL-01, VH50, VH59, VH78, JSON#62, JSON#90.

### Q13-09 — B

**Đáp án người dùng:** Vẫn tính diễn sai và trao Oscar.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Sói Hòa Bình chặn và hủy vote hợp lệ trong ngày mà Kẻ Chết Thay đã có nhiệm vụ: nhiệm vụ thất bại, Đạo Diễn Tử Thần nhận 1 Oscar theo mỗi trường hợp diễn sai hợp lệ. Không tự áp sang vai diễn khác nếu không được quy định.

**Nguồn đối chiếu:** VH01, PH-02, JSON#6, JSON#79.

### Q13-10 — A

**Đáp án người dùng:** Tính mọi người cấp/tạo bảo vệ là người bảo vệ bị giết theo.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Khi Sói Điên Cuồng #75 kích hoạt đòn trúng mục tiêu có bảo vệ hợp lệ, những người cấp/tạo lớp bảo vệ đều thuộc tập người bảo vệ có thể bị chết theo, bao gồm chủ chó hoặc người cấp trang bị; phân giải đúng cơ chế tấn công/bảo vệ và tránh chuyển chết trùng.

**Nguồn đối chiếu:** VH42, VH27, VH51, SK-06, JSON#52, JSON#67, JSON#77.

### Q13-11 — A

**Đáp án người dùng:** Random một kết quả khác kết quả thật trong tập giá trị hợp lệ.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Bẫy Sói Kỹ Sư lên chức năng soi PHÂN LOẠI tạo ngẫu nhiên một kết quả cùng kiểu dữ liệu nhưng khác giá trị thật trong danh sách các giá trị phân loại hợp lệ; không tự thay bằng tên vai hay hào quang. Kết quả soi miễn nhiễu theo VH84 là ngoại lệ.

**Nguồn đối chiếu:** SK-05, VH84, P05, JSON#10, JSON#81.

### Q13-12 — B

**Đáp án người dùng:** Vẫn xuất hiện; Phù Thủy có thể cứu trước khi hạt phát tác.

**Ghi chú nguyên văn:** Không có

**Phạm vi áp dụng:** Nếu người mang hạt Thần Thảo thuộc danh sách chết sơ bộ ban đêm, tên vẫn hiện trong prompt Phù Thủy và có thể được cứu hợp lệ trước khi kích hoạt hạt. Nếu chết được ngăn thì không kích hoạt giả chết do hạt tại sự kiện chết đó. Nếu không được cứu, tiếp tục xét kéo dài sống và hạt theo Q13-07.

**Nguồn đối chiếu:** LIFE-02, Q13-07, VH05, VH63, PH-01, JSON#29, JSON#97.

## Tính bất biến / tính chất có thể kiểm thử

- 85 quy tắc VH và 21 quyết định v1.2 không bị chỉnh sửa; lớp v1.3.1 có thể tra mã và phiên bản.
- Với cùng trạng thái, cùng lệnh hợp lệ, cùng kết quả RNG đã ghi, cùng ruleset pinned, kết quả phân giải phải xác định.
- Không dùng team hay aura thay roleId và publicPlayerId.
- Mọi thông tin riêng, các hiệu ứng hạt/điều tra và nhóm chat cần server ACL; không lộ kết quả RNG chưa được phép công bố.

