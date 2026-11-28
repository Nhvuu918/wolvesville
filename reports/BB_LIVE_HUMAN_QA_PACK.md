# Human QA — Wolvesville v1.7.19-s15-live-integration-wip
Trạng thái: chờ phản hồi chủ dự án. Chỉ chạy QA local; không phải luật chính thức 1.3.4. Mỗi nhiệm vụ có browser obligation PASS trong BB_LIVE_BROWSER_RESULTS.json. Không yêu cầu sửa code, database hoặc gọi API.

## Cài đặt Mac Apple Silicon
Node 22.13+ (khuyến nghị 22 LTS). Giải nén, mở Terminal tại thư mục gốc. Chạy `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`.

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/bb-live-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```
Mở URL Terminal thông báo. Sử dụng browser profile riêng biệt (không dùng nhiều tab chia sẻ đăng nhập); đăng ký tài khoản local, tạo phòng, tham gia đủ số người, chủ phòng khóa phòng, chọn bộ QA theo tên, bắt đầu lượt thử. Vai do server phân; xem vai trên màn hình từng người. Chủ phòng dùng nút phân giải đêm / Chốt ngày (chế độ QA). Không bật flag trong production. Dùng database khác cho game thường, flag mặc định tắt. Archive B/B QA không mở được khi tắt flag.

## QA-BB-01 — HIGH — Đồng thuận bầy Sói
5 tài khoản; chọn “QA B/B — Hai Sói và Thiên Sứ Tuyết”. Hai Sói #48 và #76. Chỉ mở hành động đồng thuận và khiên; không có kỹ năng riêng khác và biểu quyết ban ngày trong fixture này.
1. Thiên Sứ Tuyết bảo vệ Tiên Tri. Một Sói chọn Tiên Tri, gửi. Chủ phòng thử kết thúc đêm: vẫn NIGHT_COLLECT, không ai chết; Sói đủ quyền thấy trạng thái chờ, Dân không thấy lựa chọn.
2. Sói thứ hai chọn cùng Tiên Tri; có thể gửi phiếu trống từ Sói đầu (KEEP). Chủ phòng phân giải: Tiên Tri sống nhờ khiên. Không cho hai mục tiêu khi hai Sói còn sống.
3. Chốt ngày QA; hai Sói chọn cùng một Dân không được bảo vệ. Có thể ngắt kết nối/reconnect trước khi gửi. Phân giải: hai Sói và hai Dân còn sống, phe Sói thắng theo parity. Kiểm tra màn hình thắng.
Evidence: ảnh trạng thái chờ, người được bảo vệ, màn hình chiến thắng; video reconnect nếu có. Impact: live pack QA, privacy, protection, victory. Không cộng metric chính thức.

## QA-BB-02 — HIGH — Bẫy nhiều đêm
4 tài khoản; “QA B/B — Bẫy nhiều đêm”. Đêm 1 Sói Kỹ Sư đặt bẫy #25, #25 không dùng kỹ năng. Phân giải, chốt ngày. Sói Kỹ Sư thấy một dấu bẫy đang chờ; người khác không thấy. Đêm 2, #25 soi #10; hào quang bị đảo thành Thiện, vai thật không đổi. Sau phân giải, dấu bẫy đã tiêu hao. Sang đêm 3, #25 soi #10: hào quang Ác bình thường. Reconnect giữa các đêm để kiểm tra bảo toàn trạng thái. #74 và #5 có thể soi độc lập; không công khai kết quả riêng.
Evidence: ảnh số bẫy và kết quả soi đêm 2, 3. Impact: persistence, đúng phạm vi hào quang, tiêu hao bẫy.

## QA-BB-03 — HIGH — Bẫy và Bảo Vệ (phạm vi giới hạn)
5 tài khoản; “QA B/B — Bẫy và Bảo Vệ”. Đêm 1 Sói Kỹ Sư đặt bẫy #31, phân giải và chốt ngày. Đêm 2 #31 chọn #25; phân giải. Expected: #25 tử vong trực tiếp, bẫy tiêu hao, không thêm lớp bảo vệ, ghi lịch sử/cooldown. Người khác không nhận sự kiện riêng về nguồn bẫy. Reconnect. Fixture phân giai đoạn: chỉ đặt bẫy đêm 1, Bảo Vệ từ đêm 2. **Hồi sinh/cứu người BLOCKED** — chưa có trong live QA, không thử ngoài phạm vi. #10 chưa FULL.
Evidence: mục tiêu, màn hình tử vong, dấu bẫy còn lại, trạng thái sau reconnect. Impact: direct death, resource/history, authorized UI.

Phản hồi: `QA-ID | version | PASS/FAIL/KHÁC KỲ VỌNG/CHƯA RÕ/UX | bước | kỳ vọng vs thực tế | ảnh/log`. Nếu lỗi, dừng ở phase liên quan, không chỉnh database. Human QA chưa hoàn thành và không thay thế automation.
