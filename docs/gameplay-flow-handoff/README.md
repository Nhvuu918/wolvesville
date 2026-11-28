# SPRINT 07 ADDENDUM — Verified early-night match

**NEW**: `13_SPRINT07_VERIFIED_EARLY_ENDGAME.md`, `14_SPRINT07_ANIMATION_ACL_CONTRACT.md`, `15_SPRINT07_SCREEN_TRANSITIONS.md`. These documents distinguish real server-backed early-night terminal gameplay from generic voting/hanging (BLOCKED BY RULE). Sprint06 documents are inherited below unchanged except this additive index header.

---

# WOLVESVILLE — Gameplay Flow Handoff / Sprint 06 / v0.8.0

**Dành cho đội đồ họa và frontend.** Đây không phải tài liệu tuyên bố trò chơi đã hoàn chỉnh. Sử dụng trạng thái triển khai ở từng bước trước khi thiết kế animation.

**Bộ chạy được:** hệ thống tài khoản/phòng, phân vai, thử nghiệm kỹ năng đêm #9/#25/#31/#34/#74 cùng phản ứng #20; bộ riêng #25/#74/#79 có kỹ năng hủy vote được xác nhận PH-02; server lưu và replay. Không có full-match official ending.

## Chú thích trạng thái

- **IMPLEMENTED & TESTED:** Có code, bài test chạy thành công trên SQLite và/hoặc Chromium được chỉ ra.
- **PARTIAL:** Có giao thức/logic giới hạn nhưng chưa đủ để coi hoàn chỉnh.
- **DESIGNED ONLY:** Hợp đồng và animation đề xuất, chưa có backend event thật.
- **BLOCKED BY RULE:** Thiếu quyết định để kết luận hợp lệ; không giả lập thành công.

## Danh mục handoff

1. `01_GAMEPLAY_STATE_DIAGRAM.md`: state machine thật và các nhánh còn khóa.
2. `02_MATCH_LIFECYCLE_DIAGRAM.md`: người dùng tạo phòng đến đêm sau.
3. `03_DAY_NIGHT_FLOW.md`: nhịp đêm/ngày, điểm commit.
4. `04_PLAYER_ACTION_FLOW.md`: tác vụ, idempotency, feedback.
5. `05_VOTING_FLOW.md`: phiếu chỉ ghi nhận, PH-02, treo cổ bị khóa.
6. `06_SKILL_RESOLUTION_FLOW.md`: độ ưu tiên, lock, nội dung riêng.
7. `07_DEATH_ELIMINATION_FLOW.md`: dự kiến/hành vi chưa được giải quyết.
8. `08_ENDGAME_FLOW.md`: partial victory facts và điều kiện full-match.
9. `09_UI_STATE_INVENTORY.md`: từng màn hình, thông báo, lỗi.
10. `10_SCREEN_TRANSITIONS.md`: nguồn dữ liệu/điều kiện chuyển màn.
11. `11_EVENT_ANIMATION_CONTRACT.md`: sự kiện thật và event chỉ đề xuất.
12. `12_AUTHORIZED_INFORMATION.md`: ACL, snapshot/reconnect và nguồn sự thật.

File JSON cho pipeline đồ họa: `frontend_gameplay_event_catalog.json`. Các trạng thái mô tả bằng tiếng Việt cho người chơi; không hiện ID vai, seed, Event Log/Engine Internals trong UI.

## Interactive Design Preview (không kết nối Game Engine)

- `DESIGN_PREVIEW.html`: mở trực tiếp trong browser để đội đồ họa bấm qua các trạng thái 1–12. BANNER “DESIGN PREVIEW — KHÔNG PHẢI GAMEPLAY” hiện cố định, không có tài khoản hoặc dữ liệu thật; tuyệt đối không sử dụng làm bằng chứng backend PASS.
- `frontend_gameplay_event_catalog.json`: danh mục trạng thái UI được gắn nguồn quyền và mức độ triển khai, dành cho kiểm thử animation/reconnect.


## Sprint 08 mandatory graphics acceptance (v2 addendum)

Đọc `S08_GRAPHICS_TEAM_HANDOFF.md` và `S08_GRAPHICS_READY_CONTRACT.json` trước khi triển khai asset. v2 kế thừa event S06/S07 nhưng đánh dấu rõ `MATCH_COMPLETED` và `PLAYER_ELIMINATED` chỉ có trong bộ [8,25], còn vote-to-elimination ở trạng thái design only. Mỗi state có payload theo quyền, loading, error, reconnect, reduced motion và asset placeholder.
