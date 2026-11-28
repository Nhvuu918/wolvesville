# Wolvesville v1.8.0-development — Character Completion Factory

**FULL MILESTONE NOT MET.** F = 1/97; no new FULL certificate. The official baseline was the verified v1.7.36 ZIP; an unreleased, unverified v1.7.37 draft was repaired, not treated as a release. 25 owner choices recorded, v1.3.3 active, v1.3.4 candidate inactive.

## 1. Scorecard

|Metric|Before|After|Delta|

|---|---:|---:|---:|

|F|1|1|+0|

|R|53|53|+0|

|A|50|52|+2|

|B|38|40|+2|

|qaC|2|2|+0|

|playableC|7|7|+0|

|S_pass|79|79|+0|

|normalDecks|13|16|+3|

|Backend PASS|476|485|+9|

|Backend FAIL|0|0|+0|

|Backend SKIP|11|11|+0|

|Browser PASS|27|32|+5|

|Browser FAIL|0|0|+0|

|Browser INCOMPLETE|58|55|-3|

|Owner Choices|18|25|+7|

Atomic denominator 108 unchanged. A/B only unique new normal match decks. New candidate #90 not added to official R.

## 2. Real gameplay

- #64 normal leader, linked, revival decks: backend evidence and required browser obligations. Pair replacement, simultaneous death, owner death, invalid/self/dead target, resource, private observations, closed ledger and replay.

- #90 candidate: live recruitment, failed independent #28 recruitment, same-night recruit then sacrifice, final death membership revocation, leader cascade, living cult victory, #84 mute retains group chat; actual browser test.

- #35 candidate: two-wolf stable order collective direct deaths, guard either victim, last committed victim, no new victim retention, typed #25/#74 results, restart/replay. No eight-seat browser.

## 3. Regression

Backend exit 0; {'tests': 496, 'pass': 485, 'fail': 0, 'cancelled': 0, 'skipped': 11, 'todo': 0}; duration 172552.560874 ms; complete True. Historical results unchanged: True.

Browser {'total': 87, 'PASS': 32, 'FAIL': 0, 'INCOMPLETE': 55}; rule-version {'total': 122, 'PASS': 35, 'FAIL': 0, 'INCOMPLETE': 87}. Fresh certificate revalidation {'F': 1, 'qaC': 2, 'playableC': 7, 'atomicPass': 79}.

Debt transition counts: {'existingIncompleteToPass': 3, 'existingFailToPass': 0, 'existingPassRevalidated': 27, 'existingPassNotRevalidated': 0, 'newPass': 2, 'newIncomplete': 0}. Full browser inventory remains incomplete. No pass carried forward from old fingerprint.

## 4. Remaining FULL gates

See COMPLETION_CONTRACT_DELTA.md for exact missing obligations and code. #64 T-COV-64 (#27/#97, LIFE-02) not closed; mandatory lock/trap/transform and state classes not globally verified. #90 dead follower award/revival group/faction policy remains unresolved, plus engineering scope for protected sacrifice/SMU. #25/#74 general typed P05 and transformations remain unfinished. #79 Q13-09 is engineering, not a rule question.

## 5. Source and evidence

Fingerprint: `322b7d281d239cad18ae45946df7806dcfdee683521e03990970b769391a4642`.

Source: build, rules build, verify:source completed. Historical archives preserved. Screenshot manifest contains only 12 selected current gameplay frames; one initial transition frame excluded. Human QA, PG live, native Mac installation/run pending. Privacy release PARTIAL, competitive NO-GO.

Commands: `WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=4 tests/*.test.mjs`; browser-run.sh with existing 65s scenario deadline and exclusive admission; matrix exit 1 where other obligations unexecuted.

See OWNER_DECISION_INTEGRATION_REPORT.md, COMPLETION_CONTRACT_DELTA.md, HUMAN_QA.md, screenshots/new-gameplay-manifest.json, browser and backend logs, acceptance.json, release-gates.json.
