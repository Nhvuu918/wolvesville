import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import net from 'node:net';
import {mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {loadLocalEnv,startupConfig} from '../scripts/local-env.mjs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));const p=s.address().port;await new Promise(ok=>s.close(ok));return p;}
function child(env){const p=spawn(process.execPath,['scripts/serve-03.mjs'],{cwd:root,env:{...process.env,...env},stdio:['ignore','pipe','pipe']});let output='';p.stdout.on('data',x=>output+=x.toString());p.stderr.on('data',x=>output+=x.toString());return {p,get output(){return output}};}
async function stop(x){if(!x.p||x.p.exitCode!==null)return;const ended=new Promise(ok=>x.p.once('exit',ok));x.p.kill('SIGTERM');await Promise.race([ended,pause(2500)]);if(x.p.exitCode===null){x.p.kill('SIGKILL');await Promise.race([ended,pause(1000)]);}}
async function waitHealth(port,x){for(let i=0;i<80;i++){if(x.p.exitCode!==null)break;try{const r=await fetch(`http://127.0.0.1:${port}/health`);if(r.ok)return await r.json();}catch{}await pause(100);}throw Error('Server failed to start: '+x.output.slice(-500));}
async function waitExit(x){if(x.p.exitCode!==null)return x.p.exitCode;return await Promise.race([new Promise(ok=>x.p.once('exit',ok)),pause(6000).then(()=>null)]);}
test('STARTUP-01 SQLite launches without DATABASE_URL from a real clean database', {timeout:20000},async()=>{
 const temp=mkdtempSync(join(tmpdir(),'wv-sqlite-start-'));const port=await freePort();const x=child({DB_PROVIDER:'sqlite',DATABASE_URL:'',WV_LOBBY_DB:join(temp,'game.sqlite'),PORT:String(port),WV_ENABLE_DEMO_AUTH:'0'});
 try{const h=await waitHealth(port,x);assert.equal(h.status,'ok');assert.equal(h.demoAuthEnabled,false);}
 finally{await stop(x);rmSync(temp,{recursive:true,force:true});}
});
test('STARTUP-02 PostgreSQL mode refuses missing URL without opening SQLite or disclosing credentials', {timeout:10000},async()=>{
 const x=child({DB_PROVIDER:'postgres',DATABASE_URL:'',PORT:String(await freePort())});
 try{const code=await waitExit(x);assert.equal(code,1);assert.match(x.output,/DATABASE_URL/);assert.doesNotMatch(x.output,/postgresql:\/\/.+@/);}
 finally{await stop(x);}
});
test('STARTUP-03 unknown provider and invalid port fail fast', {timeout:10000},async()=>{
 for(const cfg of [{DB_PROVIDER:'mysql',PORT:'3212'},{DB_PROVIDER:'sqlite',PORT:'-7'}]){
  const x=child({...cfg,DATABASE_URL:''});try{assert.equal(await waitExit(x),1);assert.match(x.output,/Lỗi cấu hình/);}finally{await stop(x);}
 }
});
test('STARTUP-04 occupied port returns diagnostic without killing the original server', {timeout:16000},async()=>{
 const temp=mkdtempSync(join(tmpdir(),'wv-port-test-'));const port=await freePort();
 const env={DB_PROVIDER:'sqlite',DATABASE_URL:'',PORT:String(port),WV_LOBBY_DB:join(temp,'db.sqlite')};
 const x=child(env);
 try{
  assert.equal((await waitHealth(port,x)).status,'ok');
  const y=child({...env,WV_LOBBY_DB:join(temp,'db2.sqlite')});
  try{assert.equal(await waitExit(y),1);assert.match(y.output,/đang được sử dụng/);assert.equal((await waitHealth(port,x)).status,'ok');}
  finally{await stop(y);}
 }finally{await stop(x);rmSync(temp,{recursive:true,force:true});}
});
test('STARTUP-05 correct demo env flag, production remains disabled', {timeout:20000},async()=>{
 const temp=mkdtempSync(join(tmpdir(),'wv-demo-start-'));const port=await freePort();const base={DB_PROVIDER:'sqlite',DATABASE_URL:'',PORT:String(port),WV_LOBBY_DB:join(temp,'game.sqlite'),WV_ENABLE_DEMO_AUTH:'1'};
 const x=child({...base,NODE_ENV:'production'});
 try{assert.equal((await waitHealth(port,x)).demoAuthEnabled,false);}finally{await stop(x);}
 const devPort=await freePort();const y=child({...base,PORT:String(devPort),NODE_ENV:'development'});
 try{assert.equal((await waitHealth(devPort,y)).demoAuthEnabled,true);}
 finally{await stop(y);rmSync(temp,{recursive:true,force:true});}
});

test('STARTUP-06 local .env is read; sqlite does not require a PostgreSQL URL', {timeout:8000},async()=>{
 const temp=mkdtempSync(join(tmpdir(),'wv-env-file-'));
 const url=new URL('../scripts/local-env.mjs',import.meta.url).href;
 writeFileSync(join(temp,'.env'),'DB_PROVIDER=sqlite\nPORT=3249\nWV_ENABLE_DEMO_AUTH=1\n');
 const env={...process.env};delete env.DATABASE_URL;delete env.DB_PROVIDER;delete env.PORT;
 const code=`import {startupConfig} from ${JSON.stringify(url)};console.log(JSON.stringify(startupConfig()));`;
 const p=spawn(process.execPath,['--input-type=module','-e',code],{cwd:temp,env,stdio:['ignore','pipe','pipe']});
 let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);
 try{
  const exit=await Promise.race([new Promise(ok=>p.on('exit',ok)),pause(3500).then(()=>null)]);
  assert.equal(exit,0,err);
  const config=JSON.parse(out);assert.equal(config.provider,'sqlite');assert.equal(config.port,3249);assert.equal(config.databaseUrl,null);
 }finally{p.kill('SIGKILL');rmSync(temp,{recursive:true,force:true});}
});
