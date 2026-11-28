/** Separate final-payload evidence; never import old run results. Run after build.
 * A directory is required and must not exist. Select suites by exact name if desired.
 * Every missing obligation is INCOMPLETE, not FAIL or PASS. */
import {spawn} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const [dir,...selection]=process.argv.slice(2);if(!dir||existsSync(dir))throw Error('Provide a fresh output directory');
const manifest=JSON.parse(readFileSync('reports/S15_MATURITY_BROWSER_MANIFEST.json','utf8')).manifest;
const select=new Set(selection);for(const name of select)if(!manifest.some(m=>m.suite===name))throw Error('Unknown suite '+name);
mkdirSync(dir,{recursive:true});
const priority=['browser_s15_normal_guard_e2e.py','browser_s15_play_guard_e2e.py','browser_s15_deep_redirect_e2e.py','browser_s15_final_pack_e2e.py','browser_s12_attack_e2e.py','browser_s10_gameplay_e2e.py','browser_s15_continued_three_e2e.py','browser_s15_normal_e2e.py','browser_s15_approved_revenge_e2e.py','browser_s15_approved_pin_e2e.py','browser_s15_approved_village_e2e.py','browser_s15_approved_knight_e2e.py','browser_s15_scale_mystic_e2e.py','browser_s15_play_guard_e2e.py','browser_s14_transport_regression.py'];
const rank=n=>priority.includes(n)?priority.indexOf(n):priority.length;
const rows=manifest.flatMap(m=>m.requiredVersions.map(version=>({suite:m.suite,version,status:'INCOMPLETE',exitCode:null,log:null}))).sort((a,b)=>rank(a.suite)-rank(b.suite));
function report(){const summarize=rs=>Object.fromEntries(['PASS','FAIL','INCOMPLETE'].map(s=>[s,rs.filter(r=>r.status===s).length]));const suites=manifest.map(m=>{const runs=rows.filter(r=>r.suite===m.suite);return {suite:m.suite,status:runs.some(r=>r.status==='FAIL')?'FAIL':runs.every(r=>r.status==='PASS')?'PASS':'INCOMPLETE'};});writeFileSync(join(dir,'matrix.json'),JSON.stringify({version:JSON.parse(readFileSync('package.json')).version,manifest:{total:suites.length,...summarize(suites)},matrix:{total:rows.length,...summarize(rows)},suites,runs:rows},null,2)+'\n');}
report();
const todo=rows.filter(r=>!select.size||select.has(r.suite));let cursor=0;
const jobs=Number(process.env.WV_BROWSER_JOBS||1);if(!Number.isInteger(jobs)||jobs<1||jobs>3)throw Error('WV_BROWSER_JOBS must be 1-3');
async function worker(){while(cursor<todo.length){const r=todo[cursor++],env={...process.env};if(r.version==='1.3.2')env.WV_ARCHIVED_RULE_REGRESSION='1';else delete env.WV_ARCHIVED_RULE_REGRESSION;const logfile=join(dir,`${r.version}-${r.suite.replace(/\.py$/,'')}.log`);const p=spawn(process.execPath,['scripts/run-browser-s06.mjs',r.suite],{env,stdio:['ignore','pipe','pipe']});let log='';for(const stream of [p.stdout,p.stderr])stream.on('data',d=>{log+=d.toString();});const result=await new Promise(resolve=>{p.once('error',e=>resolve({code:null,error:String(e)}));p.once('close',(code,signal)=>resolve({code,signal}));});if(result.error)log+=result.error;writeFileSync(logfile,log);r.log=logfile;r.exitCode=result.code;r.status=result.code===0&&log.includes('S06_BROWSER_PASS '+r.suite)&&!/TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK/.test(log)?'PASS':result.signal?'INCOMPLETE':'FAIL';report();console.log(r.version,r.suite,r.status);}}
await Promise.all(Array.from({length:jobs},worker));if(rows.some(r=>r.status!=='PASS'))process.exitCode=1;
