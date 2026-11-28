import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {grantCommittedCultChat} from '../dist/backend/src/official/group-chat.js';
import {seedState,roles} from './fixtures/s24-group-archive.mjs';
import {APPROVED_RULESET_VERSION} from '../dist/shared/contracts/index.js';
// node --test uses process isolation per test file by default. These active-only
// ACL tests must not inherit the archive mode of the monolithic invocation.
delete process.env.WV_ARCHIVED_RULE_REGRESSION;
const source=readFileSync('frontend/player-ux.js','utf8');
test('S25 visual: transition uses authorized committed projection, no secret payload or fabricated winner',()=>{
 const nodes=new Map(),document={addEventListener(){},body:{append(e){nodes.set(e.id,e)},classList:{toggle(){}}},getElementById:id=>nodes.get(id),createElement(){return {dataset:{},classList:{add(){}},setAttribute(){},remove(){nodes.delete(this.id)}}}};
 const context={window:{matchMedia:()=>({matches:false})},document,setTimeout:()=>1,clearTimeout(){},localStorage:{getItem(){return null},setItem(){}}};runInNewContext(source,context);
 const ui=context.window.WolvesVisual,base={gameId:'g',phase:'NIGHT_COLLECT',round:1,players:[{playerId:'a',self:{currentCharacterId:25}},{playerId:'b'}],completed:false};
 assert.equal(ui.describeTransition(null,base,'b'),null);assert.equal(ui.describeTransition(null,base,'a').kind,'role');assert.equal(ui.describeTransition(base,base,'a'),null);
 const day={...base,phase:'DAY_DISCUSS'};ui.snapshot(null,base,'a',false);assert.equal(nodes.size,0);ui.snapshot(base,day,'a',true);assert.equal(nodes.get('wv-visual-toast').textContent,'Bình minh · Ngày 1');
 ui.snapshot(day,day,'a',false);assert.equal(nodes.size,0);const e={eventId:'e',eventType:'ROLE_OBSERVED',payload:{characterId:90,secret:'do not display'}};
 ui.events('g',[],[e],false);ui.events('g',[e],[e],true);assert.equal(nodes.size,0);
 ui.events('g',[e],[e,{...e,eventId:'e2'}],true);assert.equal(nodes.get('wv-visual-toast').textContent,'Có kết quả điều tra riêng');ui.clear();ui.events('g',[e],[e,{...e,eventId:'e2'}],true);assert.equal(nodes.size,0);
 const end={...day,completed:true,winnerIds:['b']};assert.equal(ui.describeTransition(day,end,'a').kind,'end');
});
test('S25 graphics: 97 illustrated portraits exist, immutable old paths remain available, no active SVG or remote links',()=>{
 const chars=JSON.parse(readFileSync('data/character.json','utf8'));assert.equal(chars.length,97);
 for(const c of chars){assert.ok(existsSync(`frontend/assets/portraits/${c.id}.svg`));const v=readFileSync(`frontend/assets/illustrated/${c.id}.svg`,'utf8');assert.match(v,/^<svg\b/);assert.doesNotMatch(v,/<(?:script|foreignObject|iframe|image)\b|\bon\w+\s*=|@import|<!DOCTYPE|<!ENTITY|(?:xlink:)?href\s*=\s*["'](?!#)/i);assert.doesNotMatch(v,/<style\b/i);}
});
test('S25 cult grant boundary: Q13-08 and wolf rejection before group mutation',()=>{
 const f=seedState('r',roles.map(r=>({playerId:`role-${r}`,characterId:r})),'g','seed-1234567890');const s=f.s;assert.equal(s.ruleVersion,APPROVED_RULESET_VERSION);s.phase='NIGHT_RESOLVE';const target=s.participants.find(p=>p.playerId===f.outsider);target.winLinks=['independent-win'];let before=structuredClone(s.systemChatGroups);assert.throws(()=>grantCommittedCultChat(s,f.owner,f.outsider,'new-recruit-attempt'),/Recruitment grant unavailable/);assert.deepEqual(s.systemChatGroups,before);target.winLinks=[];target.currentFaction='soi';assert.throws(()=>grantCommittedCultChat(s,f.owner,f.outsider,'new-recruit-attempt'),/Recruitment grant unavailable/);assert.deepEqual(s.systemChatGroups,before);target.currentFaction='dan';grantCommittedCultChat(s,f.owner,f.outsider,'new-recruit-attempt');assert.equal(s.systemChatGroups[0].memberIds.length,3);
});

test('S26 cult grant: five living followers, duplicate and pre-mutation capacity boundary',()=>{
 const ids=[25,28,74,84,90,31,9,26];const f=seedState('r',ids.map(r=>({playerId:`role-${r}`,characterId:r})),'g','seed-1234567890');const s=f.s;s.phase='NIGHT_RESOLVE';
 for(const id of [74,84,31,9])grantCommittedCultChat(s,f.owner,`role-${id}`,`recruit-${id}-test`);assert.equal(s.systemChatGroups[0].memberIds.length,6);const before=structuredClone(s.systemChatGroups);
 grantCommittedCultChat(s,f.owner,'role-74','recruit-74-test');assert.deepEqual(s.systemChatGroups,before);assert.throws(()=>grantCommittedCultChat(s,f.owner,'role-26','recruit-26-test'),/Recruitment grant unavailable/);assert.deepEqual(s.systemChatGroups,before);
 s.participants.find(p=>p.playerId==='role-74').life='DEAD_FINAL';grantCommittedCultChat(s,f.owner,'role-26','recruit-26-test');assert.equal(s.systemChatGroups[0].memberIds.length,7);assert.equal(s.systemChatGroups[0].memberIds.filter(id=>id!==f.owner&&s.participants.find(p=>p.playerId===id).life==='ALIVE').length,5);
});
