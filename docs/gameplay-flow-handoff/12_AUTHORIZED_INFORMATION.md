# Authorized Information Matrix

| Thông tin | Người gửi/Chính mình | Người khác cùng phòng | Người ngoài phòng | Ghi chú |
|---|---|---|---|---|
| Public profile và tên phòng | Có | Có | Theo room list có auth | Public Player ID khác Character ID |
| Vai ban đầu/current | Chỉ chính mình | KHÔNG | KHÔNG | `projectState()` giữ `self` riêng |
| RNG seed / Engine archive | KHÔNG | KHÔNG | KHÔNG | Chỉ server / persistence |
| Trạng thái phase / round | Có | Có | KHÔNG | Game membership + token |
| Accepted skill outcome #25/#74 | Chỉ người soi | KHÔNG | KHÔNG | `ROLE_OBSERVED` private |
| Kết quả #79 soi mục tiêu | Chỉ #79 trong bộ bài đóng | KHÔNG | KHÔNG | Hiện bộ bài một Sói; các bộ nhiều Sói cần ACL bổ sung |
| Lựa chọn phiếu | Chỉ người bỏ phiếu | KHÔNG | KHÔNG | Event/player projection private |
| Tổng số đã gửi phiếu | Có | Có | KHÔNG | Không phải tally/winner |
| Vote bị #79 hủy | Có | Có | KHÔNG | Room event, không tiết lộ target bị soi |
| Game replay verification | Có (thống kê) | Có (thống kê) | KHÔNG | Không gửi event ledger nội bộ |
| Winner/Elimination | KHÔNG | KHÔNG | KHÔNG | **Không có kết quả để hiển thị** |

**Frozen ACL:** private event recipient được chốt ở commit. Không recompute team audience sau khi chuyển phe. **Refresh/WS:** client đồng bộ từ server-provided projection; không sử dụng `localStorage` hoặc animation làm nguồn trạng thái chuẩn. **No pre-commit broadcast:** action mới ACCEPTED không được gửi kết quả cho cả phòng.
