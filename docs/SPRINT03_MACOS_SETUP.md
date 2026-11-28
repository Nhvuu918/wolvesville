# macOS Apple M5 — Cài & chạy Sprint03 trên dự án đang có

## 0. Yêu cầu sẵn có

Máy người dùng có Node 24, npm 11, VS Code, Docker Desktop và container PostgreSQL 16 trên port host 5433. **Không tạo container hoặc volume mới** chỉ để chạy Sprint03. Không cài lại Node/Git/VS Code.

## 1. Giải nén ZIP mới nhất (độc lập)

```bash
mkdir -p ~/Projects/wolvesville
cd ~/Projects/wolvesville
unzip ~/Downloads/Wolvesville_Sprint_03_Full_Stack.zip
cd Wolvesville_Sprint_03_Full_Stack
code .
```

ZIP đã có source các Sprint 01, 02A, 02B, 02C; không ghép tay bất kỳ ZIP nào khác.

## 2. Setup và baseline

```bash
npm install
npm run verify:source
npm run build
npm run test:03
```

`test:03` có 4 PG tests; nếu chưa cấu hình PostgreSQL có thể SKIP, nhưng SKIP **không** là PASS. Để nghiệm thu PG phải chạy riêng `npm run test:pg:03` (strict).

## 3A. Chạy SQLite cục bộ để xem UI trước

```bash
mkdir -p local
DB_PROVIDER=sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 PORT=3212 npm run serve:03
```

Mở `http://127.0.0.1:3212` — browser phải dùng URL này, không `file://frontend/index.html`. SQLite phục vụ thử kỹ thuật; **không bật competitive**.

## 3B. Chạy trên PostgreSQL container hiện có

```bash
docker ps
cp .env.example .env
code .env
```

Điền `DATABASE_URL=postgresql://...` với credentials hiện tại của container port 5433, không commit `.env`. Trong `.env` đặt `DB_PROVIDER=postgres`, `WV_OFFICIAL_RULE_TEST_MODE=1`, `WV_INTEGRATION_TEST_MODE=0`, `PORT=3212`. Nếu backend 02C còn chạy trên 3212, **dừng riêng process ấy** trước khi mở Sprint03 hoặc chọn port 3213; không dừng PostgreSQL dự án khác.

```bash
npm ls pg
npm run db:migrate:pg:02c
npm run test:pg:03
npm run serve:03
```

Migration 002/004/005 là **additive và kế thừa**; không chạy `docker compose down -v`, `prisma migrate reset`, `DROP DATABASE`. Script có kiểm tra placeholder `DATABASE_URL`.

## 4. Thử hai người chơi

- Mở hai cửa sổ trình duyệt độc lập (profile Chrome thường + cửa sổ ẩn danh).
- Đăng ký hai tài khoản khác nhau, password >= 10 ký tự.
- Người A vào Village Lobby → tạo phòng 2 người; B mở danh sách và tham gia.
- A khóa phòng và bắt đầu `OFFICIAL_ROLE_INSPECTION_V1` (cố định #25 và #74; không tính điểm thắng).
- A chọn B, nhấn `Gửi kỹ năng soi` khi NIGHT_COLLECT. Quan sát **chỉ pending**, không có kết quả thật.
- A (host) nhấn **Phân giải đêm (host · test)**. Kết quả chỉ hiện cho actor; B không thấy private result của A.
- Refresh/reconnect A: panel kết quả còn hiển thị đúng một lần. Kiểm tra replay verified.

## 5. Browser E2E tự động

```bash
python3 -m pip install playwright requests websocket-client
python3 -m playwright install chromium
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_e2e.py
```

**Mac note:** `WV_E2E_DIRECT=1` chạy native HTTP/WS bằng Chromium do Playwright cài trên macOS, hai browser contexts độc lập. Bỏ biến này thì test dùng Python transport bridge tới backend thật (dành cho sandbox hạn chế localhost). E2E native trên máy người dùng vẫn phải được chạy mới được nghiệm thu.

## 6. Kết quả kỳ vọng & troubleshooting

- `/health` trả `{status:"ok"}` và đúng `officialRuleTestMode:true` khi test enabled.
- `RULE_UNRESOLVED` là việc **chặn an toàn**, không phải cho phép tự triển khai kỹ năng chưa đủ luật.
- `REVISION_CONFLICT`: lấy lại game revision mới, không gửi revision cũ.
- `28P01`: sai mật khẩu PostgreSQL container hiện có; chỉnh `.env`, không reset volume.
- `EADDRINUSE`: port 3212 đang được app khác sử dụng; chọn port khác hoặc dừng chính process cũ.
- `pg` missing: chạy `npm install`, kiểm tra `npm ls pg`; PG tests không được tính PASS nếu driver chưa cài.
- Chromium trong sandbox không thể mở localhost trực tiếp, nhưng test được kết nối qua Python bridge tới backend thật. Nếu chạy Mac cần có trình duyệt direct-to-server riêng để hoàn tất nghiệm thu UX.
