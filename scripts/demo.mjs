import {SqliteRepository} from '../dist/backend/src/persistence/sqlite.js';
import {EngineService} from '../dist/backend/src/engine/service.js';
import {createFixtureRegistry} from '../dist/backend/src/fixtures/test-adapters.js';
import {RULESET_VERSION} from '../dist/shared/contracts/index.js';
const repo=new SqliteRepository(':memory:');
try{
 const kernel=new EngineService(repo,createFixtureRegistry(),'data/character.json',true);
 const g=kernel.createGame('room-demo',[
  {playerId:'p1',characterId:1},{playerId:'p2',characterId:2},{playerId:'p3',characterId:3}
 ],{gameId:'demo-game',seed:'DEMO-REPRODUCIBLE-SEED'});
 kernel.transition(g.gameId,'ROLE_ASSIGNED');
 kernel.transition(g.gameId,'NIGHT_COLLECT');
 const action=(id,who,skill,target)=>({actionId:id,gameId:g.gameId,playerId:who,skillId:skill,
    targetIds:[target],phase:'NIGHT_COLLECT',round:1,timestamp:1,payload:{},idempotencyKey:id,ruleVersion:RULESET_VERSION});
 console.log('Submit:',kernel.submit(action('protect','p3','fixture.protect','p2')));
 console.log('Submit:',kernel.submit(action('attack','p1','fixture.damage','p2')));
 kernel.transition(g.gameId,'NIGHT_RESOLVE');
 console.log('Resolve:',kernel.resolve(g.gameId));
 console.log('Player-safe view:',JSON.stringify(kernel.project(g.gameId,'p1'),null,2));
 const check=kernel.replay(g.gameId);
 console.log('Replay verified:',check.verified,'events:',check.events,'draws:',check.draws);
 console.log('NOTE: fixture.* is an isolated technical demonstration, NOT official Wolvesville character abilities.');
} finally {repo.close();}
