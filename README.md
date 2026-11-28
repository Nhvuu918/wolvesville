# Wolvesville v1.7.34 — Shared Group ACL / Full Role Factory WIP

Active v1.3.3; v1.3.4 CANDIDATE, not activated. All 18 approved Owner Choices preserved; PACK-PRIVACY-BOUNDARY remains PENDING. Added reusable system-issued CULT_DAY group authorization, private event transport and authorized frontend composer. Positive tests initialize a trusted archive fixture; they are not recruitment or Normal Gameplay evidence. No new FULL certificate or Normal Gameplay deck. See `reports/v1.7.34/COMPLETION_REPORT.md` and `FULL_CONTRACT_CLOSURE.md`. Run `npm run test:24:new` for ACL subsystem tests.

## Mac Apple Silicon — v1.7.34

Use ARM64 Node >=22.13. From the extracted root:

```sh
npm install
npm run verify:source
npm run build
npm run rules:build
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1734-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 WV_OWNER_DC_QA=0 npm run dev
```

Open http://127.0.0.1:3212. For existing #84 and #79 QA decks, use a separate `./local/v1734-qa.sqlite` database and `WV_OFFICIAL_RULE_TEST_MODE=1`; other QA flags remain 0. Do not expose QA mode publicly. The new group UI only appears for a real server-issued group grant; no normal room currently creates that grant. The technical fixture is test-only, not a player setup path.

```sh
npm run test:24:new
WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs
# Run browser separately; install playwright, requests, websocket-client in a venv first.
WV_E2E_DIRECT=1 WV_BROWSER_MANIFEST=reports/v1.7.34/BROWSER_MANIFEST.json node scripts/s15-bb-official-browser-matrix.mjs reports/local-v1734-browser browser_s23_mute_acl_e2e.py browser_s24_group_transport_e2e.py
```

Human QA / PostgreSQL Live / native Mac acceptance PENDING. Keep the old rules, logs and certificates unchanged. Current evidence only in `reports/v1.7.34`.

# Wolvesville v1.7.33 — FULL Certificate Breakthrough WIP

Active v1.3.3, v1.3.4 candidate only. 18 owner choices unchanged; PACK-PRIVACY-BOUNDARY pending. Public chat channel hardening, mute expiry, PH-02 queue cutoff. See reports/v1.7.33/COMPLETION_REPORT.md for evidence and limitations. Run `npm run test:23:new` for focused acceptance. Mac ARM64 Node >=22.13: install dependencies, verify:source, build, rules:build; use existing instructions below with a fresh local database.

# Wolvesville v1.7.26 — Completion & Release Convergence (partial engineering checkpoint)

Continuation of `1.7.25-s15-privacy-stability-wip`. Official `wolvesville-official-v1.3.3` remains active; v1.3.4 remains CANDIDATE / not authorized for activation. No new FULL certificate or deck is issued. Competitive production NO-GO. Historical reports below remain immutable and are not fresh evidence. Current acceptance and blockers: `reports/v1.7.26/EXECUTIVE_REPORT.md`, `reports/v1.7.26/acceptance.json`, `reports/v1.7.26/release-gates.json`.

## Mac Apple Silicon — local QA

Use ARM64 Node >=22.13. In Terminal, enter the extracted root and run:

```sh
npm install
npm run verify:source
npm run build
npm run rules:build
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1726-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```

Open `http://127.0.0.1:3212` with independent browser profiles; register separate accounts, create and lock a room, select the named QA deck and start. See `reports/v1.7.26/HUMAN_QA.md` for three UI-only tasks. Use a separate database and all three QA flags set to `0` for normal gameplay. Do not expose QA mode to the internet or production.

## Reproduce current-source acceptance

```sh
npm run build
node --test --test-concurrency=2 tests/sprint15-bb-live.test.mjs tests/sprint15-owner-bb-v2.test.mjs
node --test --test-concurrency=2 tests/sprint15-deep-medium.test.mjs tests/sprint15-roles.test.mjs
WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs
```

For browser acceptance, create a Python virtual environment; `pip install playwright requests websocket-client` and `python -m playwright install chromium`. After backend tests finish, run `WV_E2E_DIRECT=1 npm run test:browser:15:privacy-stability:matrix -- reports/local-v1726-browser --shard=1/4` on Mac, repeat with shards 2–4 in separate output directories. Use new output directories for fresh attempts and keep the 72-suite / 107-version inventory unchanged. The browser runner is not modified. Native Chromium loopback was blocked in the build environment; this is not native Mac acceptance.

## Current changes

Mixed pack QA: player-local visible event ordinals, authorized event counts for replay, no internal RNG/revision totals in replay receipts, no other players' resolved/cancelled/RNG counts in phase receipts, duplicate pack submission does not broadcast redundant WS snapshots. The fixed-member-order and KEEP behavior remain unchanged; a stale waiting banner is corrected when the current eligible set no longer has missing responses. Server-internal ledger and replay verification are preserved. Global game revision, timings, legal outcome inference and additional live interactions remain unclosed. No ruleset activation or migration.

---

# Wolvesville v1.7.23 — Owner decision integration & certificate closure (WIP)

Direct continuation of v1.7.22. Official rules 1.3.3 remain active; 1.3.4 CANDIDATE only. Latest decision BB-REP-NEW-01=B: fixed all-player representative permutation generated server-side, filtered by legal eligibility. New local QA [74,84,93,94] supports #93 conversion after #94 death, not general mixed conversion. See `docs/SPRINT15_REPRESENTATIVE_ORDER_CHANGELOG.md`, `reports/BB_REPRESENTATIVE_ACCEPTANCE.json`, `reports/BB_REPRESENTATIVE_HUMAN_QA_PACK.md`.

Mac Apple Silicon: ARM64 Node 22.13+, `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`. Normal play (QA flags off):

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 npm run dev
```

Local QA (separate DB):

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/representative-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```

Register accounts in independent browser profiles. For tests: `npm run test:15:bb-representative`; `node --test tests/sprint15-five-player-completion.test.mjs`; `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=3 tests/*.test.mjs` after build. Browser: install Python `playwright requests websocket-client`, `python -m playwright install chromium`, `WV_E2E_DIRECT=1 npm run test:browser:15:bb-representative` on native Mac. `npm run test:browser:15:bb-representative:matrix -- reports/local-rep-shard1 --shard=1/4` for the current 70 suites / 105 obligations. `python3 reports/s15-representative/build_reports.py --verify` checks current metrics from saved evidence. Old reports below are historical.

---

# Wolvesville v1.7.21 — Official B/B preparation (WIP)

Ruleset 1.3.3 remains ACTIVE; v1.3.4 is an unpublished CANDIDATE preview. Owner record WV-RD-BB-2026-01 is stored under `data/rules/owner_bb_final_decisions_20261125.json`.

Mac Apple Silicon: Node >=22.13; `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`. Run `npm run dev` for normal mode (QA flags off). For local B/B QA only:

```sh
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/bb-final-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```

Use independent browser profiles and registered accounts. In QA B/B — Witch deck, trap #29 in night 1; in night 2 attack #25 with #8, submit rescue, click `Chốt bình cứu, mở lượt độc`, reconnect, submit poison, close night. Combined window also remains available. For browser tests install Python `playwright requests websocket-client`, run `python -m playwright install chromium`; on Mac set `WV_E2E_DIRECT=1` to use real localhost navigation. See `reports/BB_OFFICIAL_HUMAN_QA_PACK.md` for tasks and `docs/SPRINT15_OFFICIAL_BB_CHANGELOG.md` for limitations.

`npm run test:15:bb-official`, `npm run test:browser:15:bb-cross-window`, `npm run test:browser:15:bb-official:matrix -- reports/local-official-shard-1 --shard=1/4`.

---

# Wolvesville v1.7.20 — Live-to-official readiness (WIP)

Official rules remain **1.3.3**. Two extra controlled QA compositions use the existing live profiles: [8,10,25,29] (witch potion group), [25,48,74,77] (sole wolf two attacks and retaliation). No official 1.3.4 activation. See `reports/BB_RELEASE_HUMAN_QA_PACK.md`, `reports/BB_RELEASE_PENDING_DECISIONS.md` and `reports/BB_RELEASE_ACCEPTANCE.json`. macOS ARM64 Node 22.13+: `npm install`, `npm run build`, `npm run rules:build`. QA: `DB_PROVIDER=sqlite HOST=127.0.0.1 WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev`. Normal play: all QA flags off. `npm run test:15:bb-release` and `npm run test:browser:15:bb-release` reproduce the live suites; `npm run test:browser:15:bb-release:matrix -- reports/local-new --shard=1/4` runs a checkpointed shard. Prior reports are historical.

# Wolvesville v1.7.19 — Live B/B QA (WIP)

New local QA profiles use the real Game Session archive, but are not official gameplay or ruleset 1.3.4. See `docs/SPRINT15_BB_LIVE_CHANGELOG.md` and `reports/BB_LIVE_HUMAN_QA_PACK.md`. Start locally with `DB_PROVIDER=sqlite HOST=127.0.0.1 WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev`. For ordinary play keep all QA flags off.

# WOLVESVILLE — 1.7.18-s15-owner-bb-finalization-wip

Direct continuation of v1.7.17. Official rules remain **wolvesville-official-v1.3.3**. Owner B/B supplementary decisions are recorded in `data/rules/owner_bb_candidate_v2_decisions.json`; v2 uses separate candidate journal streams and an authenticated QA shadow-resolution gateway. No official game archive writes, public candidate endpoints, or official activation. `npm run test:15:owner-bb:v2` reproduces the new candidate tests. See `reports/OWNER_BB_V2_ACCEPTANCE.json` for current gates; all prior reports are historical. Mac: Node 22.13+, `npm install`, `npm run build`, `npm run rules:build`, and `WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev` for the existing normal gameplay.

---

# WOLVESVILLE — Sprint 15 Engine Maturity (1.7.13-s15-engine-maturity-wip)

Direct continuation of 1.7.12, not a rollback to 1.7.10. Official rules **wolvesville-official-v1.3.3**; WIP, competitive NO-GO. Four normal compositions: [8,25], [8,74], [8,25,74], [25,31,48,74]. The new four-person room reuses the source-approved single-wolf Leader/Guard domain. Multi-wolf intake prototype is isolated, not an official adapter or endpoint. No new rule version or gameplay consensus rule.

**Mac Apple Silicon:** ARM64 Node >=22.13, `npm install`; `DB_PROVIDER=sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev` (leave `WV_ARCHIVED_RULE_REGRESSION` unset). Open printed local URL. Register/login with four distinct browser profiles, create a four-seat room, join, lock, select Tiên Tri / Bảo Vệ / Sói Thủ Lĩnh / Tiên Tri Huyền Bí, each Ready, Start. Server assigns roles. One wolf may select one or two valid targets. Coordinator closes night and voting. No general-purpose competitive or arbitrary decks.

**Acceptance commands:** `npm run verify:source`, `npm run build`, `npm run rules:build`, `npm run test:15:all`. Browser dependencies: `python3 -m venv .venv`, `source .venv/bin/activate`, `pip install playwright requests websocket-client`, `python -m playwright install chromium`. `WV_E2E_DIRECT=1 npm run test:browser:15:normal-guard` runs both new four-human browser cases with native local networking. `npm run test:browser:15:maturity:matrix -- reports/s15-maturity/fresh-run` runs all 51 suites / 86 version obligations into a new directory. Use `WV_BROWSER_JOBS=1` for resource-constrained machines; no deadline has been increased. See `reports/S15_MATURITY_ACCEPTANCE.json`, `reports/S15_MATURITY_METRICS.json`, `docs/SPRINT15_MATURITY_CHANGELOG.md`. Older reports and commands are preserved as historical evidence, not fresh acceptance.

---

# WOLVESVILLE — Sprint 15 Continued Development (1.7.12-s15-continuation-wip)

Direct continuation of the uploaded 1.7.11 checkpoint, official rules **wolvesville-official-v1.3.3**. WIP / restricted normal gameplay; competitive production NO-GO. No new gameplay law, no engine rewrite. Three normal compositions are admitted: [8,25], [8,74], [8,25,74]. See `docs/SPRINT15_CONTINUED_CHANGELOG.md` and `reports/S15_CONTINUED_ACCEPTANCE.json` for exact current-payload results and blockers. The previous `S15_PLAY_*` and `S15_METRICS.json` reports are historical checkpoint evidence, not current results.

**Mac Apple Silicon:** install ARM64 Node.js >=22.13 (Node 22 recommended), then `npm install`. Copy `.env.example` to `.env` only if needed. Set `DB_PROVIDER=sqlite`, `WV_OFFICIAL_RULE_TEST_MODE=0`, `WV_INTEGRATION_TEST_MODE=0`; leave `WV_ARCHIVED_RULE_REGRESSION` unset. Run `npm run dev`; open the local URL printed by the server. Register/login with 3 distinct browser profiles, create a 3-seat room, join and lock, choose the three-role composition, confirm readiness on each client and start. Only the coordinator advances the night and opens/closes voting. Server assigns roles. No bots or arbitrary decks admitted.

**Reproduce:** `npm run verify:source`, `npm run build`, `npm run rules:build`, `npm run test:15:all`. Install Python dependencies in a virtual environment (`python3 -m venv .venv`, `source .venv/bin/activate`, `pip install playwright requests websocket-client`, `python -m playwright install chromium`). `npm run test:browser:15:continued` runs both three-player browser cases. `WV_E2E_DIRECT=1 npm run test:browser:15:continued` uses native browser networking if available. To run all 50 suites / 85 rule-version obligations, after build execute `node scripts/s15-continued-browser-matrix.mjs reports/s15-continued/fresh-run` (directory must not exist). It preserves all inherited obligations, reports missing obligations as INCOMPLETE and never reuses baseline logs. For a targeted run append exact suite names. Older scripts and reports below are archived reproduction entrypoints for earlier checkpoints; do not treat them as current acceptance.

---

# WOLVESVILLE — Sprint 15 Completion Closure (1.7.8-s15-closure-wip)

Continuation of 1.7.7. Restricted QA, competitive NO-GO. `npm install`; `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev` (Node >=22.13). Select the named four-player Hunter/Snow or Revenge/Hunter QA deck. `npm run test:15:closure`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:closure`, `npm run test:browser:15:all`. Python Playwright/Chromium per inherited Mac guide. PostgreSQL live requires actual test database. See `reports/S15_CLOSURE_ACCEPTANCE.json` and `docs/SPRINT15_COMPLETION_CLOSURE_RULE_DERIVATIONS.md`.

---

# WOLVESVILLE — Sprint 15 Final Breakthrough (1.7.7-s15-final-breakthrough-wip)

Direct continuation of 1.7.6. Restricted QA, not competitive production. #88 hanging/night death follow, #33 private post-hanging response, #93 one-wolf post-conversion pack bite (up to two), #87 preliminary rescue. No certified FULL role or branch-complete deck; do not infer generalized village victory. See `reports/S15_FINAL_BREAKTHROUGH_ACCEPTANCE.json`, `reports/S15_METRICS.json` and `docs/SPRINT15_FINAL_BREAKTHROUGH_RULE_DERIVATIONS.md`.

Mac Apple Silicon: Node >=22.13; `npm install`; `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev`. Use the named 3/4/5-player QA decks. `npm run test:15:final-breakthrough`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:final-breakthrough`, `npm run test:browser:15:all`. Install Python Playwright/Chromium using inherited Mac guide. PostgreSQL requires separate real test database.

---

# WOLVESVILLE — Sprint 15 Breakthrough (1.7.6-s15-breakthrough-wip)

Direct continuation of Deep Completion (1.7.5). Source-scoped QA gameplay only. Hanging immunity #8/#55/#19, #37 aura and hanging swap, #94 effigy, #93 alignment, #28 linked-death distinction. See `reports/S15_METRICS.json` for measured coverage, `reports/S15_BREAKTHROUGH_ACCEPTANCE.json` for verified gates, `docs/SPRINT15_BREAKTHROUGH_RULE_DERIVATIONS.md` for provenance. No competitive GO.

Mac Apple Silicon: Node >=22.13; `npm install`, `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev`. Choose the named QA decks. `npm run test:15:breakthrough`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:breakthrough`, `npm run test:browser:15:all`. Python Playwright/Chromium as in the inherited Mac guide.

---

# WOLVESVILLE — Sprint 15 Deep Completion (1.7.5-s15-deep-wip)

Direct continuation of 1.7.4 accelerated source. Restricted QA: R=44/97; F=0; A/B/C=24/18/0. Atomized source subset: 21/24 branches executed/tested across 11 audited roles; this is not a global skill coverage rate. Competitive NO-GO.

New shared preliminary death/rescue, redirect, secret pair death-chain and source-scoped co-winners. See `docs/SPRINT15_DEEP_RULE_DERIVATIONS.md`, `docs/SPRINT15_DEEP_ROLE_FULL_READINESS_MATRIX.md`, `reports/S15_DEEP_ATOMIC_COVERAGE.json`, `reports/S15_DEEP_ACCEPTANCE.json`.

Mac Apple Silicon: Node >=22.13, `npm install`, `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev`. Use the explicitly named QA decks, not unrestricted competitive play. `npm run test:15:deep`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:deep`, `npm run test:browser:15:all`. Install Python Playwright and Chromium using the inherited Mac guide. SQLite test isolation; live PostgreSQL pending unless configured.

---

# WOLVESVILLE — Sprint 15 Accelerated (1.7.4-s15-accelerated-wip)

Direct continuation of 1.7.3. Restricted QA, R=42/97, F=0, A/B/C=17/13/0, S global denominator not certified. Competitive NO-GO. See `docs/SPRINT15_ACCELERATED_QA.md`, `docs/SPRINT15_ACCELERATED_RULE_DERIVATIONS.md`, and `reports/S15_CHARACTER_ID_DELTA.json`.

Local Mac: Node >=22.13, `npm install`, `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev`. Check supported player counts/decks. `npm run test:15:accelerated`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:all`. Browser prerequisites in Mac guide.

---

# WOLVESVILLE — Sprint 15 (1.7.0-s15-wip)

Direct continuation of Sprint 14 Recovery. Restricted execution R=31/97, F=0, A/B/C=8/6/0. Six newly evidenced skill/passive branches, exact global S ratio not certified. Competitive NO-GO. See docs/SPRINT15_QA_REPORT.md for actual acceptance, docs/SPRINT15_MACOS_APPLE_SILICON.md for commands, reports/S15_METRICS.json and reports/S15_SKILL_BRANCH_COVERAGE.json for evidence.

---

# WOLVESVILLE — Sprint 13 Character Implementation (1.5.0-s13)

**Source of truth:** Direct continuation of Sprint 12 `v1.4.0-s12`; not a rebuilt engine or frontend. All inherited source and legacy data are retained.

**Proven restricted gameplay:** Metric R **18/97**, up from **11/97**. Newly executed characters: #11 Thợ Rèn Cơ Khí (maintenance), #16 Phù Thủy Cấm Kỵ (antidote / delayed poison), #17 Nữ Tu Huyết Thệ (public wolf judgment), #24 Quản Ngục (jail), #59 Ná Thủ (injury), #66 Người Gác Đêm (protection), #67 Thợ Rèn (shield). All seven are PARTIAL, not FULL. Noncompetitive role combinations only.

**Other metrics:** F=0; S exact branch denominator unverified (19 minimum technical paths evidenced; not a certified branch coverage ratio); A=6, B=6, C=0. Competitive production **NO-GO**.

**Verified QA:** 211 backend PASS, 0 FAIL, 11 PostgreSQL SKIPPED (222 total). 14 inherited browser suites passed when executed independently or in groups, not certified as one aggregate-run pass. One new browser E2E passed using an actual backend and three Chromium contexts. Live PostgreSQL remains PENDING.

**Quick start (macOS Apple Silicon):**

```bash
node --version                       # 22.13+
npm install
cp .env.example .env
# Use isolated SQLite and explicit restricted official rule test mode locally.
npm run verify:source
npm run build
npm run rules:build
npm run test:13:all
npm run dev
```

For browser E2E install Python browser dependencies and Playwright Chromium per `docs/SPRINT13_MACOS_APPLE_SILICON.md`; run `npm run test:browser:13` (runner uses a temporary SQLite DB). For exact PASS/FAIL/SKIPPED caveats read `docs/SPRINT13_QA_REPORT.md`. For 97 character readiness and 118-rule traceability see `docs/SPRINT13_97_CHARACTER_READINESS.md` and `docs/SPRINT13_DECISION_TO_IMPLEMENTATION_GAP.md`. All modified skill sources require their rule provenance.

---

## Historical readmes and legacy sprint notes (preserved)

# Wolvesville Sprint 11 — Official Voting (1.3.0-s11)

Parent: Sprint 10 v1.2.0-s10. New restricted official-policy matches `[8,25]` and `[8,28]` support ballot replacement, blank, unique positive leader, tie/zero, atomic hanging, post-elimination closure, victory, replay. Metric A=2; Metric B=2 for exercised paths only. Other legacy packs retain prior restricted behavior. #28 is named Thằng Ngố in immutable source. No broad competitive readiness claim.

Run `npm install`, `cp .env.example .env`, set `DB_PROVIDER=sqlite`, `WV_OFFICIAL_RULE_TEST_MODE=1` and optionally `WV_ENABLE_DEMO_AUTH=1` for local testing, then `npm run test:11:all`, `npm run dev`. For browsers install `python3 -m pip install -r tests/requirements-browser.txt` and `python3 -m playwright install chromium`, then `npm run test:browser:11`. See `docs/SPRINT11_ACCEPTANCE.md`, `docs/SPRINT11_GRAPHICS_HANDOFF_v2_4.md` and `docs/SPRINT11_MACOS.md`. Old docs below are historical, not current metrics or rule decisions.

---

# Wolvesville — Sprint 10 Gameplay Expansion

**Version:** `1.2.0-s10` | **Parent:** Sprint 09 `1.1.0-s09`, inherited and retained. No new project or rewritten frontend/game engine.

**New gameplay from confirmed sources:** #5 **Thẩm Phán Linh Hồn — Cân Phán Quyết** (`character.json#5`, VH84), private three-state verdict, twice per match; #76 **Sói Ác Mộng** (`character.json#76`, VH41), two uses per match, current-night ability lock before pending skill resolves; verified private feedback, actor cancellation, persistent logs/replay, 3-user real Chromium end-to-end. New closed decks `[5,20,25]`, `[5,25,74]`, `[25,74,76]`, `[5,25,76]`. Source remains 97 characters/118 official decisions/207 legacy specs/145 audited branches.

**Current proven boundaries:** **Metric A = 2** (`[8,25]`, `[8,28]` inherited genuine completed matches), **Metric B = 0** (general V02/V03 hanging policy still unapproved). **11 characters** have at least one executable restricted branch, **0** certified fully implemented or competitive-ready, no new official multi-round finished pack. The developer-only unapproved V02/V03 policy evaluator is never connected to official gameplay. PostgreSQL live remains pending without an actual instance.

**Quick start (Mac Apple Silicon or Linux):**

```bash
npm install
cp .env.example .env
npm run verify:source
npm run build
npm run rules:build
npm run test:10:all
npm run dev
```

**Key new docs:** [Gameplay & acceptance](docs/SPRINT10_GAMEPLAY_READINESS_AND_GATES.md) · [V02/V03 decision pack](docs/SPRINT10_RULE_POLICIES_V02_V03.md) · [Graphics handoff v2.3](docs/SPRINT10_GRAPHICS_HANDOFF_v2_3.md) · [Mac instructions](docs/SPRINT10_MACOS_APPLE_SILICON.md) · [Change log](docs/SPRINT10_IMPLEMENTATION_CHANGELOG.md) · [QA results](docs/SPRINT10_QA_REPORT.md) · [Open issues](docs/SPRINT10_UNRESOLVED_AND_NEXT.md) · [145-branch dependency graph](docs/SPRINT10_SKILL_DEPENDENCY_GRAPH.md).

---

## Inherited Sprint 09 documentation (preserved)

# Wolvesville — Sprint 09 Voting & Multi-Round Gameplay

**Phiên bản:** `1.1.0-s09`  
**Kế thừa:** Sprint 08 Gameplay Implementation `v1.0.0-s08-gameplay` + Sprint 01–07 + Sprint 08 Acceptance Foundation.  
**Bản phát triển thực thi:** Có thay đổi Game Engine, API flow, skill adapter, vote audit, UI và kiểm thử. Không phải bản báo cáo đơn thuần.

## Kết quả chính được chứng minh

- **NEW #33 Sói Lừa Gạt** `official.33.force-vote`: người chơi sở hữu quyền chọn **một** người bị ép bỏ phiếu theo người điều khiển **một lần trong trận**; xác nhận luật qua `character.json#33`. Engine xử lý **giai đoạn ngày**, nhận/action commit/lock, tính lại phiếu hiệu lực ở backend khi phiếu gốc đầy đủ, giữ private directive và replay được. Hỗ trợ trong **closed deck `[25,33,74]`**, không bật rule pack chung.
- **FIX #23 Xạ Thủ Linh Hồn — đúng điều kiện từ nguồn**: nhân vật **được bỏ phiếu khi còn sống**, nhưng **không được bỏ phiếu sau khi đã chết** (`character.json#23`). Backend kiểm tra life state; yêu cầu bỏ phiếu sau chết bị từ chối không thay revision/Event Log. Đây là validation rule, không phải một playable skill pack cho #23.
- **NEW server audit of effective ballots**: `Vote Collection → Source-checked Modifier → Vote Lock → Private Effective Tally → Official Outcome`. Hiện `Official Outcome` chỉ có cancellation được xác nhận PH-02 hoặc `ADJUDICATION_UNRESOLVED`; **không tự dựng người bị treo** khi V02/V03 chưa chốt.
- **INHERITED** PH-02 Sói Hòa Bình #79 hủy biểu quyết, hệ thống chuyển đêm tiếp; nhánh test-only day progression được giữ để kiểm thử hiệu ứng kéo dài, **ẩn khỏi UI**, không coi là luật bỏ qua phiếu chính thức.
- **INHERITED** hai restricted early-night full matches có `GAME_COMPLETED` thật: `[8,25]` và `[8,28]`. Source & rules không sửa; replay và ACL được giữ.

## Trạng thái theo từng phần

| Kết quả | Trạng thái |
|---|---|
| **Metric A** — Completed official match configurations | **2** (giữ nguyên, có test backend) |
| **Metric B** — Vote → Elimination → Victory | **0** (không thay đổi định nghĩa; không có hanging được chứng minh) |
| Nhân vật có ít nhất một skill/active/passive executable branch | **9**, tăng từ 8 nhờ #33; không tính riêng #23 validation hay #28 victory fact |
| Official Coercion #33 closed deck | **GO — Restricted Test** |
| Vote intake & modifiers trong closed deck | **GO/PARTIAL**: tính phiếu cuối theo nguồn #33; kết luận treo chưa đủ luật |
| General vote-to-elimination | **PARTIAL / BLOCKED V02–V03** |
| Restricted full match `[8,25]`, `[8,28]` | **GO** trên SQLite test mode |
| PostgreSQL 16 live | **PENDING** (không có `DATABASE_URL` / server trong workspace) |
| Full Competitive 97 nhân vật | **NO-GO** |

## Chạy trên Mac Apple Silicon

```bash
npm install
cp .env.example .env
# Đối với local development: DB_PROVIDER=sqlite; DATABASE_URL=;
# Bật WV_ENABLE_DEMO_AUTH=1, WV_OFFICIAL_RULE_TEST_MODE=1 nếu muốn test demo.
npm run verify:source
npm run build
npm run test:09:all
npm run dev
```

Mở `http://127.0.0.1:3212` trừ khi thay `PORT`. Dùng 3 tài khoản Demo độc lập, tạo/khóa phòng có sức chứa 3 và chọn bộ vai **Sói Lừa Gạt**. Mọi thao tác gửi kỹ năng và bỏ phiếu qua backend thật. Phiếu bị ép chỉ được tính khi đủ input; không hiện kết quả treo giả.

### Browser E2E / PostgreSQL

```bash
python3 -m pip install -r tests/requirements-browser.txt
python3 -m playwright install chromium
npm run test:browser:09
npm run test:browser:09:all
# Chỉ khi DATABASE_URL trỏ tới DB thử nghiệm PostgreSQL 16 thật:
npm run test:pg:09
npm run test:pg:09:all
```

Trên Mac, PostgreSQL giữ container/volume đang có, **không reset database**. Test dùng schema riêng có hậu tố ngẫu nhiên và chỉ dọn schema do nó tạo ra. Xem `docs/SPRINT09_MACOS_M5.md`.

## Kiểm thử đã thực hiện

- `npm run verify:source` PASS: 97 nhân vật, 118 quyết định, 207 legacy *specifications*, 107 frontend reference files.
- `npm run build` PASS.
- `npm run test:09:all`: **186 definitions: 176 PASS, 0 FAIL, 10 PostgreSQL SKIPPED, exit 0**.
- `npm run test:browser:09:all`: **10/10 Browser E2E suites PASS, exit 0**, trên backend SQLite thật. Native Mac browser chưa được chạy trong workspace Linux này.
- Strict PostgreSQL negative (không có URL) **0 PASS, 1 FAIL, exit 1** — đúng fail-closed, không tính PostgreSQL PASS.
- **NO LIVE PostgreSQL test**: vẫn PENDING.

Source của test nằm trong `tests/sprint09-voting.test.mjs`, `tests/postgres-s09.test.mjs`, `tests/browser_s09_e2e.py`; logs nằm trong `reports/S09_*`.

## Hồ sơ kiểm toán và đồ họa

- **Cần chủ dự án quyết định V02/V03:** [`docs/VOTING_RULE_DECISION_PACKAGE.md`](docs/VOTING_RULE_DECISION_PACKAGE.md)
- **Rule source inventory, source-to-code map, root causes:** [`docs/SPRINT09_ENGINE_AND_RULE_AUDIT.md`](docs/SPRINT09_ENGINE_AND_RULE_AUDIT.md)
- **Match readiness A/B:** [`docs/SPRINT09_MATCH_READINESS.md`](docs/SPRINT09_MATCH_READINESS.md)
- **Regression / QA thật:** [`docs/SPRINT09_REGRESSION_AND_ACCEPTANCE.md`](docs/SPRINT09_REGRESSION_AND_ACCEPTANCE.md)
- **Graphics Handoff delta v2.2:** [`docs/SPRINT09_GRAPHICS_HANDOFF_DELTA.md`](docs/SPRINT09_GRAPHICS_HANDOFF_DELTA.md)
- **Unresolved / next iteration:** [`docs/SPRINT09_UNRESOLVED_AND_NEXT.md`](docs/SPRINT09_UNRESOLVED_AND_NEXT.md)
- **Mac M5:** [`docs/SPRINT09_MACOS_M5.md`](docs/SPRINT09_MACOS_M5.md)
- **Original source QA/VH:** [`reference/VH01_VH85_original_source_reference.md`](reference/VH01_VH85_original_source_reference.md)

## Bảo mật, source và luật

- Dữ liệu `character.json` 97 vai, 118 decisions, 207 legacy specs, 107 frontend nguyên bản và artwork giữ nguyên; `migrations 002/004/005/006` nguyên vẹn.
- Event Log, private feedback và vote private directive không công khai cho người chơi khác; UI không hiện Character ID hoặc adapter ID.
- `ACCEPTED` khác `RESOLVED`. Vote audit khác Official Outcome. Không có luật V03 thì không có `ELIMINATION_AUTHORIZED`.
- `node_modules`, `.env` có secrets và database runtime **không nằm trong ZIP**.

**Final source-grounding correction:** `character.json#23` forbids voting **only after death**, not while alive. The final source and S09-06 regression validate both states. A reconnect-driven refresh must also preserve the user's open create-room form; browser UX tests this explicitly.

**Clean ZIP validation:** Extracted full source into a new workspace (with preinstalled npm dependencies linked only locally to run tests), verified/builded and ran **176 PASS / 0 FAIL / 10 PostgreSQL SKIPPED / exit 0** plus Sprint 09 Chromium E2E **PASS, exit 0**. Logs: `reports/S09_CLEAN_ZIP_FULL_REGRESSION.log`, `reports/S09_CLEAN_ZIP_BROWSER.log`.

## Sprint 12 (1.4.0-s12)
Restricted Attack/Protection, multi-player death-chain and resolution gate; six durable metric proof tests. Use `npm run test:12:all` and `npm run test:browser:12:all`. See docs/SPRINT12_MACOS.md, SPRINT12_ENGINEERING_DECISION_LOG.md and SPRINT12_BRANCH_COVERAGE.md. Not competitive-ready.

## Sprint 14 WIP — 1.6.0-s14-wip

Current release status: restricted QA, competitive NO-GO. See `docs/SPRINT14_QA_REPORT.md`, `docs/SPRINT14_MACOS_APPLE_SILICON.md` and `reports/S14_METRICS.json`. Historical Sprint 13 sections above are retained as historical reference.

## Sprint 14 browser recovery — 1.6.0-s14-recovery

This revision fixes the Linux browser E2E transport and context teardown without changing gameplay or saved rules. Run `npm run test:browser:14:all` for the 17-suite manifest (15 inherited, S14 gameplay, idle transport regression). Each suite uses isolated SQLite. See `docs/SPRINT14_BROWSER_RECOVERY.md` and `reports/S14_BROWSER_RECOVERY.json`. Competitive production remains NO-GO; PostgreSQL live pending and role completion not certified.

Recovery acceptance: 227 backend PASS, 0 FAIL, 11 PostgreSQL SKIPPED; 15 inherited browser suites plus two S14 suites PASS. Tested on clean candidate with verified executable payload. R/F/A/B/C remain 27/0/8/6/0. No new gameplay in this revision.

### Sprint 15 UX / owner feedback (1.7.2-s15-ux-wip)

**Latest owner correction:** #25 Tiên Tri sees only aura (Thiện, Ác, Không xác định). #74 Tiên Tri Huyền Bí still sees the exact character. Start a new match to use the new ruleset; historical matches retain their original event semantics. See `data/rules/sprint15_owner_seer_correction.json`.

New in-match role composition (initial public deck, no mapping), role wheel (presentation only, server role assignment), clearly separated private Seer result, chat panel and click/keyboard states. Supported official closed QA decks only. No competitive release; see `docs/SPRINT15_GAMEPLAY_UX_AND_RULE_FIXES.md`, `docs/SPRINT15_GRAPHICS_HANDOFF_v2_10.md`, `reports/S15_SEER_CORRECTION_ACCEPTANCE.json` (current), `reports/S15_UX_ACCEPTANCE.json` (historical).

On Apple Silicon: Node >=22.13, `npm install`, `npm run dev`. Keep the existing server-provided QA mode and database settings. New checks: `npm run test:15:ux`, `npm run test:browser:15:ux`, `npm run test:15:all`, `npm run test:15:metrics`. Browser setup follows existing `docs/SPRINT15_MACOS_APPLE_SILICON.md`. `WV_E2E_DIRECT=1` uses native browser HTTP/WS on a compatible local machine; sandbox results use the real-backend QA bridge. `npm run test:browser:15:all` retains all existing suites plus new UX suite.

## Current release: 1.7.3-s15-expansion-wip
Latest scope and gates: `docs/SPRINT15_EXPANSION_QA.md`, `reports/S15_EXPANSION_ACCEPTANCE.json`. Earlier release reports are historical.

On Apple Silicon use Node >=22.13, `npm install`, `cp .env.example .env`, set `DB_PROVIDER=sqlite`, `WV_OFFICIAL_RULE_TEST_MODE=1` for QA rooms, then `npm run dev`. Demo auth remains opt-in.

Run `npm run test:15:expansion`, `npm run test:15:all`, `npm run test:15:metrics`, `npm run test:browser:15:expansion`, `npm run test:browser:15:all` (actual manifest includes new suites). Competitive NO-GO; PostgreSQL live not certified.

## Sprint 15 — Approved rules (1.7.9 WIP)
New matches default to rule `wolvesville-official-v1.3.3` (QD-01/02/03). Node 22.13+, `npm install`, `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev`. Do not set `WV_ARCHIVED_RULE_REGRESSION` for normal play. `npm run test:15:approved` exercises new decisions; `npm run test:15:all` runs archived assertions on 1.3.2 and the new test file on 1.3.3. `npm run test:browser:15:all` runs archived and approved browser groups separately. `npm run test:15:metrics` reexecutes metrics evidence. PostgreSQL live remains pending unless a real DB is configured. Competitive NO-GO.

## Sprint 15 Verified Completion Scale-Up — 1.7.10-s15-scaleup-wip
Use Node.js 22.13+ on Apple Silicon. `npm install`, then `WV_OFFICIAL_RULE_TEST_MODE=1 npm run dev` for supported **QA** gameplay, not competitive production. Do not set WV_ARCHIVED_RULE_REGRESSION when playing current rules. New rule remains 1.3.3. New decks: Snow/Leader; Snow/Leader/Pharmacist; Bell/Leader. See `docs/SPRINT15_SCALEUP_RULE_DERIVATIONS.md`.

`npm run test:15:scaleup` for new integration tests. `npm run test:browser:15:scaleup` for three new browser suites; `npm run test:browser:15:all` for inherited archived and current manifest; `npm run test:browser:15:current` for current-rule candidates (legacy expectations are excluded only where noted). Current candidate failures must be investigated, not silently converted into a pass. Reproduce metrics from a fresh full backend log: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs > reports/s15-scale/full.log` after build/rules build, then `npm run test:15:metrics`; certifications also require actual suite logs and clean exit codes in reports/s15-scale as described in the QA report. PostgreSQL live PENDING.
For separately recorded rule-version suites, use `npm run test:browser:15:matrix` (runs both groups and writes each log/exit); `node scripts/s15-scaleup-browser-matrix.mjs current` to run only current-law candidates after build. Metrics report explicitly distinguishes QA C from Playable C.

## Latest release — Sprint 15 Real Playability & Engine Maturity (1.7.11 WIP)

**Normal play:** Node.js 22.13+ on macOS Apple Silicon, `npm install`, then `npm run dev` (default SQLite). If copying `.env.example` to `.env`, keep `WV_OFFICIAL_RULE_TEST_MODE=0`, `WV_INTEGRATION_TEST_MODE=0`, and leave `WV_ARCHIVED_RULE_REGRESSION` unset. Sign up with two independent accounts in two browser profiles, create a two-seat room, join, lock membership, choose an available normal composition, both confirm readiness, and start. Role allocation is on the server. The coordinator closes night, opens voting and locks ballots. Only Knight + Seer or Knight + Mystic Seer is presently admitted in normal mode. No bot gameplay or automatic all-offline phase scheduler is certified. This is WIP, not a competitive release. Previous QA-only instructions above are historical; enabling QA flags explicitly opts into test mode, not a prerequisite for normal play.

**Reproduce evidence:** `npm run test:15:normal`, `npm run test:browser:15:normal`, `npm run test:15:play-guard`, `npm run test:browser:15:play-guard`. For the full backend use `npm run test:15:all`. To recompute metrics after a successful full backend run, capture its stdout in `reports/s15-play/clean-full.log` (keep exit status 0), execute the browser version matrix to regenerate browser evidence, then `npm run test:15:metrics`. `npm run test:browser:15:matrix` executes each required version separately. `WV_E2E_DIRECT=1` enables native browser networking on compatible local machines; the sandbox uses a real backend transport bridge. PostgreSQL migrations are supplied, live acceptance remains pending.

See `docs/SPRINT15_PLAYABILITY.md` and `reports/S15_PLAY_ACCEPTANCE.json` for current acceptance; historical reports are not current release evidence.

## Sprint 15 Verified Growth (v1.7.14 WIP)

This is a continuation, not a production release. Normal room registry now includes two five-human compositions with #87 rescue closure; #39 has a restricted QA adapter. Both QA flags off for normal games. Node 22.13+ recommended (SQLite experimental). `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, then `WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev`. Five independent browser profiles may join a normal five-seat room. `npm run test:15:all` tests historical and explicit current-rule domains. `python3 -m venv .venv; source .venv/bin/activate; pip install playwright requests websocket-client; python -m playwright install chromium` prepares browser tests; `npm run test:browser:15:growth:matrix -- reports/s15-growth/local-fresh` requires a fresh directory. Default bridge connects the real backend (native localhost may be blocked in isolated environments); `WV_E2E_DIRECT=1` selects direct browser transport. See reports/S15_GROWTH_ACCEPTANCE.json for actual gates, not a claim of stable release.

### Sprint 15 Deep Engine Intervention (v1.7.15 WIP)

See [Deep Engine changelog](docs/SPRINT15_DEEP_ENGINE_CHANGELOG.md) and `reports/S15_DEEP_ENGINE_ACCEPTANCE.json`. Keep both QA flags off for normal rooms; `#10` and `#26` are restricted QA-only implementations, not competitive roles. The new browser matrix runner supports explicit same-source resume and separate shards. See changelog for commands. No stable or competitive production certification.

### v1.7.16 — Breakthrough execution (WIP)
See `reports/BREAKTHROUGH_ROOT_CAUSE.md`, `reports/BREAKTHROUGH_METRICS.json`, `reports/BREAKTHROUGH_CERTIFICATION_RESULTS.json` and `reports/BREAKTHROUGH_HUMAN_QA_PACK.md`. Mac Apple Silicon: Node 22.13+, `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, then `WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev`. The bounded [8,26,74] medium deck remains QA-only; local QA setup in pack. To run new backend tests: `node --test tests/sprint15-breakthrough-capability.test.mjs tests/sprint15-breakthrough-medium.test.mjs tests/sprint15-breakthrough-snow.test.mjs`. To run browser matrix: `npm run test:browser:15:breakthrough:matrix -- reports/local-breakthrough` (fresh directory; install Python Playwright, requests, websocket-client and Chromium as described above). Use `--shard=1/2` with separate output directories; `--resume` requires the same directory, selection, shard and source fingerprint. Metrics verification: `python3 reports/s15-breakthrough-execution/build_reports.py --verify`. Competitive Production NO-GO.

### v1.7.17 — Owner B/B (unpublished candidate)

Official gameplay remains `wolvesville-official-v1.3.3`. The approved core decisions for unanimous pack selection and persistent engineer traps are recorded separately in `data/rules/owner_bb_candidate_decisions.json`. Candidate modules are **not** wired into live phase resolution or player endpoints. The candidate SQLite journal requires `WV_OWNER_BB_LAB=1`; the dedicated tests set it internally. Do not enable this flag on production. No new official ruleset or DB migration is applied.

```bash
npm install
npm run verify:source
npm run build
npm run rules:build
npm run test:15:owner-bb
npm run test:15:owner-bb:guard
```

Use `npm run dev` with both QA flags off for normal play as before. For browser shards use the inherited fingerprinted runner with a fresh directory (`node scripts/s15-breakthrough-browser-matrix.mjs reports/local-owner-bb-shard1 --shard=1/2`). Resume only with the same source, selection, and shard. See `reports/OWNER_BB_HUMAN_QA_PACK.md` and `reports/OWNER_BB_FINAL_DECISION_CARDS.md` for scope and unresolved policies.

### Sprint 15 stability checkpoint v1.7.22 (WIP)

The active ruleset remains `wolvesville-official-v1.3.3`; B/B remains opt-in local QA. `npm run test:15:stability` runs the newly added focused backend evidence. `npm run test:browser:15:normal` includes a deterministic real-server REST completion / deferred feedback regression. Use `npm run test:browser:15:bb-official:matrix -- reports/local-stability-shard --shard=1/4` to run the existing checkpointed browser matrix with the current source fingerprint. See `docs/SPRINT15_STABILITY_CHANGELOG.md` and `reports/BB_STABILITY_RELEASE_SCOPE.json` for the bounded release contract, and `reports/BB_STABILITY_HUMAN_QA_PACK.md` for local Mac setup and QA tasks. Do not activate v1.3.4 from this build.

### v1.7.24 — Gameplay closure (WIP)
Official 1.3.3 unchanged; B/B 1.3.4 remains CANDIDATE. Local QA only: six-account mixed [48,74,77,84,93,94], lawful #93 conversion supplies shared two-bite entitlement, existing all-player representative order. #36 fireball expanded to non-self legal targets in bounded [8,25,36]. Mid-window entitlement changes after lock fail closed. No general FULL claimed. See `reports/BB_GAMEPLAY_CLOSURE_HUMAN_QA_PACK.md` for ARM64 Mac and local setup; no DB edits. Run `npm run test:15:gameplay-closure`; `npm run test:browser:15:gameplay-closure:matrix -- reports/local-gameplay-shard-1 --shard=1/4`. Verify report: `python3 reports/s15-gameplay-closure/build_reports.py --verify`. Actual certification and gates are derived from current logs, not this description.

### v1.7.25 — Privacy and browser resource admission (WIP)
Official rules remain 1.3.3; B/B QA remains local and 1.3.4 is not active.
Mixed pack target selectors expose publicly living seats other than self, not the internal faction-filtered target set. A receipt is not a statement of legality; the server retains only the last valid selection. No automatic timeout/AFK fallback. Outcome-based inference and unsupported third-party interaction remain release blockers.
On macOS/Linux, browser runners acquire a shared per-user exclusive admission lease using Python 3 `fcntl`, before the existing 65-second scenario deadline begins. Run backend regression separately; the admission lease coordinates browser runners, not external processes. `WV_BROWSER_SCHEDULER=parallel-diagnostic` explicitly bypasses admission for controlled experiments only. All scenarios/versions remain in the manifest. Use `npm run test:browser:15:privacy-stability:matrix -- reports/local-privacy-shard --shard=1/4` (other shards may be queued). Never treat diagnostic runs as primary evidence.
Mac Apple Silicon: Node.js ARM64 >=22.13, Python 3, Playwright/Chromium; see the prior install instructions and `reports/BB_PRIVACY_STABILITY_HUMAN_QA_PACK.md`. QA only with `WV_OFFICIAL_RULE_TEST_MODE=1 WV_OWNER_BB_LIVE_QA=1 WV_INTEGRATION_TEST_MODE=0`, local SQLite; no QA in production.

### v1.7.27 — Engineering completion (WIP)
Active 1.3.3 unchanged; candidate 1.3.4 not active. Two new **QA-only** decks: [8,23,25,36] secret soul lifecycle, [8,10,25,26] trap/revival. No FULL or Normal Gameplay certification added. See `reports/v1.7.27/` for acceptance, decisions and logs.
Mac Apple Silicon (ARM64): Node >=22.13, Python 3. `npm install; npm run verify:source; npm run build; npm run rules:build`. For QA:
```bash
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1727-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 npm run dev
```
Open http://127.0.0.1:3212. Never deploy this QA mode publicly. `npm run test:17:new` runs the new HTTP/SQLite acceptance. Browser: prepare Playwright as above, then run `WV_BROWSER_MANIFEST=reports/v1.7.27/BROWSER_MANIFEST.json node scripts/s15-bb-official-browser-matrix.mjs reports/local-v1727 --shard=1/4` using a fresh directory; use the same scope and fingerprint for resume. Do not run backend regression simultaneously. Existing admission/deadline unchanged. Human tasks: `reports/v1.7.27/HUMAN_QA.md`.

### v1.7.28 — Gameplay closure (QA WIP)
Current official 1.3.3, candidate 1.3.4 unchanged. In the existing [8,23,25,36] QA deck, #8 may submit one blind night attack against any other publicly-dead seat; only an actually living or pending #23 can transition, a final-dead target has no public result. No new normal deck or role certificate. The wrong-faction soul-shot and finite-cost blind attack policies remain decision boundaries. `npm run test:17:new` includes LIFE-01 second-death coverage. Browser manifest: `reports/v1.7.28/BROWSER_MANIFEST.json`; run using the same existing admission runner as v1.7.27. Reports in `reports/v1.7.28/` distinguish fresh and historical results.

## v1.7.29 — Handoff blocker correction

Continue Node.js ARM64 >=22.13 on macOS. `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`.

Normal gameplay (two accounts, no QA rule mode):

```bash
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1729-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 npm run dev
```

For local QA use a separate SQLite file, `WV_OFFICIAL_RULE_TEST_MODE=1 WV_OWNER_BB_LIVE_QA=1`; never use that profile for competitive deployment.

Focused handoff/backend evidence (build first):

```bash
WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-name-pattern='S19|Normal ROOM-03' tests/sprint19-handoff-ui.test.mjs tests/sprint15-normal.test.mjs tests/sprint17-soul-lifecycle.test.mjs
WV_E2E_DIRECT=1 node scripts/run-browser-s06.mjs browser_s15_normal_e2e.py
```

On the restricted Linux testing environment use the existing bridge (`WV_E2E_DIRECT=0`). Native Mac acceptance and PostgreSQL Live require separate verification. For complete evidence and outstanding decision cards, see `reports/v1.7.29/`. Official ruleset stays v1.3.3; v1.3.4 remains candidate.

### v1.7.30 — Owner decision candidate QA (NOT ACTIVE)

The active ruleset is still `wolvesville-official-v1.3.3`. The four approved choices are in `data/rules/owner_dc_decisions_20261125.json`; the 18-decision candidate overlay is `data/rules/owner_v1_3_4_effective_registry_preview_dc.json`. No historical registry or archive migration. New, non-production QA games in [8,23,25,36] and [8,10,25,26] may bind `WV-DC-2026-11-25-A` using `WV_OWNER_DC_QA=1`; preexisting games and normal gameplay do not bind it. The former permits friendly fire by #23; the latter applies failed #26 revival when trapped. The #8 blind target attempt remains the only designated QA blind attack. Pack KEEP revocation logic is not live-enabled because the post-lock phase oracle is unresolved.

On Mac Apple Silicon with Node ARM64 >=22.13, install dependencies, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`. Start local QA only:

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1730-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 WV_OWNER_DC_QA=1 npm run dev
```

Open `http://127.0.0.1:3212`. Select `s17-soul-lifecycle` or `bb-live-revival` in the QA deck picker. Do not deploy this mode publicly. Run focused acceptance using `npm run test:20:new`. The new browser obligations are recorded separately from historical suites in `reports/v1.7.30/BROWSER_MANIFEST.json`.

## v1.7.31 — bounded QA extension (not official activation)

Continue using the v1.7.30 local QA setup (`WV_OWNER_DC_QA=1`, `WV_OWNER_BB_LIVE_QA=1`, `WV_OFFICIAL_RULE_TEST_MODE=1`). New trap/revival QA games bind `WV-DC-2026-11-25-A-S21`, permitting #8 to target #10 within the existing [8,10,25,26] deck. Old QA archives and normal games retain their behavior. See `reports/v1.7.31/HUMAN_QA.md`. Run `npm run test:21:new` for the new targeted tests. New pack revocation logic remains candidate-only; do not enable in public/mixed gameplay. Full evidence is in `reports/v1.7.31/acceptance.json`, `browser-results.json`, `certificate-revalidation.json` and `release-gates.json`. Official 1.3.4 is not active.

## v1.7.32 — FULL acceleration (WIP, no new FULL certificate)

All 97 characters were joined against the existing rule, skill, adapter, atomic and certificate inventories in `reports/v1.7.32/FULL_ROLE_READINESS_MATRIX_97.{json,csv,md}`. The 17-candidate ranking is an engineering triage, not a certificate. All old contracts and all 18 approved Owner choices are preserved. `DC-PACK-PRIVACY-BOUNDARY` remains pending; candidate pack revocation remains off. Active ruleset remains 1.3.3; 1.3.4 is not activated.

Two new noncompetitive QA decks are available in approved 1.3.3 test mode only: `s22-dual-swap` [25,28,37,74] (typed aura/exact-role inspection through #37 transposition); `s22-jester-revival` [8,25,26,28] (night death, cross-faction revival and actual hanging). They are not additions to Normal Gameplay. Historical decks are unchanged. These scopes exclude unimplemented combinations and do not certify the entire role.

Mac Apple Silicon: use Node ARM64 >=22.13, Python 3 and the Playwright prerequisites above. `npm install; npm run verify:source; npm run build; npm run rules:build`. Start local QA only:

```sh
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1732-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=1 WV_OWNER_DC_QA=1 npm run dev
```

Open http://127.0.0.1:3212. The two new decks need only official-rule test mode; the other QA flags are for prior Owner decision scenarios. Do not deploy QA publicly. Focused acceptance `npm run test:22:new` (build first). Browser matrix: `WV_BROWSER_MANIFEST=reports/v1.7.32/BROWSER_MANIFEST.json node scripts/s15-bb-official-browser-matrix.mjs reports/local-v1732 --shard=1/4` with fresh output and normal resource admission; resume only on the same fingerprint/scope. Never run backend monolithic concurrently. On restricted Linux use the existing browser bridge, not the local Mac launch option. Human QA: `reports/v1.7.32/HUMAN_QA.md`. Fresh and inherited evidence are separated in `acceptance.json`, `browser-results.json` and `certificate-revalidation.json`.

## v1.7.35 Visual Integration (2026-11-25)

For Apple Silicon use native ARM64 Node.js >=22.13. `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`. Launch normal: `DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1735-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 WV_OWNER_DC_QA=0 npm run dev`; open http://127.0.0.1:3212. Two independent browser profiles register and create/join a room, lock, choose server-admitted deck, ready and start. Choose themes from sidebar/settings; reduced motion and sound controls in settings. `npm run test:25:new` runs new focused tests. See reports/v1.7.35/HUMAN_QA.md, GRAPHICS_INTEGRATION_MATRIX.md and VISUAL_ACCEPTANCE_REPORT.html. 51 actual screenshot originals in reports/v1.7.35/screenshots. Mobile phase label still clips. No live #90 recruitment or new FULL role; 1.3.3 remains active, 1.3.4 candidate. Human QA/native Mac and PostgreSQL not verified here.

### v1.7.36 — Core Engine Rescue (bounded Normal Gameplay)
Use Node >=22.13 ARM64. `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`, `mkdir -p local`. Run `DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1736-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 WV_OWNER_DC_QA=0 npm run dev`. Open http://127.0.0.1:3212. With four authenticated players, choose the `s26-mirror-guard` deck [25,31,35,74]. Only scoped one-wolf reflection is supported; no new FULL or public deployment authorization. See `reports/v1.7.36/HUMAN_QA.md`, `OWNER_DECISION_PACK.md`, `FULL_CONTRACT_CLOSURE.md`, and acceptance logs. Monolithic: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`. Browser: `WV_E2E_DIRECT=0 WV_BROWSER_MANIFEST=reports/v1.7.36/BROWSER_MANIFEST.json node scripts/s15-bb-official-browser-matrix.mjs reports/local-s26-browser browser_s26_mirror_normal_e2e.py` (new output path). The matrix exits 1 if other obligations are incomplete; inspect individual run exit codes. Native Mac and live PostgreSQL acceptance are not claimed.

## v1.8.0-development — Character Completion Factory (FULL MILESTONE NOT MET)

Baseline v1.7.36 verified; unfinished v1.7.37 draft reused and repaired, not a released checkpoint. Active rules remain v1.3.3; v1.3.4 candidate inactive. 25 owner choices are recorded; PACK privacy boundary remains pending. New official-rule Normal Gameplay compositions: `s28-bell-leader`, `s28-bell-linked`, `s28-bell-revival`. All use the existing server-authoritative room/ready/deck flow. On Apple Silicon use native Node 22.13+ and `npm install; npm run verify:source; npm run build; npm run rules:build`. Start normal with `DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v180-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev` (create `local` first).

Candidate-only local testing: `WV_OFFICIAL_RULE_TEST_MODE=1 WV_OWNER_CULT_QA=1` enables four-seat `s27-cult` and approved HTTP five-seat variant. Use a separate SQLite DB. `WV_OWNER_BB_LIVE_QA=1 WV_OWNER_MIRROR_QA=1` enables the eight-seat mirror candidate via authorized room API; not a new Normal Gameplay deck. Never use these flags in production. No FULL certificate is claimed from these limited domains. See `reports/v1.8.0-development/` for actual evidence and blockers.

### RC-01 checkpoint — #64 / LIFE-02 (development, not certified FULL)

Use Node.js >= 22.13 (ARM64 on Apple Silicon), `npm install`, `npm run verify:source`, `npm run build`, `npm run rules:build`. The official normal configuration is unchanged. The new local candidate requires `WV_RC01_LIFE02_QA=1` together with `WV_OFFICIAL_RULE_TEST_MODE=1`, `WV_INTEGRATION_TEST_MODE=0`; never use in production. For example:

```sh
mkdir -p local
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/rc01-qa.sqlite WV_RC01_LIFE02_QA=1 WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 npm run dev
```

Choose five seats and the `rc01-life02` trial deck. #27 pairs #25 and #97; #64 pins those same two; #97 plants #25; #8 attacks #25. Resolve and verify #25's public elimination is NOT an actual death, #97 survives and #64 receives no observation. Skip votes; resolve the following dawn; then attack #25 again in a subsequent night. Verify final linked deaths, two private bell observations, #27's village transition and endgame. The next-dawn timing and Cupid day chat are bounded QA assumptions pending source confirmation (NV100/NV30). No Normal admission or new FULL certificate. Use separate database for normal mode; disable the RC01 flag and test mode there. Run `npm run test:rc01` for targeted backend verification. See `reports/RC-01/RC01_REPORT.md` for exact remaining gates.

## FULL50-M1-01 — chạy cục bộ trên Mac Apple Silicon

Đây là development checkpoint tích hợp, không phải FULL50-COMPLETE. Dùng Node.js >= 22.13 và npm bản native arm64. Từ thư mục giải nén:

```sh
npm install
npm run verify:source
npm run dev:demo
```

Mở http://127.0.0.1:3212. `dev:demo` bật Demo Auth (`WV_ENABLE_DEMO_AUTH=1`) và tắt các cờ Candidate QA; không bật QA trong Normal Gameplay. `npm run dev` tôn trọng cấu hình hiện có, Demo Auth mặc định tắt. Cấu hình mẫu `.env.example`; nếu cần `.env` thì tạo mới chỉ khi chưa có, không ghi đè. Dữ liệu SQLite mặc định `./local/sprint03.sqlite`, hoặc chỉ định `WV_LOBBY_DB`. Không xóa cơ sở dữ liệu để xử lý lỗi khởi động.

Nếu cổng 3212 bận, xem `lsof -nP -iTCP:3212 -sTCP:LISTEN` hoặc chạy `PORT=3213 npm run dev:demo`. Không tự đóng tiến trình khác.

Candidate QA chỉ dành cho môi trường thử nghiệm cục bộ, dùng DB riêng:

```sh
DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3213 WV_LOBBY_DB=./local/full50-qa.sqlite WV_OFFICIAL_RULE_TEST_MODE=1 WV_RC01_LIFE02_QA=1 WV_FULL50_QA=1 WV_ENABLE_DEMO_AUTH=1 npm run dev
```

Các deck Candidate LIFE-02 5/6 người không phải Normal Gameplay và không cấp chứng nhận FULL. Xem `reports/FULL50-M1-01/INTEGRATED_CHECKPOINT.md` và `docs/full50-handover/` để biết bằng chứng, giới hạn, bước tiếp theo. Chưa nghiệm thu Mac native hoặc PostgreSQL Live cho checkpoint này. Không sử dụng bộ verifier RC-01 cũ để xác minh fingerprint mới.

## FULL50-M1-02 (development checkpoint)
Seven-seat QA roster adds Bảo Vệ #31 to LIFE-02/Witch/Cupid/Bell. Use separate SQLite and `WV_OFFICIAL_RULE_TEST_MODE=1 WV_RC01_LIFE02_QA=1 WV_FULL50_QA=1 WV_ENABLE_DEMO_AUTH=1`; choose the seven-player candidate. Not Normal Gameplay or production. See `docs/full50-handover/PROJECT_STATE.md` and `reports/FULL50-M1-02/acceptance.json`.

## IMMERSIVE-01 (product development checkpoint)

Character completion is frozen at FULL5-02; see `docs/immersive-handover/PROJECT_STATE.md` and `PRODUCT_ACCEPTANCE.md`. No new FULL certificates. For local startup with Node >=22.13, macOS/Linux:

```sh
npm install
npm run build
npm run verify:source
npm run dev:demo
```

Default localhost port 3212. Use `PORT=3213 npm run dev:demo` if busy. Demo auth is not Candidate QA. SQLite 009 additive migration is automatic; back up your existing local DB before upgrading. For PostgreSQL use the configured database and `npm run db:migrate:pg:02b`; live PG has not been verified for this checkpoint. Sharp is optional; required for custom image upload. Keep API keys in environment, not source. Rule assistant uses local source lookup by default. Set `WV_AI_ENABLED=1`, `WV_AI_MODEL`, `WV_AI_API_KEY` and optionally `WV_AI_BASE_URL` in a trusted server environment to try the unverified live provider adapter. Do not enter private game information in questions.

`npm run test:immersive` executes new social/AI/media tests. Full browser evidence and focused regression are under `reports/IMMERSIVE-01`. Native browser access was blocked in the build environment; successful suites used repository bridge with actual server, not mock. The complete product is not yet ready for production.

## IMMERSIVE-02 checkpoint
Full source with product experience improvements. See `docs/immersive-handover/HUMAN_QA.md` for Mac playtest, `PRODUCT_ACCEPTANCE.md` for scope and known gaps, and `reports/IMMERSIVE-02` for logs/screenshots. `npm run dev:demo` remains supported. FULL-5/FULL-50 frozen.

## IMMERSIVE-03 checkpoint — local & cloud
- Local: `npm install`, `npm run build`, `npm run verify:source`, `npm run dev:demo`; đổi cổng `PORT=3213 npm run dev:demo`. Không bật demo trên Internet.
- Hướng dẫn tiếng Việt: [Chơi thử](HUMAN_QA.md), [GitHub/cloud](DEPLOYMENT_GUIDE.md), [Railway](RAILWAY_DEPLOYMENT.md), [Database](DATABASE_MIGRATION_GUIDE.md), [AI](AI_CONFIGURATION.md), [Release gates](PRODUCTION_CHECKLIST.md), [Cloud status](CLOUD_ACCEPTANCE_REPORT.md).
- `npm start` dành cho CLOUD_STAGING với PG và env hợp lệ; không tự fallback SQLite. `/ready` kiểm tra database. Chưa nghiệm thu Docker/PG/cloud, không công khai trước khi đạt gate.
- Full-5/Full-50 đóng băng. Xem reports/IMMERSIVE-03 và docs/immersive-handover cho evidence và các giới hạn.


## Wheel of Fate — Vòng quay định mệnh
Đã tích hợp tiện ích quyết định riêng trong Game HUD. Không phải phân vai hoặc chọn quản trò. Hướng dẫn và giới hạn nghiệm thu: `docs/immersive-handover/WHEEL_OF_FATE_QA.md`; bằng chứng: `reports/WHEEL-OF-FATE/`.

## IMMERSIVE-04
See `CHANGELOG_IMMERSIVE04.md`, `HUMAN_QA.md` and `reports/IMMERSIVE-04/CHECKPOINT.md`. Group time opt-in: `WV_GROUP_CHAT_DAY_NIGHT=1` for new matches. XP only qualifying official Normal; no public release certification.

## IMMERSIVE-05
Global alerts across pages, account saved decks and preferences, custom role builder for currently supported combinations. Start locally with `npm install`, `npm run build`, `npm run verify:source`, `npm run dev:demo`. Keep the existing WV_LOBBY_DB path or DATABASE_URL; do not reset account data. See ACCOUNT_PERSISTENCE_REPORT.md, BACKUP_RESTORE_GUIDE.md, HUMAN_QA.md and RAILWAY_DEPLOYMENT.md. Cloud and PG live not yet accepted. FULL frozen.
