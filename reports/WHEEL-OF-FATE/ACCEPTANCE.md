# Wheel of Fate — acceptance scope (Owner cases 1–64)
Evidence: browser.log, focused-final.log, browser/animation.json, screenshot/video manifest. Browser connected to actual SQLite backend through repository's HTTP/WS bridge. Bridge uses in-memory storage because Chromium blocks all direct navigations in this environment, so native refresh/localStorage is NOT marked PASS. Focused = 21/21 (includes earlier tests and 5 new tests); browser suite exit 0. No new F/character metrics.

| Owner case | Evidence status | Notes |
|---|---|---|
| 1 | PASS | Four real Normal participants; each had 3 defaults |
| 2 | NOT RUN | No certified 8-player Normal deck in baseline |
| 3–5 | PASS | Excluded own ID; 4 independent accounts; actual room/game identities |
| 6–13 | PASS | Uncheck, select all, reset, add text, duplicate prevention, search, empty list and restore |
| 14 | VERIFIED SUBSET | Real SVG from selected entries; geometry tested for 1–132 entries; not full visual large-roster test |
| 15–16 | PASS | Actual disc transform varies; pointer CTM constant |
| 17–23 | VERIFIED | Continuous trapezoid velocity unit test, actual sampled angles, 114 captured browser frames, final winner geometry verified; no interpolation used to invent motion |
| 24 | VERIFIED SUBSET | Spin/edit controls locked; close cancels frame; repeated spin path; no exhaustive stress run |
| 25–27 | RUNTIME VERIFIED | Start/tick/result SFX function invoked in order; human listening not verified |
| 28 | PASS | Wheel mute: no calls; close cancels pending animation |
| 29 | PARTIAL | Existing SFX volume read (tested invocation at 35%); output level not measured |
| 30 | PARTIAL | No new audio after muted close; cancellable voices in implementation; audible tail not human verified |
| 31–33 | PASS | Night, day, public vote in same real Normal game |
| 34 | VERIFIED SUBSET | Actual public vote target selected, submit remains separate; not all skill/multi-target paths tested |
| 35–37 | PASS IN SCENARIO | Revision, feedback count, selection unchanged by spin; no auto-vote/skill; manual vote committed only after click |
| 38–40 | PARTIAL | Wheel never controls timer; applyPlan checks live capabilities/phase/connection at click; exhaustive invalid/phase race not run |
| 41 | PASS IN SCENARIO | Other client revision unchanged and no modal or result received |
| 42–45 | VERIFIED SUBSET | No network writes/WS emissions/game events in wheel; roster only public fields; avatar GET ACL tested. Full audit of host/replay/statistics not repeated |
| 46–47 | PASS | Reopen and night/day/vote retain custom selections |
| 48–50 | IMPLEMENTED, NOT FULLY VERIFIED | Native localStorage key by account+game+mode; direct navigation blocked; real refresh/reconnect/new-game matrix pending |
| 51 | VERIFIED SUBSET | Independent accounts in browser; same-origin same-browser shared-storage native test pending |
| 52 | PASS | Desktop 1440x900 |
| 53–54 | NOT RUN | Dedicated native MacBook/tablet viewport matrix pending |
| 55 | PASS | Mobile 390x844 layout/viewport screenshot |
| 56–57 | PASS IN SMOKE | Dark/light screenshot and layout smoke all 16 themes; full contrast/audio/theme QA pending |
| 58–59 | PARTIAL | Geometry 1–132, names shortened; no real large game or exhaustive long-name stress |
| 60 | PASS | Reduced-motion browser spin used for valid vote selection |
| 61 | PASS | Same-origin asset HTTP 200; relative media route; no hardcoded deployment host |
| 62 | NOT RUN | No live cloud URL, PG or Internet multiplayer |
| 63 | PASS | Real Normal development room, Candidate/Integration QA flags off |
| 64 | IMPLEMENTED, NOT E2E | Connection state and current capabilities checked before apply; official API still authoritative; outage matrix pending |

Product decisions: fixed small central pointer; equal sectors selected by Web Crypto rejection sampling; 5 full turns then exact sector center (Reduced Motion shorter); default excludes self, explicit server eligible scope may include self if permitted; text items never become player IDs; cap 32 custom labels of max 48 chars; large discs show seat IDs; avatar read requests use the existing authorized media service, slot only, max 4 concurrent, neutral initials fallback, do not send selections; list persistence local and scoped, no extra DB table; only first/second slot supported by current Action Panel, preserve existing first selection on multi-target; no fresh FULL cert and no core rule changes.
