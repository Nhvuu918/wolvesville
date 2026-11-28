# 1.7.2-s15-ux-wip

- Owner correction S15-OWNER-SEER-01: #25 sees aura only, #74 remains exact role. Backend private event + UI result + effective description; archived v1.3.1 games remain version pinned. Preserve #20 inspection injury, #5 judgment and all other UX/gameplay. No metric inflation.

# 1.7.1-s15-ux-wip

- Owner feedback priority: clarify exact-role Seer result (no new adjudication), public starting-role composition with names/counts only, deterministic server-driven reveal wheel, in-match chat and click/accessibility improvements.
- Expand public daytime chat to existing approved official decks; preserve mute, rate, membership, phase, idempotency and frozen audience rules.
- Preserve private role result, history, role assignment and V02/V03. No role-count KPI uplift claimed.
- Add HTTP/SQLite and real Chromium UX tests. Fix an intermediate compatibility regression: public composition must not serialize `characterId` into observer WS data; public role names/counts only. Old privacy assertions retained.
- Browser transport recovery retained unchanged. New/legacy browser evidence recorded separately; not all acceptance gates are necessarily complete.
