# Player-first API & Realtime Integration — Contracts

## Không thay đổi API backend đã nghiệm thu

Frontend gọi cùng origin, thông qua một hàm `WolvesLive.request()` chung với Authorization Bearer token do backend cấp. Không hardcode port; không retry tự động POST/PUT/PATCH do nguy cơ gửi lệnh hai lần.

| Hoạt động | HTTP backend | WebSocket / Cập nhật |
|---|---|---|
| Đăng ký, login/logout, demo | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/demo` | WS `auth` với token đã cấp |
| Khôi phục phiên | `/api/auth/me` | reconnect → `auth.ok` → resubscribe |
| Hồ sơ cá nhân | `GET/PATCH /api/profile/me` | Render lại profile từ response |
| Danh sách phòng | `GET /api/rooms` | room snapshot hoặc polling khi đang ở sảnh |
| Tạo phòng | `POST /api/rooms` | `subscribe` + room snapshot |
| Tham gia phòng | `GET /api/rooms/:id` hoặc `POST /api/rooms/:id/join` | `subscribe` + room updates |
| Rời phòng | `POST /api/rooms/:id/leave` | `unsubscribe`, xóa room hint |
| Khóa/mở phòng | `POST /api/rooms/:id/lock` hoặc `.../unlock` | `room.updated` |
| Tạo trận thử | `POST /api/rooms/:id/games/start` | `game.created` |
| Trạng thái game | `GET /api/games/:id` | `game.snapshot`, `game.state_updated` |
| Gửi kỹ năng | `POST /api/games/:id/actions` | `game.action_accepted` riêng người gửi |
| Host xử lý lượt | `POST /api/games/:id/resolve` | Sau commit, game state + feedback phân quyền |
| Feedback / events | `GET /api/games/:id/feedback`, `.../events` | `game.skill_feedback` đến đúng người có quyền |
| Replay | `GET /api/games/:id/replay` | Kết quả chỉ được hiển thị theo quyền đang có |

**Data ownership:** backend sở hữu danh tính, room membership, role assignment, state/revision, result, RNG, permission. Frontend không tính thắng/thua, không đoán phe, không soạn role secret hay result.

## Đồng bộ kết nối

`WS auth.ok`: chuyển `connectionState` thành online, đăng ký lại phòng/ván, đọc snapshot game hiện tại, feedback và events qua API, lọc quyền trước khi render. Nếu WS mất: banner ngắn và chờ reconnect có backoff. GET room list định kỳ 18 giây khi đang nhìn sảnh; không redraw khi form tạo phòng còn mở; response cũ bị loại bằng request sequence. Client bỏ game revision cũ và event ngoài quyền.

## Skill status vs result

- `SUBMITTED`: đang gửi, chưa được tiếp nhận.
- `ACCEPTED`/`PENDING_RESOLUTION`: đã nhận, đang chờ; **không tiết lộ kết quả**.
- `RESOLVED`: chỉ render phần resultPayload đã qua Authorized Projection.
- `REJECTED`/`CANCELLED`/`RULE_UNRESOLVED`: không tạo một kết quả giả cho UI.

Chỉ bộ kỹ năng #25/#74 được hỗ trợ trong test mode, không có competitive hoặc Victory Resolver đầy đủ.
