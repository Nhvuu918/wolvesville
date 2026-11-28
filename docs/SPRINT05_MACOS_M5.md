# Wolvesville Sprint 05 — macOS Apple Silicon, Node.js 24, PostgreSQL 16

## Chạy nhanh bằng SQLite

```bash
unzip Wolvesville_Sprint_05_Gameplay_Expansion_Full_Source.zip
cd Wolvesville_Sprint_05_Gameplay_Expansion_Full_Source
npm install
cp .env.example .env
```

Sửa `.env` cho môi trường **development**:

```dotenv
DB_PROVIDER=sqlite
DATABASE_URL=
WV_ENABLE_DEMO_AUTH=1
WV_OFFICIAL_RULE_TEST_MODE=1
WV_INTEGRATION_TEST_MODE=0
PORT=3212
HOST=127.0.0.1
```

Không chạy test mode trên production. Tiếp theo:

```bash
npm run verify:source
npm run build
npm run rules:build
npm run test:05:all
npm run dev
```

Mở `http://127.0.0.1:3212`. Vào Demo/Lobby, tạo phòng đúng cấu hình 2, 3 hoặc 5 tài khoản, khóa phòng rồi bắt đầu test pack `OFFICIAL_ROLE_INSPECTION_V1`. Kỹ năng động (kể cả khóa đêm, bảo vệ) chỉ xuất hiện đúng role/phase từ server. Chuyển đêm trong UI chỉ có ý nghĩa kiểm thử, không phải chu kỳ chính thức competitive.

## Browser E2E

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:05
```

Runner dùng SQLite test/port riêng theo suite, khởi động backend thật và xác nhận exit code. Có thể chạy riêng một suite nếu điều tra lỗi:

```bash
node scripts/run-browser-s05.mjs browser_s05_e2e.py
```

## PostgreSQL — không ảnh hưởng database khác

Dùng **container PostgreSQL 16 hiện có**, không tạo mới hay xóa volume:

```bash
docker ps
docker compose ps
```

Điền chuỗi URL thật vào `.env` qua editor cục bộ (không commit/đưa vào ZIP):

```dotenv
DB_PROVIDER=postgres
DATABASE_URL=postgresql://YOUR_USER:YOUR_REAL_PASSWORD@127.0.0.1:5433/wolvesville
```

`YOUR_REAL_PASSWORD` là **ký hiệu thay thế**, phải nhập mật khẩu thực tế. Kiểm tra kết nối trước khi chạy migration trên database chính. Chạy test nghiệm thu cô lập:

```bash
npm run test:pg:acceptance
npm run test:pg:05
```

`test:pg:05` phải FAIL nếu không có `DATABASE_URL`; không có SKIP mặc định trong chế độ required. Bài PG Sprint 05 tạo **schema thử nghiệm có tên ngẫu nhiên** trên database do URL chỉ định và tự xóa **chỉ schema đó** trong finally. Cần tài khoản có quyền `CREATE SCHEMA`; không chạy với DB production thực có dữ liệu quý giá. Migrations 002/004/005/006 được giữ nguyên; không tự chạy `docker compose down -v`, không reset container.

## Lỗi phổ biến

- `DATABASE_URL missing` ở SQLite: kiểm tra `DB_PROVIDER=sqlite`, script `npm run dev` nạp `.env` (không phải chạy `node` sai entrypoint).
- `EADDRINUSE`: kiểm tra `lsof -nP -iTCP:3212 -sTCP:LISTEN`, đổi `PORT` trong `.env` hoặc dừng **đúng** server bạn biết; hệ thống không tự kill.
- Demo CTA vô hiệu: `WV_ENABLE_DEMO_AUTH=1`, `NODE_ENV` khác production; xác minh `/health`.
- PostgreSQL auth 28P01: dùng mật khẩu thật, không in URL có secret ra logs.
- Những kỹ năng không xuất hiện: kiểm tra role, phase, `capabilities` server và test deck whitelist; các vai ngoài pack không được bật.

## Chú ý đóng gói

ZIP không chứa `node_modules`, `.env` thực, SQLite runtime hoặc mật khẩu. Nếu `npm install` offline thất bại vì thiếu cache, cần Internet hoặc registry được cấu hình trên máy Mac. Việc build trong sandbox đã sử dụng dependency có sẵn và **không chứng minh một lần cài npm mới hoàn toàn đã PASS**.
