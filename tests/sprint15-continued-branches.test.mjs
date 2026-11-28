import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {withKernel} from '../dist/backend/src/game/archive.js';
const old=process.env.WV_ARCHIVED_RULE_REGRESSION;delete process.env.WV_ARCHIVED_RULE_REGRESSION;
const ids=['knight','aura','mystic'],roles=[8,25,74],choices=[null,'',...ids];
function run(work){return withKernel(undefined,false,(e,r)=>{const gameId=randomUUID();e.createGame('three-humans',ids.map((playerId,i)=>({playerId,characterId:roles[i]})),{gameId,seed:'three-human-branch-proof'});e.transition(gameId,'ROLE_ASSIGNED');e.transition(gameId,'NIGHT_COLLECT');work(e,gameId,r);return {gameId};},true);}
function night(e,g){e.transition(g,'NIGHT_RESOLVE');e.resolve(g);e.transition(g,'NIGHT_FINALIZE');const v=e.completeVerifiedKnightSolo(g);if(!v.completed&&v.resolutionStatus==='CONTINUE')e.transition(g,'DAY_DISCUSS');}
function vote(e,g,players,targets){e.openVoting(g);for(let i=0;i<players.length;i++){if(targets[i]===null)continue;const key=randomUUID();e.submitVoteIntent(g,players[i],targets[i],key,key,e.getInternalState(g).revision);}e.closeVoting(g);}
function verifyBallots(e,g,players,targets){const counts=players.map(p=>targets.filter(t=>t===p).length),max=Math.max(...counts),leaders=players.filter((p,i)=>counts[i]===max),s=e.getInternalState(g);if(max===0||leaders.length>1){assert.equal(s.phase,'NIGHT_COLLECT');assert.equal(s.completed,false);return;}const victim=leaders[0];assert.equal(s.participants.find(p=>p.playerId===victim).life,'DEAD_FINAL');if(victim==='knight'){assert.equal(s.completed,true);assert.deepEqual(new Set(s.winnerIds),new Set(['aura','mystic']));}else if(players.length===2){assert.equal(s.completed,true);assert.deepEqual(s.winnerIds,['knight']);}else{assert.equal(s.phase,'NIGHT_COLLECT');assert.equal(s.completed,false);}}
function submit(e,g,actor,role,target){const key=randomUUID(),s=e.getInternalState(g);e.submit({actionId:key,idempotencyKey:key,gameId:g,playerId:actor,skillId:role===8?'official.8.night-kill':`official.${role}.inspect-role`,targetIds:[target],phase:s.phase,round:s.round,timestamp:1,payload:{},ruleVersion:s.ruleVersion});}
test('Three-player current-rule kernel: all 125 first ballot combinations and 32 two-survivor combinations',()=>{
 let n=0;for(const x of choices)for(const y of choices)for(const z of choices){const k=run((e,g)=>{night(e,g);vote(e,g,ids,[x,y,z]);verifyBallots(e,g,ids,[x,y,z]);});assert(k.replay.verified);n++;}
 for(const victim of ['aura','mystic']){const alive=ids.filter(p=>p!==victim),opts=[null,'',...alive];for(const x of opts)for(const y of opts){const k=run((e,g)=>{submit(e,g,'knight',8,victim);night(e,g);vote(e,g,alive,[x,y]);verifyBallots(e,g,alive,[x,y]);});assert(k.replay.verified);n++;}}
 assert.equal(n,157);console.log('CONTINUED_KERNEL_BALLOTS '+n);
});
test('Three-player current-rule kernel: all 27 night choices in both submission orders and remaining night kill',()=>{
 let n=0;for(const a of [null,'knight','mystic'])for(const m of [null,'knight','aura'])for(const k of [null,'aura','mystic'])for(const reverse of [false,true]){const r=run((e,g,repo)=>{let acts=[['aura',25,a],['mystic',74,m],['knight',8,k]];if(reverse)acts.reverse();for(const [p,role,t] of acts)if(t)submit(e,g,p,role,t);night(e,g);let s=e.getInternalState(g);assert.equal(s.phase,'DAY_DISCUSS');assert.equal(s.participants.filter(p=>p.life==='DEAD_FINAL').length,Number(!!k));const es=repo.events(g);assert.equal(es.filter(e=>e.eventType==='SEER_AURA_OBSERVED'&&e.recipientId==='aura').length,Number(!!a));assert.equal(es.filter(e=>e.eventType==='ROLE_OBSERVED'&&e.recipientId==='mystic').length,Number(!!m));if(k){vote(e,g,ids.filter(p=>p!==k),[null,null]);submit(e,g,'knight',8,k==='aura'?'mystic':'aura');night(e,g);s=e.getInternalState(g);assert(s.completed);assert.deepEqual(s.winnerIds,['knight']);}});assert(r.replay.verified);n++;}assert.equal(n,54);console.log('CONTINUED_KERNEL_NIGHTS '+n);
});

// Independent additional ordering proof: all six orders with all three skills submitted.
test('Growth dual-seer: all six submission permutations for every legal complete night choice',()=>{
 const orders=[[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];let n=0;
 for(const a of ['knight','mystic'])for(const m of ['knight','aura'])for(const k of ['aura','mystic'])for(const order of orders){
  const r=run((e,g,repo)=>{const acts=[['aura',25,a],['mystic',74,m],['knight',8,k]];for(const i of order)submit(e,g,...acts[i]);night(e,g);const s=e.getInternalState(g);assert.equal(s.phase,'DAY_DISCUSS');assert.equal(s.participants.find(p=>p.playerId===k).life,'DEAD_FINAL');const es=repo.events(g);assert.equal(es.filter(x=>x.eventType==='SEER_AURA_OBSERVED'&&x.recipientId==='aura').length,1);assert.equal(es.filter(x=>x.eventType==='ROLE_OBSERVED'&&x.recipientId==='mystic').length,1);});assert(r.replay.verified);n++;
 }assert.equal(n,48);console.log('GROWTH_NIGHT_PERMUTATIONS '+n);
});
