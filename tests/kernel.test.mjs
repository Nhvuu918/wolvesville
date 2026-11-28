import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {SqliteRepository} from '../dist/backend/src/persistence/sqlite.js';
import {EngineService} from '../dist/backend/src/engine/service.js';
import {RuleRegistry} from '../dist/backend/src/engine/rules.js';
import {createFixtureRegistry} from '../dist/backend/src/fixtures/test-adapters.js';
import {draw,verifyDraw} from '../dist/backend/src/engine/rng.js';
import {KernelError} from '../dist/backend/src/common/errors.js';
import {RULESET_VERSION} from '../dist/shared/contracts/index.js';
import {createHash} from 'node:crypto';
const root=process.cwd();
const characterFile=join(root,'data/character.json');
const key=()=>({p1:1,p2:2,p3:3});
const people=[{playerId:'p1',characterId:1,resources:{energy:2}},{playerId:'p2',characterId:2},{playerId:'p3',characterId:3}];
const createHarness=(opt={})=>{
  const repo=new SqliteRepository(opt.path??':memory:');
  const registry=opt.registry??createFixtureRegistry();
  const svc=new EngineService(repo,registry,characterFile,opt.fixtures??true);
  const state=opt.existing?svc.getInternalState(opt.existing):svc.createGame('room-1',people,{seed:'TEST-REPRODUCIBLE-SEED',gameId:opt.gameId??'game-123'});
  return {repo,registry,svc,state,close:()=>repo.close()};
};
const night=(h)=>{h.svc.transition(h.state.gameId,'ROLE_ASSIGNED');h.svc.transition(h.state.gameId,'NIGHT_COLLECT');};
const action=(h,n,who='p1',skill='fixture.damage',targets=['p2'],payload={})=>({
  actionId:`action-${n}`,gameId:h.state.gameId,playerId:who,skillId:skill,targetIds:targets,
  phase:h.svc.getInternalState(h.state.gameId).phase,round:1,timestamp:1,payload,
  idempotencyKey:`key-${n}`,ruleVersion:RULESET_VERSION,
});
const eqError=(code)=>(e)=>e instanceof KernelError&&e.code===code;

test('source: 97 unique roles unchanged; 118 decision registry, 207 separate legacy specs',()=>{
  const bytes=readFileSync(characterFile),roles=JSON.parse(bytes);
  assert.equal(roles.length,97);assert.equal(new Set(roles.map(x=>x.id)).size,97);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3');
  assert.equal(JSON.parse(readFileSync(join(root,'data/rules/official_merged_118.json'))).length,118);
  assert.equal(JSON.parse(readFileSync(join(root,'data/rules/tests_207.json'))).length,207);
});

test('state machine rejects invalid transitions, advances round only after day',()=>{
  const h=createHarness();try{
    assert.throws(()=>h.svc.transition(h.state.gameId,'DAY_RESOLVE'),eqError('INVALID_TRANSITION'));
    night(h);
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');h.svc.transition(h.state.gameId,'NIGHT_FINALIZE');
    h.svc.transition(h.state.gameId,'DAY_DISCUSS');h.svc.transition(h.state.gameId,'DAY_RESOLVE');
    const s=h.svc.transition(h.state.gameId,'NIGHT_COLLECT');assert.equal(s.round,2);
    assert.throws(()=>h.svc.transition(h.state.gameId,'GAME_COMPLETED'),eqError('INVALID_TRANSITION'));
    assert.equal(h.svc.replay(h.state.gameId).verified,true);
  }finally{h.close();}
});

test('rejects duplicated/unknown initial character IDs; allows 1 human and rejects >97 unique slots',()=>{
  const h=createHarness();try{
    assert.throws(()=>h.svc.createGame('x',[{playerId:'x',characterId:1},{playerId:'y',characterId:1}]),eqError('INVALID_ARGUMENT'));
    assert.throws(()=>h.svc.createGame('x',[{playerId:'x',characterId:999}]),eqError('INVALID_ARGUMENT'));
    assert.equal(h.svc.createGame('x',[{playerId:'bot:1',characterId:5}]).participants.length,1);
    assert.throws(()=>h.svc.createGame('x',Array.from({length:98},(_,i)=>({playerId:'p'+i,characterId:i+1}))),eqError('INVALID_ARGUMENT'));
  }finally{h.close();}
});

test('validator rejects phase mismatch, non-member, forbidden target, exhausted resources',()=>{
  const h=createHarness();try{night(h);
    assert.throws(()=>h.svc.submit({...action(h,'1'),playerId:'intruder'}),eqError('UNAUTHORIZED'));
    assert.throws(()=>h.svc.submit({...action(h,'1'),round:2}),eqError('OUT_OF_PHASE'));
    assert.throws(()=>h.svc.submit({...action(h,'1'),targetIds:['p1']}),eqError('TARGET_INVALID'));
    h.svc.submit(action(h,'2','p1','fixture.charge'));
    h.svc.submit(action(h,'3','p1','fixture.charge'));
    assert.throws(()=>h.svc.submit(action(h,'4','p1','fixture.charge')),eqError('RESOURCE_INSUFFICIENT'));
    assert.equal(h.repo.queued(h.state.gameId).length,2);
  }finally{h.close();}
});

test('idempotency: same action retry is no-op, conflicting payload is rejected',()=>{
  const h=createHarness();try{night(h);const a=action(h,'same');
    assert.equal(h.svc.submit(a).duplicate,false);
    const after=h.svc.getInternalState(h.state.gameId).revision;
    assert.equal(h.svc.submit(a).duplicate,true);
    assert.equal(h.svc.getInternalState(h.state.gameId).revision,after);
    assert.throws(()=>h.svc.submit({...a,targetIds:['p3']}),eqError('IDEMPOTENCY_CONFLICT'));
    assert.equal(h.repo.queued(h.state.gameId).length,1);
  }finally{h.close();}
});

test('permission: production registry refuses unregistered role skills and opt-in fixtures',()=>{
  const h=createHarness({registry:new RuleRegistry(),fixtures:false});try{night(h);
    assert.throws(()=>h.svc.submit(action(h,'unknown','p1','real.skill')),eqError('RULE_UNRESOLVED'));
    assert.equal(h.repo.queued(h.state.gameId).length,0);
  }finally{h.close();}
  const h2=createHarness({gameId:'g-prod-fixture',fixtures:false});try{night(h2);
    assert.throws(()=>h2.svc.submit(action(h2,'x','p1','fixture.damage')),eqError('RULE_UNRESOLVED'));
  }finally{h2.close();}
});

test('queued actions do not resolve before phase close and priority beats request order',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'damage','p1','fixture.damage',['p2']));
    h.svc.submit(action(h,'guard','p3','fixture.protect',['p2']));
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('OUT_OF_PHASE'));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    assert.equal(h.svc.resolve(h.state.gameId).resolved,2);
    const s=h.svc.getInternalState(h.state.gameId);
    assert.equal(s.participants[1].life,'ALIVE');
    assert.equal(s.participants[1].resources['fixture:protection'],0);
    assert.equal(h.svc.replay(h.state.gameId).verified,true);
  }finally{h.close();}
});

test('PH-01: submitted action still runs after sender dies, unless locked',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'hit','p2','fixture.damage',['p1']));
    h.svc.submit(action(h,'finish','p2','fixture.finalize',['p1']));
    h.svc.submit(action(h,'late','p1','fixture.late',['p3']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    assert.equal(h.svc.resolve(h.state.gameId).resolved,3);
    const s=h.svc.getInternalState(h.state.gameId);
    assert.equal(s.participants[0].life,'DEAD_FINAL');
    assert.equal(s.participants[2].effects.some(e=>e.kind==='fixture:late-executed'),true);
  }finally{h.close();}
});

test('VH10/VH41-like fixture: valid lock cancels accepted action without charging resources',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'charge','p1','fixture.charge',['p3']));
    h.svc.submit(action(h,'block','p2','fixture.block',['p1'],{skill:'fixture.charge'}));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    assert.deepEqual({resolved:h.svc.resolve(h.state.gameId).resolved, energy:h.svc.getInternalState(h.state.gameId).participants[0].resources.energy},{resolved:1,energy:2});
    assert.equal(h.repo.queued(h.state.gameId).length,0);
    assert.equal(h.svc.replay(h.state.gameId).verified,true);
  }finally{h.close();}
});

test('atomic rollback on adapter throw: no half state or events or charges committed',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'charge','p1','fixture.charge',['p3']));
    h.svc.submit(action(h,'throw','p2','fixture.throw',['p3']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const before=h.svc.getInternalState(h.state.gameId);
    const eventsBefore=h.repo.events(h.state.gameId).length;
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
    assert.equal(h.repo.events(h.state.gameId).length,eventsBefore);
    assert.equal(h.repo.queued(h.state.gameId).length,2);
  }finally{h.close();}
});

test('unknown adapter at resolution leaves accepted action queued and state untouched',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'late','p1','fixture.late',['p3']));
    h.registry.unregister('fixture.late');
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const before=h.svc.getInternalState(h.state.gameId);
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
  }finally{h.close();}
});

test('RNG: deterministic, conditioned domain, empty domain fail-closed, event tape replay',()=>{
  const r1=draw('seed','match',0,['p3','p2'],'test','corr');
  const r2=draw('seed','match',0,['p2','p3'],'test','corr');
  assert.deepEqual(r1,r2);assert.equal(verifyDraw('seed','match',r1),true);
  assert.throws(()=>draw('seed','match',1,[],'test','corr'),eqError('RULE_UNRESOLVED'));
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'random','p1','fixture.random',['p3','p2']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    assert.equal(h.svc.resolve(h.state.gameId).randomDraws,1);
    assert.equal(h.repo.draws(h.state.gameId).length,1);
    assert.equal(h.svc.replay(h.state.gameId).draws,1);
    assert.equal(h.repo.draws(h.state.gameId)[0].domain.join(','),'p2,p3');
  }finally{h.close();}
});

test('RNG empty at effect stage triggers full rollback, no random fallback',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'charge','p1','fixture.charge',['p3']));
    h.svc.submit(action(h,'empty','p2','fixture.random-empty',['p3']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const before=h.svc.getInternalState(h.state.gameId);
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
    assert.equal(h.repo.draws(h.state.gameId).length,0);
  }finally{h.close();}
});

test('ACL: player projections omit hidden roles, seed, other resources and internal events',()=>{
  const h=createHarness();try{night(h);
    const shown=h.svc.project(h.state.gameId,'p1');
    assert.equal('seed' in shown,false);
    assert.equal('initialCharacterId' in shown.players[1],false);
    assert.equal(shown.players[0].self.initialCharacterId,1);
    assert.throws(()=>h.svc.project(h.state.gameId,'intruder'),eqError('UNAUTHORIZED'));
    h.svc.submit(action(h,'secret','p1','fixture.private',['p2']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');h.svc.resolve(h.state.gameId);
    const eventsA=h.svc.projectVisibleEvents(h.state.gameId,'p1');
    const eventsB=h.svc.projectVisibleEvents(h.state.gameId,'p2');
    assert.equal(eventsA.some(e=>e.eventType==='PRIVATE_INFORMATION'),true);
    assert.equal(eventsB.some(e=>e.eventType==='PRIVATE_INFORMATION'),false);
    for(const e of eventsB)assert.notEqual(e.eventType,'STATE_COMMITTED');
    assert.equal(JSON.stringify(eventsB).includes('TEST-REPRODUCIBLE-SEED'),false);
  }finally{h.close();}
});

test('snapshot + replay survives SQLite restart',()=>{
  const dir=mkdtempSync(join(tmpdir(),'wv-kernel-'));const dbPath=join(dir,'game.sqlite');
  try{
    let h=createHarness({path:dbPath,gameId:'persisted-game'});night(h);
    h.svc.submit(action(h,'p','p1','fixture.protect',['p2']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');h.svc.resolve(h.state.gameId);
    const before=h.svc.getInternalState(h.state.gameId);h.close();
    h=createHarness({path:dbPath,existing:'persisted-game'});
    assert.deepEqual(h.svc.replay('persisted-game').state,before);
    assert.ok(h.repo.snapshots('persisted-game').length>=3);h.close();
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('replay detects tampered event even when persisted state remains unchanged',()=>{
  const dir=mkdtempSync(join(tmpdir(),'wv-tamper-'));const file=join(dir,'db.sqlite');
  try{
    let h=createHarness({path:file,gameId:'tamper-game'});night(h);h.close();
    const db=new DatabaseSync(file);db.exec("UPDATE events SET event_json='{}' WHERE seq=1");db.close();
    h=createHarness({path:file,existing:'tamper-game'});
    assert.throws(()=>h.svc.replay('tamper-game'));
    h.close();
  }finally{rmSync(dir,{recursive:true,force:true});}
});

test('unimplemented domain effect fails closed without partial state write',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'domain','p1','fixture.unsupported-effect',['p2']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const before=h.svc.getInternalState(h.state.gameId);
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
  }finally{h.close();}
});

test('admission seals phase and historical ruleVersion mismatch cannot be accepted',()=>{
  const h=createHarness();try{night(h);const a=action(h,'x');
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    assert.throws(()=>h.svc.submit(a),eqError('OUT_OF_PHASE'));
    assert.throws(()=>h.svc.submit({...a,ruleVersion:'unapproved-v2'}),eqError('INVALID_ARGUMENT'));
  }finally{h.close();}
});

test('revalidation: target dead before accepted hit is resolved fails closed and rolls back whole batch',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'hit','p1','fixture.damage',['p2']));
    h.svc.submit(action(h,'again','p3','fixture.damage',['p2']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const before=h.svc.getInternalState(h.state.gameId);
    assert.throws(()=>h.svc.resolve(h.state.gameId),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
  }finally{h.close();}
});

test('resource ledger: successful resolved fixture spends one charge and does not double-spend on retry',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'cost','p1','fixture.charge',['p3']));
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    const result=h.svc.resolve(h.state.gameId);
    assert.equal(result.resolved,1);
    assert.equal(h.svc.getInternalState(h.state.gameId).participants[0].resources.energy,1);
    const rev=h.svc.getInternalState(h.state.gameId).revision;
    assert.equal(h.svc.resolve(h.state.gameId).resolved,0);
    assert.equal(h.svc.getInternalState(h.state.gameId).revision,rev);
    assert.equal(h.svc.replay(h.state.gameId).verified,true);
  }finally{h.close();}
});

test('faction/group event cannot leak to a later joiner when historical audience is missing',async()=>{
  const h=createHarness();try{
    const s=h.svc.getInternalState(h.state.gameId);
    const {canReadEvent}=await import('../dist/backend/src/engine/visibility.js');
    const evt={visibility:'FACTION_RESTRICTED',faction:s.participants[0].currentFaction};
    assert.equal(canReadEvent(s,evt,{viewerId:'p1'}),false);
    assert.equal(canReadEvent(s,{...evt,audience:['p2']},{viewerId:'p1'}),false);
    assert.equal(canReadEvent(s,{...evt,audience:['p2']},{viewerId:'p2'}),true);
  }finally{h.close();}
});

test('replay converges to same final state when unrelated commands arrive in opposite request order',()=>{
  function run(order){const h=createHarness();try{night(h);
    const intents=[action(h,'a','p1','fixture.protect',['p3']),action(h,'b','p2','fixture.private',['p3'])];
    for(const i of order)h.svc.submit(intents[i]);
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');h.svc.resolve(h.state.gameId);
    const s=h.svc.replay(h.state.gameId).state;
    return {...s,revision:0};
  }finally{h.close();}}
  assert.deepEqual(run([0,1]),run([1,0]));
});

test('new idempotency key cannot reuse same actionId; payload must be a dictionary',()=>{
  const h=createHarness();try{night(h);
    h.svc.submit(action(h,'same','p1','fixture.damage',['p2']));
    const reuse={...action(h,'same','p1','fixture.damage',['p2']),idempotencyKey:'different-key'};
    assert.throws(()=>h.svc.submit(reuse),eqError('IDEMPOTENCY_CONFLICT'));
    assert.throws(()=>h.svc.submit({...action(h,'bad'),payload:null}),eqError('INVALID_ARGUMENT'));
  }finally{h.close();}
});

test('complete match is blocked until confirmed victory predicates exist',()=>{
  const h=createHarness();try{night(h);
    h.svc.transition(h.state.gameId,'NIGHT_RESOLVE');
    h.svc.transition(h.state.gameId,'NIGHT_FINALIZE');
    const before=h.svc.getInternalState(h.state.gameId);
    assert.throws(()=>h.svc.transition(h.state.gameId,'GAME_COMPLETED'),eqError('RULE_UNRESOLVED'));
    assert.deepEqual(h.svc.getInternalState(h.state.gameId),before);
  }finally{h.close();}
});
