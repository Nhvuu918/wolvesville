# Human QA — pending actual owner execution

Node >=22.13 ARM64 on Mac. Install/build/verify before run. `DB_PROVIDER=sqlite HOST=127.0.0.1 PORT=3212 WV_LOBBY_DB=./local/v1736-normal.sqlite WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 WV_OWNER_BB_LIVE_QA=0 WV_OWNER_DC_QA=0 npm run dev`. Four real accounts, separate browser contexts, create room capacity 4, lock, choose `s26-mirror-guard` [25,31,35,74], ready, start. No demo/role forcing.

1. #74 soi #35; #31 bảo vệ #25; #35 cắn #74. End night. #74 alone gets exact role; death public without revealing role. Open/close empty vote.
2. #31 protects self; #35 bites #31; no victim. End night; open/close empty vote. Next night #25 inspects #35 => Thiện; repeat next night => Ác. #35 and #31 must not receive aura feedback. Both sides may win: #25 votes to eliminate #35 => village; or #35 kills #74 then #31 => parity victory. In wolf scenario inspect #35 first night (no previous victim => Ác), again after death => Ác.
3. Verify restart/reconnect and replay, result after authoritative commit, no old pending vote notice. Set Basic Light/Cream/Sage; inspect seat contrast and active/dead/selected labels. Mobile 390×844 phase banner wraps. Broader mobile scroll, buttons, toasts and accessibility remain pending. Existing normal deck regressions separately recorded. No #90 live recruitment or FULL new.
4. Human QA pending; PostgreSQL live pending; Mac native installation/acceptance pending. Never enable QA flags on public server.
