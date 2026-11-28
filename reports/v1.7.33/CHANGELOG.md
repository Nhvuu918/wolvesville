# v1.7.33 changes
- Reuse 97-role matrix and all existing contracts; #84 primary, #79 backup closure review. No new FULL certificate.
- Fail-closed public chat channel routing: previously unrecognized WOLF/GROUP input was routed to public; reject invalid channels / private addressing instead; reuse authoritative public chat eligibility in projection and mutation.
- Expire temporary public mute on next night for approved v1.3.3, preserving permanent mute and hunter mark cleanup.
- PH-02 preemption/cutoff of queued day actions on approved v1.3.3; ordinary sorting remains for archived rule mode.
- Three focused tests on existing decks and one state-level helper within those tests; one new browser suite for existing deck. No new deck; 18 choices preserved; v1.3.4 not active.
