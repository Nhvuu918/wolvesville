# Sao lưu và nâng cấp Wolvesville — IMMERSIVE-05

Source và dữ liệu là hai phần độc lập. Không xóa thư mục local, không reset volume, không thay DATABASE_URL tùy tiện. Hoàn thành trận đang diễn ra trước khi nâng cấp thật; kết quả restart giữa trận kiểm thử không phải cam kết rolling deployment an toàn mọi vai.

## SQLite (Mac)
1. Xác định WV_LOBBY_DB đang dùng; mặc định ./local/sprint03.sqlite. Dừng server bằng Ctrl+C. Không kill tiến trình không liên quan.
2. Tạo thư mục backup ngoài source, chạy `sqlite3 /duong-dan/database.sqlite ".backup '/duong-dan/backup.sqlite'"`. Chạy `sqlite3 /duong-dan/backup.sqlite 'PRAGMA integrity_check; PRAGMA foreign_key_check;'` (kết quả ok, không có hàng FK lỗi).
3. Giải nén bản mới riêng. npm install; npm run build; npm run verify:source. Dùng đường dẫn tuyệt đối tới bản sao database qua WV_LOBBY_DB để thử. Migration 012 thêm bảng, không xóa bảng cũ. Đối soát Player ID, profile, media, friends, XP, lịch sử, notification. Sau khi kiểm tra mới chuyển cấu hình sang DB thật đã backup.
4. Khôi phục: dừng server, giữ nguyên database hiện tại thành bản lưu riêng; mở phiên bản tương thích cùng bản backup. Không chép đè file DB đang chạy/WAL. Nếu có dữ liệu mới sau backup, không restore mù vì sẽ mất giao dịch đó.

## PostgreSQL / Railway
Dùng DB bền vững riêng; không lưu dữ liệu trong filesystem container. Lấy URL từ secrets của dịch vụ. Sao lưu bằng công cụ nhà cung cấp hoặc `pg_dump --format=custom --file=wolvesville.backup "$DATABASE_URL"` (không ghi URL vào log/Git). Thử restore vào database kiểm thử riêng qua `pg_restore --exit-on-error --no-owner --dbname="$TEST_DATABASE_URL" wolvesville.backup`. Kiểm tra bảng, media, tài khoản, game, XP, saved decks và preferences. Migration `npm run db:migrate` chạy 002–012 qua ledger/advisory lock. Chưa nghiệm thu PostgreSQL live/restore tại đây. Đừng sử dụng database người dùng cho test. Tần suất backup theo nhu cầu và khả năng dịch vụ; chưa tạo lịch trả phí hoặc tự động thực thi backup.

## GitHub/Railway
Xem DEPLOYMENT_GUIDE.md và RAILWAY_DEPLOYMENT.md. Duy trì đúng project, service, domain, volume/database, secrets; push source mới rồi migration và health check. Không commit .env, runtime DB, secrets hoặc node_modules. /ready kiểm tra truy cập các bảng workspace mới. GitHub CI/Railway deploy thật vẫn PENDING; chưa có URL công khai.
