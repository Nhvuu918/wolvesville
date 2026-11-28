# Wolvesville — Sprint 04 đề xuất (không tự bắt đầu)

1. **Đóng nghiệm thu Sprint03 trên Mac**: chạy strict `test:pg:03` và direct browser 2 contexts; lưu logs, không chấp nhận skip.
2. **Hợp đồng feedback theo nhóm kỹ năng**: mở rộng `SkillResultRegistry` theo từng official adapter READY, với field-level allowlist, per-event audience frozen, no result khi thiếu quyền.
3. **Phase và Victory Resolver**: chỉ khi toàn bộ rule pack tham gia đã xác nhận + tests, không mở competitive tự động.
4. **Gameplay chat/vote server authoritative**: phân quyền chat công khai/phe/nhóm theo VH57/62 và các ngoại lệ đã chốt; bảo mật lịch sử khi reconnect.
5. **Bổ sung Official Rule Adapters** theo `CHARACTER_READINESS_MATRIX.md`, mỗi skill có rule/priority/visibility/test trace và integration test.
6. **Browser E2E native Playwright trên Mac** (không Python bridge), đo visual diffs để xác nhận 100% preserved UI khi cài thật.
7. **Production security**: httpOnly Secure cookies, CSP không unsafe-inline bằng delegation, CSRF nếu cookies, rate limit WS, short-lived session, TLS, secret rotation.
8. **Observability & deployment**: logs scrubbed, metrics, traces, pg connection pooling, health/readiness, migration dry-run, backup policy; load/chaos tests.
9. **UX detail**: hỗ trợ nhóm kết quả mới, no-result confirmations, accessibility aria-live toàn thông báo, lâu đủ để đọc và lịch sử phân quyền.

**Release gate:** no unsupported skill enabled, no result projection outside audience, all regression + PG + real browser on target Mac PASS, checksum official data unchanged.
