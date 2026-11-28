# Sprint 10 — gameplay readiness and acceptance gates

**Release** `1.2.0-s10`. Evidence source: `data/rule-intelligence-s10/execution_manifest_s10.json`, automated tests, browser E2E exit code, and source audit. Không suy diễn 97 vai playable từ bách khoa.

## Gameplay metrics

| Metric | Result | Evidence / boundary |
|---|---:|---|
| Nhân vật trong nguồn | 97 | `verify:source`, `data/character.json` |
| Quyết định nguồn giữ nguyên | 118 | `official_merged_118.json` |
| Đặc tả legacy giữ nguyên | 207 | `tests_207.json` |
| Nhánh kỹ năng đã kiểm kê | 145 | nguồn Sprint 06; không phải 145 implemented |
| Nhân vật có ít nhất một nhánh thực thi | **11** | #5, #8, #9, #20, #25, #31, #33, #34, #74, #76, #79; 10 active và một passive #20 |
| Nhân vật hoàn thiện **mọi** kỹ năng | **0 đã chứng minh** | Matrix không nâng nhánh partial thành complete |
| Nhánh thực thi mới | **2** | #5 Cân Phán Quyết; #76 Sói Ác Mộng |
| Các cặp interaction tối thiểu đã kiểm thử | **15** | Base 12 + #5/#20, #5/#76, #25/#76; con số tối thiểu theo ca nguồn đã rà soát |
| Restricted role configurations | **11** | Có nhánh hỗ trợ trong tập khép kín, **không phải** 11 trận hoàn tất |
| **Metric A** | **2** | Ván endgame chính thức `[8,25]`, `[8,28]`; S08 readiness + restart/replay/ACL |
| **Metric B** | **0** | V02/V03 chờ chốt; không có official hanging → no certified full vote-elimination-winner |
| Số cấu hình nhiều vòng kết thúc thật | **0 đã chứng minh** | Night/day QA-only advance không phải official match |
| Full competitive readiness | **NO-GO** | Luật, interactions, postdeath và DB production chưa hoàn chỉnh |

## System readiness

- **Voting:** `PARTIAL / BLOCKED BY RULE` — ballot intake/lock/forced vote #33/cancellation #79, auditable logs; general hanging undefined. Developer sandbox is not official.
- **Elimination:** `PARTIAL` — certified #8 nighttime elimination + verified limited reactive effects, no general protected/daytime/postmortem elimination.
- **Victory:** `PARTIAL` — two #8 restricted deck finishes; independent/general/cowinner branch coverage remains incomplete.
- **Full match vertical slice:** `PARTIAL` — real login/lobby/room/ready/assignment/night action/reveal/game completion exists for inherited two decks; **complete day vote→hanging match is blocked**.
- **PostgreSQL:** `PENDING ENVIRONMENT` — no live service and no DATABASE_URL. Strict PG must fail, never marked PASS on skip.
- **Browser E2E:** `GO` for **tested flows only**, not a substitute for full-match rule certification.

## Gates

| Gate | Status | Note |
|---|---|---|
| 1 Source integrity | **GO** | 97 / 118 / 207 byte-preserved; approved frontend view preserved |
| 2 Core system | **GO on SQLite tests; PENDING on PostgreSQL** | Engine, multiplayer, replay, privacy regression green on SQLite |
| 3 Gameplay expansion | **GO restricted** | Two source-backed executable branches + API feedback + multi-client UI |
| 4 Full match | **GO restricted** | Two inherited true finishes; no new official multi-round finish |
| 5 Vote → Elimination | **BLOCKED BY RULE** | V02/V03 plus role-specific post-elimination integration |
| 6 Graphics handoff | **GO for v2.3 verified hooks; PARTIAL overall** | Authorized feedback documented, vote hanging design-only |
| 7 Production foundation | **PARTIAL / PENDING ENVIRONMENT** | Sandbox isolated, no secrets shipped, SQLite verified; live PostgreSQL and full competitive remain unapproved |

**Definition guard:** Vote collected ≠ vote resolved. Vote resolved ≠ death committed. Death ≠ winner committed. QA-only phase advance ≠ completed competitive match.

See `docs/SPRINT10_SKILL_DEPENDENCY_GRAPH.md` for the full 145-branch technical dependency inventory; it does not convert audit tags into rules.
