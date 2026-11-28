/** Candidate-only policy, bound at creation; existing archive and normal games retain their policy. */
import type {GameState} from '../../../shared/contracts/index.js';
export const OWNER_DC_POLICY='WV-DC-2026-11-25-A' as const;
export const ownerDcEnabled=()=>process.env.WV_OWNER_DC_QA==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export const OWNER_DC_SCOPE_S21='WV-DC-2026-11-25-A-S21' as const;
export const ownerDcS21=(s:GameState)=>s.qaOwnerDecisionPolicy===OWNER_DC_SCOPE_S21;
export const ownerDc=(s:GameState)=>s.qaOwnerDecisionPolicy===OWNER_DC_POLICY||ownerDcS21(s);
