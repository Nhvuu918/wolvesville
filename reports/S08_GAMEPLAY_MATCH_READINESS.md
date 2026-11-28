# S08 Match Readiness — Real Backend Evidence

Evidence run: 2026-11-24T12:28:11.060Z

**Metric A = 2. Metric B = 0.** Independent metrics; B requires verified vote->elimination->victory check, not necessarily GAME_COMPLETED.

| Cấu hình | Người | Ban ngày | Voting | Vote resolution | Loại qua vote | GAME_COMPLETED | Replay/restart | Browser | PostgreSQL | Trạng thái |
|---|---:|---|---|---|---|---|---|---|---|---|
| 8 + 28 | 2 | Không | Không | Không | Không | Có | Có | Chưa chạy trong lệnh này | PENDING | GO_RESTRICTED_BACKEND_TEST |
| 8 + 25 | 2 | Không | Không | Không | Không | Có | Có | Chưa chạy trong lệnh này | PENDING | GO_RESTRICTED_BACKEND_TEST |
| 25 + 74 | 2 | Có | Có | Không | Không | Không | Không | Chưa chạy trong lệnh này | PENDING | PARTIAL |
| 20 + 25 + 74 | 3 | Chưa kiểm chứng | Chưa kiểm chứng | Không | Không | Không | Không | Chưa chạy trong lệnh này | PENDING | PARTIAL |
| 25 + 74 + 79 | 3 | Chưa kiểm chứng | Chưa kiểm chứng | Không | Không | Không | Không | Chưa chạy trong lệnh này | PENDING | PARTIAL |
| 9 + 25 + 31 + 34 + 74 | 5 | Chưa kiểm chứng | Chưa kiểm chứng | Không | Không | Không | Không | Chưa chạy trong lệnh này | PENDING | PARTIAL |

**Quy ước:** Chưa chạy không phải FAIL, cũng không phải PASS. Các cấu hình không thực thi trong lượt kiểm tra này chỉ là cấu hình đã có source/test ở Sprint trước. Không được cộng Metric A/B từ chúng.

Việc `GAME_COMPLETED` ở đêm đầu của [8,25] hoặc [8,28] KHÔNG tính Metric B. `CLOSED_UNRESOLVED` và hủy biểu quyết KHÔNG phải `VOTE_RESOLVED`.

Nguồn: `tests/sprint07-endgame.test.mjs`, `docs/SPRINT07_RULE_BLOCKER_DIAGNOSIS.md`, `backend/src/official/inspection-rules.ts`.
