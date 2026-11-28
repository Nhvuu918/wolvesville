# Vòng quay định mệnh — hướng dẫn chơi thử
Baseline IMMERSIVE-03. Không thay luật hoặc deck. Wheel of Fate là tiện ích cá nhân, khác vòng trình diễn phân vai và tra cứu nhân vật.

## Chạy trên Mac
Giải nén toàn bộ source, mở Terminal trong thư mục chứa package.json. Chạy `npm install`, `npm run build`, `npm run verify:source`, sau đó:

```bash
WV_LIFE_MODULES_DEV_NORMAL=1 WV_PUBLIC_ORDINARY_VOTE=1 npm run dev:demo
```

Mở http://127.0.0.1:3212. Nếu cổng bận, thêm `PORT=3213` trước lệnh. Không bật QA. Dùng bốn tài khoản độc lập trong các profile trình duyệt khác nhau, tạo phòng bốn người, chọn đội hình Normal phát triển [8,25,31,64], ready, phân vai theo quy trình server. Trong HUD nhấn **Vòng quay định mệnh**. Khi vào ván mặc định ba người khác. Chọn bỏ/chọn lại, thử mục văn bản, chọn tốc độ, quay, xem kim cố định. Kết quả là gợi ý. Chế độ Mục tiêu hợp lệ chỉ bật khi server có danh sách hợp lệ; có thể chọn kết quả trong pha biểu quyết và tự nhấn Gửi/đổi phiếu. Khi không thể sử dụng kết quả, nút bị vô hiệu hóa. Không thêm deck chỉ để kiểm thử.

## Kiểm thử tay còn cần thực hiện
- Refresh trực tiếp/reconnect trên máy thật; giữ bộ lọc danh sách được lưu, không nhầm danh sách giữa hai tài khoản cùng trình duyệt hoặc hai ván khác nhau. Logout/expire dọn dữ liệu wheel thuộc tài khoản.
- Thử skill một/hai mục tiêu khi capability chứa danh sách, chọn bổ sung mục tiêu thứ hai mà không xóa mục tiêu đầu. Khi không đủ thông tin về đích hợp lệ, không tự suy diễn.
- Thử đổi pha/kết thúc/mất kết nối trong lúc quay. Không tự gửi action, không gia hạn pha, không chiếm dụng Endgame.
- Nghe SFX thật, điều chỉnh âm lượng game, mute riêng; thử đóng cửa sổ ngay khi quay. Thử keyboard/ESC, contrast, Reduced Motion, màn MacBook và tablet.
- Các ván 8/16/100 người chưa được nghiệm thu thực tế; engine baseline có các deck Normal từ 2 đến 5 vai. Không coi toán học đủ sector là gameplay đủ số người. Với danh sách lớn, hiển thị số ghế thay vì nhồi tên; danh sách bên cạnh giữ tên đầy đủ. Có thể thêm tối đa 32 lựa chọn văn bản để kiểm tra bố cục.

## Reproduce focused evidence
```bash
npm run build
node --test tests/fate-wheel.test.mjs tests/fate-wheel-assets.test.mjs
```
Browser script `tests/browser_fate_wheel_e2e.py`: yêu cầu Chromium, Python Playwright, requests, websocket-client, Pillow; chạy backend SQLite thử nghiệm riêng, bật DEV Normal + public vote, đặt `WV_E2E_SERVER`, `WV_SCREENSHOT_DIR`, `WV_FATE_CAPTURE_DIR`. `WV_E2E_DIRECT=1` cho phép browser native trên máy không bị chặn điều hướng. Không dùng database cá nhân.

## Deployment
Không cần migration mới, không cần AI key. Hai asset mới được phục vụ same-origin bởi backend, avatar dùng GET `/api/social/media?slot=avatar&id=...` qua ACL hiện có. Không gửi lựa chọn vòng quay, kết quả, lịch sử hoặc lượt quay lên server. Cơ chế GitHub/Railway baseline không thay đổi. PostgreSQL/Docker/Cloud Live chưa nghiệm thu. Không mở Demo/QA ra Internet.
