import {SocialRepository,type Query} from '../social/repository.js';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Account,MultiplayerStore,RoomRecord,RoomListRecord,RoomMember} from './types.js';
import {assertLobby} from './types.js';
import type {GameStore,StartCommand,StoredGame,GameCommit} from '../game/types.js';
import {hash} from '../common/canonical.js';
import {normalDeck} from '../game/normal-decks.js';

export class SqliteMultiplayerStore implements MultiplayerStore,GameStore {
 private db:DatabaseSync;
 readonly social:SocialRepository;
 constructor(filename=':memory:'){
  if(filename!==':memory:')mkdirSync(dirname(filename),{recursive:true});
  this.db=new DatabaseSync(filename);
  this.db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/002_multiplayer_sqlite.sql',import.meta.url)),'utf8'));
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/004_game_sessions_sqlite.sql',import.meta.url)),'utf8'));
  const cols=this.db.prepare('PRAGMA table_info(game_sessions)').all().map((v:any)=>v.name);
  if(!cols.includes('rule_pack'))this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/005_official_rule_pack_sqlite.sql',import.meta.url)),'utf8'));
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/006_demo_auth_sqlite.sql',import.meta.url)),'utf8'));
  if(!this.db.prepare('PRAGMA table_info(lobby_rooms)').all().some((c:any)=>c.name==='normal_deck')){
   this.db.exec('PRAGMA foreign_keys=OFF;');
   try{this.transaction(()=>{
    this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/007_normal_gameplay_sqlite.sql',import.meta.url)),'utf8'));
    if(this.db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('007 migration: foreign key integrity failed');
   });}finally{this.db.exec('PRAGMA foreign_keys=ON;');}
  }
  if(!this.db.prepare('PRAGMA table_info(game_sessions)').all().some((c:any)=>c.name==='coordinator_id'))this.transaction(()=>this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/008_normal_coordination_sqlite.sql',import.meta.url)),'utf8')));
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/009_social_sqlite.sql',import.meta.url)),'utf8'));
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/010_social_post_media_sqlite.sql',import.meta.url)),'utf8'));
  this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/011_progression_sqlite.sql',import.meta.url)),'utf8'));
  this.transaction(()=>this.db.exec(readFileSync(fileURLToPath(new URL('../persistence/migrations/012_account_workspace_sqlite.sql',import.meta.url)),'utf8')));
  this.db.exec('PRAGMA journal_mode=WAL;');
  // Social queries resolve synchronously through microtasks; queue transactions on this connection.
  const q:Query=async(sql,args=[])=>this.db.prepare(sql).all(...args as any[]);
  let tail=Promise.resolve();
  this.social=new SocialRepository({query:q,transaction:async fn=>{const run=tail.then(async()=>{this.db.exec('BEGIN IMMEDIATE');try{const r=await fn(q);this.db.exec('COMMIT');return r;}catch(e){this.db.exec('ROLLBACK');throw e;}});tail=run.then(()=>{},()=>{});return run;}});
 }
 private transaction<T>(fn:()=>T):T {this.db.exec('BEGIN IMMEDIATE');try {const x=fn();this.db.exec('COMMIT');return x;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 async healthCheck(){this.db.prepare('SELECT 1 FROM user_accounts LIMIT 1').get();this.db.prepare('SELECT 1 FROM game_sessions LIMIT 1').get();this.db.prepare('SELECT 1 FROM social_profiles LIMIT 1').get();this.db.prepare('SELECT 1 FROM social_post_media LIMIT 1').get();this.db.prepare('SELECT 1 FROM saved_decks LIMIT 1').get();this.db.prepare('SELECT 1 FROM account_preferences LIMIT 1').get();}
 async createAccount(a:Account):Promise<void>{
  try{this.db.prepare('INSERT INTO user_accounts VALUES(?,?,?,?,?,?)').run(a.id,a.publicId,a.username,a.displayName,a.passwordHash,a.createdAt);}
  catch(e){if(String(e).includes('UNIQUE'))throw new Error('ACCOUNT_DUPLICATE');throw e;}
 }
 async createDemoIdentity(a:Account,tokenHash:string,expiresAt:number):Promise<void>{
  this.transaction(()=>{
   this.db.prepare('INSERT INTO user_accounts VALUES(?,?,?,?,?,?)').run(a.id,a.publicId,a.username,a.displayName,a.passwordHash,a.createdAt);
   this.db.prepare('INSERT INTO demo_account_meta VALUES(?,?,?)').run(a.id,a.createdAt,expiresAt);
   this.db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,0)').run(tokenHash,a.id,expiresAt);
  });
 }
 async isDemoAccount(userId:string):Promise<boolean>{return !!this.db.prepare('SELECT 1 FROM demo_account_meta WHERE user_id=?').get(userId);}
 async cleanupExpiredDemoAccounts(now:number):Promise<{deleted:number;retained:number}>{return this.transaction(()=>{
  // Revoke expired demo sessions even if retaining the account for room/game history.
  this.db.prepare('UPDATE auth_sessions SET revoked=1 WHERE user_id IN (SELECT user_id FROM demo_account_meta WHERE expires_at<=?)').run(now);
  const count=this.db.prepare('SELECT COUNT(*) AS n FROM demo_account_meta WHERE expires_at<=?').get(now) as {n:number};
  // Only delete demo accounts that have never joined a room nor participated in a game.
  // No regular account or historical game can be deleted by this maintenance action.
  const removed=this.db.prepare(`DELETE FROM user_accounts WHERE id IN (
   SELECT d.user_id FROM demo_account_meta d WHERE d.expires_at<=?
   AND NOT EXISTS(SELECT 1 FROM lobby_members m WHERE m.user_id=d.user_id)
   AND NOT EXISTS(SELECT 1 FROM lobby_rooms r WHERE r.host_id=d.user_id)
   AND NOT EXISTS(SELECT 1 FROM game_participants p WHERE p.player_id=d.user_id)
  )`).run(now);
  return {deleted:Number(removed.changes),retained:Number(count.n)-Number(removed.changes)};
 });}
 private toAccount(r:any):Account {return {id:r.id,publicId:r.public_id,username:r.username,displayName:r.display_name,passwordHash:r.password_hash,createdAt:r.created_at};}
 async accountByUsername(username:string){const r=this.db.prepare('SELECT * FROM user_accounts WHERE username=?').get(username);return r?this.toAccount(r):undefined;}
 async accountById(id:string){const r=this.db.prepare('SELECT * FROM user_accounts WHERE id=?').get(id);return r?this.toAccount(r):undefined;}
 async createSession(tokenHash:string,userId:string,expiresAt:number){this.db.prepare('INSERT INTO auth_sessions VALUES(?,?,?,0)').run(tokenHash,userId,expiresAt);}
 async accountForSession(tokenHash:string,now:number){const r=this.db.prepare('SELECT u.* FROM auth_sessions s JOIN user_accounts u ON u.id=s.user_id WHERE s.token_hash=? AND s.revoked=0 AND s.expires_at>? AND NOT EXISTS(SELECT 1 FROM demo_account_meta d WHERE d.user_id=u.id AND d.expires_at<=?)').get(tokenHash,now,now);return r?this.toAccount(r):undefined;}
 async revokeSession(tokenHash:string){this.db.prepare('UPDATE auth_sessions SET revoked=1 WHERE token_hash=?').run(tokenHash);}
 async updateDisplayName(id:string,name:string):Promise<Account>{
  const r=this.db.prepare('UPDATE user_accounts SET display_name=? WHERE id=?').run(name,id);
  assertLobby(r.changes===1,'ACCOUNT_NOT_FOUND','Account not found',404);
  return this.toAccount(this.db.prepare('SELECT * FROM user_accounts WHERE id=?').get(id));
 }
 async roomIdsForUser(id:string):Promise<string[]>{return this.db.prepare('SELECT room_id FROM lobby_members WHERE user_id=?').all(id).map((r:any)=>r.room_id);}

 private roomSync(id:string):RoomRecord|undefined{
  const r=this.db.prepare('SELECT * FROM lobby_rooms WHERE room_id=?').get(id);
  if(!r)return undefined;
  const members=this.db.prepare('SELECT u.id,u.public_id,u.display_name,m.joined_at,m.ready FROM lobby_members m JOIN user_accounts u ON u.id=m.user_id WHERE m.room_id=? ORDER BY m.joined_at,u.id').all(id).map((p:any):RoomMember=>({id:p.id,publicId:p.public_id,displayName:p.display_name,joinedAt:p.joined_at,ready:!!p.ready}));
  return {id:r.room_id,name:r.room_name,hostId:r.host_id,capacity:r.capacity,status:r.status,revision:r.revision,createdAt:r.created_at,members,...(r.normal_deck?{normalDeck:r.normal_deck}:{})};
 }
 async createRoom(room:{id:string;name:string;hostId:string;capacity:number;createdAt:number}):Promise<RoomRecord>{
  return this.transaction(()=>{
   this.db.prepare('INSERT INTO lobby_rooms(room_id,room_name,host_id,capacity,status,revision,created_at) VALUES(?,?,?, ?,\'WAITING\',1,?)').run(room.id,room.name,room.hostId,room.capacity,room.createdAt);
   this.db.prepare('INSERT INTO lobby_members(room_id,user_id,joined_at) VALUES(?,?,?)').run(room.id,room.hostId,room.createdAt);
   return this.roomSync(room.id)!;
  });
 }
 async joinRoom(roomId:string,userId:string,joinedAt:number):Promise<RoomRecord>{
  return this.transaction(()=>{
   const r=this.roomSync(roomId);assertLobby(r,'ROOM_NOT_FOUND','Room not found',404);
   if(r.members.some(m=>m.id===userId))return r;
   assertLobby(r.status==='WAITING','ROOM_LOCKED','Room cannot accept members',409);
   assertLobby(r.members.length<r.capacity,'ROOM_FULL','Room is full',409);
   this.db.prepare('INSERT INTO lobby_members(room_id,user_id,joined_at) VALUES(?,?,?)').run(roomId,userId,joinedAt);
   this.db.prepare('UPDATE lobby_rooms SET revision=revision+1 WHERE room_id=?').run(roomId);
   return this.roomSync(roomId)!;
  });
 }
 async leaveRoom(roomId:string,userId:string):Promise<RoomRecord|null>{
  return this.transaction(()=>{
   const r=this.roomSync(roomId);assertLobby(r,'ROOM_NOT_FOUND','Room not found',404);
   assertLobby(r.members.some(m=>m.id===userId),'NOT_MEMBER','Not a room member',403);
   assertLobby(r.status==='WAITING'||r.status==='LOCKED','ROOM_ACTIVE','Cannot leave active game in lobby API',409);
   this.db.prepare('DELETE FROM lobby_members WHERE room_id=? AND user_id=?').run(roomId,userId);
   if(r.normalDeck){this.db.prepare('UPDATE lobby_rooms SET normal_deck=NULL WHERE room_id=?').run(roomId);this.db.prepare('UPDATE lobby_members SET ready=0 WHERE room_id=?').run(roomId);}
   const updated=this.roomSync(roomId)!;
   if(updated.members.length===0){this.db.prepare('DELETE FROM lobby_rooms WHERE room_id=?').run(roomId);return null;}
   const host=updated.hostId===userId?updated.members[0]!.id:updated.hostId;
   this.db.prepare('UPDATE lobby_rooms SET host_id=?, revision=revision+1 WHERE room_id=?').run(host,roomId);
   return this.roomSync(roomId)!;
  });
 }
 async getRoom(id:string){return this.roomSync(id);}
 async listRooms():Promise<RoomListRecord[]>{
  return this.db.prepare("SELECT r.room_id,r.room_name,r.capacity,r.status,r.revision,COUNT(m.user_id) AS occupied FROM lobby_rooms r LEFT JOIN lobby_members m ON m.room_id=r.room_id WHERE r.status!='CLOSED' GROUP BY r.room_id ORDER BY r.created_at DESC").all().map((r:any)=>({id:r.room_id,name:r.room_name,capacity:r.capacity,occupied:r.occupied,status:r.status,revision:r.revision}));
 }
 async setRoomLocked(id:string,userId:string,locked:boolean):Promise<RoomRecord>{return this.transaction(()=>{
  const r=this.roomSync(id);assertLobby(r,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(r.hostId===userId,'FORBIDDEN','Only host may change lock',403);
  assertLobby(r.status==='WAITING'||r.status==='LOCKED','ROOM_ACTIVE','Cannot modify active room',409);
  this.db.prepare('UPDATE lobby_rooms SET status=?,revision=revision+1,normal_deck=NULL WHERE room_id=?').run(locked?'LOCKED':'WAITING',id);
  this.db.prepare('UPDATE lobby_members SET ready=0 WHERE room_id=?').run(id);
  return this.roomSync(id)!;
 });}
 async configureNormalRoom(id:string,userId:string,deck:string,expectedRevision?:number):Promise<RoomRecord>{return this.transaction(()=>{
  const r=this.roomSync(id);assertLobby(r,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(r.hostId===userId,'FORBIDDEN','Only host may configure',403);
  assertLobby(r.status==='LOCKED','ROOM_NOT_LOCKED','Lock room before configuring',409);
  assertLobby(expectedRevision===undefined||r.revision===expectedRevision,'REVISION_CONFLICT','Room configuration changed',409);
  assertLobby(normalDeck(deck)?.length===r.members.length,'INVALID_ROLES','Composition not admitted for current room',409);
  if(r.normalDeck===deck)return r;
  this.db.prepare('UPDATE lobby_rooms SET normal_deck=?,revision=revision+1 WHERE room_id=?').run(deck,id);
  this.db.prepare('UPDATE lobby_members SET ready=0 WHERE room_id=?').run(id);return this.roomSync(id)!;
 });}
 async setRoomReady(id:string,userId:string,ready:boolean,expectedRevision:number):Promise<RoomRecord>{return this.transaction(()=>{
  const r=this.roomSync(id);assertLobby(r,'ROOM_NOT_FOUND','Room not found',404);
  const member=r.members.find(m=>m.id===userId);assertLobby(member,'FORBIDDEN','Room membership required',403);
  assertLobby(r.status==='LOCKED'&&normalDeck(r.normalDeck)?.length===r.members.length,'ROOM_NOT_CONFIGURED','Host must lock and configure composition',409);
  assertLobby(r.revision===expectedRevision,'REVISION_CONFLICT','Room configuration changed; review readiness',409);
  if(member.ready===ready)return r;
  this.db.prepare('UPDATE lobby_members SET ready=? WHERE room_id=? AND user_id=?').run(ready?1:0,id,userId);
  this.db.prepare('UPDATE lobby_rooms SET revision=revision+1 WHERE room_id=?').run(id);return this.roomSync(id)!;
 });}
 async claimNormalCoordinator(gameId:string,actorId:string,expectedRoomRevision:number,connected:ReadonlySet<string>):Promise<StoredGame>{return this.transaction(()=>{
  const row=this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(gameId);assertLobby(row,'GAME_NOT_FOUND','Game not found',404);const g=this.rowToGame(row),r=this.roomSync(g.roomId);assertLobby(r&&g.mode==='NORMAL_GAMEPLAY'&&g.phase!=='GAME_COMPLETED','FORBIDDEN','Active normal match required',403);
  assertLobby(r.members.some(m=>m.id===actorId)&&connected.has(actorId),'FORBIDDEN','Connected human participant required',403);
  assertLobby(r.revision===expectedRoomRevision,'REVISION_CONFLICT','Room changed',409);assertLobby(r.hostId===(g.coordinatorId??g.hostId),'REVISION_CONFLICT','Coordinator mismatch',409);
  assertLobby(r.hostId!==actorId&&!connected.has(r.hostId),'HOST_ONLINE','Current coordinator is still present',409);
  this.db.prepare('UPDATE game_sessions SET coordinator_id=? WHERE game_id=?').run(actorId,gameId);
  this.db.prepare('UPDATE lobby_rooms SET host_id=?,revision=revision+1 WHERE room_id=?').run(actorId,g.roomId);
  this.db.prepare('INSERT INTO normal_coordination_log VALUES(?,?,?,?,?)').run(gameId,r.revision+1,r.hostId,actorId,Date.now());return this.rowToGame(this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(gameId));
 });}
 async coordinationHistory(gameId:string){return this.db.prepare('SELECT * FROM normal_coordination_log WHERE game_id=? ORDER BY room_revision').all(gameId).map((r:any)=>({roomRevision:r.room_revision,fromId:r.from_id,toId:r.to_id,at:r.at_ms}));}
 private rowToGame(r:any):StoredGame{return {gameId:r.game_id,roomId:r.room_id,hostId:r.host_id,coordinatorId:r.coordinator_id??r.host_id,requestKey:r.request_key,startFingerprint:r.start_fingerprint,mode:r.mode,rulePack:r.rule_pack??'FIXTURE',archive:Buffer.from(r.kernel_archive),stateRevision:r.revision,phase:r.phase,ruleVersion:r.rule_version,seedCommitment:r.seed_commitment,assignedAt:r.assigned_at};}
 async gameById(gameId:string):Promise<StoredGame|undefined>{const r=this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(gameId);return r?this.rowToGame(r):undefined;}
 async gameForRoom(roomId:string):Promise<StoredGame|undefined>{const r=this.db.prepare('SELECT * FROM game_sessions WHERE room_id=?').get(roomId);return r?this.rowToGame(r):undefined;}
 async assignmentDraws(gameId:string){return this.db.prepare('SELECT * FROM game_assignment_draws WHERE game_id=? ORDER BY draw_index').all(gameId).map((r:any)=>({drawIndex:r.draw_index,domain:JSON.parse(r.domain_json),result:r.result,reason:'ROLE_ASSIGNMENT' as const,playerId:r.player_id}));}
 private syncProjections(gameId:string,commit:GameCommit):void{
  for(const e of commit.events)this.db.prepare('INSERT OR IGNORE INTO game_events VALUES(?,?,?)').run(gameId,e.sequence,JSON.stringify(e));
  for(const e of commit.events)if(e.eventType==='STATE_COMMITTED'){
   const state=e.payload.state;
   this.db.prepare('INSERT OR IGNORE INTO game_snapshots VALUES(?,?,?)').run(gameId,(state as any).revision,hash(state));
  }
  for(const a of commit.actions)this.db.prepare(`INSERT INTO game_actions VALUES(?,?,?,?,?) ON CONFLICT(game_id,action_id) DO UPDATE SET status=excluded.status`).run(gameId,a.actionId,a.playerId,a.idempotencyKey,a.status);
  for(const d of commit.draws)this.db.prepare('INSERT OR IGNORE INTO game_random_draws VALUES(?,?,?)').run(gameId,d.drawIndex,JSON.stringify(d));
 }
 async startGameAtomic(cmd:StartCommand):Promise<{game:StoredGame;created:boolean}>{return this.transaction(()=>{
  const previous=this.db.prepare('SELECT * FROM game_sessions WHERE room_id=?').get(cmd.roomId);
  if(previous){assertLobby(previous.host_id===cmd.hostId&&previous.request_key===cmd.requestKey&&previous.start_fingerprint===cmd.startFingerprint,'GAME_ALREADY_STARTED','Room already has a game',409);return {game:this.rowToGame(previous),created:false};}
  const room=this.roomSync(cmd.roomId);
  assertLobby(room,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(room.hostId===cmd.hostId,'FORBIDDEN','Only host may start game',403);
  assertLobby(room.status==='LOCKED','ROOM_NOT_LOCKED','Lock room before start',409);
  assertLobby(room.revision===cmd.expectedRoomRevision,'REVISION_CONFLICT','Room changed during role assignment',409);
  assertLobby(room.members.length===cmd.participantIds.length && room.members.every(m=>cmd.participantIds.includes(m.id)),'MEMBERSHIP_CHANGED','Membership changed',409);
  if(cmd.mode==='NORMAL_GAMEPLAY')assertLobby(room.members.every(m=>m.ready)&&normalDeck(room.normalDeck)?.length===room.members.length,'ROOM_NOT_READY','All members must confirm composition',409);
  assertLobby(cmd.state.gameId===cmd.gameId&&cmd.state.roomId===cmd.roomId,'INVALID_GAME','Game state/room mismatch');
  this.db.prepare(`INSERT INTO game_sessions(game_id,room_id,host_id,request_key,start_fingerprint,mode,phase,revision,rule_version,seed_commitment,kernel_archive,assigned_at,rule_pack) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(cmd.gameId,cmd.roomId,cmd.hostId,cmd.requestKey,cmd.startFingerprint,cmd.mode??'INTEGRATION_TEST',cmd.state.phase,cmd.state.revision,cmd.state.ruleVersion,cmd.seedCommitment,cmd.archive,Date.now(),cmd.rulePack??'FIXTURE');
  for(const p of cmd.state.participants)this.db.prepare('INSERT INTO game_participants VALUES(?,?,?,?,?,?)').run(cmd.gameId,p.playerId,p.initialCharacterId,p.currentCharacterId,p.initialFaction,p.currentFaction);
  for(const d of cmd.assignments)this.db.prepare('INSERT INTO game_assignment_draws VALUES(?,?,?,?,?,?)').run(cmd.gameId,d.drawIndex,JSON.stringify(d.domain),d.result,d.reason,d.playerId);
  this.db.prepare("UPDATE lobby_rooms SET status='IN_GAME',revision=revision+1 WHERE room_id=?").run(cmd.roomId);
  this.db.prepare('INSERT INTO room_game_links VALUES(?,?,?,?)').run(cmd.roomId,cmd.gameId,cmd.state.ruleVersion,Date.now());
  this.db.prepare('INSERT INTO game_snapshots VALUES(?,?,?)').run(cmd.gameId,0,cmd.initialStateHash);
  this.syncProjections(cmd.gameId,{archive:cmd.archive,state:cmd.state,events:cmd.events,draws:cmd.draws,actions:cmd.actions,result:null});
  return {game:this.rowToGame(this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(cmd.gameId)),created:true};
 });}
 async withGameMutation<T>(gameId:string,mutate:(current:StoredGame)=>GameCommit&{result:T}):Promise<{game:StoredGame;result:T}>{return this.transaction(()=>{
  const row=this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(gameId);
  assertLobby(row,'GAME_NOT_FOUND','Game not found',404);
  const before=this.rowToGame(row),commit=mutate(before);
  assertLobby(commit.state.gameId===gameId&&commit.state.revision>=before.stateRevision,'REVISION_CONFLICT','Invalid game revision',409);
  const updated=this.db.prepare('UPDATE game_sessions SET kernel_archive=?,phase=?,revision=? WHERE game_id=? AND revision=?').run(commit.archive,commit.state.phase,commit.state.revision,gameId,before.stateRevision);
  assertLobby(updated.changes===1,'REVISION_CONFLICT','Game changed concurrently',409);
  this.syncProjections(gameId,commit);
  return {game:this.rowToGame(this.db.prepare('SELECT * FROM game_sessions WHERE game_id=?').get(gameId)),result:commit.result};
 });}
 async close(){this.db.close();}
}
