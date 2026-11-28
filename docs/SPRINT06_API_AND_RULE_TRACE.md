# Sprint 06 HTTP/WS & Rule Traceability

**Tất cả endpoint game yêu cầu Bearer token; actor lấy từ session, room member và host xác minh phía server.** SQLite/PostgreSQL lưu kernel archive trong transaction `GameStore.withGameMutation`.

| Endpoint / WS | Điều kiện | Response | Mức trạng thái |
|---|---|---|---|
| `POST /api/games/:id/voting-open` | Host, `DAY_DISCUSS`, official restricted pack | `{voting:{phase:'DAY_VOTE_COLLECT', revision}}` | IMPLEMENTED & TESTED |
| `POST /api/games/:id/votes` | Game member, `DAY_VOTE_COLLECT`, người gửi còn quyền, target tham gia và còn sống trong test deck | `{vote:{status:'RECORDED',duplicate,revision}}` | IMPLEMENTED & TESTED; chưa có final vote |
| `GET /api/games/:id/voting` | Game member | `{voting:{available,status,round,submittedCount,ownBallot?}}` | IMPLEMENTED & TESTED |
| `POST /api/games/:id/voting-close` | Host, vote OPEN | `{voting:{status:'RULE_UNRESOLVED',revision,intents}}` | PARTIAL; chốt phiếu không phải xét treo |
| `POST /api/games/:id/actions` skill `official.79.cancel-vote-reveal` | Chủ vai #79; DAY_VOTE_COLLECT; 1 lần/trận; deck #25/#74/#79 | ACK `ACCEPTED`; không reveal trước commit | IMPLEMENTED & TESTED |
| `POST /api/games/:id/resolve` khi vote có #79 | Host; Engine giải action #79 | `{resolution:{phase:'NIGHT_COLLECT',...}}` | IMPLEMENTED & TESTED, PH-02 |
| `POST /api/games/:id/resolve` khi vote không hủy | Host | `409 RULE_UNRESOLVED`, rollback không đổi revision | IMPLEMENTED & TESTED, fail closed |
| `game.state_updated`/`game.events`/`game.skill_feedback` | WS đã auth và `game.subscribe` | Projection riêng từng người, sau COMMIT | IMPLEMENTED & TESTED |

Action #79 truy vết `character.json#79`, `PH-02`, `Q13-09`, `backend/src/official/peace-rules.ts`, `tests/sprint06-lifecycle.test.mjs` S06-07/08, `tests/browser_s06_e2e.py`. Không dùng RNG cho #79 vì target do player chọn và hành động không có random được nguồn yêu cầu.

**Tình trạng nhận phiếu** `RECORDED` là trạng thái của vote intent; không đồng nghĩa vote đã chốt hoặc target bị treo. Không dùng `CANCELLED` của voting để hủy những hành động ngày đã commit từ trước.
