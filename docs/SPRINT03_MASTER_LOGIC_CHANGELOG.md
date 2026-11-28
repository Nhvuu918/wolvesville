# Sprint 03 — Technical Master Logic Changelog

Quyền thay đổi chỉ áp dụng tầng **kỹ thuật**, không sửa quy tắc 118 quyết định hoặc `character.json`.

| Thành phần | Phát hiện | Thay đổi kỹ thuật | Test/bằng chứng |
|---|---|---|---|
| Approved UI original `app.js` | Prototype tự tạo user/room/game và làm nguồn sự thật thứ hai | UI live adapter dùng backend; vô hiệu các lệnh local thay vai/đổi phase/vote/chat giả | Browser E2E 2 contexts |
| Codex role source | ROLES nhúng là catalog 100 vai với ID lệch #74, nhãn 100 vai đã cũ | Nạp 97 nhân vật official `character.json` khi runtime; sửa nhãn thành 97 vai và nhóm theo ID, không đổi layout | Browser E2E asserts ROLES.length=97/#74 correct |
| Stage dialogue | Hàm `runTypewriter` thêm text từng ký tự | Thay bằng gán đồng bộ `.textContent`, không xóa animation đồ họa | Browser E2E immediate full text; code scan |
| Auth/Login | Demo local account, không có server auth | UI register/login/logout/profile đi qua HTTP backend cùng origin | Browser E2E 2 users |
| Room | Room fake và status local | Real room directory, create/join/leave/lock/host server | Browser E2E; existing HTTP tests |
| Game Session | Role assignment và phase local | GameCoordinator + live server projection + strict official test pack | Browser E2E; 02C regression |
| Action feedback | ACCEPTED dễ bị coi là kết quả; UI tự suy diễn | Versioned `SkillFeedback`; projector event allowlist; pending before resolve; resolved only after commit | Feedback unit + integration tests |
| Authorization | Dễ lọt event raw hoặc gửi private cho cả room | User-scoped WS `game.skill_feedback`, authoritative event visibility, `GET /feedback` authentication | Cross-client E2E, unit tests |
| Stale revision | Client sau ACCEPTED vẫn giữ revision cũ, resolve conflict | Refresh revision từ server trước host resolve; discard stale snapshot | Browser E2E phát hiện và xác minh fix |
| SQLite feedback | Query cố đọc `skill_id` không có trong 02B schema | Reuse persisted `body_json` để map skill ID, không phá schema | 3 integration feedback tests |
| Reconnect | Result cũ biến mất hoặc nhận trùng notifications | Restore snapshot+feedback+visible events, dedup `actionId` và revision | Browser refresh + reconnect |
| Static file server | Original UI không có same-origin backend hosting | Allowlist static files, bounded path + no-store, base CSP | HTTP integration test |
| PostgreSQL | Feedback cần durability nhưng không nên migration chưa cần | Dựng từ archived persisted Actions & Events; giữ nguyên migration 002/004/005 | Code review; PG integration test defined **NOT RUN HERE** |

**Danh sách file Sprint 03 thêm:** `frontend/integration.js`, `frontend/integration.css`, `backend/src/feedback/contract.ts`, `backend/src/feedback/projector.ts`, `scripts/serve-03.mjs`, `tests/feedback.test.mjs`, `tests/feedback-projector.test.mjs`, `tests/postgres-feedback.test.mjs`, `tests/browser_e2e.py`, docs và reports mới.

**File sửa trực tiếp:** `frontend/app.js`, `frontend/index.html`, `backend/src/multiplayer/server.ts`, `backend/src/game/coordinator.ts`, `backend/src/persistence/sqlite.ts`, `scripts/verify-sources.mjs`, `package.json`, `README.md`, `.env.example` (development sample). Các sửa không thay luật official.

**Bảo toàn UI:** 105/107 file gốc giữ byte-identical; `app.js` và `index.html` là adaptation kỹ thuật, **bản gốc cả 107 file được giữ trong `reference/approved_frontend_original/`** và so checksum. Không sửa `style.css`, SVG, portraits, animation art.
