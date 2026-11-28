/** Test-only trusted archive fixture, never loaded by production server.
 * Used for positive transport/DOM acceptance; does not execute recruitment. */
import {randomUUID,randomBytes,createHmac,createHash} from 'node:crypto';
import {withKernel} from '../../dist/backend/src/game/archive.js';
import {draw} from '../../dist/backend/src/engine/rng.js';
import {grantCommittedCultChat} from '../../dist/backend/src/official/group-chat.js';
import {SqliteMultiplayerStore} from '../../dist/backend/src/multiplayer/sqlite-store.js';
import {pathToFileURL} from 'node:url';
export const roles=[25,28,74,84,90];
export function seedState(roomId,people,gameId,seed){
 const k=withKernel(undefined,false,e=>e.createGame(roomId,people,{gameId,seed}),true),s=k.state;
 const owner=s.participants.find(p=>p.initialCharacterId===90),member=s.participants.find(p=>p.initialCharacterId===25);
 s.phase='NIGHT_RESOLVE';const group=grantCommittedCultChat(s,owner.playerId,member.playerId,'fixture-committed-recruit');
 member.effects.push({id:'fixture-mute',kind:'S14_PUBLIC_MUTE',expiresAtRound:1,payload:{sourceRule:'VH57'}});s.phase='DAY_DISCUSS';
 // A storage-level fixture only; no client endpoint creates grants.
 return {s,group,owner:owner.playerId,member:member.playerId,outsider:s.participants.find(p=>p.initialCharacterId===74).playerId};
}
export function archive(s){return withKernel(undefined,false,(_e,r)=>{r.create(s);return s;},true);}

export async function startGroupFixture(store,roomId){
 const locked=await store.getRoom(roomId),gid=randomUUID(),seed=randomBytes(32).toString('hex'),roleSeed=createHmac('sha256',seed).update('wolvesville:role-assignment:02B:v1').digest('hex'),players=locked.members.map(u=>u.id).sort(),pool=[...roles],people=[],assignments=[];
 for(const [i,playerId] of players.entries()){const d=draw(roleSeed,gid,i,pool.map(String),'ROLE_ASSIGNMENT',`seat-${i}`),characterId=Number(d.result);people.push({playerId,characterId});assignments.push({drawIndex:i,domain:d.domain,result:d.result,reason:'ROLE_ASSIGNMENT',playerId});pool.splice(pool.indexOf(characterId),1);}
 const f=seedState(roomId,people,gid,seed),k=archive(f.s);await store.startGameAtomic({mode:'INTEGRATION_TEST',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',roomId:roomId,hostId:locked.hostId,expectedRoomRevision:locked.revision,requestKey:randomUUID(),startFingerprint:'trusted-fixture',gameId:gid,participantIds:players,archive:k.archive,state:k.state,assignments,seedCommitment:createHash('sha256').update(seed).digest('hex'),events:k.events,draws:k.draws,actions:k.actions,initialStateHash:k.initialStateHash});
 return {gameId:gid};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 if(process.env.WV_OFFICIAL_RULE_TEST_MODE!=='1'||!process.env.WV_E2E_SERVER||!process.env.WV_LOBBY_DB||!process.argv[2])throw Error('Test-only isolated browser fixture required');
 const store=new SqliteMultiplayerStore(process.env.WV_LOBBY_DB);
 try{console.log(JSON.stringify(await startGroupFixture(store,process.argv[2])));}finally{await store.close();}
}
