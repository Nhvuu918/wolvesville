# IMPLEMENTATION_READINESS_REPORT — Wolvesville v1.3.1

## Kết luận triển khai

**GO CÓ GIỚI HẠN cho hạ tầng Game Engine; NO-GO cho Game Engine đầy đủ 97 nhân vật ở mức luật thực thi.**

Không viết Game Engine trong đợt kiểm toán này. Đánh giá dựa trên đúng hồ sơ mới nhất và hai tầng test specification.

## Chứng cứ nguồn

- `character.json`: 97 bản ghi, SHA-256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`. Bản lưu v1.3.1 trùng byte-for-byte.
- 85 VH; 21 quyết định v1.2; 12 Q13 v1.3.1 = 118 (không tự tính các mã lịch sử P05/V02/V03/W04 vào 118).
- 155 + 52 = 207 test specifications, **0 test thực thi**; có 116 kịch bản nguồn v1.3/v1.3.1 (98+18), không phải 116 mô phỏng engine đã chạy.
- Các quy tắc lấy từ lịch sử P05/V02/V03/W04 chỉ khôi phục được bản tóm tắt quyết định trong ngữ cảnh cá nhân; chưa đọc bản hội thoại gốc đầy đủ trong đợt này. Đánh dấu provenance “summary”.
- Không đọc hoặc nhập tệp LPTV/Ma_Soi; chỉ dùng artifact mang tên Wolvesville, character.json và quyết định người dùng.

## Bảng readiness phân tầng

| Hạng mục | Đánh giá | Gate |
|---|---|---|
| Source registry + checksums | Sẵn sàng | **GO** |
| Schema Match/Participant/Skill/Effect/Event/RNG | Có đặc tả đủ cho interface, cần code contract | **GO — design/implementation framework** |
| Deterministic resolver core, dependency graph, idempotency, visibility projection | Có thể viết cơ sở không gắn rule cụ thể | **GO — isolation + fail-closed** |
| Core validators: phase, ACL, initial unique role, charge, AFK target filtering | Có các luật đã chốt, riêng nhánh edge cần guard | **GO — constrained** |
| Role-specific skill packs | Chưa có machine contracts đầy đủ mọi nhánh, còn xung đột chat #51 + effect inversion #10 | **NO-GO all-97** |
| Full win condition/ranking for independent teams | Chưa chứng minh đủ end predicates | **NO-GO competitive matches** |
| 207 test implementation | Chỉ có mô tả, không runner/fixtures | **NOT STARTED** |

## Readiness vai và skill (đánh giá bảo thủ, không phải tỷ lệ % code)

| Phân loại role | Số vai | Diễn giải |
|---|---:|---|
| `IMPLEMENTABLE` | 0 | Không có vai đạt đủ chứng cứ machine-executable end-to-end. |
| `IMPLEMENTABLE_WITH_CONSTRAINTS` | 52 | Một số nhánh chức năng có thể triển khai cô lập với guard và test. |
| `BLOCKED_BY_RULE` | 44 | Thiếu business predicate/interaction cho khả năng hoàn chỉnh. |
| `BLOCKED_BY_SOURCE` | 0 | Không áp vì 97 vai có mô tả gốc; không đồng nghĩa đủ luật. |
| `CONFLICTING` | 1 | Mâu thuẫn nguồn quyền chat #51 với chính sách hai ngoại lệ. |

**Nhánh kỹ năng kiểm kê (kỹ thuật):** 145 nhánh, số nhánh và nhãn được tách từ mô tả gốc, **không phải tổng skill ID chính thức của trò chơi**.

## Release gates đề xuất

### G0 — Không thay nguồn & truy vết (đạt)
- 97 role JSON, SHA, 118 decisions giữ nguyên, phản ánh v1.3.1 mà không downgrade.

### G1 — Engine kernel không phụ thuộc luật chi tiết (cho phép bắt đầu)
- Thư viện state + command/event contracts; deterministic replay; RNG tape; event causality; revision/idempotency; ACL; phase scheduler.
- Các thao tác thiếu luật phải bị từ chối/block theo branch với reason code, tuyệt đối không thắng/thua bằng mặc định.

### G2 — Constrained role packs có phủ test (được bắt đầu theo nhánh)
- Ưu tiên các nhánh dữ liệu rõ: role assignment 97 unique, AFK hợp lệ, vote pipeline, resource ledger VH05/VH85/Q13-01, lock pending commands VH10/VH41, Soi aura/source schema, ngục, cắn bầy 2 mục tiêu, link scheduler trước khi gắn loại phức tạp.
- Không triển khai các role có sẵn `CONFLICTING` hoặc `BLOCKED_BY_RULE` khi predicate còn thiếu.

### G3 — Full game competitive (chưa đạt)
- Mọi vai được biến thành `SkillRule` máy thực thi với target/cost/priority/status/win predicates đầy đủ.
- Tất cả rule quan trọng có golden fixtures và test chạy pass; không còn `RULE_UNRESOLVED` có thể ảnh hưởng thắng trong cấu hình được cho phép.
- Kiểm thử 3–5 vai, deathlink/react chain, recovery, seed/cure, source protection, chat ACL, replay.

## Rủi ro blocker trước khi khóa full engine

| Mức | Vấn đề | Kiểm soát tức thời |
|---|---|---|
| P0 | `F21` bốn test QA alias + `F22` 19 test SYS alias | Không dùng mã nguồn không xác minh để tạo expected luật |
| P0 | `F13` bốn test Tiên Tri #25 sai loại observation | Giữ JSON xem vai trò; viết lại expected trước khi đưa vào runner |
| P0 | `F03` hạt Thần Thảo sau Phù cứu | Chặn event tiêu hạt chưa xác định, đừng tự trừ |
| P0 | `F05` đảo ngược arbitrary skill Sói Kỹ Sư | Chỉ whitelist pairing có luật riêng |
| P0 | `F06/F07` link/victory predicates | Chỉ bật role packs đã có win conditions được xác minh |
| P0 | `F01` #51 chat với người chết | Chặn nhánh chat; không áp sai VH77/79 |
| P1 | `F04` Kẻ Vu Khống vote bị hủy | Test `RULE_UNRESOLVED` theo role/task, không gán Oscar |
| P1 | `F02` false result domain rỗng | Không random ngoài locked deck |
| P1 | 207 test chỉ là spec | Viết fixture schema và runner trong sprint code tương lai |

## Khuyến nghị người phụ trách

**Cho phép mở Sprint G1** sau khi chốt contract kỹ thuật nhưng **không tuyên bố đã được phép cho chạy trận đầy đủ 97 vai**. Chỉ nâng từng role pack qua gates khi có nguồn, expected state và test execution. Không tự tạo vòng xác nhận luật mới khi chưa có ví dụ thực sự đụng blocker.