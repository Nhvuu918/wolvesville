# Sprint 09 — Changed Files / Changelog

- `backend/src/official/vote-control-rules.ts`
- `backend/src/engine/vote-control-review.ts`
- `backend/src/engine/vote-review.ts`
- `backend/src/engine/vote-adjudicator.ts`
- `backend/src/engine/service.ts`
- `backend/src/game/coordinator.ts`
- `backend/src/game/archive.ts`
- `backend/src/official/capabilities.ts`
- `backend/src/official/inspection-rules.ts`
- `shared/contracts/index.ts`
- `frontend/integration.js`
- `tests/sprint09-voting.test.mjs`
- `tests/postgres-s09.test.mjs`
- `tests/browser_s09_e2e.py`
- `tests/browser_s08_gameplay_e2e.py`
- `package.json`
- `scripts/run-browser-s06.mjs`
- `README.md`

Xem `docs/SPRINT09_ENGINE_AND_RULE_AUDIT.md` để biết nguồn luật và lý do từng thay đổi. Thay đổi cho `browser_s08_gameplay_e2e.py` chỉ chờ `localSeatToId` và seat render trước thao tác, không sửa kỳ vọng thắng/thua; `scripts/run-browser-s06.mjs` được sử dụng để cô lập backend/DB và đóng tài nguyên. Không sửa migrations 002/004/005/006, `character.json`, 118 quyết định hay 207 đặc tả nguồn.

### Final verification fixes

- `backend/src/engine/service.ts`: **Removed incorrect unconditional #23 voting ban**; original role description only forbids voting **after death**. Existing generic life authorization continues to enforce dead-role denial.
- `tests/sprint09-voting.test.mjs`: S09-06 proves #23 **alive can vote / dead cannot**; denied command leaves revision and events unchanged.
- `frontend/integration.js`: preserve a live create-room form during background reconnect UI refresh; error notices explicitly force a render.
- `tests/browser_ux_e2e.py`: test reconnect while a user is typing a room form, then confirm real submit and room state.
