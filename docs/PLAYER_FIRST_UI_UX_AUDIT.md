# Player-first UI/UX audit — Wolvesville Sprint 03

**Nguồn kiểm chứng:** source và browser E2E của bản Sprint03 UX; không tự mở hoặc tạo kỹ năng mới.

| Màn hình / Thành phần | Hành động chính | Nguồn thật / trạng thái | Vấn đề trước đó | Xử lý | Test |
|---|---|---|---|---|---|
| Màn hình chào | Vào làng/đăng nhập | Thiết kế thật | Tên tiếng Anh trong topbar | Chuyển thành Màn hình chào | Browser UX |
| Đăng nhập | Nhập tài khoản | Backend Authentication | Raw lỗi `Invalid credentials` có thể lộ | Mã lỗi → tiếng Việt | UI unit, Browser auth |
| Đăng ký | Tạo tài khoản | Backend Authentication | Microcopy “Backend yêu cầu” | Hướng dẫn độ dài mật khẩu tự nhiên | Browser auth |
| Tài khoản mẫu | Trải nghiệm không cần đăng ký | Backend Demo Auth, dev-only | Lỗi cấu hình đã hotfix | Kế thừa, loading & chống bấm trùng | Browser Demo |
| Hồ sơ | Xem/sửa tên, Public Player ID | Backend profile | Thông báo thành công/lỗi khó nhận biết | Thêm phản hồi trong trang | UI unit |
| Lobby/World Map | Tìm phòng hoặc tạo phòng | Server `/api/rooms` | Bản đồ dùng DEFAULT_ROOMS prototype | Pins và bộ đếm đọc phòng thật | Browser UX |
| Danh sách phòng | Xem trạng thái/khả năng vào | Server `/api/rooms` | Trạng thái `WAITING`, mã UUID | Nhãn dễ hiểu, vô hiệu nút không thể vào | Browser UX |
| Tạo phòng | Nhập tên và số người 1–100 | Server validation | Nhiều lần submit, thiếu loading | Chặn trùng, kiểm tra nhập hợp lệ | Browser UX, 02A regression |
| Tham gia/rời phòng | Vào/rời phòng hợp lệ | Server membership | Thông báo lỗi kỹ thuật | Ánh xạ mã lỗi/phân quyền | Browser Demo/UX |
| Phòng chờ | Xem chủ phòng/thành viên, khóa/mở | Server RoomService | Hiển thị UUID và Character ID nội bộ | Tên hiển thị, chủ phòng, trạng thái thuần Việt | Browser UX |
| Bắt đầu trận thử | Bắt đầu ván thử được hỗ trợ | Server GameCoordinator | CTA không rõ điều kiện | Chỉ bật khi đúng 2 người (test pack) | Browser game/UX |
| Phòng chơi | Chọn mục tiêu/gửi soi | Game Engine Kernel | Revision, skillId và text kỹ thuật | Phase, target, CTA rõ ràng; thông tin do server cấp | Browser game |
| Kết quả kỹ năng | Chờ nhận phản hồi được phép | Authorized Projection | Hiện `PENDING_RESOLUTION`, `Event #`, ID vai | Diễn đạt hành động chờ/đã xử lý; không lộ nội bộ | Browser game, UX unit |
| Reconnect | Trở lại trận/phòng | Backend WebSocket + HTTP snapshots | Mất kết nối không có trạng thái rõ | Banner offline và tái đồng bộ khi kết nối lại | Browser UX/game |
| Bách khoa | Xem 97 nhân vật | `character.json` chính thức | Nhãn “Codex” trong menu/title | Chỉ đổi tên nhãn, không sửa Wheel/Grid/layout | Browser Codex |
| Lịch sử trận độc lập | Xem ván đã đấu | **Chưa hỗ trợ** | Giao diện cũ có thắng/thua giả | Ẩn khỏi nav, chỉ nêu tình trạng sắp có | UX unit |
| Bảng xếp hạng | Xem bảng điểm thật | **Chưa hỗ trợ** | Bảng điểm prototype chỉnh bằng click | Ẩn khỏi nav, không lấy dữ liệu local làm điểm thật | UX unit |
| Sảnh tổng quan prototype | Tổng hợp tiến độ | **Chưa hỗ trợ** | Chứa danh sách giả, tiêu đề kỹ thuật | Ẩn khỏi nav chính | UX unit |
| Cài đặt | Điều chỉnh âm thanh, theme, hạt nền | **Cục bộ trên thiết bị** | Xuất/nhập JSON prototype như dữ liệu tài khoản | Giữ cài đặt thật, ẩn reset/import/export giả | Browser UX |
| Trợ lý Cô Bé Quàng Khăn Đỏ | Hỏi thông tin nhân vật | Tra cứu cục bộ, không phải chat phòng | Có thể bị hiểu là chat multiplayer | Giữ nhãn giải thích không phải chat phòng | Source audit |
| Chat/bỏ phiếu trong trận | Nhắn tin/bỏ phiếu | **Chưa hỗ trợ chính thức** | Có layout demo trên sân khấu | Hiển thị lời giải thích, không gửi chat giả | Browser game |

## Những trạng thái cần phân biệt

- **REAL**: API / server / Game Engine thật đang vận hành trong phạm vi có luật.
- **LOCAL**: tùy chọn hiển thị lưu trên thiết bị, không phải dữ liệu tài khoản.
- **PRESENTATION ONLY**: Codex giới thiệu 97 nhân vật, không đồng nghĩa 97 Rule Adapter.
- **NOT SUPPORTED**: lịch sử độc lập, xếp hạng, chat/vote competitive, Victory Resolver đầy đủ.

## Responsive / accessibility

Đã chạy browser tại chiều rộng 1920, 1440, 1366, 768 và 390 px, không phát sinh tràn ngang đối với trang sảnh được kiểm tra. Bách khoa đã có test 4/3/2 cột; `prefers-reduced-motion` được bảo toàn. Đây không phải chứng nhận accessibility đầy đủ cho mọi màn hình.
