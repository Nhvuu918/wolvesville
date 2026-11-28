// Evidence from the real adapter registry, not a gameplay or certificate test.
import {writeFileSync} from 'node:fs';
import {RuleRegistry} from '../../dist/backend/src/engine/rules.js';
import {registerOfficialInspection} from '../../dist/backend/src/official/inspection-rules.js';
import {registerOfficialSupport} from '../../dist/backend/src/official/support-rules.js';
import {registerOfficialPeace} from '../../dist/backend/src/official/peace-rules.js';
import {registerOfficialKnight} from '../../dist/backend/src/official/solo-rules.js';
import {registerOfficialVoteControl} from '../../dist/backend/src/official/vote-control-rules.js';
import {registerOfficialJudgment} from '../../dist/backend/src/official/judgment-rules.js';
import {registerOfficialNightmare} from '../../dist/backend/src/official/nightmare-rules.js';
import {registerS13Mechanics} from '../../dist/backend/src/official/s13-mechanics.js';
import {registerEngineerTrap} from '../../dist/backend/src/official/engineer-trap.js';
import {registerMediumRevival} from '../../dist/backend/src/official/revival.js';
const r=new RuleRegistry(),rows=[];let file;
const original=r.register.bind(r);
r.register=(a)=>{original(a);rows.push({characterId:a.characterId,skillId:a.skillId,ruleId:a.ruleId,ruleVersion:a.ruleVersion,priority:a.priority,phases:a.phases,target:a.target,cost:a.cost??null,maxUsesPerPhase:a.maxUsesPerPhase??null,hasSubmissionGuard:!!a.validateSubmission,source:'backend/src/official/'+file+'.ts'});};
for(const [fn,f] of [[registerOfficialInspection,'inspection-rules'],[registerOfficialSupport,'support-rules'],[registerOfficialPeace,'peace-rules'],[registerOfficialKnight,'solo-rules'],[registerOfficialVoteControl,'vote-control-rules'],[registerOfficialJudgment,'judgment-rules'],[registerOfficialNightmare,'nightmare-rules'],[registerS13Mechanics,'s13-mechanics'],[registerEngineerTrap,'engineer-trap'],[registerMediumRevival,'revival']]){file=f;fn(r)}
writeFileSync('reports/v1.7.32/runtime-adapters.json',JSON.stringify({scope:'Registration inventory from official withKernel path, not proof of full execution; passive rules are tracked separately',adapters:rows},null,2)+'\n');
console.log('REGISTERED',rows.length,'CHARACTERS',new Set(rows.map(x=>x.characterId)).size);
