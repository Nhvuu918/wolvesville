/** CLI only; never used as a public player API. */
import {readFileSync} from 'node:fs';
const [kind='rule',value='VH03']=process.argv.slice(2);
const dir='data/rule-intelligence';
const files={rule:'rules_118',character:'characters_97',interaction:'interaction_pairs_4656',inference:'inferences'};
if(!files[kind]){console.error('Kinds: rule, character, interaction, inference');process.exit(2);}
const data=JSON.parse(readFileSync(`${dir}/${files[kind]}.json`));
let result;
switch(kind){
 case 'rule':result=data.find(x=>x.ruleId===value);break;
 case 'character':result=data.find(x=>x.characterId===Number(value));break;
 case 'interaction':{const [a,b]=value.split('-').map(Number);result=data.find(x=>x.characterA===Math.min(a,b)&&x.characterB===Math.max(a,b));break;}
 case 'inference':result=data.find(x=>x.inferenceId===value);break;
}
if(!result){console.error('NOT_FOUND: no evidence-backed record for query');process.exit(1);}
console.log(JSON.stringify(result,null,2));
