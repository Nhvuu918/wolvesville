/** Read-only bridge to an authenticated, existing QA Game Session. Candidate
 * commands are persisted to a SEPARATE journal; no official archive mutation,
 * route registration, winner, phase advance or attack emission occurs here.
 * The entitlement provider is a mandatory trusted lab dependency, not a rule
 * inferred from faction and not user-controllable. */
import type {GameState} from '../../../../shared/contracts/index.js';
import {AuthService} from '../../multiplayer/auth.js';
import type {MultiplayerStore} from '../../multiplayer/types.js';
import type {GameStore} from '../../game/types.js';
import {withKernel} from '../../game/archive.js';
import {transition} from '../../engine/state.js';
import {OwnerBBV2Journal} from './journal.js';
import type {Entitlement,PackCommand} from './pack.js';
export class OwnerBBV2PackGateway{
 private readonly auth:AuthService;
 constructor(private readonly store:MultiplayerStore&GameStore,private readonly journal:OwnerBBV2Journal,private readonly entitlementFor:(s:GameState)=>Entitlement){if(process.env.WV_OWNER_BB_LAB!=='1')throw Error('OWNER_BB_LAB_DISABLED');this.auth=new AuthService(store);}
 private async load(token:unknown,gameId:string){
  const actor=await this.auth.identify(token),game=await this.store.gameById(gameId);if(!game||game.mode!=='INTEGRATION_TEST'||game.rulePack!=='OFFICIAL_ROLE_INSPECTION_V1')throw Error('QA_SESSION_REQUIRED');
  const room=await this.store.getRoom(game.roomId);if(!room?.members.some(m=>m.id===actor.id))throw Error('FORBIDDEN');
  const archive=withKernel(game.archive,false,e=>e.getInternalState(gameId),true),state=archive.value;
  if(!state.participants.some(p=>p.playerId===actor.id))throw Error('FORBIDDEN');
  const context={state,entitlement:this.entitlementFor(state)};return {actorId:actor.id,context,hostId:game.hostId,archive};
 }
 private key(actorId:string,requestId:string){if(typeof requestId!=='string'||!/^[\w-]{8,64}$/.test(requestId))throw Error('INVALID_REQUEST_ID');return `${actorId}-${requestId}`;}
 async open(token:unknown,gameId:string,requestId:string){const x=await this.load(token,gameId);if(x.actorId!==x.hostId)throw Error('FORBIDDEN');const r=this.journal.execute(this.key(x.actorId,requestId),0,{kind:'PACK_OPEN',context:x.context});return {seq:r.seq,duplicate:r.duplicate};}
 async submit(token:unknown,gameId:string,requestId:string,expectedSeq:number,command:PackCommand){const x=await this.load(token,gameId);const r=this.journal.execute(this.key(x.actorId,requestId),expectedSeq,{kind:'PACK_SUBMIT',context:x.context,actorId:x.actorId,command:{key:command.key,expectedRevision:command.expectedRevision,targets:command.targets}});return {seq:r.seq,duplicate:r.duplicate,outcome:r.outcome};}
 async view(token:unknown,gameId:string){const x=await this.load(token,gameId);return this.journal.ownPackView(x.context,x.actorId);}
 async commit(token:unknown,gameId:string,requestId:string,expectedSeq:number){const x=await this.load(token,gameId);if(x.actorId!==x.hostId)throw Error('FORBIDDEN');if(x.archive.actions.some(a=>a.status==='ACCEPTED'||a.status==='SUBMITTED'))throw Error('PENDING_OFFICIAL_ACTIONS');const state=transition(x.context.state,'NIGHT_RESOLVE');const history=x.archive.events.map(e=>({eventType:e.eventType,payload:e.payload}));const r=this.journal.execute(this.key(x.actorId,requestId),expectedSeq,{kind:'PACK_COMMIT',state,history});return {seq:r.seq,duplicate:r.duplicate,committed:true};}
 async lock(token:unknown,gameId:string,requestId:string,expectedSeq:number,expectedRevision:number){const x=await this.load(token,gameId);if(x.actorId!==x.hostId)throw Error('FORBIDDEN');const r=this.journal.execute(this.key(x.actorId,requestId),expectedSeq,{kind:'PACK_LOCK',context:x.context,expectedRevision});return {seq:r.seq,duplicate:r.duplicate,locked:(r.outcome as {kind?:string})?.kind==='UNANIMOUS'||(r.outcome as {kind?:string})?.kind==='NO_CONSENSUS'};}
}

/** Authenticated QA-only shadow resolver of the real accepted engineer queue.
 * Host receives only a receipt, never private results or trap provenance. */
export class OwnerBBV2TrapGateway{
 private readonly auth:AuthService;
 constructor(private readonly store:MultiplayerStore&GameStore,private readonly journal:OwnerBBV2Journal){if(process.env.WV_OWNER_BB_LAB!=='1')throw Error('OWNER_BB_LAB_DISABLED');this.auth=new AuthService(store);}
 async commitNight(token:unknown,gameId:string,requestId:string){
  const actor=await this.auth.identify(token),game=await this.store.gameById(gameId);if(!game||game.mode!=='INTEGRATION_TEST'||game.rulePack!=='OFFICIAL_ROLE_INSPECTION_V1')throw Error('QA_SESSION_REQUIRED');
  const room=await this.store.getRoom(game.roomId);if(actor.id!==game.hostId||!room?.members.some(m=>m.id===actor.id))throw Error('FORBIDDEN');
  if(typeof requestId!=='string'||!/^[\w-]{8,64}$/.test(requestId))throw Error('INVALID_REQUEST_ID');
  const archive=withKernel(game.archive,false,(e,repo)=>({state:e.getInternalState(gameId),queued:repo.queued(gameId)}),true);
  const history=archive.events.map(e=>({eventType:e.eventType,payload:e.payload}));const r=this.journal.execute(`${actor.id}-${requestId}`,0,{kind:'TRAP_NIGHT_COMMIT',state:archive.value.state,queued:archive.value.queued,history});
  return {seq:r.seq,duplicate:r.duplicate,committed:true};
 }
}
