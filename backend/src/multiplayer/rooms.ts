import {randomUUID} from 'node:crypto';
import {assertLobby} from './types.js';
import type {MultiplayerStore,RoomRecord,RoomListRecord} from './types.js';
export class RoomService {
 constructor(private readonly store:MultiplayerStore){}
 async create(userId:string,input:{name:unknown;capacity:unknown}):Promise<RoomRecord>{
  assertLobby(typeof input.name==='string'&&input.name.trim().length>=1&&input.name.length<=72,'INVALID_ROOM','Room name required (up to 72 chars)');
  assertLobby(Number.isInteger(input.capacity)&&Number(input.capacity)>=1&&Number(input.capacity)<=100,'INVALID_CAPACITY','Capacity must be 1–100');
  return this.store.createRoom({id:randomUUID(),name:input.name.trim(),capacity:Number(input.capacity),hostId:userId,createdAt:Date.now()});
 }
 async join(userId:string,roomId:string){return this.store.joinRoom(roomId,userId,Date.now());}
 async leave(userId:string,roomId:string){return this.store.leaveRoom(roomId,userId);}
 async detail(userId:string,roomId:string):Promise<RoomRecord>{
  const room=await this.store.getRoom(roomId);assertLobby(room,'ROOM_NOT_FOUND','Room not found',404);
  assertLobby(room.members.some(m=>m.id===userId),'NOT_MEMBER','Room membership required',403);
  return room;
 }
 async lock(userId:string,roomId:string,locked:boolean){return this.store.setRoomLocked(roomId,userId,locked);}
 async discover():Promise<RoomListRecord[]>{return this.store.listRooms();}
}
