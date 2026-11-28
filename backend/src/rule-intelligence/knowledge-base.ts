/** Source-grounded developer-only Rule Knowledge Base. NEVER project this
 * registry or arbitrary descriptions to a player; gameplay is still
 * authorized exclusively by installed Rule Adapters and bounded packs.
 */
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {isApprovedInspectionDeck,INSPECTION_SKILLS} from '../official/inspection-rules.js';
import {SOI_GAI_DOC_RULE_ID} from '../official/reactive-rules.js';
import {SUPPORT_SKILLS} from '../official/support-rules.js';
import {KernelError} from '../common/errors.js';

export type VerificationStatus='CONFIRMED'|'DERIVED'|'AMBIGUOUS'|'MISSING';
export type TechnicalStatus='NOT_IMPLEMENTED'|'IMPLEMENTED_RESTRICTED_ACTION'|'IMPLEMENTED_RESTRICTED_PASSIVE_ONLY';
export interface RuleRecord{
 ruleId:string;exactRule:string;verificationStatus:VerificationStatus;implementationStatus:string;
 source:{document:string;localMirror:string;lookupKey:string};linkedSkillBranchIds:string[];relatedTestSpecIds:string[];
}
export interface RoleRecord{
 characterId:number;name:string;faction:string;technicalStatus:TechnicalStatus;
 officialActiveAdapterIds:string[];officialPassiveRuleIds:string[];testGameEligible:boolean;competitiveEligible:boolean;
 currentSkillIds?:string[];currentPassiveIds?:string[];currentImplementationStatus?:string;
}
export interface InteractionRecord{
 characterA:number;characterB:number;interactionStatus:string;sourceTestSpecIds:string[];
 resolvedOutcome:string|null;mechanismScreeningOnly:boolean;
}
function load<T>(root:string,name:string):T {
 return JSON.parse(readFileSync(resolve(root,`data/rule-intelligence/${name}.json`),'utf8')) as T;
}
function deepCopy<T>(value:T):T{return structuredClone(value);}
/** Avoid accidentally treating a successful code implementation as official rule confirmation. */
export class OfficialRuleKnowledgeBase {
 private readonly rules:Map<string,RuleRecord>;
 private readonly supplementalRules:Map<string,RuleRecord>;
 private readonly roles:Map<number,RoleRecord>;
 private readonly interactions:Map<string,InteractionRecord>;
 constructor(root=process.cwd()){
  const sourceRules=load<RuleRecord[]>(root,'rules_118');
  const overlayExists=existsSync(resolve(root,'data/rule-intelligence-s05/execution_manifest.json'));
  const sourceRoles=overlayExists?JSON.parse(readFileSync(resolve(root,'data/rule-intelligence-s05/characters_97.json'),'utf8')) as RoleRecord[]:load<RoleRecord[]>(root,'characters_97');
  const sourcePairs=overlayExists?JSON.parse(readFileSync(resolve(root,'data/rule-intelligence-s05/interaction_pairs_4656.json'),'utf8')) as InteractionRecord[]:load<InteractionRecord[]>(root,'interaction_pairs_4656');
  if(sourceRules.length!==118||sourceRoles.length!==97||sourcePairs.length!==4656)
    throw new KernelError('INVALID_ARGUMENT','Rule Knowledge Base source integrity mismatch');
  if(sourceRules.some(r=>r.verificationStatus!=='CONFIRMED'))
    throw new KernelError('INVALID_ARGUMENT','Confirmed decision registry must not include inferred rules');
  this.rules=new Map(sourceRules.map(r=>[r.ruleId,r]));
  const correctionPath=resolve(root,'data/rules/sprint15_owner_seer_correction.json');
  const correction=existsSync(correctionPath)?JSON.parse(readFileSync(correctionPath,'utf8')) as RuleRecord:null;
  this.supplementalRules=new Map(correction?[[correction.ruleId,correction]]:[]);
  this.roles=new Map(sourceRoles.map(r=>[r.characterId,r]));
  this.interactions=new Map(sourcePairs.map(x=>[`${x.characterA}-${x.characterB}`,x]));
  if(this.rules.size!==118||this.roles.size!==97||this.interactions.size!==4656)
    throw new KernelError('INVALID_ARGUMENT','Duplicate KB identifiers');
 }
 getRule(ruleId:string):RuleRecord|null{const rule=this.supplementalRules.get(ruleId)??this.rules.get(ruleId);return rule?deepCopy(rule):null;}
 getCharacter(characterId:number):RoleRecord|null{return this.roles.has(characterId)?deepCopy(this.roles.get(characterId)!):null;}
 getInteraction(a:number,b:number):InteractionRecord|null{
  if(!Number.isInteger(a)||!Number.isInteger(b)||a===b)return null;
  const key=`${Math.min(a,b)}-${Math.max(a,b)}`;
  return this.interactions.has(key)?deepCopy(this.interactions.get(key)!):null;
 }
 /** Must be paired with the actual RuleRegistry.get & server-side auth checks.
  * A positive result is NOT a right to run a competitive game. */
 allowedInRestrictedOfficialTest(dealtRoleIds:readonly number[],characterId:number,skillId:string|null):boolean{
  if(!isApprovedInspectionDeck(dealtRoleIds)||!dealtRoleIds.includes(characterId))return false;
  const role=this.roles.get(characterId);if(!role)return false;
  if(characterId===20)return skillId===null&&role.officialPassiveRuleIds.includes(SOI_GAI_DOC_RULE_ID);
  return skillId!==null&&([...Object.values(INSPECTION_SKILLS),...Object.values(SUPPORT_SKILLS)] as string[]).includes(skillId)&&
    (role.currentSkillIds??role.officialActiveAdapterIds).includes(skillId);
 }
 get currentExecution(){
  const path=resolve(process.cwd(),'data/rule-intelligence-s05/execution_manifest.json');
  return existsSync(path)?JSON.parse(readFileSync(path,'utf8')) as Record<string,unknown>:null;
 }
 get counts(){return {confirmedDecisions:this.rules.size,characters:this.roles.size,pairScreening:this.interactions.size} as const;}
}
