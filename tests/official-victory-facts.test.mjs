import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateVerifiedVictoryFacts,countsTowardFaction} from '../dist/backend/src/official/victory-predicates.js';
const mk=(id,characterId,faction,life='ALIVE')=>({playerId:id,currentCharacterId:characterId,initialCharacterId:characterId,currentFaction:faction,initialFaction:faction,life});
const base={completed:false,participants:[mk('fool',28,'phe3'),mk('villager',25,'dan'),mk('seeded',97,'dan','HIBERNATING'),mk('revive',23,'dan','PENDING_REVIVAL'),mk('deadwolf',34,'soi','DEAD_FINAL')]};
test('S05-V01 verified #28 hanging predicate is candidate only until VH03 end-of-chain',{timeout:5000},()=>{
 assert.deepEqual(evaluateVerifiedVictoryFacts(base,[{type:'HANGING_FINALIZED',playerId:'fool',committed:false}]),[]);
 const f=evaluateVerifiedVictoryFacts(base,[{type:'HANGING_FINALIZED',playerId:'fool',committed:true}]);
 assert.equal(f.length,1);assert.equal(f[0].conclusion,'CONDITION_MET_PENDING_END_OF_CHAIN');
 assert.equal(f[0].predicateId,'WV_CHAR_28_HANGED_WIN');
 assert.deepEqual(evaluateVerifiedVictoryFacts({...base,completed:true},[{type:'HANGING_FINALIZED',playerId:'fool',committed:true}]),[]);
});
test('S05-V02 no faction auto-win; #97 hibernating and pending villager revival count for faction',()=>{
 assert.equal(countsTowardFaction(base,'seeded'),true);
 assert.equal(countsTowardFaction(base,'revive'),true);
 assert.equal(countsTowardFaction(base,'deadwolf'),false);
 assert.equal(countsTowardFaction(base,'unknown'),false);
 assert.deepEqual(evaluateVerifiedVictoryFacts(base,[{type:'HANGING_FINALIZED',playerId:'villager',committed:true}]),[]);
});
