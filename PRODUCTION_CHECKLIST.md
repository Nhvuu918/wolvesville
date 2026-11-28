# Release gates — KHÔNG coi staging là production

- [ ] npm install sạch có lockfile và Docker build thật.
- [ ] GitHub CI xanh, migration PG mới/nâng cấp, full regression không FAIL.
- [ ] PG profile, friends, image posts, notices, rooms, game/replay/career và backup/restore thật.
- [ ] Cloud staging access control và TLS/WSS, session/CSRF/CORS, kiểm tra abuse/rate limit và secret scan.
- [ ] 2 người từ 2 mạng khác nhau chơi trọn ván, reconnect và redeploy lưu dữ liệu.
- [ ] Kiểm thử privacy public/hidden vote, host, journal, replay, media, AI, WebSocket payload.
- [ ] Kiểm thử full theme/mobile, performance, human QA, lỗi UI.
- [ ] Live AI provider (nếu bật), cost limits, fallback.
- [ ] Có phương án rollback + backup khôi phục đã thử.
- [ ] Phê duyệt public playtest riêng; competitive gate độc lập vẫn NO-GO.
