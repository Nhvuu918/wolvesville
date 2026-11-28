/** Run browser E2E against a disposable, REAL SQLite backend on a free port.
 * Never touches user databases, Docker containers or another dev server.
 * Does not mock API/WS responses. Bridge in Linux only carries real traffic.
 */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const s=net.createServer();await new Promise((resolve,reject)=>s.once('error',reject).listen(0,'127.0.0.1',resolve));const port=s.address().port;await new Promise(r=>s.close(r));return port;}
async function runPython(file,env){return await new Promise((resolve,reject)=>{
 const child=spawn('python3',[file],{env,stdio:'inherit'});
 child.once('error',reject);
 child.once('exit',(code,signal)=>code===0?resolve():reject(new Error(`${file}: ${signal||'exit '+code}`)));
});}
const temp=mkdtempSync(join(tmpdir(),'wolvesville-ux-e2e-'));
const port=await freePort();
const env={...process.env,PORT:String(port),HOST:'127.0.0.1',DB_PROVIDER:'sqlite',WV_LOBBY_DB:join(temp,'browser.sqlite'),WV_ENABLE_DEMO_AUTH:'1',WV_OFFICIAL_RULE_TEST_MODE:'1',WV_INTEGRATION_TEST_MODE:'0',WV_E2E_SERVER:`http://127.0.0.1:${port}`};
const server=spawn(process.execPath,['scripts/serve-03.mjs'],{env,stdio:['ignore','pipe','pipe']});
let output='';server.stdout.on('data',b=>output+=b.toString());server.stderr.on('data',b=>output+=b.toString());
try{
 let healthy=false;
 for(let i=0;i<80;i++){
  if(server.exitCode!==null)break;
  try{const r=await fetch(`${env.WV_E2E_SERVER}/health`);if(r.ok){await r.arrayBuffer();healthy=true;break;}}catch{}
  await pause(150);
 }
 if(!healthy)throw new Error('Temporary backend failed to start: '+output.slice(-1500));
 for(const file of ['tests/browser_lobby_e2e.py','tests/browser_codex_e2e.py','tests/browser_demo_e2e.py','tests/browser_e2e.py','tests/browser_ux_e2e.py']){
  // The new UX test uses two normal registered users after three demo sessions.
  await runPython(file,env);
 }
 console.log('PASS: five browser E2E scripts against REAL disposable Wolvesville backend');
}catch(e){console.error(e.message);process.exitCode=1;
}finally{
 const closed=new Promise(resolve=>server.once('close',resolve));
 server.kill('SIGTERM');
 const exited=await Promise.race([closed.then(()=>true),pause(2500).then(()=>false)]);
 if(!exited){server.kill('SIGKILL');await Promise.race([closed,pause(1000)]);}
 server.stdout.destroy();server.stderr.destroy();
 rmSync(temp,{recursive:true,force:true});
}
