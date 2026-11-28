# Wolvesville — Human QA v1.7.25

- Build: `1.7.25-s15-privacy-stability-wip`
- Source fingerprint: `2aaa5dfa1e0067c6bb82beff4c06c18375ed6dd37380b1b5f30c99ec8ff9cec5`
- Official Rules: `wolvesville-official-v1.3.3`; v1.3.4 vẫn CANDIDATE.
- Human QA: **PENDING**. Không tính PASS thay chủ dự án. Mixed Wolf mới chỉ nghiệm thu privacy trực tiếp trước phân giải trong phạm vi QA, chưa đạt release privacy toàn phần.

## 1. Mac Apple Silicon — cài đặt và chạy qua giao diện

1. Cài Node.js ARM64 phiên bản 22.13 trở lên. Mở Terminal trong thư mục Full Source đã giải nén.
2. Chạy:

```sh
npm install
npm run verify:source
npm run build
npm run rules:build
mkdir -p local
```

3. Khởi chạy server QA local bằng database riêng:

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/privacy-stability-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```

4. Mở `http://127.0.0.1:3212` (hoặc URL local mà Terminal in). Dùng các browser profile độc lập, đăng ký từng tài khoản khác nhau. Chủ phòng tạo phòng đúng số người, người khác tham gia, khóa phòng rồi chọn deck thử nghiệm và bắt đầu lượt chơi thử. Server tự phân vai; đọc vai riêng trong từng tab, không sửa database hoặc gọi API thủ công.
5. Muốn chơi Normal Gameplay: dừng server, dùng database mới và đặt cả ba cờ QA về `0`. Không mở QA ra mạng công cộng/production. Build đã kiểm thử Linux + Chromium, chưa nghiệm thu native trên Mac.

## 2. QA-MIXED-01 — Privacy và đồng thuận sau chuyển phe (6 tài khoản)

- Deck: `[48,74,77,84,93,94]`, “QA B/B — Bầy Sói sau chuyển phe”.
- Đêm 1: #93 chưa có bảng chọn mục tiêu của bầy. #48 thấy mọi ghế sống công khai trừ bản thân, không có ghế bị loại do phe bí mật. Thử chọn #93; UI chỉ xác nhận đã nhận yêu cầu, không xác nhận mục tiêu hợp lệ. Reconnect #48, kiểm tra biên nhận vẫn tồn tại. Chủ phòng kết thúc đêm; với yêu cầu không hợp lệ duy nhất đó, không có đòn cắn trong miền QA hiện tại.
- Ngày 1: mở biểu quyết, #74 bỏ phiếu treo #94; đóng biểu quyết. #93 đủ điều kiện gia nhập bầy.
- Đêm 2: #93 chọn #74 và #84, gửi phiếu trống (KEEP). Chủ phòng thử chốt khi #48 chưa phản hồi: tiếp tục chờ. Reconnect #93 và kiểm tra hai mục tiêu **đã gửi** vẫn hiển thị. #48 chọn hai mục tiêu tương tự theo thứ tự ngược lại; chốt đêm.
- Kỳ vọng: #74/#84 chết, #48/#93 cùng thắng; không thêm đòn cắn, không lộ thứ tự RNG, không có mã lỗi phe bí mật. Biên nhận không đồng nghĩa lựa chọn hợp lệ. Nếu yêu cầu mới vi phạm điều kiện bí mật thì server giữ lựa chọn hợp lệ trước đó; không công bố trạng thái hợp lệ này trước phân giải. Đây là giới hạn UX cần chủ dự án đánh giá. Không đặt bẫy #77 trong kịch bản thắng này.
- Evidence: ảnh danh sách trước chuyển phe, biên nhận/reconnect, trạng thái chờ, kết quả. Đây **không phải** bằng chứng toàn bộ privacy an toàn: outcome inference, #94 redirect và thay đổi quyền trong lượt vẫn chưa hoàn thiện.

## 3. QA-REV-01 — Thầy Đồng hồi sinh (3 tài khoản)

- Deck: `[8,25,26]`, “Kỵ Sĩ · Tiên Tri · Thầy Đồng”.
- Đêm 1: #8 tấn công #25, kết thúc đêm và chuyển sang đêm tiếp theo.
- Đêm 2: đợi giao diện hết xử lý, #26 chọn #25 đã chết, gửi hồi sinh. #8 tấn công #26. Kết thúc đêm.
- Kỳ vọng: #25 sống lại, #26 chết, sự kiện công khai chỉ cho biết #25 hồi sinh. Đêm tiếp theo #25 có thể soi #8; #8 tấn công #25 và thắng. Không có lượt hồi sinh thứ hai, không lộ `REVIVAL_SCHEDULED` nội bộ. Kiểm tra reconnect.
- Evidence: ảnh chọn mục tiêu, kết quả hồi sinh, kỹ năng đêm sau và kết quả trận. Đây là hồi sinh #26 theo luật 1.3.3, chưa phải tổ hợp bẫy + hồi sinh.

## 4. QA-REL-04 — Bẫy xuyên hai cửa sổ (4 tài khoản)

- Deck: `[8,10,25,29]`, “QA B/B — Bẫy và hai bình Phù Thủy”.
- Đêm 1: #10 đặt bẫy #29; #8 không tấn công. Kết thúc đêm, đóng cửa sổ bình trống, chuyển đêm.
- Đêm 2: #8 tấn công #25; chốt tới cửa sổ Phù Thủy. #29 dùng bình cứu #25. Chủ phòng nhấn “Chốt bình cứu, mở lượt độc”. Bẫy còn tồn tại; chưa công bố người chết. Reconnect #29, dùng bình độc lên #10, chốt đêm.
- Kỳ vọng: #25 chết đúng một lần, #10 sống, hai bình đã tiêu hao và một bẫy bị tiêu hao. Không lộ tử vong nội bộ trước bình minh.
- Evidence: ảnh hai cửa sổ, trạng thái bẫy, reconnect, kết quả cuối.

## 5. Gửi phản hồi

`QA-ID | build fingerprint | PASS / FAIL / KHÁC KỲ VỌNG / CHƯA RÕ / CẦN CẢI THIỆN UX | phase và bước | kỳ vọng | kết quả thực tế | ảnh/log minh chứng`

Nếu gặp lỗi, dừng ở bước lỗi và giữ evidence. Không chỉnh code/database để vượt bước. Hồ sơ `BB_PRIVACY_STABILITY_HUMAN_QA_FEEDBACK.json` vẫn PENDING cho đến khi có phản hồi thực tế.
