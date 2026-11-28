# IMMERSIVE-03 — hướng dẫn chơi thử (Mac Apple Silicon)

## Chuẩn bị
1. Giải nén toàn bộ Full Source vào thư mục mới, không ghi đè thư mục database đang dùng. Nếu muốn sử dụng dữ liệu cũ, dừng server và sao lưu cả file SQLite cùng WAL/SHM (nếu có); chỉ thử nâng cấp trên bản sao. Bản này thêm migration 010; đã kiểm tra hai bản sao DB thử nghiệm 02.
2. Dùng Node 22, npm; tại thư mục source chạy `npm install`, `npm run build`, `npm run verify:source`. Chạy `npm run dev:demo` rồi mở http://127.0.0.1:3212. Nếu cổng bận: `PORT=3213 npm run dev:demo`. Không tự tắt tiến trình khác.
3. Để thử đội hình 4 vai mới đã dùng trong E2E: `WV_LIFE_MODULES_DEV_NORMAL=1 npm run dev:demo`. Đây là Normal phát triển, không QA, không thành tích cạnh tranh. Nếu chỉ chơi Normal chính thức thì không bật cờ này. Không bật Demo/QA trên Internet. localhost chỉ là máy đang chạy server; LAN chưa được nghiệm thu, không mở cổng ra ngoài mặc định.
4. Tạo 4 tài khoản đăng ký độc lập trong 4 browser profile (không dùng 4 tab chung cookie/session); một người tạo phòng, các tài khoản khác vào phòng bằng mã. Chọn deck DEV 8,25,31,64 (Kỵ Sĩ Không Đầu, Tiên Tri, Bảo Vệ, Người Rung Chuông), khóa danh sách, ready và bắt đầu theo quyền chủ phòng.

## Checklist người chơi
- [ ] Thông báo đủ người xuất hiện cho tất cả; thông báo ready xuất hiện cho chủ phòng; không lặp khi refresh.
- [ ] Tự xem vai của mình, không thấy vai người khác; kiểm tra layout trên MacBook và mobile.
- [ ] Chọn mục tiêu hợp lệ, xác nhận, phân biệt đã nhận với kết quả sau phân giải.
- [ ] Mở Nhật ký và Nhân vật trong ván; đóng lại, kiểm tra lựa chọn còn nguyên.
- [ ] Thử bỏ phiếu: ở đội hình tương thích, A chọn B rồi đổi sang C, so sánh số lựa chọn trên các máy; không hiện phiếu hiệu lực bí mật. Refresh và kiểm tra đồng hồ không reset. Quản trò nhận thông báo khi pha đã phân giải.
- [ ] Kết thúc trận, kiểm tra Sự nghiệp > Normal phát triển; Normal chính thức không tăng vì ván DEV.
- [ ] Kiểm tra thống kê nhân vật, số ván chung; tài khoản mới chưa đạt huy hiệu không được cấp giả.
- [ ] Refresh/reconnect và xem lại trận; thử hai tài khoản, không xem được nhật ký riêng của nhau.
- [ ] Thử Người Giữ Luật với câu hỏi về nhân vật. Không nhập API key hay bí mật trận vào câu hỏi.

## AI tùy chọn
Tra cứu nguồn không cần key. Để thử provider tương thích OpenAI, cấu hình ở terminal backend, không đưa key vào source hay ảnh/log:
`export WV_AI_ENABLED=1`, `export WV_AI_MODEL='ten-model'`, `export WV_AI_API_KEY='...'` (thiết lập cục bộ), tùy chọn `WV_AI_BASE_URL` HTTPS, rồi khởi động lại. Provider live chưa được nghiệm thu. Nếu không cấu hình, SOURCE_LOOKUP tiếp tục hoạt động.

## Backup / restore và báo lỗi
Dừng server, sao lưu thư mục dữ liệu được cấu hình bởi WV_LOBBY_DB. Phục hồi bằng bản sao, không ghi đè bản gốc đang chạy. PostgreSQL dùng DATABASE_MIGRATION_GUIDE.md và RAILWAY_DEPLOYMENT.md; chưa nghiệm thu live tại checkpoint này. Không trộn database thử và dữ liệu thật. Khi báo lỗi: ghi phiên bản, hệ điều hành, theme, viewport, mã phòng/match, pha, thao tác, mong đợi/thực tế, ảnh (che thông tin riêng). Không gửi token/key hoặc database cá nhân.

- [ ] Bảng tin: đăng ảnh PNG/JPEG, bạn được phép xem có thể bấm tải ảnh, người bị chặn không xem được. Like/bình luận, kiểm tra notification và restart.
- [ ] History → Chi tiết / Replay: Play/Pause, Next/Previous, tua; không dùng trận đang diễn ra để xem bí mật.
- [ ] Deadline thực và chế tài AFK chưa được mở rộng: đồng hồ hiện là elapsed server time, không phải countdown.

## Automated evidence reproduction (optional, developer)
Run the browser suites against separate local SQLite DB paths/ports with the existing Python Playwright/Chromium setup. `WV_E2E_SERVER` points to the running server. For game use `WV_LIFE_MODULES_DEV_NORMAL=1`, `WV_PUBLIC_ORDINARY_VOTE=1`, no QA/test flags, and `WV_SCREENSHOT_DIR` for output. `python tests/browser_immersive03_game_e2e.py`. For social use a separate fresh DB and set `WV_IMMERSIVE_EVIDENCE` plus `WV_TEST_POST_IMAGE` to a small PNG (test image, not private media), then `python tests/browser_immersive03_social_e2e.py`. Actual evidence used the existing repository bridge due to sandbox Chromium network policy. Run `python docs/immersive-handover/verify_delivery_03.py` on original extracted source to check all payload hashes before edits. 


## Wheel of Fate — Vòng quay định mệnh
Đã tích hợp tiện ích quyết định riêng trong Game HUD. Không phải phân vai hoặc chọn quản trò. Hướng dẫn và giới hạn nghiệm thu: `docs/immersive-handover/WHEEL_OF_FATE_QA.md`; bằng chứng: `reports/WHEEL-OF-FATE/`.

## IMMERSIVE-04 (Mac)
1. Back up your local database before upgrading. Do not reset it; migration 011 is additive. Use a separate SQLite DB for tests if needed.
2. `npm install && npm run build && npm run verify:source`
3. `WV_PUBLIC_ORDINARY_VOTE=1 WV_GROUP_CHAT_DAY_NIGHT=1 WV_LIFE_MODULES_DEV_NORMAL=1 npm run dev:demo`
4. Open http://127.0.0.1:3212; use four independent registered accounts for supported DEV deck [8,25,31,64]. Submit each available night action; host sees large ready banner and manually confirms. Check private results, journal, voting, reconnect. DEV does not grant XP. Wheel stays on HUD.
5. Use separate registered accounts (not demo identities) for official Normal deck knight [8,25]. Complete a match through the usual workflow. First winner who survives and receives the three initial Common badges earns 460 XP; first loser earns 200 XP. Go to Sự nghiệp, see level, gallery, history, try pin. Subsequent matches differ. Refresh/replay/restart must not duplicate XP.
6. New group time policy is opt-in per new game. Cult night chat was tested only in Candidate via actual recruitment; do not enable QA publicly. Wolf group not implemented. Old matches retain old group times.
7. For cloud use existing deployment guide, PostgreSQL and secrets configured in hosting, never dev:demo or QA. New PG migration not live accepted. No public playtest authorization.

## IMMERSIVE-05: chơi thử thông báo và bộ vai
1. Dùng hai tài khoản đăng ký độc lập (không dùng Demo để thử XP). Tạo phòng 2 người, kết bạn, người B xem Newsfeed; mời B vào phòng; B nhấn Chấp nhận. A đang xem Sự nghiệp phải thấy đủ phòng. Quay lại phòng.
2. Chủ phòng khóa danh sách, mở “Tùy chỉnh bộ vai / Bộ vai của tôi”, chọn #8 Kỵ Sĩ Không Đầu + #25 Tiên Tri, đặt tên và lưu. Thêm vai thứ ba thử cảnh báo, giảm lại. Áp dụng vào phòng, cả hai ready, bắt đầu. Không có quyền chọn vai cho từng người.
3. Gửi kỹ năng hợp lệ, quản trò ra Sự nghiệp, quay lại qua banner Tất cả đã xác nhận. Xác nhận thủ công; nếu Kỵ Sĩ chọn Tiên Tri, trận kết thúc; mở Sự nghiệp và profile, kiểm tra XP/huy hiệu. Đừng thử bằng tài khoản có dữ liệu quan trọng.
4. Đổi theme Sage, đăng xuất, đăng nhập trong browser profile mới; kiểm tra Player ID, theme, bộ vai và XP. Chỉ sau backup mới thử restart backend và upgrade theo BACKUP_RESTORE_GUIDE.md.
5. Bộ vai chưa hỗ trợ chỉ là bản nháp. Không bật Demo/QA ra Internet. PostgreSQL live, Railway và Internet multiplayer chưa nghiệm thu; xem DEPLOYMENT_GUIDE.md.
