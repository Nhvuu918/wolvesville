"""Derive RC-01 results without promoting candidate QA or stale acceptance."""
import hashlib,json,re,pathlib,sys
P=pathlib.Path; root=P('reports/RC-01'); prev=P('reports/v1.8.0-development'); read=lambda p:json.loads(P(p).read_text()); verify='--verify' in sys.argv
h=hashlib.sha256()
def walk(p):
 p=P(p)
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif not str(p).endswith('.pyc'):h.update((p.as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json',str(root/'BROWSER_MANIFEST.json')]:walk(p)
fp=h.hexdigest(); matrix=read(root/'browser-final/matrix.json');assert matrix['sourceFingerprint']==fp
for r in matrix['runs']:
 if r['status']=='PASS':assert r['exitCode']==0 and ('S06_BROWSER_PASS '+r['suite']) in P(r['log']).read_text(),r
rows={(r['suite'],r['version']):r for r in matrix['runs']}
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
def tap(p):
 return {m[2].split(' # SKIP')[0].replace('\\#','#'):('SKIP' if '# SKIP' in m[2] else 'PASS' if m[1]=='ok' else 'FAIL') for m in re.finditer(r'^(ok|not ok) \d+ - (.*)$',P(p).read_text(),re.M)}
fullpath=root/'backend-full.log';full=tap(fullpath);exitcode=int((root/'backend-full.exit').read_text());prior=read(prev/'acceptance.json')['backend']['results'];missing=sorted(set(prior)-set(full));changed=sorted(n for n in prior if n in full and prior[n]!=full[n]);new=sorted(set(full)-set(prior));footer={k:int(v) for k,v in re.findall(r'^# (tests|pass|fail|cancelled|skipped|todo) (\d+)$',fullpath.read_text(),re.M)};duration=re.findall(r'^# duration_ms ([\d.]+)$',fullpath.read_text(),re.M);complete=exitcode==0 and footer.get('tests')==len(full)==len(prior)+2 and footer.get('pass')==sum(v=='PASS' for v in full.values()) and footer.get('fail')==0 and footer.get('cancelled')==0 and footer.get('skipped')==11 and not missing and not changed and len(new)==2 and all(full[n]=='PASS' for n in new)
names={n for n,v in full.items() if v=='PASS'};old='reports/BB_PRIVACY_STABILITY_';fullcert=read(old+'FULL_ROLE_CERTIFICATES.json')['historicalCertificatesPreserved'];deckcert=read(old+'BRANCH_COMPLETE_MATRIX.json');atomic=read(old+'ATOMIC_COVERAGE.json')['branches']
def cert_status(c,bs):
 missingTests=[n for n in c['requiredTests']+c.get('sharedAcceptanceTests',[]) if n not in names];missingBrowser=[n for n in bs if not bp(n)];return {'deck':c.get('deck'),'characterId':c.get('characterId'),'historicalCertified':c.get('certified',True),'missingFreshTests':missingTests,'missingFreshBrowser':missingBrowser,'freshRevalidated':not missingTests and not missingBrowser}
f=[cert_status(c,['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e']) for c in fullcert];q=[cert_status(c,['browser_s15_approved_'+n+'_e2e' if n in ('village','knight') else n for n in c['browserEvidence']]) for c in deckcert['qaCertificates']];c=[cert_status(c,[c['browserSuite']]) for c in deckcert['playableCertificates']+deckcert['newCertificates']];a=[]
for b in atomic:
 if not b['historicalEvidenceRetained']:continue
 req=b['requiredPassTests'];missingTests=[n for n in req if n not in names];a.append(dict(branchId=b['branchId'],missingTests=missingTests,requiredBrowser=b.get('requiredBrowser'),freshRevalidated=bool(req) and not missingTests and (not b.get('requiredBrowser') or bp(b['requiredBrowser']))))
assert len(a)==79
fresh={'F':sum(x['freshRevalidated'] for x in f),'qaC':sum(x['freshRevalidated'] for x in q),'playableC':sum(x['freshRevalidated'] for x in c),'atomicPass':sum(x['freshRevalidated'] for x in a)}
base=read(prev/'metrics.json')['current'];result=dict(version=read('package.json')['version'],sourceFingerprint=fp,activeRuleset='wolvesville-official-v1.3.3',candidateRuleset='wolvesville-official-v1.3.4',privacyRelease='PARTIAL',competitiveProduction='NO-GO',humanQA='PENDING',postgresLive='PENDING',backend=dict(mode='MONOLITHIC',exitCode=exitcode,complete=complete,tapFooter=footer,durationMs=float(duration[-1]) if duration else None,missingHistoricalTests=missing,changedHistoricalStatus=changed,newTests=new,results=full),browser=matrix['manifest'],ruleVersionMatrix=matrix['matrix'],historicalMetrics=base,currentCumulativeMetrics=base,metricDelta={k:0 for k in base},freshCertificateRevalidation=fresh,notes='No new FULL, no candidate QA promotion. Existing cumulative metrics preserved, fresh verification limited to actually executed evidence.')
for name,obj in [('acceptance.json',result),('certificate-revalidation.json',dict(sourceFingerprint=fp,F=f,qaC=q,playableC=c,atomic=a,newCertificates=[],fresh=fresh))]:
 p=root/name;t=json.dumps(obj,indent=2,ensure_ascii=False)+'\n'
 if verify:assert p.read_text()==t,name
 else:p.write_text(t)
print(json.dumps({k:result[k] for k in ['sourceFingerprint','browser','ruleVersionMatrix','freshCertificateRevalidation','currentCumulativeMetrics']},indent=2));print('Backend',complete,footer,'new',new,'missing',missing,'changed',changed)
