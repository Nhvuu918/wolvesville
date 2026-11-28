# Sprint 05 — Implementation Backlog (không khởi động tự động)

1. **QA & Environment:** nghiệm thu PG live trên Docker Mac và sửa open-handle trong Browser suite gộp; lưu exit codes; đảm bảo không phá hủy DB.
2. **Rule Engine execution completeness:** thêm engine event dependency graph theo VH08, kiểm tra action lock PH-01/VH10/VH41 với timeline thật, mở rộng negative tests.
3. **Attack + Defense system:** mô hình provenance của người tạo lớp bảo vệ, thứ tự hấp thụ, sơ tử và tử thật; sau đó mới xét #31, #75, #77, #67, #29 theo các quy tắc VH/Q13 đã xác nhận; tránh khởi động chiến đấu khi chưa xác minh exception.
4. **Status lifetime:** mở rộng timed locks và status/event để đi qua nhiều phase; không tái sử dụng trực tiếp vết thương #20 cho #59 nếu phạm vi VH31 khác.
5. **Information variants:** kiểm toán nhóm soi phân loại, hào quang, soi vai chính xác (#3/#5/#35/#81/#80) với nguồn đủ nhãn hợp lệ; kiểm tra traps #10 Q13-06/Q13-11.
6. **Transformation and links:** implement only when target priority, relation precedence and end-of-chain (VH04/REL/Q13) are covered by tests.
7. **Victory service:** hợp nhất nhóm thắng độc lập, đồng thắng, quân số ngủ đông/hồi sinh, rồi xét những tổ hợp có predicate hoàn chỉnh. Chỉ mở competitive theo cấu hình được đánh giá cụ thể.

Mỗi cụm yêu cầu source → implementation contract → unit tests → role pack integration → replay/privacy → PostgreSQL → 2-client Browser E2E. Không sinh luật mới từ mục đích demo.
