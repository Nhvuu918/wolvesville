# Wolvesville IMMERSIVE-03 — Triển khai cloud (checkpoint)

Đây là cấu hình **CLOUD_STAGING**, chưa có nghiệm thu PostgreSQL live, Docker, CI hay Internet multiplayer. Không mở cho người chơi công khai trước khi hoàn tất PRODUCTION_CHECKLIST.md. Không dùng GitHub Pages cho backend. Không dùng QA/Demo trên cloud. Một instance duy nhất; tránh redeploy giữa ván, do chưa hỗ trợ distributed state.

## 1. Chuẩn bị GitHub trên Mac
- Giải nén Full Source vào thư mục mới. Upload **nội dung thư mục chứa package.json, Dockerfile, railway.toml và .github**, không upload ZIP lịch sử, dist, node_modules, .env, local hoặc database. Giữ bản Full Source riêng để bảo toàn lịch sử. Khuyến nghị repo private vì có tài liệu luật/nội bộ.
- Cài Node 22.13+; chạy `npm install --include=optional`, `npm run build`, `npm run verify:source`, `npm run test:immersive03`. Môi trường bàn giao không truy cập được registry; chưa tạo được package-lock.json. Sau khi cài thành công, commit package-lock.json. Nếu có lockfile dùng `npm ci --include=optional` cho lần sau.
- GitHub Desktop: File → Add Local Repository (Create repository nếu chưa có .git), chọn thư mục source. Kiểm tra Changes (không được có secrets hay database), Commit to main, Publish repository với Keep this code private. Nếu dùng repo cũ: backup nhánh hiện tại trước, dùng clone và cập nhật source có kiểm soát, không force push. Không đưa credential vào URL git.
- Mở GitHub → Actions → Wolvesville quality gates; chỉ tiếp tục khi job xanh. CI bao gồm PostgreSQL service, migration hai lượt, full backend inventory, cloud smoke. Workflow chưa chạy tại checkpoint này. Bảo vệ main với required checks.

## 2. Railway
Xem RAILWAY_DEPLOYMENT.md. Lần đầu cấu hình PostgreSQL + app + variables + Wait for CI. Sau đó push main kích hoạt build/deploy theo cấu hình Railway khi CI đạt; không coi đây là đã chạy thật.

## 3. Kiểm tra trước khi công khai
Kiểm tra /health và /ready, HTTPS/WSS, đăng ký tài khoản thật (không Demo), media, bạn bè, cùng phòng từ 2 mạng, ván Normal, reconnect, history/replay, restart/redeploy, backup/restore. Chỉ sử dụng tài khoản và database staging tách biệt. Không tạo dữ liệu cạnh tranh giả. Xem CLOUD_ACCEPTANCE_REPORT.md và PRODUCTION_CHECKLIST.md.

## 4. Cập nhật và rollback
Sao lưu PG trước migration, kiểm tra CI và deployment log, dừng nhận trận mới khi redeploy, kiểm tra /ready và smoke sau deploy. Nếu lỗi, rollback application deployment đã xác minh tương thích schema; không DROP/reset schema hay volume. Khôi phục backup vào database khác trước khi chuyển kết nối. Một số migration additive cần tồn tại cho phiên bản mới; kiểm tra tương thích phiên bản cũ. Không dùng chung DB staging với production.

IMMERSIVE-05: migration 012 adds account preferences and saved decks. Use same database URL and project/domain on update, backup first, verify /ready. See BACKUP_RESTORE_GUIDE.md. No cloud deployment or PG live verified.
