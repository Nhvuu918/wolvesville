import test from 'node:test';
import assert from 'node:assert/strict';
import {SkillResultRegistry,projectSkillFeedback} from '../dist/backend/src/feedback/projector.js';
const id='game-001', viewer='player-001', stranger='other-002';
const action={actionId:'act1',playerId:viewer,skillId:'official.25.inspect-role',status:'ACCEPTED'};
const observed={seq:8,eventType:'ROLE_OBSERVED',targetId:stranger,payload:{actionId:'act1',characterId:74,secretSeed:'NEVER_LEAK'}};
const args={gameId:id,viewerId:viewer,ruleVersion:'v1.3.1',revision:3,actions:[action],visibleEvents:[observed]};

test('03 feedback projector never leaks information while status is ACCEPTED',{timeout:5000},()=>{
 const fb=projectSkillFeedback(args);assert.equal(fb.items.length,1);
 assert.equal(fb.items[0].resolutionStatus,'PENDING_RESOLUTION');assert.equal(fb.items[0].resultPayload,null);
 assert.equal(fb.items[0].resultType,'NONE');assert.equal(fb.items[0].eventSequence,null);
 assert.deepEqual(fb.items[0].audience,[viewer]);
});

test('03 feedback projector uses explicit event allowlist and strips unapproved payload fields',()=>{
 const fb=projectSkillFeedback({...args,revision:5,actions:[{...action,status:'RESOLVED'}]});
 const item=fb.items[0];assert.equal(item.resolutionStatus,'RESOLVED');assert.equal(item.resultType,'ROLE_INFORMATION');
 assert.deepEqual(item.resultPayload,{characterId:74,targetId:stranger});assert.equal(item.eventSequence,8);
 assert.equal(JSON.stringify(fb).includes('secretSeed'),false);
});

test('03 canceled actions do not show result even if a stale authorized event exists',()=>{
 const fb=projectSkillFeedback({...args,actions:[{...action,status:'CANCELLED'}]});
 assert.equal(fb.items[0].resolutionStatus,'CANCELLED');assert.equal(fb.items[0].resultPayload,null);
});

test('03 unknown result/event types are never exposed by default',()=>{
 const fb=projectSkillFeedback({...args,actions:[{...action,status:'RESOLVED'}],visibleEvents:[{seq:3,eventType:'UNKNOWN_PRIVATE',payload:{actionId:'act1',secret:'invisible'}}]});
 assert.equal(fb.items[0].resultType,'NONE');assert.equal(fb.items[0].resultPayload,null);
});

test('03 projector excludes actions not owned by the viewer and accepts explicit future result types',()=>{
 const own=projectSkillFeedback({...args,actions:[{...action,playerId:stranger} ]});assert.deepEqual(own.items,[]);
 const registry=new SkillResultRegistry().register('ALLOWED_TEST_RESULT',()=>({resultType:'UNSUPPORTED_RESULT_TYPE',payload:{reason:'test-only'}}));
 assert.throws(()=>registry.register('ALLOWED_TEST_RESULT',()=>null),/DUPLICATE/);
 const projected=projectSkillFeedback({...args,registry,actions:[{...action,status:'RESOLVED'}],visibleEvents:[{seq:4,eventType:'ALLOWED_TEST_RESULT',payload:{actionId:'act1'}}]});
 assert.equal(projected.items[0].resultType,'UNSUPPORTED_RESULT_TYPE');
});
