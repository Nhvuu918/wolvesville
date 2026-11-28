# Character Implementation Matrix — 97 nhân vật

**Không đồng nhất:** 97 Codex ≠ 97 Skill Adapters ≠ 97 playable ≠ 97 competitive. Dữ liệu kiểm kê kế thừa là 145 nhánh; nhiều nhánh là audit composite.

## Tình trạng thực tế

- #25 Tiên Tri: `official.25.inspect-role`, kết quả vai chính xác, test pack giới hạn (2 hoặc 3 người).
- #74 Tiên Tri Huyền Bí: `official.74.inspect-role`, kết quả vai chính xác, test pack tương tự.
- #20 Sói Gai Độc: `OFFICIAL_CHAR_20_REACTIVE_INSPECTION` — **chỉ phản ứng khi bị #25/#74 soi**; tác dụng lên đêm tiếp theo. Không có action do #20 nộp. Nhánh bị bắn vẫn chưa triển khai.
- Còn lại 94 nhân vật: chỉ có dữ liệu Codex và bảng kiểm kê luật, **chưa có bộ Rule Adapter được phép bật**.
- Mọi nhân vật: `competitiveEligible=false` bởi thiếu Victory Resolver toàn diện và kiểm chứng tổ hợp.

## Danh sách đầy đủ

| ID | Nhân vật | Phe gốc | Nhánh kiểm kê | Thực thi hiện tại | Test deck | Competitive |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Sói Đạo Tặc | soi | 1 | NOT_IMPLEMENTED | False | False |
| 2 | Dorothy | dan | 1 | NOT_IMPLEMENTED | False | False |
| 3 | Sói Tiên Tri | soi | 1 | NOT_IMPLEMENTED | False | False |
| 4 | Người Buôn Bí | dan | 1 | NOT_IMPLEMENTED | False | False |
| 5 | Thẩm Phán Linh Hồn | dan | 2 | NOT_IMPLEMENTED | False | False |
| 6 | Đạo Diễn Tử Thần | phe3 | 4 | NOT_IMPLEMENTED | False | False |
| 7 | Diễn Viên Sát Nhân | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 8 | Kỵ Sĩ Không Đầu | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 9 | Thiên Sứ Tuyết | dan | 1 | NOT_IMPLEMENTED | False | False |
| 10 | Sói Kỹ Sư | soi | 1 | NOT_IMPLEMENTED | False | False |
| 11 | Thợ Rèn Cơ Khí | dan | 2 | NOT_IMPLEMENTED | False | False |
| 12 | Búp Bê Nguyền Rủa | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 13 | Fan Cuồng | phe3 | 4 | NOT_IMPLEMENTED | False | False |
| 14 | Ông Kệ Noel | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 15 | Thần Tình Yêu Hắc Ám | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 16 | Phù Thủy Cấm Kỵ | dan | 2 | NOT_IMPLEMENTED | False | False |
| 17 | Nữ Tu Huyết Thệ | dan | 2 | NOT_IMPLEMENTED | False | False |
| 18 | Sói Biến Hình | soi | 1 | NOT_IMPLEMENTED | False | False |
| 19 | Kẻ Mặc Cả Bóng Tối | phe3 | 7 | NOT_IMPLEMENTED | False | False |
| 20 | Sói Gai Độc | soi | 1 | IMPLEMENTED_RESTRICTED_PASSIVE_ONLY | True | False |
| 21 | Sói Khát Máu | soi | 1 | NOT_IMPLEMENTED | False | False |
| 22 | Người Giao Dịch | dan | 1 | NOT_IMPLEMENTED | False | False |
| 23 | Xạ Thủ Linh Hồn | dan | 3 | NOT_IMPLEMENTED | False | False |
| 24 | Quản Ngục | dan | 2 | NOT_IMPLEMENTED | False | False |
| 25 | Tiên Tri | dan | 1 | IMPLEMENTED_RESTRICTED_ACTION | True | False |
| 26 | Thầy Đồng | dan | 1 | NOT_IMPLEMENTED | False | False |
| 27 | Cupid | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 28 | Thằng Ngố | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 29 | Phù Thủy | dan | 2 | NOT_IMPLEMENTED | False | False |
| 30 | Sói Trắng | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 31 | Bảo Vệ | dan | 1 | NOT_IMPLEMENTED | False | False |
| 32 | Xạ Thủ | dan | 1 | NOT_IMPLEMENTED | False | False |
| 33 | Sói Lừa Gạt | soi | 2 | NOT_IMPLEMENTED | False | False |
| 34 | Sói Mộng Du | soi | 1 | NOT_IMPLEMENTED | False | False |
| 35 | Sói Gương | soi | 1 | NOT_IMPLEMENTED | False | False |
| 36 | Pháp Sư | dan | 2 | NOT_IMPLEMENTED | False | False |
| 37 | Ảo Thuật Gia | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 38 | Nhà Sưu Tầm Linh Hồn | phe3 | 6 | NOT_IMPLEMENTED | False | False |
| 39 | Kẻ Trộm Chó | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 40 | Hoàng Hậu | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 41 | Cupid Hắc Ám | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 42 | Cặp Đôi Ngoại Tình | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 43 | Sói Bắn Tỉa | soi | 1 | NOT_IMPLEMENTED | False | False |
| 44 | Sói Cuồng Yêu | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 45 | Người Cầu Nguyện | dan | 1 | NOT_IMPLEMENTED | False | False |
| 46 | Hắc Tinh | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 47 | Bạch Sát | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 48 | Sói Thủ Lĩnh | soi | 1 | NOT_IMPLEMENTED | False | False |
| 49 | Sói Ảo Ảnh | soi | 1 | NOT_IMPLEMENTED | False | False |
| 50 | Sói Gây Tê | soi | 1 | NOT_IMPLEMENTED | False | False |
| 51 | Người Lái Đò | dan | 2 | NOT_IMPLEMENTED | False | False |
| 52 | Chó Canh Gác | dan | 1 | NOT_IMPLEMENTED | False | False |
| 53 | Thiên Thần | dan | 2 | NOT_IMPLEMENTED | False | False |
| 54 | Người Canh Gác | dan | 2 | NOT_IMPLEMENTED | False | False |
| 55 | Sói Thạch | soi | 1 | NOT_IMPLEMENTED | False | False |
| 56 | Kỹ Nữ | dan | 1 | NOT_IMPLEMENTED | False | False |
| 57 | Kẻ Biến Hình | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 58 | Thám Tử Ác Ma | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 59 | Ná Thủ | dan | 1 | NOT_IMPLEMENTED | False | False |
| 60 | Người Gọi Hồn | dan | 2 | NOT_IMPLEMENTED | False | False |
| 61 | Thiện Xạ | dan | 2 | NOT_IMPLEMENTED | False | False |
| 62 | Kẻ Xúi Giục | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 63 | Người Gắn Cờ | dan | 2 | NOT_IMPLEMENTED | False | False |
| 64 | Người Rung Chuông | dan | 1 | NOT_IMPLEMENTED | False | False |
| 65 | Sói Độc Tố | soi | 1 | NOT_IMPLEMENTED | False | False |
| 66 | Người Gác Đêm | dan | 1 | NOT_IMPLEMENTED | False | False |
| 67 | Thợ Rèn | dan | 2 | NOT_IMPLEMENTED | False | False |
| 68 | Sói Trẻ | soi | 1 | NOT_IMPLEMENTED | False | False |
| 69 | Sói Mèo | soi | 1 | NOT_IMPLEMENTED | False | False |
| 70 | Sói Lừa Đảo | soi | 1 | NOT_IMPLEMENTED | False | False |
| 71 | Sát Nhân Ảnh Thuật | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 72 | Sói Pháp Sư | soi | 1 | NOT_IMPLEMENTED | False | False |
| 73 | Sói Lửa | soi | 1 | NOT_IMPLEMENTED | False | False |
| 74 | Tiên Tri Huyền Bí | dan | 1 | IMPLEMENTED_RESTRICTED_ACTION | True | False |
| 75 | Sói Điên Cuồng | soi | 1 | NOT_IMPLEMENTED | False | False |
| 76 | Sói Ác Mộng | soi | 1 | NOT_IMPLEMENTED | False | False |
| 77 | Thợ Săn Quái Thú | dan | 1 | NOT_IMPLEMENTED | False | False |
| 78 | Nhà Thiên Văn Học | dan | 2 | NOT_IMPLEMENTED | False | False |
| 79 | Sói Hòa Bình | soi | 1 | NOT_IMPLEMENTED | False | False |
| 80 | Nghệ Sĩ Vĩ Cầm | dan | 1 | NOT_IMPLEMENTED | False | False |
| 81 | Sói Mù | soi | 1 | NOT_IMPLEMENTED | False | False |
| 82 | Nhà Giả Kim | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 83 | Sói Chiêu Hồn | soi | 1 | NOT_IMPLEMENTED | False | False |
| 84 | Phù Thủy Câm | dan | 1 | NOT_IMPLEMENTED | False | False |
| 85 | Thầy Thôi Miên | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 86 | Sói Con | soi | 1 | NOT_IMPLEMENTED | False | False |
| 87 | Dược Sĩ | dan | 2 | NOT_IMPLEMENTED | False | False |
| 88 | Thợ Săn | dan | 1 | NOT_IMPLEMENTED | False | False |
| 89 | Người Khai Mệnh | dan | 1 | NOT_IMPLEMENTED | False | False |
| 90 | Giáo Chủ | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 91 | Huyết Chủ | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 92 | Huyết Bộc | phe3 | 3 | NOT_IMPLEMENTED | False | False |
| 93 | Sói Lưu Đày | phe3 | 1 | NOT_IMPLEMENTED | False | False |
| 94 | Kẻ Giải Nguyền | phe3 | 2 | NOT_IMPLEMENTED | False | False |
| 95 | Người Hái Thuốc | dan | 3 | NOT_IMPLEMENTED | False | False |
| 96 | Thầy Thuốc | dan | 3 | NOT_IMPLEMENTED | False | False |
| 97 | Thần Thảo Hồi Sinh | dan | 1 | NOT_IMPLEMENTED | False | False |


## Thứ tự triển khai có kiểm soát

1. Duy trì và mở rộng test deck #20/#25/#74, bổ sung edge replay/visibility, không tự mở competitive.
2. Xây dựng lớp lịch sử chết/phân giải sát thương/protection provenance, chỉ sau khi có acceptance tests từ nguồn (VH08, VH42, SK-06, Q13-10).
3. Chọn nhóm vai có nguồn đơn nghĩa và ảnh hưởng phạm vi hẹp; mỗi role pack phải xác nhận **toàn bộ nhánh xuất hiện trong deck**, không chọn chỉ vì dễ lập trình.
4. Nâng dần các nhóm thời gian/khóa, thông tin, tài nguyên, chuyển vai, chết/hồi sinh, liên kết và thắng; khóa tuyệt đối các tác động cạnh tranh khi chưa đủ predicate.

CSV chi tiết: `data/rule-intelligence/character_matrix.csv`. Mã nhánh/nguồn/test và giới hạn nằm ở `characters_97.json` + `skills_145.json`.
