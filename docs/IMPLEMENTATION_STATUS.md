# Sprint 01 Implementation Status

| Component | Status | Evidence / limits |
|---|---|---|
| TypeScript backend | **Implemented** | `npm run build` passes; ESM output in `dist/` |
| Official character source loader | **Implemented** | 97 original roles; hash checked; immutable source copy |
| Rule version index | **Imported, non-executable** | 118 immutable decisions, 207 non-running textual specifications |
| Game State Manager | **Implemented kernel** | Phase FSM, separate LifeState and publicReportedDead, initial role uniqueness, revision |
| Action Contract | **Implemented** | Actor/targets/phase/round/payload/idempotency/ruleset |
| Action Validator | **Implemented kernel** | Member, phase, targets, charge budget, locks, post-accept revalidation; special skills unresolved |
| Queue | **Implemented kernel** | Stored accepted commands, stable fixture-priority ordering; full VH08 dependency DAG not implemented |
| RNG | **Implemented** | HMAC seed, sorted domain, replay tape, empty-domain fail-closed |
| Rule Registry | **Implemented interface** | Production starts empty; technical fixture adapters only |
| Effect Resolution | **Implemented fixture subset** | DAMAGE/PROTECTION/HEAL/BLOCK/STATUS/RESOURCE/DEATH/INFO sandbox; other effects return unresolved |
| Event Ledger | **Implemented** | Monotonic seq, hash chain, causal ID, server-only, same SQLite transaction |
| Replay | **Implemented kernel** | State-from-event snapshots, verified event seq/hash/draw tape, restart and tamper tests |
| Visibility | **Implemented kernel** | Server-filtered self/room projection, player private, frozen event audience requirement; real chat absent |
| SQLite migration | **Implemented** | Runtime `node:sqlite`; schema applies automatically |
| PostgreSQL + Prisma | **Not implemented** | Repository seam ready for Sprint 02 |
| Auth gateway + HTTP/Socket.IO | **Not implemented** | Core APIs cannot be invoked safely by anonymous web requests |
| AFK scheduling | **Not implemented** | RNG primitive ready; business scheduler not built |
| Actual 97 character skills | **Not implemented** | All official skills must be backed by verified role adapters and golden tests |
| Victory predicates | **Blocked** | Match completion refuses unsupported wins |
| Approved frontend | **Preserved** | 107 exact files; not modified or integrated |
| Real executable tests | **24 PASS** | Source G0, state, queue, rollback, replay, RNG, ACL, errors |
| All 207 historic specs executed | **No** | They remain reference-only; actual kernel tests are separate |

## Known limitations of this Sprint

1. Event replay uses `STATE_COMMITTED` state records, not independent effect-by-effect domain reexecution.
2. Queue priority is stable and testable, but role-specific dependency DAG is still missing.
3. The kernel is a library, not a public secure game server; calling `getInternalState` outside trusted backend would expose secrets.
4. `ruleVersion` is pinned, but adapters do not yet load an executable, audited role pack.
5. SQLite works locally and tests atomicity; production multi-region and distributed durability require a Postgres-backed adapter.
6. Event/audit hash chains detect accidental tampering but are not a replacement for a separately signed append-only audit store.
