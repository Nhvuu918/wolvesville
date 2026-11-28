# Voting Flow — giới hạn được xác minh

## Các bước đã chạy (Restricted Official Test)

1. Host mở `/api/games/:id/voting-open` sau `DAY_DISCUSS` — **IMPLEMENTED & TESTED**.
2. Server mở `DAY_VOTE_COLLECT`, phát `VOTING_OPENED` không chứa lựa chọn của ai — **IMPLEMENTED & TESTED**.
3. Người chơi còn quyền hành động gửi `/api/games/:id/votes` với `targetId`, `ballotId`, `idempotencyKey`; actor lấy từ token. Bộ test chỉ cho mỗi người gửi một phiếu, **không suy diễn quyền sửa phiếu** — **IMPLEMENTED & TESTED**.
4. Server ghi một vote intent trong snapshot/commit và gửi chính người gửi receipt; số lượng phiếu đã nộp được công khai, **không có công khai ai chọn ai** — **IMPLEMENTED & TESTED**.
5. Khi Sói Hòa Bình #79 thực hiện kỹ năng trong bộ bài đóng #25/#74/#79, Engine tiết lộ vai mục tiêu cho #79, hủy vote theo PH-02, phát `VOTING_CANCELLED`, chuyển đêm mới — **IMPLEMENTED & TESTED**.
6. Host khóa vote nếu không có PH-02: lưu `CLOSED_UNRESOLVED` và bước kiểm phiếu/treo cổ **BLOCKED BY RULE**.

## Còn thiếu căn cứ để chốt bản chính thức

- Tỷ lệ/điều kiện xác định mục tiêu bị treo; quy tắc hòa phiếu, vắng phiếu, phiếu trắng; đổi phiếu.
- Áp dụng thao túng phiếu của #33/#91 và các quyền vote khác, thứ tự chốt/đếm sau effect.
- Cơ chế loại người chết treo cùng ngoại lệ #8 và chiến thắng #28.
- Q13-05: người ngủ đông không bỏ phiếu; được kiểm tra trong lớp voter eligibility.
- VH01: Kẻ Chết Thay phải có ít nhất 2 **phiếu hợp lệ cuối cùng**, không thể dùng số vote intent trước thao túng.
- PH-02/Q13-09: vote hủy giữ event ngày đã commit; không áp dụng hành vi Oscar cho role khác nếu thiếu nguồn.

Không có API `finalVoteWinner`, `hangPlayer` hoặc `GAME_COMPLETED` từ vote. Đây là fail-closed có chủ đích.
