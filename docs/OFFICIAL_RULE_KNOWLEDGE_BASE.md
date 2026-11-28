# Official Rule Knowledge Base — v0.6.0

## Mục đích

Đây là **công cụ developer**, không phải nguồn dữ liệu trả về client. Phân biệt quyền phát triển kỹ thuật với quyền ban hành luật. Mọi record đều có `source` và trạng thái xác minh **độc lập** với trạng thái triển khai.

## Dữ liệu có thể truy vấn

| Registry | Số lượng | Tính chất |
|---|---:|---|
| `rules_118.json` | 118 | Các quyết định CONFIRMED; không tự điền các trường chưa có luật |
| `skills_145.json` | 145 | Nhánh kiểm kê/audit, không đảm bảo atomic/đủ luật thực thi |
| `characters_97.json` | 97 | 97 vai, trạng thái Codex ≠ trạng thái chơi |
| `interaction_pairs_4656.json` | 4656 | Sàng lọc toàn bộ cặp khác nhau, không phải 4.656 kết quả thắng/thua |
| `inferences.json` | 2 | DERIVED, có chuỗi suy luận, không nâng thành CONFIRMED |
| `test_conflicts.json` | 3 | Giữ test nguồn nhưng khoanh vùng tiền đề/kỳ vọng sai |
| `unresolved.json` | 16 | Các vấn đề chưa thể tự quyết; bảo lưu căn cứ |
| `victory_coverage.json` | 1 | Gate điều kiện thắng chưa đạt |

**Độ bao phủ truy vết trực tiếp:** 101/118 quyết định được bảng kiểm kê kỹ năng gắn mã nguồn; 99/118 quyết định xuất hiện với mã tương ứng trong `sources` của 207 test spec. 19 quyết định thiếu mã trích dẫn test trực tiếp không đồng nghĩa không có test gián tiếp.

## Quy tắc trạng thái

`CONFIRMED` chỉ mô tả **bằng chứng văn bản được xác nhận**, không phải tất cả 15 điều kiện thực thi đã đầy đủ. `DERIVED` là suy ra trên các nguồn cụ thể; `AMBIGUOUS` khi nhiều cách hiểu; `MISSING` khi nguồn thiếu. `IMPLEMENTED` là **trạng thái kỹ thuật riêng**, chỉ công nhận sau mã nguồn + bài test thực thi trong **phạm vi đã kiểm tra**.

Một trường `null` có nghĩa **chưa có dữ liệu nguồn**, không phải lựa chọn mặc định. Các ghi chú `auditOnlyMetadata` là dữ liệu kiểm toán, tuyệt đối không đưa nguyên văn thành hành vi chính thức.

## API developer nội bộ

`backend/src/rule-intelligence/knowledge-base.ts` cung cấp `OfficialRuleKnowledgeBase.getRule()`, `.getCharacter()`, `.getInteraction()` và `.allowedInRestrictedOfficialTest()`; dữ liệu được trả bản sao và không đi qua API công khai. Rule Registry + Action Validator phía Engine **vẫn là cổng thực thi cuối**.

```bash
npm run rules:build
npm run rules:query -- rule VH03
npm run rules:query -- character 20
npm run rules:query -- interaction 20-25
npm run rules:query -- inference S04-I-02
npm run rules:verify
```

Nguồn đầu vào gốc không được generator sửa. Generator chỉ ghi vào `data/rule-intelligence/`. Hai mươi mốt quyết định v1.2 và mười hai Q13 vẫn giữ nguyên câu trả lời người dùng.
