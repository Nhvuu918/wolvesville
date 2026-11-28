"""Reproducible acceptance for v1.7.19. Run from source root after runners stop.
No candidate-only test can create an official gameplay metric or certificate.
"""
import copy, hashlib, json, pathlib, re, sys
P=pathlib.Path; root=P('reports/s15-bb-live'); prefix='reports/BB_LIVE_'; verify='--verify' in sys.argv
read=lambda p:json.loads(P(p).read_text())
def out(name,obj):
 p=P(prefix+name+'.json'); text=json.dumps(obj,ensure_ascii=False,indent=2)+'\n'
 if verify:assert p.read_text()==text,f'Nonreproducible: {p}'
 else:p.write_text(text)
def log(p):return P(p).read_text() if P(p).is_file() else ''
def tap(s):
 result={}
 for m in re.finditer(r'^(ok|not ok) \d+ - (.*)$',s,re.M):
  n=m[2].split(' # SKIP')[0].replace('\\#','#');result[n]='SKIP' if '# SKIP' in m[2] else 'PASS' if m[1]=='ok' else 'FAIL'
 return result
def exitcode(p):return int(log(p).strip()) if log(p).strip() else None
version=read('package.json')['version'];rule='wolvesville-official-v1.3.3';assert version=='1.7.19-s15-live-integration-wip'
base=read('reports/OWNER_BB_V2_METRICS.json');assert base['ruleVersion']==rule
oldmanifest=read('reports/OWNER_BB_V2_PAYLOAD_SHA256.json');changed=[]
for key in ['files','reportFiles']:
 for p,h in oldmanifest[key].items():
  assert P(p).is_file(),p
  if hashlib.sha256(P(p).read_bytes()).hexdigest()!=h:
   assert key=='files',p;changed.append(p)
assert all(not x.startswith('reports/') for x in changed)
h=hashlib.sha256()
def walk(p):
 p=P(p)
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif not str(p).endswith('.pyc'):
  h.update((p.as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json','reports/BB_LIVE_BROWSER_MANIFEST.json']:walk(p)
fingerprint=h.hexdigest()
manifest=read('reports/BB_LIVE_BROWSER_MANIFEST.json')['manifest'];assert len(manifest)==66
rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']};assert len(rows)==101
for p in sorted(root.glob('browser-*/matrix.json')):
 d=read(p);assert d['version']==version and d['sourceFingerprint']==fingerprint,p
 for r in d['runs']:
  k=r['suite'],r['version'];assert k in rows
  if r['status']=='INCOMPLETE':continue
  if r['status']=='PASS':assert r['exitCode']==0 and 'S06_BROWSER_PASS '+r['suite'] in log(r['log']) and not re.search('TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK',log(r['log'])),k
  assert rows[k]['status'] in ['INCOMPLETE',r['status']],k;rows[k]=r
suites=[]
for m in manifest:
 states=[rows[m['suite'],v]['status'] for v in m['requiredVersions']];suites.append(dict(suite=m['suite'],status='FAIL' if 'FAIL'in states else 'PASS' if all(x=='PASS' for x in states) else 'INCOMPLETE'))
def tally(a):return dict(total=len(a),**{s:sum(x['status']==s for x in a) for s in ['PASS','FAIL','INCOMPLETE']})
browser=dict(version=version,sourceFingerprint=fingerprint,manifest=tally(suites),matrix=tally(list(rows.values())),suites=suites,runs=list(rows.values()));out('BROWSER_RESULTS',browser)
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
backend=log(root/'backend-full.log'); results=tap(backend); backend_exit=exitcode(root/'backend-full.exit');backend_summary={k:int(m.group(1)) if (m:=re.search(r'^# '+k+r' (\d+)$',backend,re.M)) else None for k in ['tests','pass','fail','skipped','cancelled','todo']}
baseline_tests={r['test']:r['status'] for r in read('reports/OWNER_BB_V2_BACKEND_REGRESSION.json')['results']};assert len(baseline_tests)==418
missing=sorted(set(baseline_tests)-set(results));regressions=sorted(n for n in baseline_tests if n in results and baseline_tests[n]!=results[n]);complete=backend_exit==0 and not missing and not regressions and backend_summary['fail']==0 and backend_summary['cancelled']==0 and backend_summary['tests']==len(results)==422
live=tap(log(root/'live-backend.log'));assert len(live)==4 and set(live.values())=={'PASS'} and exitcode(root/'live-backend.exit')==0
candidate=tap(log(root/'candidate-v2.log'));candidate_ok=len(candidate)==19 and set(candidate.values())=={'PASS'} and exitcode(root/'candidate-v2.exit')==0
out('BACKEND_REGRESSION',dict(version=version,sourceFingerprint=fingerprint,mode='MONOLITHIC',exitCode=backend_exit,summary=backend_summary,complete=complete,baselineObligations=len(baseline_tests),missingBaselineObligations=missing,changedBaselineStatus=regressions,results=[{'test':n,'status':v} for n,v in sorted(results.items())],candidateRetest={'PASS':sum(v=='PASS' for v in candidate.values()),'complete':candidate_ok,'countsAreNotAddedToMonolithic':True},liveRetest={'PASS':4,'exitCode':0,'countsAreNotAddedToMonolithic':True},logs=[str(root/'backend-full.log'),str(root/'candidate-v2.log'),str(root/'live-backend.log')]))
names={n for n,v in results.items() if v=='PASS'}; currentrole=tap(log(root/'role28-exact.log'));current_role_names={n for n,v in currentrole.items() if v=='PASS'}
current=current_role_names|{n for n in names if n.startswith(('QD','Scale ','Normal ','Growth ','Three-player ','Deep normal ','Deep engineer ','Deep medium ','Play #31','Breakthrough '))}
full=read('reports/OWNER_BB_V2_FULL_ROLE_CERTIFICATES.json');f=full['historicalCertificatesPreserved'][0];f['missingFreshTests']=[t for t in f['requiredTests'] if t not in current_role_names];f['missingFreshBrowser']=[n for n in ['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e'] if not bp(n)];f['freshRevalidated']=not f['missingFreshTests'] and not f['missingFreshBrowser'] and exitcode(root/'role28-exact.exit')==0;f['freshEvidenceVersion']=version;f['freshEvidence']=[str(root/'role28-exact.log'),prefix+'BROWSER_RESULTS.json'];f['status']='REVALIDATED_ON_CURRENT_SOURCE' if f['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE'
if f['freshRevalidated']:f['revalidatedOn']=version
full['freshRevalidatedCount']=int(f['freshRevalidated']);out('FULL_ROLE_CERTIFICATES',full)
cert=read('reports/OWNER_BB_V2_BRANCH_COMPLETE_MATRIX.json');cert['freshEvidenceVersion']=version
for c in cert['qaCertificates']+cert['playableCertificates']+cert['newCertificates']:
 needed=c['requiredTests']+c.get('sharedAcceptanceTests',[]);c['missingFreshTests']=[t for t in needed if t not in current];bs=([c['browserSuite']] if c.get('browserSuite') else ['browser_s15_approved_'+n+'_e2e' if n in ['village','knight'] else n for n in c['browserEvidence']]);c['missingFreshBrowser']=[n for n in bs if not bp(n)];c['freshRevalidated']=not c['missingFreshTests'] and not c['missingFreshBrowser'];c['status']='REVALIDATED_ON_CURRENT_SOURCE' if c['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE'
 if c['freshRevalidated']:c['revalidatedOn']=version
cert['ownerBBGuardSupplement']={'deck':[25,31,48,74],'backendFresh':complete,'browserFresh':bp('browser_s15_normal_guard_e2e'),'certified':False,'scope':'Reduced-roster matrix not complete; no new certificate.'};out('BRANCH_COMPLETE_MATRIX',cert)
reg=read('reports/OWNER_BB_V2_ATOMIC_COVERAGE.json');branches=[]
for b in reg['branches']:
 b=copy.deepcopy(b); hist=bool(b.get('executedTested') or b.get('historicalEvidenceRetained'));req=b.get('requiredPassTests',[]);b['passedTests']=[n for n in req if n in names|current];b['executedTested']=hist and bool(req) and len(b['passedTests'])==len(req) and (not b.get('requiredBrowser') or bp(b['requiredBrowser']));b['historicalEvidenceRetained']=hist;branches.append(b)
s_fresh=sum(b['executedTested'] for b in branches);assert sum(b['historicalEvidenceRetained'] for b in branches)==79
reg.update(version=version,executedTested=s_fresh,cumulativePass=79,branches=branches,inventoryDelta=dict(addedRoleIds=[],note='No unpublished QA profile branch counts into official metrics.'));out('ATOMIC_COVERAGE',reg)
ids=read('reports/OWNER_BB_V2_CHARACTER_ID_DELTA.json')['afterIds'];assert len(set(ids))==52;out('CHARACTER_ID_DELTA',dict(version=version,baselineIds=ids,afterIds=ids,addedIds=[],removedIds=[],note='Live QA only; no new official executable IDs.'))
stat=base['cumulative'];assert stat=={'R':52,'F':1,'A':48,'B':37,'qaC':2,'playableC':4,'S_auditedRoles':48,'S_pass':79,'S_total':108,'normalDecks':12};assert len(set(base['completedDecks']))==48
fresh=dict(F=int(f['freshRevalidated']),qaC=sum(c['freshRevalidated'] for c in cert['qaCertificates']),playableC=sum(c['freshRevalidated'] for c in cert['playableCertificates']+cert['newCertificates']),S_pass=s_fresh)
qa={n:rows[(f'browser_s15_bb_live_{n}_e2e.py','1.3.3+qa-bb')]['status'] for n in ['pack','trap','guard']};official_rows=[r for r in rows.values() if r['version']!='1.3.3+qa-bb'];official_suites=[r for r in suites if not r['suite'].startswith('browser_s15_bb_live_')];assert len(official_rows)==98 and len(official_suites)==63
out('METRICS',dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,baseline=stat,cumulative=stat,delta={k:0 for k in stat},fresh=fresh,enabledNormalRegistry=12,newMatchDecks=[],newVotingDecks=[],completedDecks=base['completedDecks'],browser=browser['manifest'],matrix=browser['matrix'],officialBrowser=tally(official_suites),officialMatrix=tally(official_rows),liveQA={'browser':qa,'backendPass':4,'completedMatches':1 if qa['pack']=='PASS' else 0,'scope':'Bounded unpublished profiles; no official metrics or certificates.'},note='No official rule publication or new official gameplay metrics. Legacy certificates are preserved separately from fresh evidence.'))
contracts=read('reports/OWNER_BB_V2_COMPLETION_CONTRACTS.json');contracts['version']=version;contracts['liveEvidence']={'scope':'Unpublished QA profiles, no official FULL','TRAP-LIFETIME':'PASS (HTTP + browser multi-night)','TRAP-AURA':'PASS (HTTP + browser)','TRAP-ROLE':'PASS (HTTP)','TRAP-JUDGMENT':'PASS (HTTP)','TRAP-GUARD':'PASS (HTTP + browser staged guard)','TRAP-POISON-RESCUE':'NOT_INTEGRATED_LIVE','TRAP-REVIVAL':'NOT_INTEGRATED_LIVE','TRAP-GROUP':'candidate only','PACK':'PASS one target, real session, protection and parity victory','PACK-MULTI-TARGET':'NOT_INTEGRATED_LIVE: requires approved entitlement for multiple living wolves','PACK-RETALIATION':'candidate only','source':['tests/sprint15-bb-live.test.mjs',prefix+'BROWSER_RESULTS.json'],'officialFullCertificatesAdded':[]};out('COMPLETION_CONTRACTS',contracts)
accept=dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,officialActivation=False,decisionRecord='data/rules/owner_bb_candidate_v2_decisions.json',backendGate='PASS_MONOLITHIC' if complete else 'INCOMPLETE_OR_FAIL',backend=backend_summary,candidateRetest=candidate_ok,liveBackendTests=4,liveBrowser=qa,liveScope='Actual Game Session archive and transaction in explicit bounded local QA profiles, no official activation.',browser=browser['manifest'],matrix=browser['matrix'],officialBrowser=tally(official_suites),officialMatrix=tally(official_rows),freshCertificates=fresh,fullManifestAccepted=browser['matrix']['PASS']==101,postgreSQLLive='PENDING',competitiveProduction='NO_GO',legacySourceChecksumChanged=changed,legacyReportsUnchanged=len(oldmanifest['reportFiles']),ownerQA='PENDING',newFull=[],newPlayable=[]);out('ACCEPTANCE',accept);print(json.dumps(accept,ensure_ascii=False,indent=2))
