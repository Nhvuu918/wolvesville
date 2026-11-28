# Hướng dẫn macOS Apple M5 — Wolvesville Codex 97

Yêu cầu Node >=22.13 (máy đã có Node 24.22.3), npm, VS Code; Docker/PostgreSQL tùy chế độ.

## 1. Chuẩn bị

Giải nén ZIP Sprint 03 Codex mới nhất vào `~/Projects/wolvesville`; chạy `code .` trong thư mục gốc có `package.json`.

```bash
npm install
npm run verify:source
npm run build
npm run test:03:codex
```

Kết quả kiểm thử tại workspace: **96 tests = 91 PASS, 0 FAIL, 5 SKIPPED** (PG). Kết quả trên máy Mac có PostgreSQL có thể khác; cần dựa vào log thật.

## 2. Chạy chế độ SQLite / Demo

```bash
cp .env.example .env
```

Sửa `.env` theo cách an toàn: `DB_PROVIDER=sqlite`, `WV_ENABLE_DEMO_AUTH=1`, `WV_OFFICIAL_RULE_TEST_MODE=1`, `PORT=3212`, `HOST=127.0.0.1`.

```bash
npm run serve:03
```

Mở `http://127.0.0.1:3212` và dùng nút Demo; vào menu **Bách khoa (Codex)**. Không mở `frontend/index.html` dạng `file://` vì sẽ bỏ qua API.

## 3. PostgreSQL 16 qua Docker đã có sẵn

```bash
docker ps
# Đặt DB_PROVIDER=postgres, DATABASE_URL=<URL thật> trong .env
npm run db:migrate:pg:02c
npm run test:pg:demo
npm run test:pg:03
npm run serve:03
```

Không dùng `YOUR_PASSWORD` hoặc xóa volumes. Các migrations 002,004,005,006 được áp dụng bổ sung an toàn. Không nhúng mật khẩu thật trong tài liệu hoặc báo cáo.

## 4. Browser E2E trên Mac thật

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_codex_e2e.py
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_demo_e2e.py
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_e2e.py
```

Đảm bảo server bật Demo cho browser Codex E2E. Test tạo các Demo User độc lập; limit 6 lần/IP/giờ, nếu chạy quá nhiều lần hãy đợi hạn mức hoặc dùng môi trường test mới, không tắt rate-limit production.

## 5. Cổng đã sử dụng

```bash
lsof -nP -iTCP:3212 -sTCP:LISTEN
```

Đổi `PORT` để dùng cổng khác; không dùng lệnh kill mù ảnh hưởng dự án khác.

## 6. Khóa Demo

`WV_ENABLE_DEMO_AUTH=0` ở `.env` và restart backend. `NODE_ENV=production` luôn chặn Demo, bất kể flag. Competitive không có nút bật ở bản này.
