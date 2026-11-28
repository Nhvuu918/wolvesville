# BỘ KIỂM THỬ HỒI QUY v1.3.1

Có **52 test specification MỚI**, kế thừa **155 test specification v1.3** không sửa nguyên bản. Tổng danh mục có **207 test specification**, không phải 207 test đã chạy; tính đủ và đúng của mọi role pack vẫn chưa được chứng minh.

| ID | Nguồn | Tiền điều kiện | Kỳ vọng | Loại |
| --- | --- | --- | --- | --- |
| T131-01-01 | Q13-01 | 2 nguồn x2 và 1 kỹ năng dùng | Không x4, không vượt tài nguyên | CONFIRMED_OR_DERIVED |
| T131-01-02 | Q13-01 | 1 lượt hữu hạn còn 1 charge | Không có lần dùng thứ 2 từ buff; trừ ngoại lệ VH05 | CONFIRMED_OR_DERIVED |
| T131-01-03 | Q13-01 | Không sử dụng hoặc đã hết kỹ năng trong đêm | Buff không có tác dụng, không để dành sang đêm sau | CONFIRMED_OR_DERIVED |
| T131-02-01 | Q13-02 | AFK người còn sống khác phe đều hợp lệ | Random không loại phe | CONFIRMED_OR_DERIVED |
| T131-02-02 | Q13-02 | Có người sống nhưng bị cấm target | Không chọn mục tiêu bị cấm | CONFIRMED_OR_DERIVED |
| T131-02-03 | Q13-02 | Tập ứng viên hợp lệ rỗng | Bỏ hành động, không tăng AFK | CONFIRMED_OR_DERIVED |
| T131-03-01 | Q13-03 | 2 liên kết cũ cùng ưu tiên | Khôi phục liên kết gần nhất | CONFIRMED_OR_DERIVED |
| T131-03-02 | Q13-03 | Ứng viên mới gần nhưng ưu tiên thấp hơn | Áp ưu tiên loại đã chốt trước rồi mới độ gần | CONFIRMED_OR_DERIVED |
| T131-03-03 | Q13-03 | Một cặp không còn đủ người sống | Không phục hồi cặp không hợp lệ | CONFIRMED_OR_DERIVED |
| T131-04-01 | Q13-04 | Hai người được chia vai cùng Character ID ban đầu | Từ chối role lock | CONFIRMED_OR_DERIVED |
| T131-04-02 | Q13-04 | Biến đổi hợp lệ làm trùng currentRoleId | Chấp nhận; không dùng initial uniqueness để ngăn | CONFIRMED_OR_DERIVED |
| T131-04-03 | Q13-04 | Sói Biến Hình sao chép kỹ năng và giữ phe | Không tạo role assignment duplicate ban đầu, giữ phe Sói | CONFIRMED_OR_DERIVED |
| T131-05-01 | Q13-05 | Người ngủ đông bị đếm quân số | Vẫn được cộng team counts | CONFIRMED_OR_DERIVED |
| T131-05-02 | Q13-05 | Người ngủ đông gửi chat/vote/skill | Từ chối tại server | CONFIRMED_OR_DERIVED |
| T131-05-03 | Q13-05 | Người ngủ đông nằm trong couple | Không kích hoạt death-link vì giả chết | CONFIRMED_OR_DERIVED |
| T131-06-01 | Q13-06 | 2+ roleId trong locked deck và có trap | Bốc giả trong locked deck, khác trueRoleId | CONFIRMED_OR_DERIVED |
| T131-06-02 | Q13-06 | Vai giả nằm ngoài locked deck | Không được trả vai ngoài locked deck | CONFIRMED_OR_DERIVED |
| T131-06-03 | Q13-06 | Cùng seed RNG và state | Trả cùng role giả và event log xác định | CONFIRMED_OR_DERIVED |
| T131-07-01 | Q13-07 | Prolong và seed cùng trên mục tiêu | Tôn trọng prolong trước | CONFIRMED_OR_DERIVED |
| T131-07-02 | Q13-07 | Prolong còn hiệu lực | Không kích hoạt hạt trước hạn | CONFIRMED_OR_DERIVED |
| T131-07-03 | Q13-07 | Prolong kết thúc và vẫn có chết hợp lệ | Mới xét kích hoạt hạt theo trạng thái còn lại | CONFIRMED_OR_DERIVED |
| T131-08-01 | Q13-08 | Mục tiêu đã có winGroup độc lập | Kết nạp thất bại | CONFIRMED_OR_DERIVED |
| T131-08-02 | Q13-08 | Kết nạp thất bại và kiểm tra chat | Không cấp mới group giáo phái | CONFIRMED_OR_DERIVED |
| T131-08-03 | Q13-08 | Mục tiêu đã thuộc liên kết Cupid độc lập | Không ghi đè liên kết thắng nếu đây là nhóm độc lập | CONFIRMED_OR_DERIVED |
| T131-09-01 | Q13-09 | Kẻ Chết Thay + Sói Hòa Bình cancel vote | Tính diễn sai, trao Oscar | CONFIRMED_OR_DERIVED |
| T131-09-02 | Q13-09 | Vote bị hủy | Không tạo final valid votes | CONFIRMED_OR_DERIVED |
| T131-09-03 | Q13-09 | Nhiệm vụ Kẻ Vu Khống bị hủy vote | Không tự sử dụng Q13-09 để chốt kết quả khác | NEEDS_EDGE_RULE |
| T131-10-01 | Q13-10 | Chó Canh Gác cấp bảo vệ và #75 tấn công | Chủ chó là protector có thể chết theo | CONFIRMED_OR_DERIVED |
| T131-10-02 | Q13-10 | Thợ Rèn cấp khiên và #75 tấn công | Thợ Rèn là protector có thể chết theo | CONFIRMED_OR_DERIVED |
| T131-10-03 | Q13-10 | Một nguồn cấp 2 lớp khiên | Không có 2 death state transitions của cùng người | CONFIRMED_OR_DERIVED |
| T131-11-01 | Q13-11 | Sói Mù bị bẫy, domain >=2 nhãn | Trả nhãn khác thật trong domain | CONFIRMED_OR_DERIVED |
| T131-11-02 | Q13-11 | Classifier trả roleId thay vì class | Không sử dụng random class cho roleId | CONFIRMED_OR_DERIVED |
| T131-11-03 | Q13-11 | Thẩm Phán Linh Hồn #5 miễn nhiễu | Không trả kết quả sai từ trap | CONFIRMED_OR_DERIVED |
| T131-12-01 | Q13-12 | Mang hạt bị chết sơ bộ, Phù còn cứu | Tên có trong prompt cứu | CONFIRMED_OR_DERIVED |
| T131-12-02 | Q13-12 | Phù cứu thành công trước hạt | Không kích hoạt hibernation của death event đã được cứu | CONFIRMED_OR_DERIVED |
| T131-12-03 | Q13-12 | Phù không cứu, hạt hợp lệ | Sau các hiệu ứng kéo dài/ưu tiên mới chuyển ngủ đông | CONFIRMED_OR_DERIVED |
| T131-B01 | Q13-01;VH05;VH85 | Phù Thủy x2 với bình cứu và buff Nữ Tu | Một bình cứu có thể tối đa 2 lượt cứu theo VH05; không nhân vô hạn | CONFIRMED_OR_DERIVED |
| T131-B02 | Q13-01;VH74 | Sói bầy nhận x2 từ Nữ Tu | Không vượt 2 mục tiêu cắn đêm | CONFIRMED_OR_DERIVED |
| T131-B03 | Q13-02;SK-07 | AFK skill nhắm người sống bị Quản Ngục giam | Không random tù nhân từ ngoài ngục | CONFIRMED_OR_DERIVED |
| T131-B04 | Q13-02;PH-03 | AFK một hành động không có target | Không tăng bộ đếm AFK cộng dồn | CONFIRMED_OR_DERIVED |
| T131-B05 | Q13-03;VH04;REL-01 | Phục hồi link nhiều lớp và tạo link mới cùng pha | Phân biệt arbitration create vs restore theo quan hệ ưu tiên | CONFIRMED_OR_DERIVED |
| T131-B06 | Q13-04;VH71 | Sói Biến Hình sao chép kỹ năng đã tiêu hao | Giữ phe Sói, charges còn lại, không ghi đè initialRoleId | CONFIRMED_OR_DERIVED |
| T131-B07 | Q13-05;Q13-12 | Người giả chết sau cửa sổ Phù Thủy | Không có deathlink, nhưng có thể bị công bố đã chết và cấm hành động | CONFIRMED_OR_DERIVED |
| T131-B08 | Q13-06;Q13-11;VH84 | Bẫy soi aura, soi class và soi role trong cùng đêm | Mỗi kiểu kết quả có tập thay thế riêng; miễn nhiễu VH84 được giữ | CONFIRMED_OR_DERIVED |
| T131-B09 | Q13-07;Q13-12;VH26 | Người Lái Đò kéo dài cho mục tiêu có hạt và Phù cứu | Ưu tiên cứu hợp lệ rồi prolong/hạt đúng thời điểm, không tự trigger hạt trước hạn | NEEDS_CONDITIONAL_GUARDS |
| T131-B10 | Q13-08;VH55 | Giáo Chủ muốn hiến tế người đã có winGroup độc lập | Không có tư cách tín đồ vì kết nạp thất bại, không hiến tế như tín đồ | CONFIRMED_OR_DERIVED |
| T131-B11 | Q13-09;VH01 | Kẻ Chết Thay khi vote bị cancel và có 0 phiếu cuối | Không đủ >=2 phiếu, nhiệm vụ sai và cộng Oscar | CONFIRMED_OR_DERIVED |
| T131-B12 | Q13-10;SK-06;VH54 | Cắn tập thể chạm bẫy và Sói Điên Cuồng | Bẫy cắn chung chỉ chọn 1 đại diện theo VH54; không phản sát cả bầy | NEEDS_CONDITIONAL_GUARDS |
| T131-B13 | Q13-10;PH-01 | Chủ chó bị chết sau khi tạo bảo vệ và bị tác động bởi #75 | Không bỏ lịch sử nguồn của bảo vệ; chỉ 1 lần chuyển chết nếu vẫn thuộc tập chết | CONFIRMED_OR_DERIVED |
| T131-B14 | Q13-11;Q13-06 | Tập giá trị kết quả giả rỗng | Không bịa nhãn, log RULE_UNRESOLVED | NEEDS_CONDITIONAL_GUARDS |
| T131-B15 | Q13-12;VH83 | Người Buôn Bí gây chết ban ngày, dù mang hạt | Không gọi cứu ban đêm cho cái chết ngày | CONFIRMED_OR_DERIVED |
| T131-B16 | Q13-05;VH03;VH58 | Hibernating tham gia quân số khi xét thắng đặc biệt | Tính quân số theo phe, không tự kích hoạt thắng do false death | CONFIRMED_OR_DERIVED |

**Ghi chú:** Một số `NEEDS_CONDITIONAL_GUARDS` và `NEEDS_EDGE_RULE` không được đánh dấu đạt chỉ vì tài liệu có một kết luận một phần. Toàn bộ đều đang `SPEC_ONLY_NOT_EXECUTED`.
