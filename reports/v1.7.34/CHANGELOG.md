# 1.7.34 — Shared Group ACL WIP

- Add persisted source-tagged functional group membership, independent of faction and win links. Only CULT_DAY profile for 1.3.3, no public creation endpoint.
- Add private GROUP transport to existing HTTP and WS chat routing, strict address validation, retry semantics, group-only refresh, frozen audience, no gameplay revision increment.
- Hide unauthorized group event positions/counts in visible event stream and replay receipt. Verify group event authorization and idempotency in ledger replay.
- Add real frontend group composer and authorized history with separate draft/receipt state.
- Two ACL integration tests + one technical browser fixture; no claim of successful recruitment or Normal Gameplay role acceptance.
- Preserve all prior role evidence, owner decisions, official rules, normal deck admission and metrics. F unchanged. Candidate v1.3.4 not activated.
