# WOLVESVILLE — QUYẾT ĐỊNH BỔ SUNG GAMEPLAY

**Ngày xác nhận:** 25/11/2026. **Phiên bản luật hiện hành:** `wolvesville-official-v1.3.3`. **Phiên bản luật dự kiến:** `wolvesville-official-v1.3.4`. **Trạng thái lựa chọn:** OWNER APPROVED — 4/4 phương án A. **Trạng thái kiểm tra luật nguồn tại thời điểm xác nhận:** PENDING SOURCE VERIFICATION. **Trạng thái phát hành:** NOT ACTIVE.

Bản lưu nội dung quyết định từ tin nhắn chủ dự án (định dạng được chuẩn hóa, không đổi nội dung các điều khoản). Kết quả đối chiếu và triển khai mới được ghi riêng trong `data/rules/owner_dc_decisions_20261125.json` và `owner-decision-acceptance.json`.

## Điều 1. Quyền chọn ghế đã chết công khai — DC-SOUL-01=A
1. Những kỹ năng sát thương được chỉ định có thể nhắm đến ghế của người chơi đã chết công khai.
2. Lượt thử sử dụng kỹ năng hợp lệ tiêu hao tài nguyên tương ứng theo luật nhân vật.
3. Khả năng được chọn mục tiêu không đồng nghĩa với việc mục tiêu chắc chắn chịu sát thương.
4. Nếu mục tiêu đã chết thật và không thể nhận sát thương, lượt thử được xử lý theo quy tắc tiêu hao áp dụng, không tự tạo thêm tử vong.
5. Nếu mục tiêu đang sống bí mật sau hồi sinh, sát thương được phân giải theo trạng thái thực tế và các lớp phòng thủ hợp lệ.
6. Không được sử dụng danh sách mục tiêu, biên nhận hoặc thông báo lỗi để tiết lộ trái phép trạng thái hồi sinh bí mật.
7. Chỉ những kỹ năng có căn cứ trong Rule Registry hoặc được phê duyệt bổ sung mới thuộc phạm vi áp dụng. Không tự mở rộng cho toàn bộ kỹ năng sát thương.

**Điều kiện xác minh:** Danh sách kỹ năng được chỉ định và cách tiêu hao đối với từng loại kỹ năng phải được đối chiếu Character Specifications trước khi áp dụng chính thức.

## Điều 2. Xạ Thủ Linh Hồn bắn nhầm phe Dân — DC-SOUL-02=A
1. Khi #23 sử dụng một viên đạn hợp lệ để bắn người thuộc phe Dân, viên đạn được tiêu hao.
2. Mục tiêu chịu sát thương thông thường nếu không có lớp bảo vệ hoặc quy tắc hợp lệ khác ngăn sát thương.
3. Sát thương phải được xử lý bằng cơ chế phòng thủ, tử vong và death-chain chung.
4. Không bỏ qua các hiệu ứng liên kết sau tử vong.
5. Không tiết lộ phe thật của mục tiêu trước thời điểm luật cho phép.
6. Không cấp lại đạn do retry, reconnect hoặc SQLite restart.
7. Quy tắc này không tự thay đổi những điều kiện khác về quyền bắn, số viên đạn và vòng đời hồi sinh của #23.

**Điều kiện xác minh:** Đối chiếu mô tả #23 và các quyết định VH liên quan để xác nhận không có ngoại lệ riêng đối với mục tiêu cùng phe.

## Điều 3. Thầy Đồng bị bẫy khi thực hiện hồi sinh — DC-TRAP-02=A
1. Khi #26 đang chịu một dấu bẫy có hiệu lực và thực hiện lượt hồi sinh hợp lệ thuộc phạm vi tác động của bẫy, bẫy kích hoạt.
2. Hiệu ứng hồi sinh bị đảo thành thất bại; mục tiêu không được hồi sinh bởi lượt thực hiện đó.
3. Lượt hồi sinh của #26 và dấu bẫy được tiêu hao theo quy tắc đã phê duyệt.
4. Người được nhắm hồi sinh giữ nguyên trạng thái tử vong, trừ các hiệu ứng độc lập khác đang được phân giải.
5. Việc hồi sinh thất bại không tự gây sát thương mới cho người được nhắm.
6. Không tự tạo thêm death event hoặc death-chain từ riêng hiệu ứng thất bại này.
7. Một dấu bẫy chỉ được tiêu hao một lần theo NightActionGroup, kể cả khi trong cùng đêm tồn tại nhiều hành động hợp lệ.
8. Lệnh hồi sinh không hợp lệ không tự kích hoạt hoặc tiêu hao bẫy.
9. Retry, reconnect và khởi động lại server không được tạo thêm lượt hồi sinh hoặc tiêu hao tài nguyên lần thứ hai.

**Điều kiện xác minh:** Phải xác nhận kỹ năng hồi sinh của #26 thuộc phạm vi đảo hiệu ứng của #10 và không có ngoại lệ luật nguồn trái với phương án này.

## Điều 4. Thu hồi lựa chọn Sói mất tính hợp lệ — DC-PACK-KEEP=A
1. Trước thời điểm khóa lượt, server phải kiểm tra tính hợp lệ hiện tại của các lựa chọn cắn tập thể.
2. Lựa chọn không còn hợp lệ không được sử dụng để hình thành đồng thuận hoặc phân giải đòn cắn.
3. Lựa chọn đó được thu hồi về mặt hiệu lực gameplay; cửa sổ vẫn mở để thành viên có quyền đưa ra lựa chọn thay thế.
4. Không tự tạo mục tiêu mới.
5. Không tự coi lựa chọn đã thu hồi là đồng thuận hợp lệ.
6. Phiếu trống tiếp tục áp dụng nguyên tắc KEEP đối với lựa chọn còn hợp lệ.
7. Nếu còn thành viên cần gửi lựa chọn hợp lệ, áp dụng BB-PENDING-01=A: tiếp tục chờ, không tự đặt deadline.
8. Tập thành viên đủ quyền vẫn được xác định theo BB-03=A tại thời điểm chốt.
9. Việc thu hồi không được làm thay đổi một lượt tấn công đã khóa và commit hợp lệ.
10. Khi nguyên nhân mất tính hợp lệ là thông tin bí mật, việc phản hồi cho client phải tuân thủ Authorized Projection, không được biến thông báo thu hồi thành kênh tiết lộ phe hoặc vai.

**Điều kiện xác minh:** Phải hoàn thành thiết kế phản hồi chống lộ thông tin cho trường hợp mất tính hợp lệ do điều kiện bí mật, đồng thời kiểm tra tương thích với KEEP và Last Valid Selection.

## Điều 5. Tính kế thừa
Bốn lựa chọn trên bổ sung cho 14 quyết định B/B đã được phê duyệt trước đây, không thay thế hoặc hủy bỏ những quyết định đó. Các cơ chế đồng thuận tuyệt đối, KEEP, Eligible Membership tại thời điểm chốt, chờ đủ phản hồi không tự đặt timeout, thứ tự đại diện RNG toàn phòng, SAME/RESOLVE, bẫy tồn tại đến lần kích hoạt hợp lệ và đảo nhóm hành động trong cùng đêm kể cả xuyên cửa sổ tiếp tục có hiệu lực. Không chỉnh sửa hồi tố ruleset v1.3.3 và những archive lịch sử.

## Điều 6. Điều kiện hoàn thiện hồ sơ luật
AI lập trình có trách nhiệm đối chiếu bốn quyết định với Character Specifications và Rule Registry, ghi nhận rule provenance, xác định các tương tác và ngoại lệ chưa được quy định, kiểm tra consistency với 14 quyết định B/B, xây dựng Backend và Browser Acceptance, kiểm tra Resource Ledger, Death Ledger, Privacy và Replay, tách các xung đột luật thật sự thành Decision Card riêng và chỉ đưa những nhánh đã đủ căn cứ và nghiệm thu vào phạm vi release.

**Kết luận tại thời điểm xác nhận:** 04 lựa chọn OWNER APPROVED; 04 lựa chọn PENDING SOURCE VERIFICATION trước khi hoàn tất hiệu lực luật; Official v1.3.4 CANDIDATE — NOT ACTIVE. Không diễn giải OWNER APPROVED là xác nhận đã triển khai hoặc có quyền kích hoạt bản luật mới.
