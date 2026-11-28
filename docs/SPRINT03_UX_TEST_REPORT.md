# Test report — Sprint 03 Player First

## Kết quả đã chạy thực tế trong workspace này

| Bộ | Tổng | PASS | FAIL | SKIPPED | Phạm vi |
|---|---:|---:|---:|---:|---|
| Baseline `npm run test:03:codex` | 96 | 91 | 0 | 5 | Source cũ trước hotfix |
| `npm run test:03:ux` | 107 | **102** | **0** | **5** | Nền Sprint 01–03 Codex + 11 test UI mới |
| Browser E2E tổng hợp | 4 script | **4 script PASS** | 0 | 0 | Demo, Codex, gameplay, UX trên backend thật |

Chi tiết output tại `reports/SPRINT03_UX_BASELINE_96.log`, `reports/SPRINT03_UX_FINAL_107_TESTS.log`, `reports/SPRINT03_UX_ALL_BROWSER_E2E.log`.

### Test đã xác minh

- Thực thi 97 unique Character ID và kiểm tra checksum `character.json`.
- Demo user sessions riêng, logout, đăng ký tài khoản thật, room create/join/lock và WebSocket.
- Server phân vai, hành động ACCEPTED chưa lộ kết quả, RESOLVED chỉ hiện đúng người.
- Replay + reconnect khôi phục phản hồi không tạo trùng.
- Bách khoa: 97 cards, Wheel chỉ 12, Grid 97, lọc/search tiếng Việt có/không dấu, mobile.
- Player-first UX: message mapping theo mã backend, trang giả ẩn khỏi nav, room server thật, không lộ skill/event ID, settings không còn local JSON export UI.
- Sảnh responsive kiểm tra 1920×1080, 1366×768, 768×1024 và 390×844; không tràn ngang trong luồng được kiểm thử.
- Browser E2E chạy với hai browser contexts và backend SQLite thực; Bridge Linux chỉ chuyển HTTP/WebSocket đến server, không giả lập API.

### Chưa thể xác minh

- PostgreSQL integration trong môi trường này: `DATABASE_URL` không có, 5432/5433 không reachable. **5 SKIPPED, không tính PASS**.
- Chưa chạy trình duyệt native trên Mac Apple M5 của người dùng.
- Chưa có E2E cho competitive 97 nhân vật, không được coi là đã hoàn thành.
- `npm install` hoàn toàn mới không được xác minh offline do dependency cache thiếu; ZIP không chứa `node_modules`.

**Kết luận:** PASS trong phạm vi SQLite, backend đang chạy, các Browser E2E; trạng thái phát hành tổng thể **PARTIAL** do chưa xác minh PostgreSQL native Mac.
