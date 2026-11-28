# Sprint 03 Codex 97 — File Change Register

**Nền:** `Wolvesville_Sprint_03_Demo_Auth_Hotfix`. Không xóa/khởi tạo lại dự án.

| File | Loại | Nội dung | Ảnh hưởng |
|---|---|---|---|
| `frontend/app.js` | Edited | Bỏ mảng 100 vai nhúng; bộ đếm động; Wheel/Grid; tìm/lọc; detail chỉ dùng dữ liệu nguồn; bỏ nút thay vai cục bộ trong Codex | Codex only; live auth/gameplay không đổi |
| `frontend/integration.js` | Edited | `reloadCodex` xác minh dữ liệu async trước khi kích hoạt; trạng thái lỗi và retry | Nguồn vai chung cho Codex và UI runtime |
| `frontend/codex-data.js` | New | View-model, validation, Unicode folding, filter/count | Presentation only, no rules |
| `frontend/codex.css` | New | Grid responsive, typography theo Dark Fantasy gốc, hide số ID nằm trong ảnh bằng mask, reduced motion | Approved `style.css` không đổi |
| `frontend/assets/portraits/placeholder.svg` | New | Fallback trung tính cho ảnh lỗi | Không tạo nhân vật mới |
| `frontend/index.html` | Edited | Nạp `codex.css`, `codex-data.js` trước integration script | Không thay nội dung màn hình gốc |
| `backend/src/multiplayer/server.ts` | Edited | Allowlist đúng 2 asset mới, MIME an toàn | Không expose file hệ thống |
| `scripts/serve-03.mjs` | Edited | Port conflict thông báo có hướng dẫn, exit 1 | Startup only |
| `tests/codex-97.test.mjs` | New | 9 bài test source, filter, security, HTTP static | Regression |
| `tests/browser_codex_e2e.py` | New | Browser E2E: Demo→Codex→Wheel/Grid→search→filter→responsive→reconnect→logout | Regression |
| `tests/browser_e2e.py` | Edited | Test bridge tải artwork **thật** từ backend bằng routing URL thay vì about:blank không có ảnh | Test transport only |
| `package.json` | Edited | Script mới `test:codex`, `test:03:codex`, `test:browser:codex` | Không xóa script cũ |
| `README.md`, `docs/CODEX_97_*.md`, `reports/CODEX_97_*` | New/updated | Hướng dẫn, bằng chứng, báo cáo | Không ảnh hưởng runtime |

## Bất biến được kiểm tra

- `data/character.json` và `frontend/character.json`: SHA256 `7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3`.
- 118 quyết định từ 85 VH + 21 v1.2 + 12 Q13 không thay đổi.
- 207 legacy test specification còn nguyên; không tính vào số test code được thực thi.
- `reference/approved_frontend_original/` còn đủ 107 file byte gốc; 105/107 file dưới `frontend/` khớp nguyên bản; chỉ `app.js` và `index.html` khác vì tích hợp kỹ thuật. `style.css` và ảnh gốc giữ nguyên.
- SQLite/PostgreSQL migrations 002/004/005/006 giữ nguyên.
