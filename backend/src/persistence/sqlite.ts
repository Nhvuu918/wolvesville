import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {GameState,GameAction,EngineEvent,RandomRecord} from '../../../shared/contracts/index.js';
import {canonical,hash} from '../common/canonical.js';
import {KernelError,invariant} from '../common/errors.js';

export interface GameRow {state:GameState;initial:GameState;lastSeq:number;lastHash:string}
export interface StoredAction {action:GameAction;status:string;costName?:string;costAmount:number;fingerprint:string}
export interface GameRepository {
 transaction<T>(callback:()=>T):T;
 create(state:GameState):void;
 get(gameId:string):GameRow;
 update(state:GameState, expectedRevision:number):void;
 recordEvent(event:EngineEvent):void;
 events(gameId:string):EngineEvent[];
 saveSnapshot(gameId:string,seq:number,state:GameState):void;
 snapshots(gameId:string):Array<{seq:number;state:GameState;stateHash:string}>;
 storeAction(action:GameAction,fingerprint:string,costName?:string,costAmount?:number):void;
 actionByKey(gameId:string,playerId:string,key:string):StoredAction|undefined;
 actionById(gameId:string,actionId:string):StoredAction|undefined;
 queued(gameId:string):StoredAction[];
 reserved(gameId:string,playerId:string,resource:string):number;
 skillUsage(gameId:string,playerId:string,skillId:string,round:number,phase:string):number;
 markAction(gameId:string,actionId:string,status:string,resolvedSeq:number):void;
 saveDraw(gameId:string,record:RandomRecord):void;
 draws(gameId:string):RandomRecord[];
 auditFailure(gameId:string,actionId:string|undefined,code:string,message:string):void;
 close():void;
}
export class SqliteRepository implements GameRepository {
  private db:DatabaseSync;
  constructor(filename=':memory:') {
    if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
    this.db=new DatabaseSync(filename);
    const schema=readFileSync(fileURLToPath(new URL('./schema.sql',import.meta.url)),'utf8');
    this.db.exec(schema);
    this.db.exec('PRAGMA journal_mode=WAL;');
  }
  transaction<T>(callback:()=>T):T {
    this.db.exec('BEGIN IMMEDIATE');
    try {const result=callback();this.db.exec('COMMIT');return result;}
    catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  create(state:GameState):void {
    this.db.prepare('INSERT INTO games(game_id,room_id,ruleset_version,initial_json,current_json,revision,last_seq,last_hash,created_at) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(state.gameId,state.roomId,state.ruleVersion,canonical(state),canonical(state),state.revision,0,'GENESIS',Date.now());
    for(const p of state.participants)this.db.prepare('INSERT INTO participants(game_id,player_id,initial_character_id,initial_faction) VALUES(?,?,?,?)')
      .run(state.gameId,p.playerId,p.initialCharacterId,p.initialFaction);
    this.db.prepare('INSERT OR IGNORE INTO rule_versions(rule_version,registry_hash,created_at) VALUES(?,?,?)').run(state.ruleVersion,hash(state.ruleVersion),Date.now());
    this.saveSnapshot(state.gameId,0,state);
  }
  /** Safe internal archive index: Sprint 02B stores exactly one game per archive. */
  listActions():Array<{actionId:string;playerId:string;skillId:string;idempotencyKey:string;status:string}>{return this.db.prepare('SELECT action_id,player_id,body_json,idempotency_key,status FROM actions').all().map((r:any)=>({actionId:r.action_id,playerId:r.player_id,skillId:JSON.parse(r.body_json).skillId,idempotencyKey:r.idempotency_key,status:r.status}));}
  listGameIds():string[]{return this.db.prepare('SELECT game_id FROM games ORDER BY created_at').all().map((r:any)=>r.game_id);}
  get(gameId:string):GameRow {
    const row=this.db.prepare('SELECT * FROM games WHERE game_id=?').get(gameId);
    invariant(!!row,'NOT_FOUND',`Unknown game ${gameId}`);
    return {state:JSON.parse(row.current_json),initial:JSON.parse(row.initial_json),lastSeq:row.last_seq,lastHash:row.last_hash};
  }
  update(state:GameState,expectedRevision:number):void {
    const r=this.db.prepare('UPDATE games SET current_json=?,revision=? WHERE game_id=? AND revision=?')
      .run(canonical(state),state.revision,state.gameId,expectedRevision);
    invariant(r.changes===1,'REVISION_CONFLICT','Optimistic game-state revision mismatch');
  }
  recordEvent(event:EngineEvent):void {
    const row=this.db.prepare('SELECT last_seq,last_hash FROM games WHERE game_id=?').get(event.gameId);
    invariant(row&&event.sequence===row.last_seq+1&&event.prevHash===row.last_hash,'PERSISTENCE_FAILED','Non-contiguous event sequence/hash');
    this.db.prepare('INSERT INTO events(game_id,seq,event_id,event_json,hash) VALUES(?,?,?,?,?)')
      .run(event.gameId,event.sequence,event.eventId,canonical(event),event.eventHash);
    this.db.prepare('UPDATE games SET last_seq=?,last_hash=? WHERE game_id=?').run(event.sequence,event.eventHash,event.gameId);
  }
  events(gameId:string):EngineEvent[]{return this.db.prepare('SELECT event_json FROM events WHERE game_id=? ORDER BY seq').all(gameId).map(r=>JSON.parse(r.event_json));}
  saveSnapshot(gameId:string,seq:number,state:GameState):void {
    this.db.prepare('INSERT INTO snapshots(game_id,seq,state_json,state_hash) VALUES(?,?,?,?)')
      .run(gameId,seq,canonical(state),hash(state));
  }
  snapshots(gameId:string):Array<{seq:number;state:GameState;stateHash:string}>{
    return this.db.prepare('SELECT seq,state_json,state_hash FROM snapshots WHERE game_id=? ORDER BY seq').all(gameId).map(r=>({seq:r.seq,state:JSON.parse(r.state_json),stateHash:r.state_hash}));
  }
  storeAction(a:GameAction,fingerprint:string,costName?:string,costAmount=0):void {
    this.db.prepare('INSERT INTO actions(game_id,action_id,player_id,idempotency_key,fingerprint,body_json,status,cost_name,cost_amount) VALUES(?,?,?,?,?,?,?,?,?)')
      .run(a.gameId,a.actionId,a.playerId,a.idempotencyKey,fingerprint,canonical(a),'ACCEPTED',costName??null,costAmount);
  }
  actionByKey(gameId:string,playerId:string,key:string):StoredAction|undefined {
    const r=this.db.prepare('SELECT * FROM actions WHERE game_id=? AND player_id=? AND idempotency_key=?').get(gameId,playerId,key);
    return r?this.toAction(r):undefined;
  }
  actionById(gameId:string,actionId:string):StoredAction|undefined {
    const r=this.db.prepare('SELECT * FROM actions WHERE game_id=? AND action_id=?').get(gameId,actionId);
    return r?this.toAction(r):undefined;
  }
  queued(gameId:string):StoredAction[] {return this.db.prepare("SELECT * FROM actions WHERE game_id=? AND status='ACCEPTED'").all(gameId).map(r=>this.toAction(r));}
  reserved(gameId:string,playerId:string,resource:string):number {
    const r=this.db.prepare("SELECT COALESCE(SUM(cost_amount),0) AS total FROM actions WHERE game_id=? AND player_id=? AND cost_name=? AND status='ACCEPTED'")
      .get(gameId,playerId,resource);
    return r?.total??0;
  }
  skillUsage(gameId:string,playerId:string,skillId:string,round:number,phase:string):number {
    const items=this.db.prepare("SELECT body_json FROM actions WHERE game_id=? AND player_id=? AND status IN ('ACCEPTED','RESOLVED')").all(gameId,playerId);
    return items.filter(r=>{const a=JSON.parse(r.body_json) as GameAction;return a.skillId===skillId&&a.round===round&&a.phase===phase;}).length;
  }
  markAction(gameId:string,actionId:string,status:string,resolvedSeq:number):void {
    const r=this.db.prepare('UPDATE actions SET status=?,resolved_seq=? WHERE game_id=? AND action_id=? AND status=?').run(status,resolvedSeq,gameId,actionId,'ACCEPTED');
    invariant(r.changes===1,'PERSISTENCE_FAILED','Invalid action status transition');
  }
  saveDraw(gameId:string,record:RandomRecord):void {
    this.db.prepare('INSERT INTO random_draws(game_id,draw_index,record_json) VALUES(?,?,?)').run(gameId,record.drawIndex,canonical(record));
  }
  draws(gameId:string):RandomRecord[] {return this.db.prepare('SELECT record_json FROM random_draws WHERE game_id=? ORDER BY draw_index').all(gameId).map(r=>JSON.parse(r.record_json));}
  auditFailure(gameId:string,actionId:string|undefined,code:string,message:string):void {
    this.db.prepare('INSERT INTO kernel_audit_failures(game_id,action_id,error_code,message,timestamp) VALUES(?,?,?,?,?)').run(gameId,actionId??null,code,message,Date.now());
  }
  close(){this.db.close();}
  private toAction(r:any):StoredAction {return {action:JSON.parse(r.body_json),status:r.status,costName:r.cost_name??undefined,costAmount:r.cost_amount,fingerprint:r.fingerprint};}
}
