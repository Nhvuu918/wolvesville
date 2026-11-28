import {RULESET_VERSION} from '../../../shared/contracts/index.js';
import type {Effect} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
import {RuleRegistry} from '../engine/rules.js';
import type {RuleAdapter} from '../engine/rules.js';

// TEST FIXTURES ONLY: never register in production. Skill names deliberately
// use fixture.* to prevent accidental mapping to official character skills.
export function createFixtureRegistry():RuleRegistry {
  const registry=new RuleRegistry();
  const phases:RuleAdapter['phases']=['NIGHT_COLLECT','DAY_DISCUSS'];
  const base={ruleVersion:RULESET_VERSION,characterId:null,phases,
    target:{min:1,max:1,allowSelf:false,aliveOnly:true}} as const;
  const register=(skillId:string,priority:number,evaluate:RuleAdapter['evaluate'],opts:Partial<RuleAdapter>={})=>
    registry.register({...base,ruleId:`TEST_FIXTURE_${skillId.toUpperCase().replaceAll('.','_')}`,skillId,priority,evaluate,...opts});
  register('fixture.block',5,(_s,a)=>[{type:'BLOCK',targetId:a.targetIds[0],key:typeof a.payload.skill==='string'?a.payload.skill:'fixture.damage'}]);
  register('fixture.protect',10,(_s,a)=>[{type:'PROTECTION',targetId:a.targetIds[0]}]);
  register('fixture.damage',20,(_s,a)=>[{type:'DAMAGE',targetId:a.targetIds[0]}]);
  register('fixture.heal',30,(_s,a)=>[{type:'HEAL',targetId:a.targetIds[0]}],{target:{min:1,max:1,allowSelf:true,aliveOnly:false}});
  register('fixture.finalize',40,(_s,a)=>[{type:'DEATH_TRANSITION',targetId:a.targetIds[0]}],{target:{min:1,max:1,allowSelf:true,aliveOnly:false}});
  register('fixture.random',15,(_s,a,ctx)=>{
    const winner=ctx.random(a.targetIds,'FIXTURE_RANDOM_TARGET');
    return [{type:'STATUS',targetId:winner,key:'fixture:random-selected'}];
  },{target:{min:1,max:5,allowSelf:false,aliveOnly:true}});
  register('fixture.random-empty',15,(_s,a,ctx)=>{ctx.random([],'Q13-06_EMPTY_DOMAIN_TEST');return [];});
  register('fixture.private',15,(_s,a)=>[{type:'INFORMATION_RESULT',targetId:a.targetIds[0],value:'fixture:secret',visibility:'PLAYER_PRIVATE',recipientId:a.playerId}]);
  register('fixture.charge',15,(_s,a)=>[{type:'STATUS',targetId:a.targetIds[0],key:'fixture:charge-complete'}],{cost:{name:'energy',amount:1},maxUsesPerPhase:2});
  register('fixture.unsupported-effect',15,(_s,a)=>[{type:'FACTION_TRANSFORMATION',targetId:a.targetIds[0],value:'soi'}]);
  register('fixture.late',50,(_s,a)=>[{type:'STATUS',targetId:a.targetIds[0],key:'fixture:late-executed'}]);
  register('fixture.throw',25,()=>{throw new KernelError('RULE_UNRESOLVED','Explicit fixture failure during resolution');});
  return registry;
}
