# Sprint 05 — Root Causes & Regression Matrix

| Vấn đề | Nguyên nhân trực tiếp | Sửa đổi | Evidence |
|---|---|---|---|
| Skill UI chỉ hiện soi của #25/#74 | Frontend lấy loại hành động hardcode theo test pack cũ | Backend trả `ownCapabilities`, frontend chọn skill hiện `available` | `official-support.test.mjs`, `browser_s05_e2e.py` |
| #34 có thể khóa lệnh đã ACCEPTED của target, nhưng validator trước đó chỉ kiểm tra những lock tĩnh | Không có effect/status qua action queue cho #34 | Night status effect + resolver priority + revalidation | `official-support.test.mjs` test lock/cancel |
| #31 bảo vệ trùng liên tiếp | Không có lịch sử target-specific qua rounds | `OFFICIAL_31_LAST_GUARD` trên actor | `official-support.test.mjs` |
| #9 bảo vệ quá 3 người hoặc lặp | Không có lifetime target history | `OFFICIAL_9_USED_TARGET`, finite resource tracking | `official-support.test.mjs` |
| Browser 5-player concurrent submit đôi khi stale revision | Accepted action tăng revision trước khi client khác submit | Lấy snapshot mới, retry **một lần với SAME actionId & idempotencyKey** khi vẫn cùng phase/quyền | `browser_s05_e2e.py` |
| Browser runner gộp Sprint 04 bị treo | Shared backend DB/port, timeout promise có timer còn sống | isolate each suite, unref timer, cleanup child/server, expose exit code | `scripts/run-browser-s05.mjs`, browser log |
| Đếm pair source thay vì implemented | 4.656 screening bị hiểu thành solved | S05 overlay đặt `EXECUTABLE_RESTRICTED_SCOPE` chỉ khi test thực thi | `rule-expansion-knowledge.test.mjs` |
| Một số legacy tests kỳ vọng #25 soi hào quang | Test cũ không cùng nghĩa với mô tả gốc `character.json#25` | **Không sửa test**, ghi conflict trong gap docs, official adapter trả exact role | `docs/SPRINT05_INTERACTION_AND_VICTORY_AUDIT.md` |
| Victory check dễ bị xem là auto-win | Fact #28 được mô tả rõ nhưng chưa có end-of-chain algorithm | Pure fact `PENDING_END_OF_CHAIN`; không ghi game completed | `official-victory-facts.test.mjs` |
| PostgreSQL chưa có server trong workspace | `DATABASE_URL` không cung cấp | Test live schema isolated; required mode cấu hình thiếu → FAIL, không bao giờ tự PASS | `postgres-support.test.mjs` |

Mọi sửa đổi đều dựa trên source/test đã đối chiếu. Không xóa test cũ, thay thế migration cũ hoặc thay bộ 97 nhân vật để đạt PASS.
