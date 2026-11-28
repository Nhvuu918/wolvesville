# Railway — cấu hình lần đầu

1. Tạo tài khoản Railway, kiểm tra gói và chi phí. Không có tài khoản/credential trong gói bàn giao.
2. New Project → Deploy from GitHub repo, cấp quyền repo private cụ thể. Chọn branch main và root directory chứa package.json. Thêm service PostgreSQL trong cùng project/environment. Chờ database healthy.
3. Trong Variables của **app**, đặt (chỉnh tên service Postgres nếu khác):

```dotenv
NODE_ENV=production
WV_DEPLOYMENT_PROFILE=CLOUD_STAGING
DB_PROVIDER=postgres
DATABASE_URL=${{Postgres.DATABASE_URL}}
HOST=0.0.0.0
WV_PUBLIC_ORDINARY_VOTE=1
WV_AI_ENABLED=0
```

PORT để Railway cung cấp. Không bật bất kỳ WV_* QA/Demo/DEV Normal/test flag nào. Không dùng DATABASE_PUBLIC_URL khi private reference hoạt động. Không đưa giá trị resolved vào Git. ALLOWED_ORIGINS chỉ cần khi có origin HTTPS riêng được phép, dùng exact origin, không wildcard. Frontend/backend cùng origin mặc định.

4. Settings của app: dùng Dockerfile; kiểm tra Railway nhận railway.toml, pre-deploy `npm run db:migrate`, start `npm start`, health path `/ready`, một replica. Bật Wait for CI ở phần deployment triggers/source settings (UI có thể thay đổi). Xem GitHub Actions và Railway deployment logs. Không bỏ qua lỗi CI. Migration dùng transaction + advisory lock. Không reset DB.
5. Sau khi gate database/Docker/CI đạt, ở môi trường staging được bảo vệ, Settings → Networking → Generate Domain để lấy URL HTTPS phục vụ nghiệm thu. Không quảng bá URL hoặc mở public playtest khi chưa đạt gate. Railway domain nếu tạo là endpoint truy cập qua Internet; kiểm soát truy cập staging trước khi cấp domain. Kiểm tra `/ready`, `/health`, WSS và cookie/session theo policy. Không dùng localhost trong URL gửi cho bạn bè.
6. Sau nghiệm thu public multiplayer thực sự và bảo mật, mới xem xét PUBLIC PLAYTEST riêng. Competitive vẫn NO-GO.

Tài liệu chính thức: https://docs.railway.com/guides/postgresql ; https://docs.railway.com/reference/config-as-code ; https://docs.railway.com/guides/github-autodeploy ; https://docs.railway.com/guides/public-networking .

**Chưa chạy thật:** cần npm registry, Docker/hosting, PG service và quyền repo. Không coi file cấu hình là chứng nhận deployment.

IMMERSIVE-05: maintain existing PostgreSQL connection, do not recreate DB on deploy. Migration 012 is added to db:migrate. /ready now checks saved_decks and account_preferences. See BACKUP_RESTORE_GUIDE.md; Railway live is unverified.
