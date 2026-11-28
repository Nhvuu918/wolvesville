# Sprint 03 — Changelog, kế thừa Codex 97

**Nền:** `Wolvesville_Sprint_03_Codex_97_Full_Source`. Mã nguồn được sao chép tích lũy, không khởi tạo dự án mới.

## Thay đổi kỹ thuật (so sánh byte với nền)

| File | Thay đổi |
|---|---|
| `backend/src/multiplayer/server.ts` | MODIFIED |
| `frontend/app.js` | MODIFIED |
| `frontend/index.html` | MODIFIED |
| `frontend/integration.js` | MODIFIED |
| `frontend/player-ux.css` | NEW |
| `frontend/player-ux.js` | NEW |
| `package.json` | MODIFIED |
| `scripts/run-browser-ux.mjs` | NEW |
| `tests/browser_demo_e2e.py` | MODIFIED |
| `tests/browser_e2e.py` | MODIFIED |
| `tests/browser_ux_e2e.py` | NEW |
| `tests/player-ux.test.mjs` | NEW |

## Nguyên tắc bảo toàn

- `data/character.json` và `frontend/character.json` không sửa dữ liệu nhân vật.
- 118 quyết định trong `data/rules/official_merged_118.json` và 207 legacy test specs được giữ nguyên.
- CSS nền và artwork Dark Fantasy không sửa. Bách khoa giữ Wheel/Grid và `codex.css` nguyên trạng.
- Đúng 2 entrypoint UI cũ `index.html`, `app.js` tiếp tục được phép chỉnh kỹ thuật, có bản gốc ở `reference/approved_frontend_original`.
- Không sửa migrations 002, 004, 005, 006. Không thay đổi các Rule Adapters #25/#74 hoặc điều kiện thắng.

## Những cải tiến được áp dụng

1. Bản đồ sảnh lấy phòng server, bỏ pins lấy từ `DEFAULT_ROOMS`; vẫn giữ nguyên artwork và các vị trí công trình.
2. Nhãn Bách khoa gọn, loại tiếng Anh trong breadcrumb/topbar, giữ bộ đếm 97 động.
3. Ẩn History/Leaderboard/Overview giả khỏi điều hướng chính; lối vào lịch sử hiển thị tình trạng chưa khả dụng, không bịa ván thắng.
4. Settings chỉ hiện các tùy chọn có tác dụng trên thiết bị, không đưa xuất/nhập JSON prototype như dữ liệu backend.
5. Tạo `player-ux.js` chứa ánh xạ mã lỗi/trạng thái sang microcopy; Backend tiếp tục gửi mã lỗi cấu trúc, frontend không hiển thị raw code.
6. Biểu diễn đúng `ACCEPTED` khác `RESOLVED`; không hiển thị `skillId`, `actionId`, `eventRevision` hay Character ID ở phần kết quả.
7. WebSocket cảnh báo mất kết nối, tự đồng bộ phòng/game/feedback sau reconnect, từ chối event revision cũ và đóng quyền xem game khi server rút quyền.
8. Room list thăm dò bổ sung khi đang xem sảnh, có chống response out-of-order; không làm gián đoạn form tạo phòng.
9. Giới hạn bắt đầu bộ **thử nghiệm** khi đúng 2 thành viên; phòng thông thường vẫn nhận cấu hình sức chứa 1–100.
10. API same-origin, timeout 15 giây và không tự retry các thao tác ghi gây trùng.
11. Static backend thêm đúng `player-ux.js/css` vào allowlist, không mở quyền truy cập file tùy ý.
12. Sửa browser harness để nạp asset mới qua cầu nối trong sandbox; script browser test disposable tự tạo DB riêng và đóng tài nguyên sau chạy.
