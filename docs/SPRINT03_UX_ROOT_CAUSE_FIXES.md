# Root Cause & Regression Fixes — Sprint 03 Player First

| ID | Phát hiện (root cause) | Mức ảnh hưởng | Bản sửa | Phạm vi test |
|---|---|---|---|---|
| UX-01 | `rooms()` lấy `state.rooms` từ prototype thay vì danh sách phòng Live | HIGH | Map pins và count lấy `WolvesLive.rooms` | Browser UX |
| UX-02 | Title/nav chứa `Codex`, `World Map Lobby`, `Title Screen` | LOW | Microcopy tiếng Việt, không sửa Wheel/Grid | Browser Codex/UX |
| UX-03 | History/Ranking/Overview vẫn có UI với dữ liệu local chưa xác thực | HIGH | Ẩn nav, chặn route, mô tả unavailable | Unit UX |
| UX-04 | Feedback công bố `skillId`, `#Character ID`, revision/event code | MEDIUM | Projection UI hiển thị nội dung được phép + trạng thái giản lược | Browser gameplay, unit |
| UX-05 | API lỗi kỹ thuật phát thẳng ra player UI | MEDIUM | Error dictionary map theo code, fail-safe với code lạ | Unit UX |
| UX-06 | Sau WS reconnect chưa đồng bộ toàn bộ room/game/feedback | HIGH | Auth OK → resubscribe + resync, kiểm tra revision | Browser UX/game |
| UX-07 | Static allowlist backend không chứa JS/CSS UX mới | HIGH | Thêm đúng 2 file, không mở public source arbitrary | Unit HTTP |
| UX-08 | Settings hiển thị “Xuất/Nhập JSON” như backup tài khoản, nhưng chỉ là local state | MEDIUM | Loại UI nhập/xuất prototype, giữ cài đặt thực | Browser UX |
| UX-09 | Room controls không báo điều kiện ván test 2 người; UUID trong danh sách | MEDIUM | Disabled start nếu sai số người, tên thành viên và trạng thái dễ hiểu | Browser UX |
| UX-10 | Browser fixture bridge chưa nạp `player-ux.js/css`; locator trùng text “Tạo phòng” | TEST | Nạp asset mới, selector submit chính xác | Browser 4 suites |
| UX-11 | Browser runner không tự thoát do health `fetch` chưa consume body / cleanup subprocess | TEST | Consume response, cleanup server/temporary DB và streams | Runner exit 0 |
| UX-12 | Tập response phòng có thể trở lại sai thứ tự | MEDIUM | request serial ID + so sánh revision room | Unit UX, Browser UX |

## Các lỗi cũ không tái xuất hiện trong phạm vi regression

- Demo auth `WV_ENABLE_DEMO_AUTH` và `NODE_ENV=production` giữ nguyên.
- `DATABASE_URL` không hardcode, không reset volume hoặc migration.
- Không dùng biến `URL` thay constructor URL.
- ACCEPTED không đồng nghĩa RESOLVED, checkpoint event log không hardcode.
- Typewriter đã được thay bằng `textContent` nguyên văn.
- Không thay giao dịch rollback, Kernel/Resolver, role assignment hoặc quyền xem kết quả.

## Kiểm chứng giới hạn

PostgreSQL thực tế chưa thể chạy trong workspace này: không có `DATABASE_URL` và không có server ở 5432/5433. 5 test được ghi `SKIPPED`, không tính PASS. Trạng thái release tổng thể **PARTIAL**.
