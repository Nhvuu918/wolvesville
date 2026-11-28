# Sprint 09 — Mac Apple Silicon / Docker PostgreSQL 16

## SQLite phát triển nhanh (không cần DATABASE_URL)

```bash
npm install
cp .env.example .env
# File .env sử dụng DB_PROVIDER=sqlite, DATABASE_URL rỗng
# Chỉ môi trường phát triển: WV_ENABLE_DEMO_AUTH=1, WV_OFFICIAL_RULE_TEST_MODE=1
npm run verify:source
npm run build
npm run test:09:all
npm run dev
```

Mở `http://127.0.0.1:3212` (hoặc PORT bạn đã chọn trong `.env`). Không mở `frontend/index.html` bằng `file://`. Sử dụng **3 danh tính đăng nhập riêng** và tạo phòng dung lượng 3, chọn bộ Sói Lừa Gạt / Tiên Tri để thử #33. Sau khi chủ phòng resolve đêm, mở vote; #33 chọn một người và gửi kỹ năng, chủ phòng resolve action ngày; các người chơi bỏ phiếu; chủ phòng khóa để xem thông báo. Khi V03 chưa được chốt, **không có treo cổ hoặc người thắng giả**.

## Browser E2E

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:09
npm run test:browser:09:all
```

Các lệnh `test:browser:*` tự dựng backend SQLite và DB tạm cô lập; không đụng DB dự án. Browser trong sandbox dùng cầu nối HTTP/WebSocket vì chính sách mạng; chạy native trực tiếp trên Mac cần được nghiệm thu riêng.

## PostgreSQL test thật (không reset volume cũ)

1. Chạy PostgreSQL 16 hiện có trên Docker Desktop, **tạo hoặc chọn một database dành riêng cho nghiệm thu**. Đảm bảo database cho phép tạo schema tạm.
2. Sửa file `.env` tại máy mình: `DB_PROVIDER=postgres`, `DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:5433/<dedicated_test_db>` theo thông tin thật, không đưa mật khẩu lên Git/Chat.
3. Chạy test **bắt buộc**, exit code khác 0 nghĩa là chưa đạt:

```bash
npm run test:pg:09
npm run test:pg:09:all
```

`tests/postgres-s09.test.mjs` có logic tạo schema riêng và cleanup schema **do chính test tạo ra**. Không khởi chạy migration vào schema người dùng, không xóa existing database/volume. Nếu URL thiếu, test bắt buộc **FAIL**, không tự chuyển sang SQLite.

## Kiểm tra cổng bận và dừng an toàn

```bash
lsof -nP -iTCP:3212 -sTCP:LISTEN
# Chỉ dừng chính terminal đang chạy Wolvesville bằng Ctrl+C;
# KHÔNG kill tiến trình không xác định hoặc đổi PORT âm thầm.
```

`.env` chứa secrets cục bộ không được đóng gói. `WV_ENABLE_DEMO_AUTH` phải mặc định tắt ở production. Competitive không được mở từ việc chạy các bộ thử nghiệm giới hạn.
