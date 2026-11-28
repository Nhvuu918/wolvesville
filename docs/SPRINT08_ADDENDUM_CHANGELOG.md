# Sprint 08 Acceptance Foundation — Changelog

**Baseline:** Sprint 07 v0.9.0. **Scope:** các yêu cầu XVI–XXI mới, không sửa luật/Engine/UI đã duyệt.

| Tệp | Lý do | Xác minh |
|---|---|---|
| `scripts/s08-verify-match-readiness.mjs` | Chạy HTTP backend thật, kiểm chứng một trận kết thúc và một đường vote còn unresolved; sinh matrix runtime | `npm run test:08:match-readiness` |
| `scripts/s08-acceptance-scoring.mjs` | Hai tiêu chí A/B độc lập, từ chối bằng chứng thiếu | `tests/sprint08-acceptance-gates.test.mjs` |
| `tests/sprint08-acceptance-gates.test.mjs` | 6 regression gate, chặn đếm sai và sai trạng thái animation | `node --test` |
| `docs/gameplay-flow-handoff/S08_GRAPHICS_READY_CONTRACT.json` | 19 UI states có trigger, event, ACL, loading, reconnect, motion | Test S08-A05/06 |
| `docs/gameplay-flow-handoff/S08_GRAPHICS_TEAM_HANDOFF.md` | Hướng dẫn đồ họa dùng được mà không cần đọc Engine | Contract + review |
| `docs/S08_PLAYER_FIRST_ACCEPTANCE.md` | Đủ 12 câu hỏi người mới | Source evidence S07 |
| `docs/SPRINT08_MANDATORY_ACCEPTANCE_ADDENDUM.md` | Định nghĩa ràng buộc XVI–XXI | Source review |
| `docs/SPRINT08_ACCEPTANCE_BASELINE.md` | Báo cáo A=1, B=0; quyết định cụ thể | Script runtime |
| `README.md` / `package.json` | Lệnh và scope rõ ràng | npm run verify:source/build/tests |

**Không thay đổi:** `backend/src`, `shared`, `frontend`, `data/character.json`, toàn bộ sổ luật 118 và 207 specs, migrations, ảnh tham chiếu; chỉ thêm file và lệnh nghiệm thu. Không có PostgreSQL/competitive promotion.
