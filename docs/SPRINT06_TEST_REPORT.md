# Sprint 06 — Test Execution & Acceptance

## Runtime thực tế trong workspace này

- Node.js 22.16.0, SQLite built-in `node:sqlite`, TypeScript 5.8.3; **không có PostgreSQL server hay Docker daemon**.
- Baseline Sprint05: **138 PASS / 0 FAIL / 6 SKIPPED PostgreSQL**.
- Sprint06 mới: **9 PASS / 0 FAIL** (`tests/sprint06-lifecycle.test.mjs`).
- Sprint06 PG acceptance file mới: **1 SKIPPED** (DATABASE_URL absent).
- Gộp `npm run test:06:all`: **147 PASS / 0 FAIL / 7 SKIPPED**. Đây là tổng kết qua các bước npm script, không phải test coverage của 97 nhân vật.
- `npm run verify:source` và `npm run build`: PASS.
- Browser Sprint06 (`node scripts/run-browser-s06.mjs browser_s06_e2e.py`): **PASS / exit 0**, hai Chromium contexts, người thứ ba qua backend thật.
- Browser tổng hợp 7 suite: **chưa PASS** — sau ba suite PASS, suite Bách khoa bị treo khi đóng/tiếp tục Chromium; lượt chạy gộp bị timeout, không tính là nghiệm thu thành công. Chạy riêng các suite và kiểm tra cleanup trước khi đóng Sprint full.
- PostgreSQL Sprint06: **PENDING**. `npm run test:pg:06` đã kiểm tra chế độ thiếu DATABASE_URL: **exit code 1, FAIL 1, SKIPPED 0**. Đây là kiểm thử cấu hình âm tính, không phải kiểm thử PostgreSQL thật.

## Đã chứng minh bằng mã thực thi

- 2/3 người qua backend thật: Phase, vote receipt, idempotency, stale revision, authorization, closed/unresolved không thay trạng thái, rollback và replay; restart SQLite.
- #79 vote cancel sau nhận phiếu: `PH-02`, reveal riêng, once-per-match, không lộ qua HTTP/WS sự kiện room, sang đêm thứ hai; không có fake winner.
- #8 sole survivor fact, anti-hanging guard là pure functions; không kích hoạt Game Completed.

## Nghiệm thu có phân lớp

| Phạm vi | Trạng thái | Bằng chứng |
|---|---|---|
| Engine Kernel/SQLite Regression | GO | 147 PASS tổng chạy được |
| Restricted day/night + vote-intent | GO restricted test | S06-01..09 |
| PH-02 #79 cancellation / privacy | GO restricted test | S06-07 + Browser E2E |
| Generic vote finalization/elimination | BLOCKED BY RULE | 409 RULE_UNRESOLVED |
| Victory finalization | PARTIAL (facts only) | Pure predicates + S06-06 |
| PostgreSQL full acceptance | PENDING | 7 SKIPPED (gồm legacy) |
| Browser complete 7-suite runner | PENDING | Tổng hợp gặp timeout |
| Full competitive | NO-GO | Chưa có vote/elimination/winner closure |

## Kiểm thử Mac Apple Silicon

1. `npm install && npm run verify:source && npm run build`
2. `npm run test:06:all`
3. `npm run test:browser:06` (test riêng Sprint06); `npm run test:browser:06:regression` (7 suite, cần exit code 0 thực tế)
4. Cấu hình `DATABASE_URL` hợp lệ trong `.env`, dùng schema test riêng: `npm run test:pg:acceptance && npm run test:pg:05 && npm run test:pg:06`. Không reset Docker volume.

Không dùng `.env` thật hoặc mật khẩu thực khi chia sẻ log.
