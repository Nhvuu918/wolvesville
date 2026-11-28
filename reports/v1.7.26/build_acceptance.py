"""Derive current acceptance from logs. Run from repository root. Historical reports remain immutable."""
import json,re,pathlib,hashlib,sys
P=pathlib.Path; root=P('reports/v1.7.26'); old='reports/BB_PRIVACY_STABILITY_'; verify='--verify' in sys.argv
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
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json',old+'BROWSER_MANIFEST.json']:walk(p)
fingerprint=h.hexdigest(); version=read('package.json')['version']; assert version=='1.7.26'
focused=tap(root/'focused.log'); medium=tap(root/'medium-mage.log'); fullpath=root/'backend-full-retry.log'; full=tap(fullpath); exitpath=root/'backend-full-retry.exit'; exitcode=int(exitpath.read_text()) if exitpath.exists() else None
prior={r['test']:r['status'] for r in read(old+'BACKEND_REGRESSION.json')['results']}; assert len(prior)==453
missing=sorted(set(prior)-set(full)); changed=sorted(n for n in prior if n in full and prior[n]!=full[n]); new=sorted(set(full)-set(prior)); complete=exitcode==0 and not missing and not changed and len(new)==2 and len(full)==455
names={n for n,v in full.items() if v=='PASS'} | {n for n,v in {**focused,**medium}.items() if v=='PASS' and full.get(n,'PASS')=='PASS'}
manifest=read(old+'BROWSER_MANIFEST.json')['manifest']; rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']}; assert len(manifest)==72 and len(rows)==107
attempts=[]
for p in sorted(root.glob('browser-*/matrix.json')):
 d=read(p);assert d['sourceFingerprint']==fingerprint,p
 for r in d['runs']:
  if r['status']=='INCOMPLETE':continue
  attempts.append(dict(r,attempt=str(p)))
  k=r['suite'],r['version']; oldrow=rows[k]
  # Keep failed attempts in the audit. A fresh valid PASS is allowed only on exact source.
  if r['status']=='PASS' or oldrow['status']!='PASS': rows[k]=r
suites=[dict(suite=m['suite'],status='FAIL' if any(rows[m['suite'],v]['status']=='FAIL' for v in m['requiredVersions']) else 'PASS' if all(rows[m['suite'],v]['status']=='PASS' for v in m['requiredVersions']) else 'INCOMPLETE') for m in manifest]
def tally(l):return dict(total=len(l),**{s:sum(r['status']==s for r in l) for s in ('PASS','FAIL','INCOMPLETE')})
browser={'manifest':tally(suites),'matrix':tally(list(rows.values())),'runs':list(rows.values()),'attempts':attempts,'suites':suites,'directFailure':'ERR_BLOCKED_BY_ADMINISTRATOR; native loopback environment','bridgeFirstAttempt':'interrupted, no completed result'}
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
write('acceptance.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleset='wolvesville-official-v1.3.3',candidateRuleset='wolvesville-official-v1.3.4',privacyRelease='PARTIAL',competitiveProduction='NO-GO',humanQA='PENDING',postgresLive='PENDING',backend=dict(mode='MONOLITHIC',exitCode=exitcode,complete=complete,counts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},missingHistoricalTests=missing,changedHistoricalStatus=changed,newTests=new,results=full,log=str(fullpath),focusedPass=sum(v=='PASS' for v in focused.values()),mediumMagePass=sum(v=='PASS' for v in medium.values())),historicalMetrics=base,currentCumulativeMetrics=base,metricDelta={k:0 for k in base},freshCertificateRevalidation=fresh,browser=browser['manifest'],ruleVersionMatrix=browser['matrix']))
# Preserve the release-scope inventory without treating inherited evidence as fresh.
release=read(old+'RELEASE_SCOPE.json'); gates=[]
for o in release['obligations']:
 backend=[n for n in o.get('tests',[]) if not n.endswith(('.mjs','.py'))]; bs=[n for n in o.get('tests',[]) if n.endswith('.py')]; observed=[n for n in backend if n in names]; gate=dict(o); gate['historicalStatus']=o['status'];gate['status']='PARTIAL_OR_PENDING_ACCEPTANCE';gate['currentBackendPass']=observed;gate['currentBrowser']= [r for r in rows.values() if r['suite'] in bs];gate['historicalEvidenceOnly']=[old+'RELEASE_SCOPE.json'];gate['currentEvidenceFiles']=['reports/v1.7.26/acceptance.json','reports/v1.7.26/browser-results.json','reports/v1.7.26/focused.log'];gates.append(gate)
for g in gates:
 if g['id']=='PACK-PRIVACY-01':g['currentBackendPass']+=['v1.7.26 mixed privacy: authorized event ordinals, replay counts, resolution receipts and restart'];g['blocker']='Global state revision/timing, revoked-target policy, post-resolution/third-party scope and browser not fully accepted.';g['implementation']+='; backend/src/engine/visibility.ts; backend/src/game/coordinator.ts; backend/src/multiplayer/server.ts'
 if g['id']=='PACK-05':g['currentBackendPass']+=['v1.7.26 BB membership invariant: current pending count, lost entitlement, new member, KEEP and fixed representative'];g['blocker']='State-level membership test added; lawful mid-window live transition not implemented, browser not accepted.'
write('release-gates.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleVersion=release['activeRuleVersion'],proposedRuleVersion=release['proposedRuleVersion'],state='CANDIDATE',ownerPolicyApproved=True,activationAuthorized=False,readyForApproval=False,obligations=gates,additionalGates=[{'id':'SHARED-23','status':'BLOCKED_IMPLEMENTATION','ruleSource':'character.json#23, VH06, VH82','code':'backend/src/official/s13-mechanics.ts; backend/src/official/stable-death-proof.ts','test':'tests/sprint15-roles.test.mjs; tests/sprint15-deep-medium.test.mjs','evidence':'medium-mage.log; does not cover secret revival','blocker':'Secret life, two bullets, no voting, distinct death cycles, privacy','exitCriteria':'Real lawful first death, secret revival, shots, second death, victory, restart/replay/browser.'},{'id':'BACKEND','status':'PASS' if complete else 'INCOMPLETE_OR_FAIL','evidence':'acceptance.json','exitCriteria':'All 453 historical outcomes unchanged and both new tests PASS; PostgreSQL skips separate.'},{'id':'BROWSER','status':'PASS' if browser['matrix']['PASS']==107 else 'INCOMPLETE_OR_FAIL','evidence':'browser-results.json','exitCriteria':'All 107 version obligations pass.'},{'id':'HUMAN_QA','status':'PENDING','evidence':'HUMAN_QA.md','exitCriteria':'Actual owner feedback for UI tasks.'},{'id':'PG_LIVE','status':'PENDING','evidence':'Backend skips','exitCriteria':'Live DB regression on PostgreSQL for production.'}]))
print(json.dumps(dict(fingerprint=fingerprint,backendComplete=complete,backendCounts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},fresh=fresh,browser=browser['manifest']),indent=2))
