# Sprint 09 — Báo cáo QA thực tế / không đánh tráo bằng chứng

## Regression trên môi trường phát triển

| Hạng mục | Kết quả | Bằng chứng |
|---|---|---|
| `npm run verify:source` | **PASS** | `reports/S09_SOURCE_VERIFY.log` |
| `npm run build` | **PASS** | `reports/S09_BUILD.log` |
| `npm run test:09:all` | **176 PASS, 0 FAIL, 10 SKIPPED, exit 0** | `reports/S09_FULL_TESTS.log` |
| Test nghiệp vụ mới `tests/sprint09-voting.test.mjs` | **7/7 PASS** | `reports/S09_NEW_TESTS.log` |
| Browser S09 với 3 trình duyệt thật và backend SQLite | **PASS, exit 0** | `reports/S09_BROWSER_NEW.log` |
| Browser kế thừa S05 chạy độc lập | **PASS, exit 0** | `reports/S09_BROWSER_S05_ISOLATED.log` |
| PostgreSQL live | **PENDING** | Không có `DATABASE_URL` và server PostgreSQL trong workspace; `tests/postgres-s09.test.mjs` chỉ là test cần chạy |

Tổng Node test: 186 mục (=176 PASS + 10 SKIPPED); 207 đặc tả legacy chỉ là nguồn đối chiếu, không cộng vào test đã chạy. Browser gộp `npm run test:browser:09:all`: **10/10 suites PASS, exit code 0** (log: `reports/S09_BROWSER_ALL_RELEASE.log`, mã thoát: `reports/S09_BROWSER_ALL_RELEASE.exit`). Một lượt gộp trước đó đã timeout và không được tính là PASS.

## Dữ liệu nguồn / kiến trúc kế thừa

| Thành phần | Giá trị | Tình trạng |
|---|---:|---|
| `character.json` | 97 nhân vật | Source integrity PASS |
| `official_merged_118.json` | 118 quyết định | Không sửa |
| `tests_207.json` | 207 đặc tả | Không sửa, không tính PASS |
| Frontend reference | 107 file | Không thay artwork/thiết kế, 2 technical entrypoints được kế thừa |
| Migrations 002/004/005/006 | 4 migrations quan trọng | Giữ nguyên |
| Skill-branch roles | 8 → **9** | #33 thêm adapter chính thức |
| Metric A | 2 → **2** | Hai bộ thắng nhanh kế thừa có backend commit + replay |
| Metric B | 0 → **0** | V02/V03 vẫn cần quyết định; không tự treo |

## Phạm vi đã kiểm thử Sprint 09

1. **S09-01**: action ngày #33, kiểm tra kỹ năng từ server, phiếu hiệu lực theo controller, không tự treo; private audit không rò qua HTTP/replay.
2. **S09-02**: một lần/ván, idempotent retry và Event Log không nhân đôi.
3. **S09-03**: thiếu phiếu điều khiển hoặc phiếu mục tiêu → chưa đủ xác minh phiếu cuối; không chế phiếu.
4. **S09-04**: restart SQLite → toàn bộ voting, directive và replay khôi phục; người ngoài bị từ chối.
5. **S09-05**: hòa phiếu và nhiều chỉ thị không cho phép kết luận treo.
6. **S09-06**: nhân vật #23 được vote khi còn sống; sau khi chết bị từ chối, không thay revision hoặc Event Log.
7. **S09-07**: QA-only day advance không được tính là vote, elimination hoặc winner.
8. **Browser**: ba session độc lập, phân vai server, gửi action #33 từ UI, bỏ phiếu, khóa, `ADJUDICATION_UNRESOLVED`, reconnect, không leak private modifier.

## PostgreSQL Acceptance (strict)

Chạy trên Mac có PostgreSQL 16 với database/schema **chuyên để test**, không dùng database người dùng: `npm run test:pg:09` và `npm run test:pg:09:all`. Script yêu cầu `DATABASE_URL`; thiếu URL phải FAIL (non-zero), tuyệt đối không tính SKIPPED là PASS. Test nằm tại `tests/postgres-s09.test.mjs` và sử dụng schema được cô lập; không reset Docker volume.

## Điều kiện nghiệm thu

- **GO — Restricted #33 voting transformation test**: server-side certified coercion, no fabricated hanging.
- **GO — Two existing restricted early-night match configurations**: #8/#25 và #8/#28.
- **PARTIAL — Voting Resolution**: final vote audit có dữ liệu thật nhưng V03 chưa quyết định hanging.
- **PARTIAL — Elimination/Victory**: chain/predicates cho bộ vai đóng đã được kế thừa; không có vote-to-elimination.
- **NO-GO — Metric B/full competitive**: không có bộ nào qua official vote → elimination → victory.
- **PENDING — PostgreSQL live**, browser Mac native còn cần xác minh trên máy Mac.

## QA phát hiện bổ sung ở vòng release

- Đính chính rule #23 theo đúng điều kiện **sau chết** từ `character.json`; test S09-06 chạy lại PASS.
- Browser aggregate có một lượt trước gặp lỗi không ổn định ở form tạo phòng. Sửa `frontend/integration.js` để resync không thay form đang nhập, thêm test UX gọi reconnect trong lúc form mở; test UX riêng PASS exit 0.
- `reports/S09_FULL_TESTS_RELEASE.log` được tạo **sau** đính chính #23 và sửa form: 176 PASS, 0 FAIL, 10 SKIPPED, exit 0.
- `reports/S09_BROWSER_ALL_RELEASE.log` là lượt browser gộp **10/10 PASS, exit 0**, sau khi sửa quyền #23 và xử lý race condition form tạo phòng. Lượt trước bị lỗi race đã được giữ trong `reports/S09_BROWSER_ALL_POST_FIX.log` nhưng **không được tính là PASS**.

## Clean ZIP verification

First complete source ZIP was CRC-tested and unpacked into `/mnt/data/WV_S09_CLEAN_VERIFY/`. With **preinstalled local development dependencies linked into the unpacked workspace for test only** (no `node_modules` inside ZIP): `npm run test:09:all` **176 PASS, 0 FAIL, 10 SKIPPED, exit 0**; `npm run test:browser:09` **PASS, exit 0**. The exact execution logs were copied into `reports/S09_CLEAN_ZIP_FULL_REGRESSION.log` and `reports/S09_CLEAN_ZIP_BROWSER.log`. The final delivery ZIP adds only those logs/documentation to the tested source; no engine code changed after the clean verification.

A fresh `npm install` without a network connection was not tested; end users should run `npm install` on Mac as described in the README.
