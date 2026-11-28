# Engineering decisions — deep batch

- Additive restricted scopes instead of speculative global interactions; explicit unsupported targets and state fail closed. Use persisted statuses/links rather than client-side simulation; use existing Game Session transaction, archive and projections.
- Distinguish preliminary death from final public death and evaluate victory after finalizing; preserve recipient visibility.
- Redirect resolution chooses actual recipient before death. Successful flag marks consume a use and set cooldown; hypnosis selection tracked per night. No general recursive redirect implementation or invented priority.
- Two-target linked death and dual comparison are resolved under existing transactional action/vote commits. No new faction assignment from aura information.
- Harden final-hanging predicate using true committed death and official vote ledger. Evaluate wolf parity only in source-audited new Jester/Peace configuration.
- Do not claim F from a role-local predicate alone while an actual required nonlethal hanging path remains unimplemented. Do not claim C from one winning route when the counterexample remains unresolved.
- Atomized source registry of 11 roles, 24 distinct branches; unaudited role denominators remain unknown. Restricted execution and full interaction certification are separate. Inherited adapter count retained separately.
