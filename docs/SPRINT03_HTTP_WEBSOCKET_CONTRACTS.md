# Sprint 03 — HTTP / WebSocket / SkillFeedback Contract

Các API 02A–02C còn nguyên; Sprint 03 thêm một API **chỉ đọc** và một WS message phục vụ feedback. URL tương đối, frontend và backend cùng origin.

## HTTP (tất cả trừ `/health` và static đều cần Bearer)

| Method | Endpoint | Chức năng |
|---|---|---|
| `GET` | `/` | UI dark fantasy được duyệt, served cùng origin |
| `GET` | `/character.json` | Catalog công khai 97 vai; **không có assignment riêng của game** |
| `GET` | `/health` | Runtime health + enabled officialTestMode (không chứa secrets) |
| `POST` | `/api/auth/register` | `{username,password,displayName}` → profile |
| `POST` | `/api/auth/login` | `{username,password}` → `{token,profile}` |
| `POST` | `/api/auth/logout` | Thu hồi phiên |
| `GET` | `/api/auth/me` | Kiểm chứng token |
| `GET`,`PATCH` | `/api/profile/me` | Hồ sơ / đổi displayName |
| `GET`,`POST` | `/api/rooms` | Danh sách phòng / tạo phòng |
| `GET` | `/api/rooms/{roomId}` | Projection phòng theo quyền |
| `POST` | `/api/rooms/{roomId}/join` | Tham gia |
| `POST` | `/api/rooms/{roomId}/leave` | Rời |
| `POST` | `/api/rooms/{roomId}/lock` | Khóa danh sách — host |
| `POST` | `/api/rooms/{roomId}/unlock` | Mở khóa — host |
| `POST` | `/api/rooms/{roomId}/games/start` | `{rulePack:"OFFICIAL_ROLE_INSPECTION_V1",characterIds:[25,74],idempotencyKey}`; host only/test mode |
| `GET` | `/api/games/{gameId}` | Authorized GameProjection, own role only |
| `POST` | `/api/games/{gameId}/actions` | `{actionId,idempotencyKey,skillId,targetIds,expectedRevision}` |
| `POST` | `/api/games/{gameId}/resolve` | `{expectedRevision}` host only/test mode |
| `GET` | `/api/games/{gameId}/events` | Filtered authorized Event Log, **not full archive** |
| `GET` | `/api/games/{gameId}/feedback` | **NEW** `{feedback:{schemaVersion,gameId,revision,items}}` — own actions only |
| `GET` | `/api/games/{gameId}/replay` | Authorized verification/status, không gửi full private archive |

## SkillFeedback v1

```json
{
  "schemaVersion": 1,
  "feedbackId": "<gameId>:<actionId>:feedback",
  "gameId": "<gameId>",
  "actionId": "<actionId>",
  "actorPlayerId": "<authenticated-viewer-id>",
  "skillId": "official.25.inspect-role",
  "ruleVersion": "<rules-version>",
  "actionStatus": "RESOLVED",
  "resolutionStatus": "RESOLVED",
  "resultType": "ROLE_INFORMATION",
  "visibilityScope": "PLAYER_PRIVATE",
  "audience": ["<authenticated-viewer-id>"],
  "resultPayload": {"characterId": 74, "targetId": "<authorized-target-player-id>"},
  "eventSequence": 10,
  "eventRevision": 8,
  "createdAt": 0,
  "resolvedAt": 0
}
```

`createdAt`/`resolvedAt`: timestamps từ sự kiện được lưu, `null` khi chưa có; số mẫu `0` chỉ minh họa schema. `resultPayload` là `null` đối với `PENDING_RESOLUTION`, `CANCELLED`, unknown type hoặc khi không được phép xem. **Không bao giờ gửi game state hoặc RNG seed qua payload.**

> Contract hiện chỉ triển khai audience `PLAYER_PRIVATE`; future faction/group/public adapters phải có policy riêng và test bảo mật trước khi bật. Không tự bật các nhóm khác chỉ vì tồn tại kiểu contract.

## WebSocket

Kết nối `ws(s)://host/ws`, message auth `{type:"auth",token}`. Client có thể `{type:"subscribe",roomId}`, `{type:"game.subscribe",gameId}`. Khi game commit / subscribe, server gửi user-specific `game.snapshot` hoặc `game.state_updated`, `game.events`, **`game.skill_feedback`**. Message dạng:

```json
{"type":"game.skill_feedback","feedback":{"schemaVersion":1,"gameId":"<id>","revision":8,"items":[]}}
```

Không có broadcast raw action result. `game.skill_feedback` luôn được render theo viewer, không lấy group membership hiện tại để mở lại thông tin cũ.

## Chính sách lỗi

API dùng HTTP non-2xx + `{error:{code,message}}`, ví dụ `RULE_UNRESOLVED`, `FORBIDDEN`, `REVISION_CONFLICT`, `AUTH_*`; **không** phát role result khi lỗi. `ACCEPTED` là trạng thái lưu lệnh, không phải đã phân giải. Mọi privileged field (actor ID, role, priority, RNG outcome, revision mới) đều xác định từ server.
