# HƯỚNG DẪN CHẠY WOLVESVILLE SPRINT 01 TRÊN WINDOWS (VS CODE)

## 1. Chuẩn bị

Cài **Node.js 22.13 trở lên** (khuyến nghị bản 22 LTS) từ trang Node.js chính thức và VS Code. Mở **PowerShell** trong VS Code (`Terminal` → `New Terminal`). Kiểm tra:

```powershell
node -v
npm -v
```

Nếu không thấy phiên bản, đóng/mở VS Code sau khi cài Node, bảo đảm Node đã có trong biến PATH. Không cần cài Python, Docker, MySQL, Redis hoặc Postgres để chạy kernel Sprint 01.

## 2. Giải nén source và mở dự án

1. Giải nén `Wolvesville_Sprint_01_Engine_Kernel.zip` thành thư mục `Wolvesville_Sprint_01_Engine_Kernel`.
2. Trong VS Code chọn `File` → `Open Folder` → chọn **thư mục gốc** có `package.json`.
3. Mở terminal mới, chạy lệnh bên dưới tại đúng thư mục gốc.

## 3. Chạy từng lệnh

```powershell
npm install
npm run verify:source
npm run build
npm test
npm run demo
```

Giải thích:
- `npm install`: cài TypeScript dùng cho build.
- `npm run verify:source`: kiểm tra checksum của 97 nhân vật chính thức, danh mục 118 quyết định, bộ 207 test specification và **107 file frontend được bảo toàn nguyên vẹn**.
- `npm run build`: biên dịch TypeScript sang `dist/` và chép migration SQL dùng khi chạy.
- `npm test`: tự build lại và chạy toàn bộ test thực tế trong `tests/kernel.test.mjs`.
- `npm run demo`: chạy một trận **minh họa kỹ thuật trong bộ nhớ** bằng `fixture.*` (không phải vai Wolvesville thật), xuất các hành động, trạng thái được lọc và kết quả replay.

Thông báo `ExperimentalWarning: SQLite is an experimental feature` của Node 22 là cảnh báo của Node về API SQLite; không phải test fail. Nếu thấy `24 passed`, `0 failed` nghĩa là phiên bản đã biên dịch trên máy bạn vượt qua 24 bài kiểm tra kernel hiện có.

## 4. Kiểm tra theo từng module

| Module | Lệnh kiểm tra | File cần xem |
|---|---|---|
| Game State Manager | `npm test` | `backend/src/engine/state.ts`, test chuyển pha |
| Action Contract | `npm run build` | `shared/contracts/index.ts` |
| Validator | `npm test` | `backend/src/engine/validate.ts`, test invalid target/phase |
| Action Queue | `npm test` | `backend/src/engine/queue.ts`, test priority/order |
| RNG | `npm test` | `backend/src/engine/rng.ts`, test domain/seed |
| Rule Resolver | `npm test` | `backend/src/engine/rules.ts`, `fixtures/test-adapters.ts` |
| Effect Processor | `npm test` | `backend/src/engine/effects.ts`, test rollback |
| Event Log | `npm test` | `backend/src/engine/events.ts`, bảng SQLite `events` |
| Replay | `npm run demo` / `npm test` | `backend/src/engine/replay.ts`, test restart/tamper |
| Visibility | `npm test` | `backend/src/engine/visibility.ts`, test private/non-member |
| SQLite Persistence | `npm test` | `backend/src/persistence/sqlite.ts`, `schema.sql` |

### Xem code trong VS Code

- Mở `backend/src/engine/service.ts` để đọc cách các module đi cùng nhau.
- Mở `backend/src/fixtures/test-adapters.ts` để xem các adapter thử nghiệm đã **cố tình cách ly**.
- Mở `tests/kernel.test.mjs` để xem các assertion thực tế.
- Đọc `docs/BLOCKED_BRANCHES.md` trước khi thêm một kỹ năng thật.

## 5. Hướng kết nối sang frontend trong Sprint sau

Thư mục `frontend/` hiện là **bản sao nguyên vẹn thiết kế đã duyệt**, không chạy ngầm cùng backend. Sprint sau cần gateway xác thực tài khoản/phòng, endpoint submit action và projection theo từng user. Không được gọi `getInternalState()` từ frontend; các dữ liệu nhạy cảm phải đi qua `project()` và ACL tại server.

## 6. Các lỗi thường gặp

- `tsc is not recognized`: chạy `npm install` rồi `npm run build` trong thư mục gốc.
- `Cannot find module .../dist`: chưa build; chạy `npm run build`.
- `Unknown built-in module: node:sqlite`: Node quá cũ; nâng lên Node 22.13+.
- `RULE_UNRESOLVED`: đây là cơ chế bảo vệ đúng khi bạn gọi skill chưa được kiểm chứng hoặc danh sách random không hợp lệ; **không phải lý do sửa Character JSON**.
- Nếu `npm test` báo FAIL, gửi nội dung lỗi và `node -v`; không được coi kết quả 24/24 của môi trường gốc là kết quả kiểm thử trên máy bạn.
