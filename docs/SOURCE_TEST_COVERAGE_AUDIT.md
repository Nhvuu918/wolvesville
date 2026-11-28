# TEST_COVERAGE_AUDIT — 207 test specification

> **207 là mô tả dự kiến, không phải 207 test đã được thực thi.** Đã đọc trực tiếp 155 JSON từ v1.3 và 52 JSON từ v1.3.1. Không sử dụng test dự án LPTV.

- **Test IDs duy nhất:** 207/207.
- **Engine executed / passing:** 0/207 / chưa triển khai, không được suy thành thất bại hay thành công.
- **Mỗi test có expected text:** 207/207. Tuy nhiên nhiều expected là điều kiện/`RULE_UNRESOLVED`, không phải expected final state có thể tự động so sánh.

## 1. Kiểm toán tính chắc chắn của expected

| Nhãn expected_status | Số test | Ý nghĩa |
|---|---:|---|
| `CONDITIONAL` | 9 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |
| `CONFIRMED` | 25 | Chỉ mới là test spec; chưa kiểm thử thực tế. |
| `CONFIRMED_OR_DERIVED` | 48 | Chỉ mới là test spec; chưa kiểm thử thực tế. |
| `DEFINED_OR_UNRESOLVED_AS_SOURCE` | 35 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |
| `DERIVED` | 20 | Chỉ mới là test spec; chưa kiểm thử thực tế. |
| `DERIVED_CONDITIONAL` | 32 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |
| `NEEDS_CONDITIONAL_GUARDS` | 3 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |
| `NEEDS_EDGE_RULE` | 1 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |
| `SPEC_OR_CONFIRMED` | 22 | Chỉ mới là test spec; chưa kiểm thử thực tế. |
| `UNRESOLVED` | 12 | Có điều kiện/đang thiếu rule; chưa thể lấy làm golden-state assertion. |

**Có 92 test mang nhãn cần điều kiện/chưa xác định** theo bộ lọc thận trọng; các nhãn nguồn còn có trường hợp mơ hồ dù không nằm bộ lọc.

## 2. Truy vết luật theo mã nguồn trực tiếp

- **19/85 VH** chưa được trỏ bằng mã VH trong 207 test: `VH02`, `VH06`, `VH10`, `VH18`, `VH21`, `VH22`, `VH36`, `VH37`, `VH39`, `VH44`, `VH52`, `VH60`, `VH61`, `VH63`, `VH64`, `VH67`, `VH77`, `VH78`, `VH79`.
- **19/118 quyết định** chưa được trỏ trực tiếp bằng ID trong 207 test; xem toàn bộ trong `RULE_TRACEABILITY_MATRIX.xlsx`.
- Chưa có test trỏ bằng mã VH **không có nghĩa chắc chắn chưa kiểm tra hiệu ứng**: ví dụ test có thể tham chiếu `JSON#...` hoặc code Q13. Đây là lỗ hổng truy vết, không phải chứng minh thiếu hành vi test.
- Ngược lại, một test trỏ tên rule **không bảo đảm** đã kiểm tra đủ biến thể của rule đó. Không coi số link là % branch coverage.

## 3. Độ bao phủ theo cơ chế (heuristic index)

| Nhãn cơ chế v1.3 | Nhánh skill kiểm kê | Nhánh bị chặn | Test liên hệ | Scenario liên hệ |
|---|---:|---:|---:|---:|
| `AT` | 79 | 44 | 120 | 85 |
| `BL` | 30 | 15 | 60 | 42 |
| `CH` | 24 | 18 | 69 | 46 |
| `DF` | 74 | 35 | 101 | 72 |
| `IN` | 36 | 19 | 67 | 46 |
| `LK` | 34 | 32 | 53 | 40 |
| `NO` | 12 | 7 | 37 | 26 |
| `OP` | 12 | 6 | 35 | 28 |
| `RF` | 6 | 4 | 7 | 7 |
| `RN` | 14 | 12 | 16 | 10 |
| `RS` | 64 | 25 | 113 | 73 |
| `RV` | 28 | 15 | 61 | 43 |
| `TM` | 31 | 14 | 70 | 50 |
| `TR` | 37 | 30 | 57 | 44 |
| `VT` | 28 | 24 | 40 | 31 |
| `WC` | 39 | 38 | 63 | 48 |

**Diễn giải:** Một nhánh có thể mang nhiều nhãn, tổng các hàng không bằng số nhánh thực tế. Các nhãn cơ chế lấy từ bản chỉ mục heuristic v1.3, đã được đối chiếu chứ không mặc định là phân loại luật chính thức.

## 4. Chất lượng dữ liệu test hiện tại

- Bộ 35 `TC-*` giữ nguyên bản v1.2; trường `action` nhiều test chỉ viết “Theo tình huống Given/When trong v1.2” — chưa phải fixture độc lập có thể chạy.
- Bộ test mô phỏng `T-SC-*`, `T-MC-*`, `T-COV-*`: diễn giải kết quả theo natural language, nhiều `DERIVED_CONDITIONAL`/`UNRESOLVED`; cần golden `initialSnapshot`, `orderedCommands`, `rngDrawTape`, `expectedEvents`, `expectedState`.
- Nhóm `PROP-*`: rất hữu ích cho tính quyết định, idempotency và ACL, nhưng chưa có runner/execution evidence.
- Bộ `T131-*`: kiểm tra tốt 12 quyết định mới; `T131-09-03` ghi NEEDS_EDGE_RULE (Kẻ Vu Khống), và `T131-B14` ghi domain rỗng.
- Một số test kế thừa từ v1.3 đang dùng ngôn từ “Q13 đang chờ” trong phần đặc tả/narrative; phải gắn overlay v1.3.1 mới, không chạy lại expected cũ.

## 5. Các vấn đề test cụ thể cần sửa trước khi viết test runner

| Ref | Lý do cần hiệu chỉnh | Hướng sửa (không thay luật) |
|---|---|---|
| `T-MC-04`, `T-MC-33`, `T-COV-03`, `T-COV-35` | Dùng sai Tiên Tri #25 chỉ xem aura; JSON và xác nhận Wolvesville 21/11 ghi xem vai trò | Sửa expected theo `role` với hiệu ứng tương ứng; 4 scenario `MC-04`, `MC-33`, `COV-03`, `COV-35` cũng phải hiệu chỉnh |
| `T131-B14` | RNG trả sai khi tập giả rỗng chưa có luật cuối | Assert `RULE_UNRESOLVED`, không assert tên vai tự tạo |
| `T131-09-03` | Hủy vote Kẻ Vu Khống chưa có kết quả | Giữ blocked fixture, không tự gán Oscar |
| `T-COV-34` | Bảo trì chống khóa cần ghi rõ lệnh nào đã resolve tại thời điểm bảo trì | Thêm DAG seed/priority |
| `TC-01` | Action string là tham chiếu mơ hồ “theo tình huống” | Thay bằng command exact + expected event |
| `PROP-08` | Replay RNG cần dữ liệu draw ổn định | Khóa domain/seed/algorithm và expected outcome |

- 4 test trỏ alias `QA NVxx`: `T-COV-03`, `T-COV-08`, `T-COV-16`, `T-COV-20`; xuất xứ gián tiếp từ bảng câu hỏi chưa được xác thực độc lập, **không coi là rule authority**.
- 19 test trỏ alias `SYS-xx` chưa ánh xạ vào 118 quyết định; chỉ được xem là tham chiếu test lịch sử, chưa đạt truy vết.

## 6. Kế hoạch kiểm thử thực thi

1. **Core properties:** determinism, idempotency, phase-clock, snapshots, ACL; không cần skill pack hoàn chỉnh.
2. **Rule validators:** startup 97 unique, resource ledger, link priority và target eligibility.
3. **Golden role vectors:** role có thể triển khai với constraints; test cả success/failure/exception + resource rollback.
4. **Blocked role vectors:** có expected `RULE_UNRESOLVED`, không có expected game result giả.
5. **Integration:** nhiều vai (3–5), ngẫu nhiên, vote, win checkpoint, chat visibility, reconnect.
6. **Mutation/metamorphic:** đảo thứ tự packet mạng, duplicate events, đổi seed có ghi tape, property không leak role.

## 7. Quy tắc đánh giá coverage
Sau khi có code chỉ báo `pass-rate` cho test đã chạy; báo `role-implemented / role-total`, `skill-implemented / branches`, `rule-directly-tested / rules`, `interaction-edges-verified`, `scenario-closure-complete`, `ACL negative test coverage`. Hiện tại **không có số liệu execution coverage**.