import {SEED_SKILL,CUPID_SKILL,PROLONG_SKILL} from '../official/life02.js';
import {CULT_RECRUIT,CULT_SACRIFICE,applyCult} from '../official/cult-recruitment.js';
import {SOUL_SHOT} from '../official/soul-shooter.js';
import {MEDIUM_REVIVE,applyMediumRevival} from '../official/revival.js';
/** Technical dispatch only: no effect priority, target policy or gameplay rule is
 * inferred here. Existing registered adapters retain their domain guards.
 * New handlers bind once by skill key; unknown official effects fail closed. */
import type {Effect,GameAction,GameState} from '../../../shared/contracts/index.js';
import type {RuleAdapter} from './rules.js';
import {KernelError} from '../common/errors.js';
import {applyFixtureEffect} from './effects.js';
import {applyOfficialInspection} from '../official/inspection-effects.js';
import {INSPECTION_SKILLS} from '../official/inspection-rules.js';
import {applyOfficialSupport,SUPPORT_SKILLS} from '../official/support-rules.js';
import {applyOfficialPeace,PEACE_RULE,PEACE_SKILL} from '../official/peace-rules.js';
import {applyVerifiedKnightElimination,KNIGHT_RULE,KNIGHT_SKILL} from '../official/solo-rules.js';
import {applyOfficialVoteControl,VOTE_CONTROL_SKILL} from '../official/vote-control-rules.js';
import {applyOfficialJudgment,JUDGMENT_SKILL} from '../official/judgment-rules.js';
import {applyOfficialNightmare,NIGHTMARE_SKILL} from '../official/nightmare-rules.js';
import {applyS13Mechanic,S13_SKILLS} from '../official/s13-mechanics.js';
import {ENGINEER_TRAP,applyEngineerTrap} from '../official/engineer-trap.js';
const handlers={life02:(_s:GameState,_e:Effect,_a:GameAction):never=>{throw new KernelError('RULE_UNRESOLVED','LIFE-02 requires batch resolution');},cult:applyCult,inspection:applyOfficialInspection,support:applyOfficialSupport,peace:applyOfficialPeace,knight:applyVerifiedKnightElimination,voteControl:applyOfficialVoteControl,judgment:applyOfficialJudgment,nightmare:applyOfficialNightmare,s13:applyS13Mechanic,engineer:applyEngineerTrap,revival:applyMediumRevival};
type Category=keyof typeof handlers;
const routes=new Map<string,{category:Category;ruleId?:string}>();
function register(category:Category,ids:readonly string[],ruleId?:string){for(const id of ids){if(routes.has(id))throw new Error(`Duplicate effect route ${id}`);routes.set(id,{category,ruleId});}}
for(const [id,skill] of Object.entries(INSPECTION_SKILLS))register('inspection',[skill],`OFFICIAL_CHAR_${id}_ROLE_INSPECTION`);
register('support',Object.values(SUPPORT_SKILLS));register('peace',[PEACE_SKILL],PEACE_RULE);register('knight',[KNIGHT_SKILL],KNIGHT_RULE);register('voteControl',[VOTE_CONTROL_SKILL]);register('judgment',[JUDGMENT_SKILL]);register('nightmare',[NIGHTMARE_SKILL]);register('s13',[...Object.values(S13_SKILLS),SOUL_SHOT]);register('engineer',[ENGINEER_TRAP]);register('revival',[MEDIUM_REVIVE]);register('cult',[CULT_RECRUIT,CULT_SACRIFICE]);register('life02',[SEED_SKILL,CUPID_SKILL,PROLONG_SKILL]);
export function hasOfficialEffectRoute(skillId:unknown):boolean{return typeof skillId==='string'&&routes.has(skillId);}
export function resolveEffectRoute(rule:RuleAdapter,action:GameAction){
 const route=routes.get(action.skillId);
 if(route&&(!route.ruleId||route.ruleId===rule.ruleId))return {category:route.category,apply:handlers[route.category]};
 if(!route&&rule.ruleId.startsWith('TEST_FIXTURE_'))return {category:'fixture' as const,apply:(s:GameState,e:Effect,_a:GameAction)=>applyFixtureEffect(s,e)};
 throw new KernelError('RULE_UNRESOLVED','Unsupported official effect branch');
}
