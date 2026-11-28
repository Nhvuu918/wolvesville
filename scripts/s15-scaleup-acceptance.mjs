/** Audit actual isolated runner log/exit pairs; absence is INCOMPLETE. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const json=p=>JSON.parse(readFileSync(p,'utf8'));
const prefix='reports/s15-scale/';
const matrix=json('reports/S15_SCALEUP_BROWSER_MATRIX.json');
const classify=(suite,version)=>{
 const kind=version==='1.3.2'?'archived':'current',path=prefix+kind+'-'+suite.replace(/\.py$/,'');
 const log=existsSync(path+'.log')?readFileSync(path+'.log','utf8'):'',exit=existsSync(path+'.exit')?Number(readFileSync(path+'.exit','utf8').trim()):null;
 const ok=exit===0&&log.includes('S06_BROWSER_PASS '+suite)&&!/TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK/.test(log);
 return {version,mode:kind==='archived'?'archived compatibility':'default current rule environment (fixture-only suites may not create official matches)',status:exit===null?'INCOMPLETE':ok?'PASS':'FAIL',exit,log:path+'.log',reason:exit===null?'no completed runner result':ok?null:/TargetClosedError|Task exception was never retrieved/.test(log)?'cleanup exception':/E2E timeout/.test(log)?'runner timeout':'inspect exact log'};
};
const suites=matrix.manifest.map(row=>({...row,results:row.requiredVersions.map(v=>classify(row.suite,v))}));
const summary=Object.fromEntries(['1.3.2','1.3.3'].map(v=>{const rows=suites.flatMap(s=>s.results).filter(r=>r.version===v);return [v,{required:rows.length,pass:rows.filter(r=>r.status==='PASS').length,fail:rows.filter(r=>r.status==='FAIL').length,incomplete:rows.filter(r=>r.status==='INCOMPLETE').length}]}));
const inherited= suites.filter(s=>!s.suite.startsWith('browser_s15_scale_')).map(s=>s.results.find(r=>r.version===(s.classification==='CURRENT_RULE'?'1.3.3':'1.3.2')));const combined=suites.map(s=>s.results.find(r=>r.version===(s.classification==='CURRENT_RULE'?'1.3.3':'1.3.2')));const stat=xs=>({required:xs.length,pass:xs.filter(r=>r.status==='PASS').length,fail:xs.filter(r=>r.status==='FAIL').length,incomplete:xs.filter(r=>r.status==='INCOMPLETE').length});
const full=readFileSync(prefix+'clean-full.log','utf8');const result={version:json('package.json').version,ruleVersion:'wolvesville-official-v1.3.3',backend:{pass:Number(full.match(/^# pass (\d+)$/m)?.[1]),fail:Number(full.match(/^# fail (\d+)$/m)?.[1]),skipped:Number(full.match(/^# skipped (\d+)$/m)?.[1]),exit:Number(readFileSync(prefix+'clean-full.exit','utf8')),log:prefix+'clean-full.log'},sourceChecks:Object.fromEntries(['verify-source','build','rules-build'].map(n=>[n,{exit:Number(readFileSync(prefix+'clean-'+n+'.exit','utf8')),log:prefix+'clean-'+n+'.log'}])),metrics:{exit:Number(readFileSync(prefix+'expanded-registry-metrics.exit','utf8')),log:prefix+'expanded-registry-metrics.log'},browserByVersion:summary,manifestInherited:stat(inherited),manifestAll:stat(combined),suites,postgres:'PENDING: no live DB; 11 skipped',competitiveProduction:'NO-GO',release:'WIP'};
writeFileSync('reports/S15_SCALEUP_ACCEPTANCE.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({backend:result.backend,browserByVersion:summary,manifestInherited:result.manifestInherited,manifestAll:result.manifestAll}));
