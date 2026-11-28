# Interaction Matrix — phân biệt sàng lọc và thực thi

- Tổng số cặp không thứ tự trong 97 vai: **4656**.
- Cặp có ít nhất một kịch bản nguồn đề cập trực tiếp cùng hai ID (từ 207 spec, không đồng nghĩa đủ luật): **203**.
- Cặp có kết quả triển khai và kiểm thử trong **bộ vai được khóa**: **3** (`20–25`, `20–74`, `25–74`).
- Phần còn lại không có `resolvedOutcome`; test spec chỉ là gợi ý ưu tiên phân tích, không thay được test thực thi.

| Cặp | Căn cứ | Kết quả trong deck được phép | Giới hạn |
|---|---|---|---|
| #20 ↔ #25 | `JSON#20`, `JSON#25`, `T-COV-20` | #25 thấy vai #20 theo private projection; #25 bị mất kỹ năng đêm N+1 | Không có #32 bắn, không có đa sát thương |
| #20 ↔ #74 | `JSON#20`, `JSON#74`, `VH08` | #74 thấy vai #20; áp phản ứng chấn thương next-night | DERIVED từ hai nguồn rõ; không có bẫy/nhiễu |
| #25 ↔ #74 | `JSON#25`, `JSON#74` | Mỗi vai có thể soi đối phương, private | Không tính kết quả thắng, không xét các vai gây méo thông tin |

Các bài test mới gọi HTTP/Engine thật, kiểm tra idempotency, state round N→N+1→N+2, SQLite restart, Event Log và Replay. Event `OFFICIAL_INJURY_SCHEDULED` là `SERVER_INTERNAL`; không phát công khai nguyên nhân.

**Dữ liệu chi tiết:** `data/rule-intelligence/interaction_pairs_4656.json` và `.csv`. Trường `interactionStatus` phân biệt `IMPLEMENTED_RESTRICTED_TESTED`, `SOURCE_SCENARIO_SPEC_ONLY`, `UNDETERMINED_NO_DIRECT_PAIR_SCENARIO`. Chưa thực hiện resolution toàn bộ 4.656 cặp.
