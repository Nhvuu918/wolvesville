"""Evidence-only v1.7.22 reporting. Run from repository root. --verify does not write."""
import copy, hashlib, json, pathlib, re, sys
P=pathlib.Path; root=P('reports/s15-stability'); old='reports/BB_OFFICIAL_'; prefix='reports/BB_STABILITY_'; verify='--verify' in sys.argv
read=lambda p:json.loads(P(p).read_text())
def out(n,d):
 p=P(prefix+n+'.json'); text=json.dumps(d,ensure_ascii=False,indent=2)+'\n'
 if verify: assert p.read_text()==text,p
 else:p.write_text(text)
def log(p):return P(p).read_text() if P(p).is_file() else ''
def exitcode(p):return int(log(p).strip()) if log(p).strip() else None
def tap(s):
 r={}
 for m in re.finditer(r'^(ok|not ok) \d+ - (.*)$',s,re.M):
  n=m[2].split(' # SKIP')[0].replace('\\#','#'); assert n not in r,n
  r[n]='SKIP' if '# SKIP' in m[2] else 'PASS' if m[1]=='ok' else 'FAIL'
 return r
version=read('package.json')['version'];assert version=='1.7.22-s15-stability-completion-wip';base=read(old+'METRICS.json');rule=base['ruleVersion']
oldhash=read(old+'PAYLOAD_SHA256.json');changed=[]
for k in ['files','reportFiles']:
 for p,h in oldhash[k].items():
  assert P(p).is_file(),p
  if hashlib.sha256(P(p).read_bytes()).hexdigest()!=h:assert k=='files',p;changed.append(p)
h=hashlib.sha256()
def walk(p):
 p=P(p)
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif not str(p).endswith('.pyc'):h.update((p.as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json','reports/BB_OFFICIAL_BROWSER_MANIFEST.json']:walk(p)
fingerprint=h.hexdigest();assert fingerprint=='35a5c2302d5f68a3c35978cf9ec2171c1d357cb16842d4a84512b9ca7f439853',fingerprint
manifest=read(old+'BROWSER_MANIFEST.json')['manifest']; rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']};assert len(manifest)==69 and len(rows)==104
for p in sorted(root.glob('browser-*/matrix.json')):
 d=read(p);assert d['sourceFingerprint']==fingerprint and d['version']==version,p
 for r in d['runs']:
  k=r['suite'],r['version'];assert k in rows
  if r['status']=='INCOMPLETE':continue
  if r['status']=='PASS':assert r['exitCode']==0 and 'S06_BROWSER_PASS '+r['suite'] in log(r['log']) and not re.search('TargetClosedError|BRIDGE_READER_FAILURE|Task exception was never retrieved|BROWSER_RESOURCE_LEAK',log(r['log'])),k
  assert rows[k]['status'] in ['INCOMPLETE',r['status']],k;rows[k]=r
suites=[]
for m in manifest:
 states=[rows[m['suite'],v]['status'] for v in m['requiredVersions']];suites.append(dict(suite=m['suite'],status='FAIL' if 'FAIL' in states else 'PASS' if all(x=='PASS' for x in states) else 'INCOMPLETE'))
def tally(a):return dict(total=len(a),**{s:sum(x['status']==s for x in a) for s in ['PASS','FAIL','INCOMPLETE']})
browser=dict(version=version,sourceFingerprint=fingerprint,manifest=tally(suites),matrix=tally(list(rows.values())),suites=suites,runs=list(rows.values()));out('BROWSER_RESULTS',browser)
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
backend=log(root/'backend-full.log');results=tap(backend);e=exitcode(root/'backend-full.exit');summary={k:int(m.group(1)) if (m:=re.search(r'^# '+k+r' (\d+)$',backend,re.M)) else None for k in ['tests','pass','fail','skipped','cancelled','todo']};baseline={r['test']:r['status'] for r in read(old+'BACKEND_REGRESSION.json')['results']};assert len(baseline)==432
missing=sorted(set(baseline)-set(results));regressions=sorted(n for n in baseline if n in results and baseline[n]!=results[n]);clean=e==0 and not missing and not regressions and len(results)==435 and summary==dict(tests=435,**{'pass':424},fail=0,skipped=11,cancelled=0,todo=0)
names={n for n,v in results.items() if v=='PASS'};live={n:v for n,v in results.items() if n.startswith(('B/B live','B/B profiles','B/B owner final','Stability BB:'))};candidate={n:v for n,v in results.items() if n.startswith('BBv2 ')};liveok=len(live)==13 and set(live.values())=={'PASS'}
newTests=sorted(set(results)-set(baseline));out('BACKEND_REGRESSION',dict(version=version,sourceFingerprint=fingerprint,mode='MONOLITHIC',exitCode=e,summary=summary,complete=clean,baselineObligations=len(baseline),missingBaselineObligations=missing,changedBaselineStatus=regressions,newTests=newTests,results=[dict(test=n,status=v) for n,v in sorted(results.items())],liveRetest=live,candidateRetest=candidate,logs=[str(root/'backend-full.log')],focusedDiagnostics=['focused-first.log','focused-second.log']))
full=read(old+'FULL_ROLE_CERTIFICATES.json');f=full['historicalCertificatesPreserved'][0];f['missingFreshTests']=[t for t in f['requiredTests'] if t not in names];f['missingFreshBrowser']=[n for n in ['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e'] if not bp(n)];f['freshRevalidated']=not f['missingFreshTests'] and not f['missingFreshBrowser'];f['freshEvidenceVersion']=version;f['freshEvidence']=[str(root/'backend-full.log'),prefix+'BROWSER_RESULTS.json'];f['status']='REVALIDATED_ON_CURRENT_SOURCE' if f['freshRevalidated'] else 'REVALIDATION_PENDING_OR_FAILED';
if f['freshRevalidated']:f['revalidatedOn']=version
full['freshRevalidatedCount']=int(f['freshRevalidated']);out('FULL_ROLE_CERTIFICATES',full)
cert=read(old+'BRANCH_COMPLETE_MATRIX.json');cert['freshEvidenceVersion']=version
for c in cert['qaCertificates']+cert['playableCertificates']+cert['newCertificates']:
 needed=c['requiredTests']+c.get('sharedAcceptanceTests',[]);c['missingFreshTests']=[t for t in needed if t not in names];bs=([c['browserSuite']] if c.get('browserSuite') else ['browser_s15_approved_'+n+'_e2e' if n in ['village','knight'] else n for n in c['browserEvidence']]);c['missingFreshBrowser']=[n for n in bs if not bp(n)];c['freshRevalidated']=not c['missingFreshTests'] and not c['missingFreshBrowser'];c['status']='REVALIDATED_ON_CURRENT_SOURCE' if c['freshRevalidated'] else 'REVALIDATION_PENDING_OR_FAILED'
 if c['freshRevalidated']:c['revalidatedOn']=version
cert['newlyIssuedThisBuild']=[];cert['newCertificatesMeaning']='Historical issuance records retained from previous builds, not new in v1.7.22';guard=cert['ownerBBGuardSupplement'];guard['missingFreshTests']=[n for n in guard['requiredTests'] if n not in names];guard['browserFresh']=bp('browser_s15_normal_guard_e2e');guard['freshRevalidated']=not guard['missingFreshTests'] and guard['browserFresh'];out('BRANCH_COMPLETE_MATRIX',cert)
reg=read(old+'ATOMIC_COVERAGE.json')
for b in reg['branches']:
 hist=bool(b.get('executedTested') or b.get('historicalEvidenceRetained'));req=b.get('requiredPassTests',[]);b['passedTests']=[n for n in req if n in names];b['executedTested']=hist and bool(req) and len(b['passedTests'])==len(req) and (not b.get('requiredBrowser') or bp(b['requiredBrowser']));b['historicalEvidenceRetained']=hist
assert sum(b['historicalEvidenceRetained'] for b in reg['branches'])==79;sfresh=sum(b['executedTested'] for b in reg['branches']);reg.update(version=version,executedTested=sfresh,cumulativePass=79,inventoryDelta=dict(addedRoleIds=[],note='No new official role or branch certified.'));out('ATOMIC_COVERAGE',reg)
ids=read(old+'CHARACTER_ID_DELTA.json')['afterIds'];assert len(set(ids))==52;out('CHARACTER_ID_DELTA',dict(version=version,baselineIds=ids,afterIds=ids,addedIds=[],removedIds=[]))
fresh=dict(F=full['freshRevalidatedCount'],qaC=sum(c['freshRevalidated'] for c in cert['qaCertificates']),playableC=sum(c['freshRevalidated'] for c in cert['playableCertificates']+cert['newCertificates']),S_pass=sfresh)
qa={n:rows[(f'browser_s15_bb_live_{n}_e2e.py','1.3.3+qa-bb')]['status'] for n in ['pack','trap','guard','witch','retaliation']};qa['cross_window']=rows[('browser_s15_bb_cross_window_e2e.py','1.3.3+qa-bb')]['status'];stat=base['cumulative'];out('METRICS',dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,baseline=stat,cumulative=stat,delta={k:0 for k in stat},fresh=fresh,enabledNormalRegistry=12,completedDecks=base['completedDecks'],newMatchDecks=[],newVotingDecks=[],browser=browser['manifest'],matrix=browser['matrix'],liveQA=dict(browser=qa,backendPass=sum(v=='PASS' for v in live.values())),note='No new official certificate; current revalidation distinct from accumulation.'))
contracts=read(old+'COMPLETION_CONTRACTS.json');contracts['version']=version;contracts['officialFullCertificatesAdded']=[];contracts['stabilityEvidence']={'emptyWindows': 'PASS' if any(n.startswith('Stability BB:') for n in names) else 'INCOMPLETE','fivePlayer':[{ 'deck':d,'test':n,'status':results.get(n,'INCOMPLETE'),'remaining':['Reduced-roster rescue/protection combinations and repeated night coverage','Finite ballot classes and real room vote/reconnect/phase paths','No FULL role or new deck certificate inferred']} for n in sorted(n for n in set(baseline)|set(results) if n.startswith('Stability five-player')) for d in ([[9,25,48,74,87]] if '#9/#87:' in n else [[25,31,48,74,87]])]};out('COMPLETION_CONTRACTS',contracts)
repro=exitcode(root/'diagnostic-winner-before.exit')!=0 and 'TERMINAL_REST_RENDER_GAP' in log(root/'diagnostic-winner-before.log');winner=bp('browser_s15_normal_e2e');assert repro
out('BROWSER_DEFECTS',dict(build=version,defects=[dict(id='WV-BR-2026-1125-01',status='FIXED_RETEST_PASS' if winner else 'RETEST_NOT_PASS',reproducedCause='REST completed projection assigned before auxiliary feedback/event fetch finishes; terminal DOM not rendered until fetch resolves. Original incident exact path not independently proven.',before=str(root/'diagnostic-winner-before.log'),after=rows['browser_s15_normal_e2e.py','1.3.3'],assertionPreserved=True)]+[dict(id='WV-BR-2026-1125-02',suite='browser_s15_deep_medium_e2e.py',status='OPEN_FAIL',observed='Round 2 revival capability and target were present; submit button disabled, initially working=true then invalid target; click timeout.',suspectedCause='action helper calls chooseTarget without waiting for !working; frontend chooseTarget returns immediately during working. The failed run does not record selectedTarget/host role; not uniquely established. No test/source edit after freeze and no retry promotion.',evidence=rows['browser_s15_deep_medium_e2e.py','1.3.3'],releaseBlocking=True)] if rows['browser_s15_deep_medium_e2e.py','1.3.3']['status']=='FAIL' else [dict(id='WV-BR-2026-1125-01',status='FIXED_RETEST_PASS' if winner else 'RETEST_NOT_PASS',before=str(root/'diagnostic-winner-before.log'),after=rows['browser_s15_normal_e2e.py','1.3.3'],assertionPreserved=True)],baselineTimeouts={n:rows[n,'1.3.3']['status'] for n in ['browser_s15_normal_rescue_e2e.py','browser_s15_normal_guard_rescue_e2e.py']}))
gates=[dict(gate=g,baseline=b,result=r,evidence=p) for g,b,r,p in [('Monolithic Backend','PASS_SPLIT','PASS' if clean else 'INCOMPLETE_OR_FAIL',prefix+'BACKEND_REGRESSION.json'),('Browser FAIL',1,browser['manifest']['FAIL'],prefix+'BROWSER_RESULTS.json'),('Browser INCOMPLETE',47,browser['manifest']['INCOMPLETE'],prefix+'BROWSER_RESULTS.json'),('FULL Revalidation','1/1',f"{fresh['F']}/1",prefix+'FULL_ROLE_CERTIFICATES.json'),('QA C Revalidation','1/2',f"{fresh['qaC']}/2",prefix+'BRANCH_COMPLETE_MATRIX.json'),('Playable C Revalidation','3/5',f"{fresh['playableC']}/5",prefix+'BRANCH_COMPLETE_MATRIX.json'),('Atomic Revalidation','73/79',f'{sfresh}/79',prefix+'ATOMIC_COVERAGE.json'),('B/B Live Browser','6/6',f"{sum(v=='PASS' for v in qa.values())}/6",prefix+'BROWSER_RESULTS.json'),('Official v1.3.4','CANDIDATE','CANDIDATE',prefix+'RELEASE_SCOPE.json'),('Human QA','PENDING','PENDING',prefix+'HUMAN_QA_PACK.md')]]
out('STABILITY_SCORECARD',dict(version=version,sourceFingerprint=fingerprint,gates=gates,accumulatedCertificates={'FULL':1,'QA_C':2,'Playable_C':5},currentRevalidated=fresh,newCertificates=[],competitiveProduction='NO_GO'))
g=read(old+'RULE_RELEASE_GATES.json');g['version']=version;g['state']='CANDIDATE';g['readyForApproval']=False;g['active']=False;g['releaseScope']=prefix+'RELEASE_SCOPE.json'
for row in g['gates']:
 if row['gate']=='Legacy backend':row.update(status='PASS' if clean else 'INCOMPLETE_OR_FAIL',evidence=prefix+'BACKEND_REGRESSION.json')
 if row['gate']=='Critical browser':row.update(status='PASS' if all(v=='PASS' for v in qa.values()) else 'INCOMPLETE_OR_FAIL',evidence=prefix+'BROWSER_RESULTS.json')
 if row['gate']=='Full project browser':row.update(status='PASS' if browser['matrix']['PASS']==104 else 'INCOMPLETE_OR_FAIL',evidence=prefix+'BROWSER_RESULTS.json')
 if row['gate']=='Previous two browser failures':row.update(status='PASS_RETEST' if bp('browser_s15_normal_rescue_e2e') and bp('browser_s15_normal_guard_rescue_e2e') else 'INCOMPLETE_OR_FAIL',evidence=prefix+'BROWSER_RESULTS.json')
 if row['gate'] in ['Cross-window Engine','Representative order','Consensus wait','Trap consumption/resource/cooldown','SQLite restart/replay/privacy']:row['status']='PASS_BOUNDED' if liveok else 'INCOMPLETE_OR_FAIL'
 if row['gate']=='REST/WS/UI':row['status']='PASS_BOUNDED' if all(v=='PASS' for v in qa.values()) and winner else 'INCOMPLETE_OR_FAIL'
g['gates'].append(dict(gate='Winner Screen Regression',status='PASS' if winner else 'INCOMPLETE_OR_FAIL',evidence=prefix+'BROWSER_DEFECTS.json'));out('RULE_RELEASE_GATES',g)
out('ACCEPTANCE',dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,backendGate='PASS' if clean else 'INCOMPLETE_OR_FAIL',backend=summary,browser=browser['manifest'],matrix=browser['matrix'],winnerRegression='FIXED_RETEST_PASS' if winner else 'NOT_PASS',liveBackend=live,liveBrowser=qa,freshCertificates=fresh,newFull=[],newPlayable=[],officialActivation=False,ownerQA='PENDING',postgreSQLLive='PENDING',competitiveProduction='NO_GO',legacySourceChecksumChanged=changed,legacyReportsUnchanged=len(oldhash['reportFiles'])))
print(json.dumps(read(prefix+'ACCEPTANCE.json'),ensure_ascii=False,indent=2))
