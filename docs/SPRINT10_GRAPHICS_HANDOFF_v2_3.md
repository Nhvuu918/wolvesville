# Sprint 10 — Graphics Handoff v2.3, additive to v2.2

**Scope:** Client renders only server-authorized state, not rules. Existing Dark Fantasy artwork, fonts, Wheel/Grid Codex 97, interactive village map/room marker, Demo Login, responsive grid and instant-text rendering remain inherited. Do **not** render internal role/adapter IDs, hidden roles or hypothetical vote winners.

## UI state / event / animation inventory

| Visible UI state | Authoritative trigger / payload for UI | Audience | Animation hook | QA status |
|---|---|---|---|---|
| `LOGIN` / `LOBBY` / `ROOM_LOCKED` | Real auth, room and live WebSocket projection | Authenticated self / room | `auth-complete`, `room-ready` (existing) | IMPLEMENTED & TESTED |
| `ROLE_REVEAL` | Projection of `self.currentCharacterId`, never other participants' `self` | Self | `private-card-reveal` | IMPLEMENTED & TESTED |
| `NIGHT_SKILL_SELECT` | `phase=NIGHT_COLLECT` and **own** allowed skill/targets | Self | `night-skill-panel` | IMPLEMENTED & TESTED |
| `NIGHT_ACTION_ACCEPTED` | POST /actions ACK, status `ACCEPTED` | Acting player | `skill-action-pending` | IMPLEMENTED & TESTED |
| `SOUL_JUDGMENT_RESOLVED` | Own `/feedback` item `resultType=AURA_INFORMATION`, `resolutionStatus=RESOLVED`, `resultPayload.verdict ∈ {Thiện,Ác,Không xác định}` | **Only actor #5** | `soul-judgment-reveal` | IMPLEMENTED & TESTED |
| `NIGHTMARE_LOCKED_SELF` | Own **authorized** event `SKILL_LOCK_NOTICE` with plain-text message | **Only target** | `skill-locked-toast` | IMPLEMENTED & TESTED |
| `NIGHT_ACTION_CANCELLED` | Own feedback `resolutionStatus=CANCELLED` (not a death) | Only affected actor | `skill-action-cancelled` | IMPLEMENTED & TESTED |
| `DAWN` / `DAY_DISCUSS` | Server `PHASE_CHANGED` / authorized phase in snapshot | Room | `dawn-light-shift` | IMPLEMENTED & TESTED |
| `DAY_VOTE_COLLECT` | Own allowed vote UI with authorized phase | Room, private own ballot | `vote-panel-open` | IMPLEMENTED & TESTED (inherited) |
| `VOTE_LOCKED_UNRESOLVED` | `ADJUDICATION_UNRESOLVED` | Authorized vote projection | `vote-locked-await-rules` | IMPLEMENTED & TESTED (inherited) |
| `VOTE_CANCELLED` | #79 `CANCELLED_NO_ELIMINATION` | Room | `vote-cancelled` | IMPLEMENTED & TESTED (inherited) |
| `HANGING_ELIMINATION` | Requires approved V02/V03 + valid `ELIMINATION_AUTHORIZED` | Not yet defined | `vote-elimination` storyboard only | **BLOCKED BY RULE / DESIGN PREVIEW** |
| `NIGHT_PLAYER_ELIMINATED` | Certified server death event, no cause/attacker/secret role in public payload | Room per ACL | `elimination-reveal` | IMPLEMENTED & TESTED in restricted #8 decks |
| `MATCH_COMPLETED` | Server committed winner for `[8,25]` or `[8,28]` | Authorized participant | `match-result` | IMPLEMENTED & TESTED restricted only |
| `POSTMATCH_REPLAY` | Server ACL-projected event/replay data | Authorized participant | `replay-event-step` | PARTIAL (engine test + narrow UI) |
| `CONNECTION_RESTORING` | WebSocket closed/reconnecting; re-fetch authorized snapshot/revision | Self | `reconnect-overlay` | IMPLEMENTED & TESTED |
| `MOBILE_GAMEPLAY` | Same server projection, screen width ≤ responsive breakpoint | Self/authorized | Layout adjustments only | PARTIAL (general layout tested, all future skills not implemented) |

## Event-to-Animation Contract v2.3

| Event / representation | Version | Payload shown to graphics | Privacy / compatibility |
|---|---|---|---|
| `SOUL_JUDGMENT_OBSERVED` | NEW v2.3 | **Do not consume raw engine event**. Consume actor's feedback `resultType=AURA_INFORMATION` + permitted verdict text | `PLAYER_PRIVATE`; others cannot access result; server-only `sourceRule` / internal `targetId` never put into generic UI |
| `SKILL_LOCK_NOTICE` | NEW v2.3 | `{message: 'Đêm nay bạn không thể sử dụng kỹ năng.'}` | `PLAYER_PRIVATE` for affected player only; no who-targeted-whom ID, caster role, skill ID or source rule |
| `OFFICIAL_NIGHTMARE_APPLIED` | NEW v2.3 internal | **No player-facing animation**; not a public event | `SERVER_INTERNAL`, may only result in private lock notice and affected action status |
| `PHASE_CHANGED` | INHERITED | Authorized phase/state/revision | Preserve v2.2 mapping |
| `ROLE_OBSERVED`, `ACTION_ACCEPTED`, `PLAYER_ELIMINATED`, `MATCH_COMPLETED` | INHERITED | Existing authorized projection | Keep established hooks and ACL |
| `VOTING_OPENED`, `VOTING_CANCELLED`, `VOTE_LOCKED_UNRESOLVED` | INHERITED | Existing authorized voting projection | Never infer death from vote totals |

**Changelog/compatibility:** v2.2 existing event names, payloads, hooks, audiences and graphic timings are unchanged. v2.3 **adds** the soul verdict feedback type, private skill-lock notice and UI presentation. Old event handlers keep their v2.2 meaning. v2.3 does not introduce hanging, public vote tallies or role reveal at death. Maps previous generic `ROLE_OBSERVED` to role-based private results; #5 uses **new** typed `AURA_INFORMATION` rather than changing `ROLE_INFORMATION`.

## Screen transitions

`LOGIN → LOBBY → ROOM → ROLE_REVEAL → NIGHT_SKILL_SELECT → NIGHT_ACTION_ACCEPTED → NIGHT_RESOLVE → DAWN/DISCUSSION → (VOTE_COLLECT → VOTE_LOCKED_UNRESOLVED | VOTE_CANCELLED) → NEXT_NIGHT`.

For inherited certified #8 decks only: `NIGHT_RESOLVE → committed elimination → committed MATCH_COMPLETED → LOBBY`. All transitions require latest `serverRevision`; never use an animation completion callback to advance the Engine. On `RECONNECTING → ONLINE`, replace UI from current authorized server projection and private feedback, de-duplicate displayed result by event/revision; no re-run of the elimination animation merely because the page refreshed.

## Asset/animation instructions to graphics team

Keep existing background/artwork/typography, no new assets required for basic implementation. Optional graphic components to design **without changing gameplay**: verdict text panel (`Thiện / Ác / Không xác định` with accessible text labels, color not sole signal), nightmare lock toast, cancelled-action chip, private card overlay, pending/locked vote banner. Sprite/animation names are **hooks**, not backend API event names.

`prefers-reduced-motion`: disable rotation, flashing/fade loops and transitions; render all text instantly. Desktop: status overlay inside gameplay HUD, do not obstruct room marker. Mobile: touch targets ≥44 CSS px, no sideways scrolling, verdict/live text legible in narrow viewport, keyboard focus and screen-reader announcement (`aria-live=polite`). Loading/error states: `REQUEST_PENDING`, `ACTION_REJECTED`, `NETWORK_RECONNECTING`, `STATE_STALE`, `RULE_UNRESOLVED`, `MATCH_COMPLETED`; show human-readable text, never raw internal exception/JSON/rule ID.

## Graphics integration checklist

- Subscribe to **authorized** server state and own feedback; do not subscribe to internal audit or experimental sandbox.
- Display #5 verdict only from resolved own `AURA_INFORMATION`. Never derive it from aura sprite/target description.
- For #76, read only `SKILL_LOCK_NOTICE`; do not expose caster identity from system internals.
- Keep `VOTE_LOCKED_UNRESOLVED` as unresolved; do not show hanging until official verdict and real elimination commit exist.
- Restore own room/phase/feedback upon refresh; on stale revision ask backend for latest projection.

See machine-readable append-only mapping at `docs/gameplay-flow-handoff/S10_GRAPHICS_CONTRACT_v2_3.json`.
