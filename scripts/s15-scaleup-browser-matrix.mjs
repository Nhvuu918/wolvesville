/** Version-aware isolated suite runner. Continue after failures, keep separate logs, never promote a failure. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const matrix=JSON.parse(readFileSync('reports/S15_SCALEUP_BROWSER_MATRIX.json','utf8'));
const mode=process.argv[2]||'all';if(!['all','archived','current'].includes(mode))throw Error('Usage: [all|archived|current]');
const select=new Set(process.argv.slice(3));
const prefix='reports/s15-scale/';mkdirSync(prefix,{recursive:true});
let failed=0;for(const row of matrix.manifest){if(select.size&&!select.has(row.suite))continue;
 for(const ver of row.requiredVersions){const kind=ver==='1.3.2'?'archived':'current';if(mode!=='all'&&kind!==mode)continue;
  const env={...process.env};if(kind==='archived')env.WV_ARCHIVED_RULE_REGRESSION='1';else delete env.WV_ARCHIVED_RULE_REGRESSION;
  const p=prefix+kind+'-'+row.suite.replace(/\.py$/,'');
  const r=spawnSync(process.execPath,['scripts/run-browser-s06.mjs',row.suite],{env,encoding:'utf8',maxBuffer:8*1024*1024});
  const log=(r.stdout||'')+(r.stderr||'')+(r.error?String(r.error):'');const pass=r.status===0&&log.includes('S06_BROWSER_PASS '+row.suite)&&!/TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK/.test(log);
  writeFileSync(p+'.log',log);writeFileSync(p+'.exit',String(pass?0:r.status||1)+'\n');console.log(kind,row.suite,pass?'PASS':'FAIL');if(!pass)failed++;
 }
}process.exitCode=failed?1:0;
