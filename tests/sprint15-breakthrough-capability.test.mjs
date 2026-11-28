import test from 'node:test';
import assert from 'node:assert/strict';
import {revivalDeckIds,revivalCapabilityReady} from '../dist/backend/src/official/revival-capability.js';
import {protectionSelection} from '../dist/backend/src/official/support-rules.js';
const person=r=>({playerId:String(r),initialCharacterId:r,currentCharacterId:r,initialFaction:r===8?'phe3':'dan',currentFaction:r===8?'phe3':'dan',life:'ALIVE',publicReportedDead:false,effects:[],winLinks:[]});
test('Breakthrough bounded revival capability accepts interchangeable read-only observers and rejects unsafe compositions',()=>{
 for(const ids of [[8,25,26],[74,8,26]])assert(revivalDeckIds(ids));
 for(const ids of [[8,26],[8,26,31],[8,26,25,74],[8,26,26],[8,26,53],[8,26,48]])assert(!revivalDeckIds(ids));
 const s={ruleVersion:'wolvesville-official-v1.3.3',links:[],participants:[8,26,74].map(person)};assert(revivalCapabilityReady(s));assert(!revivalCapabilityReady({...s,ruleVersion:'wolvesville-official-v1.3.2'}));assert(!revivalCapabilityReady({...s,links:[{}]}));assert(!revivalCapabilityReady({...s,participants:s.participants.map((p,i)=>i===0?{...p,currentFaction:'dan'}:p)}));
});
test('Breakthrough protection action contracts share actor history, preserve cooldown and do not disclose target role or shield',()=>{
 const a=person(31),b=person(25),c=person(74);const s={round:2,participants:[a,b,c]};a.effects.push({kind:'OFFICIAL_31_LAST_GUARD',expiresAtRound:1,payload:{targetId:b.playerId}});assert.deepEqual(protectionSelection(s,a.playerId,'official.31.guard').eligibleTargetIds,[a.playerId,c.playerId]);c.currentCharacterId=8;c.effects.push({kind:'SECRET_SHIELD'});assert.deepEqual(protectionSelection(s,a.playerId,'official.31.guard').eligibleTargetIds,[a.playerId,c.playerId]);s.round=3;assert.deepEqual(protectionSelection(s,a.playerId,'official.31.guard').eligibleTargetIds,[a.playerId,b.playerId,c.playerId]);
 const n=person(9),snow={round:3,participants:[n,b,c]};n.effects.push({kind:'OFFICIAL_9_USED_TARGET',payload:{targetId:b.playerId}});assert.deepEqual(protectionSelection(snow,n.playerId,'official.9.snow-protection'),{eligibleTargetIds:[n.playerId,c.playerId],remainingUses:2});b.publicReportedDead=true;c.publicReportedDead=true;assert.deepEqual(protectionSelection(snow,n.playerId,'official.9.snow-protection').eligibleTargetIds,[n.playerId]);
});
