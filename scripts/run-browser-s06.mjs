/** Isolated backend & browser process runner. No mock endpoints, no forced success. */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import net from 'node:net';
const pause=ms=>new Promise(r=>{const timer=setTimeout(r,ms);timer.unref();});
async function port(){const s=net.createServer();await new Promise((ok,no)=>s.once('error',no).listen(0,'127.0.0.1',ok));const n=s.address().port;await new Promise(ok=>s.close(ok));return n;}
async function terminate(proc){if(proc.exitCode!==null||proc.signalCode!==null)return;
 const closed=new Promise(done=>proc.once('close',done));proc.kill('SIGTERM');
 const graceful=await Promise.race([closed.then(()=>true),pause(4000).then(()=>false)]);
 if(!graceful){console.error('BROWSER_RESOURCE_LEAK: backend failed graceful shutdown');process.exitCode=1;proc.kill('SIGKILL');await closed;}
}
// Cross-process admission, shared by every shard using this runner. The
// scenario's existing deadline starts AFTER admission. No suite is skipped.
// fcntl is available on macOS and Linux; kernel releases the lease on crash.
const scheduler=process.env.WV_BROWSER_SCHEDULER||'exclusive';
if(!['exclusive','parallel-diagnostic'].includes(scheduler))throw Error('Unknown browser scheduler mode');
let lease=null,leaseDone=null;
async function admit(){
 const start=Date.now();console.log('E2E_SCHEDULER_WAIT',scheduler,process.pid);
 if(scheduler==='exclusive'){
  const path=join(tmpdir(),`wolvesville-browser-admission-${process.getuid?.()??'local'}.lock`);
  lease=spawn('python3',['-u','-c',`import fcntl,os,sys
f=os.fdopen(os.open(sys.argv[1],os.O_CREAT|os.O_RDWR,0o600),'r+')
fcntl.flock(f,fcntl.LOCK_EX)
print('READY',flush=True)
sys.stdin.read()`,path],{stdio:['pipe','pipe','inherit']});
  leaseDone=new Promise((ok,no)=>{lease.once('error',no);lease.once('close',ok)});
  await new Promise((ok,no)=>{let line='';lease.stdout.on('data',b=>{line+=b.toString();if(line.includes('READY\n'))ok();});lease.once('error',no);lease.once('close',code=>no(Error('Admission process closed: '+code)));});
 }
 console.log('E2E_SCHEDULER_ACQUIRED',scheduler,'waitMs',Date.now()-start);
}
function stats(stage){for(const [name,path] of [['cpu','/sys/fs/cgroup/cpu.stat'],['memory','/sys/fs/cgroup/memory.events']]){try{console.log('E2E_RESOURCE',stage,name,JSON.stringify(readFileSync(path,'utf8').trim()));}catch(e){if(e.code!=='ENOENT')throw e;}}}
async function release(){if(lease){lease.stdin.end();const code=await leaseDone;if(code!==0)throw Error('Admission lease failed: '+code);lease=null;}}
const suite=process.argv.slice(2);
const suites=suite.length?suite:['browser_s06_e2e.py'];
// Each previously aggregate voting scenario gets isolated SQLite + Chromium + deadline.
// The suite marker is emitted only after all three scenario processes succeed.
await admit();
try{stats("start");
for(const name of suites){
 const deepNormal=name.startsWith('browser_s15_deep_normal_');
 const cases=name==='browser_s28_bell_normal_e2e.py'?['leader','linked','revival']:name==='browser_s15_mage_target_e2e.py'?['single','two-nights']:deepNormal?['village','enemy']:name==='browser_s15_voting_information_e2e.py'?['sedative','reveal','violin']:name==='browser_s15_continued_three_e2e.py'?['village','knight','handoff']:['browser_s15_normal_guard_e2e.py','browser_s26_mirror_normal_e2e.py'].includes(name)?['village','wolf']:['browser_s15_normal_rescue_e2e.py','browser_s15_normal_guard_rescue_e2e.py'].includes(name)?['village','wolf']:name==='browser_s15_normal_e2e.py'?['aura-village','aura-knight','role-village','role-knight','aura-handoff-village','role-handoff-village']:[null];
 for(const scenario of cases){
 const dir=mkdtempSync(join(tmpdir(),'wolvesville-s06-browser-')),n=await port();
 const env={...process.env,DB_PROVIDER:'sqlite',HOST:'127.0.0.1',PORT:String(n),WV_LOBBY_DB:join(dir,'test.sqlite'),WV_ENABLE_DEMO_AUTH:'1',WV_OFFICIAL_RULE_TEST_MODE:deepNormal?'0':['browser_full50_universal_normal_e2e.py','browser_s28_bell_normal_e2e.py','browser_s26_mirror_normal_e2e.py','browser_s25_visual_e2e.py','browser_s25_themes_e2e.py','browser_s15_normal_e2e.py','browser_s15_continued_three_e2e.py','browser_s15_normal_guard_e2e.py','browser_s15_normal_rescue_e2e.py','browser_s15_normal_guard_rescue_e2e.py'].includes(name)?'0':'1',WV_INTEGRATION_TEST_MODE:'0',WV_E2E_SERVER:`http://127.0.0.1:${n}`,PYTHONUNBUFFERED:'1'};
 if(deepNormal||['browser_full50_universal_normal_e2e.py','browser_s28_bell_normal_e2e.py','browser_s26_mirror_normal_e2e.py','browser_s25_visual_e2e.py','browser_s25_themes_e2e.py','browser_s15_normal_e2e.py','browser_s15_continued_three_e2e.py','browser_s15_normal_guard_e2e.py','browser_s15_normal_rescue_e2e.py','browser_s15_normal_guard_rescue_e2e.py'].includes(name))delete env.WV_ARCHIVED_RULE_REGRESSION;
 console.log('E2E_ISOLATION',name,scenario??'default','port',n,'db',env.WV_LOBBY_DB);
 const server=spawn(process.execPath,['scripts/serve-03.mjs'],{env,stdio:['ignore','pipe','pipe']});
 let log='';for(const pipe of [server.stdout,server.stderr])pipe.on('data',b=>{log+=(b.toString());});
 try{
  let healthy=false;for(let i=0;i<100;i++){
   if(server.exitCode!==null)break;
   try{const r=await fetch(`${env.WV_E2E_SERVER}/health`);if(r.ok){await r.arrayBuffer();healthy=true;break;}}catch{}await pause(100);
  }
  if(!healthy)throw Error(`Backend startup failed: ${log.slice(-1000)}`);
  const child=spawn('python3',[`tests/${name}`,...(scenario?[scenario]:[])],{env,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
  let childLog='';
  for(const [pipe,dest] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])pipe.on('data',b=>{childLog+=b.toString();dest.write(b);});
  const result=await Promise.race([
   new Promise((resolve,reject)=>{child.once('error',reject);child.once('close',(code,signal)=>resolve({code,signal}));}),
   pause(65000).then(()=>({code:null,signal:'E2E_DEADLINE'}))
  ]);
  if(result.signal==='E2E_DEADLINE'){
   const closed=new Promise(done=>child.once('close',done));const killGroup=signal=>{try{if(process.platform!=='win32')process.kill(-child.pid,signal);else child.kill(signal);}catch(e){if(e.code!=='ESRCH')throw e;}};killGroup('SIGTERM');
   if(!await Promise.race([closed.then(()=>true),pause(1500).then(()=>false)])){killGroup('SIGKILL');await closed;}
   throw Error(`E2E timeout ${name}${scenario?` / ${scenario}`:""}: last reported stage ${childLog.split("\n").filter(l=>l.startsWith("E2E_STAGE")).at(-1)??"unreported"}; scenario did not finish; not counted PASS`);
  }
  if(result.code!==0)throw Error(`E2E failed ${name}, exit=${result.code}, signal=${result.signal}`);
  if(/TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK/.test(childLog))throw Error(`E2E unclean runtime ${name}${scenario?' / '+scenario:''}; not counted PASS`);

 }catch(e){console.error(e);process.exitCode=1;}
 finally{await terminate(server);server.stdout?.destroy();server.stderr?.destroy();rmSync(dir,{recursive:true,force:true});}
 if(process.exitCode)break;
 if(scenario)console.log(`S06_BROWSER_CASE_PASS ${name} ${scenario}`);
 }
 if(process.exitCode)break;
 console.log(`S06_BROWSER_PASS ${name}`);
}
if(!process.exitCode)console.log(`S06_BROWSER_ALL_${suites.length}_PASS`);
}finally{stats('end');await release();}
