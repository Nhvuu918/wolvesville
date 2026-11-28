# Sprint 10 v2.3 — authorized gameplay / graphics mapping

**Read together with:** `09_UI_STATE_INVENTORY.md`, `10_SCREEN_TRANSITIONS.md`, `11_EVENT_ANIMATION_CONTRACT.md`, `12_AUTHORIZED_INFORMATION.md`, `docs/SPRINT09_GRAPHICS_HANDOFF_DELTA.md`, `docs/SPRINT10_GRAPHICS_HANDOFF_v2_3.md`.

New supported flows:

1. Private role card #5 → `NIGHT_COLLECT` → user chooses target → `ACTION_ACCEPTED` → server resolves → own `AURA_INFORMATION.verdict` → **`soul-judgment-reveal`**. No authorized event to reveal the judgement result to room members.
2. Private role card #76 → selects target at night → accepted → resolution priority 9 → target gets `SKILL_LOCK_NOTICE` → target's earlier queued night action becomes `CANCELLED`. Acting #76 client does not learn the target's secret role.
3. If #5 targets #20, the existing source-backed reactive inspection injury is scheduled as permitted in the restricted deck; graphics uses authorized feedback only.

| UI Transition | Event/feedback | Audience | Hook | Status |
|---|---|---|---|---|
| `SKILL_PENDING → SKILL_RESOLVED` | `AURA_INFORMATION` | Actor private | `soul-judgment-reveal` | IMPLEMENTED & TESTED |
| `NIGHT_COLLECT → SKILL_BLOCKED` | `SKILL_LOCK_NOTICE` | Blocked target private | `skill-locked-toast` | IMPLEMENTED & TESTED |
| `SKILL_PENDING → SKILL_CANCELLED` | `resolutionStatus=CANCELLED` | Actor private | `skill-action-cancelled` | IMPLEMENTED & TESTED |
| `VOTE_LOCKED → DAY_HANGING` | No authorized V03 rule | None | Preview only | BLOCKED BY RULE |

New hooks must be no-op safe for older graphics builds; existing hooks unchanged. Respect reduced motion, authorized ACL, desktop/mobile constraints and event revisions. Never use `OFFICIAL_NIGHTMARE_APPLIED` for public reveal.
