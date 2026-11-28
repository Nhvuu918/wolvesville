# Rule Inference Report — Evidence Chain

**Nguyên tắc:** không hỏi lại luật đã có trong JSON/văn bản xác nhận; không nâng DERIVED thành CONFIRMED khi test PASS.

## Đã thực hiện

| Inference | Mức | Căn cứ | Test |
| --- | --- | --- | --- |
| S04-I-01 | DERIVED | ['data/character.json#25', 'data/character.json#20', 'data/rules/tests_207.json#T-COV-20'] | tests/official-reactive.test.mjs |
| S04-I-02 | DERIVED | ['data/character.json#74', 'data/character.json#20', 'VH08'] | tests/official-reactive.test.mjs |


### S04-I-01 — #25 soi #20

Nguồn: `character.json#20` ghi khi bị soi, người soi bị thương và mất khả năng ở đêm kế tiếp; `character.json#25` ghi kỹ năng soi vai từng đêm; `T-COV-20` có tiền đề trực tiếp #25 soi #20, nhưng là test specification CONDITIONAl. Kết quả suy ra trong deck đã khóa: người soi nhận kết quả vai theo quyền; trạng thái bị thương **không làm hủy action đang giải quyết**, chỉ chặn đêm kế tiếp. Tách biệt việc #32 bắn chưa triển khai.

### S04-I-02 — #74 soi #20

Nguồn: `character.json#74` mô tả chính xác hành động soi vai, #20 phản ứng với việc bị soi. Chỉ dùng khi không có vai bẫy/nhiễu nào trong bộ deck được cho phép. Không suy ra cơ chế hào quang, tiết lộ phe hoặc kết quả trái nguồn.

## Test/spec nguồn có tiền đề xung đột

| Test spec | Phát hiện | Xử lý |
| --- | --- | --- |
| T-MC-04 | Test expects aura, while #25 source describes exact role inspection; SPEC ONLY, must not be executable as written. | QUARANTINE_EXPECTED_RESULT |
| T-COV-03 | Test premise treats #25 as aura seer contrary to the original role-description. | QUARANTINE_PRECONDITION |
| T-MC-33 | Legacy narrative assumes #25 aura; other scenario assertions may be reusable if re-specified. | QUARANTINE_ROLE_ASSUMPTION |


Không sửa nội dung 207 test nguồn. Các spec có kỳ vọng “#25 soi hào quang” được đánh dấu cần viết lại test thực thi theo nguồn `character.json#25`, không đồng bộ sai lầm vào Engine.

## Chưa suy luận đủ căn cứ

Không tự chọn thứ tự tổng quát cho mọi cặp kỹ năng, không ép đa cấp bảo vệ, RNG tập rỗng, hiệu lực x2 hữu hạn hoặc điều kiện thắng phe ba thành câu trả lời. Các nhánh này tiếp tục có bản ghi và fail-closed.
