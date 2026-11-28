# Sprint 04 — QA Evidence & Acceptance

## Automated Tests đã chạy trong môi trường hiện tại

| Bộ | Tổng | PASS | FAIL | SKIPPED |
|---|---:|---:|---:|---:|
| Sprint 03 baseline group A | 107 | 102 | 0 | 5 PostgreSQL |
| Sprint 03 final hardening group B | 12 | 12 | 0 | 0 |
| Sprint 04 mới | 13 | 13 | 0 | 0 |
| **Tổng** | **132** | **127** | **0** | **5** |

Lệnh đã chạy: `npm run test:04:all` → exit code **0**. TypeScript `npm run build` PASS, `npm run verify:source` PASS. Phạm vi bài mới: KB provenance, 97 vai/118 quyết định/145 nhánh/207 spec, 4.656 pair screening, source SHA, cùng 4 HTTP/Engine/SQLite tests cho #20.

### Browser E2E

Năm file `browser_lobby_e2e.py`, `browser_codex_e2e.py`, `browser_demo_e2e.py`, `browser_e2e.py`, `browser_ux_e2e.py` đã in PASS khi chạy với **backend SQLite thật** (mỗi file được xác nhận trong lượt độc lập), gồm thay đổi phòng, Demo, Codex, skill result, reconnect. Browser gameplay và UX chạy độc lập đã **exit code 0**. Tuy nhiên, bộ runner gộp từng bị treo/chạm timeout khi đóng Chromium/Playwright, vì vậy **runner gộp chưa được nghiệm thu ổn định**, không gọi là full suite PASS trên một lệnh duy nhất.

### PostgreSQL

**PENDING:** không có PostgreSQL live/`DATABASE_URL` trong môi trường kiểm thử này, năm bài liên quan báo **SKIPPED** ở chế độ tổng hợp. Không có chứng cứ để tuyên bố PostgreSQL PASS. Dùng `npm run test:pg:acceptance` trên Mac PostgreSQL 16 với `DATABASE_URL` hợp lệ; khi thiếu URL, acceptance phải FAIL, không SKIP. Không reset volume hoặc xóa database cũ.

### Legacy test specification

207 bản ghi cũ vẫn chỉ là SPEC, không tính vào 132 automated tests. `T-COV-20` chỉ hỗ trợ suy luận và làm cơ sở thiết kế test mới; bài test mới không thay thế kịch bản #32 bắn chưa có adapter. Ba legacy tests giả định sai loại kết quả #25 đã được ghi vào `test_conflicts.json` và **không bị sửa để lấy PASS**.

## Readiness theo module

| Hạng mục | Kết luận | Bằng chứng |
|---|---|---|
| Source integrity | GO | SHA + verify:source |
| Engine kernel / auth / Lobby / Codex | GO trong phạm vi kiểm thử | 114 regression PASS |
| Restricted official inspection pack | GO — TEST ONLY | 4 reactive tests + 6 inherited official tests |
| Rule Knowledge Base | GO — developer offline | 9 tests KB/runtime, command query |
| Browser individual flows | GO theo từng kịch bản | log/browser runs (tổng hợp có timeout) |
| PostgreSQL live | PENDING | 5 skipped |
| Victory logic 97 roles | NOT READY | No full victory resolver |
| Competitive 97 | NO-GO | Chưa có role pack đầy đủ và predicates |

### Negative PostgreSQL acceptance (không phải PostgreSQL live PASS)

Đã chạy `env -u DATABASE_URL npm run test:pg:acceptance`: **exit code 1; 5 FAIL, 0 SKIPPED**. Đây là kết quả **đúng** của bài kiểm tra thiếu cấu hình trong chế độ bắt buộc, không phải chứng cứ rằng transaction PostgreSQL hoạt động. Log: `reports/SPRINT04_POSTGRESQL_NEGATIVE_CONFIG.log`. PostgreSQL thật vẫn **PENDING**.
