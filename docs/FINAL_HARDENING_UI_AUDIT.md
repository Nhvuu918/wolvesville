# Sprint 03 Final Hardening — Player-first UI Audit

Legend: **LIVE** = connected to actual backend; **VIEW** = presentation only; **BLOCKED** = unsupported rule/feature; **PARTIAL** = limited test mode.

| Screen | Purpose / next step | Finding & severity | Change or safe handling | Status / test |
|---|---|---|---|---|
| Welcome | Enter village, log in or try Demo | No new critical issue | Preserved approved layout and CTAs | LIVE; existing browser E2E |
| Login / registration | Identity & session | Unclear failure text was fixed in earlier sprint | Preserved unified error codes and actual backend auth | LIVE; auth/browser regression |
| Demo Login | One-click independent demo | Old env naming bug | Retained `WV_ENABLE_DEMO_AUTH` with explicit config test | LIVE only when enabled; STARTUP-05 |
| Village / Lobby Map | See & select rooms | **High:** pointerup often misses clickable marker; clicking auto-joined | Pointer gesture capture; view-before-join; Room-ID stable markers | LIVE; Browser Lobby E2E |
| Room directory | Access every valid room | Limited 3 map slots | Directory shows full real room list; entries now open preview | LIVE; LOBBY-03 |
| Room preview | Understand room before joining | **High:** no separate confirmation | Name, occupancy, lock/full status; explicit Join, disabled when invalid | LIVE; Browser Lobby E2E |
| Room waiting | Host, members and authorized controls | Potential duplicate join | Existing host rights unchanged; join guarded; WS refresh | LIVE; multiplayer E2E |
| Test game | Choose role-supported target, resolve/feedback | Potential private data leaks | Existing server-projected results only, no premature result | PARTIAL #25/#74; gameplay E2E |
| Character Encyclopedia (Bách khoa) | Browse 97 official characters | Previously approved, no redesign permitted | Wheel/Grid/search/filter untouched | VIEW official data; Codex E2E |
| Profile | View/edit name and Public Player ID | Tech metadata avoided in previous sprint | Existing real profile API retained | LIVE; UX browser regression |
| History | Match history | Full match history not implemented | Honest unavailable explanation, no mock history | BLOCKED |
| Ranking | Competitive leaderboard | No official win/competitive engine | Not promoted as live navigation | BLOCKED |
| Settings | Audio/theme preferences | Legacy JSON export control removed earlier | Existing local visual preferences retained | VIEW / functional local settings |
| Notifications/connection | Tell what is happening | Lost pointer click had no feedback | Preview opens instantly; server errors human-readable; reconnect banner unchanged | LIVE; Browser Lobby E2E |

### Visual preservation

The approved village art, moonlit palette, typography, Codex Wheel/Grid, role artwork and original reference files are unchanged. Only a narrow overlay on marker hitbox, focus styles and a room-preview panel using existing design classes were added. No fullscreen redesign. Live multiplayer still relies on server ACL/Authorized Projection.
