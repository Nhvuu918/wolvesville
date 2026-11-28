# Sprint 03 Codex 97 — Test Execution Report

**Chạy trên container Node.js 22.16, TypeScript 5.8, Chromium và SQLite real backend.**

| Suite | Tổng | PASS | FAIL | SKIPPED | Mô tả |
|---|---:|---:|---:|---:|---|
| Baseline Sprint 03 Demo Hotfix | 87 | 82 | 0 | 5 | Trước thay đổi Codex, đã chạy |
| Codex tests mới | 9 | 9 | 0 | 0 | Data, validator, filter, UI source, static HTTP |
| Tổng sau sửa | **96** | **91** | **0** | **5** | `npm run test:03:codex` |
| Browser Codex E2E | 1 suite | PASS | 0 | 0 | Demo, Wheel, Grid, search, role filters, responsive, missing image, reduced motion, reconnect, logout |
| Browser gameplay cũ | 1 suite | PASS | 0 | 0 | 2 accounts, room, skill private, replay, reconnect |
| Browser Demo Auth cũ | 1 suite | PASS | 0 | 0 | 2 independent Demo sessions, WS, room, logout |
| Port conflict negative | 1 check | PASS (expected exit 1) | 0 | 0 | EADDRINUSE tiếng Việt, không kill process |
| PostgreSQL live acceptance | — | **CHƯA CHẠY** | — | — | Không có DATABASE_URL/server trong workspace |
| PostgreSQL missing-URL negative | 1 check | PASS về yêu cầu fail-safe | 0 | 0 | `test:pg:demo` exit 1 / FAIL, không SKIP khi required |

**Lưu ý:** Browser trong sandbox dùng Playwright Chromium thật và bridge truyền HTTP/WS tới backend live; bridge không tạo dữ liệu giả. `WV_E2E_DIRECT=1` trên Mac vẫn cần nghiệm thu riêng. Bộ 207 legacy test specification là tài liệu đặc tả, KHÔNG phải số bài đã chạy.

**Source audit:** `npm run verify:source` PASS, 97 nhân vật, 118 quyết định, 207 specs, 107 gốc được lưu nguyên; 105 runtime files gốc không đổi, 2 entrypoints thay đổi kỹ thuật.

**Kết luận:** Codex 97 + SQLite integration PASS; nghiệm thu tổng thể **PARTIAL** vì PostgreSQL live/native Mac chưa xác minh.
