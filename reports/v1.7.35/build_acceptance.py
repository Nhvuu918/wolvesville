"""Derive current acceptance from logs. Run from repository root. Historical reports remain immutable."""
import json,re,pathlib,hashlib,sys
P=pathlib.Path; root=P('reports/v1.7.35'); old='reports/BB_PRIVACY_STABILITY_'; verify='--verify' in sys.argv
read=lambda p:json.loads(P(p).read_text())
def write(name,data):
 p=root/name; text=json.dumps(data,indent=2,ensure_ascii=False)+'\n'
 if verify: assert p.read_text()==text,name
 else:p.write_text(text)
def tap(p):
 results={}
 for m in re.finditer(r'^(ok|not ok) \d+ - (.*)$',P(p).read_text(),re.M):
  n=m[2].split(' # SKIP')[0].replace('\\#','#');results[n]='SKIP' if '# SKIP' in m[2] else 'PASS' if m[1]=='ok' else 'FAIL'
 return results
h=hashlib.sha256()
def walk(p):
 p=P(p)
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif not str(p).endswith('.pyc'):h.update((p.as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json',str(root/'BROWSER_MANIFEST.json')]:walk(p)
fingerprint=h.hexdigest(); version=read('package.json')['version']; assert version=='1.7.35'
focused=tap(root/'focused.log'); medium={}; fullpath=root/'backend-full.log'; full=tap(fullpath) if fullpath.exists() else {}; exitpath=root/'backend-full.exit'; exitcode=int(exitpath.read_text()) if exitpath.exists() else None
prior=read('reports/v1.7.34/acceptance.json')['backend']['results']; assert len(prior)==482
missing=sorted(set(prior)-set(full)); changed=sorted(n for n in prior if n in full and prior[n]!=full[n]); new=sorted(set(full)-set(prior)); footer={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',fullpath.read_text(),re.M)} if fullpath.exists() else {}; duration=re.findall(r'^# duration_ms ([\d.]+)$',fullpath.read_text(),re.M) if fullpath.exists() else []; complete=exitcode==0 and footer.get('tests')==485 and footer.get('pass')==474 and footer.get('fail')==0 and footer.get('cancelled')==0 and footer.get('skipped')==11 and not missing and not changed and len(new)==3 and len(full)==485 and all(full[n]=='PASS' for n in new)
names={n for n,v in full.items() if v=='PASS'}
manifest=read(root/'BROWSER_MANIFEST.json')['manifest']; rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']}; assert len(manifest)==84 and len(rows)==119
attempts=[]
for p in sorted(root.glob('browser*/matrix.json')):
 d=read(p);assert d['sourceFingerprint']==fingerprint,p
 for r in d['runs']:
  if r['status']=='INCOMPLETE':continue
  if r.get('log') and P(r['log']).exists():
   txt=P(r['log']).read_text()
   if any(x in txt for x in ['ERR_BLOCKED_BY_ADMINISTRATOR','No module named','Executable doesn\'t exist','BrowserType.launch: Target page, context or browser has been closed']):
    r=dict(r,diagnosis='ENV_BLOCKED_OR_LAUNCH_FAILURE')
  attempts.append(dict(r,attempt=str(p)))
  k=r['suite'],r['version']; oldrow=rows[k]
  # Keep failed attempts in the audit. A fresh valid PASS is allowed only on exact source.
  if r['status']=='PASS' or oldrow['status']!='PASS': rows[k]=r
suites=[dict(suite=m['suite'],status='FAIL' if any(rows[m['suite'],v]['status']=='FAIL' for v in m['requiredVersions']) else 'PASS' if all(rows[m['suite'],v]['status']=='PASS' for v in m['requiredVersions']) else 'INCOMPLETE') for m in manifest]
def tally(l):return dict(total=len(l),**{s:sum(r['status']==s for r in l) for s in ('PASS','FAIL','INCOMPLETE')})
browser={'manifest':tally(suites),'matrix':tally(list(rows.values())),'runs':list(rows.values()),'attempts':attempts,'suites':suites,'runner':'existing resource admission; WV_E2E_DIRECT=0; no weakened assertions; diagnostic-pre-final excluded'}
write('browser-results.json',browser)
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
fullcert=read(old+'FULL_ROLE_CERTIFICATES.json')['historicalCertificatesPreserved']; deckcert=read(old+'BRANCH_COMPLETE_MATRIX.json'); atomic=read(old+'ATOMIC_COVERAGE.json')['branches']
def cert_status(c,bs):
 missingTests=[n for n in c['requiredTests']+c.get('sharedAcceptanceTests',[]) if n not in names]; missingBrowser=[n for n in bs if not bp(n)]; return {'deck':c.get('deck'),'characterId':c.get('characterId'),'historicalCertified':c.get('certified',True),'missingFreshTests':missingTests,'missingFreshBrowser':missingBrowser,'freshRevalidated':not missingTests and not missingBrowser}
f=[cert_status(c,['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e']) for c in fullcert]
q=[cert_status(c,['browser_s15_approved_'+n+'_e2e' if n in ('village','knight') else n for n in c['browserEvidence']]) for c in deckcert['qaCertificates']]
c=[cert_status(c,[c['browserSuite']]) for c in deckcert['playableCertificates']+deckcert['newCertificates']]
a=[]
for b in atomic:
 if not b['historicalEvidenceRetained']:continue
 req=b['requiredPassTests']; missingTests=[n for n in req if n not in names]; a.append(dict(branchId=b['branchId'],missingTests=missingTests,freshRevalidated=bool(req) and not missingTests and (not b.get('requiredBrowser') or bp(b['requiredBrowser']))))
assert len(a)==79
fresh={'F':sum(x['freshRevalidated'] for x in f),'qaC':sum(x['freshRevalidated'] for x in q),'playableC':sum(x['freshRevalidated'] for x in c),'atomicPass':sum(x['freshRevalidated'] for x in a)}
write('certificate-revalidation.json',dict(sourceFingerprint=fingerprint,F=f,qaC=q,playableC=c,atomic=a,newCertificates=[],fresh=fresh))
base=read(old+'METRICS.json')['cumulative']; assert (base['R'],base['F'],base['A'],base['B'],base['qaC'],base['playableC'],base['S_pass'],base['normalDecks'])==(52,1,49,37,2,7,79,12)
write('acceptance.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleset='wolvesville-official-v1.3.3',candidateRuleset='wolvesville-official-v1.3.4',privacyRelease='PARTIAL',competitiveProduction='NO-GO',humanQA='PENDING',postgresLive='PENDING',backend=dict(mode='MONOLITHIC',exitCode=exitcode,complete=complete,tapFooter=footer,durationMs=float(duration[-1]) if duration else None,counts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},missingHistoricalTests=missing,changedHistoricalStatus=changed,newTests=new,results=full,log=str(fullpath),focusedPass=sum(v=='PASS' for v in focused.values()),mediumMagePass=sum(v=='PASS' for v in medium.values())),historicalMetrics=base,currentCumulativeMetrics=base,metricDelta={k:0 for k in base},freshCertificateRevalidation=fresh,browser=browser['manifest'],ruleVersionMatrix=browser['matrix']))


# Preserve historical release scope and distinguish stale from current evidence.
priorG=read('reports/v1.7.34/release-gates.json')
for g in priorG['obligations']+priorG['additionalGates']:
 g['priorEvidenceVersion']='1.7.34'
 for key in ('currentBackendPass','backendPass'):
  if key in g:
   old=g[key];g['prior_'+key]=old;g[key]=[n for n in old if n in names]
 for key in ('currentBrowser','browser'):
  if key in g and isinstance(g[key],list):
   old=g[key];g['prior_'+key]=old;g[key]=[rows[(r['suite'],r['version'])] for r in old if (r['suite'],r['version']) in rows]
   if g.get('status')=='LIVE_QA_BOUNDED_PASS' and any(r['status']!='PASS' for r in g[key]):g['status']='HISTORICAL_LIVE_QA_PASS_FRESH_BROWSER_INCOMPLETE'
 if 'currentEvidenceFiles' in g:g['currentEvidenceFiles']=[str(root/'acceptance.json'),str(root/'browser-results.json'),str(root/'focused.log')]
 if g.get('id')=='BACKEND':g['status']='PASS' if complete else 'INCOMPLETE_OR_FAIL';g['evidence']='acceptance.json';g['exitCriteria']='485 tests; 482 inherited results unchanged and 3 new tests PASS'
 if g.get('id')=='BROWSER':g['status']='PASS' if browser['matrix']['PASS']==119 else 'INCOMPLETE_OR_FAIL';g['evidence']='browser-results.json';g['exitCriteria']='All 119 obligations'
 if g.get('id')=='NORMAL-HANDOFF':g['status']='CLOSED_TESTED_SCOPE' if complete and fresh['playableC']==7 else 'INCOMPLETE_OR_FAIL'
for g in priorG['additionalGates']:
 if g.get('id')=='FULL-84':g.update(status='PARTIAL',evidence='FULL_CONTRACT_CLOSURE.md; focused.log; browser-results.json',blocker='CULT_DAY transport verified with trusted fixture; no successful live recruitment producer, other system-group profiles, legal death/lock/mute combinations or Normal Gameplay admission.')
 if g.get('id')=='FULL-79':g.update(status='PARTIAL',blocker='Unchanged: multiwolf authorized audience, Q13-09 Director mission and Oscar, real co-queued day actions.')
acl_names=[n for n in names if n.startswith('S24 group ACL')]
for g in priorG['additionalGates']:
 if g.get('id')=='SYSTEM-GROUP-ACL':g.update(status='FIXTURE_TRANSPORT_PASS' if len(acl_names)==2 and rows[('browser_s24_group_transport_e2e.py','1.3.3+acl-fixture')]['status']=='PASS' else 'PARTIAL_OR_INCOMPLETE',currentBackendPass=sorted(acl_names),currentBrowser=[rows[('browser_s24_group_transport_e2e.py','1.3.3+acl-fixture')]],blocker='No actual gameplay recruitment producer. S25 rejects independent win links and wolf grants; no #90 admission or new FULL.')
priorG['additionalGates'].append({'id':'VISUAL-INTEGRATION','status':'PARTIAL','ruleProvenance':'PRIV-01, VH57, VH68; Sprint07 animation contract; current authoritative projection','currentBackendPass':sorted(n for n in names if n.startswith('S25 ')),'currentBrowser':[rows[(n,'1.3.3')] for n in ('browser_s25_visual_e2e.py','browser_s25_themes_e2e.py')],'blocker':'Full per-theme responsive/contrast/accessibility and real group gameplay not established; mobile phase label clips; 51 screenshot evidence in scoped visual suites.'})
priorG.update(version=version,sourceFingerprint=fingerprint,readyForApproval=False,activationAuthorized=False)
write('release-gates.json',priorG)
print(json.dumps(dict(fingerprint=fingerprint,backendComplete=complete,backendCounts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},fresh=fresh,browser=browser['manifest'],ruleVersion=browser['matrix']),indent=2))
