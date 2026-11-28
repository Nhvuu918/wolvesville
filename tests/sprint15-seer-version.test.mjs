import test from 'node:test';
import assert from 'node:assert/strict';
import {SqliteRepository} from '../dist/backend/src/persistence/sqlite.js';
import {EngineService} from '../dist/backend/src/engine/service.js';
import {RuleRegistry} from '../dist/backend/src/engine/rules.js';
import {registerOfficialInspection} from '../dist/backend/src/official/inspection-rules.js';
import {RULESET_VERSION,LEGACY_RULESET_VERSION} from '../dist/shared/contracts/index.js';
import {OfficialRuleKnowledgeBase} from '../dist/backend/src/rule-intelligence/knowledge-base.js';

test('S15 owner correction: historical v1.3.1 sessions retain exact role and valid replay; new sessions use aura',()=>{
 const originalRepo=new SqliteRepository(':memory:'),repo=new SqliteRepository(':memory:');
 const registry=registerOfficialInspection(new RuleRegistry());
 try{
  const original=new EngineService(originalRepo,registry);
  const init=original.createGame('room',[{playerId:'seer',characterId:25},{playerId:'mystic',characterId:74}],{gameId:'new-game',seed:'owner-test'});
  assert.equal(init.ruleVersion,RULESET_VERSION);
  // Construct a legacy initial archive (not rewriting any persisted game).
  repo.create({...init,gameId:'legacy-game',ruleVersion:LEGACY_RULESET_VERSION});
  const engine=new EngineService(repo,registry);
  for(const [svc,db,id,version,eventType] of [[original,originalRepo,'new-game',RULESET_VERSION,'SEER_AURA_OBSERVED'],[engine,repo,'legacy-game',LEGACY_RULESET_VERSION,'ROLE_OBSERVED']]){
   svc.transition(id,'ROLE_ASSIGNED');svc.transition(id,'NIGHT_COLLECT');
   svc.submit({gameId:id,actionId:'seer-action',playerId:'seer',skillId:'official.25.inspect-role',targetIds:['mystic'],phase:'NIGHT_COLLECT',round:1,timestamp:1,payload:{},idempotencyKey:'seer-action',ruleVersion:version});
   svc.transition(id,'NIGHT_RESOLVE');svc.resolve(id);
   const observed=db.events(id).filter(e=>['SEER_AURA_OBSERVED','ROLE_OBSERVED'].includes(e.eventType));assert.equal(observed.length,1);assert.equal(observed[0].eventType,eventType);assert.equal(observed[0].ruleVersion,version);assert.equal(observed[0].visibility,'PLAYER_PRIVATE');assert.equal(observed[0].recipientId,'seer');
   if(version===RULESET_VERSION){assert.equal(observed[0].payload.verdict,'Thiện');assert.equal('characterId' in observed[0].payload,false);}else assert.equal(observed[0].payload.characterId,74);
   assert.equal(svc.replay(id).verified,true);
  }
  assert.equal(new OfficialRuleKnowledgeBase().getRule('S15-OWNER-SEER-01').verificationStatus,'CONFIRMED');
 }finally{originalRepo.close();repo.close();}
});
