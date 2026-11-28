# Sprint 08 — Readiness baseline verified from Sprint 07 backend

**Trạng thái bản cập nhật này:** `ACCEPTANCE FOUNDATION`, chưa phải Sprint 08 Full Gameplay Implementation. Đây là bản tích hợp **những yêu cầu bổ sung XVI–XXI** vào source Sprint 07 và thêm automated evidence gates; không mở luật/gameplay chưa có căn cứ.

## Readiness Metrics

| Chỉ số | Kết quả | Loại bằng chứng |
|---|---:|---|
| Nhân vật chính thức | 97 | Canonical `data/character.json`, `verify:source` |
| Nhân vật có nhánh runtime | 8 | Source `docs/SPRINT07_FULL_MATCH_READINESS.md` (#8,#9,#20,#25,#31,#34,#74,#79), không coi hoàn chỉnh |
| Nhân vật đã chứng minh hoàn thiện toàn bộ kỹ năng competitive | 0 | S07 readiness, không suy diễn |
| **Metric A — official match completed** | **1** | Runtime HTTP/SQLite script + Event Log + ACL + Replay + restart, #8/#25 |
| **Metric B — vote-to-elimination** | **0** | Runtime vote-intent no elimination + S07 rule blockers |
| Browser E2E PASS | Phụ thuộc lượt chạy | Không tính browser khi lệnh metrics chỉ chạy HTTP; S07 có browser evidence riêng |
| PostgreSQL acceptance | PENDING | Không có DB/URL trong môi trường build; cần chạy trên Mac |
| Graphics Handoff | READY FOR INTEGRATION — scoped | 19 UI states, machine-readable contract, chú thích phần Design Preview |
| Full Competitive Readiness | NO-GO | Generic vote resolution, general victory unresolved |

### Metric A ≠ Metric B

Kịch bản [8,25] kết thúc hợp lệ sau một đòn đêm, đáp ứng A nhưng không đi qua ngày, vote hay treo cổ nên không đáp ứng B. Bộ [25,74] đã thử ghi nhận phiếu và khóa phiếu nhưng **không có vote adjudication**, vì vậy cũng không đáp ứng B. Không tạo ra elimination/winner nhân tạo.

### Automated proof

```
npm run test:08:match-readiness
npm run test:08:all
```

Kết quả máy đọc được: `reports/S08_MATCH_READINESS.json`. Mỗi cấu hình có thông tin deck/players/skills/source, các cờ verified riêng, trạng thái browser/PG rõ ràng; dữ liệu được tái tạo bằng HTTP thực trong mỗi lần chạy.

### Các dependency gameplay còn chưa được mở

1. Quy tắc vote cuối sau thao túng (S07-V02) và hòa/không phiếu (S07-V03) chưa xác nhận đầy đủ.
2. Treo cổ chung với miễn treo, hiệu ứng chết dây chuyền (S07-E01) chưa có resolver.
3. Thắng nhiều phe và đồng thắng (S07-W01/W02) chưa đủ rule version/co-winner pipeline.

Tham chiếu `docs/SPRINT07_RULE_BLOCKER_DIAGNOSIS.md`, `docs/SPRINT07_UNRESOLVED_RULES.md` và `docs/S08_PLAYER_FIRST_ACCEPTANCE.md`.
