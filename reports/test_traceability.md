# 24 actual runtime tests — traceability

| ID | Mechanism | Rule/source | Actual test |
|---|---|---|---|
| KERN-001 | SOURCE | G0 | official character SHA/118 rules/207 specs | source: 97 unique roles unchanged; 118 decision registry, 207 separate legacy specs |
| KERN-002 | STATE | VH33 | G1 phase machine | state machine rejects invalid transitions, advances round only after day |
| KERN-003 | ROLE | ROOM-01/02 | Q13-04 | rejects duplicated/unknown initial character IDs; allows 1 human and rejects >97 unique slots |
| KERN-004 | VALIDATION | G1 | Q13-01/02 | validator rejects phase mismatch, non-member, forbidden target, exhausted resources |
| KERN-005 | IDEMPOTENCY | G1 | idempotency | idempotency: same action retry is no-op, conflicting payload is rejected |
| KERN-006 | AUTH | G1 | RULE_UNRESOLVED | permission: production registry refuses unregistered role skills and opt-in fixtures |
| KERN-007 | QUEUE | VH08 | technical fixture priority | queued actions do not resolve before phase close and priority beats request order |
| KERN-008 | PH01 | PH-01 | accepted command after actor death | PH-01: submitted action still runs after sender dies, unless locked |
| KERN-009 | BLOCK | VH10/VH41 | mechanism fixture only | VH10/VH41-like fixture: valid lock cancels accepted action without charging resources |
| KERN-010 | TX | G1 | atomic rollback | atomic rollback on adapter throw: no half state or events or charges committed |
| KERN-011 | RULE | G1 | resolver lookup | unknown adapter at resolution leaves accepted action queued and state untouched |
| KERN-012 | RNG | Q13-06/11 | deterministic domain | RNG: deterministic, conditioned domain, empty domain fail-closed, event tape replay |
| KERN-013 | RNG | F02 | empty domain fail-closed | RNG empty at effect stage triggers full rollback, no random fallback |
| KERN-014 | ACL | VH62/PRIV-01 | projection | ACL: player projections omit hidden roles, seed, other resources and internal events |
| KERN-015 | REPLAY | G1 | persistence restart/snapshots | snapshot + replay survives SQLite restart |
| KERN-016 | REPLAY | G1 | hash-chain tamper detection | replay detects tampered event even when persisted state remains unchanged |
| KERN-017 | RULE | F05 | unsupported effect rollback | unimplemented domain effect fails closed without partial state write |
| KERN-018 | PHASE | G1 | closed phase | admission seals phase and historical ruleVersion mismatch cannot be accepted |
| KERN-019 | REVALIDATION | PH-01 | target status changes | revalidation: target dead before accepted hit is resolved fails closed and rolls back whole batch |
| KERN-020 | RESOURCE | Q13-01 | resource debit | resource ledger: successful resolved fixture spends one charge and does not double-spend on retry |
| KERN-021 | ACL | PRIV-01 | historical audience | faction/group event cannot leak to a later joiner when historical audience is missing |
| KERN-022 | DETERMINISM | VH08 | stable ordering | replay converges to same final state when unrelated commands arrive in opposite request order |
| KERN-023 | IDEMPOTENCY | G1 | action ID uniqueness | new idempotency key cannot reuse same actionId; payload must be a dictionary |
| KERN-024 | VICTORY | VH03/F07 | blocked completion | complete match is blocked until confirmed victory predicates exist |
