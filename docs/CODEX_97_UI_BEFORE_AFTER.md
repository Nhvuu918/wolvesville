# Codex — UI/UX trước và sau

| Tiêu chí | Trước Sprint 03 Codex | Bản cập nhật |
|---|---|---|
| Mở Bách khoa | Mặc định phạm vi 52 vai, badge tĩnh `52 / 97` | Mặc định 97/97, kiểm tra dữ liệu; badge động |
| Wheel | Tarot Dark Fantasy, 12 thẻ, ID trong nhãn/ảnh | Giữ nguyên sân khấu, 12 thẻ; bỏ ID trong nhãn, mask chân artwork |
| Grid | Danh sách panel chật 2 cột | Lưới ảnh 4/3/2 cột theo desktop/tablet/mobile, lazy image |
| Tìm kiếm | Có tìm theo ID/mô tả, không ưu tiên dấu Việt | Tên nhân vật có dấu hoặc không; không expose ID trong UI |
| Lọc | Phe/nhóm 52; bộ đếm sai | Phe chính thức, yêu thích, xóa lọc, số vai động |
| Thẻ | ID + tên + phe + aura + nhãn 52 | Chỉ artwork, tên và phe; click xem chi tiết |
| Chi tiết | Raw JSON label, fact inferred, ví dụ giả định, nút đổi vai demo | Tên, phe, aura, mô tả `desc` chính thức từ nguồn; favorite |
| Nguồn lỗi | Có thể nhìn thấy danh mục prototype cũ | Không cho hiển thị Codex nếu 97 role invalid; lỗi rõ, retry |
| Artwork | 100 ảnh SVG phê duyệt, có ID ở chân | Dùng nguyên file gốc; mask vùng footer trong Codex (không sửa SVG) |
| Chuyển động | Wheel chuyển động | Bảo toàn Wheel, tôn trọng reduced motion |

Báo cáo E2E có ảnh `reports/codex_desktop_wheel.png`, `reports/codex_desktop_grid.png`, `reports/codex_mobile.png`. Hình chụp ở browser thật, dùng backend thật; ảnh SVG được tải từ backend qua bridge trong môi trường sandbox (không tạo minh họa mới).
