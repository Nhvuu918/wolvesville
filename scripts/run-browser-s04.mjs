/** Isolated-browser regression runner. Each E2E receives its own disposable
 * real SQLite backend, so lingering subscriptions or Demo rate limits from
 * another test cannot contaminate the next test. No API mocks.
 */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));const port=s.address().port;await new Promise(ok=>s.close(ok));return port;}
async function closeServer(p){if(p.exitCode!==null)return;
 const done=new Promise(resolve=>p.once('close',resolve));p.kill('SIGTERM');
 if(!await Promise.race([done.then(()=>true),sleep(3500).then(()=>false)])){
  p.kill('SIGKILL');await Promise.race([done,sleep(1000)]);
 }
}
const suites=['browser_lobby_e2e.py','browser_codex_e2e.py','browser_demo_e2e.py','browser_e2e.py','browser_ux_e2e.py'];
for(const suite of suites){
 const dir=mkdtempSync(join(tmpdir(),'wv-s04-browser-'));const port=await freePort();
 const env={...process.env,PORT:String(port),HOST:'127.0.0.1',DB_PROVIDER:'sqlite',
  WV_LOBBY_DB:join(dir,'isolated.sqlite'),WV_ENABLE_DEMO_AUTH:'1',
  WV_OFFICIAL_RULE_TEST_MODE:'1',WV_INTEGRATION_TEST_MODE:'0',
  WV_E2E_SERVER:`http://127.0.0.1:${port}`,PYTHONUNBUFFERED:'1'};
 const server=spawn(process.execPath,['scripts/serve-03.mjs'],{env,stdio:['ignore','pipe','pipe']});
 let serverOutput='';for(const s of [server.stdout,server.stderr])s.on('data',b=>serverOutput+=b.toString());
 try{
  let healthy=false;
  for(let attempt=0;attempt<90;attempt++){
   if(server.exitCode!==null)break;
   try{const r=await fetch(`${env.WV_E2E_SERVER}/health`);if(r.ok){await r.arrayBuffer();healthy=true;break;}}catch{}
   await sleep(100);
  }
  if(!healthy)throw new Error(`Backend startup failed for ${suite}: ${serverOutput.slice(-700)}`);
  const code=await new Promise((done,fail)=>{
   // Separate process group also contains Chromium/Playwright driver children.
   const child=spawn('python3',[`tests/${suite}`],{env,stdio:'inherit',detached:true});
   let finished=false;
   const killGroup=(signal)=>{try{process.kill(-child.pid,signal);}catch{try{child.kill(signal);}catch{}}};
   const complete=(result)=>{if(finished)return;finished=true;clearTimeout(timer);done(result);};
   child.once('error',fail);
   child.once('close',(c,signal)=>complete({c,signal}));
   const timer=setTimeout(()=>{
     killGroup('SIGTERM');
     setTimeout(()=>killGroup('SIGKILL'),1500).unref();
     complete({c:null,signal:'BROWSER_TIMEOUT'});
   },75000);timer.unref();
  });
  if(code.c!==0)throw new Error(`Browser ${suite} FAILED: exit=${code.c}, signal=${code.signal??'-'}`);
  console.log(`S04_BROWSER_SUITE_PASS ${suite}`);
 }catch(e){console.error(e);process.exitCode=1;
 }finally{await closeServer(server);server.stdout.destroy();server.stderr.destroy();rmSync(dir,{recursive:true,force:true});}
 if(process.exitCode)break;
}
if(!process.exitCode)console.log('S04_BROWSER_ALL_FIVE_PASS (each real backend isolated)');
