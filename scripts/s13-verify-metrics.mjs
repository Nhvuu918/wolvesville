/** Evidence-derived Sprint 13 metrics. This command reexecutes new tests.
 * Never accept metadata/adapters alone as proof of executable character. */
import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const run=spawnSync(process.execPath,['--test','tests/sprint13-character-implementation.test.mjs'],{encoding:'utf8',maxBuffer:8*1024*1024});
process.stdout.write(run.stdout??'');process.stderr.write(run.stderr??'');
if(run.status!==0)throw Error(`S13 test evidence failed, exit=${run.status}`);
const diagnostics=[...(run.stdout||'').matchAll(/S13_CHARACTER_EVIDENCE\s+(\{[^\n]+\})/g)]
 .map(m=>JSON.parse(m[1].replaceAll('\\#','#')));
if(diagnostics.length<7||diagnostics.some(d=>!d.authoritative||!d.replay||!d.source||!d.characterIds?.length))throw Error('Unverified or insufficient role implementation evidence');
const newIds=[...new Set(diagnostics.flatMap(x=>x.characterIds))].sort((a,b)=>a-b);
const csv=readFileSync('data/rule-intelligence-s10/character_implementation_matrix_97.csv','utf8').trim().split('\n');
const oldIds=csv.slice(1).filter(row=>row.includes('PARTIAL_RESTRICTED_EXECUTION')).map(row=>Number(row.match(/^"?(\d+)/)?.[1]));
if(oldIds.length!==11||newIds.some(id=>oldIds.includes(id)))throw Error('S10 baseline or new-role proof mismatch');
const oldMet=JSON.parse(readFileSync('reports/S12_METRICS.json','utf8'));
const uniqueSet=new Set([...oldIds,...newIds]);
const result={version:'1.5.0-s13',mode:'Restricted noncompetitive game sessions',
 metricR:{executableCharacters:uniqueSet.size,totalCharacters:97,baseline:oldIds.length,newCharacters:newIds},
 metricF:{fullyImplemented:0,certified:false,reason:'Unresolved mandatory branches, interactions, global victory'},
 metricS:{verifiedMinimumTechnicalPaths:oldIds.length+new Set(diagnostics.map(x=>x.skill)).size,
  auditedCompositeBranchRows:145,exactRatio:null,certified:false,
  reason:'145 inherited audit rows are composite and not one-to-one with executable official skill branches'},
 metricA:oldMet.metricA,metricB:oldMet.metricB,metricC:oldMet.metricC,
 officialGameMode:'NO_GO',evidence:diagnostics,qa:{newTestsExit:run.status,newTestCount:7}};
mkdirSync('reports',{recursive:true});
writeFileSync('reports/S13_METRICS.json',JSON.stringify(result,null,2)+'\n');
console.log('S13_METRICS '+JSON.stringify({R:result.metricR.executableCharacters,F:0,S_minimum:result.metricS.verifiedMinimumTechnicalPaths,A:result.metricA,B:result.metricB,C:result.metricC,newIds}));
