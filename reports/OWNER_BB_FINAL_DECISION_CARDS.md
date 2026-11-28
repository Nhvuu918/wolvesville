# OWNER B/B — quyết định còn cần phê duyệt

Core DEC-BT-01=B và DEC-BT-02=B đã được duyệt. Không hỏi lại hai lựa chọn đó. Các lựa chọn dưới đây là chi tiết bổ sung, chưa ban hành. Profile `owner-bb-candidate-v1` không phải ruleset mới.

## BB-01 — Phiếu trống, thiếu phiếu và kết thúc đêm
- Nguồn: DEC-BT-01=B, PH-04 (AFK), VH08. Sự đồng thuận tuyệt đối không thể suy ra từ thiếu phiếu.
- A (khuyến nghị): khi chốt, nếu có thành viên đủ quyền không có lựa chọn hợp lệ, chủ động bỏ cắn, hoặc bất đồng thì không cắn; xử lý AFK độc lập theo PH-04. Không tạo mục tiêu ngẫu nhiên vì sẽ phá đồng thuận. Cho phép sửa lựa chọn trước chốt.
- B: nếu thiếu phiếu thì giữ cửa sổ mở tới khi toàn bộ thành viên đã trả lời; cần thời hạn và fallback được duyệt.
- C: áp dụng chính sách khác do chủ dự án mô tả (phải không mâu thuẫn đồng thuận tuyệt đối).
- Bổ sung: xác nhận phiếu trống sau khi đã chọn là rút lựa chọn (khuyến nghị), hay giữ lựa chọn cuối. Candidate lưu cả hai thông tin và không phát đòn.
- Impact: toàn bộ vai Sói/bộ nhiều Sói, phase lock, AFK và reconnect. BB02–04 đã có kiểm thử phát hiện, chưa có commit đêm.

## BB-02 — Hai mục tiêu và đồng thuận một phần
- Nguồn: DEC-BT-01=B, VH74/P04.
- A (khuyến nghị): đồng thuận toàn bộ tập mục tiêu không phân biệt thứ tự; nếu tập khác nhau, không cắn. Ví dụ A chọn {X,Y}, B chọn {X,Z}: không cắn.
- B: đồng thuận theo từng mục tiêu; ví dụ trên cắn X, bỏ mục tiêu chưa đồng thuận.
- C: khác, cần định nghĩa chính xác.
- Impact: Sói Thủ Lĩnh, các quyền cắn tăng cường; bảo vệ từng đòn. BB06 nhận diện tập và giao, không chọn thay.

## BB-03 — Thành viên mất quyền hoặc hồi sinh, đại diện
- Nguồn VH54, VH52, VH10/VH41, VH08, PH-01.
- A (khuyến nghị): lấy danh sách đủ quyền tại thời điểm chốt. Thành viên đã mất quyền không tham gia; thành viên hồi sinh trước khi cắn theo VH52 được cấp quyền và phải gửi lựa chọn; nếu chưa đồng thuận thì áp dụng BB-01. Đại diện theo thứ tự cố định trước trận, bỏ người đã mất quyền, không bốc lại tùy ý.
- B: giữ snapshot thành viên/đại diện đã khóa từ đầu, nếu thay đổi quyền thì không cắn (phải xử lý riêng VH52).
- Hai đòn đã đồng thuận: S (khuyến nghị) cùng một đại diện cố định hợp lệ cho cả hai đòn; P đại diện riêng từng đòn theo thứ tự cố định; quy định thêm nếu đại diện bị phản sát ở đòn đầu nhưng đòn thứ hai đã được chốt. Không cho phản đòn lặp.
- Impact: VH54, VH52, phản sát, death-chain, nhiều đòn, role block. BB05–06 đã kiểm thử nhận diện; chưa phát đòn trong case pending.

## BB-04 — Đảo bảo vệ và cứu người thành sát thương
- Nguồn #10, NV10, Q13-11, VH08, SYS-12–14, VH60, PH-01. Nguồn xác định tác động đảo nhưng chưa cung cấp đầy đủ ưu tiên xung đột khi có nhiều lớp bảo vệ hoặc nhiều người cứu.
- A (khuyến nghị): dùng một nguồn sát thương riêng của kỹ năng bị bẫy, ghi provenance, đi qua chuyển hướng/phòng thủ hợp lệ và death-chain; không tự xuyên mọi miễn nhiễm. Đảo cứu trên người đang chết sơ bộ không cứu họ, ghi thêm nguyên nhân hợp lệ nếu luật cho phép, không ghi hai tử vong. Một cứu khác hợp lệ được xét theo luật cứu đêm chung. Tài nguyên kỹ năng dùng đúng lúc đã xác nhận như luật gốc.
- B: tác động chết trực tiếp không qua phòng thủ/cứu khác (cần phê duyệt ngoại lệ rõ ràng).
- C: định nghĩa riêng cho đảo bảo vệ và đảo cứu.
- Impact: #10, #31, #29 và tương tác với cứu/phòng thủ/redirect/death-chain. BB13 đã tạo effect đề nghị, không commit.

## BB-05 — Một lần dùng có nhiều kỹ năng/effect
- Nguồn DEC-BT-02=B, VH08, VH85, SYS-07, P04. Bẫy chỉ tiêu hao một lần, không tự sao chép thành nhiều bẫy.
- A (khuyến nghị): lần thực thi đầu tiên theo thứ tự đã xác nhận tiêu hao bẫy, nếu một lần thực thi có nhiều đích/effect thì chỉ xác định phạm vi đảo khi đã có quy tắc theo loại kỹ năng.
- B: đảo toàn bộ nhóm hành động được nộp trong lượt đó (cần xác nhận không trái “lần sử dụng tiếp theo”).
- Impact: các buff/tăng lượt và kỹ năng đa đích. BB14 fail closed.

Gửi quyết định dưới dạng BB-01=A, phiếu trống=rút/giữ; BB-02=A; BB-03=A, đại diện=S/P, phản sát đòn 1=...; BB-04=A; BB-05=A. Không tự động phát hành v1.3.4; còn cần tích hợp transactional và acceptance.
