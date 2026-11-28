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
import {OwnerBBJournal} from './journal.js';
import type {Entitlement,PackCommand} from './pack.js';
export class OwnerBBPackGateway{
 private readonly auth:AuthService;
 constructor(private readonly store:MultiplayerStore&GameStore,private readonly journal:OwnerBBJournal,private readonly entitlementFor:(s:GameState)=>Entitlement){if(process.env.WV_OWNER_BB_LAB!=='1')throw Error('OWNER_BB_LAB_DISABLED');this.auth=new AuthService(store);}
 private async load(token:unknown,gameId:string){
  const actor=await this.auth.identify(token),game=await this.store.gameById(gameId);if(!game||game.mode!=='INTEGRATION_TEST'||game.rulePack!=='OFFICIAL_ROLE_INSPECTION_V1')throw Error('QA_SESSION_REQUIRED');
  const room=await this.store.getRoom(game.roomId);if(!room?.members.some(m=>m.id===actor.id))throw Error('FORBIDDEN');
  const state=withKernel(game.archive,false,e=>e.getInternalState(gameId),true).value;
  if(!state.participants.some(p=>p.playerId===actor.id))throw Error('FORBIDDEN');
  const context={state,entitlement:this.entitlementFor(state)};return {actorId:actor.id,context,hostId:game.hostId};
 }
 private key(actorId:string,requestId:string){if(typeof requestId!=='string'||!/^[\w-]{8,64}$/.test(requestId))throw Error('INVALID_REQUEST_ID');return `${actorId}-${requestId}`;}
 async open(token:unknown,gameId:string,requestId:string){const x=await this.load(token,gameId);if(x.actorId!==x.hostId)throw Error('FORBIDDEN');const r=this.journal.execute(this.key(x.actorId,requestId),0,{kind:'PACK_OPEN',context:x.context});return {seq:r.seq,duplicate:r.duplicate};}
 async submit(token:unknown,gameId:string,requestId:string,expectedSeq:number,command:PackCommand){const x=await this.load(token,gameId);const r=this.journal.execute(this.key(x.actorId,requestId),expectedSeq,{kind:'PACK_SUBMIT',context:x.context,actorId:x.actorId,command:{key:command.key,expectedRevision:command.expectedRevision,targets:command.targets}});return {seq:r.seq,duplicate:r.duplicate,outcome:r.outcome};}
 async view(token:unknown,gameId:string){const x=await this.load(token,gameId);return this.journal.ownPackView(x.context,x.actorId);}
 async lock(token:unknown,gameId:string,requestId:string,expectedSeq:number,expectedRevision:number){const x=await this.load(token,gameId);if(x.actorId!==x.hostId)throw Error('FORBIDDEN');const r=this.journal.execute(this.key(x.actorId,requestId),expectedSeq,{kind:'PACK_LOCK',context:x.context,expectedRevision});return {seq:r.seq,duplicate:r.duplicate,locked:true};}
}
