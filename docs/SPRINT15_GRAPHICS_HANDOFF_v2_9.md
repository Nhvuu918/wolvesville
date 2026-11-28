# Graphics Handoff v2.9 WIP — authorized player UX

Extends v2.8 WIP with additive view metadata and local presentation hooks; no change to the historical event schemas. Engine still owns role assignment, effects, phase, elimination and victory.

| Trigger / contract | Audience | Payload / UI state | Hook and motion | Reconnect / replay |
|---|---|---|---|---|
| game snapshot / state_updated | authorized participant | roleComposition: [{name,count}], sorted by initial role catalog order; no player mapping or character ID in public composition | `.wv-role-composition` collapsible list; names, portraits and count; no animation required | rebuild from server view |
| private own initial role in game snapshot | viewer only | self.initialCharacterId; local catalog name, no other assignment | `.wv-role-wheel`, `.wv-spin`: CSS animation to server-selected segment, replay button only replays presentation; reduced motion uses final transform | same initial role from server, not a new draw |
| ROLE_OBSERVED + skill feedback | acting player only | existing ROLE_INFORMATION `{characterId,targetId}` private, text resolves authorized name via immutable catalog | `.wv-feedback-item`, `.wv-inspection-target`; instant text, no new produced animation | persisted event/authorized feedback, no public forwarding |
| SOUL_JUDGMENT_OBSERVED | acting player only | existing AURA_INFORMATION verdict | text distinct from role result | unchanged |
| GAME_PUBLIC_CHAT | immutable authorized living audience at commit | existing text, round; authorized actor ID mapped to room display name | `.wv-chat-history` ARIA log; send state/ack; text fallback | authorized event log/reconnect, not client-invented |
| PUBLIC_CHAT_MUTED / view.chat | public mute fact when allowed; own capability private | enabled, canSend, muted; no source role disclosed | disabled input and explicit status | server re-evaluates phase and mute |
| ACTION_ACCEPTED / skill feedback | actor only | existing status, no premature result | pending button and visible feedback; no client adjudication | same idempotency key on uncertain retry, authoritative state |
| PHASE_CHANGED / PLAYER_ELIMINATED / MATCH_COMPLETED | existing authorized audience | existing minimal payload, no secret cause | inherited stage, state labels and verified result | unchanged |

Status: Engine and frontend connected for restricted supported decks. Wheel animation implemented in CSS (not role assignment); other animation hooks are presentation contracts/text fallbacks, not new artwork or produced character animations. No sensitive event public promotion. No assumption that native macOS transport has been tested here.
