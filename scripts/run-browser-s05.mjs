/** Isolated backend & browser process runner. No mock endpoints, no forced success. */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
const pause=ms=>new Promise(r=>{const timer=setTimeout(r,ms);timer.unref();});
async function port(){const s=net.createServer();await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));const n=s.address().port;await new Promise(ok=>s.close(ok));return n;}
async function terminate(proc){if(proc.exitCode!==null||proc.signalCode!==null)return;
 const closed=new Promise(done=>proc.once('close',done));proc.kill('SIGTERM');
 const graceful=await Promise.race([closed.then(()=>true),pause(4000).then(()=>false)]);
 if(!graceful){console.error('BROWSER_RESOURCE_LEAK: backend failed graceful shutdown');proc.kill('SIGKILL');await closed;}
}
const suite=process.argv.slice(2);
const suites=suite.length?suite:['browser_s05_e2e.py','browser_lobby_e2e.py','browser_codex_e2e.py','browser_demo_e2e.py','browser_e2e.py','browser_ux_e2e.py'];
for(const name of suites){
 const dir=mkdtempSync(join(tmpdir(),'wolvesville-s05-browser-')),n=await port();
 const env={...process.env,DB_PROVIDER:'sqlite',HOST:'127.0.0.1',PORT:String(n),WV_LOBBY_DB:join(dir,'test.sqlite'),WV_ENABLE_DEMO_AUTH:'1',WV_OFFICIAL_RULE_TEST_MODE:'1',WV_INTEGRATION_TEST_MODE:'0',WV_E2E_SERVER:`http://127.0.0.1:${n}`,PYTHONUNBUFFERED:'1'};
 const server=spawn(process.execPath,['scripts/serve-03.mjs'],{env,stdio:['ignore','pipe','pipe']});
 let log='';for(const pipe of [server.stdout,server.stderr])pipe.on('data',b=>{log+=(b.toString());});
 try{
  let healthy=false;for(let i=0;i<100;i++){
   if(server.exitCode!==null)break;
   try{const r=await fetch(`${env.WV_E2E_SERVER}/health`);if(r.ok){await r.arrayBuffer();healthy=true;break;}}catch{}await pause(100);
  }
  if(!healthy)throw Error(`Backend startup failed: ${log.slice(-1000)}`);
  const child=spawn('python3',[`tests/${name}`],{env,stdio:'inherit'});
  const result=await Promise.race([
   new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));}),
   pause(65000).then(()=>({code:null,signal:'E2E_DEADLINE'}))
  ]);
  if(result.signal==='E2E_DEADLINE'){
   child.kill('SIGTERM');await pause(1500);
   if(child.exitCode===null)child.kill('SIGKILL');
   throw Error(`E2E timeout ${name}: cleanup did not finish; not counted PASS`);
  }
  if(result.code!==0)throw Error(`E2E failed ${name}, exit=${result.code}, signal=${result.signal}`);
  console.log(`S05_BROWSER_PASS ${name}`);
 }catch(e){console.error(e);process.exitCode=1;}
 finally{await terminate(server);server.stdout?.destroy();server.stderr?.destroy();rmSync(dir,{recursive:true,force:true});}
 if(process.exitCode)break;
}
if(!process.exitCode)console.log(`S05_BROWSER_ALL_${suites.length}_PASS`);
