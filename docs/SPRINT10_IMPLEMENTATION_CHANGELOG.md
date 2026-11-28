# Wolvesville Sprint 10 — gameplay implementation & change log

**Source release:** `1.2.0-s10`. **Parent:** official full source `1.1.0-s09`. This is a directly modified copy of the Sprint 09 source, not a newly created engine. All Sprint 01–09 backend, frontend, and legacy tests remain available.

## Implemented and wired into the real server

| Change | Source, scope, executable effect | Changed code |
|---|---|---|
| #5 Thẩm Phán Linh Hồn — **Cân Phán Quyết** | `character.json#5`, VH84; two uses per match, one action per night, actor-only exact real-faction verdict `Thiện / Ác / Không xác định`; NOT the other #5 skill Công Lý Tuyệt Đối | `backend/src/official/judgment-rules.ts`, engine registry/service, private feedback projector, room coordinator, `frontend/integration.js` |
| #76 Sói Ác Mộng — **khóa kỹ năng đêm** | `character.json#76`, VH41; two uses per match; lock is applied before the targeted submitted night ability is resolved; current-night effect and private notice, not a chat ban or a day vote ban | `backend/src/official/nightmare-rules.ts`, engine service/validation, room coordinator, `frontend/integration.js` |
| #20 Sói Gai Độc reaction integration | Pre-existing source-backed reactive inspection injury is retained and triggered by the **new** #5 inspection in the exact restricted deck | Engine's official reactive handling, judgment integration |
| Contract / feedback | `AURA_INFORMATION` feedback and `SOUL_JUDGMENT_OBSERVED` player-private event; `SKILL_LOCK_NOTICE` actor-independent text visible only to affected target | `backend/src/feedback/{contract,projector}.ts`, `backend/src/engine/service.ts`, `frontend/integration.js` |
| Developer-only V02/V03 lab | Versioned policy schema, pure hypothetical ballot/modifier/tie/quorum calculator with strict sandbox guard; **never** emits death, winner or gameplay commits | `backend/src/engine/vote-policy-sandbox.ts`; `tests/sprint10-policy.test.mjs` |
| Reproducible 97-role matrix | 97 records distinguish source data, executable active/passive, all skills implemented, interaction tests, restricted deck participation, competitive readiness. Does **not** rewrite original source/145-branch inventory | `scripts/build-s10-execution-matrix.mjs`, `scripts/build-s10-mechanism-graph.mjs`, `data/rule-intelligence-s10/` |
| Real tests | Three-account Chromium end-to-end gameplay, backend integration/privacy/idempotency/restart/replay, sandbox policy isolation, matrix verification, PostgreSQL live-gated test | `tests/sprint10*`, `tests/browser_s10_gameplay_e2e.py`, `tests/postgres-s10.test.mjs` |

## Verified restrictions

Supported S10 closed decks: `[5,20,25]`, `[5,25,74]`, `[25,74,76]`, `[5,25,76]` — in addition to all inherited restricted decks. A deck can **use the implemented branch** without being a certified full match. The source-dependent victory requirements, night attack ecosystem and post-death effects of other actors are still under investigation. The new decks must **not** be presented as competitive-ready or counted as finished full matches.

**Maintained:** 97 `data/character.json` records, 118 official merged decisions, 207 legacy test specifications, 145 audited branches. No source-of-truth modification, assertion suppression, source-derived rules replacement, role reveals to other clients or unapproved general hanging condition.

## Integration and versioning

- Engine and REST/WebSocket APIs from S09 retained; added branch registration without changing the Game Engine kernel or approved UX geometry.
- Graphics event extension: `2.2` → `2.3` **additive**; see `docs/SPRINT10_GRAPHICS_HANDOFF_v2_3.md`.
- Test command additions `test:10:new`, `test:10:all`, `test:browser:10`, `test:browser:10:all`, `test:pg:10`, `test:pg:10:all` in `package.json`.
- **Deferred, not implemented:** general hanging, winner resolution after hanging, generic elimination for other combat classes, all 97 playable abilities, competitive mode across arbitrary packs, live PostgreSQL acceptance (environment missing).
