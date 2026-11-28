# Sprint 03 — Kiến trúc tích hợp và Master Logic

## Đường đi dữ liệu

```text
Approved UI (index.html + app.js + integration.js)
  → same-origin HTTP API + WS (backend/src/multiplayer/server.ts)
  → AuthService / RoomService / GameCoordinator
  → EngineService + OfficialRuleRegistry (#25, #74 only)
  → atomic Store (SQLite or PostgreSQL) + Event Log + replay
  → per-user GameProjection + projectSkillFeedback
  → WS `game.state_updated` / `game.events` / `game.skill_feedback`
  → UI feedback panel (render once from permitted payload; immediate text)
```

**Không có Engine thứ hai.** `GameCoordinator` gọi `withKernel(...)` để tái sử dụng Engine Kernel và persisted archive; server không tự đoán luật, phe, vai hay kết quả soi. Gameplay official chỉ hoạt động với `OFFICIAL_ROLE_INSPECTION_V1` khi `WV_OFFICIAL_RULE_TEST_MODE=1`. `WV_INTEGRATION_TEST_MODE=0` cô lập `fixture.*` và cấm competitive.

## Universal Feedback

`backend/src/feedback/contract.ts` định nghĩa `SkillFeedback` schema v1. `projector.ts` giữ allowlist event-type→result projector; chỉ `ROLE_OBSERVED` được phép tạo `{characterId,targetId}`, không chứa serialized state, RNG seed, mô tả vai khác hoặc Event Log nội bộ. Event phải được `Engine.projectVisibleEvents` cho phép trước khi projector thấy. Action lại phải là **của viewer**. Các quyền được gắn theo sự kiện tại thời điểm commit, không mở quyền nhờ thay đổi phe/nhóm về sau.

Trạng thái biểu diễn: `SUBMITTED` ở UI ngay khi gửi; server trả `ACCEPTED` khi đã lưu, feedback lưu `PENDING_RESOLUTION`; sau commit `RESOLVED`, `CANCELLED` (nếu Engine cho phép), hoặc lỗi từ chối client `REJECTED`/`RULE_UNRESOLVED`. `ACCEPTED` **không** phải `RESOLVED`. Không có result payload trước khi phân giải. Không tạo fake result cho event không đăng ký.

## WS consistency

Chỉ sau transaction commit, `emitGame()` gửi cho từng user: `game.state_updated` projection, `game.events` đã filter, `game.skill_feedback` đúng audience. Hành động vừa ACCEPTED chỉ trả response riêng cho actor, không broadcast thông tin nhạy cảm. Browser giữ `lastRevision`, bỏ snapshot cũ; dedup feedback theo `actionId`, chỉ thay thế status theo độ trưởng thành; reconnect tải lại game + feedback + events từ server. Navigation hint trong `sessionStorage` không là nguồn dữ liệu game.

## Data persistence

Không có migration Sprint03: feedback v1 được dựng lại từ Action + Event đã commit và Event Visibility. PostgreSQL migrations 002/004/005 và SQLite migrations kế thừa không đổi. Các tác vụ `resolve` dùng `withGameMutation` transaction và rollback, game revision cập nhật sau commit. Event Log/replay từ Kernel giữ nguyên.

## Security constraints

- Bearer access token do server xác thực trên từng API và WS; trong frontend local test được giữ `sessionStorage`, không đưa vào `localStorage`.
- Không có endpoint public liệt kê phân vai, archive Kernel, seed, raw Event Log.
- `GET /api/games/:id/feedback` gọi `requireParticipant` trước; kết quả chỉ với `viewerId` đã xác thực.
- Static server allowlist `.html/.css/.js/character.json` và asset gốc, có path-safety.
- CSP vẫn phải cho phép inline handlers từ giao diện được duyệt; **hạn chế bảo mật còn tồn tại**, nên production cần chuyển dần sang addEventListener mà vẫn giữ đồ họa.

## Design invariants

- `character.json` byte-identical; 97 roles; không bật skills thiếu law.
- 2 vai official: #25, #74 với nguồn kiểm toán `Rule Ready` và rule v1.3.1; strict pack two players, no victory check.
- `ROLES` legacy trong prototype cũ được thay lúc runtime bằng `character.json` thực; không sửa file JSON hay thay đổi hình ảnh.
- `runTypewriter` đồng bộ `.textContent`; không timer ký tự.
- Engine errors hoặc DB rollback không làm lộ kết quả trước commit; viewer khác thấy empty feedback.
