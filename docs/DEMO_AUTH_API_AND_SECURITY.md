# Demo Authentication API & Security Contract

## POST /api/auth/demo
- Body: `{}`; Content-Type: `application/json`.
- Không cần bearer token; origin phải trùng host nếu gửi Origin.
- Enabled: `WV_ENABLE_DEMO_AUTH=1` và `NODE_ENV != production`; mặc định disabled.
- Thành công: HTTP 201 `{token, profile:{id, publicId, displayName, isDemo:true}, expiresAt}`.
- `token` là bearer credential, tuyệt đối không log hoặc broadcast.
- `publicId` khác với Character ID và Room ID, không phải #9001 chung.
- Rate limit: 6 tạo phiên / IP / giờ / một backend process.
- Lỗi: 403 `DEMO_DISABLED`; 403 `DEMO_FORBIDDEN_ORIGIN`; 415 `INVALID_CONTENT_TYPE`; 429 `DEMO_RATE_LIMITED`; 413 `BODY_TOO_LARGE`.

## POST /api/auth/logout
- Bearer demo token: thu hồi session, đóng các WebSocket tương ứng.

## GET /api/auth/me
- Bearer demo token còn hạn: `profile.isDemo=true`; lấy từ `wv_demo_account_meta` hoặc `demo_account_meta`.
- Các route `/api/rooms`, WebSocket `/ws`, Game Session tiếp tục dùng authorization giống user chuẩn.
- Session không tự động cấp admin; host chỉ quản lý phòng của chính họ.

## Persistence/Migration
- SQLite 006: `demo_account_meta` + index; `auth_sessions` gốc vẫn được sử dụng.
- PostgreSQL 006: `wv_demo_account_meta` + index; `wv_sessions` gốc vẫn được sử dụng.
- `createDemoIdentity` bảo đảm 3 INSERT cùng transaction.
- Session không hợp lệ nếu bị revoke hoặc hết hạn.
- `cleanupExpiredDemoAccounts` only deletes expired demo user if no member/room/game references; retains related history otherwise.
- Migration mặc định thực thi tuần tự 002,004,005,006 qua `npm run db:migrate:pg:02c` hoặc command alias hotfix.

## Bảo mật dự kiến nhưng chưa thuộc Sprint 03 hotfix
- Chống abuse liên máy cần Redis/distributed rate limiting nếu backend scale nhiều replica.
- TLS và HTTP-only SameSite cookie cân nhắc cho deployment public; bản hiện tại giữ bearer/sessionStorage tương thích Sprint 03.
- Demo mặc định disabled ở production, không phải con đường authentication để triển khai công khai.
