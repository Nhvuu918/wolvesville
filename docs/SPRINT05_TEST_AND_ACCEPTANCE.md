# Sprint 05 — Actual QA Results and Acceptance

## Automated baseline (workspace thực tế)

Lệnh: `npm run test:05:all` → **exit code 0**; `npm run build`, `npm run verify:source` và `npm run rules:build` → PASS.

| Suite | Total | PASS | FAIL | SKIP |
|---|---:|---:|---:|---:|
| Sprint 01–03 regression inherited | 107 | 102 | 0 | 5 (PostgreSQL) |
| Final Hardening | 12 | 12 | 0 | 0 |
| Sprint 04 rules/KB regression | 13 | 13 | 0 | 0 |
| Sprint 05 new skill/KB/victory | 11 | 11 | 0 | 0 |
| Sprint 05 PostgreSQL real integration | 1 | 0 | 0 | 1 (not configured) |
| **Tổng** | **144** | **138** | **0** | **6** |

Log cụ thể: `reports/SPRINT05_FULL_TEST_EXECUTION.log`, mã thoát: `reports/SPRINT05_FULL_TEST_EXECUTION.exit`.

### Phạm vi 11 test mới

6 tests kỹ năng #9/#31/#34 và tương tác #25/#74, PH-01, lock ưu tiên, resource, state expiry, restart/replay, idempotency, ACL. 2 tests partial victory facts. 3 tests Knowledge Base, whitelist và execution metrics. **207 legacy test specification không phải 207 executable tests.**

### Browser E2E

Sáu kịch bản trên **backend SQLite thực và hai Chromium contexts** (với bridge network tới backend thật nếu sandbox không cho Chromium kết nối localhost):
1. `browser_s05_e2e.py`: 5 người, quyền, submit concurrent, capability, resolution, replay, reconnect.
2. `browser_lobby_e2e.py`: room marker, real membership.
3. `browser_codex_e2e.py`: Bách khoa 97.
4. `browser_demo_e2e.py`: 2 demo sessions.
5. `browser_e2e.py`: official inspection, universal private feedback.
6. `browser_ux_e2e.py`: responsive, player-first labels, logout.

Có **một lượt chạy gộp đủ 6 suite trả exit code 0** (`reports/SPRINT05_BROWSER_E2E.log`). Trong lượt chạy xác minh lặp sau một thay đổi nhỏ, tiến trình bị giới hạn thời gian ngoài và chỉ in 4 suite PASS; 2 suite còn lại đã chạy riêng và trả exit 0. Không xem kết quả một lượt bị cắt ngoài là PASS của lượt đó. Các suite đều có bằng chứng hoàn thành riêng.

### PostgreSQL

**PENDING / NOT VERIFIED IN THIS RUNTIME**: Không có PostgreSQL server/`DATABASE_URL`. Sáu bài backend PostgreSQL được đánh dấu **SKIPPED**, không tính PASS. Test Sprint 05 trong `tests/postgres-support.test.mjs` thực hiện trong schema thử nghiệm ngẫu nhiên: migration 002/004/005/006, 5-player action, replay, restart, ACL, rollback; phải chạy trên Mac với `DATABASE_URL` hợp lệ. Chế độ bắt buộc thiếu URL báo FAIL (cấu hình âm tính), không tính như PG PASS.

### Gate và giới hạn

| Phần | Trạng thái | Evidence |
|---|---|---|
| Auth, Demo, Lobby/Room, Codex97, authorized WS | GO giới hạn đã test | 127 tests kế thừa + browser |
| Engine kernel transaction, replay, determinism | GO giới hạn đã test | 6 integration skill tests; old suites |
| New official skills #9/#31/#34 | GO — restricted test ONLY | HTTP+SQLite+browser 5 users |
| #20/#25/#74 official limited pack | GO — restricted test ONLY | inherited tests |
| PostgreSQL 16 | PENDING | 6 skipped — must test on user Mac |
| Generic damage/protection/win chain | PARTIAL/UNIMPLEMENTED | source ambiguities, missing resolvers |
| Full 97 competitive | NO-GO | 0 competitive-ready full characters |
