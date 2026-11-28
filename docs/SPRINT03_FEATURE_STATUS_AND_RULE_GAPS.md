# Sprint03 — Feature Status & Rule Gaps

## Đã triển khai và chạy SQLite/browser E2E

- Backend API auth/profile/rooms/WS/official sessions giữ nguyên từ 02C.
- Frontend chính thức được nối server (auth, directory, create/join/leave/lock, game stage, own role, official inspect skill #25/#74, feedback private, reconnect).
- Event/feedback v1: chỉ `ROLE_INFORMATION` từ allowlisted `ROLE_OBSERVED` được gửi cho người sử dụng có quyền.
- Văn bản tức thì trên Stage và feedback; có thể đọc lâu, không auto chuyển sang thông báo khác.
- Chặn kết quả khi action chưa RESOLVED, không gửi private result trước commit, không lộ role người khác.
- SQLite replay đã test, PostgreSQL integration có test nhưng chưa chạy tại sandbox.

## Chưa triển khai / còn chặn (không tính là feature hoạt động)

| Nhóm | Trạng thái/lý do |
|---|---|
| 95 vai còn lại và các nhánh chưa đủ luật của 97 vai | `RULE_UNRESOLVED`/NO-GO, không tự suy luận |
| Competitive victory/draw/faction win | **DISABLED**, thiếu fully validated Victory Resolver |
| Hành động sát thương, cứu, hồi sinh, buff, lock, chuyển phe, liên kết | Chưa có official adapters được phê duyệt toàn phần, không cho gửi |
| Chat thực trong phòng, chat phe, vote, chat ẩn danh | Chưa có gameplay/backend verified cho quyền cụ thể, UI hiện thông báo chưa nối, không dùng fake chat |
| Ranking/history competitive | Chưa hỗ trợ, không phát sinh kết quả thắng giả |
| Faction / group / target / public feedback | Contract kế hoạch, chưa có projector policy + test, **không bật** |
| Kết quả trì hoãn theo lịch kỹ năng | Chưa có adapter luật tương ứng, **không tự phát** |
| Full replay/public history | Chỉ replay kiểm chứng và authorized visible events, không phát raw archive |
| All 97 role combat/complex conflicts | NO-GO theo Readiness Audit v1.3.1 |
| PostgreSQL Sprint03 | Tests defined, chưa chạy trên server thật **ở workspace này** |
| Native browser → localhost trong sandbox | Trình duyệt bị policy chặn, E2E qua cầu nối thực nhưng native networking chưa xác minh tại đây |

## Mâu thuẫn luật được khoanh vùng

Nguồn 118 quyết định không đổi. Chưa có bộ xử lý cho Sói Kỹ Sư empty false-role set, phù thủy cứu Thần Thảo, Kẻ Vu Khống mất vote, Người Lái Đò chat người chết, multi-effect inversion; nếu action đòi những nhánh đó thì `RULE_UNRESOLVED`. Tiên Tri #25 đã sửa mapping UI chính xác tên và ID theo official JSON, không dựa nhầm mô tả 100 role prototype.

## Những giới hạn kỹ thuật còn lại

- Backend local test mode, chưa xác minh load cao/cluster/HA/production TLS.
- Original UI dùng inline event handlers → CSP cần `'unsafe-inline'`; có thể siết ở Sprint 04 bằng delegation, không sửa thiết kế đồ họa.
- Token dev được lưu sessionStorage (XSS hardening pending), chưa đổi sang HttpOnly cookie session.
- Browser E2E Python bridge pass nhưng chưa chứng minh direct Chromium localhost ở Mac.
- SQLite và PostgreSQL backend cùng abstraction; PG integration phải đạt trên Mac trước full acceptance.
