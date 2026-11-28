# Sprint 08 — Mandatory Acceptance Foundation (Supplement to Sprint 07)

> **Phạm vi phiên này:** triển khai trực tiếp yêu cầu bổ sung XVI–XXI cho Master Prompt Sprint 08 trên source Sprint 07 v0.9.0. Đây **chưa** phải Sprint 08 gameplay hoàn chỉnh; không có rule/skill/migration hay gameplay mới được tự khai. Có automated real-backend match readiness A/B, ma trận cấu hình và Graphics Handoff v2.

Để kiểm chứng độc lập:

```bash
npm install
npm run verify:source
npm run build
npm run test:08:match-readiness
node --test tests/sprint08-acceptance-gates.test.mjs
# Regression kế thừa + gate mới:
npm run test:08:all
```

Bằng chứng từ backend cho cấu hình **#8 + #25**: **Metric A=1**, đã commit `GAME_COMPLETED`, có Event Log/Replay/ACL và khôi phục SQLite. **Metric B=0** vì chưa có chứng cứ `Vote Resolution → Elimination → Victory Check` cho bất kỳ bộ vai nào. A/B độc lập; số PASS không quyết định số bộ vai.

- [Master Prompt addendum XVI–XXI](docs/SPRINT08_MANDATORY_ACCEPTANCE_ADDENDUM.md)
- [Readiness baseline](docs/SPRINT08_ACCEPTANCE_BASELINE.md)
- [Match Matrix runtime](reports/S08_MATCH_READINESS.md)
- [Graphics-ready contract](docs/gameplay-flow-handoff/S08_GRAPHICS_TEAM_HANDOFF.md)
- [Player First Checklist](docs/S08_PLAYER_FIRST_ACCEPTANCE.md)
- [Changelog](docs/SPRINT08_ADDENDUM_CHANGELOG.md)

**PostgreSQL:** không chạy trong môi trường hiện tại; tuyệt đối không tính SKIPPED là PASS. Khi có máy Mac và `DATABASE_URL` thật, dùng các lệnh PostgreSQL Sprint 07 đã có.

---

# WOLVESVILLE — Sprint 07: Verified Early-Night Match v0.9.0

**Full source kế thừa Sprint 01–06, không thay Game Engine. Official Rules v1.3.1.**

## Có thể chơi và kiểm thử gì?

**Restricted official early-ending match**: bộ hai người **Kỵ Sĩ Không Đầu #8 + Tiên Tri #25**, chỉ trong **development official-rule test mode**. Host khóa phòng hai người → chọn “Kỵ Sĩ Không Đầu · Ván ngắn” → start → backend phân vai thật → người #8 dùng “Tấn công ban đêm” vào #25 → người quản lý cho Engine phân giải đêm → Engine commit việc #25 chết → sau **toàn bộ hành động được phân giải**, kiểm tra #8 là người sống sót cuối cùng theo `character.json#8` và VH03 → ghi `MATCH_COMPLETED` → hai client nhận kết quả thắng/thua từ server. Nếu #8 không thực hiện đòn hợp lệ, **không có chiến thắng bịa ra**. #25 có thể đồng thời soi vai #8, nhận kết quả riêng sau commit, dù #25 chết cuối đêm (theo luật accepted action).

**Đây là trận kết thúc sớm trong đêm đầu**, chưa chứng minh vòng bỏ phiếu→treo cổ→xét thắng chung. Không bật full competitive hoặc áp dụng winner logic này cho bộ vai khác. Bách khoa vẫn có 97 vai, nhánh skill thực thi giới hạn mới có **8 vai** (7 kế thừa + #8); không phải 8 vai hoàn thiện toàn bộ luật.

## Chạy trên Mac Apple M5

```bash
npm install
cp .env.example .env
# trong .env: DB_PROVIDER=sqlite, DATABASE_URL=, WV_ENABLE_DEMO_AUTH=1,
# WV_OFFICIAL_RULE_TEST_MODE=1, WV_INTEGRATION_TEST_MODE=0, PORT=3212
npm run verify:source
npm run build
npm run rules:build
npm run test:07:all
npm run dev
```

Vào `http://127.0.0.1:3212` (same-origin frontend + backend). Khởi tạo phòng 2 người, thử bộ **Kỵ Sĩ Không Đầu · Ván ngắn** ở dropdown dành cho chủ phòng. Hai người cần tài khoản riêng, có thể dùng nút Demo (nếu đã bật). **Không bật Demo/Official test mode trên production**. Với `DB_PROVIDER=sqlite`, không cần `DATABASE_URL`. Cổng đã chiếm thì đổi `PORT` trong `.env`, không kill tiến trình dự án khác.

Browser E2E (Chromium, hai phiên khác nhau):
```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:07
npm run test:browser:07:all
```

PostgreSQL qua Docker Desktop 16 **đang có trên Mac**: chỉ dùng URL có quyền tạo schema trong cơ sở dữ liệu kiểm thử, không dùng production. Khai báo `DATABASE_URL=postgresql://...` trong `.env` trên máy, sau đó:
```bash
npm run test:pg:acceptance
npm run test:pg:05
npm run test:pg:06
npm run test:pg:07
```
**PostgreSQL live chưa được kiểm chứng trong môi trường dựng source này**; các test PG trong bộ tổng hợp đều SKIPPED khi chưa có URL. Lệnh bắt buộc `test:pg:07` sẽ FAIL nếu thiếu URL.

## Kết quả kiểm thử thực tế

- `npm run verify:source`, `npm run build`: **PASS**.
- `npm run test:07:all`: **153 PASS, 0 FAIL, 8 SKIPPED PostgreSQL**, exit 0. Trong đó 147 PASS hồi quy Sprint06 và 6 test Sprint07 mới.
- `npm run test:browser:07:all`: **8/8 browser suites PASS, exit code 0**; thực hiện trên backend SQLite thật. Trong sandbox Chromium dùng cầu nối loopback HTTP/WS của test runner, không phải test direct native trên Mac.
- `tests/postgres-s07.test.mjs`: **SKIPPED**, không được gọi là PostgreSQL PASS.
- `207` là **legacy test specifications**, tuyệt đối không phải 207 bài đã chạy.
- Cài đặt `npm install` hoàn toàn sạch trên Mac và PG live vẫn cần xác nhận trên máy Mac của người dùng.

## Các giới hạn chính

- Voting `OPEN → RECORDED → CLOSED_UNRESOLVED` và kỹ năng #79 `PH-02` vẫn hỗ trợ. Có **raw vote audit nội bộ** tính số phiếu nhưng **không xử treo** khi V02/V03 chưa được xác minh đủ.
- `#8→#25` là một death transition xác minh theo bộ bài hai người, không mở attack/protection pipeline cho những bộ bài khác.
- Victory chỉ tự kết thúc khi hoàn tất **closed deck** [8,25] và #8 là người cuối cùng còn sống, không có action đang chờ/chuỗi hiệu ứng hoặc hồi sinh.
- Toàn bộ UI Dark Fantasy, Room Marker, Codex Wheel/Grid và 107 frontend reference được giữ nguyên. UI trò chơi chỉ có lựa chọn test deck và thông báo thắng từ backend.

## Hồ sơ

- [Rule Blocker Audit](docs/SPRINT07_RULE_BLOCKER_DIAGNOSIS.md)
- [Architecture & Changelog](docs/SPRINT07_ARCHITECTURE_CHANGELOG.md)
- [Full-Match Readiness](docs/SPRINT07_FULL_MATCH_READINESS.md)
- [Test Report](docs/SPRINT07_TEST_REPORT.md)
- [Mac Apple M5 & PostgreSQL](docs/SPRINT07_MACOS_M5.md)
- [Unresolved Rules](docs/SPRINT07_UNRESOLVED_RULES.md)
- [Gameplay Flow Handoff](docs/gameplay-flow-handoff/README.md)

All Sprint01–06 source, docs, migrations 002/004/005/006, 118 rules, 97 characters, 207 specifications, 107 approved reference frontend files are retained. No database user files, `.env` secrets or `node_modules` in distribution ZIP.

## Sprint 08 — Test evidence / external acceptance

- [S08 implementation/QA report](docs/SPRINT08_TEST_AND_HANDOFF_REPORT.md): 159 automated PASS, 8 PG SKIPPED, 0 FAIL on the local no-PG environment, plus one browser full-match E2E PASS.
- Browser test for inherited verified deck: `npm run test:browser:07` (requires Chromium/Playwright and Python dependencies in `tests/requirements-browser.txt`).
- PostgreSQL requires a real `DATABASE_URL`; keep production off and use the isolated test schemas built by existing tests: `npm run test:pg:acceptance && npm run test:pg:05 && npm run test:pg:06 && npm run test:pg:07`. Do not reset Docker volumes or user databases.
- `npm run test:08:match-readiness` executes two server-backed configurations and refreshes runtime evidence. It intentionally does not call the browser and therefore does not claim its browser/Pg columns passed within that single command.
