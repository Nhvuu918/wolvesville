import {randomBytes,randomUUID,scryptSync,timingSafeEqual,createHash} from 'node:crypto';
import type {Account,MultiplayerStore,PublicProfile} from './types.js';
import {assertLobby,publicProfile,LobbyError} from './types.js';
const SESSION_MS=7*24*60*60*1000;
const DEMO_SESSION_MS=2*60*60*1000;
const hashToken=(token:string)=>createHash('sha256').update(token).digest('hex');
function passwordDigest(password:string,salt:string){return scryptSync(password,salt,64).toString('hex');}
const FAKE_SALT='f616ad4453dcb10d7a115e105f9cfb14';
const FAKE_HASH=passwordDigest('not_a_real_password_',FAKE_SALT);
function passwordValid(password:string,stored:string):boolean{
  const [salt,hex]=stored.split(':');
  if(!salt||!hex||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{128}$/.test(hex))return false;
  const left=Buffer.from(passwordDigest(password,salt),'hex');const right=Buffer.from(hex,'hex');
  return timingSafeEqual(left,right);
}
export class AuthService {
 constructor(private readonly store:MultiplayerStore){}
 async register(input:{username:unknown;password:unknown;displayName?:unknown}):Promise<PublicProfile>{
  assertLobby(typeof input.username==='string'&&/^[a-zA-Z0-9_]{3,32}$/.test(input.username),'INVALID_USERNAME','Username must contain 3–32 letters, digits or underscores');
  assertLobby(typeof input.password==='string'&&input.password.length>=10&&input.password.length<=128,'INVALID_PASSWORD','Password must contain 10–128 characters');
  const username=input.username.toLowerCase();
  const displayName=input.displayName===undefined?input.username:input.displayName;
  assertLobby(typeof displayName==='string'&&displayName.trim().length>=1&&displayName.length<=48,'INVALID_DISPLAY_NAME','Invalid display name');
  const salt=randomBytes(16).toString('hex');
  const account:Account={id:randomUUID(),publicId:'WV-'+randomBytes(6).toString('hex').toUpperCase(),username,displayName:displayName.trim(),passwordHash:`${salt}:${passwordDigest(input.password,salt)}`,createdAt:Date.now()};
  try{await this.store.createAccount(account);}catch(e){if(String(e).includes('ACCOUNT_DUPLICATE'))throw new LobbyError('USERNAME_TAKEN','Username or public ID already exists',409);throw e;}
  return publicProfile(account);
 }
 async login(input:{username:unknown;password:unknown}):Promise<{token:string;profile:PublicProfile;expiresAt:number}>{
  assertLobby(typeof input.username==='string'&&typeof input.password==='string'&&input.password.length<=128,'INVALID_CREDENTIALS','Invalid credentials',401);
  const account=await this.store.accountByUsername(input.username.toLowerCase());
  // Dummy hash prevents a fast failure for nonexistent users.
  const valid=passwordValid(input.password,account?.passwordHash??`${FAKE_SALT}:${FAKE_HASH}`);
  assertLobby(account&&valid,'INVALID_CREDENTIALS','Invalid credentials',401);
  const token=randomBytes(32).toString('base64url');const expiresAt=Date.now()+SESSION_MS;
  await this.store.createSession(hashToken(token),account.id,expiresAt);
  return {token,profile:publicProfile(account),expiresAt};
 }
 async demoLogin():Promise<{token:string;profile:PublicProfile&{isDemo:true};expiresAt:number}>{
  // Every click is its own cryptographically random account, not moonwalker/demo123.
  const now=Date.now(),expiresAt=now+DEMO_SESSION_MS;
  const randomPass=randomBytes(32).toString('hex'),salt=randomBytes(16).toString('hex');
  const account:Account={id:randomUUID(),publicId:'WV-'+randomBytes(6).toString('hex').toUpperCase(),
   username:'demo_'+randomBytes(12).toString('hex'),displayName:'Luna Moon · Demo',
   passwordHash:`${salt}:${passwordDigest(randomPass,salt)}`,createdAt:now};
  const token=randomBytes(32).toString('base64url');
  await this.store.createDemoIdentity(account,hashToken(token),expiresAt);
  return {token,profile:{...publicProfile(account),isDemo:true},expiresAt};
 }
 async profileFor(account:Account):Promise<PublicProfile&{isDemo:boolean}>{
  return {...publicProfile(account),isDemo:await this.store.isDemoAccount(account.id)};
 }
 async identify(token:unknown):Promise<Account>{
  assertLobby(typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token),'UNAUTHORIZED','Authentication required',401);
  const account=await this.store.accountForSession(hashToken(token),Date.now());
  assertLobby(account,'UNAUTHORIZED','Session expired or revoked',401);
  return account;
 }
 async revoke(token:string):Promise<void>{await this.store.revokeSession(hashToken(token));}
}
