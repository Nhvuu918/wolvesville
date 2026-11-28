# Wolvesville Sprint 03 UX — macOS Apple M5 / VS Code

## 1. Giải nén và kiểm tra

```bash
cd ~/Downloads
unzip Wolvesville_Sprint_03_UX_Integration_Full_Source.zip
cd Wolvesville_Sprint_03_UX_Integration_Full_Source
code .
node -v
npm install
npm run verify:source
npm run build
npm run test:03:ux
```

**Lưu ý:** lệnh chạy regression có 5 test PostgreSQL SKIPPED nếu chưa thiết lập `DATABASE_URL`. Không tính số SKIPPED là PASS.

## 2. Chạy website với SQLite (thử nghiệm cục bộ)

```bash
cp .env.example .env
```

Trong `.env` đặt:

```dotenv
DB_PROVIDER=sqlite
WV_ENABLE_DEMO_AUTH=1
WV_OFFICIAL_RULE_TEST_MODE=1
WV_INTEGRATION_TEST_MODE=0
PORT=3212
HOST=127.0.0.1
```

Chạy `npm run serve:03`, mở `http://127.0.0.1:3212`. Nút tài khoản mẫu tạo phiên Demo phía server, không cần mật khẩu. Chức năng competitive vẫn khóa.

Nếu cổng đã có tiến trình sử dụng: `lsof -nP -iTCP:3212 -sTCP:LISTEN`; hãy chọn PORT khác trong `.env`. Không tự đóng server dự án khác.

## 3. PostgreSQL 16 đang chạy bằng Docker trên Mac

Không reset PostgreSQL container/volume, không tạo database mới chồng tên. Điền `DATABASE_URL` **thực tế** vào `.env`, đặt `DB_PROVIDER=postgres`, rồi:

```bash
npm run db:migrate:pg:02c
npm run test:pg:demo
npm run test:pg:03
npm run serve:03
```

Migration 002/004/005/006 được giữ nguyên. Không dùng literal `YOUR_PASSWORD` hoặc log mật khẩu. Nếu `DATABASE_URL` thiếu, các test chế độ bắt buộc phải FAIL để người dùng thấy điều kiện nghiệm thu chưa đạt.

## 4. Browser E2E với server thử nghiệm tự động (không đụng DB thật)

```bash
npm run test:browser:ux:local
```

Script tự tạo **SQLite tạm** và backend với port trống, chạy bốn nhóm Browser E2E với hai browser contexts, đóng server rồi dọn thư mục tạm. Không cần chạy Docker hoặc xóa DB. Cần Python 3 có `playwright`, `requests`, `websocket-client` và Chromium đã cài:

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
```

Nếu muốn kiểm thử trực tiếp trên backend Mac đã mở (không qua bridge):

```bash
WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_ux_e2e.py
```

## 5. Tắt chế độ Demo

Đặt `WV_ENABLE_DEMO_AUTH=0` và restart; khi `NODE_ENV=production`, Demo luôn bị khóa. Không chia sẻ `.env`, token, mật khẩu hoặc DB chứa dữ liệu thật.

## 6. Giới hạn sản phẩm

Chỉ có hai Rule Adapters #25 và #74 trong chế độ thử nghiệm. Lịch sử thắng thua, leaderboard, chat/vote cạnh tranh và gameplay 97 vai **chưa hoạt động**. Bách khoa vẫn hiển thị đủ 97 vai nhằm tra cứu, không phải để chọn vai vượt whitelist của Engine.
