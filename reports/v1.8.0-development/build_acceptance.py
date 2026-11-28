"""Derive current acceptance from logs. Run from repository root. Historical reports remain immutable."""
import json,re,pathlib,hashlib,sys
P=pathlib.Path; root=P('reports/v1.8.0-development'); old='reports/BB_PRIVACY_STABILITY_'; verify='--verify' in sys.argv
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
fingerprint=h.hexdigest(); version=read('package.json')['version']; assert version=='1.8.0-development'
focused=tap(root/'bell-focused-extra.log'); medium={}; fullpath=root/'backend-full.log'; full=tap(fullpath) if fullpath.exists() else {}; exitpath=root/'backend-full.exit'; exitcode=int(exitpath.read_text()) if exitpath.exists() else None
previous=read('reports/v1.7.36/acceptance.json'); prior=previous['backend']['results']; assert len(prior)==487
missing=sorted(set(prior)-set(full)); changed=sorted(n for n in prior if n in full and prior[n]!=full[n]); new=sorted(set(full)-set(prior)); footer={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',fullpath.read_text(),re.M)} if fullpath.exists() else {}; duration=re.findall(r'^# duration_ms ([\d.]+)$',fullpath.read_text(),re.M) if fullpath.exists() else []; complete=exitcode==0 and footer.get('tests')==len(full)==len(prior)+len(new) and footer.get('pass')==sum(v=='PASS' for v in full.values()) and footer.get('fail')==0 and footer.get('cancelled')==0 and footer.get('skipped')==11 and not missing and not changed and len(new)==9 and all(full[n]=='PASS' for n in new)
names={n for n,v in full.items() if v=='PASS'}
manifest=read(root/'BROWSER_MANIFEST.json')['manifest']; rows={(m['suite'],v):dict(suite=m['suite'],version=v,status='INCOMPLETE',exitCode=None,log=None) for m in manifest for v in m['requiredVersions']}; assert len(manifest)==87 and len(rows)==122
attempts=[]
for p in sorted(root.glob('browser*/matrix.json')):
 d=read(p);assert d['sourceFingerprint']==fingerprint,p
 for r in d['runs']:
  if r['status']=='INCOMPLETE':continue
  if r['status']=='PASS': assert r['exitCode']==0 and P(r['log']).exists() and ('S06_BROWSER_PASS '+r['suite']) in P(r['log']).read_text(),r
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
base=read('reports/v1.7.36/metrics.json')['current']; deckkeys=read('reports/v1.7.36/metrics.json')['completedDecks']
assert len(set(deckkeys))==base['A']
proof=[json.loads(x) for x in re.findall(r'^# S28_NORMAL_BELL_EVIDENCE (.*)$',fullpath.read_text(),re.M)] if fullpath.exists() else []
proofkeys={','.join(map(str,e['deck'])) for e in proof if e['completed'] and e['privacy'] and e['replay'] and e['restart'] and e['mode']=='NORMAL_GAMEPLAY'}
bell_tests=[n for n in new if n.startswith('S28 normal bell:')]; bell_browser=bp('browser_s28_bell_normal_e2e.py')
bell_ok=len(bell_tests)==5 and all(n in names for n in bell_tests) and proofkeys=={'25,48,64,74','15,25,64,74','8,25,26,64'} and bell_browser
new_decks=sorted(proofkeys-set(deckkeys)) if bell_ok else []
current=dict(base);current['A']+=len(new_decks);current['B']+=len(new_decks);current['normalDecks']+=len(proofkeys) if bell_ok else 0
# Candidate QA recruitment/pack are reported separately, never added to official Normal/F/C/Atomic.
write('metrics.json',dict(version=version,sourceFingerprint=fingerprint,baseline=base,current=current,delta={k:current[k]-base[k] for k in base},completedDecks=sorted(deckkeys+new_decks),newNormalEvidence=proof,normalBrowserVerified=bell_browser,atomicDenominatorUnchanged=True,enabledNormalRegistry=16,notes='A/B unique new normal decks only; old Bell leader already counted in A. R remains prior certified executable role inventory; candidate-only #90 separate. No FULL/C/atomic additions.'))
mirror_ok=any(n.startswith('S28 mirror mixed pack:') for n in names)
cult_names=sorted(n for n in names if n.startswith('S27 cult'))
cult_browser=rows[('browser_s27_cult_e2e.py','1.3.3+qa-cult')]['status']=='PASS'
prev_suites={x['suite']:x['status'] for x in read('reports/v1.7.36/browser-results.json')['suites']}; transitions={}
for label,condition in [('existingIncompleteToPass',lambda x:prev_suites.get(x['suite'])=='INCOMPLETE' and x['status']=='PASS'),('existingFailToPass',lambda x:prev_suites.get(x['suite'])=='FAIL' and x['status']=='PASS'),('existingPassRevalidated',lambda x:prev_suites.get(x['suite'])=='PASS' and x['status']=='PASS'),('existingPassNotRevalidated',lambda x:prev_suites.get(x['suite'])=='PASS' and x['status']!='PASS'),('newPass',lambda x:x['suite'] not in prev_suites and x['status']=='PASS'),('newIncomplete',lambda x:x['suite'] not in prev_suites and x['status']=='INCOMPLETE')]:transitions[label]=[x['suite'] for x in suites if condition(x)]
write('browser-debt.json',dict(transitions=transitions,unresolved=[dict(suite=x['suite'],status=x['status'],reason='NOT_RUN_ON_CURRENT_FINGERPRINT' if x['status']=='INCOMPLETE' else 'SEE_ATTEMPT_LOG') for x in suites if x['status']!='PASS']))
write('acceptance.json',dict(version=version,sourceFingerprint=fingerprint,activeRuleset='wolvesville-official-v1.3.3',candidateRuleset='wolvesville-official-v1.3.4',privacyRelease='PARTIAL',competitiveProduction='NO-GO',humanQA='PENDING',postgresLive='PENDING',backend=dict(mode='MONOLITHIC',exitCode=exitcode,complete=complete,tapFooter=footer,durationMs=float(duration[-1]) if duration else None,counts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},missingHistoricalTests=missing,changedHistoricalStatus=changed,newTests=new,results=full,log=str(fullpath),focusedPass=sum(v=='PASS' for v in focused.values())),historicalMetrics=base,currentCumulativeMetrics=current,metricDelta={k:current[k]-base[k] for k in base},freshCertificateRevalidation=fresh,browser=browser['manifest'],ruleVersionMatrix=browser['matrix'],browserTransitions=transitions,bellProof=proof,bellNormalVerified=bell_ok,mirrorCandidateBackendVerified=mirror_ok,cultCandidateBackendTests=cult_names,cultCandidateBrowserVerified=cult_browser))
priorG=read('reports/v1.7.36/release-gates.json')
for g in priorG['obligations']+priorG['additionalGates']:
 g['priorEvidenceVersion']='1.7.36'
 for key in ('currentBackendPass','backendPass'):
  if key in g:g['prior_'+key]=g[key];g[key]=[n for n in g[key] if n in names]
 for key in ('currentBrowser','browser'):
  if key in g and isinstance(g[key],list):
   g['prior_'+key]=g[key];g[key]=[rows[(r['suite'],r['version'])] for r in g[key] if (r['suite'],r['version']) in rows]
   if g.get('status')=='LIVE_QA_BOUNDED_PASS' and any(r['status']!='PASS' for r in g[key]):g['status']='HISTORICAL_LIVE_QA_PASS_FRESH_BROWSER_INCOMPLETE'
 if 'currentEvidenceFiles' in g:g['currentEvidenceFiles']=[str(root/'acceptance.json'),str(root/'browser-results.json'),str(root/'focused.log')]
 if g.get('id')=='BACKEND':g.update(status='PASS' if complete else 'INCOMPLETE_OR_FAIL',evidence='acceptance.json',exitCriteria='Full inventory; all inherited results unchanged; all nine new tests PASS')
 if g.get('id')=='BROWSER':g.update(status='PASS' if browser['matrix']['PASS']==len(rows) else 'INCOMPLETE_OR_FAIL',evidence='browser-results.json',exitCriteria=f'All {len(rows)} obligations')
 if g.get('id')=='NORMAL-HANDOFF':g['status']='CLOSED_TESTED_SCOPE' if complete and fresh['playableC']==7 else 'INCOMPLETE_OR_FAIL'
 if g.get('id')=='FULL-84':g.update(status='PARTIAL',blocker='Real candidate recruitment/sacrifice and authorized group chat; original role retained. Cult revival, other group profiles, locks/death combinations and all victory award cases remain incomplete.')
 if g.get('id')=='FULL-79':g.update(status='PARTIAL',blocker='Unchanged: multiwolf authorized audience, Q13-09 Director mission and Oscar, real co-queued day actions.')
 if g.get('id')=='VISUAL-INTEGRATION':g.update(status='PARTIAL',blocker='S26 scoped phase banner, seat-name contrast and stale vote receipt verified only if current mirror suite PASS; broader HUD, chat, toast, accessibility, all themes and full replay UX remain unverified.')
priorG['additionalGates'] += [dict(id='S28-BELL',status='NORMAL_BOUNDED_VERIFIED' if bell_ok else 'PARTIAL',ruleProvenance='character.json#64, BT-64-1, T-COV-64/LIFE-02',currentBackendPass=bell_tests,currentBrowser=[rows[('browser_s28_bell_normal_e2e.py','1.3.3')]],blocker='No FULL: T-COV-64 #27/#97 fake-death/link domain and applicable lock/trap/role-change interactions not implemented/verified.'),dict(id='S27-CULT',status='LIVE_QA_BOUNDED_PASS' if len(cult_names)==3 and cult_browser else 'PARTIAL',ruleProvenance='Five approved DC-CULT records, VH50/VH55/VH57/VH59/VH78, Q13-08',currentBackendPass=cult_names,currentBrowser=[rows[('browser_s27_cult_e2e.py','1.3.3+qa-cult')]],blocker='Dead follower individual winner award, revival faction/group, broader killer domain, protected sacrifice, full privacy.'),dict(id='S28-MIRROR-MIXED',status='CANDIDATE_BACKEND_VERIFIED' if mirror_ok else 'PARTIAL',ruleProvenance='DC-MIRROR-MULTIVICTIM-01; VH11/VH22/VH08',currentBackendPass=[n for n in names if n.startswith('S28 mirror mixed pack:')],currentBrowser=[],blocker='No eight-seat browser integration, saved/preliminary/chain deaths and transformed aura domain not verified; PACK privacy remains pending.')]
priorG.update(version=version,sourceFingerprint=fingerprint,readyForApproval=False,activationAuthorized=False)
write('release-gates.json',priorG)
print(json.dumps(dict(fingerprint=fingerprint,backendComplete=complete,backendCounts={s:sum(v==s for v in full.values()) for s in ('PASS','FAIL','SKIP')},fresh=fresh,browser=browser['manifest'],ruleVersion=browser['matrix'],metrics=current,transitions={k:len(v) for k,v in transitions.items()}),indent=2))
