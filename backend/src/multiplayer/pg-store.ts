import {SocialRepository,type Query} from '../social/repository.js';
import type {Account,MultiplayerStore,RoomRecord,RoomListRecord,RoomMember} from './types.js';
import {assertLobby} from './types.js';
import {LobbyError} from './types.js';
import type {GameStore,StartCommand,StoredGame,GameCommit} from '../game/types.js';
import {hash} from '../common/canonical.js';
import {normalDeck} from '../game/normal-decks.js';
interface QueryResult<T=any>{rows:T[];rowCount:number|null}
interface PgClient {query<T=any>(sql:string,params?:unknown[]):Promise<QueryResult<T>>;release():void}
interface PgPool {query<T=any>(sql:string,params?:unknown[]):Promise<QueryResult<T>>;connect():Promise<PgClient>;end():Promise<void>}
const accountColumns='id,public_id,username,display_name,password_hash,created_at';
function toAccount(r:any):Account{return {id:r.id,publicId:r.public_id,username:r.username,displayName:r.display_name,passwordHash:r.password_hash,createdAt:Number(r.created_at)};}
export class PostgresMultiplayerStore implements MultiplayerStore,GameStore{
 readonly social:SocialRepository;
 constructor(private pool:PgPool){const adapt=(c:PgPool|PgClient):Query=>async(sql,args=[])=>{let n=0;return (await c.query(sql.replace(/\buser_accounts\b/g,'wv_accounts').replace(/\bgame_participants\b/g,'wv_game_participants').replace(/\bgame_sessions\b/g,'wv_game_sessions').replace(/\blobby_rooms\b/g,'wv_rooms').replace(/\bgame_events\b/g,'wv_game_events').replace(/\bgame_actions\b/g,'wv_game_actions').replace(/\bdemo_account_meta\b/g,'wv_demo_account_meta').replace("json_extract(x.body_json,'$.eventType')","(x.body_json->>'eventType')").replace(/\?/g,()=>`$${++n}`),args)).rows;};this.social=new SocialRepository({query:adapt(pool),transaction:fn=>this.tx(c=>fn(adapt(c)))});}
 static async connect(connectionString:string,schema?:string):Promise<PostgresMultiplayerStore>{
  // The dynamic import deliberately keeps the SQLite kernel runnable without pg.
  const name='pg';let mod:any;try{mod=await import(name);}catch{throw new Error('PostgreSQL driver not installed: run npm install (pg)');}
  if(schema)assertLobby(/^[a-z][a-z0-9_]{0,62}$/.test(schema),'INVALID_ARGUMENT','Invalid isolated PostgreSQL schema');
  const pool=new mod.Pool({connectionString,max:10,connectionTimeoutMillis:5000,statement_timeout:10000,...(schema?{options:`-c search_path=${schema}`}:{})});
  try{await pool.query('SELECT 1');return new PostgresMultiplayerStore(pool);}
  catch(error){await pool.end().catch(()=>{});const code=(error as {code?:string}).code;
   if(code==='28P01')throw new Error('PostgreSQL authentication failed (28P01). Verify DATABASE_URL credentials for your existing container; password is not logged.');
   throw error;}
 }
 private async tx<T>(f:(c:PgClient)=>Promise<T>):Promise<T>{const c=await this.pool.connect();try{
  await c.query('BEGIN');const result=await f(c);await c.query('COMMIT');return result;
 }catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
 async healthCheck(){await this.pool.query('SELECT 1 FROM wv_accounts LIMIT 1');await this.pool.query('SELECT 1 FROM wv_game_sessions LIMIT 1');await this.pool.query('SELECT 1 FROM social_profiles LIMIT 1');await this.pool.query('SELECT 1 FROM social_post_media LIMIT 1');await this.pool.query('SELECT 1 FROM saved_decks LIMIT 1');await this.pool.query('SELECT 1 FROM account_preferences LIMIT 1');}
 async createAccount(a:Account){try{await this.pool.query('INSERT INTO wv_accounts VALUES($1,$2,$3,$4,$5,$6)',[a.id,a.publicId,a.username,a.displayName,a.passwordHash,a.createdAt]);}
 catch(e){if((e as any).code==='23505')throw new Error('ACCOUNT_DUPLICATE');throw e;}}
 async createDemoIdentity(a:Account,tokenHash:string,expiresAt:number):Promise<void>{
  await this.tx(async c=>{
   await c.query('INSERT INTO wv_accounts VALUES($1,$2,$3,$4,$5,$6)',[a.id,a.publicId,a.username,a.displayName,a.passwordHash,a.createdAt]);
   await c.query('INSERT INTO wv_demo_account_meta(user_id,created_at,expires_at) VALUES($1,$2,$3)',[a.id,a.createdAt,expiresAt]);
   await c.query('INSERT INTO wv_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[tokenHash,a.id,expiresAt]);
  });
 }
 async isDemoAccount(userId:string):Promise<boolean>{return (await this.pool.query('SELECT 1 FROM wv_demo_account_meta WHERE user_id=$1',[userId])).rows.length>0;}
 async cleanupExpiredDemoAccounts(now:number):Promise<{deleted:number;retained:number}>{return this.tx(async c=>{
  await c.query('UPDATE wv_sessions SET revoked=TRUE WHERE user_id IN (SELECT user_id FROM wv_demo_account_meta WHERE expires_at<=$1)',[now]);
  const count=await c.query('SELECT COUNT(*)::integer AS n FROM wv_demo_account_meta WHERE expires_at<=$1',[now]);
  const removed=await c.query(`DELETE FROM wv_accounts WHERE id IN (
   SELECT d.user_id FROM wv_demo_account_meta d WHERE d.expires_at<=$1
   AND NOT EXISTS(SELECT 1 FROM wv_members m WHERE m.user_id=d.user_id)
   AND NOT EXISTS(SELECT 1 FROM wv_rooms r WHERE r.host_id=d.user_id)
   AND NOT EXISTS(SELECT 1 FROM wv_game_participants p WHERE p.player_id=d.user_id)
  ) RETURNING id`,[now]);
  return {deleted:removed.rows.length,retained:Number(count.rows[0].n)-removed.rows.length};
 });}
 async accountByUsername(username:string){const r=await this.pool.query(`SELECT ${accountColumns} FROM wv_accounts WHERE username=$1`,[username]);return r.rows[0]?toAccount(r.rows[0]):undefined;}
 async accountById(id:string){const r=await this.pool.query(`SELECT ${accountColumns} FROM wv_accounts WHERE id=$1`,[id]);return r.rows[0]?toAccount(r.rows[0]):undefined;}
 async createSession(tokenHash:string,userId:string,expiresAt:number){await this.pool.query('INSERT INTO wv_sessions(token_hash,user_id,expires_at) VALUES($1,$2,$3)',[tokenHash,userId,expiresAt]);}
 async accountForSession(tokenHash:string,now:number){const r=await this.pool.query(`SELECT ${accountColumns.replace(/\b(id|public_id|username|display_name|password_hash|created_at)\b/g,'a.$1')} FROM wv_sessions s JOIN wv_accounts a ON a.id=s.user_id WHERE s.token_hash=$1 AND s.revoked=FALSE AND s.expires_at>$2 AND NOT EXISTS(SELECT 1 FROM wv_demo_account_meta d WHERE d.user_id=a.id AND d.expires_at<=$2)`,[tokenHash,now]);return r.rows[0]?toAccount(r.rows[0]):undefined;}
 async revokeSession(tokenHash:string){await this.pool.query('UPDATE wv_sessions SET revoked=TRUE WHERE token_hash=$1',[tokenHash]);}
 async updateDisplayName(id:string,name:string):Promise<Account>{
  const r=await this.pool.query('UPDATE wv_accounts SET display_name=$1 WHERE id=$2 RETURNING *',[name,id]);
  assertLobby(r.rows[0],'ACCOUNT_NOT_FOUND','Account not found',404);
  return toAccount(r.rows[0]);
 }
 async roomIdsForUser(id:string):Promise<string[]>{const r=await this.pool.query('SELECT room_id FROM wv_members WHERE user_id=$1',[id]);return r.rows.map(row=>row.room_id);}

 private async room(c:PgClient,id:string):Promise<RoomRecord|undefined>{
  const {rows}=await c.query('SELECT * FROM wv_rooms WHERE room_id=$1',[id]);const r=rows[0];if(!r)return undefined;
  const people=await c.query('SELECT a.id,a.public_id,a.display_name,m.joined_at,COALESCE((to_jsonb(m)->>\'ready\')::boolean,false) AS ready FROM wv_members m JOIN wv_accounts a ON a.id=m.user_id WHERE m.room_id=$1 ORDER BY m.joined_at,a.id',[id]);
  const members:RoomMember[]=people.rows.map(p=>({id:p.id,publicId:p.public_id,displayName:p.display_name,joinedAt:Number(p.joined_at),ready:!!p.ready}));
  return {id:r.room_id,name:r.room_name,hostId:r.host_id,capacity:r.capacity,status:r.status,revision:Number(r.revision),createdAt:Number(r.created_at),members,...(r.normal_deck?{normalDeck:r.normal_deck}:{})};
 }
 async createRoom(room:{id:string;name:string;hostId:string;capacity:number;createdAt:number}):Promise<RoomRecord>{return this.tx(async c=>{
  await c.query("INSERT INTO wv_rooms(room_id,room_name,host_id,capacity,status,revision,created_at) VALUES($1,$2,$3,$4,'WAITING',1,$5)",[room.id,room.name,room.hostId,room.capacity,room.createdAt]);
  await c.query('INSERT INTO wv_members(room_id,user_id,joined_at) VALUES($1,$2,$3)',[room.id,room.hostId,room.createdAt]);return (await this.room(c,room.id))!;
 });}
 async joinRoom(id:string,userId:string,joinedAt:number):Promise<RoomRecord>{return this.tx(async c=>{
  const lock=await c.query('SELECT room_id FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[id]);assertLobby(lock.rows[0],'ROOM_NOT_FOUND','Room not found',404);
  const r=(await this.room(c,id))!;
  if(r.members.some(p=>p.id===userId))return r;
  assertLobby(r.status==='WAITING','ROOM_LOCKED','Room cannot accept members',409);
  assertLobby(r.members.length<r.capacity,'ROOM_FULL','Room is full',409);
  await c.query('INSERT INTO wv_members(room_id,user_id,joined_at) VALUES($1,$2,$3)',[id,userId,joinedAt]);
  await c.query('UPDATE wv_rooms SET revision=revision+1 WHERE room_id=$1',[id]);return (await this.room(c,id))!;
 });}
 async leaveRoom(id:string,userId:string):Promise<RoomRecord|null>{return this.tx(async c=>{
  const lock=await c.query('SELECT room_id FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[id]);assertLobby(lock.rows[0],'ROOM_NOT_FOUND','Room not found',404);
  const room=(await this.room(c,id))!;assertLobby(room.members.some(p=>p.id===userId),'NOT_MEMBER','Not a room member',403);
  assertLobby(room.status==='WAITING'||room.status==='LOCKED','ROOM_ACTIVE','Cannot leave active game in lobby API',409);
  await c.query('DELETE FROM wv_members WHERE room_id=$1 AND user_id=$2',[id,userId]);if(room.normalDeck){await c.query('UPDATE wv_rooms SET normal_deck=NULL WHERE room_id=$1',[id]);await c.query('UPDATE wv_members SET ready=FALSE WHERE room_id=$1',[id]);}const after=(await this.room(c,id))!;
  if(after.members.length===0){await c.query('DELETE FROM wv_rooms WHERE room_id=$1',[id]);return null;}
  const host=room.hostId===userId?after.members[0]!.id:room.hostId;
  await c.query('UPDATE wv_rooms SET host_id=$1,revision=revision+1 WHERE room_id=$2',[host,id]);return (await this.room(c,id))!;
 });}
 async getRoom(id:string):Promise<RoomRecord|undefined>{const c=await this.pool.connect();try{return await this.room(c,id);}finally{c.release();}}
 async listRooms():Promise<RoomListRecord[]>{const r=await this.pool.query("SELECT r.room_id,r.room_name,r.capacity,r.status,r.revision,COUNT(m.user_id)::integer AS occupied FROM wv_rooms r LEFT JOIN wv_members m ON m.room_id=r.room_id WHERE r.status!='CLOSED' GROUP BY r.room_id ORDER BY r.created_at DESC");return r.rows.map(x=>({id:x.room_id,name:x.room_name,capacity:x.capacity,occupied:x.occupied,status:x.status,revision:Number(x.revision)}));}
 async setRoomLocked(id:string,userId:string,locked:boolean):Promise<RoomRecord>{return this.tx(async c=>{
  const r=await c.query('SELECT * FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[id]);const row=r.rows[0];assertLobby(row,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(row.host_id===userId,'FORBIDDEN','Only host may change lock',403);
  assertLobby(row.status==='WAITING'||row.status==='LOCKED','ROOM_ACTIVE','Cannot modify active room',409);
  if(row.normal_deck){await c.query('UPDATE wv_rooms SET normal_deck=NULL WHERE room_id=$1',[id]);await c.query('UPDATE wv_members SET ready=FALSE WHERE room_id=$1',[id]);}
  await c.query('UPDATE wv_rooms SET status=$1,revision=revision+1 WHERE room_id=$2',[locked?'LOCKED':'WAITING',id]);return (await this.room(c,id))!;
 });}
 async configureNormalRoom(id:string,userId:string,deck:string,expectedRevision?:number):Promise<RoomRecord>{return this.tx(async c=>{
  const lock=await c.query('SELECT room_id FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[id]);assertLobby(lock.rows[0],'ROOM_NOT_FOUND','Room not found',404);
  const r=(await this.room(c,id))!;assertLobby(r.hostId===userId,'FORBIDDEN','Only host may configure',403);
  assertLobby(r.status==='LOCKED','ROOM_NOT_LOCKED','Lock room before configuring',409);
  assertLobby(expectedRevision===undefined||r.revision===expectedRevision,'REVISION_CONFLICT','Room configuration changed',409);
  assertLobby(normalDeck(deck)?.length===r.members.length,'INVALID_ROLES','Composition not admitted for current room',409);
  if(r.normalDeck===deck)return r;
  await c.query('UPDATE wv_rooms SET normal_deck=$1,revision=revision+1 WHERE room_id=$2',[deck,id]);await c.query('UPDATE wv_members SET ready=FALSE WHERE room_id=$1',[id]);return (await this.room(c,id))!;
 });}
 async setRoomReady(id:string,userId:string,ready:boolean,expectedRevision:number):Promise<RoomRecord>{return this.tx(async c=>{
  const lock=await c.query('SELECT room_id FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[id]);assertLobby(lock.rows[0],'ROOM_NOT_FOUND','Room not found',404);
  const r=(await this.room(c,id))!;const member=r.members.find(m=>m.id===userId);assertLobby(member,'FORBIDDEN','Room membership required',403);
  assertLobby(r.status==='LOCKED'&&normalDeck(r.normalDeck)?.length===r.members.length,'ROOM_NOT_CONFIGURED','Host must lock and configure composition',409);
  assertLobby(r.revision===expectedRevision,'REVISION_CONFLICT','Room configuration changed; review readiness',409);
  if(member.ready===ready)return r;
  await c.query('UPDATE wv_members SET ready=$1 WHERE room_id=$2 AND user_id=$3',[ready,id,userId]);await c.query('UPDATE wv_rooms SET revision=revision+1 WHERE room_id=$1',[id]);return (await this.room(c,id))!;
 });}
 async claimNormalCoordinator(gameId:string,actorId:string,expectedRoomRevision:number,connected:ReadonlySet<string>):Promise<StoredGame>{return this.tx(async c=>{
  const games=await c.query('SELECT * FROM wv_game_sessions WHERE game_id=$1 FOR UPDATE',[gameId]);assertLobby(games.rows[0],'GAME_NOT_FOUND','Game not found',404);const g=this.toGame(games.rows[0]);await c.query('SELECT room_id FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[g.roomId]);const r=await this.room(c,g.roomId);assertLobby(r&&g.mode==='NORMAL_GAMEPLAY'&&g.phase!=='GAME_COMPLETED','FORBIDDEN','Active normal match required',403);
  assertLobby(r.members.some(m=>m.id===actorId)&&connected.has(actorId),'FORBIDDEN','Connected human participant required',403);assertLobby(r.revision===expectedRoomRevision&&r.hostId===(g.coordinatorId??g.hostId),'REVISION_CONFLICT','Room changed',409);assertLobby(r.hostId!==actorId&&!connected.has(r.hostId),'HOST_ONLINE','Current coordinator is still present',409);
  await c.query('UPDATE wv_game_sessions SET coordinator_id=$1 WHERE game_id=$2',[actorId,gameId]);await c.query('UPDATE wv_rooms SET host_id=$1,revision=revision+1 WHERE room_id=$2',[actorId,g.roomId]);await c.query('INSERT INTO wv_normal_coordination_log VALUES($1,$2,$3,$4,$5)',[gameId,r.revision+1,r.hostId,actorId,Date.now()]);return this.toGame((await c.query('SELECT * FROM wv_game_sessions WHERE game_id=$1',[gameId])).rows[0]);
 });}
 async coordinationHistory(gameId:string){return (await this.pool.query('SELECT * FROM wv_normal_coordination_log WHERE game_id=$1 ORDER BY room_revision',[gameId])).rows.map(r=>({roomRevision:Number(r.room_revision),fromId:r.from_id,toId:r.to_id,at:Number(r.at_ms)}));}
 private toGame(r:any):StoredGame{return {gameId:r.game_id,roomId:r.room_id,hostId:r.host_id,coordinatorId:r.coordinator_id??r.host_id,requestKey:r.request_key,startFingerprint:r.start_fingerprint,mode:r.mode,rulePack:r.rule_pack??'FIXTURE',archive:Buffer.from(r.kernel_archive),stateRevision:Number(r.revision),phase:r.phase,ruleVersion:r.rule_version,seedCommitment:r.seed_commitment,assignedAt:Number(r.assigned_at)};}
 async gameById(id:string):Promise<StoredGame|undefined>{const r=await this.pool.query('SELECT * FROM wv_game_sessions WHERE game_id=$1',[id]);return r.rows[0]?this.toGame(r.rows[0]):undefined;}
 async gameForRoom(id:string):Promise<StoredGame|undefined>{const r=await this.pool.query('SELECT * FROM wv_game_sessions WHERE room_id=$1',[id]);return r.rows[0]?this.toGame(r.rows[0]):undefined;}
 async assignmentDraws(gameId:string){const r=await this.pool.query('SELECT * FROM wv_game_assignment_draws WHERE game_id=$1 ORDER BY draw_index',[gameId]);return r.rows.map((x:any)=>({drawIndex:Number(x.draw_index),domain:x.domain_json,result:x.result,reason:'ROLE_ASSIGNMENT' as const,playerId:x.player_id}));}
 private async projections(c:PgClient,id:string,commit:GameCommit):Promise<void>{
  for(const e of commit.events)await c.query('INSERT INTO wv_game_events VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING',[id,e.sequence,JSON.stringify(e)]);
  for(const e of commit.events)if(e.eventType==='STATE_COMMITTED')await c.query('INSERT INTO wv_game_snapshots VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[id,(e.payload.state as any).revision,hash(e.payload.state)]);
  for(const a of commit.actions)await c.query('INSERT INTO wv_game_actions VALUES($1,$2,$3,$4,$5) ON CONFLICT(game_id,action_id) DO UPDATE SET status=EXCLUDED.status',[id,a.actionId,a.playerId,a.idempotencyKey,a.status]);
  for(const d of commit.draws)await c.query('INSERT INTO wv_game_random_draws VALUES($1,$2,$3::jsonb) ON CONFLICT DO NOTHING',[id,d.drawIndex,JSON.stringify(d)]);
 }
 async startGameAtomic(cmd:StartCommand):Promise<{game:StoredGame;created:boolean}>{return this.tx(async c=>{
  const locked=await c.query('SELECT * FROM wv_rooms WHERE room_id=$1 FOR UPDATE',[cmd.roomId]);const row=locked.rows[0];
  assertLobby(row,'ROOM_NOT_FOUND','Room not found',404);
  const previous=await c.query('SELECT * FROM wv_game_sessions WHERE room_id=$1',[cmd.roomId]);
  if(previous.rows[0]){const g=this.toGame(previous.rows[0]);assertLobby(g.hostId===cmd.hostId&&g.requestKey===cmd.requestKey&&g.startFingerprint===cmd.startFingerprint,'GAME_ALREADY_STARTED','Room already has a game',409);return {game:g,created:false};}
  assertLobby(row.host_id===cmd.hostId,'FORBIDDEN','Only host may start game',403);
  assertLobby(row.status==='LOCKED','ROOM_NOT_LOCKED','Lock room before start',409);
  assertLobby(Number(row.revision)===cmd.expectedRoomRevision,'REVISION_CONFLICT','Room changed while preparing game',409);
  const members=await c.query('SELECT user_id FROM wv_members WHERE room_id=$1',[cmd.roomId]);const ids=members.rows.map(r=>r.user_id);
  assertLobby(ids.length===cmd.participantIds.length&&ids.every((id:string)=>cmd.participantIds.includes(id)),'MEMBERSHIP_CHANGED','Membership changed',409);
  if(cmd.mode==='NORMAL_GAMEPLAY'){const r=(await this.room(c,cmd.roomId))!;assertLobby(r.members.every(m=>m.ready)&&normalDeck(r.normalDeck)?.length===r.members.length,'ROOM_NOT_READY','All members must confirm composition',409);}
  assertLobby(cmd.state.gameId===cmd.gameId&&cmd.state.roomId===cmd.roomId,'INVALID_GAME','Game state/room mismatch');
  await c.query('INSERT INTO wv_game_sessions(game_id,room_id,host_id,request_key,start_fingerprint,mode,phase,revision,rule_version,seed_commitment,kernel_archive,assigned_at,rule_pack) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)',[cmd.gameId,cmd.roomId,cmd.hostId,cmd.requestKey,cmd.startFingerprint,cmd.mode??'INTEGRATION_TEST',cmd.state.phase,cmd.state.revision,cmd.state.ruleVersion,cmd.seedCommitment,cmd.archive,Date.now(),cmd.rulePack??'FIXTURE']);
  for(const p of cmd.state.participants)await c.query('INSERT INTO wv_game_participants VALUES($1,$2,$3,$4,$5,$6)',[cmd.gameId,p.playerId,p.initialCharacterId,p.currentCharacterId,p.initialFaction,p.currentFaction]);
  for(const d of cmd.assignments)await c.query('INSERT INTO wv_game_assignment_draws VALUES($1,$2,$3::jsonb,$4,$5,$6)',[cmd.gameId,d.drawIndex,JSON.stringify(d.domain),d.result,d.reason,d.playerId]);
  await c.query("UPDATE wv_rooms SET status='IN_GAME',revision=revision+1 WHERE room_id=$1",[cmd.roomId]);
  await c.query('INSERT INTO wv_room_game_links VALUES($1,$2,$3,$4)',[cmd.roomId,cmd.gameId,cmd.state.ruleVersion,Date.now()]);
  await c.query('INSERT INTO wv_game_snapshots VALUES($1,0,$2)',[cmd.gameId,cmd.initialStateHash]);
  await this.projections(c,cmd.gameId,{archive:cmd.archive,state:cmd.state,events:cmd.events,draws:cmd.draws,actions:cmd.actions,result:null});
  return {game:this.toGame((await c.query('SELECT * FROM wv_game_sessions WHERE game_id=$1',[cmd.gameId])).rows[0]),created:true};
 });}
 async withGameMutation<T>(gameId:string,mutate:(current:StoredGame)=>GameCommit&{result:T}):Promise<{game:StoredGame;result:T}>{return this.tx(async c=>{
  const r=await c.query('SELECT * FROM wv_game_sessions WHERE game_id=$1 FOR UPDATE',[gameId]);assertLobby(r.rows[0],'GAME_NOT_FOUND','Game not found',404);
  const old=this.toGame(r.rows[0]);const commit=mutate(old);
  assertLobby(commit.state.gameId===gameId&&commit.state.revision>=old.stateRevision,'REVISION_CONFLICT','Invalid game revision',409);
  await c.query('UPDATE wv_game_sessions SET kernel_archive=$1,phase=$2,revision=$3 WHERE game_id=$4',[commit.archive,commit.state.phase,commit.state.revision,gameId]);
  await this.projections(c,gameId,commit);
  return {game:this.toGame((await c.query('SELECT * FROM wv_game_sessions WHERE game_id=$1',[gameId])).rows[0]),result:commit.result};
 });}
 async close(){await this.pool.end();}
}
