# Human QA Pack — v1.7.17-s15-owner-bb-wip

Cả hai QA flags tắt: `WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev` sau `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`. Mỗi người dùng browser profile độc lập. Chưa có kết quả người dùng. Candidate B/B không có endpoint công khai; không yêu cầu thử cơ chế mới trên website. Các ca này kiểm tra hồi quy trải nghiệm 1.3.3.

## QA-BB-01 (HIGH): Normal guard, 4 tài khoản
- Bộ [25,31,48,74]. Bảo Vệ tự bảo vệ ở đêm 1, Sói cắn cả hai Tiên Tri hoặc cắn Bảo Vệ + một Tiên Tri. Chọn nhánh sau nếu muốn kiểm tra đêm tiếp. Kết thúc đêm; với nhánh Bảo Vệ + một Tiên Tri, Bảo Vệ sống, Tiên Tri bị loại. Bỏ vote hoặc hòa, đến đêm 2, không được bảo vệ bản thân liên tiếp. Refresh và reconnect, kiểm tra quyền và trạng thái. Nếu còn trận, bỏ bảo vệ một đêm rồi tự bảo vệ lại.
- Expected: đúng nạn nhân, cooldown rõ, không mất vai/phase, không lộ vai của người khác. Impact: #31/#48, deck finite contract. Evidence: ảnh danh sách mục tiêu trước và sau đêm, mô tả nếu sai. Dừng ở phase lỗi, không cần đọc code.

## QA-BB-02 (HIGH): Thầy Đồng, 3 tài khoản (chỉ QA local)
- Dừng server Normal. `WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 npm run dev`. Bộ [8,26,74]. Kỵ Sĩ loại Tiên Tri Huyền Bí, không treo cổ ai, đêm tiếp Thầy Đồng chat với người chết. Người chết trả lời, Kỵ Sĩ không có quyền đọc. Refresh cả hai tài khoản, hồi sinh và kiểm tra chat đóng, người hồi sinh được dùng kỹ năng vào đêm hợp lệ.
- Expected: danh tính Thầy Đồng không trực tiếp xuất hiện ở phía người chết, không mất tin/role khi reconnect. Impact: VH77/VH73, privacy. Evidence: ảnh giao diện ở hai tài khoản (che token/mật khẩu). Định danh có thể suy ra từ thành phần nhỏ; kiểm tra tiết lộ trực tiếp chứ không đòi ẩn suy luận.

Gửi PASS / FAIL / KHÁC KỲ VỌNG / CHƯA RÕ / CẦN CẢI THIỆN UX, kèm mã QA và mô tả. Human QA không thay automated acceptance.

Kiểm thử kỹ thuật tự động của profile B/B: `npm run test:15:owner-bb`. Cờ lab do test đặt; không bật cờ trong web production. Các kết quả candidate không tính vào R/F/S/A/B/C.
