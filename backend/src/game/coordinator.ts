import {publicVoting,phaseTiming,ownVoteJournal,moderatorProgress,journalSummaries} from './experience.js';
import {lifecycleComposition,lifeDevelopmentEnabled,lifeDevelopmentComposition,lifeDevelopmentKey} from '../official/lifecycle-composition.js';
import {full50CandidateEnabled} from '../official/life02.js';
import {life02Ids,life02Enabled,life02Domain} from '../official/life02.js';
import {cultDeckIds,cultEnabled,cultDeck} from '../official/cult-recruitment.js';
import {ownerDc} from '../experimental/owner-dc-policy.js';
import {soulDeck} from '../official/soul-shooter.js';
import {publicChatView,requestedChatChannel} from '../official/public-chat-access.js';
import {mixedPackPrivacyScope,projectEvents,canReadEvent} from '../engine/visibility.js';
import {isMixedExileDeck} from '../official/final-pack.js';
import {groupedNight} from '../experimental/owner-bb-v2/night-action-group.js';
import {liveWitchDomain} from '../experimental/owner-bb-v2/live-witch-domain.js';
import {LIVE_PACK,LIVE_TRAP,liveEnabled,liveDeck,livePackView,liveSkillAllowed,packTurnRequired,type LiveProfile} from '../experimental/owner-bb-v2/live-profile.js';
import {hasOfficialEffectRoute} from '../engine/effect-dispatch.js';
import {pharmacistWindow} from '../official/final-pack.js';
/** Sprint 02B, *test mode only*. Domain adjudication stays in the existing Kernel. */
import {createHmac,createHash,randomUUID,randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {GameAction,GameState} from '../../../shared/contracts/index.js';
import {RULESET_VERSION,APPROVED_RULESET_VERSION} from '../../../shared/contracts/index.js';
import type {MultiplayerStore} from '../multiplayer/types.js';
import {assertLobby,LobbyError} from '../multiplayer/types.js';
import type {GameStore,StartCommand,StoredGame,AssignmentDraw,GameRulePack} from './types.js';
import {OFFICIAL_TEST_PACK,isApprovedInspectionDeck} from '../official/inspection-rules.js';
import {ownCapabilities} from '../official/capabilities.js';
import {S13_SKILLS,isS13Deck,isS15WitchDeck,s15GuardShotReady,isS15RevealDeck} from '../official/s13-mechanics.js';
import {withKernel} from './archive.js';
import {draw} from '../engine/rng.js';
import {KernelError} from '../common/errors.js';
import {projectSkillFeedback} from '../feedback/projector.js';
import {normalDeck,sameDeck} from './normal-decks.js';

export interface IntegrationOptions{testMode:boolean;officialTestMode?:boolean;characterPath?:string;publicOrdinaryVote?:boolean}
export class GameCoordinator {
 private readonly chars=new Map<number,{id:number;team:string;name:string}>();
 private readonly characterPath:string;
 constructor(private readonly store:MultiplayerStore&GameStore,private readonly opts:IntegrationOptions){
  this.characterPath=opts.characterPath??resolve(process.cwd(),'data/character.json');
  const data=JSON.parse(readFileSync(this.characterPath,'utf8'));
  assertLobby(Array.isArray(data)&&data.length===97&&new Set(data.map((c:any)=>c.id)).size===97,'SOURCE_INVALID','Official character catalog invalid',500);
  for(const c of data)this.chars.set(c.id,{id:c.id,team:c.team,name:c.name});
 }
 private assertTestMode(){assertLobby(this.opts.testMode,'RULE_UNRESOLVED','Official character gameplay disabled; set WV_INTEGRATION_TEST_MODE=1 for test-only fixtures',409);}
 private async requireParticipant(gameId:string,playerId:string):Promise<StoredGame>{
  const game=await this.store.gameById(gameId);assertLobby(game,'GAME_NOT_FOUND','Game not found',404);
  const room=await this.store.getRoom(game.roomId);
  assertLobby(room?.members.some(m=>m.id===playerId),'FORBIDDEN','Not a game participant',403);
  return game;
 }
 async start(roomId:string,actorId:string,body:any,connected?:ReadonlySet<string>){
  assertLobby(body&&typeof body==='object'&&!Array.isArray(body),'INVALID_GAME','Invalid payload');
  const rulePack:GameRulePack=body.rulePack??'FIXTURE';
  assertLobby(rulePack==='FIXTURE'||rulePack===OFFICIAL_TEST_PACK,'RULE_UNRESOLVED','Unknown rule pack',409);
  const mode=body.mode??'INTEGRATION_TEST';
  assertLobby(mode==='INTEGRATION_TEST'||mode==='NORMAL_GAMEPLAY','INVALID_GAME','Invalid game mode');
  const normal=mode==='NORMAL_GAMEPLAY';
  const composition=body.life02Composition===true;
  if(body.life02Composition!==undefined)assertLobby(composition&&!normal&&rulePack===OFFICIAL_TEST_PACK&&this.opts.officialTestMode&&life02Enabled()&&full50CandidateEnabled()&&Array.isArray(body.characterIds)&&lifecycleComposition(body.characterIds)&&body.qaProfile===undefined,'RULE_UNRESOLVED','LIFE module composition requires explicit compatible local QA',409);
  const qaProfile=body.qaProfile as LiveProfile|undefined;
  if(qaProfile!==undefined)assertLobby(!normal&&rulePack===OFFICIAL_TEST_PACK&&this.opts.officialTestMode&&liveEnabled()&&Array.isArray(body.characterIds)&&liveDeck(qaProfile,body.characterIds),'RULE_UNRESOLVED','B/B live profile requires explicit local QA and supported composition',409);
  if(normal)assertLobby(rulePack===OFFICIAL_TEST_PACK&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1','RULE_UNRESOLVED','Normal gameplay requires current official rules',409);
  else if(rulePack==='FIXTURE')this.assertTestMode();
  else assertLobby(this.opts.officialTestMode,'RULE_UNRESOLVED','Official inspection pack requires WV_OFFICIAL_RULE_TEST_MODE=1 and noncompetitive mode',409);
  const key=body.idempotencyKey;
  assertLobby(typeof key==='string'&&key.length>=8&&key.length<=128,'INVALID_ARGUMENT','Start requires idempotencyKey');
  const selection=body.characterIds;
  const fingerprint=Array.isArray(selection) && selection.every((n:any)=>Number.isInteger(n))
    ?createHash('sha256').update((normal?'NORMAL_GAMEPLAY:':'')+(rulePack==='FIXTURE'?'':rulePack+':')+(qaProfile?qaProfile+':':'')+(composition?'LIFE-MODULES-1:':'')+JSON.stringify([...selection].sort((a:number,b:number)=>a-b))).digest('hex'):'INVALID';
  const old=await this.store.gameForRoom(roomId);
  if(old){assertLobby(old.hostId===actorId&&old.requestKey===key&&old.startFingerprint===fingerprint,'GAME_ALREADY_STARTED','Room already started',409);
   return {created:false,gameId:old.gameId,roomId:old.roomId,mode:old.mode,revision:old.stateRevision};}
  const room=await this.store.getRoom(roomId);assertLobby(room,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(room.hostId===actorId,'FORBIDDEN','Only room host may start',403);
  assertLobby(room.status==='LOCKED','ROOM_NOT_LOCKED','Lock room before starting',409);
  const ids=body.characterIds;
  assertLobby(Array.isArray(ids)&&ids.length===room.members.length&&ids.length>=1&&ids.length<=97,'INVALID_ROLES','Provide exactly one approved Character ID per room member (max 97)');
  assertLobby(ids.every((id:any)=>Number.isInteger(id)&&this.chars.has(id))&&new Set(ids).size===ids.length,'INVALID_ROLES','Unknown or duplicated Character ID');
  const lifeDevelopment=normal&&lifeDevelopmentEnabled()&&lifeDevelopmentComposition(ids)&&room.normalDeck===lifeDevelopmentKey(ids);
  if(normal){const deck=normalDeck(room.normalDeck);assertLobby(deck&&sameDeck(ids,deck),'INVALID_ROLES','Choose a certified normal composition before ready',409);
   assertLobby(room.members.every(m=>m.ready),'ROOM_NOT_READY','All players must confirm readiness',409);
   assertLobby(connected&&room.members.every(m=>connected.has(m.id)),'ROOM_OFFLINE','All players must be connected to start',409);}
  if(rulePack===OFFICIAL_TEST_PACK)assertLobby(lifeDevelopment||composition|| (qaProfile?liveDeck(qaProfile,ids):isApprovedInspectionDeck(ids)||(!normal&&this.opts.officialTestMode&&((cultEnabled()&&cultDeckIds(ids))||(life02Enabled()&&life02Ids(ids))))),
   'RULE_UNRESOLVED','Official closed-deck test requires roles #25/#74 with optional #20 (no competitive/win evaluation)',409);
  const gameId=randomUUID(),seed=randomBytes(32).toString('hex');
  const roleSeed=createHmac('sha256',seed).update('wolvesville:role-assignment:02B:v1').digest('hex');
  const pool=[...ids] as number[],people=[] as Array<{playerId:string;characterId:number}>,assignments=[] as AssignmentDraw[];
  const players=[...room.members.map(m=>m.id)].sort();
  for(let i=0;i<players.length;i++){
   const d=draw(roleSeed,gameId,i,pool.map(String),'ROLE_ASSIGNMENT',`seat-${i}`);
   const id=Number(d.result),playerId=players[i]!;
   people.push({playerId,characterId:id});assignments.push({drawIndex:i,domain:d.domain,result:d.result,reason:'ROLE_ASSIGNMENT',playerId});
   pool.splice(pool.indexOf(id),1);
  }
  const initial=withKernel(undefined,rulePack==='FIXTURE',engine=>{
   engine.createGame(roomId,people,{gameId,seed,groupDayNight:process.env.WV_GROUP_CHAT_DAY_NIGHT==='1',publicOrdinaryVote:normal&&this.opts.publicOrdinaryVote===true,...(qaProfile?{qaProfile}:{}),...(!normal&&rulePack===OFFICIAL_TEST_PACK&&cultEnabled()&&cultDeckIds(ids)?{qaCult:true}:{}),...(!normal&&rulePack===OFFICIAL_TEST_PACK&&life02Enabled()&&(life02Ids(ids)||composition)?{qaLife02:true}:{}),...(composition?{life02Composition:true}:{}),...(lifeDevelopment?{lifeDevelopment:true}:{})});
   engine.transition(gameId,'ROLE_ASSIGNED');
   return engine.transition(gameId,'NIGHT_COLLECT');
  },rulePack===OFFICIAL_TEST_PACK);
  assertLobby(initial.replay.verified,'REPLAY_CORRUPTED','Initial game replay mismatch',500);
  if(normal)assertLobby(initial.state.ruleVersion===APPROVED_RULESET_VERSION,'RULE_UNRESOLVED','Normal game rule mismatch',409);
  const command:StartCommand={mode,rulePack,roomId,hostId:actorId,expectedRoomRevision:room.revision,requestKey:key,startFingerprint:fingerprint,gameId,participantIds:players,archive:initial.archive,state:initial.state,assignments,seedCommitment:createHash('sha256').update(seed).digest('hex'),events:initial.events,draws:initial.draws,actions:initial.actions,initialStateHash:initial.initialStateHash};
  const saved=await this.store.startGameAtomic(command);
  return {created:saved.created,gameId:saved.game.gameId,roomId,mode:saved.game.mode,rulePack:saved.game.rulePack,revision:saved.game.stateRevision};
 }
 async view(gameId:string,playerId:string){const game=await this.requireParticipant(gameId,playerId);
  const kernel=withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',(engine,repo)=>{
    const current=engine.getInternalState(gameId);
    const pack=livePackView(current,playerId);const self=current.participants.find(p=>p.playerId===playerId)!;const trap=current.qaProfile===LIVE_TRAP&&self.currentCharacterId===10?{placed:self.effects.filter(e=>e.kind==='S15_ENGINEER_TRAP_USED').length,activeTargets:current.participants.filter(p=>p.effects.some(e=>e.kind==='S15_ENGINEER_TRAP'&&e.sourceId===playerId)).map(p=>p.playerId)}:undefined;
    const potential=game.rulePack===OFFICIAL_TEST_PACK?ownCapabilities(current,playerId):[];
    const used=new Set(potential.filter(c=>repo.skillUsage(gameId,playerId,c.skillId,current.round,current.phase)>0).map(c=>c.skillId));
    // Owner-approved public composition: aggregate INITIAL roles, never seat order or assignments.
    const composition=game.rulePack===OFFICIAL_TEST_PACK?Array.from(new Set(current.participants.map(p=>p.initialCharacterId))).sort((a,b)=>a-b).map(characterId=>({name:this.chars.get(characterId)!.name,count:current.participants.filter(p=>p.initialCharacterId===characterId).length})):undefined;
    // Only a bounded ordinary-role profile: report a single boolean after every available
    // action has been accepted. Optional omission remains legal; no new blocking rule.
    const nightAllReceived=game.mode==='NORMAL_GAMEPLAY'&&current.publicVotePolicy&&current.phase==='NIGHT_COLLECT'&&repo.queued(gameId).length>0&&current.participants.every(p=>{const caps=ownCapabilities(current,p.playerId);const used=new Set(caps.filter(c=>repo.skillUsage(gameId,p.playerId,c.skillId,current.round,current.phase)>0).map(c=>c.skillId));return !ownCapabilities(current,p.playerId,used).some(c=>c.available&&liveSkillAllowed(current,c.skillId));});
    return {moderator:moderatorProgress(current,!!nightAllReceived),publicVoting:publicVoting(current),phaseTiming:game.mode==='NORMAL_GAMEPLAY'&&current.publicVotePolicy?phaseTiming(current,repo.events(gameId)):undefined,pack,trap,composition,groupChat:game.rulePack===OFFICIAL_TEST_PACK?engine.systemGroupChatProjection(gameId,playerId):[],mediumChat:game.rulePack===OFFICIAL_TEST_PACK?engine.mediumChatProjection(gameId,playerId):undefined,canQaResolveDaySkill:game.mode==='INTEGRATION_TEST'&&game.rulePack===OFFICIAL_TEST_PACK&&isS15RevealDeck(current)&&current.phase==='DAY_DISCUSS'&&current.round>1,projection:engine.project(gameId,playerId),canQaAdvanceDay:game.mode==='INTEGRATION_TEST'&&game.rulePack===OFFICIAL_TEST_PACK&&(isS13Deck(current)||!!current.qaProfile)&&!current.votingPolicy,chat:game.rulePack===OFFICIAL_TEST_PACK?publicChatView(current,playerId):undefined,capabilities:game.rulePack===OFFICIAL_TEST_PACK?ownCapabilities(current,playerId,used).filter(c=>liveSkillAllowed(current,c.skillId)).map(c=>({...c,targetPolicy:engine.publicTargetPolicy(gameId,c.skillId)})):[]};
   },game.rulePack===OFFICIAL_TEST_PACK);
  return {...(kernel.value.phaseTiming?{phaseTiming:kernel.value.phaseTiming}:{}),...(kernel.value.publicVoting?{publicVoting:kernel.value.publicVoting}:{}),...(kernel.value.phaseTiming&&game.mode==='NORMAL_GAMEPLAY'&&this.phaseCoordinator(game)===playerId?{hostProgress:{status:kernel.value.phaseTiming.phaseStatus,...kernel.value.moderator}}:{}),mode:game.mode,...(game.mode==='NORMAL_GAMEPLAY'?{coordinatorId:this.phaseCoordinator(game)}:{}),rulePack:game.rulePack,roomId:game.roomId,...kernel.value.projection,...(kernel.value.pack?{bbPack:kernel.value.pack}:{}),...(kernel.value.trap?{bbTrap:kernel.value.trap}:{}),voting:withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',engine=>engine.voteProjection(gameId,playerId),game.rulePack===OFFICIAL_TEST_PACK).value,capabilities:kernel.value.capabilities,...(kernel.value.mediumChat?{mediumChat:kernel.value.mediumChat}:{}),...(kernel.value.groupChat.length?{groupChat:kernel.value.groupChat}:{}),...(kernel.value.composition?{roleComposition:kernel.value.composition}:{}),canQaAdvanceDay:kernel.value.canQaAdvanceDay,canQaResolveDaySkill:kernel.value.canQaResolveDaySkill,...(kernel.value.chat?{chat:kernel.value.chat}:{})};
 }
 async sendChat(gameId:string,playerId:string,body:any){
  const game=await this.requireParticipant(gameId,playerId);
  assertLobby(game.rulePack===OFFICIAL_TEST_PACK&&(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode),'RULE_UNRESOLVED','Chat requires official QA mode',409);
  const channel=requestedChatChannel(body);
  const applied=await this.store.withGameMutation(gameId,current=>{
   const k=withKernel(current.archive,false,engine=>channel==='MEDIUM'?engine.sendMediumChat(gameId,playerId,body):channel==='GROUP'?engine.sendSystemGroupChat(gameId,playerId,body):{...engine.sendPublicChat(gameId,playerId,body?.text,body?.messageId),privateRefreshIds:undefined},true);
   return {...k,result:k.value};
  });return applied.result;
 }
 async visibleEvents(gameId:string,playerId:string){const game=await this.requireParticipant(gameId,playerId);
  return withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',engine=>engine.projectVisibleEvents(gameId,playerId),game.rulePack===OFFICIAL_TEST_PACK).value;
 }
 async submit(gameId:string,playerId:string,body:any){
  const game=await this.requireParticipant(gameId,playerId);
  if(game.rulePack==='FIXTURE')this.assertTestMode();
  else assertLobby(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode,'RULE_UNRESOLVED','Official test mode disabled',409);
  assertLobby(body&&typeof body==='object','INVALID_ARGUMENT','Expected object');
  assertLobby(typeof body.actionId==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(body.actionId),'INVALID_ARGUMENT','Invalid actionId');
  assertLobby(typeof body.idempotencyKey==='string'&&body.idempotencyKey.length>=8&&body.idempotencyKey.length<=128,'INVALID_ARGUMENT','Invalid idempotencyKey');
  const skillAllowed=game.rulePack==='FIXTURE'?typeof body.skillId==='string'&&/^fixture\.[a-z-]+$/.test(body.skillId):hasOfficialEffectRoute(body.skillId);
  assertLobby(skillAllowed,'RULE_UNRESOLVED','Skill not supported by the persisted game rule pack',409);
  assertLobby(Array.isArray(body.targetIds)&&body.targetIds.length<=97&&body.targetIds.every((x:any)=>typeof x==='string'),'TARGET_INVALID','Invalid targetIds');
  const expected=body.expectedRevision;
  assertLobby(expected===undefined||Number.isSafeInteger(expected),'INVALID_ARGUMENT','Invalid expectedRevision');
  const applied=await this.store.withGameMutation(gameId,current=>{
   const k=withKernel(current.archive,current.rulePack==='FIXTURE',(engine,repo)=>{
    const state=engine.getInternalState(gameId);
    const existing=repo.actionByKey(gameId,playerId,body.idempotencyKey);
    // Duplicate action replay takes precedence over stale revision, but full fingerprint is still checked by Kernel.
    const action:GameAction={actionId:body.actionId,gameId,playerId,skillId:body.skillId,
     targetIds:body.targetIds,phase:existing?.action.phase??state.phase,round:existing?.action.round??state.round,timestamp:0,payload:body.payload??{},
     idempotencyKey:body.idempotencyKey,ruleVersion:state.ruleVersion};
    // Deny client-specified actor/role/faction/phase/priority/seed. All are server owned.
    assertLobby(!!existing||expected===undefined||expected===state.revision,'REVISION_CONFLICT','Stale game revision',409);
    return engine.submit(action);
   },current.rulePack===OFFICIAL_TEST_PACK);
   return {...k,result:k.value};
  });
  return {gameId,actionId:applied.result.actionId,status:applied.result.status,duplicate:applied.result.duplicate,revision:applied.game.stateRevision,privateRefreshIds:applied.result.privateRefreshIds};
 }
 async submitLivePack(gameId:string,playerId:string,body:any){
  const game=await this.requireParticipant(gameId,playerId);assertLobby(game.mode==='INTEGRATION_TEST'&&game.rulePack===OFFICIAL_TEST_PACK&&this.opts.officialTestMode&&liveEnabled(),'FORBIDDEN','B/B pack requires local QA',403);
  assertLobby(body&&typeof body.key==='string'&&/^[\w-]{8,128}$/.test(body.key)&&Number.isSafeInteger(body.expectedRevision)&&Array.isArray(body.targets)&&body.targets.length<=2&&body.targets.every((x:any)=>typeof x==='string'),'INVALID_ARGUMENT','Invalid pack selection');
  const applied=await this.store.withGameMutation(gameId,current=>{const k=withKernel(current.archive,false,engine=>engine.submitLivePack(gameId,playerId,{key:body.key,expectedRevision:body.expectedRevision,targets:body.targets}),true);return {...k,result:k.value};});
  return applied.result;
 }
 async claimCoordinator(gameId:string,actorId:string,expectedRoomRevision:number,connected:ReadonlySet<string>){
  const game=await this.requireParticipant(gameId,actorId);assertLobby(game.mode==='NORMAL_GAMEPLAY'&&this.store.claimNormalCoordinator&&Number.isSafeInteger(expectedRoomRevision),'FORBIDDEN','Active normal match required',403);
  return this.store.claimNormalCoordinator(gameId,actorId,expectedRoomRevision,connected);
 }
 private phaseCoordinator(game:StoredGame){return game.mode==='NORMAL_GAMEPLAY'?game.coordinatorId??game.hostId:game.hostId;}
 async advanceNight(gameId:string,actorId:string,body:any={}){return this.resolve(gameId,actorId,body,true);}
 async resolve(gameId:string,actorId:string,body:any={},normalAdvance=false){
  const game=await this.requireParticipant(gameId,actorId);
  if(game.rulePack==='FIXTURE')this.assertTestMode();
  else assertLobby(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode,'RULE_UNRESOLVED','Official test mode disabled',409);
  assertLobby((game.mode==='NORMAL_GAMEPLAY')===normalAdvance,'FORBIDDEN','Wrong phase-control endpoint for match mode',403);
  assertLobby(this.phaseCoordinator(game)===actorId,'FORBIDDEN','Only host may close the current phase',403);
  if(normalAdvance)assertLobby(Number.isSafeInteger(body.expectedRevision),'INVALID_ARGUMENT','Night closure requires current revision');
  const expected=body.expectedRevision;
  assertLobby(expected===undefined||Number.isSafeInteger(expected),'INVALID_ARGUMENT','Invalid expectedRevision');
  const applied=await this.store.withGameMutation(gameId,current=>{
   assertLobby(this.phaseCoordinator(current)===actorId,'FORBIDDEN','Coordinator changed',403);
   const k=withKernel(current.archive,current.rulePack==='FIXTURE',(engine,repo)=>{
    let st=engine.getInternalState(gameId);
    assertLobby(body.phaseId===undefined||body.phaseId===`${st.gameId}:${st.round}:${st.phase}`,'OUT_OF_PHASE','Stale phase confirmation',409);
    assertLobby(expected===undefined||expected===st.revision,'REVISION_CONFLICT','Stale game revision',409);
    if(normalAdvance)assertLobby(st.phase==='NIGHT_COLLECT'||st.phase==='WITCH_WINDOW'&&pharmacistWindow(st),'OUT_OF_PHASE','Normal night closure requires night collection or an authorized rescue window',409);
    if(st.phase==='NIGHT_COLLECT'){if(packTurnRequired(st)){const status=engine.lockLivePack(gameId);if(status!=='UNANIMOUS'&&status!=='NO_CONSENSUS')return {resolved:0,cancelled:0,randomDraws:0,revision:engine.getInternalState(gameId).revision,packStatus:status};}engine.transition(gameId,'NIGHT_RESOLVE');}
    else if(st.phase==='WITCH_WINDOW'&&(isS15WitchDeck(st)||pharmacistWindow(st))){}
    else if(st.phase==='DAY_DISCUSS'){
     if(st.votingPolicy){if(!s15GuardShotReady(st)||repo.queued(gameId).length!==1||repo.queued(gameId)[0]?.action.skillId!==S13_SKILLS.guardShot)throw new LobbyError('OUT_OF_PHASE','Open voting before resolving the day',409);}
     else {
     // Inherited test-only administrative phase advance: retained for the
     // existing #20/#9/#31 lifecycle regression. This is NOT an official
     // day/vote rule, and the player-facing button is intentionally hidden.
     engine.transition(gameId,'DAY_RESOLVE');}
    }
    else if(st.phase==='DAY_VOTE_COLLECT'){
     // Legacy no-action path must fail closed; only an accepted official day
     // skill permits an in-place pre-lock resolution while voting stays open.
     if(repo.queued(gameId).length===0)throw new LobbyError('RULE_UNRESOLVED','No certified vote outcome without a supported day action',409);
    }
    else if(st.phase==='DAY_RESOLVE'&&st.voting?.status==='CLOSED_UNRESOLVED'){
     // Existing vote result is intentionally unresolved; only a confirmed cancellation can proceed.
    }
    else throw new LobbyError('OUT_OF_PHASE','Test resolution requires a collecting phase',409);
    if(body.bbOpenPoisonWindow===true){assertLobby(!normalAdvance&&groupedNight(st)&&liveWitchDomain(st)&&st.phase==='WITCH_WINDOW'&&!st.qaNightWindow,'RULE_UNRESOLVED','Separate rescue window not available',409);return engine.resolve(gameId,true);}
    const outcome=engine.resolve(gameId);
    st=engine.getInternalState(gameId);
    if(st.phase==='NIGHT_RESOLVE'&&(pharmacistWindow(st)||isS15WitchDeck(st)&&st.participants.some(p=>p.currentCharacterId===29&&['ALIVE','PENDING_DEATH'].includes(p.life)))){
     engine.transition(gameId,'WITCH_WINDOW');
    }else if(st.phase==='NIGHT_RESOLVE'||st.phase==='WITCH_WINDOW'){
     engine.transition(gameId,'NIGHT_FINALIZE');
     const verdict=engine.completeVerifiedKnightSolo(gameId);
     if(!verdict.completed&&(!verdict.resolutionStatus||verdict.resolutionStatus==='CONTINUE'))engine.transition(gameId,'DAY_DISCUSS');
    }else if(st.phase==='DAY_VOTE_COLLECT'&&st.voting?.status==='CANCELLED'){
     engine.transition(gameId,'DAY_RESOLVE');engine.transition(gameId,'NIGHT_COLLECT');
    }else if(st.phase==='DAY_RESOLVE'){
     if(st.voting && st.voting.status!=='CANCELLED')throw new LobbyError('RULE_UNRESOLVED','No confirmed final-vote/hanging rule for this closed deck',409);
     engine.transition(gameId,'NIGHT_COLLECT');
    }
    return outcome;
   },current.rulePack===OFFICIAL_TEST_PACK);
   // Mixed QA phase coordinator is a player, not a privileged auditor.
   // Do not disclose other players' private action/RNG counts in a receipt.
   const outcome=(mixedPackPrivacyScope(k.state)||soulDeck(k.state)||ownerDc(k.state)||cultDeck(k.state)||life02Domain(k.state))?('packStatus' in k.value?{packStatus:k.value.packStatus}:{}):k.value;
   return {...k,result:{...outcome,revision:k.state.revision,phase:k.state.phase,verified:k.replay.verified}};
  });
  return {gameId,...applied.result};
 }
 /** Authorized stable skill feedback. Rebuilt from persisted action ledger and frozen event ACL.
  * This endpoint must never expose a different participant's accepted action or result. */
 /** Sprint 06: limited voting transport — no final result without a verified rule chain. */
 async openVoting(gameId:string,playerId:string,body:any={}){
  const game=await this.requireParticipant(gameId,playerId);
  assertLobby(this.phaseCoordinator(game)===playerId,'FORBIDDEN','Only host can open voting',403);
  assertLobby(game.rulePack===OFFICIAL_TEST_PACK&&(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode),'RULE_UNRESOLVED','Voting intake requires restricted official test mode',409);
  const applied=await this.store.withGameMutation(gameId,current=>{
   assertLobby(this.phaseCoordinator(current)===playerId,'FORBIDDEN','Coordinator changed',403);
   const k=withKernel(current.archive,false,engine=>{const st=engine.getInternalState(gameId);assertLobby(body.phaseId===undefined||body.phaseId===`${st.gameId}:${st.round}:${st.phase}`,'OUT_OF_PHASE','Stale phase confirmation',409);return engine.openVoting(gameId,body.expectedRevision);},true);
   return {...k,result:{phase:k.state.phase,revision:k.state.revision}};
  });return applied.result;
 }
 async castVote(gameId:string,playerId:string,body:any){
  const game=await this.requireParticipant(gameId,playerId);
  assertLobby(game.rulePack===OFFICIAL_TEST_PACK&&(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode),'RULE_UNRESOLVED','Voting intake requires restricted official test mode',409);
  assertLobby(body&&typeof body==='object'&&typeof body.targetId==='string'&&typeof body.ballotId==='string'&&typeof body.idempotencyKey==='string','INVALID_ARGUMENT','Invalid vote command');
  assertLobby(body.expectedRevision===undefined||Number.isSafeInteger(body.expectedRevision),'INVALID_ARGUMENT','Invalid expectedRevision');
  const applied=await this.store.withGameMutation(gameId,current=>{
   const k=withKernel(current.archive,false,engine=>engine.submitVoteIntent(gameId,playerId,body.targetId,body.ballotId,body.idempotencyKey,body.expectedRevision),true);
   return {...k,result:k.value};
  });return applied.result;
 }
 async closeVoting(gameId:string,playerId:string,body:any={}){
  const game=await this.requireParticipant(gameId,playerId);
  assertLobby(this.phaseCoordinator(game)===playerId,'FORBIDDEN','Only host can close voting',403);
  assertLobby(game.rulePack===OFFICIAL_TEST_PACK&&(game.mode==='NORMAL_GAMEPLAY'||this.opts.officialTestMode),'RULE_UNRESOLVED','Voting intake requires restricted official test mode',409);
  const applied=await this.store.withGameMutation(gameId,current=>{
   assertLobby(this.phaseCoordinator(current)===playerId,'FORBIDDEN','Coordinator changed',403);
   const k=withKernel(current.archive,false,engine=>{const st=engine.getInternalState(gameId);assertLobby(body.phaseId===undefined||body.phaseId===`${st.gameId}:${st.round}:${st.phase}`,'OUT_OF_PHASE','Stale phase confirmation',409);return engine.closeVoting(gameId,body.expectedRevision);},true);
   return {...k,result:k.value};
  });return applied.result;
 }
 async voteStatus(gameId:string,playerId:string){
  const game=await this.requireParticipant(gameId,playerId);
  return withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',engine=>engine.voteProjection(gameId,playerId),game.rulePack===OFFICIAL_TEST_PACK).value;
 }
 /** Own journal metadata only; results continue through the existing feedback ACL. */
 async journal(gameId:string,playerId:string){const game=await this.requireParticipant(gameId,playerId);
  const entries=withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',(engine,repo)=>{
   const actions=repo.listActions().filter(a=>a.playerId===playerId);const events=repo.events(gameId);const byId=new Map<string,number>();let role:number|undefined;
   for(const event of events){if(event.eventType==='STATE_COMMITTED'){const snapshot=event.payload.state as unknown as GameState;role=snapshot?.participants?.find(p=>p.playerId===playerId)?.currentCharacterId;}else if(event.eventType==='ACTION_ACCEPTED'&&event.actorId===playerId&&role!==undefined)byId.set(String(event.payload.actionId),role);}
   return actions.flatMap(a=>{const stored=repo.actionById(gameId,a.actionId);if(!stored||stored.action.playerId!==playerId)return [];const v=stored.action;return [{actionId:a.actionId,skillId:v.skillId,round:v.round,phase:v.phase,targetIds:v.targetIds,submittedAt:v.timestamp,characterId:byId.get(a.actionId)??null,status:a.status}];});
  },game.rulePack===OFFICIAL_TEST_PACK).value;
  const feedback=await this.feedback(gameId,playerId);const results=new Map(feedback.items.map(f=>[f.actionId,f]));const extra=withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',(engine,repo)=>({...journalSummaries(repo.events(gameId),playerId),votes:ownVoteJournal(repo.events(gameId),playerId),publicEvents:engine.projectVisibleEvents(gameId,playerId).filter(e=>['PHASE_CHANGED','PLAYER_ELIMINATED','PLAYER_REVIVED','OFFICIAL_VOTE_RESULT','MATCH_COMPLETED','VOTING_OPENED','VOTE_LOCKED','VOTE_OUTCOME_CONFIRMED'].includes(String(e.eventType)))}),game.rulePack===OFFICIAL_TEST_PACK).value;return {gameId,...extra,entries:entries.map(e=>({...e,feedback:results.get(e.actionId)??null})).sort((a,b)=>a.round-b.round||a.submittedAt-b.submittedAt)};
 }
 async feedback(gameId:string,playerId:string){
  const game=await this.requireParticipant(gameId,playerId);
  const data=withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',(engine,repo)=>({
   state:engine.getInternalState(gameId),
   actions:repo.listActions().filter(a=>a.playerId===playerId),
   events:engine.projectVisibleEvents(gameId,playerId).map(e=>({
    seq:Number(e.seq),eventType:String(e.eventType),
    actorId:typeof e.actorId==='string'?e.actorId:undefined,
    targetId:typeof e.targetId==='string'?e.targetId:undefined,
    payload:e.payload&&typeof e.payload==='object'&&!Array.isArray(e.payload)?e.payload as Record<string,unknown>:{}
   })),
   // Never expose these internal events; timestamps are for own action only.
   timestamps:repo.events(gameId).filter(e=>e.actorId===playerId&&['ACTION_ACCEPTED','ACTION_RESOLVED','ACTION_CANCELLED'].includes(e.eventType))
    .map(e=>({actionId:String(e.payload.actionId),type:e.eventType as 'ACTION_ACCEPTED'|'ACTION_RESOLVED'|'ACTION_CANCELLED',timestamp:e.timestamp}))
  }),game.rulePack===OFFICIAL_TEST_PACK).value;
  return projectSkillFeedback({gameId,viewerId:playerId,ruleVersion:data.state.ruleVersion,revision:data.state.revision,
   actions:data.actions,visibleEvents:data.events,actionTimestamps:data.timestamps});
 }
 /** Completed-match timeline: timestamp is joined only after applying the same ACL as the normal event view.
  * Viewer-local sequence never reveals gaps in the underlying private ledger. */
 async historyTimeline(gameId:string,viewerId:string){const game=await this.requireParticipant(gameId,viewerId);return withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',(engine,repo)=>{const state=engine.getInternalState(gameId);assertLobby(state.completed,'SOCIAL_MATCH_ACTIVE','Match is not completed',409);const all=repo.events(gameId);const allowed=all.filter(e=>canReadEvent(state,e,{viewerId}));const projected=projectEvents(state,all,{viewerId});const publicTypes=new Set(['MATCH_COMPLETED','PLAYER_ELIMINATED','PLAYER_REVIVED','PHASE_CHANGED','OFFICIAL_VOTE_RESULT','VOTE_OUTCOME_CONFIRMED','VOTING_OPENED','VOTE_LOCKED']);return projected.flatMap((e,i)=>publicTypes.has(String(e.eventType))?[{eventType:e.eventType,sequence:i+1,timestamp:allowed[i]!.timestamp,payload:e.payload}]:[]).map((e,i)=>({...e,sequence:i+1}));},game.rulePack===OFFICIAL_TEST_PACK).value;}
 async replay(gameId:string,playerId:string){const game=await this.requireParticipant(gameId,playerId);
  const k=withKernel(game.archive,this.opts.testMode&&game.rulePack==='FIXTURE',engine=>engine.replay(gameId),game.rulePack===OFFICIAL_TEST_PACK);
  const roleSeed=createHmac('sha256',k.state.seed).update('wolvesville:role-assignment:02B:v1').digest('hex');
  const assignments=await this.store.assignmentDraws(gameId);
  const ordered=[...k.state.participants].sort((a,b)=>a.playerId.localeCompare(b.playerId));
  const remaining=new Set(ordered.map(p=>String(p.initialCharacterId)));
  const assignmentValid=assignments.length===ordered.length && assignments.every((record,i)=>{
   if(record.drawIndex!==i||record.playerId!==ordered[i]?.playerId||record.result!==String(ordered[i].initialCharacterId))return false;
   const expectedDomain=[...remaining].sort();
   if(JSON.stringify(record.domain)!==JSON.stringify(expectedDomain))return false;
   try{const correct=draw(roleSeed,gameId,i,record.domain,'ROLE_ASSIGNMENT',`seat-${i}`).result===record.result;
    if(correct)remaining.delete(record.result);return correct;
   }catch{return false;}
  });
  const seedValid=createHash('sha256').update(k.state.seed).digest('hex')===game.seedCommitment;
  if(!assignmentValid||!seedValid)throw new KernelError('REPLAY_CORRUPTED','Role assignment RNG audit failed');
  return {gameId,...(k.state.qaProfile?{qaProfile:k.state.qaProfile,ruleVersion:k.state.ruleVersion}:{}),verified:k.value.verified&&assignmentValid&&seedValid,roleAssignmentsVerified:assignmentValid,...((mixedPackPrivacyScope(k.state)||soulDeck(k.state)||ownerDc(k.state)||cultDeck(k.state)||life02Domain(k.state))?{events:projectEvents(k.state,k.events,{viewerId:playerId}).length,eventCountScope:'AUTHORIZED_VIEW'}:{events:k.value.events-k.events.filter(e=>e.eventType==='GAME_GROUP_CHAT'&&!e.audience?.includes(playerId)).length,draws:k.value.draws,revision:k.value.state.revision}),assignmentDraws:assignments.length,...(game.mode==='NORMAL_GAMEPLAY'?{coordinationHistory:await this.store.coordinationHistory?.(gameId)??[]}: {})};
 }
}
