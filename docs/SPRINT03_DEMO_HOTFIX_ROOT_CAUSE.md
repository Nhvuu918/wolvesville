# Wolvesville Sprint 03 — Root Cause Analysis / Demo Authentication Hotfix

## Phạm vi nguồn đối chiếu
- Sprint 03 full-stack source kế thừa 01,02A,02B,02C (không viết lại).
- `frontend/index.html`, `frontend/app.js`, `frontend/integration.js`.
- `backend/src/multiplayer/auth.ts`, `server.ts`, stores SQLite và PostgreSQL.
- Migration 002,004,005 nguyên vẹn; 006 là bổ sung.

## RCA — không phải lỗi sai mật khẩu đơn thuần
1. Prototype cũ nhúng `moonwalker/demo123`, id #9001 vào `localStorage`; đây không phải bản ghi do AuthService Sprint 02A tạo trên server.
2. AuthService Sprint 02A xác thực account có `password_hash` ở SQLite/PostgreSQL; không tự seed account Moonwalker.
3. Sprint 03 ẩn `.demo-account-box` khi `restore()` và gán `window.useDemoAccount=()=>showAuth('login')`, khiến nút không gọi Auth API nào.
4. Khi người dùng tự nhập thông tin mẫu vào form, `POST /api/auth/login` tìm account chưa tồn tại và trả `INVALID_CREDENTIALS`.
5. Điều này là xung đột **ngữ nghĩa UI Demo và nguồn danh tính backend**, không thể khắc phục bằng đổi chuỗi thông báo hay lưu tài khoản chung.

## Thay đổi kỹ thuật đã thực hiện
- `POST /api/auth/demo` cấp identity/token riêng, không password public, tồn tại trên backend.
- Mark Demo bằng bảng `demo_account_meta`/`wv_demo_account_meta` (006 additive migration), không sửa 002/004/005.
- DB transaction tạo account+demo marker+session đồng thời, rollback khi lỗi.
- Public Player ID `WV-XXXXXXXXXXXX` và `isDemo=true` được trả trong authorized projection; không có privileged/admin flag.
- Mỗi lần click tạo danh tính độc lập; session token 256-bit, lưu hash trên server; TTL 2 giờ.
- Route mặc định tắt, cần `WV_ENABLE_DEMO_AUTH=1`; `NODE_ENV=production` cấm cả khi flag=1.
- 6 lần tạo phiên/IP/giờ, từ chối request Origin khác và Content-Type không phải JSON; giới hạn tạm thời trong bộ nhớ process (phù hợp development, không dùng làm rate-limit production nhiều instance).
- Frontend giữ nút/style, hiển thị loading, disable duplicate, báo lỗi tiếng Việt, vào Lobby khi có token; không local fake login.
- Logout thu hồi token; WebSocket xác thực lại theo token; refresh lấy profile từ backend.
- `demo:cleanup` chỉ chạy khi operator chủ động xác nhận; token Demo hết hạn bị vô hiệu hóa; chỉ xóa demo account hết hạn không có thành viên/phòng/game lịch sử; không xóa tài khoản thường.

## Ảnh hưởng và giới hạn
- Không sửa `character.json`, luật nhân vật, Engine Rule Resolver hay competitive.
- Không sửa CSS, artwork, layout hoặc hình ảnh; chỉ cập nhật copy đăng nhập và lớp integration của frontend.
- Phiên Demo có quyền một thành viên bình thường, được phép tạo/phòng trong phạm vi Test Mode; không có quyền quản trị hệ thống.
- Test Docker/PostgreSQL cần chạy trong môi trường Mac thực; không suy ra PASS từ SQLite.
- Thông báo Demo bản gốc #9001 chỉ còn trong bản tham chiếu UI và một số dữ liệu mock cũ của prototype; không được dùng làm session thật.
