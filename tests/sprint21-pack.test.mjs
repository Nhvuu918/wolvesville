import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {openPack,submitPack,lockPack,ownPack,PROFILE} from '../dist/backend/src/experimental/owner-bb-v2/pack.js';
import {openTraps,placeTrap,resolveTrapGroup,projectTrapOutcome} from '../dist/backend/src/experimental/owner-bb-v2/trap.js';
import {commitCandidatePack,commitCandidateTrapGroup} from '../dist/backend/src/experimental/owner-bb-v2/runtime.js';
import {OwnerBBV2Journal} from '../dist/backend/src/experimental/owner-bb-v2/journal.js';
import {OwnerBBJournal} from '../dist/backend/src/experimental/owner-bb/journal.js';
import {hasClosedDeathLedger} from '../dist/backend/src/official/stable-death-proof.js';
const ruleVersion='wolvesville-official-v1.3.3';
const roster=[['w1',10,'soi'],['w2',48,'soi'],['w3',76,'soi'],['a',25,'dan'],['b',74,'dan'],['g',31,'dan'],['snow',9,'dan'],['trap',77,'dan'],['judge',5,'dan']];
function state(round=1,phase='NIGHT_COLLECT',extra=[]){return {gameId:'bb-v2',roomId:'room',ruleVersion,characterHash:'test-hash',seed:'test-bb-v2-seed',revision:round*10,round,phase,participants:[...roster,...extra].map(([playerId,initialCharacterId,initialFaction])=>({playerId,initialCharacterId,currentCharacterId:initialCharacterId,initialFaction,currentFaction:initialFaction,life:'ALIVE',publicReportedDead:false,resources:{},effects:[],skillLocks:[],winLinks:[],groupIds:[]})),links:[],effects:[],randomCursor:0,completed:false,winnerIds:[]};}
const person=(s,id)=>s.participants.find(p=>p.playerId===id);
const context=(s=state(),wolves=['w1','w2','w3'],maxTargets=2)=>({state:s,entitlement:{wolfIds:wolves,targetIds:s.participants.filter(p=>p.currentFaction!=='soi'&&p.life==='ALIVE').map(p=>p.playerId),maxTargets,representativeId:['w2','w1','w3','a'].find(x=>wolves.includes(x))??null,representativeOrder:['w2','w1','w3','a']}});
const submit=(p,c,id,targets,key=`key-${id}-000-${p.revision}`)=>submitPack(p,c,id,{key,expectedRevision:p.revision,targets}).state;
function votes(choices,c=context()){let p=openPack(c);choices.forEach((targets,i)=>{if(targets!==null)p=submit(p,c,c.entitlement.wolfIds[i],targets);});return p;}
const resolving=s=>({...structuredClone(s),phase:'NIGHT_RESOLVE'});
const action=(s,id,skill,target,key)=>({gameId:s.gameId,ruleVersion:s.ruleVersion,round:s.round,phase:s.phase==='NIGHT_RESOLVE'?'NIGHT_COLLECT':s.phase,playerId:id,skillId:skill,targetIds:[target],actionId:key,timestamp:s.round*100,payload:{},idempotencyKey:key});
const info=(id,target,value)=>({type:'INFORMATION_RESULT',targetId:target,recipientId:id,value,visibility:'PLAYER_PRIVATE'});
const r=(s,id,skill,target,key,effects,status='EXECUTED')=>({state:s,action:action(s,id,skill,target,key),effects,status});
const mark=(s,id)=>placeTrap(openTraps(s),s,action(s,'w1','official.10.trap',id,'mark-001'));
function lab(fn){const old=process.env.WV_OWNER_BB_LAB;process.env.WV_OWNER_BB_LAB='1';const dir=mkdtempSync(join(tmpdir(),'bb-v2-'));try{return fn(join(dir,'test.sqlite'));}finally{rmSync(dir,{recursive:true,force:true});if(old===undefined)delete process.env.WV_OWNER_BB_LAB;else process.env.WV_OWNER_BB_LAB=old;}}

test('S21 PACK KEEP: revoke invalid two-target selection while author temporarily ineligible; never resurrect it',()=>{
 const c=context();c.state.qaOwnerDecisionPolicy='WV-DC-2026-11-25-A-S21';let p=votes([['a','b'],['a','b'],['a','b']],c);
 const s=structuredClone(c.state);person(s,'a').life='DEAD_FINAL';person(s,'a').publicReportedDead=true;s.revision++;const d=context(s,['w2','w3']);
 p=lockPack(p,d,p.revision);assert(!p.locked);assert.equal(p.revokedSelections.length,3);p=JSON.parse(JSON.stringify(p));
 person(s,'a').life='ALIVE';person(s,'a').publicReportedDead=false;s.revision++;const e=context(s);p=submit(p,e,'w1',[]);p=submit(p,e,'w2',['a','b']);p=submit(p,e,'w3',['a','b']);p=lockPack(p,e,p.revision);assert(!p.locked);assert.equal(p.result.kind,'WAITING_FOR_RESPONSES');
 p=submit(p,e,'w1',['a','b']);p=lockPack(p,e,p.revision);assert(p.locked);assert.deepEqual(p.result.candidateAttacks.map(x=>[x.sourceId,x.targetId]),[['w2','a'],['w2','b']]);
});
test('S21 PACK KEEP privacy counterexample: two identical receipts but unavoidable distinct lock outcomes',()=>{
 const c=context();c.state.qaOwnerDecisionPolicy='WV-DC-2026-11-25-A-S21';c.blindTargetIntake=true;const p=votes([['a','b'],['a','b'],['a','b']],c);
 const s=structuredClone(c.state);person(s,'a').currentFaction='soi';s.revision++;const d={...context(s),blindTargetIntake:true};
 assert.deepEqual(ownPack(p,c,'w1'),ownPack(p,d,'w1'));
 const l1=lockPack(p,c,p.revision),l2=lockPack(p,d,p.revision);assert(l1.locked);assert(!l2.locked);assert.equal(l1.result.kind,'UNANIMOUS');assert.equal(l2.result.kind,'WAITING_FOR_RESPONSES');assert.equal(l2.result.candidateAttacks.length,0);
 // This test verifies the impossibility witness, NOT privacy acceptance.
 assert.notEqual(ownPack(l1,c,'w1').locked,ownPack(l2,d,'w1').locked);
});
