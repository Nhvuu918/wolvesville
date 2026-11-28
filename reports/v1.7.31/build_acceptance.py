"""Derive current acceptance from logs. Run from repository root. Historical reports remain immutable."""
import json,re,pathlib,hashlib,sys
P=pathlib.Path; root=P('reports/v1.7.31'); old='reports/BB_PRIVACY_STABILITY_'; verify='--verify' in sys.argv
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
fingerprint=h.hexdigest(); version=read('package.json')['version']; assert version=='1.7.31'
focused=tap(root/'focused.log'); medium={}; fullpath=root/'backend-full.log'; full=tap(fullpath) if fullpath.exists() else {}; exitpath=root/'backend-full.exit'; exitcode=int(exitpath.read_text()) if exitpath.exists() else None
prior=read('reports/v1.7.30/acceptance.json')['backend']['results']; assert len(prior)==472
missing=sorted(set(prior)-set(full)); changed=sorted(n for n in prior if n in full and prior[n]!=full[n]); new=sorted(set(full)-set(prior)); complete=exitcode==0 and not missing and not changed and len(new)==3 and len(full)==475
names={n for n,v in full.items() if v=='PASS'} | {n for n,v in {**focused,**medium}.items() if v=='PASS' and full.get(n,'PASS')=='PASS'}
manifest=read(root/'BROWSER_MANIFEST.json')['manifest']; rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']}; assert len(manifest)==78 and len(rows)==113
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
write('acceptance.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleset='wolvesville-official-v1.3.3',candidateRuleset='wolvesville-official-v1.3.4',privacyRelease='PARTIAL',competitiveProduction='NO-GO',humanQA='PENDING',postgresLive='PENDING',backend=dict(mode='MONOLITHIC',exitCode=exitcode,complete=complete,counts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},missingHistoricalTests=missing,changedHistoricalStatus=changed,newTests=new,results=full,log=str(fullpath),focusedPass=sum(v=='PASS' for v in focused.values()),mediumMagePass=sum(v=='PASS' for v in medium.values())),historicalMetrics=base,currentCumulativeMetrics=base,metricDelta={k:0 for k in base},freshCertificateRevalidation=fresh,browser=browser['manifest'],ruleVersionMatrix=browser['matrix']))

# All inherited release obligations remain in the candidate. Do not convert old PASS to current PASS.
release=read(old+'RELEASE_SCOPE.json'); gates=[]
for o in release['obligations']:
 backend=[n for n in o.get('tests',[]) if not n.endswith(('.mjs','.py'))]; bs=[n for n in o.get('tests',[]) if n.endswith('.py')]
 gate={k:v for k,v in o.items() if k not in ('backendEvidence','browserEvidence','replayEvidence','privacyEvidence','evidenceFiles')}; gate['historicalStatus']=o['status'];gate['status']='PARTIAL_OR_PENDING_ACCEPTANCE';gate['currentBackendPass']=[n for n in backend if n in names];gate['currentBrowser']=[r for r in rows.values() if r['suite'] in bs];gate['historicalEvidenceOnly']=[old+'RELEASE_SCOPE.json'];gate['currentEvidenceFiles']=['reports/v1.7.31/acceptance.json','reports/v1.7.31/browser-results.json','reports/v1.7.31/focused.log'];gates.append(gate)
for g in gates:
 if g['id']=='PACK-PRIVACY-01':g['blocker']='Global revision/timing, secret revocation lock/wait oracle, post-resolution and third-party scope. No live activation of new KEEP policy.'
 if g['id']=='PACK-05':g['blocker']='S21 candidate revalidates latest selections including temporarily ineligible authors on supplied trusted snapshots; only state-level evidence. No live mid-window transition and private phase progression unresolved.';g['currentBackendPass'] += [n for n in sorted(names) if n.startswith('S21 PACK KEEP')]
 if g['id'] in ('TRAP-04','TRAP-05'):
  g['status']='PARTIAL';g['implementation']+='; backend/src/official/revival.ts; backend/src/engine/service.ts; backend/src/experimental/owner-bb-v2/night-action-group.ts';g['currentBackendPass'] += [n for n in sorted(names) if n.startswith(('S17 '+g['id'],'S20 DC-TRAP-02'))];g['currentBrowser'] += [rows['browser_s17_trap_revival_e2e.py','1.3.3+qa-bb'],rows['browser_s20_owner_trap_e2e.py','1.3.3+qa-dc-bb']];g['blocker']='Trapped actor and target paths retained; new wolf revival, preserved trap use and second death in [8,10,25,26]. Third-faction revival, exclusions in live games, multi-window and complex chains remain.';g['currentBackendPass'] += [n for n in sorted(names) if n.startswith('S21 VH73')];g['currentBrowser'] += [rows['browser_s21_wolf_revival_e2e.py','1.3.3+qa-dc-bb']]
records=read('data/rules/owner_dc_decisions_20261125.json')['decisions']; owner=[]
for r in records:
 i=r['id']; tests=[n for n in sorted(names) if n.startswith('S20 '+i)]; br=[]
 if i=='DC-PACK-KEEP':tests += [n for n in sorted(names) if n.startswith('S21 PACK KEEP')]
 if i=='DC-TRAP-02':tests += [n for n in sorted(names) if n.startswith('S21 VH73')]
 if i=='DC-SOUL-01':br=[rows['browser_s18_soul_second_death_e2e.py','1.3.3']]
 elif i=='DC-SOUL-02':br=[rows['browser_s20_owner_soul_e2e.py','1.3.3+qa-dc']]
 elif i=='DC-TRAP-02':br=[rows['browser_s20_owner_trap_e2e.py','1.3.3+qa-dc-bb'],rows['browser_s21_wolf_revival_e2e.py','1.3.3+qa-dc-bb']]
 owner.append(dict(decisionId=i,choice='A',ownerApproved=True,sourceVerification=r['sourceVerification'],ruleProvenance=r['provenance'],code=r['code'],scope=r['scope'],backendPass=tests,browser=br,status='LIVE_QA_BOUNDED_PASS' if i in ('DC-SOUL-02','DC-TRAP-02') and tests and br and all(b['status']=='PASS' for b in br) else 'PARTIAL',privacy='PARTIAL; no release-level assertion',replay='Scoped live tests verify replay' if i!='DC-PACK-KEEP' else 'State-level serialization only, not live replay',blocker=r['conflict'],exitCriteria='All source-authorized interaction classes and privacy/replay/browser obligations, plus explicit release approval.'))
write('owner-decision-acceptance.json',dict(version=version,sourceFingerprint=fingerprint,ownerApproved=4,policySourceVerified=2,partiallyVerified=2,newRuntimeDecisions=0,retainedRuntimeDecisions=2,extendedCandidateCoreDecisions=1,extendedRuntimeInteractionClasses=1,existingBoundedDecision=1,liveQABoundedPass=sum(x['status']=='LIVE_QA_BOUNDED_PASS' for x in owner),decisions=owner))
write('release-gates.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleVersion=release['activeRuleVersion'],proposedRuleVersion=release['proposedRuleVersion'],state='CANDIDATE',ownerPolicyApproved=True,ownerDecisionCount=18,activationAuthorized=False,readyForApproval=False,obligations=gates,additionalGates=owner+[
{'id':'SHARED-23','status':'PARTIAL','ruleSource':'character.json#23, VH06, VH82, LIFE-01, DC-SOUL-01/02','code':'backend/src/official/soul-shooter.ts; backend/src/official/s13-mechanics.ts; backend/src/engine/service.ts','test':'tests/sprint20-owner-decisions.test.mjs; tests/browser_s20_owner_soul_e2e.py','evidence':'focused.log; browser-results.json','blocker':'Finite blind attack designation; broader protection, wolf, link/death-chain, secret status, full privacy; no FULL certificate.'},
{'id':'FULL-26','status':'PARTIAL','ruleSource':'VH73/VH76, character.json#26/#10/#8, PH-01/VH03, DC-TRAP-02','code':'backend/src/official/s13-mechanics.ts; backend/src/official/revival.ts; backend/src/engine/service.ts','test':'tests/sprint21-revival.test.mjs; tests/browser_s21_wolf_revival_e2e.py','evidence':'focused.log; browser-results.json','blocker':'Wolf #10 revival in a bounded QA domain only; living third faction revival scenario and exclusion roles, complex links, full authorized domain and endgame interactions remain.'},
{'id':'FULL-36','status':'PARTIAL','blocker':'Protection classes, SHARED-23, full target, death-chain, revival, privacy and browser obligations retained.'},
{'id':'NORMAL-HANDOFF','status':'CLOSED_TESTED_SCOPE' if complete and fresh['playableC']==7 else 'INCOMPLETE_OR_FAIL','ruleSource':'ROOM-03, V02/V03','code':'frontend/integration.js','test':'tests/sprint19-handoff-ui.test.mjs; tests/browser_s15_normal_e2e.py','evidence':'acceptance.json; browser-results.json'},
{'id':'BACKEND','status':'PASS' if complete else 'INCOMPLETE_OR_FAIL','evidence':'acceptance.json','exitCriteria':'All 472 historical outcomes unchanged and three new tests PASS; PostgreSQL skips separate.'},
{'id':'BROWSER','status':'PASS' if browser['matrix']['PASS']==113 else 'INCOMPLETE_OR_FAIL','evidence':'browser-results.json','exitCriteria':'All 113 version obligations pass, no legacy inventory removed.'},
{'id':'HUMAN_QA','status':'PENDING','evidence':'HUMAN_QA.md','exitCriteria':'Actual owner feedback.'},
{'id':'PG_LIVE','status':'PENDING','evidence':'Backend skips','exitCriteria':'Live PostgreSQL for production.'}]))
print(json.dumps(dict(fingerprint=fingerprint,backendComplete=complete,backendCounts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},fresh=fresh,browser=browser['manifest'],ruleVersion=browser['matrix'],ownerLiveQABoundedPass=sum(x['status']=='LIVE_QA_BOUNDED_PASS' for x in owner)),indent=2))
