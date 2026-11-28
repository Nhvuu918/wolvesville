# Event-to-Animation Contract

Sự kiện trong bảng là **server event** hoặc **UI-level derived phase**, không được truyền seed/Character ID của người khác. Hoạt ảnh gợi ý **không làm chữ xuất hiện dần**.

| Event | Trạng thái | Audience | Chuyển trạng thái / hiệu ứng gợi ý | Reconnect |
|---|---|---|---|---|
| `PHASE_CHANGED` | IMPLEMENTED & TESTED | ROOM_PUBLIC | Toàn khung đổi ánh sáng/ngày–đêm, nội dung hiện tức thì | Chỉ hiển thị phase hiện tại, không replay animation vô hạn |
| `ROLE_ASSIGNED` (UI snapshot) | IMPLEMENTED & TESTED | PLAYER_PRIVATE | Lật thẻ nhân vật riêng, không broadcast thẻ người khác | Lấy `self` từ snapshot |
| `ACTION_ACCEPTED` | IMPLEMENTED & TESTED | SERVER_INTERNAL; UI nhận HTTP ACK | Nút xác nhận đã nộp, không hiện kết quả | Fetch `feedback` |
| `ROLE_OBSERVED` | IMPLEMENTED & TESTED | PLAYER_PRIVATE | Hiện kết quả soi cho người có quyền; không reveal ra phòng | Lấy authorized feedback, chống lặp |
| `VOTING_OPENED` | IMPLEMENTED & TESTED | ROOM_PUBLIC | Sáng bảng bỏ phiếu/ẩn bàn luận | Phản ánh `game.phase=DAY_VOTE_COLLECT` |
| `VOTE_INTENT_RECORDED` | IMPLEMENTED & TESTED | PLAYER_PRIVATE | Người gửi thấy đã ghi nhận; khác chỉ thấy tổng lượt | `voting.ownBallot` |
| `VOTING_CANCELLED` | IMPLEMENTED & TESTED | ROOM_PUBLIC | Khung phiếu tan thành sương, chuyển đêm sau | `voting.status=CANCELLED` |
| `VOTING_CLOSED_PENDING_RULES` | PARTIAL | ROOM_PUBLIC | Thông báo phiếu đã khóa; không hiển thị ai chết | `CLOSED_UNRESOLVED` |
| `DAY_STARTED` / `NIGHT_ENDED` | DESIGNED ONLY như event riêng | Dự kiến PUBLIC | Chuyển cảnh có thể dựa trên `PHASE_CHANGED` hiện có | Không phát event chưa tồn tại |
| `PLAYER_ELIMINATED` | BLOCKED BY RULE | Chưa xác định | Không chạy animation loại người | Không áp dụng |
| `GAME_COMPLETED` | BLOCKED BY RULE | Chưa xác định | Không hiện màn thắng/thua | Không áp dụng |

**Reduced motion:** thay bằng chuyển trạng thái không motion/fade tối thiểu; văn bản có mặt ngay sau commit. **Ordering:** dùng sequence/revision, không chấp nhận snapshot cũ ghi đè cái mới. Đồ họa không quyết định phase hoặc action result.
