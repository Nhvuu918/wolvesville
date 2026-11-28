/** Sprint 02A social identity and lobby records. No character secret is stored here. */
export interface Account {id:string;publicId:string;username:string;displayName:string;passwordHash:string;createdAt:number}
export type PublicProfile = Pick<Account,'id'|'publicId'|'displayName'>;
export interface RoomMember extends PublicProfile {joinedAt:number;ready?:boolean}
export type RoomStatus='WAITING'|'LOCKED'|'IN_GAME'|'CLOSED';
export interface RoomRecord {id:string;name:string;hostId:string;capacity:number;status:RoomStatus;revision:number;createdAt:number;members:RoomMember[];normalDeck?:string}
export interface RoomListRecord {id:string;name:string;capacity:number;occupied:number;status:RoomStatus;revision:number}
export interface MultiplayerStore {
  social?:import('../social/repository.js').SocialRepository;
  createAccount(a:Account):Promise<void>;
  // Atomic demo identity + authentication session. No shared/demo password is returned.
  createDemoIdentity(a:Account, tokenHash:string, expiresAt:number):Promise<void>;
  isDemoAccount(userId:string):Promise<boolean>;
  // Explicit safe cleanup: delete only expired, unreferenced demo identities.
  cleanupExpiredDemoAccounts(now:number):Promise<{deleted:number;retained:number}>;
  accountByUsername(username:string):Promise<Account|undefined>;
  accountById(id:string):Promise<Account|undefined>;
  createSession(tokenHash:string,userId:string,expiresAt:number):Promise<void>;
  accountForSession(tokenHash:string,now:number):Promise<Account|undefined>;
  revokeSession(tokenHash:string):Promise<void>;
  updateDisplayName(id:string,displayName:string):Promise<Account>;
  roomIdsForUser(id:string):Promise<string[]>;
  createRoom(room:{id:string;name:string;hostId:string;capacity:number;createdAt:number}):Promise<RoomRecord>;
  joinRoom(roomId:string,userId:string,joinedAt:number):Promise<RoomRecord>;
  leaveRoom(roomId:string,userId:string):Promise<RoomRecord|null>;
  getRoom(roomId:string):Promise<RoomRecord|undefined>;
  listRooms():Promise<RoomListRecord[]>;
  setRoomLocked(roomId:string,hostId:string,locked:boolean):Promise<RoomRecord>;
  configureNormalRoom?(roomId:string,hostId:string,deck:string,expectedRevision?:number):Promise<RoomRecord>;
  setRoomReady?(roomId:string,playerId:string,ready:boolean,expectedRevision:number):Promise<RoomRecord>;
  healthCheck?():Promise<void>;
  close():Promise<void>;
}
export class LobbyError extends Error {constructor(public code:string,message:string,public status=400){super(message);this.name='LobbyError';}}
export function assertLobby(ok:unknown,code:string,msg:string,status=400):asserts ok {if(!ok)throw new LobbyError(code,msg,status);}
export function publicProfile(a:Account):PublicProfile{return {id:a.id,publicId:a.publicId,displayName:a.displayName};}
