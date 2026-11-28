# UI State Inventory

| UI Surface | Trạng thái | Cái người chơi thấy | Trigger/data |
|---|---|---|---|
| Login/Demo | IMPLEMENTED & TESTED | Login, lỗi VN, vào sảnh | Auth API/Token |
| Village Map | IMPLEMENTED & TESTED | Marker phòng, xem chi tiết rồi mới tham gia | `GET /api/rooms`, room WS |
| Lobby Room | IMPLEMENTED & TESTED | Host, thành viên, khóa/mở, bắt đầu | Auth/Room API |
| Role reveal | IMPLEMENTED & TESTED | Vai mình, không thấy vai người khác | `GET /api/games/:id` private `self` |
| Night skills | IMPLEMENTED & TESTED | Nút kỹ năng phù hợp vai, đã nhận/chờ kết quả | `capabilities` + `feedback` |
| Dawn | IMPLEMENTED & TESTED | Giai đoạn Ngày, diễn biến được phép xem | `game.phase` from server |
| Vote intake | IMPLEMENTED & TESTED | Chọn người, đã nhận phiếu, số đã nộp, nút host | `game.voting`, `/votes` |
| #79 cancellation | IMPLEMENTED & TESTED | Biểu quyết bị hủy, đêm tiếp theo | `VOTING_CANCELLED`, projection |
| Elimination | BLOCKED BY RULE | Không phát hiệu ứng chết giả | no official final vote / attack path |
| Endgame | BLOCKED BY RULE | Không có banner thắng giả | no validated endgame closure |
| Bách khoa 97 | IMPLEMENTED & TESTED | Wheel/Grid, tìm kiếm/lọc; không ID | `character.json` |
| History/Ranking | PARTIAL | Chưa mở kết quả thi đấu cạnh tranh | No victory engine |
| Reconnect | IMPLEMENTED & TESTED | Tái đồng bộ snapshot đúng quyền | Auth+WS subscribe+HTTP refresh |

**Responsive:** dùng CSS/ảnh Dark Fantasy đã duyệt; không thêm theme khác. **Instant Text:** hiện văn bản nguyên khối, không typewriter. **Accessibility:** nút có mô tả tiếng Việt, reduced motion không trì hoãn chữ.
