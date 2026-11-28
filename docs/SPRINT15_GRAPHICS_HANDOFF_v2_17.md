# Graphics Contract v2.17 WIP — additive, version-bound

| Event/state | Trigger | Audience/payload | UI and replay/reconnect | Motion |
|---|---|---|---|---|
| MATCH_COMPLETED | Closed ledger and authoritative predicate (QD-01, personal or existing faction predicate) | ROOM_PUBLIC: winnerIds only | Victory panel maps all IDs to room display names including dead co-winners; restored on reconnect and replay from committed winner set | Existing reduced-motion fallback; no new animation asset |
| Revenge response | Accepted #33 post-hanging action; QD-02 may consume without death | Actor-private action acknowledgement; existing public deaths only. No wrong-faction label or hidden faction field | Pending capability removed; no second response; public survival is observable | Existing confirmation and static feedback |
| Hunter pin | Valid #88 mark, expiration on next NIGHT_COLLECT (QD-03) | Server/private mark payload with source, target, round, expiration and rule version; no public target | Phase/state replay retains expired/current mark appropriately; no resurrected old mark after reconnect | Existing selection feedback; no added animation |
| Pack action | #48 sole wolf selects one/two targets | Actor-private capability and result; actual public eliminated-player IDs only | Existing multi-target control and authoritative result/reconnect | Existing selection and elimination hooks |

No new produced graphics or animation assets. Existing Dark Fantasy and reduced-motion behavior retained. Historical rule versions retain original replay semantics.
