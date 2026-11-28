# Chạy Wolvesville Sprint 04 trên macOS Apple Silicon

Yêu cầu: macOS, Node.js 24 (máy người dùng), npm, VS Code. PostgreSQL 16 Docker là **tùy chọn để chạy SQLite**, nhưng bắt buộc cho PostgreSQL acceptance. Không tạo container trùng tên, không xóa volume.

## Khởi động và kiểm thử nhanh

```bash
cd ~/Downloads/Wolvesville_Sprint_04_Official_Rule_Intelligence_Full_Source
npm install
cp .env.example .env
# .env dùng DB_PROVIDER=sqlite, DATABASE_URL để trống
npm run verify:source
npm run build
npm run rules:build
npm run test:04:all
npm run dev
```

Mở `http://127.0.0.1:3212` (hoặc `PORT` trong `.env`). Demo chỉ bật ở môi trường phát triển được cấu hình `WV_ENABLE_DEMO_AUTH=1`. `WV_OFFICIAL_RULE_TEST_MODE=1` dùng restricted test pack; **không mở cạnh tranh**.

## Tra cứu developer KB

```bash
npm run rules:query -- rule VH03
npm run rules:query -- character 20
npm run rules:query -- interaction 20-74
npm run test:04:official
```

## PostgreSQL 16 hiện có

1. `docker ps` và `docker compose ps` — chỉ kiểm tra container đang chạy, không tạo mới khi không cần.
2. Đặt `DB_PROVIDER=postgres` và `DATABASE_URL=postgresql://...` **với mật khẩu thật qua `.env` riêng**, không commit mật khẩu.
3. Đảm bảo cơ sở dữ liệu thử nghiệm riêng hoặc schema test riêng có quyền tạo schema. Không chạy test phá hủy trong database sản xuất.
4. Chạy `npm run test:pg:acceptance`. `npm run db:migrate:pg:02c` chỉ chạy khi cần migration bổ sung theo cấu hình được xác nhận, không chạy lại theo thói quen trên dữ liệu quan trọng.
5. Chỉ khi **không có SKIPPED và tất cả PASS** mới nghiệm thu PostgreSQL.

## Browser E2E

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:04
```

Nếu trình chạy gộp bị treo khi đóng Playwright (đã gặp trong sandbox), hãy kiểm tra browser backend đang chạy, chạy từng file độc lập theo hướng dẫn `tests/browser_*.py` và báo cả **exit code**. Chỉ tin kết quả suite hoàn chỉnh khi lệnh thực sự thoát thành công.

## Source không chứa secrets

ZIP không có `.env` đã điền thông tin thật, token, SQLite runtime hoặc `node_modules`. `character.json` giữ checksum chính thức. Migrations 002/004/005/006 giữ nguyên.
