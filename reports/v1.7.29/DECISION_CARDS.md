# Decision Cards — v1.7.29 (NOT APPROVED; QA boundaries unchanged)

All 14 Owner B/B decisions remain unchanged. No new rule or normal deck is activated. References: `data/character.json`, `data/rules/official_merged_118.json`, `data/rules/owner_bb_final_decisions_20261125.json`, `data/rules/owner_bb_rep_new_01_20261125.json`, previous decision cards.

## DC-SOUL-01 — targeting public dead seats
#23 and LIFE-01 establish a second lethal death, including pending revival. They do not specify the public target selection UI for every attacker, or the treatment of a truly dead target. Existing [8,23,25,36] QA uses a cost-free #8 blind attack on any non-self public dead seat; ordinary alive-only finite skills remain restricted at submission.
- A: for explicitly approved lethal skills, show public-dead seats to everyone entitled to that skill; resolve server-side. For finite costs, consume one use on each syntactically valid blind attempt, including a genuinely dead seat, and expose no extra private result unless separately authorized.
- B: retain alive-public-only selection for finite skills; approve the #8 QA blind behavior (or name other cost-free skills) separately. A later hit on #23 remains possible through a previously accepted attack as allowed by LIFE-01.
Example: a publicly dead #23 and publicly dead #25 are indistinguishable in the target list; the latter must not trigger a new death. A/B govern submission, not attack protection or victory. Explicit approval required before promotion.

## DC-SOUL-02 — wrong-faction shot and ammunition
#23 says two night bullets to help villagers kill wolves and third factions, but does not explicitly state mistaken-target handling. Existing hostile-only QA validation is an oracle at submission and is not promoted to Normal Gameplay.
- A: all other eligible public-living seats are valid; one bullet consumed for each valid shot; ordinary damage applies even if target is village; protection remains applicable.
- B: all other eligible public-living seats may be attempted; one bullet consumed irrespective of faction; damage only for hostile targets, no distinct wrong-faction receipt. Specify whether any post-resolution private result is allowed.
Example: #23 accidentally shoots #25 rather than #8. A risks a friendly death; B produces no damage to #25, but still spends a bullet. Both avoid pre-resolution team filtering; neither authorizes shooting a public-dead seat without DC-SOUL-01.

## DC-TRAP-02 — the actor casting revival has the trap
#10, DEC-BT-02, BB-04/BB-05 and BB-PENDING-03 specify persistent traps and group inversion; approved examples for protection/rescue do not specify the inversion of #26 targeting an already dead player. The previously accepted trap-retention-on-revived-target scenario is different.
- A: valid #26 revive is inverted to a failed revival; target stays dead; one revival use and one trap consumed; no synthetic resurrection/death events.
- B: the revival is applied, followed immediately by a lethal reversed effect on the revived target, with ordinary death/reaction bookkeeping under explicitly defined protection and announcement rules; one revival use and one trap consumed. This can trigger further consequences and requires precise ordering and public disclosure decisions.
Example: trapped #26 targets dead #25. A keeps the original death; B creates a revival plus a second death, with potentially distinct downstream triggers. Do not infer B from protection/rescue inversion alone. No choice implemented.

## DC-PACK-KEEP — previously valid target becomes ineligible before lock
KEEP and BB-03=A are approved; current `lockPack` revalidates the last selection, and fails closed as TARGET_REVOKED when it is no longer eligible. A new decision is only necessary for what to do next, not for eligible membership or representative order.
- A: revoke that invalid selection at lock; keep window open for an explicit new valid selection, without publishing the reason to unauthorized viewers; no fallback and no automatic ballot.
- B: treat that actor as responded without a valid choice; if everyone has responded, resolve NO_CONSENSUS, without a bite. No fallback and no automatic ballot.
Example: W1 and W2 picked X while valid; X becomes wolf before lock. Neither can attack X; A requires a new choice, B may close with no consensus. Must reconcile with secret faction disclosure. Existing fail-closed behavior unchanged. No owner decision is requested for purely technical redaction of global revisions/timing; those remain engineering obligations.
