import type {GameState,EngineEvent,RandomRecord} from '../../../shared/contracts/index.js';
export interface AssignmentDraw {drawIndex:number;domain:string[];result:string;reason:'ROLE_ASSIGNMENT';playerId:string}
export type GameRulePack='FIXTURE'|'OFFICIAL_ROLE_INSPECTION_V1';
export type GameMode='INTEGRATION_TEST'|'NORMAL_GAMEPLAY';
export interface StartCommand {mode?:GameMode;rulePack?:GameRulePack;roomId:string;hostId:string;expectedRoomRevision:number;requestKey:string;startFingerprint:string;gameId:string;participantIds:string[];archive:Buffer;state:GameState;assignments:AssignmentDraw[];seedCommitment:string;events:EngineEvent[];draws:RandomRecord[];actions:GameCommit['actions'];initialStateHash:string}
export interface StoredGame {gameId:string;roomId:string;hostId:string;coordinatorId?:string;requestKey:string;startFingerprint:string;mode:GameMode;rulePack:GameRulePack;archive:Buffer;stateRevision:number;phase:string;ruleVersion:string;seedCommitment:string;assignedAt:number}
export interface GameCommit {archive:Buffer;state:GameState;events:EngineEvent[];draws:RandomRecord[];actions: Array<{actionId:string;playerId:string;idempotencyKey:string;status:string}>;result:unknown}
export interface CoordinationChange {roomRevision:number;fromId:string;toId:string;at:number}
export interface GameStore {
 claimNormalCoordinator?(gameId:string,actorId:string,expectedRoomRevision:number,connected:ReadonlySet<string>):Promise<StoredGame>;
 coordinationHistory?(gameId:string):Promise<CoordinationChange[]>;
 startGameAtomic(command:StartCommand):Promise<{game:StoredGame;created:boolean}>;
 gameById(gameId:string):Promise<StoredGame|undefined>;
 gameForRoom(roomId:string):Promise<StoredGame|undefined>;
 assignmentDraws(gameId:string):Promise<AssignmentDraw[]>;
 withGameMutation<T>(gameId:string,mutate:(current:StoredGame)=>GameCommit&{result:T}):Promise<{game:StoredGame;result:T}>;
}
export function isGameStore(value:unknown):value is GameStore{return !!value&&typeof (value as any).startGameAtomic==='function'&&typeof (value as any).withGameMutation==='function';}
