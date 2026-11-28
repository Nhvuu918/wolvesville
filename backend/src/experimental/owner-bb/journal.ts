/** Durable candidate event journal. Only a trusted server-side lab caller may
 * use it. Never attach the journal to public routes, official match DB, or
 * the live ruleset registry. Full commands include private game snapshots.
 * Every command and resulting state is hashed; replay runs the pure reducers.
 */
import {DatabaseSync} from 'node:sqlite';
import {canonical,clone,hash} from '../../common/canonical.js';
import type {GameState,GameAction} from '../../../../shared/contracts/index.js';
import {openPack,submitPack,lockPack,ownPack,PROFILE,type PackContext,type PackCommand,type PackState} from './pack.js';
import {openTraps,placeTrap,resolveTrap,type TrapState,type Resolution} from './trap.js';
export type Command=
 |{kind:'PACK_OPEN';context:PackContext}
 |{kind:'PACK_SUBMIT';context:PackContext;actorId:string;command:PackCommand}
 |{kind:'PACK_LOCK';context:PackContext;expectedRevision:number}
 |{kind:'TRAP_OPEN';state:GameState}
 |{kind:'TRAP_PLACE';state:GameState;action:GameAction;acceptedWhileAlive?:boolean}
 |{kind:'TRAP_RESOLVE';resolution:Resolution};
type Aggregate={kind:'PACK';state:PackState}|{kind:'TRAP';state:TrapState};
type Reduced={aggregate:Aggregate;outcome:unknown};
function check(ok:unknown,code:string):asserts ok {if(!ok)throw Error(code);}
function reduce(current:Aggregate|undefined,c:Command):Reduced{
 if(c.kind==='PACK_OPEN'){check(!current,'ALREADY_OPEN');return {aggregate:{kind:'PACK',state:openPack(c.context)},outcome:null};}
 if(c.kind==='TRAP_OPEN'){check(!current,'ALREADY_OPEN');return {aggregate:{kind:'TRAP',state:openTraps(c.state)},outcome:null};}
 if(c.kind==='PACK_SUBMIT'){check(current?.kind==='PACK','WRONG_STREAM');const r=submitPack(current.state,c.context,c.actorId,c.command);return {aggregate:{kind:'PACK',state:r.state},outcome:{duplicate:r.duplicate,revision:r.state.revision}};}
 if(c.kind==='PACK_LOCK'){check(current?.kind==='PACK','WRONG_STREAM');const state=lockPack(current.state,c.context,c.expectedRevision);return {aggregate:{kind:'PACK',state},outcome:state.result};}
 if(c.kind==='TRAP_PLACE'){check(current?.kind==='TRAP','WRONG_STREAM');const state=placeTrap(current.state,c.state,c.action,c.acceptedWhileAlive);return {aggregate:{kind:'TRAP',state},outcome:null};}
 if(c.kind==='TRAP_RESOLVE'){check(current?.kind==='TRAP','WRONG_STREAM');const r=resolveTrap(current.state,c.resolution);return {aggregate:{kind:'TRAP',state:r.state},outcome:{...r.outcome,duplicate:r.duplicate}};}
 throw Error('UNKNOWN_COMMAND');
}
function streamFor(c:Command):string{const s='context'in c?c.context.state:'resolution'in c?c.resolution.state:c.state;return c.kind.startsWith('PACK_')?`pack:${s.gameId}:${s.round}`:`trap:${s.gameId}`;}
interface Row {seq:number;request_id:string;command_json:string;state_hash:string;prev_hash:string;event_hash:string;outcome_json:string}
export class OwnerBBJournal{
 private readonly db:DatabaseSync;
 constructor(filename:string){check(process.env.WV_OWNER_BB_LAB==='1','OWNER_BB_LAB_DISABLED');check(typeof filename==='string'&&filename.length>0,'LAB_DB_REQUIRED');this.db=new DatabaseSync(filename);this.db.exec(`PRAGMA busy_timeout=3000; CREATE TABLE IF NOT EXISTS owner_bb_events(stream TEXT NOT NULL,seq INTEGER NOT NULL,request_id TEXT NOT NULL,command_json TEXT NOT NULL,state_hash TEXT NOT NULL,prev_hash TEXT NOT NULL,event_hash TEXT NOT NULL,outcome_json TEXT NOT NULL,PRIMARY KEY(stream,seq),UNIQUE(stream,request_id));`);}
 close(){this.db.close();}
 private rows(stream:string):Row[]{return this.db.prepare('SELECT seq,request_id,command_json,state_hash,prev_hash,event_hash,outcome_json FROM owner_bb_events WHERE stream=? ORDER BY seq').all(stream) as Row[];}
 private replayRows(stream:string,rows:Row[]){let current:Aggregate|undefined,previous='GENESIS';for(let i=0;i<rows.length;i++){const r=rows[i];check(r.seq===i+1&&r.prev_hash===previous,'JOURNAL_CHAIN_BROKEN');const command=JSON.parse(r.command_json) as Command;check(streamFor(command)===stream,'JOURNAL_SCOPE_MISMATCH');const result=reduce(current,command);current=result.aggregate;check(hash(current)===r.state_hash&&canonical(result.outcome)===r.outcome_json,'JOURNAL_REPLAY_MISMATCH');const digest=hash({profile:PROFILE,stream,seq:r.seq,requestId:r.request_id,command,stateHash:r.state_hash,prevHash:previous,outcome:result.outcome});check(digest===r.event_hash,'JOURNAL_HASH_MISMATCH');previous=digest;}return {aggregate:current,seq:rows.length,lastHash:previous};}
 /** Internal audit API. Never return this aggregate to a browser. */
 replay(stream:string){return clone(this.replayRows(stream,this.rows(stream)));}
 execute(requestId:string,expectedSeq:number,command:Command){
  check(/^[\w-]{8,128}$/.test(requestId),'INVALID_REQUEST_ID');check(Number.isSafeInteger(expectedSeq)&&expectedSeq>=0,'INVALID_SEQUENCE');const stream=streamFor(command);this.db.exec('BEGIN IMMEDIATE');
  try{const rows=this.rows(stream),before=this.replayRows(stream,rows),prior=rows.find(x=>x.request_id===requestId);
   if(prior){check(prior.command_json===canonical(command),'IDEMPOTENCY_CONFLICT');this.db.exec('COMMIT');return {seq:before.seq,duplicate:true,outcome:JSON.parse(prior.outcome_json)};}
   check(before.seq===expectedSeq,'STALE_JOURNAL_SEQUENCE');const r=reduce(before.aggregate,command),seq=before.seq+1,stateHash=hash(r.aggregate),outcomeJson=canonical(r.outcome),digest=hash({profile:PROFILE,stream,seq,requestId,command,stateHash,prevHash:before.lastHash,outcome:r.outcome});
   this.db.prepare('INSERT INTO owner_bb_events VALUES(?,?,?,?,?,?,?,?)').run(stream,seq,requestId,canonical(command),stateHash,before.lastHash,digest,outcomeJson);
   this.db.exec('COMMIT');return {seq,duplicate:false,outcome:clone(r.outcome)};
  }catch(e){this.db.exec('ROLLBACK');throw e;}
 }
 ownPackView(context:PackContext,authenticatedActorId:string){const a=this.replay(`pack:${context.state.gameId}:${context.state.round}`).aggregate;check(a?.kind==='PACK','WRONG_STREAM');return ownPack(a.state,context,authenticatedActorId);}
}
