import {LIFE_DEV_SCOPE,lifeDevelopmentComposition} from '../official/lifecycle-composition.js';
import {registerLife02,life02Enabled,composedLife02} from '../official/life02.js';
import {mirrorMixedIds,mirrorMixedEnabled} from '../official/mirror-investigation.js';
import {registerCult,cultEnabled} from '../official/cult-recruitment.js';
import {liveEnabled} from '../experimental/owner-bb-v2/live-profile.js';
import {invariant} from '../common/errors.js';
import {registerMediumRevival} from '../official/revival.js';
import {registerEngineerTrap} from '../official/engineer-trap.js';
/** SQLite Kernel as a transactional, portable binary archive. The archive is
 * stored atomically with lobby/game metadata in SQLite or PostgreSQL.
 * Transitional bridge until EngineRepository supports async PostgreSQL natively.
 * NEVER send archives, seed or internal event bodies to clients. */
import {mkdtempSync,rmSync,readFileSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EngineService} from '../engine/service.js';
import {SqliteRepository} from '../persistence/sqlite.js';
import {createFixtureRegistry} from '../fixtures/test-adapters.js';
import {RuleRegistry} from '../engine/rules.js';
import {registerOfficialInspection} from '../official/inspection-rules.js';
import {registerOfficialSupport} from '../official/support-rules.js';
import {registerOfficialPeace} from '../official/peace-rules.js';
import {registerOfficialKnight} from '../official/solo-rules.js';
import {registerOfficialVoteControl} from '../official/vote-control-rules.js';
import {registerOfficialJudgment} from '../official/judgment-rules.js';
import {registerOfficialNightmare} from '../official/nightmare-rules.js';
import {hash} from '../common/canonical.js';
import {registerS13Mechanics} from '../official/s13-mechanics.js';
import type {GameState,EngineEvent,RandomRecord} from '../../../shared/contracts/index.js';

export interface KernelResult<T>{value:T;archive:Buffer;state:GameState;initialStateHash:string;events:EngineEvent[];draws:RandomRecord[];actions:Array<{actionId:string;playerId:string;idempotencyKey:string;status:string}>;replay:{verified:boolean;events:number;draws:number}}
export function withKernel<T>(archive:Buffer|undefined, allowFixtures:boolean, work:(engine:EngineService,repo:SqliteRepository)=>T,officialInspection=false):KernelResult<T>{
 const dir=mkdtempSync(join(tmpdir(),'wv-kernel-'));const filename=join(dir,'game.sqlite');
 let repo:SqliteRepository|undefined;
 try{
  if(archive)writeFileSync(filename,archive,{mode:0o600});
  repo=new SqliteRepository(filename);
  const registry=allowFixtures?createFixtureRegistry():new RuleRegistry();
  if(officialInspection){registerOfficialInspection(registry);registerOfficialSupport(registry);registerOfficialPeace(registry);registerOfficialKnight(registry);registerOfficialVoteControl(registry);registerOfficialJudgment(registry);registerOfficialNightmare(registry);registerS13Mechanics(registry);registerEngineerTrap(registry);registerMediumRevival(registry);registerCult(registry);registerLife02(registry);}
  const engine=new EngineService(repo,registry,undefined,allowFixtures);
  if(archive){const id=repo.listGameIds()[0];if(id){const st=engine.getInternalState(id);invariant(!st.qaProfile||liveEnabled(),'RULE_UNRESOLVED','B/B QA profile disabled');invariant(!st.qaLife02Policy||life02Enabled()||st.life02DevelopmentScope===LIFE_DEV_SCOPE&&composedLife02(st)&&lifeDevelopmentComposition(st.participants.map(p=>p.initialCharacterId)),'RULE_UNRESOLVED','RC01 LIFE-02 QA disabled');invariant(!st.qaCultPolicy||cultEnabled(),'RULE_UNRESOLVED','Cult candidate disabled');invariant(!mirrorMixedIds(st.participants.map(p=>p.initialCharacterId))||mirrorMixedEnabled(),'RULE_UNRESOLVED','Mirror candidate disabled');}}
  const value=work(engine,repo);
  const gameId=(typeof value==='object'&&value&&'gameId' in value)?String((value as {gameId:string}).gameId):undefined;
  // Mutations that do not return gameId provide it by the persistent single-game archive.
  const game=gameId??repo.listGameIds()[0];
  // The archive has exactly one game by construction. Read it from sqlite when needed.
  if(!game)throw new Error('Kernel archive does not contain a game');
  const state=engine.getInternalState(game);
  const events=repo.events(state.gameId);const draws=repo.draws(state.gameId);const actions=repo.listActions();
  const replay=engine.replay(state.gameId);
  const initialStateHash=hash(repo.get(state.gameId).initial);
  repo.close();repo=undefined;
  return {value,archive:readFileSync(filename),state,initialStateHash,events,draws,actions,replay};
 }finally{try{repo?.close();}catch{}rmSync(dir,{recursive:true,force:true});}
}
