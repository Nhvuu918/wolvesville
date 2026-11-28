import {life02Enabled,full50CandidateEnabled} from '../official/life02.js';
import {cultEnabled} from '../official/cult-recruitment.js';
import {liveEnabled} from '../experimental/owner-bb-v2/live-profile.js';
import {processMedia} from '../social/media.js';
import {ruleLookup} from '../social/rule-assistant.js';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve as pathResolve,sep as pathSep} from 'node:path';
import {URL} from 'node:url';
import type {IncomingMessage,ServerResponse,Server} from 'node:http';
import type {Socket} from 'node:net';
import {AuthService} from './auth.js';
import {RoomService} from './rooms.js';
import {acceptWebSocket,Peer} from './ws.js';
import {LobbyError,assertLobby,publicProfile} from './types.js';
import type {MultiplayerStore,Account,RoomRecord} from './types.js';
import {GameCoordinator} from '../game/coordinator.js';
import {isGameStore} from '../game/types.js';
import {KernelError} from '../common/errors.js';
import {normalDeck,listNormalDecks,resolveCustomDeck} from '../game/normal-decks.js';

interface Connection {peer:Peer;token:string;userId:string;roomIds:Set<string>;gameIds:Set<string>}
export interface ServerHandle {server:Server;start(port?:number,host?:string):Promise<number>;close():Promise<void>}
const MAX_BODY=32*1024;
const SECURITY_HEADERS:Record<string,string>={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'"};
function answer(res:ServerResponse,status:number,data:unknown){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',...SECURITY_HEADERS});res.end(JSON.stringify(data));}
function getBearer(req:IncomingMessage){const h=req.headers.authorization;return typeof h==='string'&&h.startsWith('Bearer ')?h.slice(7):undefined;}
function jsonBody(req:IncomingMessage,max=MAX_BODY):Promise<any>{return new Promise((resolve,reject)=>{
 let length=0;const chunks:Buffer[]=[];req.on('data',(chunk:Buffer)=>{length+=chunk.length;if(length>max){reject(new LobbyError('BODY_TOO_LARGE','Request body too large',413));req.destroy();}else chunks.push(chunk);});
 req.on('end',()=>{if(length===0){resolve({});return;}try{const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));assertLobby(value&&typeof value==='object'&&!Array.isArray(value),'INVALID_JSON','Expected JSON object');resolve(value);}catch(e){reject(e instanceof LobbyError?e:new LobbyError('INVALID_JSON','Malformed JSON',400));}});
 req.on('error',reject);
});}
function fullRoom(room:RoomRecord,connected:Set<string>){return {...room,members:room.members.map(m=>({...m,online:connected.has(m.id)}))};}
export function createMultiplayerServer(store:MultiplayerStore,options:{allowedOrigins?:string[];host?:string;integrationTestMode?:boolean;officialRuleTestMode?:boolean;staticDir?:string;demoAuthEnabled?:boolean;publicOrdinaryVote?:boolean}={}):ServerHandle{
 const auth=new AuthService(store),rooms=new RoomService(store),conns=new Map<Peer,Connection>();
 const game=isGameStore(store)?new GameCoordinator(store,{testMode:options.integrationTestMode??false,officialTestMode:options.officialRuleTestMode??false,publicOrdinaryVote:options.publicOrdinaryVote}):undefined;
 const attempts=new Map<string,{count:number;until:number}>();
 const aiAttempts=new Map<string,{count:number;until:number}>();
 const demoAttempts=new Map<string,{count:number;until:number}>();
 function limitDemoCreation(ip:string){
  const now=Date.now();let r=demoAttempts.get(ip);
  if(!r||r.until<=now){r={count:0,until:now+60*60*1000};demoAttempts.set(ip,r);}r.count++;
  assertLobby(r.count<=6,'DEMO_RATE_LIMITED','Đã vượt số lần tạo phiên Demo; vui lòng thử lại sau.',429);
  if(demoAttempts.size>3000)for(const [key,value] of demoAttempts)if(value.until<=now)demoAttempts.delete(key);
 }
 function ensureDemoAllowed(){assertLobby(options.demoAuthEnabled===true&&process.env.NODE_ENV!=='production',
  'DEMO_DISABLED','Chế độ trải nghiệm Demo chưa được bật trên máy chủ.',403);}
 function rateLimit(ip:string){const now=Date.now();let r=attempts.get(ip);if(!r||r.until<now){r={count:0,until:now+60000};attempts.set(ip,r);}r.count++;assertLobby(r.count<=30,'RATE_LIMITED','Too many auth requests',429);if(attempts.size>5000){for(const [k,v] of attempts){if(v.until<now)attempts.delete(k);}}}
 function onlineIds(){return new Set([...conns.values()].map(c=>c.userId));}
 async function notifyRoom(room:RoomRecord,kind:'room_full'|'room_ready'){
  if(!store.social)return;try{const ids=await store.social.roomNotice(kind==='room_full'?room.members.map(m=>m.id):[room.hostId],room.id,room.revision,kind);for(const c of conns.values())if(ids.includes(c.userId)){try{await auth.identify(c.token);c.peer.send({type:'social.updated'});}catch{}}}catch{console.error('Room notification unavailable');}
 }
 async function notifyCommittedPhase(gameId:string,actorId:string,beforePhase:string|undefined,beforeRevision:number|undefined){
  if(!options.publicOrdinaryVote||!store.social||!game||!isGameStore(store))return;
  try{const saved=await store.gameById(gameId);if(!saved||saved.mode!=='NORMAL_GAMEPLAY'||saved.phase===beforePhase||saved.stateRevision===beforeRevision)return;const view=await game.view(gameId,actorId);const progress=(view as any).hostProgress;if(!progress)return;if(await store.social.phaseNotice(actorId,gameId,progress.phaseId,saved.roomId))for(const c of conns.values())if(c.userId===actorId){try{await auth.identify(c.token);c.peer.send({type:'social.updated'});}catch{}}}catch{console.error('Phase notification unavailable');}
 }
 async function notifyHostReady(gameId:string){if(!options.publicOrdinaryVote||!store.social||!game||!isGameStore(store))return;try{const saved=await store.gameById(gameId);if(!saved||saved.mode!=='NORMAL_GAMEPLAY')return;const host=saved.coordinatorId??saved.hostId;const view=await game.view(gameId,host) as any;if(!view.hostProgress?.allReceived)return;if(await store.social.hostReadyNotice(host,gameId,view.hostProgress.phaseId,saved.roomId)){await emitGame(gameId,'game.state_updated',[host]);for(const c of conns.values())if(c.userId===host){try{await auth.identify(c.token);c.peer.send({type:'social.updated'});}catch{}}}}catch{console.error('Host readiness notification unavailable');}}
 async function rewardCompleted(gameId:string){if(!store.social||!isGameStore(store))return;try{const saved=await store.gameById(gameId);if(!saved||saved.mode!=='NORMAL_GAMEPLAY'||saved.phase!=='GAME_COMPLETED')return;const room=await store.getRoom(saved.roomId);for(const m of room?.members??[]){const p=await store.social.progression(m.id);if(p.changed)for(const c of conns.values())if(c.userId===m.id){try{await auth.identify(c.token);c.peer.send({type:'social.updated'});}catch{}}}}catch{console.error('Career reward pending reconciliation');}}
 async function emitRoom(roomId:string,kind='room.updated'){
  const room=await store.getRoom(roomId);const connected=onlineIds();
  for(const conn of [...conns.values()])if(room?.members.some(m=>m.id===conn.userId)&&!conn.roomIds.has(roomId)){try{await auth.identify(conn.token);conn.peer.send({type:'account.room_changed'});}catch{}}
  for(const conn of [...conns.values()])if(conn.roomIds.has(roomId)){
   try{await auth.identify(conn.token);if(room&&room.members.some(m=>m.id===conn.userId))conn.peer.send({type:kind,room:fullRoom(room,connected)});
    else{conn.roomIds.delete(roomId);conn.peer.send({type:'room.access_revoked',roomId});}}
   catch{conn.roomIds.clear();conn.peer.close(1008);}
  }
 }
 async function emitGame(gameId:string,kind='game.state_updated',privateRefreshIds?:readonly string[]){
  if(!game)return;
  for(const conn of [...conns.values()])if(conn.gameIds.has(gameId)&&(!privateRefreshIds||privateRefreshIds.includes(conn.userId))){
   try{await auth.identify(conn.token);const projection=await game.view(gameId,conn.userId);conn.peer.send({type:kind,game:projection});
     conn.peer.send({type:'game.events',gameId,revision:(projection as Record<string,unknown>).revision,events:await game.visibleEvents(gameId,conn.userId)});
     conn.peer.send({type:'game.skill_feedback',feedback:await game.feedback(gameId,conn.userId)});}
   catch{conn.gameIds.delete(gameId);conn.peer.send({type:'game.access_revoked',gameId});}
  }
 }
 async function authorized(req:IncomingMessage):Promise<Account>{return auth.identify(getBearer(req));}
 const messageTasks=new Map<Peer,Promise<void>>();
 const authDeadlines=new Map<Peer,ReturnType<typeof setTimeout>>();
 const server=createServer(async(req:IncomingMessage,res:ServerResponse)=>{
  try {
   const url=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`);
   const path=url.pathname,method=req.method??'GET';
   if(method==='GET'&&options.staticDir&&(/^\/(?:$|index\.html$|app\.js$|integration\.js$|integration\.css$|codex\.css$|codex-data\.js$|player-ux\.js$|player-ux\.css$|immersive\.js$|immersive\.css$|fate-wheel\.js$|fate-wheel\.css$|workspace\.js$|workspace\.css$|style\.css$|character\.json$)/.test(path)||/^\/assets\/[A-Za-z0-9_\-/]+\.(?:svg|png|webp|jpg|jpeg)$/.test(path))){
    const file=path==='/'?'/index.html':path;const base=pathResolve(options.staticDir);const filename=pathResolve(base,'.'+file);
    assertLobby(filename.startsWith(base+pathSep),'INVALID_PATH','Unsafe static path',400);
    try{const data=await readFile(filename);const ext=file.split('.').pop();const mime:Record<string,string>={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',mjs:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',json:'application/json; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp'};
     res.writeHead(200,{'Content-Type':mime[ext??'']??'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':"default-src 'self'; connect-src 'self' ws: wss:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; media-src 'self'"});res.end(data);return;
    }catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
   }
   if(path==='/ready'&&method==='GET'){try{if(store.healthCheck)await store.healthCheck();else await store.listRooms();answer(res,200,{status:'ready'});}catch{answer(res,503,{status:'unavailable'});}return;}
   if(path==='/health'&&method==='GET'){answer(res,200,{status:'ok',service:options.staticDir?'wolvesville-sprint07':'wolvesville-multiplayer-02B',characterRulesEnabled:options.officialRuleTestMode&&process.env.NODE_ENV!=='production'?8:0,officialRuleTestMode:!!options.officialRuleTestMode&&process.env.NODE_ENV!=='production',gameIntegrationTestMode:!!options.integrationTestMode,gameSessionsAvailable:!!game,bbLiveQa:!!options.officialRuleTestMode&&liveEnabled(),cultQa:!!options.officialRuleTestMode&&cultEnabled(),life02Qa:!!options.officialRuleTestMode&&life02Enabled(),full50Qa:!!options.officialRuleTestMode&&life02Enabled()&&full50CandidateEnabled(),normalGameplay:!!game&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1',normalDecks:game&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1'?listNormalDecks():[],demoAuthEnabled:!!options.demoAuthEnabled&&process.env.NODE_ENV!=='production'});return;}
   if(path==='/api/auth/demo'&&method==='POST'){
    ensureDemoAllowed();
    const origin=req.headers.origin;
    if(origin){const expected=`http://${req.headers.host}`,secure=`https://${req.headers.host}`;
     assertLobby(origin===expected||origin===secure,'DEMO_FORBIDDEN_ORIGIN','Yêu cầu Demo không cùng nguồn.',403);}
    assertLobby(req.headers['content-type']?.split(';')[0]==='application/json','INVALID_CONTENT_TYPE','Demo yêu cầu JSON.',415);
    await jsonBody(req); // reject malformed/oversized payload before provisioning
    limitDemoCreation(req.socket.remoteAddress??'unknown');
    const result=await auth.demoLogin();answer(res,201,result);return;
   }
   if(path==='/api/auth/register'&&method==='POST'){rateLimit(req.socket.remoteAddress??'unknown');const result=await auth.register(await jsonBody(req));answer(res,201,{profile:result});return;}
   if(path==='/api/auth/login'&&method==='POST'){rateLimit(req.socket.remoteAddress??'unknown');answer(res,200,await auth.login(await jsonBody(req)));return;}
   if(path==='/api/auth/logout'&&method==='POST'){const user=await authorized(req);const token=getBearer(req)!;await auth.revoke(token);for(const c of conns.values())if(c.token===token)c.peer.close(1008);answer(res,200,{ok:true,userId:user.id});return;}
   if(path==='/api/auth/me'&&method==='GET'){const me=await authorized(req);answer(res,200,{profile:await auth.profileFor(me)});return;}
   if(path==='/api/profile/me'&&method==='GET'){const me=await authorized(req);answer(res,200,{profile:await auth.profileFor(me)});return;}
   if(path==='/api/profile/me'&&method==='PATCH'){
    const me=await authorized(req),body=await jsonBody(req);
    assertLobby(typeof body.displayName==='string'&&body.displayName.trim().length>=1&&body.displayName.length<=48,'INVALID_DISPLAY_NAME','Invalid display name');
    const profile=publicProfile(await store.updateDisplayName(me.id,body.displayName.trim()));
    for(const roomId of await store.roomIdsForUser(me.id))await emitRoom(roomId);
    answer(res,200,{profile});return;
   }
   // Social notifications carry no game-state or skill information.
   if(path.startsWith('/api/social/')){
    const me=await authorized(req),social=store.social;assertLobby(social,'SOCIAL_UNAVAILABLE','Social database unavailable',503);
    const sub=path.slice('/api/social/'.length),body=method==='GET'?{}:await jsonBody(req,(sub==='media'||sub==='feed')&&method==='POST'?2850000:MAX_BODY);
    const validId=(x:unknown)=>typeof x==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(x);
    if(body.target!==undefined)assertLobby(validId(body.target),'SOCIAL_INVALID_ID','Invalid player ID');
    if(url.searchParams.has('id'))assertLobby(validId(url.searchParams.get('id')),'SOCIAL_INVALID_ID','Invalid player ID');
    const signal=async(ids:string[])=>{for(const c of conns.values())if(ids.includes(c.userId)){try{await auth.identify(c.token);c.peer.send({type:'social.updated'});}catch{}}};
    if(sub==='preferences'&&method==='GET'){answer(res,200,await social.preferences(me.id));return;}
    if(sub==='preferences'&&method==='PATCH'){answer(res,200,await social.setPreferences(me.id,body));return;}
    if(sub==='decks'&&method==='GET'){answer(res,200,{decks:await social.savedDecks(me.id)});return;}
    if(sub==='decks'&&method==='POST'){answer(res,200,{deck:await social.saveDeck(me.id,body)});return;}
    if(sub==='decks'&&method==='DELETE'){answer(res,200,await social.deleteDeck(me.id,body.id,body.expectedRevision));return;}
    if(sub==='game-alerts'&&method==='GET'){
     const alerts:any[]=[];const membership=new Set(await store.roomIdsForUser(me.id));
     for(const roomId of membership){const r=await store.getRoom(roomId);if(!r||!r.members.some(m=>m.id===me.id)||r.status==='CLOSED')continue;
      const saved=isGameStore(store)?await store.gameForRoom(roomId):undefined;
      const common={roomId,roomName:r.name,revision:r.revision};
      if(saved&&saved.phase!=='GAME_COMPLETED'&&game){const v=await game.view(saved.gameId,me.id) as any;const phaseId=v.phaseTiming?.phaseId??`${v.round}:${v.phase}`;const kind=v.hostProgress?.allReceived?'moderator_ready':'resume_game';const attention=kind==='resume_game'?(v.voting?.canVote&&!v.voting.ownBallot?'vote':v.capabilities?.some((c:any)=>c.available)?'skill':undefined):undefined;alerts.push({...common,kind,...(attention?{attention}:{}),gameId:saved.gameId,phaseId,key:`${kind}:${saved.gameId}:${phaseId}`,priority:kind==='moderator_ready'||attention?3:2});}
      else if(!saved&&r.members.length===r.capacity){const own=r.members.find(m=>m.id===me.id);const kind=r.status==='LOCKED'&&r.normalDeck&&!own?.ready?'ready_required':r.status==='LOCKED'&&r.hostId===me.id&&r.members.every(m=>m.ready)&&r.normalDeck?'room_ready':r.status==='WAITING'?'room_full':null;if(kind)alerts.push({...common,kind,key:`${kind}:${roomId}:${r.revision}`,priority:kind==='room_full'?2:3});}
     }
     for(const n of await social.notifications(me.id)){if(n.kind!=='room_invite'||n.read||!n.roomId||membership.has(n.roomId))continue;const r=await store.getRoom(n.roomId);if(!r||r.status!=='WAITING'||r.members.length>=r.capacity)continue;alerts.push({kind:'room_invite',key:n.id,noticeId:n.id,roomId:r.id,roomName:r.name,occupied:r.members.length,capacity:r.capacity,actor:n.actor,priority:2});}
     answer(res,200,{alerts:alerts.sort((a,b)=>b.priority-a.priority)});return;
    }
    if(sub==='media'&&method==='GET'){const slot=url.searchParams.get('slot');assertLobby(slot===null||slot==='avatar'||slot==='cover','SOCIAL_INVALID_MEDIA','Loại ảnh không hợp lệ');answer(res,200,{media:await social.media(me.id,url.searchParams.get('id')||me.id,slot??undefined)});return;}
    if(sub==='media'&&method==='POST'){assertLobby(body.slot==='avatar'||body.slot==='cover','MEDIA_SLOT','Invalid profile image slot');const m=await processMedia(body);answer(res,200,await social.setMedia(me.id,m.slot,m.webp));return;}
    if(sub==='media'&&method==='DELETE'){answer(res,200,await social.setMedia(me.id,body.slot,null));return;}
    if(sub==='blocks'&&method==='GET'){answer(res,200,{players:await social.blocks(me.id)});return;}
    if(sub==='progression'&&method==='GET'){const progression=await social.progression(me.id);if(progression.changed)await signal([me.id]);answer(res,200,{progression});return;}
    if(sub==='progression/preferences'&&method==='POST'){answer(res,200,await social.progressionPreference(me.id,body));return;}
    if(sub==='career'&&method==='GET'){const scope=url.searchParams.get('scope')||'NORMAL',days=Number(url.searchParams.get('days')||0);assertLobby(['NORMAL','DEVELOPMENT','DEMO'].includes(scope)&&[0,7,30,90].includes(days),'INVALID_ARGUMENT','Invalid career filter');answer(res,200,{career:await social.career(me.id,scope as 'NORMAL'|'DEVELOPMENT'|'DEMO',days)});return;}
    if(sub==='history'&&method==='GET'){answer(res,200,{matches:await social.history(me.id)});return;}
    if(sub==='history/detail'&&method==='GET'){const id=url.searchParams.get('id');assertLobby(validId(id)&&game,'INVALID_ARGUMENT','Invalid match');const view=await game.view(id!,me.id) as unknown as {completed:boolean;ruleVersion:string;mode:string;winnerIds:string[];players:Array<{playerId:string;self?:unknown}>};assertLobby(view.completed,'SOCIAL_MATCH_ACTIVE','Match is not completed',409);const events=await game.historyTimeline(id!,me.id);const replay=await game.replay(id!,me.id);answer(res,200,{match:{gameId:id,ruleVersion:view.ruleVersion,mode:view.mode,winnerIds:view.winnerIds,own:view.players.find(p=>p.playerId===me.id)?.self,events,replay}});return;}
    if(sub==='profile'&&method==='GET'){answer(res,200,{profile:await social.profile(me.id,url.searchParams.get('id')||me.id)});return;}
    if(sub==='profile'&&method==='PATCH'){answer(res,200,{profile:await social.update(me.id,body)});return;}
    if(sub==='search'&&method==='GET'){answer(res,200,{players:await social.search(me.id,url.searchParams.get('q')||'')});return;}
    if(sub==='friends'&&method==='GET'){const online=onlineIds();answer(res,200,{friends:(await social.friends(me.id)).map(f=>({...f,online:f.state==='accepted'&&online.has(f.id)}))});return;}
    if(sub==='relationship'&&method==='POST'){assertLobby(typeof body.target==='string'&&typeof body.action==='string','SOCIAL_INVALID_ACTION','Invalid request');const r=await social.relationship(me.id,body.target,body.action);await signal([me.id,body.target]);answer(res,200,r);return;}
    if(sub==='invite'&&method==='POST'){assertLobby(typeof body.roomId==='string'&&typeof body.target==='string','SOCIAL_INVALID_ACTION','Invalid invite');const room=await store.getRoom(body.roomId);assertLobby(room&&room.members.some(m=>m.id===me.id),'NOT_MEMBER','Not a member',403);assertLobby(room.status==='WAITING'&&room.members.length<room.capacity&&!room.members.some(m=>m.id===body.target),'SOCIAL_ROOM_UNAVAILABLE','Room unavailable',409);const r=await social.invite(me.id,body.target,room.id);await signal([body.target]);answer(res,200,r);return;}
    if(sub==='feed'&&method==='GET'){answer(res,200,{posts:await social.feed(me.id)});return;}
    if(sub==='feed'&&method==='POST'){const image=body.image===undefined?undefined:await processMedia({...body.image,slot:'post'});answer(res,201,await social.post(me.id,body,image?.webp));return;}
    if(sub==='post-media'&&method==='GET'){const id=url.searchParams.get('id');assertLobby(validId(id),'SOCIAL_INVALID_ID','Invalid post ID');answer(res,200,await social.postMedia(me.id,id!));return;}
    const post=/^posts\/([a-f0-9-]{36})\/(like|comment|delete|edit)$/.exec(sub);
    if(post&&method==='POST'){const {notifyIds,...result}=await social.postAction(me.id,post[1]!,post[2]!,body);await signal(notifyIds);answer(res,200,result);return;}
    if(sub==='notifications'&&method==='GET'){answer(res,200,{notifications:await social.notifications(me.id)});return;}
    if(sub==='notifications/read'&&method==='POST'){assertLobby(body.id===undefined||typeof body.id==='string','SOCIAL_INVALID_ACTION','Invalid id');answer(res,200,await social.read(me.id,body.id));return;}
   }
   if(path==='/api/rules/ask'&&method==='POST'){const me=await authorized(req);const now=Date.now();for(const [k,v] of aiAttempts)if(v.until<=now)aiAttempts.delete(k);const r=aiAttempts.get(me.id)||{count:0,until:now+60000};r.count++;aiAttempts.set(me.id,r);assertLobby(r.count<=10,'AI_RATE_LIMIT','Too many requests',429);const body=await jsonBody(req);answer(res,200,await ruleLookup(body.question));return;}
   if(path==='/api/rooms'&&method==='GET'){await authorized(req);answer(res,200,{rooms:await rooms.discover()});return;}
   if(path==='/api/rooms'&&method==='POST'){const me=await authorized(req);const room=await rooms.create(me.id,await jsonBody(req));
    // Keep live connections subscribed when HTTP creation races a WS subscribe.
    // Only the authenticated owner receives the membership-backed room stream.
    for(const c of conns.values())if(c.userId===me.id)c.roomIds.add(room.id);
    answer(res,201,{room:fullRoom(room,onlineIds())});return;}

   // Sprint 02B: game integration is server authoritative, never a competitive ruleset.
   const start=/^\/api\/rooms\/([A-Za-z0-9-]{8,64})\/games\/start$/.exec(path);
   if(start&&method==='POST'){
    const me=await authorized(req);assertLobby(game,'GAME_UNAVAILABLE','Game integration unavailable',503);
    const body=await jsonBody(req);const connected=new Set<string>();
    if(body.mode==='NORMAL_GAMEPLAY')for(const c of conns.values())if(c.roomIds.has(start[1]!)){try{const a=await auth.identify(c.token);connected.add(a.id);}catch{}}
    const result=await game.start(start[1]!,me.id,body,connected);
    if(result.created){await emitRoom(start[1]!); // commit succeeded; never broadcast before commit
     for(const conn of conns.values())if(conn.roomIds.has(start[1]!))conn.peer.send({type:'game.created',gameId:result.gameId,roomId:start[1]!,mode:result.mode,rulePack:result.rulePack});}
    answer(res,result.created?201:200,{game:result});return;
   }
   const gm=/^\/api\/games\/([A-Za-z0-9-]{8,64})(?:\/(actions|resolve|advance-night|claim-coordinator|replay|events|journal|feedback|voting|voting-open|voting-close|votes|chat|bb-pack))?$/.exec(path);
   if(gm){const me=await authorized(req);assertLobby(game,'GAME_UNAVAILABLE','Game integration unavailable',503);const id=gm[1]!,suffix=gm[2];
    if(!suffix&&method==='GET'){answer(res,200,{game:await game.view(id,me.id)});return;}
    if(suffix==='claim-coordinator'&&method==='POST'){
     const body=await jsonBody(req),active=isGameStore(store)?await store.gameById(id):undefined;assertLobby(active,'GAME_NOT_FOUND','Game not found',404);const connected=new Set<string>();
     for(const c of conns.values())if(c.roomIds.has(active.roomId)){try{const a=await auth.identify(c.token);if(conns.has(c.peer))connected.add(a.id);}catch{}}
     const claimed=await game.claimCoordinator(id,me.id,body.expectedRoomRevision,connected);await emitRoom(claimed.roomId);await emitGame(id);answer(res,200,{coordinatorId:claimed.coordinatorId});return;
    }
    if(suffix==='chat'&&method==='POST'){const {privateRefreshIds,...result}=await game.sendChat(id,me.id,await jsonBody(req));await emitGame(id,'game.state_updated',privateRefreshIds);answer(res,200,{chat:result});return;}
    if(suffix==='events'&&method==='GET'){answer(res,200,{events:await game.visibleEvents(id,me.id)});return;}
    if(suffix==='journal'&&method==='GET'){answer(res,200,{journal:await game.journal(id,me.id)});return;}
    if(suffix==='feedback'&&method==='GET'){answer(res,200,{feedback:await game.feedback(id,me.id)});return;}
    if(suffix==='voting'&&method==='GET'){answer(res,200,{voting:await game.voteStatus(id,me.id)});return;}
    if(suffix==='voting-open'&&method==='POST'){const result=await game.openVoting(id,me.id,await jsonBody(req));await emitGame(id);answer(res,200,{voting:result});return;}
    if(suffix==='voting-close'&&method==='POST'){const before=isGameStore(store)?await store.gameById(id):undefined;const result=await game.closeVoting(id,me.id,await jsonBody(req));await emitGame(id);await notifyCommittedPhase(id,me.id,before?.phase,before?.stateRevision);await rewardCompleted(id);answer(res,200,{voting:result});return;}
    if(suffix==='votes'&&method==='POST'){
     const result=await game.castVote(id,me.id,await jsonBody(req));
     // All viewers get an ACL-limited voting projection; nobody gets other players' target.
     await emitGame(id);await notifyHostReady(id);answer(res,200,{vote:result});return;
    }
    if(suffix==='replay'&&method==='GET'){answer(res,200,{replay:await game.replay(id,me.id)});return;}
    if(suffix==='bb-pack'&&method==='POST'){const {refresh,...result}=await game.submitLivePack(id,me.id,await jsonBody(req));if(!result.duplicate)await emitGame(id,'game.state_updated',refresh);answer(res,200,{pack:result});return;}
    if(suffix==='actions'&&method==='POST'){
     const {privateRefreshIds,...result}=await game.submit(id,me.id,await jsonBody(req));
     // Ordinary queued submissions remain private. Immediate contracts commit
     // recipient-visible state; refresh ONLY their authorized parties. Never serialize IDs.
     if(privateRefreshIds?.length)await emitGame(id,'game.state_updated',privateRefreshIds);
     await notifyHostReady(id);answer(res,200,{action:result});return;
    }
    if(suffix==='advance-night'&&method==='POST'){const before=isGameStore(store)?await store.gameById(id):undefined;const result=await game.advanceNight(id,me.id,await jsonBody(req));await emitGame(id);await notifyCommittedPhase(id,me.id,before?.phase,before?.stateRevision);await rewardCompleted(id);answer(res,200,{resolution:result});return;}
    if(suffix==='resolve'&&method==='POST'){
     const result=await game.resolve(id,me.id,await jsonBody(req));await emitGame(id);answer(res,200,{resolution:result});return;
    }
   }
   const match=/^\/api\/rooms\/([A-Za-z0-9-]{8,64})(?:\/(join|leave|lock|unlock|configure|ready))?$/.exec(path);
   if(match){const me=await authorized(req);const id=match[1]!,action=match[2];
    assertLobby(/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id),'INVALID_ROOM_ID','Invalid room ID');
    if(!action&&method==='GET'){const room=await rooms.detail(me.id,id);const active=isGameStore(store)?await store.gameForRoom(id):undefined;answer(res,200,{room:{...fullRoom(room,onlineIds()),...(active?.mode==='NORMAL_GAMEPLAY'?{gameId:active.gameId}:{})}});return;}
    if(action==='configure'&&method==='POST'){const body=await jsonBody(req);const custom=body.characterIds!==undefined;const resolved=custom?resolveCustomDeck(body.characterIds):undefined;const deck=custom?resolved?.key:body.deck;assertLobby(store.configureNormalRoom&&normalDeck(deck),'INVALID_ROLES','Tổ hợp nhân vật chưa được hỗ trợ',409);assertLobby(!custom||Number.isSafeInteger(body.expectedRevision),'INVALID_ARGUMENT','Cần phiên bản cấu hình phòng');const room=await store.configureNormalRoom(id,me.id,deck,custom?body.expectedRevision:undefined);await emitRoom(id);answer(res,200,{room:fullRoom(room,onlineIds())});return;}
    if(action==='ready'&&method==='POST'){const body=await jsonBody(req);assertLobby(store.setRoomReady&&typeof body.ready==='boolean'&&Number.isSafeInteger(body.expectedRevision),'INVALID_ARGUMENT','Ready requires boolean');const before=await store.getRoom(id);const room=await store.setRoomReady(id,me.id,body.ready,body.expectedRevision);await emitRoom(id);if(room.normalDeck&&room.members.length===room.capacity&&room.members.every(m=>m.ready)&&!before?.members.every(m=>m.ready))await notifyRoom(room,'room_ready');answer(res,200,{room:fullRoom(room,onlineIds())});return;}
    if(action==='join'&&method==='POST'){const before=await store.getRoom(id);const room=await rooms.join(me.id,id);
      for(const c of conns.values())if(c.userId===me.id)c.roomIds.add(id);
      await emitRoom(id);if(room.status==='WAITING'&&room.members.length===room.capacity&&before&&before.members.length<before.capacity)await notifyRoom(room,'room_full');answer(res,200,{room:fullRoom(room,onlineIds())});return;}
    if(action==='leave'&&method==='POST'){const room=await rooms.leave(me.id,id);await emitRoom(id);answer(res,200,{room:room?fullRoom(room,onlineIds()):null});return;}
    if(action==='lock'&&method==='POST'){const room=await rooms.lock(me.id,id,true);await emitRoom(id);answer(res,200,{room:fullRoom(room,onlineIds())});return;}
    if(action==='unlock'&&method==='POST'){const room=await rooms.lock(me.id,id,false);await emitRoom(id);answer(res,200,{room:fullRoom(room,onlineIds())});return;}
   }
   answer(res,404,{error:{code:'NOT_FOUND',message:'Endpoint not found'}});
  }catch(e){const known=e instanceof LobbyError;const kernel=e instanceof KernelError;answer(res,known?e.status:kernel?(['GAME_COMPLETED','RULE_UNRESOLVED','OUT_OF_PHASE','PHASE_CLOSED','REVISION_CONFLICT','IDEMPOTENCY_CONFLICT','PENDING_ACTIONS','TARGET_INVALID','SKILL_LOCKED','RESOURCE_INSUFFICIENT'].includes(e.code)?409:400):500,{error:{code:known||kernel?e.code:'INTERNAL_ERROR',message:known||kernel?e.message:'Server error'}});}
 });
 server.on('upgrade',(req:IncomingMessage,socket:Socket,head:Buffer)=>{
  const url=new URL(req.url??'/',`http://${req.headers.host??'localhost'}`);
  if(url.pathname!=='/ws'){socket.destroy();return;}
  const origin=req.headers.origin;
  if(origin&&options.allowedOrigins?.length&&!options.allowedOrigins.includes(origin)){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  if(origin&&!options.allowedOrigins?.length){
   const expected=`http://${req.headers.host}`;const secure=`https://${req.headers.host}`;
   if(origin!==expected&&origin!==secure){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}
  }
  const peer=acceptWebSocket(req,socket,head,(p,raw)=>{const before=messageTasks.get(p)??Promise.resolve();const task=before.then(()=>onMessage(p,raw)).catch(()=>{});messageTasks.set(p,task);},(p)=>{messageTasks.delete(p);const deadline=authDeadlines.get(p);if(deadline)clearTimeout(deadline);authDeadlines.delete(p);const old=conns.get(p);conns.delete(p);if(old)for(const id of old.roomIds)void emitRoom(id).catch(()=>{});});
  if(peer){
   const timer=setTimeout(()=>{if(!conns.has(peer))peer.close(1008);authDeadlines.delete(peer);},10000);
   timer.unref?.();authDeadlines.set(peer,timer);peer.send({type:'connected',authRequired:true});
  }
 });
 async function onMessage(peer:Peer,raw:string){
  try{
   const message=JSON.parse(raw);assertLobby(message&&typeof message==='object'&&!Array.isArray(message),'BAD_MESSAGE','Message must be an object');
   if(message.type==='auth'){
    const me=await auth.identify(message.token);
    const deadline=authDeadlines.get(peer);if(deadline)clearTimeout(deadline);authDeadlines.delete(peer);
    conns.set(peer,{peer,token:message.token,userId:me.id,roomIds:new Set(),gameIds:new Set()});
    peer.send({type:'auth.ok',profile:await auth.profileFor(me)});return;
   }
   const conn=conns.get(peer);assertLobby(conn,'UNAUTHORIZED','Authenticate first',401);
   await auth.identify(conn.token);
   if(message.type==='subscribe'){
    assertLobby(typeof message.roomId==='string','BAD_MESSAGE','roomId required');const room=await rooms.detail(conn.userId,message.roomId);
    conn.roomIds.add(message.roomId);peer.send({type:'room.snapshot',room:fullRoom(room,onlineIds())});await emitRoom(message.roomId);return;
   }

   if(message.type==='game.subscribe'){
    assertLobby(game,'GAME_UNAVAILABLE','Game integration unavailable',503);
    assertLobby(typeof message.gameId==='string','BAD_MESSAGE','gameId required');
    const snapshot=await game.view(message.gameId,conn.userId);
    conn.gameIds.add(message.gameId);peer.send({type:'game.snapshot',game:snapshot});peer.send({type:'game.skill_feedback',feedback:await game.feedback(message.gameId,conn.userId)});return;
   }
   if(message.type==='game.unsubscribe'){conn.gameIds.delete(message.gameId);peer.send({type:'game.unsubscribed',gameId:message.gameId});return;}
   if(message.type==='game.chat'){assertLobby(game,'GAME_UNAVAILABLE','Game integration unavailable',503);const {privateRefreshIds,...result}=await game.sendChat(message.gameId,conn.userId,message.chat);await emitGame(message.gameId,'game.state_updated',privateRefreshIds);peer.send({type:'game.chat_accepted',chat:result});return;}
   if(message.type==='game.action'){
    assertLobby(game,'GAME_UNAVAILABLE','Game integration unavailable',503);
    const {privateRefreshIds,...result}=await game.submit(message.gameId,conn.userId,message.action);
    if(privateRefreshIds?.length)await emitGame(message.gameId,'game.state_updated',privateRefreshIds);await notifyHostReady(message.gameId);
    peer.send({type:'game.action_accepted',action:result});return;
   }
   if(message.type==='unsubscribe'){conn.roomIds.delete(message.roomId);peer.send({type:'unsubscribed',roomId:message.roomId});return;}
   if(message.type==='ping'){peer.send({type:'pong'});return;}
   throw new LobbyError('BAD_MESSAGE','Unknown message type');
  }catch(e){const known=e instanceof LobbyError||e instanceof KernelError;peer.send({type:'error',error:{code:known?e.code:'BAD_MESSAGE',message:known?e.message:'Invalid message'}});}
 }
 return {server,
  start(port=0,host=options.host??'127.0.0.1'){
   return new Promise<number>((resolve,reject)=>{server.once('error',reject);server.listen(port,host,()=>{server.off('error',reject);const address=server.address();resolve(typeof address==='object'&&address?address.port:port);});});
  },
  async close(){for(const conn of conns.values())conn.peer.close(1001);await new Promise<void>(resolve=>server.close(()=>resolve()));await store.close();}
 };
}
