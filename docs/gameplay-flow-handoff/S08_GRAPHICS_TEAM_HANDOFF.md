# Sprint 08 — Graphics-ready state and animation handoff

**Đã kiểm tra trên nền Sprint 07 v0.9.0; đây là hợp đồng bổ sung, chưa phải Sprint 08 gameplay implementation.**

Sử dụng file machine-readable `S08_GRAPHICS_READY_CONTRACT.json` làm bản tra cứu các trường trigger/payload/transition/error/loading/reconnect và reduced motion.

## Quy tắc tương thích

- Không thay đổi các event gốc; chỉ sửa trạng thái **theo phạm vi**: `PLAYER_ELIMINATED`, `MATCH_COMPLETED` đã có trong bộ hai vai [8,25] (Sprint07), không áp dụng cho generic vote.
- Hệ thống không có event `VOTE_RESOLVED` chung, không dựng animation treo cổ từ phiếu raw.
- Ưu tiên nhận `game.snapshot`/`game.state_updated`, kiểm tra revision và quyền; UI chỉ phát animation cho **event mới sau commit**, không replay nó sau reconnect.
- `ROLE_OBSERVED` và kết quả kỹ năng chỉ hiển thị trong client được phân quyền. Không dùng tên nhân vật/seed/mã kỹ thuật để suy đoán gameplay.
- Nội dung chữ hiển thị toàn bộ ngay lập tức; motion là trang trí tùy chọn và tôn trọng `prefers-reduced-motion`.

## Ma trận trạng thái

| State ID | Tên màn hình | Backend event | Đối tượng | Tình trạng | Animation hook |
|---|---|---|---|---|---|
| `AUTH_ENTRY` | Bước vào làng | `auth HTTP response` | SELF | `IMPLEMENTED_TESTED` | `auth.enter.v1` |
| `LOBBY_MAP` | Sảnh làng | `room snapshot/update` | PUBLIC | `IMPLEMENTED_TESTED` | `lobby.rooms.update.v1` |
| `ROOM_PREVIEW` | Thông tin phòng | `room preview from HTTP list` | PUBLIC | `IMPLEMENTED_TESTED` | `room.preview.open.v1` |
| `ROOM_WAITING` | Phòng chờ | `room.updated` | ROOM_MEMBERS | `IMPLEMENTED_TESTED` | `room.waiting.update.v1` |
| `ROLE_REVEAL` | Nhận vai riêng | `game.snapshot` | PLAYER_SELF | `IMPLEMENTED_TESTED` | `role.reveal.private.v1` |
| `NIGHT_ACTION` | Đêm — chọn mục tiêu | `game.snapshot / game.state_updated` | PLAYER_SELF | `IMPLEMENTED_TESTED` | `night.action.select.v1` |
| `ACTION_PENDING` | Đã gửi hành động | `ACTION_ACCEPTED receipt` | PLAYER_SELF | `IMPLEMENTED_TESTED` | `action.pending.v1` |
| `NIGHT_RESULT` | Kết quả kỹ năng | `ROLE_OBSERVED` | PLAYER_PRIVATE | `IMPLEMENTED_TESTED_SCOPED` | `skill.result.private.v1` |
| `DAY_DISCUSSION` | Bình minh & thảo luận | `PHASE_CHANGED` | ROOM_PUBLIC | `IMPLEMENTED_TESTED` | `phase.dawn.v1` |
| `VOTE_OPEN` | Bỏ phiếu | `VOTING_OPENED` | ROOM_MEMBERS | `IMPLEMENTED_TESTED_INTAKE` | `vote.open.v1` |
| `VOTE_SUBMITTED` | Đã ghi nhận phiếu | `VOTE_INTENT_RECORDED` | PLAYER_SELF | `IMPLEMENTED_TESTED_INTAKE` | `vote.received.private.v1` |
| `VOTE_CANCELLED` | Biểu quyết bị hủy | `VOTING_CANCELLED` | ROOM_PUBLIC | `IMPLEMENTED_TESTED_RESTRICTED` | `vote.cancelled.public.v1` |
| `VOTE_CLOSED_PENDING` | Biểu quyết đã khóa | `VOTING_CLOSED_PENDING_RULES` | ROOM_MEMBERS | `PARTIAL` | `vote.closed.unresolved.v1` |
| `VOTE_RESOLUTION` | Kết quả biểu quyết | `NOT_IMPLEMENTED` | NONE | `BLOCKED_BY_RULE` | `—` |
| `VOTE_ELIMINATION` | Người bị treo | `NOT_IMPLEMENTED` | NONE | `BLOCKED_BY_RULE` | `—` |
| `VERIFIED_NIGHT_ELIMINATION` | Người bị loại (đêm) | `PLAYER_ELIMINATED` | ROOM_PUBLIC | `IMPLEMENTED_TESTED_SCOPED` | `player.eliminated.verified.v1` |
| `GAME_RESULT` | Kết quả trận | `MATCH_COMPLETED` | ROOM_PUBLIC | `IMPLEMENTED_TESTED_SCOPED` | `match.completed.verified.v1` |
| `RECONNECT` | Đang kết nối lại | `auth.ok + game.snapshot` | PLAYER_SELF | `IMPLEMENTED_TESTED` | `connection.resync.v1` |
| `CODEX` | Bách khoa 97 nhân vật | `official catalog loaded` | PUBLIC | `IMPLEMENTED_TESTED` | `codex.open.v1` |

## Tình huống đồ họa phải phân biệt

1. **Đã nộp ≠ đã phân giải:** chỉ phát pending khi action được chấp nhận; chưa có death/role result.
2. **Kết quả đêm có căn cứ:** [8,25] mới có `PLAYER_ELIMINATED` và `MATCH_COMPLETED` thật. Không hiển thị Character ID trong UI.
3. **Bỏ phiếu chưa được chốt:** `VOTING_CLOSED_PENDING_RULES` khác hoàn toàn `VOTE_RESOLVED`.
4. **Mất mạng hoặc refresh:** hiển thị lại state hiện tại bằng snapshot, không chạy một màn chiến thắng lặp lại như sự kiện mới.
5. **Đa độ phân giải:** giữ bố cục Dark Fantasy hiện tại, kiểm tra 1920×1080, 1366×768, tablet và 390px mobile; không bắt buộc đổi artwork.

## Placeholder assets (không đụng dữ liệu trò chơi)

- `anim.phase.dawn`: chuyển ánh sáng nền; fallback: thay nền tĩnh.
- `anim.action.pending`: trạng thái nút; fallback: văn bản “Đã gửi, đang chờ”.
- `anim.skill.private`: khung thẻ riêng tư; fallback: thông tin đầy đủ ngay lập tức.
- `anim.vote.cancelled`: chuyển bảng phiếu thành sương; fallback: panel có nội dung “Biểu quyết bị hủy”.
- `anim.night.elimination`: chỉ khi backend commit event đúng quyền; fallback: thông báo tử vong công khai đã xác nhận.
- `anim.match.completed`: chỉ khi `completed=true` từ server; fallback: trang kết quả tĩnh.

## Không được tính vào gameplay GO

Các placeholder `VOTE_RESOLUTION` và `VOTE_ELIMINATION` chỉ là flow đồ họa **Design Preview**, không có event runtime và không được minh họa như kết quả thử nghiệm thành công.
