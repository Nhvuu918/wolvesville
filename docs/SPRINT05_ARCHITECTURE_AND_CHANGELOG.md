# Wolvesville Sprint 05 — Kiến trúc và changelog (v0.7.0)

**Nền kế thừa:** Sprint 04 v0.6.0. Mã nguồn Sprint 01 → 04, frontend gốc, Codex, Auth/Demo, Room/WebSocket, SQLite/PostgreSQL, migration 002/004/005/006, replay, event log và các test cũ được giữ nguyên. **Không khởi tạo một Engine thứ hai.**

## Code delta

| File | Thay đổi | Nguồn / lý do |
|---|---|---|
| `backend/src/official/support-rules.ts` | Thêm 3 Rule Adapter và effect provenance: Sói Mộng Du #34, Bảo Vệ #31, Thiên Sứ Tuyết #9 | `character.json#34/#31/#9`, VH08/VH10/VH24/PH-01; phải fail-closed ngoài deck |
| `backend/src/official/capabilities.ts` | Chiếu khả năng dùng kỹ năng của **chính** player theo phase, status và giới hạn | Không để frontend dự đoán kỹ năng |
| `backend/src/official/inspection-rules.ts` | Đăng ký thêm deck đóng `[9,25,31,34,74]` vào pack kỹ thuật `OFFICIAL_ROLE_INSPECTION_V1` | Gating hẹp, không bật competitive |
| `backend/src/engine/rules.ts` | Thêm `validateSubmission` tùy chọn cho adapter | Guard history, snow lifetime resource |
| `backend/src/engine/validate.ts` | Chặn khóa Sói Mộng Du ở cả submit và resolve | VH10, PH-01 ngoại lệ |
| `backend/src/engine/service.ts` | Effect application qua existing transaction và event pipeline | Atomicity, Replay |
| `backend/src/game/archive.ts` | Gắn resolver chính thức vào Rule Registry hiện có | Không dùng fixture để đại diện luật |
| `backend/src/game/coordinator.ts` | Chặn skill ngoài allowlist; Authorized Game capability | Server authoritative |
| `backend/src/rule-intelligence/knowledge-base.ts` | Đọc overlay Sprint 05; giữ data đời Sprint 04 để đối chiếu | Không sửa sổ luật |
| `backend/src/official/victory-predicates.ts` | Hàm thuần phát hiện điều kiện #28 và đếm quân số special status | Partial facts, **không auto-win** |
| `frontend/integration.js` | Skill control dựa trên capability server, deck 5 người và an toàn retry REVISION_CONFLICT một lần với cùng ID | Multi-client concurrency; không sửa artwork |
| `scripts/build-rule-knowledge-s05.mjs` | Overlay JSON 97 roles/4656 pairs/6 branches + manifest | Báo mức độ thực thi thực, không cộng thêm “luật chính thức” |
| `scripts/run-browser-s05.mjs` | Mỗi browser suite có port+SQLite test riêng, server lifecycle/exit code | Fix lỗi runner gộp treo ở Sprint 04 |
| `tests/official-support.test.mjs` | Six real HTTP/Engine/SQLite integration tests | 3 skill, block, privacy, replay |
| `tests/official-victory-facts.test.mjs` | Two pure predicate tests | Không mở competitive |
| `tests/rule-expansion-knowledge.test.mjs` | Three KB/gating tests | Count/IDs/trust |
| `tests/postgres-support.test.mjs` | Test PostgreSQL **có điều kiện**, cách ly test schema | Migration và persistence live (chưa chạy ở workspace này) |
| `tests/browser_s05_e2e.py` | 5-player browser E2E, actual HTTP/WS game services | UI → Auth → Room → Engine → feedback |
| `package.json` | `test:05:*`, `test:pg:05`, `test:browser:05`, `rules:build:05` | Reproducible test commands |

## Dependency-directed action pipeline

`HTTP/WS authenticated intent → coordinator membership/pack gate → submission validator (state, role, phase, legal target, role resource) → action queue → resolver priority (night block #34 before #9/#31/#25/#74 in restricted pack) → resolve-time validation → effect commit + event in same transaction → replay → authorized projection + websocket`.

Chỉ có trình tự ưu tiên **trong phạm vi tương tác đã kiểm thử**, không phải bảng priority hoàn chỉnh cho 97 vai. Hành động ACCEPTED được giữ cho đến resolve; bị khóa hợp lệ có thể cancel theo VH10. Không tự bịa hiệu ứng lớp bảo vệ chống đòn bắn chưa có resolver.

## Data contracts

`GET /api/games/:gameId` thêm trường `capabilities` (server-authorized, **chỉ kỹ năng của player hiện tại**); không đưa vai đối thủ hoặc nguồn khóa ẩn vào response. Các endpoint start/submit/resolve/phase và WebSocket projection kế thừa, không thay hợp đồng chung. Idempotency action+key và revision conflict vẫn được kiểm tra phía server.

## Source/data invariants

- `data/character.json` SHA-256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`.
- 97 ID duy nhất; **118 quyết định không đổi**; 207 legacy test specs không đổi; 145 nhánh kiểm kê legacy.
- 107 tệp frontend gốc trong `reference/approved_frontend_original/` giữ nguyên; gameplay UI chỉ sửa phần kết nối kỹ thuật; migrations 002/004/005/006 không sửa.
- `data/rule-intelligence-s05/*` là *execution overlay* của developer, không phải một bộ luật Wolvesville mới.
