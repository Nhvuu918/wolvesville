# Sprint 06 — Technical Changelog v0.8.0

- `shared/contracts/index.ts`: thêm `DAY_VOTE_COLLECT`, VoteIntent/VoteLedger nội bộ, không công khai GameState.
- `backend/src/engine/state.ts`: State Machine bổ sung chuyển DAY_DISCUSS → DAY_VOTE_COLLECT → DAY_RESOLVE.
- `backend/src/engine/service.ts`: vote open, submit idempotent, close unresolved, server-only event, PH-02 official event + result; replay/snapshot đã có từ Engine.
- `backend/src/engine/validate.ts`: chỉ cho action #79 submit trong phase vote (rule adapter vẫn kiểm tra vai/target).
- `backend/src/official/peace-rules.ts` (**mới**): Sói Hòa Bình #79, reveal vai riêng, hủy vote, giới hạn 1 lần/trận, closed-deck.
- `backend/src/official/inspection-rules.ts`, `capabilities.ts`: cho phép deck 25/74/79; capability server cấp cho #79.
- `backend/src/official/victory-predicates.ts`: #8 sole survivor pure fact, anti-hanging guard khi còn Sói; không kết thúc trận.
- `backend/src/game/archive.ts`, `coordinator.ts`: đăng ký adapter, expose methods vote qua transaction, chặn kết luận vote không có luật.
- `backend/src/multiplayer/server.ts`: 4 endpoint vote + WS authorized after commit, metadata health.
- `scripts/serve-03.mjs`: bảo đảm `WV_OFFICIAL_RULE_TEST_MODE` không bật ở NODE_ENV=production.
- `frontend/integration.js`, `frontend/player-ux.js`: chọn bộ bài 3 chỗ, vote UI player-first, phase labels, #79 skill dynamic; giữ nguyên artwork và map/Bách khoa.
- `tests/sprint06-lifecycle.test.mjs`, `tests/postgres-s06.test.mjs`, `tests/browser_s06_e2e.py`: test mới.
- `scripts/run-browser-s06.mjs`, `package.json`: script chạy mới; Browser regression có lệnh riêng, không coi timeout là PASS.
- `docs/gameplay-flow-handoff/`: 12 tài liệu/hợp đồng đồ họa, JSON event catalog.
- Không chỉnh `character.json`, sổ luật, legacy specifications, frontend reference, migrations cũ hoặc Engine RNG/replay code cũ.
