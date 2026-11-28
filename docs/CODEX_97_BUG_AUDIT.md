# Kiểm toán BUG-01…07 — Codex 97 Sprint 03

| Mã | Nguyên nhân đã xác minh trong source | Thay đổi | Bằng chứng |
|---|---|---|---|
| BUG-01 | `app.js` hardcode `52 / 97` trong nav và breadcrumb; `totalInScope` dùng 100 | Bộ đếm tập trung từ mảng validated `ROLES.length` và kết quả lọc thực tế | `codex-97.test.mjs`, browser Codex |
| BUG-02 | `app.js` nhúng mảng 100 vai, runtime của `integration.js` ghi đè sau khi tải; mặc định `deckScope='52'` nên chỉ xem 52 | Bỏ mảng 100, chỉ load 97 từ `/character.json`, kiểm tra đủ 97 unique ID; mặc định tất cả, Wheel/Grid cùng nguồn | Data validation, HTTP 200, browser 97 thẻ |
| BUG-03 | Tên `WV_DEMO_AUTH_ENABLED` không phải biến mà server đọc | Không tạo alias gây lệch: giữ một biến `WV_ENABLE_DEMO_AUTH` trong startup, `.env.example` và docs; các test Demo Auth vẫn PASS | Browser Demo regression, kiểm tra `.env` |
| BUG-04 | `server.start()` nhận `EADDRINUSE` khiến Node in stack lỗi khó hiểu | `serve-03.mjs` bắt lỗi, nêu PORT và lệnh `lsof`; không tự đóng process | Negative port conflict test: exit code 1 và thông báo tiếng Việt |
| BUG-05 | Thiếu `DATABASE_URL` hoặc dùng password placeholder | Giữ `requireDatabaseUrl` trước migration, `.env.example` minh bạch và hướng dẫn PostgreSQL; không tự động reset | Negative PostgreSQL required test: exit 1, 0 SKIPPED |
| BUG-06 | Rủi ro lịch sử: URL shadowing, event count sai thời điểm, cleanup, privacy | Không ghi đè các module đã sửa; chạy lại **87** test kế thừa và hai browser regression | 82 PASS / 5 SKIPPED kế thừa; browser gameplay/DEMO PASS |
| BUG-07 | Codex đưa ID, raw JSON, ví dụ tự tạo và suy đoán số lượt/nhóm skill vào detail | Hiển thị tên, phe, aura và nguyên văn `desc` không thêm kết luận; xóa các nút role-demo cục bộ trong Codex; dùng CSS ẩn số ID ở chân artwork | Browser screenshots, Codex detail assertions |

## Ranh giới nghiệp vụ

Codex chỉ là catalog **hiển thị**. Không lấy số lượng vai Codex làm readiness Rule Adapter; chỉ #25 và #74 được sử dụng trong official-rule test pack. Không thay `character.json`, rule overlay hay resolver. Những mô tả gốc vẫn ở nguồn; không diễn giải thành luật mới.

## Khi source lỗi

`validateOfficialCharacters` bắt thiếu record, trùng ID, ID ngoài phạm vi, thiếu tên/mô tả và phe không thuộc dữ liệu nguồn. Codex hiển thị lỗi tải và cho thử lại; không hiển thị bộ đếm 97 giả. Ảnh lỗi được thay bằng SVG trung tính, không tạo nhân vật mới.
