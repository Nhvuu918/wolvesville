# Wolvesville Sprint 03 Demo Hotfix — Acceptance

## Kết quả thực thi tại workspace hiện tại
- Baseline Sprint03: **75 tests: 71 PASS, 0 FAIL, 4 SKIPPED** (PostgreSQL chưa có).
- Hotfix full suite: **87 tests: 82 PASS, 0 FAIL, 5 SKIPPED** (4 PostgreSQL cũ, 1 PostgreSQL Demo mới).
- 11 new Demo auth backend tests: **11 PASS**.
- Browser Demo E2E với hai browser contexts: **PASS**: click CTA, identity/session khác nhau, lobby, create/join room, WS, restore, logout, reconnect.
- Browser disabled path: **PASS**: báo lỗi tiếng Việt và không cấp token.
- Browser existing account regression: **PASS**: signup/login, room, role, skill, feedback riêng tư, replay, reconnect.
- Source integrity: **PASS** 97 nhân vật, 118 quyết định, 207 legacy test specs và original 107 UI files.
- Strict PostgreSQL command without `DATABASE_URL`: **exit 1 như mong đợi** (bài thử âm tính), không tính là DB PASS.
- PostgreSQL live/Native Chromium trên Mac: **CHƯA CHẠY trong workspace này**.

## Kết luận
**PARTIAL / PASS trong phạm vi SQLite và Chromium-through-real-backend HTTP/WS**. Trạng thái tổng thể chưa FULL PASS do PostgreSQL live và Native macOS browser chưa được thực thi tại đây. Competitive và các luật chưa đủ căn cứ vẫn bị khóa.

## Notes
- Selenium/Playwright bridge chỉ vận chuyển HTTP/WS tới backend thật; không bịa kết quả.
- Browser bridge có thể in cảnh báo `TargetClosedError` khi đóng tab với poll còn chạy. Những cảnh báo teardown đó không làm thất bại assertions, nhưng native browser Mac vẫn cần được chạy để xác minh hoàn toàn.
- Bộ kiểm thử trên Mac cần lệnh `npm run test:pg:demo` và `npm run test:pg:03` với `DATABASE_URL` thật.

## Clean ZIP check
- ZIP source được giải nén vào `/mnt/data/WV_Hotfix_Clean_Verify`, kiểm tra `verify:source`: PASS.
- `npm run test:03:hotfix` trên bản giải nén với dependency sẵn có: 87 tests, 82 PASS, 0 FAIL, 5 SKIPPED.
- Không khẳng định `npm install` sạch trong chế độ offline đã PASS: npm cache ở workspace thiếu `@types/node`; trên Mac cần chạy `npm install` có Internet.
