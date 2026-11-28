# IMMERSIVE-05 — Dữ liệu tài khoản

Database SQLite là nguồn chân lý cho tài khoản, hồ sơ, quan hệ, bài viết/media, notifications, game ledger, XP và thành tích. Migration 012 bổ sung hai bảng account_preferences, saved_decks. Bản lưu bộ vai và cài đặt có owner scope, revision và transaction; lưu bản nháp không cấp quyền chơi. Server đối chiếu multiset role ID với các bộ vai đã được phép, không mở runtime mới.

| Dữ liệu | Nghiệm thu mới / giới hạn |
|---|---|
| Authentication và Player ID | Đăng ký, logout, login mới, restart giữa trận trong API; browser context mới giữ đúng ID |
| Profile, social, media | Bộ test immersive kế thừa chạy lại; migration đối chiếu toàn bộ bảng cũ; chưa thực hiện toàn bộ thao tác trong một browser journey duy nhất |
| Cài đặt | Theme sage và favorites/volume được lưu theo tài khoản, revision conflict bị từ chối; theme phục hồi trên browser context mới |
| Bộ vai | Lưu, đổi tên, draft invalid, owner ACL, revision, login/restart, browser context mới, áp dụng vào phòng và ván thật |
| Gameplay | Resume từ server, giữ vai của người xem, quản trò, xác nhận, endgame; không phân vai lại; chưa có ma trận tất cả pha/thiết bị đồng thời |
| XP/huy hiệu | Regression progression và ván chính thức mới; 460 XP cho người thắng sống sót, không cộng trùng; profile cá nhân hiển thị cấp/danh hiệu/huy hiệu ghim |
| Notification | Global projection từ room membership và game view đã cấp quyền, qua WS account-level invalidation và polling 5s khi tab đang hiển thị; invite/room full/moderator qua browser; Web Push khi đóng trình duyệt chưa có |
| Wheel of Fate | Riêng tư cục bộ như đã duyệt; không đồng bộ kết quả quay lên server |
| Recovery/security | Password recovery, SMTP, quản lý mọi phiên, toàn bộ audit và rate-limit chưa hoàn thành |

## Upgrade evidence
Hai database fixture IMMERSIVE-04 (career, browser) được backup bằng SQLite API, mở bằng bản mới hai lần. Cả 29 bảng cũ trên từng fixture giữ nguyên hash nội dung từng hàng; tương ứng 78 và 134 hàng, 2 bảng mới, integrity_check và foreign_key_check PASS. Chi tiết reports/IMMERSIVE-05/migration.json. Không phải database người dùng. Không đưa database thử nghiệm vào ZIP.

## Giới hạn
Chưa chuyển dữ liệu SQLite sang PostgreSQL; chưa nghiệm thu PostgreSQL live, Railway, redeploy, hai thiết bị vật lý hoặc Internet. Browser profile độc lập dùng Chromium transport bridge với HTTP/WS và SQLite thật. Theme cục bộ của tài khoản chưa có preferences trên server không tự backfill; mặc định server được áp dụng. Đồng bộ settings sau đăng nhập và khi ghi; chưa có push cập nhật settings giữa hai tab đồng thời. Không kết luận mọi dữ liệu đã hoàn tất nếu chức năng gốc chưa được triển khai. Các nhãn phát triển ở trang kỹ thuật/QA và một số lỗi vẫn còn, không thay đổi phân loại nội bộ.
