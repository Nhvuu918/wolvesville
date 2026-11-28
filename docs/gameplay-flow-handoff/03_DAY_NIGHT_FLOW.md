# Day/Night Flow

| Mốc | Trigger | Server event có thật | Trạng thái | Hành vi đồ họa |
|---|---|---|---|---|
| Đêm 1 | `GameCoordinator.start` | `PHASE_CHANGED:NIGHT_COLLECT` | IMPLEMENTED & TESTED | Chuyển nền đêm và hiện vai riêng |
| Nộp kỹ năng | HTTP/WS `actions` | `ACTION_ACCEPTED` nội bộ | IMPLEMENTED & TESTED | Nút “Đã nhận hành động”, **chưa hiện kết quả** |
| Kết đêm | Host `resolve` | `PHASE_CHANGED:NIGHT_RESOLVE/NIGHT_FINALIZE` | IMPLEMENTED & TESTED | Chỉ transition toàn khung; không tự tạo tử vong |
| Sáng | Engine commit | `PHASE_CHANGED:DAY_DISCUSS` | IMPLEMENTED & TESTED | Chuyển nền ngày, kết quả sau commit |
| Mở phiếu | Host `/voting-open` | `VOTING_OPENED` room public | IMPLEMENTED & TESTED | Xuất hiện chọn mục tiêu, đếm phiếu đã nộp |
| Nộp phiếu | Player `/votes` | `VOTE_INTENT_RECORDED` người gửi | IMPLEMENTED & TESTED | Đã ghi nhận, không công khai mục tiêu lựa chọn |
| Hủy vote | #79 action resolved | `VOTING_CANCELLED` room public | IMPLEMENTED & TESTED | Tắt UI bỏ phiếu, thông báo bị hủy |
| Sang đêm N+1 | PH-02 | `PHASE_CHANGED:NIGHT_COLLECT` | IMPLEMENTED & TESTED | Round tăng bởi Engine |
| Chốt treo cổ | Chưa có luật chung | không có | BLOCKED BY RULE | Không được phát hiệu ứng treo cổ |
| Công bố thắng | Chưa có endgame resolver | không có | BLOCKED BY RULE | Không hiển thị banner người thắng |

**Nguyên tắc:** vòng đêm→ngày không bị kích hoạt bởi animation frontend; chỉ cập nhật từ projection của server. Khi host dùng nút “Sang đêm sau (bỏ qua biểu quyết)” trong chế độ test, phải ghi rõ là **đường rút gọn kỹ thuật**, không được xem là voting thành công.
