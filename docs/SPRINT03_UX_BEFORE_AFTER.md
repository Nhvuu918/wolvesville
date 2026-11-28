# Sprint 03 — UI/UX Before / After (không redesign)

| Khu vực | Prototype approved trước Sprint03 | Sau tích hợp Sprint03 |
|---|---|---|
| World map / Lobby | Dark fantasy layout, animation, ảnh gốc | **Giữ nguyên hình thức**; panel sảnh hiển thị phòng thực từ API |
| Login | Demo accounts tại local frontend | Form gốc gọi server auth, profile thật, logout session |
| Codex | 100 roles embedded, ID sai nguồn chính thức | Bố cục giữ nguyên; runtime nạp 97 role JSON canonical và sửa nhãn 100→97 |
| Room | Danh sách giả / thao tác local | Tạo/tham gia/khóa phòng từ server; hiển thị members realtime |
| Game stage | Role/phase do client tự chọn; fake results | Role assigned bởi Engine; test-only #25/#74; host-only resolve; phase từ server |
| Skill action | Nhấn nút local có thể hiện kết quả trước | SUBMITTED → ACCEPTED/PENDING → RESOLVED theo backend, panel read-only có thể đọc lâu |
| Chat/vote/ranking | Prototype có điều khiển chưa nối API | **Disabled / nhãn chưa triển khai**, không giả lập cuộc trò chuyện/chiến thắng |
| Role secrecy | Role list legacy / stage có khả năng hiển thị role khác | Người khác chỉ xem publicId/displayName và avatar neutral, secret own role qua server |
| Refresh/reconnect | Local state ảnh hưởng trạng thái | Server snapshot + own feedback khôi phục, dedup tránh thông báo trùng |
| Dialogue | Typewriter từng ký tự | Toàn bộ nội dung trong `.textContent` một lần; animation khung/đồ họa giữ nguyên |

### Giới hạn UI hiện hành

- Không xây lại Village Map, Lobby, Codex, Room, Stage. `integration.css` chỉ thêm hộp phản hồi phù hợp palette cũ.
- HTML `app.js` gốc chứa các mô tả cũ nhắc tới typewriter, chỉ là **chuỗi tài liệu trong prototype**, hành vi chạy chữ đã được loại bỏ. Tên class `.dialogue-typewriter` là hook CSS cũ, **không có animation ký tự**.
- Trang đăng nhập, role catalog và stage đã được kiểm tra trong Chromium context; do giới hạn loopback sandbox, tài nguyên ảnh không được fetch trực tiếp qua browser ở đây. Tại Mac cần mở website thật và kiểm tra đủ asset/animation trong 2 trình duyệt.
- UI đã phát hiện và sửa lỗi ảnh role #74 khi source cũ có ID không trùng. Trạng thái player đã chọn, room/game phải đến từ server.
