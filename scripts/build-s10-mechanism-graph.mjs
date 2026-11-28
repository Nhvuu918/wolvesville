/** Generate audit-only dependency groups for all original 145 skill branches.
 * Mechanism tags from S05/S06 audit are NOT gameplay rules; no source overwrite.
 */
import {readFileSync,writeFileSync} from 'node:fs';
const source=JSON.parse(readFileSync('data/rule-intelligence/skills_145.json','utf8'));
const graph={schemaVersion:1,status:'TECHNICAL_AUDIT_NOT_OFFICIAL_RULE',source:'data/rule-intelligence/skills_145.json',branchCount:source.length,
 mechanismTagCounts:{},mechanisms:[
  {id:'auth_acl',description:'Account identity, membership, role-secret filtering'},
  {id:'phase_scheduler',description:'Night/day stage, deadlines, server revisions'},
  {id:'action_intake',description:'Target eligibility, idempotency, action receipts'},
  {id:'resource_ledger',description:'Charges, expirations, active effects'},
  {id:'status_interactions',description:'Block, shield, deception, faction transfer and reflect'},
  {id:'combat_resolution',description:'Attack, redirect, defense, reactive and delayed effects'},
  {id:'elimination_chain',description:'Death source, revive, protection and death-linked cascades'},
  {id:'voting_policy',description:'Vote eligibility, effective ballot and authorized adjudication — V02/V03 BLOCKED'},
  {id:'victory_resolution',description:'Source-backed win predicates after all effects'},
  {id:'event_acl_replay',description:'Persisted, auditable events, private feedback, replay and reconnect'},
  {id:'graphics_projection',description:'Authorized visuals, never authoritative game outcomes'}],
 dependencies:[['auth_acl','phase_scheduler'],['auth_acl','action_intake'],['phase_scheduler','action_intake'],['action_intake','resource_ledger'],['resource_ledger','status_interactions'],['status_interactions','combat_resolution'],['combat_resolution','elimination_chain'],['action_intake','voting_policy'],['voting_policy','elimination_chain'],['elimination_chain','victory_resolution'],['victory_resolution','event_acl_replay'],['elimination_chain','event_acl_replay'],['event_acl_replay','graphics_projection']],
 branchAudit:source.map(b=>({branchId:b.skillBranchId,characterId:b.characterId,tags:b.auditOnlyMetadata?.mechanismTags||[],readiness:b.auditOnlyMetadata?.readiness||'UNKNOWN',sourceRuleIds:b.sourceRuleIds||[],legacyImplementationStatus:b.implementationStatus||'UNKNOWN',sourceVerification:b.verificationStatus||'UNKNOWN'}))};
for(const b of graph.branchAudit)for(const tag of b.tags)graph.mechanismTagCounts[tag]=(graph.mechanismTagCounts[tag]??0)+1;
if(source.length!==145)throw Error('145 original branch inventory mismatch');
writeFileSync('data/rule-intelligence-s10/skill_dependency_audit_145.json',JSON.stringify(graph,null,2)+'\n');
console.log(`S10 DEPENDENCY GRAPH ${source.length} source-audited branches and ${graph.mechanisms.length} technical layers`);
