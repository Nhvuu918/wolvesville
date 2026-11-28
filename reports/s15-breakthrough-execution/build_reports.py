"""Rebuild evidence-based reports. Run from source root after runner checkpoints stop."""
import json, pathlib, re, hashlib, copy, sys
P=pathlib.Path; root=P('reports/s15-breakthrough-execution'); prefix='reports/BREAKTHROUGH_'; verify='--verify' in sys.argv
read=lambda p:json.loads(P(p).read_text())
def out(name,obj):
 p=P(prefix+name+'.json'); text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
 if verify:assert p.read_text()==text,f'Nonreproducible report: {p}'
 else:p.write_text(text)
def log(p):return P(p).read_text() if P(p).is_file() else ''
def tap(s):
 result={}
 for m in re.finditer(r'^(ok|not ok) \d+ - (.*)$',s,re.M):
  n=m[2].split(' # SKIP')[0].replace('\\#','#'); result[n]='SKIP' if '# SKIP' in m[2] else 'PASS' if m[1]=='ok' else 'FAIL'
 return result
version=read('package.json')['version'];rule='wolvesville-official-v1.3.3';assert version=='1.7.16-s15-breakthrough-wip'
old=read('reports/S15_DEEP_ENGINE_METRICS.json');base=old['cumulative'];manifest=read(prefix+'BROWSER_MANIFEST.json')['manifest'];assert len(manifest)==63
h=hashlib.sha256()
def walk(p):
 p=P(p)
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif not str(p).endswith('.pyc'):
  h.update((p.as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json',prefix+'BROWSER_MANIFEST.json']:walk(p)
fingerprint=h.hexdigest()
rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']}
assert len(rows)==98
for p in sorted(root.glob('browser-*/matrix.json')):
 if p.parent.name=='browser-attempt1':continue
 d=read(p);assert d['version']==version and d['sourceFingerprint']==fingerprint, f'Mismatched final source {p}'
 for r in d['runs']:
  k=r['suite'],r['version'];assert k in rows
  if r['status']=='INCOMPLETE':continue
  if r['status']=='PASS':assert r['exitCode']==0 and ('S06_BROWSER_PASS '+r['suite']) in log(r['log']) and not re.search('TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK',log(r['log'])),k
  prev=rows[k];assert prev['status']=='INCOMPLETE' or prev['status']==r['status'],f'Conflicting final runs: {k}'
  rows[k]=r
suites=[]
for m in manifest:
 states=[rows[m['suite'],v]['status'] for v in m['requiredVersions']];suites.append(dict(suite=m['suite'],status='FAIL' if 'FAIL'in states else 'PASS' if all(x=='PASS' for x in states) else 'INCOMPLETE'))
def tally(a):return dict(total=len(a),**{s:sum(x['status']==s for x in a) for s in ['PASS','FAIL','INCOMPLETE']})
browser=dict(version=version,sourceFingerprint=fingerprint,manifest=tally(suites),matrix=tally(list(rows.values())),suites=suites,runs=list(rows.values()),priorDiagnosticAttempt=str(root/'browser-attempt1'));out('BROWSER_RESULTS',browser)
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
backend=log(root/'backend.log'); backend_tap=tap(backend); extra=tap(log(root/'snow-handoff.log')); combined={**backend_tap,**extra}; names={k for k,v in combined.items() if v=='PASS'}
summary={k:int(m.group(1)) if (m:=re.search(r'^# '+k+r' (\d+)$',backend,re.M)) else None for k in ['tests','pass','fail','skipped','cancelled','todo']}
backend_exit=int(log(root/'backend.exit').strip()) if log(root/'backend.exit').strip() else None
baseline_tests={r['test'] for r in read('reports/S15_DEEP_ENGINE_BACKEND_REGRESSION.json')['results']};missing=sorted(baseline_tests-set(combined));splitcomplete=backend_exit==0 and summary['fail']==0 and summary['cancelled']==0 and not missing and len(combined)==377 and all(v in ['PASS','SKIP'] for v in combined.values())
currentrole=tap(log(root/'role28-current.log'));current={n for n,v in currentrole.items() if v=='PASS'}|{n for n in names if n.startswith(('QD','Scale ','Normal ','Growth ','Three-player ','Deep normal ','Deep engineer ','Deep medium ','Play #31','Breakthrough '))}
backend_stats=dict(total=len(combined),PASS=sum(v=='PASS' for v in combined.values()),FAIL=sum(v=='FAIL' for v in combined.values()),SKIP=sum(v=='SKIP' for v in combined.values()))
out('BACKEND_REGRESSION',dict(version=version,sourceFingerprint=fingerprint,mode='MONOLITHIC_CORE_PLUS_NEW_HANDOFF_RETEST',command='WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=3 tests/*.test.mjs',note='Added one new backend test during original run, after its file had run; separately executed it on final source. Not a final monolithic run. Current #28 retest separate, not double-counted.',exitCode=backend_exit,monolithicSummary=summary,summary=backend_stats,complete=splitcomplete,baselineObligations=len(baseline_tests),missingBaselineObligations=missing,results=[{'test':n,'status':v} for n,v in sorted(combined.items())],logs=[str(root/'backend.log'),str(root/'snow-handoff.log')]))
med_names=[f'Breakthrough medium #26 with #74: closed death, revival, repeated elimination, PH-01 {str(x).lower()}' for x in [False,True]]
chat_test='Breakthrough VH77 medium private chat: authorization, anonymous projections, retry, SQLite restart, phase close and replay'
med_ok=set(med_names)<=names and bp('browser_s15_breakthrough_medium_e2e');chat_ok=chat_test in names and bp('browser_s15_breakthrough_medium_e2e')
reg=read('reports/S15_DEEP_ENGINE_ATOMIC_COVERAGE.json');branches=[]
for b in reg['branches']:
 b=copy.deepcopy(b);hist=bool(b.get('executedTested') or b.get('historicalEvidenceRetained'))
 if b['branchId']=='WV-A26-ANONYMOUS-CHAT': b.update(implementationPath='backend/src/official/medium-chat.ts',requiredPassTests=[chat_test],requiredBrowser='browser_s15_breakthrough_medium_e2e',implementationStatus='IMPLEMENTED_RESTRICTED',remainingInteractions='Bounded [8,25,26] / [8,26,74]; cross-composition eligibility not certified.')
 if b['branchId']=='WV-A26-REVIVE':b['remainingInteractions']='Bounded [8,25,26] / [8,26,74]; cross-faction targets and three excluded roles not verified end-to-end.'
 req=b.get('requiredPassTests',[]);b['passedTests']=[n for n in req if n in names|current];b['executedTested']=bool(req) and len(b['passedTests'])==len(req) and (not b.get('requiredBrowser') or bp(b['requiredBrowser']));b['historicalEvidenceRetained']=hist;b['scope']='Restricted runtime, not global/full';branches.append(b)
s_fresh=sum(b['executedTested'] for b in branches);s_cum=sum(b['executedTested'] or b['historicalEvidenceRetained'] for b in branches)
reg.update(version=version,executedTested=s_fresh,cumulativePass=s_cum,branches=branches,inventoryDelta=dict(addedRoleIds=[],note='Existing VH77 branch moved from NOT_EXECUTED to IMPLEMENTED_RESTRICTED, no denominator change.'));out('ATOMIC_COVERAGE',reg);out('ATOMIC_BRANCH_REGISTRY',reg)
full=read('reports/S15_DEEP_ENGINE_FULL_ROLE_CERTIFICATES.json');f=full['historicalCertificatesPreserved'][0];f['missingFreshTests']=[t for t in f['requiredTests'] if t not in current];f['missingFreshBrowser']=[n for n in ['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e'] if not bp(n)];f['freshRevalidated']=not f['missingFreshTests'] and not f['missingFreshBrowser'];f['freshEvidenceVersion']=version;f['freshEvidence']=[str(root/'role28-current.log'),prefix+'BROWSER_RESULTS.json'];f['status']='REVALIDATED_ON_CURRENT_SOURCE' if f['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE'
if f['freshRevalidated']:f['revalidatedOn']=version
full['freshRevalidatedCount']=int(f['freshRevalidated']);out('FULL_ROLE_CERTIFICATES',full)
cert=read('reports/S15_DEEP_ENGINE_BRANCH_COMPLETE_MATRIX.json');cert['freshEvidenceVersion']=version
for c in cert['qaCertificates']+cert['playableCertificates']+cert['newCertificates']:
 needed=c['requiredTests']+c.get('sharedAcceptanceTests',[]);c['missingFreshTests']=[t for t in needed if t not in current];bs=([c['browserSuite']] if c.get('browserSuite') else ['browser_s15_approved_'+n+'_e2e' if n in ['village','knight'] else n for n in c['browserEvidence']]);c['missingFreshBrowser']=[n for n in bs if not bp(n)];c['freshRevalidated']=not c['missingFreshTests'] and not c['missingFreshBrowser'];c['status']='REVALIDATED_ON_CURRENT_SOURCE' if c['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE'
 if c['freshRevalidated']:c['revalidatedOn']=version
snow_tests=['Breakthrough snow pair: 16 final ballots in each of unshielded and protected states; all final outcomes','Breakthrough snow pair: self/other protection, skipped action, reverse order, two-night lifetime, consumption, exhaustion and replay','Breakthrough snow pair: retry, outsider rejection, active-layer restart and coordinator handoff preserve protection and winner','Deep normal s15-deep-knight-snow: both factions, real protection, chat, private observations, SQLite restart and replay']
snow_ok=set(snow_tests)<=names and bp('browser_s15_deep_normal_knight_snow_e2e') and 'BREAKTHROUGH_SNOW_BALLOTS 32' in backend and backend.count('BREAKTHROUGH_SNOW_PATH ')>=7
if snow_ok:cert['newCertificates'].append(dict(deck=[8,9],classification='PLAYABLE_BRANCH_COMPLETE',mode='NORMAL_GAMEPLAY',ruleVersion=rule,scope='Two human seats only. No wolves, so no hanging immunity. One knight attack, optional two-night one-use snow shield on either player, no repeat target, resource exhaustion within composition; all 16 ballots in shield/no-shield states; finite repeat equivalence under no new shield/attack; both win paths; role privacy, retry, authorization, handoff, restart and replay. No automatic all-offline progression claim.',requiredTests=snow_tests,browserSuite='browser_s15_deep_normal_knight_snow_e2e.py',browserCases=['village','enemy'],certified=True,freshRevalidated=True,revalidatedOn=version,status='NEW_CERTIFICATE_ON_CURRENT_SOURCE',evidence=[str(root/'backend.log'),str(root/'snow-handoff.log'),prefix+'BROWSER_RESULTS.json']))
out('BRANCH_COMPLETE_MATRIX',cert)
ids=read('reports/S15_DEEP_ENGINE_CHARACTER_ID_DELTA.json')['afterIds'];assert len(set(ids))==52;out('CHARACTER_ID_DELTA',dict(version=version,baselineIds=ids,afterIds=ids,addedIds=[],removedIds=[],improvedExistingIds=[26,9,31],note='No new executable ID counted.'))
completed=set(old['completedDecks']);newA=[]
if med_ok:
 k='8,26,74';assert k not in completed;completed.add(k);newA.append(k)
assert len(old['completedDecks'])==base['A']
stats={**base,'A':len(completed),'playableC':base['playableC']+int(snow_ok),'S_pass':s_cum}
fresh=dict(F=int(f['freshRevalidated']),qaC=sum(c['freshRevalidated'] for c in cert['qaCertificates']),playableC=sum(c['freshRevalidated'] for c in cert['playableCertificates']+cert['newCertificates']),S_pass=s_fresh,newCompletedDecks=newA,newPlayableCertificates=[[8,9]] if snow_ok else [])
out('METRICS',dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,baseline=base,cumulative=stats,delta={k:stats[k]-base[k] for k in stats},fresh=fresh,enabledNormalRegistry=12,newMatchDecks=newA,newVotingDecks=[],completedDecks=sorted(completed),browser=browser['manifest'],matrix=browser['matrix'],note='Historical achievements retained, separate fresh evidence. Restricted atomic proof, not global roster coverage.'))
out('CERTIFICATION_RESULTS',dict(version=version,fullCurrentRevalidated=f['freshRevalidated'],newFull=[],newPlayable=[[8,9]] if snow_ok else [],qaFresh=fresh['qaC'],playableFresh=fresh['playableC'],fullManifestAccepted=browser['matrix']['PASS']==98,contracts='reports/BREAKTHROUGH_COMPLETION_CONTRACTS.json',ownerQA='NOT_TESTED_BY_OWNER',newVH77Branch=chat_ok,newMatch=med_ok,backendGate='PASS_SPLIT' if splitcomplete else 'INCOMPLETE_OR_FAIL',backend=backend_stats,browser=browser['manifest'],matrix=browser['matrix'],competitiveProduction='NO_GO',postgreSQLLive='PENDING'))
print(json.dumps(dict(version=version,stats=stats,fresh=fresh,backend=backend_stats,backendGate=splitcomplete,missingBaseline=len(missing),monolithic=summary,browser=browser['manifest'],matrix=browser['matrix'],sourceFingerprint=fingerprint),ensure_ascii=False,indent=2))
