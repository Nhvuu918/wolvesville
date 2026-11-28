import {PUBLIC_VOTE_POLICY,supportsPublicOrdinaryVote} from '../game/experience.js';
import {hasClosedDeathLedger} from '../official/stable-death-proof.js';
import {lifecycleComposition,LIFE_COMPOSITION_VERSION,lifeDevelopmentEnabled,lifeDevelopmentComposition,LIFE_DEV_SCOPE} from '../official/lifecycle-composition.js';
import {life02Domain,life02Ids,life02Enabled,LIFE02_POLICY,FULL50_LIFE02_M1_POLICY,full50CandidateEnabled,resolveLife02NightWake,full50Lifecycle,life02RescueDomain,queueLife02Attack,finalizeLife02Attacks,SEED_SKILL,CUPID_SKILL,applyLife02Skill,resolveLife02Lethal,wakeLife02,life02NameOverride,CUPID_USED,PROLONG_SKILL,prolongDomain,expireLifeProlongations,life02Winners} from '../official/life02.js';
import {cultDeckIds,cultDeck,cultEnabled,initCult,cultWin,CULT_RECRUIT} from '../official/cult-recruitment.js';
import {mirrorDeckIds,MIRROR_BITE} from '../official/mirror-investigation.js';
import {ownerDc,ownerDcEnabled,OWNER_DC_POLICY,OWNER_DC_SCOPE_S21} from '../experimental/owner-dc-policy.js';
import {trapRevivalDomain,jesterRevivalDomain} from '../official/revival-capability.js';
import {soulDeck,soulDeckIds,soulStage,soulNoVote,soulRevivalEvents,SOUL_SHOT} from '../official/soul-shooter.js';
import {isMixedExileDeck} from '../official/final-pack.js';
import {BB_FINAL_POLICY,groupedNight,recordNightAction,closeNightGroups,deferInvertedRescueDeath} from '../experimental/owner-bb-v2/night-action-group.js';
import {allPlayerRepresentativeTape,ALL_PLAYER_POLICY} from '../experimental/owner-bb-v2/representative-order.js';
import {liveWitchDomain} from '../experimental/owner-bb-v2/live-witch-domain.js';
import {applyLiveInvertedWitch} from '../official/s13-mechanics.js';
import {LIVE_PACK,LIVE_TRAP,liveEnabled,liveDeck,packContext,currentPack,liveSkillAllowed,packTurnRequired,liveConversionDomain,type LiveProfile} from '../experimental/owner-bb-v2/live-profile.js';
import {submitPack,lockPack,type PackState} from '../experimental/owner-bb-v2/pack.js';
import {commitCandidatePack,commitLiveInvertedGuard} from '../experimental/owner-bb-v2/runtime.js';
import {ENGINEER_MARK} from '../official/engineer-trap.js';
import {systemGroupChatView,prepareSystemGroupChat,validateSystemChatGroups} from '../official/group-chat.js';
import {mediumChatView,prepareMediumChat} from '../official/medium-chat.js';
import {publicChatEnabled,publicChatView} from '../official/public-chat-access.js';
import {finalizeNightRevivals,revivalDeck,revivalDeckIds} from '../official/revival.js';
import {DOG_THIEF_SKILL} from '../official/dog-thief.js';
import {PACK_BITE,PACK_BITE_RULE,isPackBiteSkill,isApprovedLeaderDeck,isApprovedSingleWolfPackDeck,isScaleLeaderDeckIds,PHARMACIST_RESCUE,pharmacistWindow} from '../official/final-pack.js';
import {settleBell,bellNewIds,bellRevivalDomain} from '../official/bell-rules.js';
import {isFinalRevengeDeck,REVENGE_SKILL,REVENGE_SKIP,REVENGE_PENDING,assertRevengeDomain,settleRevenge} from '../official/post-hanging-revenge.js';
import {isFinalHunterDeck,canContinueFinalHunter,isRevengeHunterDeck,resolveFinalHunterFollow} from '../official/hanging-follow.js';
import {isSwapDeck,swappedTarget} from '../official/swap-rules.js';
import {isContractDeck,isImmediateContract,applyContract,settleBallotContract} from '../official/ballot-contract.js';
import {isBreakStoneDeck,isBreakExileDeck,evaluateHangingImmunity,transitionExileAfterDeath,STONE_SPENT} from '../official/breakthrough-rules.js';
import {randomBytes,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Effect,GameAction,GameState,Participant,Visibility,Phase,RandomRecord} from '../../../shared/contracts/index.js';
import {RULESET_VERSION,APPROVED_RULESET_VERSION,isApprovedRuleVersion} from '../../../shared/contracts/index.js';
import type {GameRepository} from '../persistence/sqlite.js';
import {clone,hash} from '../common/canonical.js';
import {invariant,KernelError} from '../common/errors.js';
import {transition,ensureRevision,validateState,participant} from './state.js';
import {RuleRegistry,makeRuleContext} from './rules.js';
import {validateAction,canResolveAccepted} from './validate.js';
import {resolveEffectRoute} from './effect-dispatch.js';
import {onOfficialInspectionResolved} from '../official/reactive-rules.js';
import {SUPPORT_SKILLS} from '../official/support-rules.js';
import {replay} from './replay.js';
import {projectState,projectEvents} from './visibility.js';
import {EventLedger} from './events.js';
import type {PendingEvent} from './events.js';
import {orderResolutionActions,cancelledByPeace} from './queue.js';
import {KNIGHT_SKILL,KNIGHT_RULE,knightSoloWinner,isKnightClosedDeck} from '../official/solo-rules.js';
import {closeWithoutOfficialBallotRule,adjudicateOfficialVote} from './vote-adjudicator.js';
import {S12_GAMEPLAY_POLICY,isS12DeckIds,isS12ClosedDeck} from '../official/death-interactions.js';
import {certifyKnightPostElimination,applyCertifiedHanging} from './elimination-chain.js';
import {resolveCertifiedVictory,resolveHangingVictory,classifyS12Resolution,classifyBreakResolution} from '../official/victory-resolver.js';
import {S13_SKILLS,S13_STATUS,isS15SedativeDeck,isS15ExileDeck,isS15RevealDeck,s15GuardShotReady,isS15ViolinDeck,isS15VoteBlocked,isS13AttackDeck,S14_ATTACKS,isS14ChatDeck,isS14PublicMuted,isS14DeathDeck,resolveS14DeathFollow} from '../official/s13-mechanics.js';

import {isDeepVoteDeck} from '../official/deep-links.js';
import {isDeepRescueDeck,isPreliminaryRescueDeck,pendingVictims,finalizePreliminary,WITCH_RESCUE} from '../official/preliminary-death.js';
export interface GameSeedParticipant {playerId:string;characterId:number;resources?:Record<string,number>}
export class EngineService {
  private knownCharacters:Map<number,{id:number;name:string;team:string}>;
  private characterHash:string;
  constructor(private readonly repo:GameRepository,private readonly registry:RuleRegistry,
    characterPath=resolve(process.cwd(),'data/character.json'),private readonly allowFixtures=false){
    const data=readFileSync(characterPath);
    this.characterHash=hash(data.toString('utf8'));
    const characters=JSON.parse(data.toString('utf8')) as Array<{id:number;name:string;team:string}>;
    invariant(characters.length===97 && new Set(characters.map(c=>c.id)).size===97,'INVALID_ARGUMENT','Official character list must contain 97 unique characters');
    this.knownCharacters=new Map(characters.map(c=>[c.id,c]));
  }
  createGame(roomId:string,people:GameSeedParticipant[], options:{gameId?:string;seed?:string;qaProfile?:LiveProfile;qaCult?:boolean;qaLife02?:boolean;life02Composition?:boolean;lifeDevelopment?:boolean;publicOrdinaryVote?:boolean;groupDayNight?:boolean}={}):GameState {
    invariant(roomId.trim().length>0,'INVALID_ARGUMENT','Missing roomId');
    invariant(people.length>=1 && people.length<=97,'INVALID_ARGUMENT','Only 1–97 unique character slots supported in this ruleset');
    const playerIds=new Set<string>();const chars=new Set<number>();
    const participants:Participant[]=people.map(({playerId,characterId,resources})=>{
      invariant(playerId.length>0 && !playerIds.has(playerId),'INVALID_ARGUMENT','Missing/duplicate playerId');playerIds.add(playerId);
      invariant(this.knownCharacters.has(characterId)&&!chars.has(characterId),'INVALID_ARGUMENT','Unknown/duplicate initial characterId');chars.add(characterId);
      const char=this.knownCharacters.get(characterId)!;
      invariant(!resources || Object.values(resources).every(v=>Number.isInteger(v)&&v>=0),'INVALID_ARGUMENT','Invalid initial resource configuration');
      return {playerId,initialCharacterId:characterId,currentCharacterId:characterId,initialFaction:char.team,currentFaction:char.team,
        life:'ALIVE',publicReportedDead:false,resources:resources??{},effects:[],skillLocks:[],winLinks:[],groupIds:[]};
    });
    const state:GameState={gameId:options.gameId??randomUUID(),roomId,ruleVersion:this.allowFixtures||process.env.WV_ARCHIVED_RULE_REGRESSION==='1'?RULESET_VERSION:APPROVED_RULESET_VERSION,characterHash:this.characterHash,
      seed:options.seed??randomBytes(32).toString('hex'),revision:0,phase:'ROLE_LOCKED',round:1,
      participants,links:[],effects:[],randomCursor:0,completed:false,winnerIds:[]};
    if(options.groupDayNight&&!this.allowFixtures&&isApprovedRuleVersion(state.ruleVersion))state.groupChatTimePolicy='WV-GROUP-DAY-NIGHT-1';
    if(options.publicOrdinaryVote&&!this.allowFixtures&&supportsPublicOrdinaryVote(people.map(p=>p.characterId)))state.publicVotePolicy=PUBLIC_VOTE_POLICY;
    if(options.life02Composition||options.lifeDevelopment){
      const ids=people.map(p=>p.characterId),dev=options.lifeDevelopment===true;
      invariant(!this.allowFixtures&&isApprovedRuleVersion(state.ruleVersion)&&lifecycleComposition(ids)&&(dev?lifeDevelopmentEnabled()&&lifeDevelopmentComposition(ids)&&!options.qaLife02:options.qaLife02&&life02Enabled()&&full50CandidateEnabled()),'RULE_UNRESOLVED','Unsupported LIFE module composition');
      state.life02Composition=LIFE_COMPOSITION_VERSION;state.qaLife02Policy=FULL50_LIFE02_M1_POLICY;state.votingPolicy='S11_OFFICIAL_V1';if(dev)state.life02DevelopmentScope=LIFE_DEV_SCOPE;
    }
    else if(life02Ids(people.map(p=>p.characterId))){invariant(options.qaLife02&&!this.allowFixtures&&life02Enabled()&&isApprovedRuleVersion(state.ruleVersion),'RULE_UNRESOLVED','RC01 LIFE-02 candidate requires opt-in QA');state.qaLife02Policy=full50CandidateEnabled()?FULL50_LIFE02_M1_POLICY:LIFE02_POLICY;state.votingPolicy='S11_OFFICIAL_V1';}
    if(options.qaCult){invariant(!this.allowFixtures&&cultEnabled()&&cultDeckIds(people.map(p=>p.characterId))&&isApprovedRuleVersion(state.ruleVersion),'RULE_UNRESOLVED','Cult candidate disabled');initCult(state);state.votingPolicy='S11_OFFICIAL_V1';}
    if(!state.life02Composition&&!this.allowFixtures&&isS12DeckIds(people.map(p=>p.characterId)))state.gameplayPolicy=S12_GAMEPLAY_POLICY;
    if(!this.allowFixtures&&(isKnightClosedDeck(state)||state.gameplayPolicy===S12_GAMEPLAY_POLICY||isS15SedativeDeck(state)||isS15ExileDeck(state)||isS15RevealDeck(state)||isDeepVoteDeck(state)||isBreakStoneDeck(state)||isBreakExileDeck(state)||isContractDeck(state)||isSwapDeck(state)||jesterRevivalDomain(state)||bellRevivalDomain(state)||isFinalHunterDeck(state)||isFinalRevengeDeck(state)||isApprovedSingleWolfPackDeck(state)))state.votingPolicy='S11_OFFICIAL_V1';
    invariant(isApprovedRuleVersion(state.ruleVersion)||(!mirrorDeckIds(people.map(p=>p.characterId))&&!bellNewIds(people.map(p=>p.characterId))&&!isScaleLeaderDeckIds(people.map(p=>p.characterId))&&!revivalDeckIds(people.map(p=>p.characterId))&&!['25,28,37,74','25,28,33,74','25,48,74','25,39,76','5,10,25,74'].includes(people.map(p=>p.characterId).sort((a,b)=>a-b).join(','))),'RULE_UNRESOLVED','New deck requires approved rules');
    if(options.qaProfile){invariant(!this.allowFixtures&&liveEnabled()&&liveDeck(options.qaProfile,people.map(p=>p.characterId)),'RULE_UNRESOLVED','Invalid B/B QA setup');state.qaProfile=options.qaProfile;state.qaBbPolicyVersion=BB_FINAL_POLICY;if(state.qaProfile===LIVE_PACK){const r=allPlayerRepresentativeTape(state);state.qaRepresentativeOrder=r.order;state.qaRepresentativeTape=r.tape;state.qaRepresentativePolicy=ALL_PLAYER_POLICY;}}
    if(soulDeckIds(people.map(p=>p.characterId)))invariant(soulDeck(state)&&!this.allowFixtures,'RULE_UNRESOLVED','Soul lifecycle requires approved QA rules');
    // Only opt-in, existing bounded QA decks. No new policy on legacy/normal matches.
    if(ownerDcEnabled()&&!this.allowFixtures&&(soulDeck(state)||trapRevivalDomain(state)))state.qaOwnerDecisionPolicy=trapRevivalDomain(state)?OWNER_DC_SCOPE_S21:OWNER_DC_POLICY;
    if(isMixedExileDeck(state)||soulDeck(state))state.votingPolicy='S11_OFFICIAL_V1';
    validateState(state);
    this.repo.transaction(()=>this.repo.create(state));
    return clone(state);
  }
  private appendBellResults(state:GameState,events:PendingEvent[]){
    const dead=life02Domain(state)?events.filter(e=>e.eventType==='POST_ELIMINATION_CHAIN_CLOSED').map(e=>String(e.payload.victimId)):events.filter(e=>e.eventType==='PLAYER_ELIMINATED').map(e=>String(e.payload.playerId));
    for(const e of settleBell(state,dead))events.push({eventType:'S15_SCALE_BELL_OBSERVED',payload:{roleName:(life02Domain(state)?life02NameOverride(participant(state,e.targetId)):undefined)??this.knownCharacters.get(e.characterId)!.name},visibility:'PLAYER_PRIVATE',recipientId:e.recipientId,targetId:e.targetId,correlationId:e.actionId});
  }
  getInternalState(gameId:string):GameState {return clone(this.repo.get(gameId).state);}
  transition(gameId:string,next:Phase,expectedRevision?:number):GameState {
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);ensureRevision(state,expectedRevision);
      invariant(!state.resolutionGate||!['BLOCKED_BY_RULE','PENDING_EFFECT'].includes(state.resolutionGate.status),'RULE_UNRESOLVED','Resolution gate requires a verified continuation');
      invariant(!(prolongDomain(state)&&state.participants.some(p=>p.life==='PROLONGED')&&next==='NIGHT_COLLECT'),'PENDING_ACTIONS','Close day vote to settle prolonged lives');
      const nextState=transition(clone(state),next);
      // Match completion cannot silently choose winners: this is an administrative shell transition.
      if(next==='GAME_COMPLETED')throw new KernelError('RULE_UNRESOLVED','Victory predicates not implemented in Sprint 01');
      const events:PendingEvent[]=[{eventType:'PHASE_CHANGED',payload:{phase:next,round:nextState.round},visibility:'ROOM_PUBLIC',correlationId:`phase-${state.revision+1}`}];
      events.push(...soulRevivalEvents(state,nextState));
      if(next==='WITCH_WINDOW'&&(isDeepRescueDeck(state)||life02RescueDomain(state))){
       const witch=state.participants.find(p=>p.currentCharacterId===29&&['ALIVE','PENDING_DEATH'].includes(p.life));
       if(witch)events.push({eventType:'S15_DEEP_WITCH_PRELIMINARY',payload:{playerIds:pendingVictims(state).map(p=>p.playerId),round:state.round},visibility:'PLAYER_PRIVATE',recipientId:witch.playerId,correlationId:`witch-notice-${state.round}`});
      }
      if(next==='WITCH_WINDOW'&&pharmacistWindow(state)){const p=state.participants.find(p=>p.currentCharacterId===87)!;events.push({eventType:'S15_FINAL_PHARMACIST_PRELIMINARY',payload:{playerIds:pendingVictims(state).map(p=>p.playerId),round:state.round},visibility:'PLAYER_PRIVATE',recipientId:p.playerId,correlationId:`pharmacist-notice-${state.round}`});}
      if(next==='NIGHT_FINALIZE'&&isPreliminaryRescueDeck(state)&&state.phase==='WITCH_WINDOW'){
       invariant(this.repo.queued(gameId).length===0,'PENDING_ACTIONS','Resolve witch commands before final death');
       // Resolve against a WITCH_WINDOW clone; then advance atomically.
       nextState.phase='WITCH_WINDOW';
       const deaths=finalizePreliminary(nextState);nextState.phase='NIGHT_FINALIZE';
       for(const d of deaths){events.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:d.victimId},visibility:'ROOM_PUBLIC',targetId:d.victimId,correlationId:`dawn-${state.round}-${d.victimId}`},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:d.victimId,ruleId:d.ruleId,pendingEffects:0,sourceRules:d.ruleId===PACK_BITE_RULE?[isApprovedLeaderDeck(nextState)?'character.json#48':'character.json#93','character.json#87','VH64','VH74','VH03']:['character.json#29','Q13-12','VH03']},visibility:'SERVER_INTERNAL',correlationId:`dawn-${state.round}-${d.victimId}`});}
      }
      if(next==='NIGHT_FINALIZE'&&groupedNight(nextState)){invariant(this.repo.queued(gameId).length===0,'PENDING_ACTIONS','Resolve all accepted night actions before finalizing');closeNightGroups(nextState,events);}
      if(next==='NIGHT_FINALIZE'&&revivalDeck(nextState)){
       invariant(this.repo.queued(gameId).length===0,'PENDING_ACTIONS','Resolve accepted actions before revival closure');
       for(const revival of finalizeNightRevivals(nextState))events.push({eventType:'PLAYER_REVIVED',payload:{playerId:revival.playerId},visibility:'ROOM_PUBLIC',targetId:revival.playerId,correlationId:revival.actionId});
      }
      if(next==='NIGHT_FINALIZE'&&life02Domain(nextState)){
       if(life02RescueDomain(nextState)){
        invariant(this.repo.queued(gameId).length===0,'PENDING_ACTIONS','Resolve accepted rescue/poison actions before dawn');
        nextState.phase=state.phase;
        events.push(...finalizeLife02Attacks(nextState));this.appendBellResults(nextState,events);
        events.push(...resolveLife02NightWake(nextState));nextState.phase='NIGHT_FINALIZE';
       }
       if(full50Lifecycle(nextState))invariant(!nextState.participants.some(p=>p.life==='HIBERNATING'&&p.effects.some(e=>e.kind==='RC01_SLEEP'&&Number(e.payload?.wakeRound)<=nextState.round)),'PENDING_ACTIONS','Resolve due night wakes before dawn');
       events.push(...wakeLife02(nextState));
      }
      if(next==='DAY_DISCUSS'&&isS14ChatDeck(nextState))for(const p of nextState.participants)if(isS14PublicMuted(nextState,p.playerId))events.push({eventType:'PUBLIC_CHAT_MUTED',payload:{playerId:p.playerId},visibility:'ROOM_PUBLIC',correlationId:`mute-${nextState.round}-${p.playerId}`});
      this.commit(state,nextState,events);return clone(nextState);
    });
  }
  submit(a:GameAction):{status:'ACCEPTED'|'RESOLVED'|'CANCELLED';actionId:string;duplicate:boolean;privateRefreshIds?:string[]}{
    try{return this.repo.transaction(()=>{
      const {state}=this.repo.get(a.gameId);
      invariant(a.ruleVersion===state.ruleVersion,'INVALID_ARGUMENT','Wrong ruleset version');
      const fingerprint=hash(a);
      const existing=this.repo.actionByKey(a.gameId,a.playerId,a.idempotencyKey);
      if(existing){
        invariant(existing.fingerprint===fingerprint,'IDEMPOTENCY_CONFLICT','Idempotency key reused with a different command');
        return {status:existing.status as 'ACCEPTED'|'RESOLVED'|'CANCELLED',actionId:existing.action.actionId,duplicate:true};
      }
      invariant(!this.repo.actionById(a.gameId,a.actionId),'IDEMPOTENCY_CONFLICT','Action ID reused with a different key');
      invariant(liveSkillAllowed(state,a.skillId),'RULE_UNRESOLVED','Skill outside isolated B/B pack QA scenario');
      const adapter=this.registry.get(a.skillId,state.ruleVersion);
      if(!this.allowFixtures && adapter.ruleId.startsWith('TEST_FIXTURE_'))throw new KernelError('RULE_UNRESOLVED','Test fixtures are disabled in production');
      const reserved=adapter.cost?this.repo.reserved(a.gameId,a.playerId,adapter.cost.name):0;
      const usage=this.repo.skillUsage(a.gameId,a.playerId,a.skillId,a.round,a.phase);
      const accepted=validateAction(state,a,adapter,reserved,usage);
      adapter.validateSubmission?.(state,a);
      this.repo.storeAction(a,fingerprint,accepted.costName,accepted.costAmount);
      const events:PendingEvent[]=[{eventType:'ACTION_ACCEPTED',payload:{actionId:a.actionId},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId}];
      if(a.skillId===REVENGE_SKILL||a.skillId===REVENGE_SKIP){
        const next=clone(state),secondary=settleRevenge(next,a);
        const sourceRules=['character.json#33','VH03','VH65'];
        if(secondary){
         events.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:secondary},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
         if(isRevengeHunterDeck(next)){
          const follow=resolveFinalHunterFollow(next,secondary);
          if(follow.secondaryId)events.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:follow.secondaryId},visibility:'ROOM_PUBLIC',correlationId:a.actionId},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:follow.secondaryId,ruleId:'S15_FINAL_HUNTER_FOLLOW',pendingEffects:0,sourceRules:follow.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
         }
         events.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:secondary,ruleId:'S15_FINAL_CHAR_33_REVENGE',pendingEffects:0,sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
        }
        const chain={victimId:a.playerId,ruleId:'S11-V03',pendingEffects:0,sourceRules};
        events.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:chain,visibility:'SERVER_INTERNAL',correlationId:a.actionId});
        const verdict=resolveHangingVictory(next,a.playerId,chain,[...this.repo.events(a.gameId),...events]);
        // All remaining villagers have no certified victory predicate; do not invent one.
        next.resolutionGate={status:'BLOCKED_BY_RULE',round:next.round,reason:'E02: NO_MATCHING_CERTIFIED_PREDICATE'};
        if(isApprovedRuleVersion(next.ruleVersion)){
         if(verdict.kind==='WINNER_VERIFIED'){next.phase='GAME_COMPLETED';next.completed=true;next.winnerIds=verdict.winnerIds;next.resolutionGate={status:'GAME_COMPLETED',round:next.round};events.push({eventType:'MATCH_COMPLETED',payload:{winnerIds:next.winnerIds},visibility:'ROOM_PUBLIC',correlationId:a.actionId});}
         else {invariant(verdict.blocker==='NO_MATCHING_CERTIFIED_PREDICATE','RULE_UNRESOLVED','Revenge closure is not stable');if(next.participants.some(p=>p.life==='ALIVE'&&p.currentCharacterId===28)&&next.participants.some(p=>p.life==='ALIVE'&&p.currentFaction==='dan')&&!next.participants.some(p=>p.life==='ALIVE'&&p.currentFaction==='soi')){Object.assign(next,transition(next,'NIGHT_COLLECT'));next.resolutionGate={status:'CONTINUE',round:next.round};}}
         events.push({eventType:'PHASE_CHANGED',payload:{phase:next.phase,round:next.round},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
        }else invariant(verdict.kind==='NOT_YET'&&verdict.blocker==='NO_MATCHING_CERTIFIED_PREDICATE','RULE_UNRESOLVED','Revenge closure is not stable or winner outside certified domain');
        events.push({eventType:'VICTORY_EVALUATED',payload:verdict,visibility:'SERVER_INTERNAL',correlationId:a.actionId},{eventType:'RESOLUTION_GATE',payload:next.resolutionGate,visibility:'SERVER_INTERNAL',correlationId:a.actionId},{eventType:'ACTION_RESOLVED',payload:{actionId:a.actionId},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
        const seq=this.commit(state,next,events);this.repo.markAction(a.gameId,a.actionId,'RESOLVED',seq);
        return {status:'RESOLVED',actionId:a.actionId,duplicate:false,privateRefreshIds:next.participants.map(p=>p.playerId)};
      }
      if(isImmediateContract(a.skillId)){
        const next=clone(state),privateEvents=applyContract(next,a);for(const e of privateEvents)events.push({...e,visibility:'PLAYER_PRIVATE',correlationId:a.actionId});
        events.push({eventType:'ACTION_RESOLVED',payload:{actionId:a.actionId},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
        const seq=this.commit(state,next,events);this.repo.markAction(a.gameId,a.actionId,'RESOLVED',seq);return {status:'RESOLVED',actionId:a.actionId,duplicate:false,privateRefreshIds:[...new Set([a.playerId,...privateEvents.map(e=>e.recipientId)])]};
      }
      this.commit(state,clone(state),events);
      return {status:'ACCEPTED',actionId:a.actionId,duplicate:false};
    });}catch(e){
      if(e instanceof KernelError) this.safeAudit(a.gameId,a.actionId,e.code,e.message);
      throw e;
    }
  }
  submitLivePack(gameId:string,actorId:string,cmd:{key:string;expectedRevision:number;targets:string[]}){
    return this.repo.transaction(()=>{const {state}=this.repo.get(gameId);invariant(liveEnabled()&&state.qaProfile===LIVE_PACK&&state.phase==='NIGHT_COLLECT','RULE_UNRESOLVED','B/B pack QA only');const c=packContext(state);invariant(c.entitlement.wolfIds.includes(actorId),'UNAUTHORIZED','Not an eligible pack member');const p=currentPack(state);const prior=p.entries.find(x=>x.actorId===actorId&&x.key===cmd.key);if(!prior)invariant(cmd.expectedRevision===p.revision,'REVISION_CONFLICT','Stale pack revision');let r;try{r=submitPack(p,c,actorId,cmd);}catch(e){throw new KernelError(prior?'IDEMPOTENCY_CONFLICT':'TARGET_INVALID',String((e as Error).message));}if(!r.duplicate){const next=clone(state);next.qaPack=r.state;this.commit(state,next,[{eventType:'BB_QA_PACK_SELECTION',payload:{targets:cmd.targets},visibility:'PLAYER_PRIVATE',recipientId:actorId,correlationId:cmd.key}]);}return {duplicate:r.duplicate,packRevision:r.state.revision,refresh:c.entitlement.wolfIds};});
  }
  lockLivePack(gameId:string){return this.repo.transaction(()=>{const {state}=this.repo.get(gameId);invariant(liveEnabled()&&state.qaProfile===LIVE_PACK&&state.phase==='NIGHT_COLLECT','RULE_UNRESOLVED','B/B pack QA only');const p=currentPack(state),next=clone(state);const locked=lockPack(p,packContext(state),p.revision);next.qaPack=locked;this.commit(state,next,[{eventType:'BB_QA_PACK_LOCK_ATTEMPT',payload:{kind:locked.result?.kind},visibility:'SERVER_INTERNAL',correlationId:`bb-pack-lock-${state.round}-${state.revision}`}]);return locked.result?.kind;});}
  resolve(gameId:string,openPoisonWindow=false):{resolved:number;cancelled:number;randomDraws:number;revision:number}{
    try{return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);
      invariant(state.phase==='NIGHT_RESOLVE'||state.phase==='DAY_RESOLVE'||state.phase==='DAY_VOTE_COLLECT'||state.phase==='WITCH_WINDOW'||(state.phase==='DAY_DISCUSS'&&s15GuardShotReady(state)),'OUT_OF_PHASE','Phase is not resolving');
      invariant(!openPoisonWindow||groupedNight(state)&&liveWitchDomain(state)&&state.phase==='WITCH_WINDOW'&&!state.qaNightWindow,'RULE_UNRESOLVED','Separate rescue window unavailable');
      const queued=this.repo.queued(gameId).filter(i=>!openPoisonWindow||i.action.skillId===WITCH_RESCUE);
      if(state.phase==='DAY_DISCUSS')invariant(queued.length===1&&queued[0]?.action.skillId===S13_SKILLS.guardShot,'RULE_UNRESOLVED','Only a pending Guard shot may resolve before vote');
      if(life02Domain(state)&&state.participants.some(p=>p.initialCharacterId===27)&&state.round===1&&state.phase==='NIGHT_RESOLVE')invariant(state.participants.some(p=>p.effects.some(e=>e.kind===CUPID_USED))||queued.some(i=>i.action.skillId===CUPID_SKILL),'RULE_UNRESOLVED','RC01 requires first-night Cupid action; AFK fallback not implemented');
      if(queued.length===0&&!packTurnRequired(state)&&!openPoisonWindow){
       const next=clone(state),wake=life02RescueDomain(next)?[]:resolveLife02NightWake(next);
       if(wake.length)this.commit(state,next,wake);
       return {resolved:0,cancelled:0,randomDraws:0,revision:next.revision};
      }
      // Preflight all rules before a single effect or resource is applied.
      const prepared=queued.map(item=>({item,rule:this.registry.get(item.action.skillId,state.ruleVersion)}));
      const ordered=orderResolutionActions(state,prepared);
      if(state.qaProfile===LIVE_TRAP){const placement=queued.find(i=>i.action.skillId==='official.10.trap');invariant(!placement||!queued.some(i=>i.action.skillId===SUPPORT_SKILLS[31]&&i.action.playerId===placement.action.targetIds[0]),'RULE_UNRESOLVED','Same-night trap and guard ordering not admitted in QA');}
      if(trapRevivalDomain(state)){
        const placement=queued.find(i=>i.action.skillId==='official.10.trap');
        invariant(!queued.some(i=>(i.action.skillId===KNIGHT_SKILL||i.action.skillId==='official.26.revive'&&!ownerDc(state))&&(participant(state,i.action.playerId).effects.some(e=>e.kind===ENGINEER_MARK)||placement?.action.targetIds.includes(i.action.playerId))),'RULE_UNRESOLVED','Combined QA: unsupported trap inversion class');
      }
      const next=clone(state),pending:PendingEvent[]=[],randomTape:RandomRecord[]=[];
      let resolved=0,cancelled=0;
      const potionGroups=new Map<string,{markId:string;actionIds:string[]}>();
      for(const {item,rule} of ordered){
        const a=item.action;
        if(cancelledByPeace(next)){
          pending.push({eventType:'ACTION_CANCELLED',payload:{actionId:a.actionId,reason:'PH_02_VOTE_CANCELLED'},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
          cancelled++;continue;
        }
        if(!this.allowFixtures && rule.ruleId.startsWith('TEST_FIXTURE_'))throw new KernelError('RULE_UNRESOLVED','Test fixture resolver disabled');
        const check=canResolveAccepted(next,a,rule);
        if(check==='LOCKED'){
          pending.push({eventType:'ACTION_CANCELLED',payload:{actionId:a.actionId,reason:'SKILL_LOCKED'},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
          cancelled++;continue;
        }
        invariant(!(liveWitchDomain(next)&&a.skillId===KNIGHT_SKILL&&participant(next,a.playerId).effects.some(x=>x.kind===ENGINEER_MARK)),'RULE_UNRESOLVED','Unverified B/B interaction in this QA scenario');
        const ctx=makeRuleContext(next,a,randomTape);
        const groupMark=groupedNight(next)&&['official.25.inspect-role','official.74.inspect-role','official.5.weigh-soul',SUPPORT_SKILLS[31],WITCH_RESCUE,S13_SKILLS.witchPoison,...(ownerDc(next)&&trapRevivalDomain(next)?['official.26.revive']:[])].includes(a.skillId)?participant(next,a.playerId).effects.find(x=>x.kind===ENGINEER_MARK):undefined;
        const effects=rule.evaluate(next,a,ctx);
        invariant(Array.isArray(effects),'RULE_UNRESOLVED','Resolver returned no valid effect list');
        if(rule.cost){
          const actor=participant(next,a.playerId);
          invariant((actor.resources[rule.cost.name]??0)>=rule.cost.amount,'RESOURCE_INSUFFICIENT','Insufficient resource at resolution');
          actor.resources[rule.cost.name]-=rule.cost.amount;
          pending.push({eventType:'RESOURCE_CHARGED',payload:{name:rule.cost.name,amount:rule.cost.amount,actionId:a.actionId},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
        }
        for(const e of effects){
          if(liveWitchDomain(next)&&next.phase==='WITCH_WINDOW'&&[WITCH_RESCUE,S13_SKILLS.witchPoison].includes(a.skillId as typeof WITCH_RESCUE|typeof S13_SKILLS.witchPoison)){
            const mark=participant(next,a.playerId).effects.find(x=>x.kind===ENGINEER_MARK);
            if(mark){
              invariant(effects.length===1&&Number(mark.payload?.round)<next.round,'RULE_UNRESOLVED','Only a staged single-window potion group is supported');
              const died=applyLiveInvertedWitch(next,a,e);if(!groupedNight(next)){const group=potionGroups.get(a.playerId)??{markId:mark.id,actionIds:[]};group.actionIds.push(a.actionId);potionGroups.set(a.playerId,group);}
              pending.push({eventType:'BB_QA_INVERTED_POTION',payload:{markId:mark.id,skillId:a.skillId,targetId:e.targetId},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
              if(died&&openPoisonWindow)deferInvertedRescueDeath(next,e.targetId,a.actionId,pending);
              else if(died)pending.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:e.targetId},visibility:'ROOM_PUBLIC',correlationId:a.actionId},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:e.targetId,pendingEffects:0,ruleId:'BB-04/INVERTED_RESCUE',sourceRules:['character.json#10','BB-04','BB-05','VH03']},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
              continue;
            }
          }
          if(next.qaProfile===LIVE_TRAP&&a.skillId===SUPPORT_SKILLS[31]&&participant(next,a.playerId).effects.some(x=>x.kind===ENGINEER_MARK)){
            invariant(effects.length===1,'RULE_UNRESOLVED','Multiple guard effects not admitted');const c=commitLiveInvertedGuard(next,a,e,[...this.repo.events(gameId),...pending]);Object.assign(next,c.state);for(const [i,ev] of c.events.entries())pending.push({...ev,correlationId:`bb-guard-${a.actionId}-${i}`});continue;
          }
          if(life02Domain(next)&&[SEED_SKILL,CUPID_SKILL,PROLONG_SKILL,KNIGHT_SKILL].includes(a.skillId)){
            if(a.skillId===KNIGHT_SKILL){invariant(e.type==='DEATH_TRANSITION'&&e.key===KNIGHT_RULE&&e.targetId===a.targetIds[0],'RULE_UNRESOLVED','Invalid knight provenance');if(life02RescueDomain(next))queueLife02Attack(next,e.targetId,a.actionId,KNIGHT_RULE);else pending.push(...resolveLife02Lethal(next,e.targetId,a.actionId,KNIGHT_RULE));}
            else pending.push(...applyLife02Skill(next,e,a));
            next.effects.push({id:`fx-${a.actionId}-${next.effects.length}`,type:e.type,targetId:e.targetId,sourceActionId:a.actionId});continue;
          }
          const route=resolveEffectRoute(rule,a),category=route.category;
          const official=category==='inspection',support=category==='support',peace=category==='peace',knight=category==='knight',judgment=category==='judgment',nightmare=category==='nightmare',s13=category==='s13';
          const mageLayers=(knight||S14_ATTACKS.includes(a.skillId))?participant(next,e.targetId).effects.filter(x=>x.kind===S13_STATUS.mageShield&&x.expiresAtRound===next.round):[];
          const outcome=route.apply(next,e,a);
          if(category==='cult'){
           const cultPayload=outcome.payload as Record<string,unknown>;const success=cultPayload.success===true;
           pending.push({eventType:outcome.type,payload:{actionId:a.actionId,success},visibility:'PLAYER_PRIVATE',recipientId:a.playerId,correlationId:a.actionId});
           if(a.skillId===CULT_RECRUIT&&success)pending.push({eventType:'CULT_RECRUITED',payload:{message:'Bạn đã gia nhập giáo phái.'},visibility:'PLAYER_PRIVATE',recipientId:e.targetId,correlationId:a.actionId});
           if(a.skillId!==CULT_RECRUIT&&success)for(const id of cultPayload.deaths as string[])pending.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:id},visibility:'ROOM_PUBLIC',correlationId:a.actionId},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:id,pendingEffects:0,ruleId:'WV-CH90-S02',sourceRules:['character.json#90','VH50','VH55','VH03']},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
           next.effects.push({id:`fx-${a.actionId}-${next.effects.length}`,type:e.type,targetId:e.targetId,sourceActionId:a.actionId});continue;
          }
          // L02/VH07: Public death name only. Never include actor, skill, role or cause.
          const s14Death=s13&&(S14_ATTACKS.includes(a.skillId)||a.skillId===S13_SKILLS.stone||a.skillId===DOG_THIEF_SKILL||isPackBiteSkill(a.skillId))&&outcome.type==='PLAYER_ELIMINATED';
          const blockedAttack=knight&&outcome.type==='OFFICIAL_ATTACK_BLOCKED';
          const preliminary=outcome.type==='S15_DEEP_PRELIMINARY_QUEUED';
          const publicReveal=outcome.type==='S15_PUBLIC_ROLE_REVEALED';
          const visibility=outcome.type==='SOUL_FINAL_DEATH'?'SERVER_INTERNAL':s13&&(outcome.type==='S13_DAY_JUDGMENT_REVEALED'||publicReveal)?'ROOM_PUBLIC':(s14Death||e.type==='DEATH_TRANSITION'&&knight&&!blockedAttack&&!preliminary)?'ROOM_PUBLIC':e.type==='INFORMATION_RESULT'||outcome.type==='S15_GROWTH_DOG_THIEF_MISS'||a.skillId===WITCH_RESCUE||a.skillId===PHARMACIST_RESCUE?'PLAYER_PRIVATE':'SERVER_INTERNAL';
          pending.push({eventType:outcome.type,payload:publicReveal?{playerId:e.targetId,roleName:this.knownCharacters.get(participant(next,e.targetId).currentCharacterId)!.name}:knight||s14Death?outcome.payload:{...outcome.payload,actionId:a.actionId},visibility,
            actorId:knight||s14Death||publicReveal?undefined:a.playerId,targetId:e.targetId,recipientId:e.recipientId,correlationId:a.actionId});
          // A successful shield is the one actually consumed, not merely submitted.
          if(outcome.type==='OFFICIAL_ATTACK_BLOCKED')for(const layer of mageLayers){
           if(!layer.sourceId||participant(next,e.targetId).effects.some(x=>x.id===layer.id))continue;
           const shieldActionId=String(layer.payload?.shieldActionId);
           pending.push({eventType:'S15_MAGE_SHIELD_REVEAL',payload:{characterId:participant(next,e.targetId).currentCharacterId,skillId:S13_SKILLS.mageShield,actionId:shieldActionId},visibility:'PLAYER_PRIVATE',recipientId:layer.sourceId,actorId:layer.sourceId,targetId:e.targetId,correlationId:shieldActionId});
          }
          if(a.skillId===S13_SKILLS.numb||a.skillId===S13_SKILLS.exile)pending.push({eventType:'SKILL_LOCK_NOTICE',payload:{message:'Đêm nay bạn không thể sử dụng kỹ năng.'},visibility:'PLAYER_PRIVATE',recipientId:e.targetId,correlationId:a.actionId});
          if(a.skillId===S13_SKILLS.judgment&&isS14PublicMuted(next,a.playerId))pending.push({eventType:'PUBLIC_CHAT_MUTED',payload:{playerId:a.playerId},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
          if(e.type==='BLOCK'&&outcome.type!=='OFFICIAL_NIGHTMARE_RESISTED'&&(nightmare||(support&&a.skillId===SUPPORT_SKILLS[34]))) {
           pending.push({eventType:'SKILL_LOCK_NOTICE',payload:{message:'Đêm nay bạn không thể sử dụng kỹ năng.'},
            visibility:'PLAYER_PRIVATE',recipientId:e.targetId,correlationId:a.actionId});
          }
          if((s14Death||knight&&!blockedAttack)&&next.phase==='NIGHT_RESOLVE'&&isS15ViolinDeck(next)){
           const victim=participant(next,e.targetId);
           victim.effects.push({id:`s15-death-fact-${a.actionId}`,kind:S13_STATUS.deathFact,payload:{round:next.round,faction:victim.currentFaction,sourceRule:'VH49,VH53'}});
          }
          if(knight&&blockedAttack&&'redirectVictimId' in outcome.payload){
           const id=String(outcome.payload.redirectVictimId);
           const changed=transitionExileAfterDeath(next,id);if(changed)pending.push({eventType:'S15_BREAK_ALIGNMENT_CHANGED',payload:{faction:'soi'},visibility:'PLAYER_PRIVATE',recipientId:changed.playerId,correlationId:a.actionId});
           pending.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:id},visibility:'ROOM_PUBLIC',targetId:id,correlationId:a.actionId});
           pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:id,pendingEffects:0,ruleId:'S15_DEEP_REDIRECT',sourceRules:outcome.payload.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
          }
          if(knight&&blockedAttack&&'counterVictimId' in outcome.payload){
           const counterId=String(outcome.payload.counterVictimId);
           pending.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:counterId},visibility:'ROOM_PUBLIC',targetId:counterId,correlationId:a.actionId});
           pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:counterId,pendingEffects:0,ruleId:'S15_CHAR_77_TRAP',sourceRules:['VH51','VH03']},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
          }
          if(outcome.type==='SOUL_FINAL_DEATH'){pending.push({eventType:'SOUL_FINAL_DEATH_CLOSED',payload:{victimId:e.targetId,ruleId:rule.ruleId,sourceRules:['LIFE-01','VH82','VH03']},visibility:'SERVER_INTERNAL',correlationId:a.actionId});}
          if(s14Death){
           if(a.skillId===S13_SKILLS.stone)pending.push({eventType:'S14_STONE_ROLE_REVEALED',payload:{playerId:a.playerId,roleName:'Ná Thủ'},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
           pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:e.targetId,pendingEffects:0,ruleId:rule.ruleId,sourceRules:isPackBiteSkill(a.skillId)?[`character.json#${rule.characterId}`,...(a.skillId===MIRROR_BITE?['VH11','WIN-03']:['VH74']),'VH03']:a.skillId===DOG_THIEF_SKILL?['character.json#39','VH17','VH18','VH03']:[`character.json#${rule.characterId}`,'character.json#25','VH03']},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
          }
          if(knight&&!blockedAttack&&!preliminary&&outcome.type!=='SOUL_FINAL_DEATH'){
           const changed=transitionExileAfterDeath(next,e.targetId);if(changed)pending.push({eventType:'S15_BREAK_ALIGNMENT_CHANGED',payload:{faction:'soi'},visibility:'PLAYER_PRIVATE',recipientId:changed.playerId,correlationId:a.actionId});
           pending.push({eventType:'VERIFIED_ELIMINATION_AUDIT',payload:{actionId:a.actionId,actorId:a.playerId,targetId:e.targetId,sourceRules:['character.json#8','L02','VH03']},
            visibility:'SERVER_INTERNAL',correlationId:a.actionId});
           if(isS14DeathDeck(next)){
            const follow=resolveS14DeathFollow(next,e.targetId);
            if(follow.blockedTargetId)pending.push({eventType:'S15_CLOSURE_FOLLOW_BLOCKED',payload:{primaryId:e.targetId,targetId:follow.blockedTargetId,layerId:follow.layerId,sourceRules:follow.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
            if(follow.secondaryId){
             pending.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:follow.secondaryId},visibility:'ROOM_PUBLIC',targetId:follow.secondaryId,correlationId:a.actionId});
             pending.push({eventType:'S14_DEATH_FOLLOW_AUDIT',payload:{primaryId:e.targetId,secondaryId:follow.secondaryId,sourceRules:follow.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
             pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:follow.secondaryId,ruleId:'S14_DEATH_FOLLOW',pendingEffects:0,sourceRules:follow.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
            }
            pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:e.targetId,ruleId:KNIGHT_RULE,pendingEffects:0,sourceRules:follow.sourceRules},visibility:'SERVER_INTERNAL',correlationId:a.actionId});
           }else{
           const chain=isS13AttackDeck(next)?{victimId:e.targetId,ruleId:KNIGHT_RULE,stage:'POST_ELIMINATION_CLOSED',pendingEffects:0,sourceRules:['character.json#8',`character.json#${participant(next,e.targetId).currentCharacterId}`,'S13_SINGLE_VICTIM']}:certifyKnightPostElimination(next,e.targetId);
           pending.push({eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:chain as unknown as Record<string,unknown>,
            visibility:'SERVER_INTERNAL',correlationId:a.actionId});
           }
          }
          next.effects.push({id:`fx-${a.actionId}-${next.effects.length}`,type:outcome.type==='OFFICIAL_ATTACK_BLOCKED'?'DAMAGE':e.type,targetId:e.targetId,sourceActionId:a.actionId});
          if(peace){
           pending.push({eventType:'VOTING_CANCELLED',payload:{round:next.round,sourceRule:'PH-02'},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
           pending.push({eventType:'VOTE_OUTCOME_CONFIRMED',payload:{round:next.round,outcome:'CANCELLED_NO_ELIMINATION'},visibility:'ROOM_PUBLIC',correlationId:a.actionId});
          }

          // Closed-deck official passive interaction. Never reused for other
          // inspections or presumed to apply to other wolves/role categories.
          if((official && ['ROLE_OBSERVED','SEER_AURA_OBSERVED'].includes(outcome.type))||(judgment&&outcome.type==='SOUL_JUDGMENT_OBSERVED')){
            const response=onOfficialInspectionResolved(next,a,e.targetId);
            if(response)pending.push({eventType:'OFFICIAL_INJURY_SCHEDULED',
              payload:{ruleId:response.ruleId,activeRound:response.activeRound,actionId:a.actionId},
              visibility:'SERVER_INTERNAL',actorId:response.injuredPlayerId,
              correlationId:a.actionId});
          }
        }
        if(groupMark)recordNightAction(next,a,groupMark,pending,openPoisonWindow?'WITCH_RESCUE':undefined);
        if(!groupedNight(next)&&next.qaProfile===LIVE_TRAP&&['official.25.inspect-role','official.74.inspect-role','official.5.weigh-soul',SUPPORT_SKILLS[31]].includes(a.skillId)){
          const actor=participant(next,a.playerId);const mark=actor.effects.find(x=>x.kind===ENGINEER_MARK);if(mark){actor.effects=actor.effects.filter(x=>x.id!==mark.id);pending.push({eventType:'BB_QA_TRAP_CONSUMED',payload:{markId:mark.id,actionId:a.actionId},visibility:'SERVER_INTERNAL',correlationId:a.actionId});}
        }
        pending.push({eventType:'ACTION_RESOLVED',payload:{actionId:a.actionId},visibility:'SERVER_INTERNAL',actorId:a.playerId,correlationId:a.actionId});
        resolved++;
      }
      for(const [actorId,group] of potionGroups){const actor=participant(next,actorId);actor.effects=actor.effects.filter(x=>x.id!==group.markId);pending.push({eventType:'BB_QA_TRAP_CONSUMED',payload:{markId:group.markId,actionIds:group.actionIds},visibility:'SERVER_INTERNAL',correlationId:`bb-potion-group-${next.round}-${actorId}`});}
      if(next.phase==='NIGHT_RESOLVE'&&next.participants.map(p=>p.initialCharacterId).sort((a,b)=>a-b).join(',')==='25,66,67'){
       const guard=next.participants.find(p=>p.currentCharacterId===66&&p.life==='ALIVE');
       if(guard){
        const protectedIds=[...new Set(pending.filter(e=>e.eventType==='S13_OFFICIAL_EFFECT_APPLIED'&&e.payload.kind===S13_STATUS.smith&&e.actorId!==guard.playerId&&e.targetId).map(e=>e.targetId!))].sort();
        if(protectedIds.length)pending.push({eventType:'S15_GUARD_OBSERVED',payload:{playerIds:protectedIds,round:next.round},visibility:'PLAYER_PRIVATE',recipientId:guard.playerId,correlationId:`s15-guard-${next.round}`});
       }
      }
      if(packTurnRequired(next)&&next.phase==='NIGHT_RESOLVE'){
        const pack=next.qaPack as PackState;invariant(pack?.locked,'PENDING_ACTIONS','Pack is not locked');const c=commitCandidatePack(pack,next,[...this.repo.events(gameId),...pending]);Object.assign(next,c.state);for(const [i,e] of c.events.entries())pending.push({...e,correlationId:`bb-pack-${state.round}-${i}`});
      }
      if(openPoisonWindow){next.qaNightWindow='WITCH_POISON';pending.push({eventType:'BB_QA_WITCH_WINDOW_OPENED',payload:{round:next.round,window:'WITCH_POISON'},visibility:'ROOM_PUBLIC',correlationId:`bb-witch-window-${next.round}`});}
      this.appendBellResults(next,pending);
      if(!life02RescueDomain(next))pending.push(...resolveLife02NightWake(next));
      for(const draw of randomTape){pending.push({eventType:'RANDOM_DRAWN',payload:{draw:draw as unknown as Record<string,unknown>},visibility:'SERVER_INTERNAL',correlationId:draw.correlationId});this.repo.saveDraw(gameId,draw);}
      const finalSeq=this.commit(state,next,pending);
      for(const {item} of ordered){
        const cancelledIds=pending.filter(e=>e.eventType==='ACTION_CANCELLED').map(e=>e.payload.actionId);
        this.repo.markAction(gameId,item.action.actionId,cancelledIds.includes(item.action.actionId)?'CANCELLED':'RESOLVED',finalSeq);
      }
      return {resolved,cancelled,randomDraws:randomTape.length,revision:next.revision};
    });}catch(e){
      if(e instanceof KernelError)this.safeAudit(gameId,undefined,e.code,e.message);
      throw e;
    }
  }
  /** Only public target constraints; no private role-based eligibility is exposed. */
  publicTargetPolicy(gameId:string,skillId:string){const state=this.repo.get(gameId).state;return {...this.registry.get(skillId,state.ruleVersion).target,...((soulDeck(state)||life02Domain(state)&&full50Lifecycle(state))&&skillId===KNIGHT_SKILL?{aliveOnly:false}:{})};}
  mediumChatProjection(gameId:string,playerId:string){return mediumChatView(this.repo.get(gameId).state,playerId,this.repo.events(gameId));}
  sendMediumChat(gameId:string,playerId:string,body:unknown){
    return this.repo.transaction(()=>{const {state}=this.repo.get(gameId);participant(state,playerId);const prepared=prepareMediumChat(state,this.repo.events(gameId),playerId,body);
      if(!prepared.duplicate){if(prolongDomain(state))new EventLedger(this.repo).append(gameId,state.ruleVersion,prepared.events);else this.commit(state,clone(state),prepared.events);}
      return {duplicate:prepared.duplicate,revision:state.revision+(prepared.duplicate||prolongDomain(state)?0:1),privateRefreshIds:prepared.refresh};});
  }
  systemGroupChatProjection(gameId:string,playerId:string){return systemGroupChatView(this.repo.get(gameId).state,playerId);}
  /** Group text changes no gameplay state or action revision. Ledger append is
   * transactional and replay-verified; private activity must not conflict with
   * an unrelated player's optimistic gameplay command. */
  sendSystemGroupChat(gameId:string,playerId:string,body:unknown){
    return this.repo.transaction(()=>{const {state}=this.repo.get(gameId);validateSystemChatGroups(state);
      const prepared=prepareSystemGroupChat(state,this.repo.events(gameId),playerId,body);
      if(!prepared.duplicate)new EventLedger(this.repo).append(gameId,state.ruleVersion,prepared.events);
      return {duplicate:prepared.duplicate,revision:state.revision,privateRefreshIds:prepared.refresh};});
  }
  /** Restricted public discussion only. No assumed wolf/dead/anonymous channel rights. */
  sendPublicChat(gameId:string,playerId:string,text:unknown,messageId:unknown){
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);participant(state,playerId);
      invariant(publicChatEnabled(state),'RULE_UNRESOLVED','Public chat requires an approved official deck');
      invariant(typeof text==='string'&&text.trim().length>0&&text.length<=500&&typeof messageId==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(messageId),'INVALID_ARGUMENT','Invalid chat message');
      const previous=this.repo.events(gameId).filter(e=>e.eventType==='GAME_PUBLIC_CHAT'&&e.actorId===playerId);
      const retry=previous.find(e=>e.correlationId===messageId);
      if(retry){invariant(retry.payload.text===text.trim(),'IDEMPOTENCY_CONFLICT','Chat key reused');return {duplicate:true,revision:state.revision};}
      invariant(!state.completed&&state.phase==='DAY_DISCUSS','OUT_OF_PHASE','Public discussion not open');
      invariant(publicChatView(state,playerId)?.canSend,'UNAUTHORIZED','Public chat unavailable');
      invariant(previous.filter(e=>Date.now()-e.timestamp<10000).length<5,'RESOURCE_INSUFFICIENT','Chat rate limit');
      const audience=state.participants.filter(p=>p.life==='ALIVE'||life02Domain(state)&&p.life==='PROLONGED').map(p=>p.playerId);
      this.commit(state,clone(state),[{eventType:'GAME_PUBLIC_CHAT',payload:{text:text.trim(),round:state.round},visibility:'GROUP_RESTRICTED',audience,actorId:playerId,correlationId:messageId}]);
      return {duplicate:false,revision:state.revision+1};
    });
  }
  /** Certified match-completion decks: exact {8,25} or {8,28},
   * knight attack actually committed, all actions resolved, no other alive/pending
   * people or links, and no outstanding chain. Never used for general Wolvesville.
   */
  completeVerifiedKnightSolo(gameId:string,expectedRevision?:number):{completed:boolean;winnerIds:string[];revision:number;resolutionStatus?:NonNullable<GameState['resolutionGate']>['status']}{
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);ensureRevision(state,expectedRevision);
      const verdict=resolveCertifiedVictory(state,this.repo.events(gameId),this.repo.queued(gameId).length);
      const gate=cultDeck(state)?(verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED' as const,round:state.round}:cultWin(state)?.unresolvedDeadFollowers?{status:'BLOCKED_BY_RULE' as const,round:state.round,reason:'CULT_DEAD_WINNER_POLICY_UNRESOLVED'}:verdict.blocker==='NO_MATCHING_CERTIFIED_PREDICATE'?{status:'CONTINUE' as const,round:state.round}:{status:'PENDING_EFFECT' as const,round:state.round,reason:verdict.blocker}):isFinalHunterDeck(state)?(verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED' as const,round:state.round}:verdict.blocker!=='NO_MATCHING_CERTIFIED_PREDICATE'?{status:'PENDING_EFFECT' as const,round:state.round,reason:verdict.blocker}:canContinueFinalHunter(state)?{status:'CONTINUE' as const,round:state.round}:{status:'BLOCKED_BY_RULE' as const,round:state.round,reason:'E02: NO_MATCHING_CERTIFIED_PREDICATE'}):isS12ClosedDeck(state)?classifyS12Resolution(state,verdict):(isBreakStoneDeck(state)||isBreakExileDeck(state)||isApprovedSingleWolfPackDeck(state))?classifyBreakResolution(state,verdict):undefined;
      if(verdict.kind!=='WINNER_VERIFIED'){
        if(gate){const next=clone(state);next.resolutionGate=gate;this.commit(state,next,[{eventType:'RESOLUTION_GATE',payload:gate,visibility:'SERVER_INTERNAL',correlationId:`gate-${state.revision+1}`}]);return {completed:false,winnerIds:[],revision:next.revision,resolutionStatus:gate.status};}
        return {completed:false,winnerIds:[],revision:state.revision};
      }
      const next=transition(state,'GAME_COMPLETED');next.winnerIds=[...verdict.winnerIds];if(gate)next.resolutionGate=gate;
      this.commit(state,next,[{eventType:'MATCH_COMPLETED',payload:{winnerIds:[...verdict.winnerIds]},
        visibility:'ROOM_PUBLIC',correlationId:`verified-end-${state.revision+1}`},
       {eventType:'MATCH_COMPLETION_AUDIT',payload:{winnerIds:[...verdict.winnerIds],reason:verdict.predicateId==='WV_CHAR_39_CAPTURE_MAJORITY'?'CAPTURE_MAJORITY_VERIFIED':verdict.predicateId==='WV_CHAR_8_SOLE_SURVIVOR'?'SOLE_SURVIVOR_KNIGHT':'SOLE_SURVIVOR_VERIFIED',
        predicateId:verdict.predicateId,sourceRules:verdict.sourceRules},
        visibility:'SERVER_INTERNAL',correlationId:`verified-end-audit-${state.revision+1}`}]);
      return {completed:true,winnerIds:[...verdict.winnerIds],revision:next.revision};
    });
  }
  /** Developer/QA only: frozen internal tally is NEVER sent to a participant. */
  voteReviewInternal(gameId:string){
    const {state}=this.repo.get(gameId);return state.voting?.review??null;
  }
  /** Restricted authoritative vote-intent transport. No official tally winner or hanging logic is implied.
   * Q13-05 confirms that hibernating players cannot vote. Neither generic tie-breaking,
   * ballot changes nor full voting rights are known, so the official result stays unresolved.
   */
  openVoting(gameId:string,expectedRevision?:number):GameState {
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);invariant(!state.qaProfile||liveConversionDomain(state)||isMixedExileDeck(state),'RULE_UNRESOLVED','B/B QA scenario uses the explicit day advance only');ensureRevision(state,expectedRevision);
      invariant(state.phase==='DAY_DISCUSS','OUT_OF_PHASE','Voting can only open after dawn discussion');
      invariant(!this.repo.queued(gameId).some(x=>x.action.skillId===S13_SKILLS.guardShot),'RULE_UNRESOLVED','Resolve the pending day action before opening voting');
      const next=transition(state,'DAY_VOTE_COLLECT');
      next.voting={round:next.round,status:'OPEN',intents:[]};
      this.commit(state,next,[{eventType:'VOTING_OPENED',payload:{round:state.round},visibility:'ROOM_PUBLIC',correlationId:`voting-open-${state.round}`}]);
      return clone(next);
    });
  }
  submitVoteIntent(gameId:string,voterId:string,targetId:string,ballotId:string,idempotencyKey:string,expectedRevision?:number):{status:'RECORDED';duplicate:boolean;revision:number} {
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);
      invariant(state.phase==='DAY_VOTE_COLLECT'&&state.voting?.status==='OPEN'&&state.voting.round===state.round,
        'OUT_OF_PHASE','Ballot collection is not open');
      invariant(/^[A-Za-z0-9_-]{8,128}$/.test(ballotId)&&/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey),
        'INVALID_ARGUMENT','Invalid ballot id or idempotency key');
      const voter=participant(state,voterId),target=targetId===''&&state.votingPolicy?undefined:participant(state,targetId);
      invariant(voter.life==='ALIVE'||voter.life==='PROLONGED','UNAUTHORIZED','Inactive participant may not submit a ballot (Q13-05)');
      invariant(!soulNoVote(state,voter)&&!isS15VoteBlocked(state,voterId),'UNAUTHORIZED','Voting unavailable');
      // character.json#23: Xạ Thủ Linh Hồn cannot vote AFTER death,
      // not while alive. The generic life gate above applies to dead #23.
      // Historical resurrection-specific restrictions require a confirmed adapter.
      invariant(!target||(target.life==='ALIVE'||target.life==='PROLONGED')&&(!soulDeck(state)||!target.publicReportedDead),'TARGET_INVALID','Target is not available in this restricted vote collection');
      if(state.votingPolicy){
        const history=state.voting.history??state.voting.intents;
        const oldEvent=this.repo.events(gameId).find(e=>e.eventType==='OFFICIAL_BALLOT_AUDIT'&&(e.payload.ballotId===ballotId||e.payload.idempotencyKey===idempotencyKey));
        if(oldEvent&&oldEvent.payload.round!==state.round)throw new KernelError('IDEMPOTENCY_CONFLICT','Ballot key belongs to a previous round');
        const prior=history.find(x=>x.ballotId===ballotId||x.idempotencyKey===idempotencyKey);
        if(prior){invariant(prior.voterId===voterId&&prior.targetId===targetId&&prior.ballotId===ballotId&&prior.idempotencyKey===idempotencyKey,'IDEMPOTENCY_CONFLICT','Ballot identifier reused');return {status:'RECORDED',duplicate:true,revision:state.revision};}
        ensureRevision(state,expectedRevision);
        if(history.some(x=>x.voterId===voterId))invariant(expectedRevision!==undefined,'REVISION_CONFLICT','A ballot change requires the latest revision');
        const next=clone(state),entry={voterId,targetId,ballotId,idempotencyKey,acceptedRevision:state.revision+1};
        next.voting!.history=[...history,entry];next.voting!.intents=next.voting!.intents.filter(x=>x.voterId!==voterId);next.voting!.intents.push(entry);
        this.commit(state,next,[{eventType:'VOTE_INTENT_RECORDED',payload:{ballotId,targetId,round:state.round},visibility:'PLAYER_PRIVATE',recipientId:voterId,actorId:voterId,correlationId:ballotId},{eventType:'OFFICIAL_BALLOT_AUDIT',payload:{ballotId,idempotencyKey,round:state.round,revision:entry.acceptedRevision},visibility:'SERVER_INTERNAL',actorId:voterId,correlationId:ballotId}]);
        return {status:'RECORDED',duplicate:false,revision:next.revision};
      }
      const previous=state.voting.intents.find(x=>x.voterId===voterId);
      if(previous){
        invariant(previous.idempotencyKey===idempotencyKey&&previous.ballotId===ballotId&&previous.targetId===targetId,
          'RULE_UNRESOLVED','Changing an accepted ballot has not been confirmed by the official rules');
        return {status:'RECORDED',duplicate:true,revision:state.revision};
      }
      invariant(!state.voting.intents.some(x=>x.ballotId===ballotId||x.idempotencyKey===idempotencyKey),
        'IDEMPOTENCY_CONFLICT','Ballot identifier already in use');
      ensureRevision(state,expectedRevision);
      const next=clone(state);next.voting!.intents.push({voterId,targetId,ballotId,idempotencyKey});
      this.commit(state,next,[{eventType:'VOTE_INTENT_RECORDED',payload:{ballotId,targetId},visibility:'PLAYER_PRIVATE',recipientId:voterId,
        actorId:voterId,correlationId:ballotId}]);
      return {status:'RECORDED',duplicate:false,revision:next.revision};
    });
  }
  closeVoting(gameId:string,expectedRevision?:number):{status:'RULE_UNRESOLVED'|'RESOLVED';revision:number;intents:number} {
    return this.repo.transaction(()=>{
      const {state}=this.repo.get(gameId);ensureRevision(state,expectedRevision);
      invariant(state.phase==='DAY_VOTE_COLLECT'&&state.voting?.status==='OPEN','OUT_OF_PHASE','Voting is not open');
      // A supported day skill (notably PH-02) must resolve before vote closure.
      // Otherwise the action would be stuck forever with a closed voting ledger.
      invariant(this.repo.queued(gameId).length===0,'PENDING_ACTIONS','Pending daytime actions must resolve before vote closure');
      let next=transition(state,'DAY_RESOLVE');
      if(state.votingPolicy){
        const {outcome,audit}=adjudicateOfficialVote(state);
        next=clone(next);next.voting={...next.voting!,status:'RESOLVED',outcome,officialAudit:audit};
        const events:PendingEvent[]=[{eventType:'VOTE_LOCKED',payload:{round:state.round},visibility:'ROOM_PUBLIC',correlationId:`vote-lock-${state.round}`}];
        if(outcome.targetId){
          const voted=outcome.targetId,actual=swappedTarget(next,voted);if(actual!==voted){outcome.targetId=actual;outcome.sourceRules.push('character.json#37','VH14');events.push({eventType:'S15_BREAK_HANGING_REDIRECTED',payload:{originalTargetId:voted,actualTargetId:actual},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`});}
          const selected=outcome.targetId,blocked=evaluateHangingImmunity(next,participant(next,selected));
          if(blocked){
            events.push({eventType:'S15_BREAK_HANGING_PREVENTED',payload:{targetId:selected,sourceRule:blocked.ruleId},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`});
            if(blocked.ownerId)events.push({eventType:'S15_BREAK_STONE_SPENT',payload:{roleName:'Sói thường'},visibility:'PLAYER_PRIVATE',recipientId:blocked.ownerId,correlationId:`hang-${state.round}`});
            outcome.kind='NO_HANGING_IMMUNE';outcome.noElimination=true;outcome.sourceRules.push(blocked.ruleId);delete outcome.targetId;
            next.resolutionGate={status:'CONTINUE',round:state.round};
          }
        }
        for(const e of settleBallotContract(next))events.push({...e,visibility:'PLAYER_PRIVATE',correlationId:`contract-settle-${state.round}`});
        if(outcome.targetId&&isFinalRevengeDeck(next)&&participant(next,outcome.targetId).currentCharacterId===33){
          assertRevengeDomain(next);const victim=participant(next,outcome.targetId);
          invariant(victim.life==='ALIVE','RULE_UNRESOLVED','Invalid revenge primary death');
          victim.life='DEAD_FINAL';victim.publicReportedDead=true;victim.effects.push({id:`revenge-${next.round}`,kind:REVENGE_PENDING,payload:{round:next.round}});
          outcome.kind='HANGING_COMPLETED';next.resolutionGate={status:'PENDING_EFFECT',round:next.round,reason:'Post-hanging response pending'};
          events.push({eventType:'HANGING_AUTHORIZED',payload:{targetId:victim.playerId,sourceRules:outcome.sourceRules},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`},{eventType:'PLAYER_ELIMINATED',payload:{playerId:victim.playerId},visibility:'ROOM_PUBLIC',correlationId:`hang-${state.round}`},{eventType:'POST_ELIMINATION_CHAIN_PENDING',payload:{victimId:victim.playerId,pendingEffects:1,sourceRules:['character.json#33','VH03']},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`},{eventType:'S15_FINAL_REVENGE_AVAILABLE',payload:{round:next.round},visibility:'PLAYER_PRIVATE',recipientId:victim.playerId,correlationId:`hang-${state.round}`},{eventType:'OFFICIAL_VOTE_RESULT',payload:{round:next.round,outcome:outcome.kind},visibility:'ROOM_PUBLIC',correlationId:`vote-result-${state.round}`},{eventType:'RESOLUTION_GATE',payload:next.resolutionGate,visibility:'SERVER_INTERNAL',correlationId:`gate-${state.round}`},{eventType:'PHASE_CHANGED',payload:{phase:next.phase,round:next.round},visibility:'ROOM_PUBLIC',correlationId:`vote-phase-${state.round}`});
          this.commit(state,next,events);return {status:'RESOLVED',revision:next.revision,intents:state.voting.intents.length};
        }
        if(outcome.targetId){
          const chain=life02Domain(next)?{victimId:outcome.targetId,ruleId:'S11-V03',pendingEffects:0,stage:'POST_ELIMINATION_CLOSED',sourceRules:['S11-V03','LIFE-02','VH03']}:applyCertifiedHanging(next,outcome.targetId);
          if(life02Domain(next)){events.push({eventType:'HANGING_AUTHORIZED',payload:{targetId:outcome.targetId,sourceRules:outcome.sourceRules},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`},...resolveLife02Lethal(next,outcome.targetId,`hang-${state.round}`,'S11-V03'));}
          else events.push({eventType:'HANGING_AUTHORIZED',payload:{targetId:outcome.targetId,sourceRules:outcome.sourceRules},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`},{eventType:'PLAYER_ELIMINATED',payload:{playerId:outcome.targetId},visibility:'ROOM_PUBLIC',correlationId:`hang-${state.round}`},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:chain,visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`});
          if('secondaryIds' in chain&&Array.isArray(chain.secondaryIds))for(const id of chain.secondaryIds){events.push({eventType:'PLAYER_ELIMINATED',payload:{playerId:id},visibility:'ROOM_PUBLIC',correlationId:`hang-${state.round}`},{eventType:'POST_ELIMINATION_CHAIN_CLOSED',payload:{victimId:id,ruleId:'secondaryRuleId' in chain?chain.secondaryRuleId:'S15_DEEP_LINKED_DEATH',pendingEffects:0,sourceRules:'secondarySourceRules' in chain?chain.secondarySourceRules:['character.json#15','VH03','VH65']},visibility:'SERVER_INTERNAL',correlationId:`hang-${state.round}`});}
          const changed=transitionExileAfterDeath(next,outcome.targetId);if(changed)events.push({eventType:'S15_BREAK_ALIGNMENT_CHANGED',payload:{faction:'soi'},visibility:'PLAYER_PRIVATE',recipientId:changed.playerId,correlationId:`hang-${state.round}`});
          events.push(...expireLifeProlongations(next));
          this.appendBellResults(next,events);
          outcome.kind='HANGING_COMPLETED';
          events.push({eventType:'OFFICIAL_VOTE_RESULT',payload:{round:state.round,outcome:outcome.kind},visibility:'ROOM_PUBLIC',correlationId:`vote-result-${state.round}`});
          const verdict=resolveHangingVictory(next,outcome.targetId,chain,[...this.repo.events(gameId),...events]);
          if(verdict.kind==='NOT_YET'&&verdict.blocker==='POST_ELIMINATION_CHAIN_UNVERIFIED')next.resolutionGate={status:'PENDING_EFFECT',round:next.round,reason:verdict.blocker};
          else if(cultDeck(next))next.resolutionGate=verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED',round:next.round}:cultWin(next)?.unresolvedDeadFollowers?{status:'BLOCKED_BY_RULE',round:next.round,reason:'CULT_DEAD_WINNER_POLICY_UNRESOLVED'}:{status:'CONTINUE',round:next.round};
          else if(life02Domain(next)||soulDeck(next)||jesterRevivalDomain(next)||bellRevivalDomain(next))next.resolutionGate=verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED',round:next.round}:{status:'CONTINUE',round:next.round};
          else if(isS12ClosedDeck(next))next.resolutionGate=classifyS12Resolution(next,verdict);
          else if(isBreakStoneDeck(next)||isBreakExileDeck(next)||isContractDeck(next)||isSwapDeck(next)||isApprovedSingleWolfPackDeck(next))next.resolutionGate=classifyBreakResolution(next,verdict);
          else if(isFinalRevengeDeck(next))next.resolutionGate=verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED',round:next.round}:{status:'BLOCKED_BY_RULE',round:next.round,reason:'E02: unverified pack action or remaining victory'};
          else if(isFinalHunterDeck(next))next.resolutionGate=verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED',round:next.round}:canContinueFinalHunter(next)?{status:'CONTINUE',round:next.round}:{status:'BLOCKED_BY_RULE',round:next.round,reason:'E02: NO_MATCHING_CERTIFIED_PREDICATE'};
          else if(isDeepVoteDeck(next))next.resolutionGate=verdict.kind==='WINNER_VERIFIED'?{status:'GAME_COMPLETED',round:next.round}:next.participants.filter(p=>p.life==='ALIVE').length>1&&next.participants.some(p=>p.life==='ALIVE'&&[15,28,58].includes(p.currentCharacterId))?{status:'CONTINUE',round:next.round}:{status:'BLOCKED_BY_RULE',round:next.round,reason:'E02: NO_MATCHING_CERTIFIED_PREDICATE'};
          events.push({eventType:'VICTORY_EVALUATED',payload:verdict,visibility:'SERVER_INTERNAL',correlationId:`victory-${state.round}`});
          if(verdict.kind==='WINNER_VERIFIED'){next=transition(next,'GAME_COMPLETED');next.winnerIds=verdict.winnerIds;events.push({eventType:'MATCH_COMPLETED',payload:{winnerIds:next.winnerIds},visibility:'ROOM_PUBLIC',correlationId:`victory-${state.round}`});}
        }
        if(!outcome.targetId&&prolongDomain(next)){
          const expired=expireLifeProlongations(next);events.push(...expired);this.appendBellResults(next,events);
          if(expired.length){const w=life02Winners(next);invariant(hasClosedDeathLedger(next,[...this.repo.events(gameId),...events]),'RULE_UNRESOLVED','Unclosed prolonged life ledger');if(w){next=transition(next,'GAME_COMPLETED');next.winnerIds=w.ids;next.resolutionGate={status:'GAME_COMPLETED',round:next.round};events.push({eventType:'VICTORY_EVALUATED',payload:{kind:'WINNER_VERIFIED',winnerIds:w.ids,predicateId:w.predicate,sourceRules:w.sources},visibility:'SERVER_INTERNAL',correlationId:`victory-${state.round}`},{eventType:'MATCH_COMPLETED',payload:{winnerIds:w.ids},visibility:'ROOM_PUBLIC',correlationId:`victory-${state.round}`});}}
        }
        if(!outcome.targetId)events.push({eventType:'OFFICIAL_VOTE_RESULT',payload:{round:state.round,outcome:outcome.kind},visibility:'ROOM_PUBLIC',correlationId:`vote-result-${state.round}`});
        if(!next.completed&&!outcome.targetId){if(isS12ClosedDeck(next))next.resolutionGate={status:'CONTINUE',round:state.round};next=transition(next,'NIGHT_COLLECT');}
        if(!next.completed&&outcome.targetId&&next.resolutionGate?.status==='CONTINUE')next=transition(next,'NIGHT_COLLECT');
        events.push(...soulRevivalEvents(state,next));
        if(next.resolutionGate)events.push({eventType:'RESOLUTION_GATE',payload:next.resolutionGate,visibility:'SERVER_INTERNAL',correlationId:`gate-${state.round}`});
        if(!next.completed&&outcome.targetId&&next.phase==='DAY_RESOLVE')events.push({eventType:'VICTORY_PENDING_RULE',payload:{round:state.round},visibility:'ROOM_PUBLIC',correlationId:`victory-pending-${state.round}`});
        events.push({eventType:'PHASE_CHANGED',payload:{phase:next.phase,round:next.round},visibility:'ROOM_PUBLIC',correlationId:`vote-phase-${state.round}`});
        this.commit(state,next,events);return {status:'RESOLVED',revision:next.revision,intents:state.voting.intents.length};
      }
      next.voting={...state.voting,status:'CLOSED_UNRESOLVED',...closeWithoutOfficialBallotRule(state.voting)};
      const intents=next.voting.intents.length;
      // Intentionally do NOT announce a target, kill a participant, or complete a match.
      // The general vote transformation/tie/hanging rules are not yet complete.
      this.commit(state,next,[{eventType:'VOTE_LOCKED',payload:{round:state.round},visibility:'ROOM_PUBLIC',correlationId:`vote-lock-${state.round}`},
       {eventType:'VOTING_CLOSED_PENDING_RULES',payload:{round:state.round},visibility:'ROOM_PUBLIC',correlationId:`voting-close-${state.round}`}]);
      return {status:'RULE_UNRESOLVED',revision:next.revision,intents};
    });
  }
  voteProjection(gameId:string,viewerId:string){
    const {state}=this.repo.get(gameId);participant(state,viewerId);
    const voting=state.voting;
    if(!voting)return {available:false,officialPolicy:!!state.votingPolicy};
    const mine=voting.intents.find(x=>x.voterId===viewerId);
    return {available:true,officialPolicy:!!state.votingPolicy,canVote:state.phase==='DAY_VOTE_COLLECT'&&!soulNoVote(state,participant(state,viewerId))&&!isS15VoteBlocked(state,viewerId)&&['ALIVE','PROLONGED'].includes(participant(state,viewerId).life),round:voting.round,status:voting.status,submittedCount:voting.intents.length,
      ...(voting.outcome?{outcome:voting.outcome.kind}:{}),
      // No tally or other ballot is publicly projected. A viewer may only retrieve their own selection.
      ...(mine?{ownBallot:{targetId:mine.targetId,ballotId:mine.ballotId}}:{})};
  }
  project(gameId:string,viewerId:string):Record<string,unknown>{return projectState(this.repo.get(gameId).state,viewerId);}
  projectVisibleEvents(gameId:string,viewerId:string):Array<Record<string,unknown>>{
    const state=this.repo.get(gameId).state;
    return projectEvents(state,this.repo.events(gameId),{viewerId});
  }
  replay(gameId:string){return replay(this.repo,gameId);}
  private safeAudit(gameId:string,actionId:string|undefined,code:string,msg:string){
    try{this.repo.auditFailure(gameId,actionId,code,msg);}catch{/* audit failure must not overwrite domain exception */}
  }
  private commit(before:GameState,next:GameState,events:PendingEvent[]):number {
    validateState(next);
    validateSystemChatGroups(next);
    next.revision=before.revision+1;
    const recorded=[...events,{eventType:'STATE_COMMITTED',payload:{state:clone(next) as unknown as Record<string,unknown>},visibility:'SERVER_INTERNAL' as Visibility,correlationId:`revision-${next.revision}`}];
    const lastSeq = new EventLedger(this.repo).append(before.gameId,before.ruleVersion,recorded);
    this.repo.update(next,before.revision);
    const last=lastSeq;
    this.repo.saveSnapshot(before.gameId,last,next);
    return last;
  }
}
