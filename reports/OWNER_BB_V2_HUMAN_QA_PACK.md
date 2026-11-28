# Human QA — v1.7.18 (PENDING)

No new v2 user-facing feature is enabled. Do not attempt to verify multi-wolf bite or persistent trap from normal website. They are unpublished lab functionality with automated evidence only.

## QA-BBV2-01 — Existing normal room compatibility
- Priority: HIGH. Build v1.7.18. Mac Node >=22.13; `npm install`; `npm run build`; start `WV_OFFICIAL_RULE_TEST_MODE=0 WV_INTEGRATION_TEST_MODE=0 npm run dev`. Use four accounts in separate browser profiles. Select Bảo Vệ, Sói Thủ Lĩnh, Tiên Tri, Tiên Tri Huyền Bí.
- Steps: protect one Seer; wolf bites both; resolve, inspect survivors, reconnect and check role/privacy.
- Expected: protected player survives, other dies; only authorized individual investigations; reconnect restores state. No candidate B/B control in UI.
- Actual: PENDING. Evidence: screenshot/video with sensitive tokens removed. Failure: capture phase and last action, do not continue match. Impact: legacy regression only, not v2 certification.

## QA-BBV2-02 — Existing engineer rule (optional)
- Priority: HIGH. Start QA local `WV_OFFICIAL_RULE_TEST_MODE=1 WV_INTEGRATION_TEST_MODE=0 npm run dev`. Use four accounts; QA deck [5,10,25,74]. First-night trap #74; all investigators select #10.
- Expected: #74 gets a false exact role, #25 gets aura only, #5 gets truthful Cân Phán Quyết. Only the owner of each skill sees its result. The old official first-night rule has not changed.
- Actual: PENDING. Failure: screenshot and phase; no need to inspect code. No claim of v2 website QA.
