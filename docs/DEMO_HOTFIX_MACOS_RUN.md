# Hướng dẫn chạy Demo Authentication Hotfix trên macOS Apple M5

## 1. Không ghép ZIP cũ
Giải nén ZIP **Sprint 03 Demo Auth Hotfix** và mở thư mục mới trong VS Code.

```bash
npm install
npm run verify:source
npm run build
npm run test:03:hotfix
```

Khi không có kết nối PostgreSQL, mong đợi khoảng **82 PASS / 5 SKIPPED / 0 FAIL** (số liệu đã chạy trong workspace; Mac với PostgreSQL có thể khác).

## 2. Chạy demo nhanh với SQLite, không đụng PostgreSQL Docker

```bash
cp .env.example .env
```

Sửa `.env`:

```dotenv
DB_PROVIDER=sqlite
WV_ENABLE_DEMO_AUTH=1
WV_OFFICIAL_RULE_TEST_MODE=1
WV_INTEGRATION_TEST_MODE=0
PORT=3212
HOST=127.0.0.1
```

```bash
npm run serve:03
```

Mở `http://127.0.0.1:3212`, bấm **Trải nghiệm tài khoản mẫu**. Mỗi trình duyệt sẽ có Public Player ID khác nhau.

## 3. Kiểm tra PostgreSQL 16 đã có trong Docker

Không tạo container hay xóa volume, sử dụng đúng mật khẩu đã cấu hình trước đó:

```bash
docker ps
# sửa .env: DB_PROVIDER=postgres, DATABASE_URL=<chuỗi kết nối thật>, WV_ENABLE_DEMO_AUTH=1
npm run db:migrate:pg:02c
npm run test:pg:demo
npm run test:pg:03
npm run serve:03
```

Migration 006 bổ sung bảng Demo, không xóa account/games. `test:pg:demo` dùng một schema kiểm thử có tên ngẫu nhiên, chỉ xóa đúng schema vừa tạo.

## 4. Browser E2E dùng Chromium thật

```bash
python3 -m pip install playwright requests websocket-client
python3 -m playwright install chromium
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_demo_e2e.py
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_e2e.py
```

Trong sandbox hiện tại browser test được kiểm chứng qua HTTP/WebSocket bridge tới backend thật, vì Chromium không được phép mở localhost trực tiếp; hãy chạy `DIRECT=1` trên Mac để xác nhận native.

## 5. Tắt Demo

Sửa `.env`: `WV_ENABLE_DEMO_AUTH=0`, restart server. API trả HTTP 403 `DEMO_DISABLED`, nút UI hiển thị lỗi tiếng Việt.

`NODE_ENV=production` luôn cấm Demo, ngay cả khi `WV_ENABLE_DEMO_AUTH=1`.

## 6. Dọn demo hết hạn an toàn (chỉ khi operator muốn)

```bash
WV_CONFIRM_DEMO_CLEANUP=YES npm run demo:cleanup
```

Không tự động xóa room, game hay tài khoản thật. Những Demo đã tham gia game hoặc còn là chủ/thành viên phòng được giữ nguyên để bảo toàn lịch sử; session quá hạn bị revoke.
