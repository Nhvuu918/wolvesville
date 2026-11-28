"""Evidence-derived continuation reports. Run from repository root after runners stop.
--verify compares generated reports byte-for-byte without editing source or evidence.
Historical cumulative certificates are not proof of this candidate's regression.
"""
import json, pathlib, re, hashlib, copy, sys
P=pathlib.Path; root=P('reports/s15-deep-engine'); prefix='reports/S15_DEEP_ENGINE_'; verify='--verify' in sys.argv
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
def markers(s,k):return [json.loads(line.split(k+' ',1)[1]) for line in s.splitlines() if line.startswith('# '+k+' ')]
version=read('package.json')['version'];rule='wolvesville-official-v1.3.3';assert version=='1.7.15-s15-deep-engine-wip'
old=read('reports/S15_GROWTH_METRICS.json');base=old['cumulative'];manifest=read(prefix+'BROWSER_MANIFEST.json')['manifest']
assert len({x['suite'] for x in manifest})==len(manifest)
# The exact same fingerprint as the JS checkpoint runner. Reports/docs are not runtime inputs.
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
for p in sorted(root.glob('final-browser*/matrix.json')):
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
browser=dict(version=version,sourceFingerprint=fingerprint,manifest=tally(suites),matrix=tally(list(rows.values())),suites=suites,runs=list(rows.values()));out('BROWSER_RESULTS',browser)
def bp(n):return rows.get((n if n.endswith('.py') else n+'.py','1.3.3'),{}).get('status')=='PASS'
backend=log(root/'backend.log'); backend_tap=tap(backend);names={k for k,v in backend_tap.items() if v=='PASS'}
summary={k:int(m.group(1)) if (m:=re.search(r'^# '+k+r' (\d+)$',backend,re.M)) else None for k in ['tests','pass','fail','skipped','cancelled','todo']}
backend_exit=int(log(root/'backend.exit').strip()) if log(root/'backend.exit').strip() else None
baseline_tests={r['test'] for r in read('reports/S15_GROWTH_BACKEND_SPLIT_REGRESSION.json')['results']}
missing=sorted(baseline_tests-set(backend_tap));final_backend=backend_exit==0 and summary['fail']==0 and summary['cancelled']==0 and not missing and summary['tests']==len(backend_tap) and summary['pass']+summary['skipped']==summary['tests']
out('BACKEND_REGRESSION',dict(version=version,sourceFingerprint=fingerprint,mode='MONOLITHIC_MIXED_RULE_MATRIX',command='WV_ARCHIVED_RULE_REGRESSION=1 node --test --test-concurrency=3 tests/*.test.mjs',note='Legacy suites use 1.3.2 as before; explicit current-rule suites bind 1.3.3. Additional current #28 obligations separate, not double-counted.',exitCode=backend_exit,summary=summary,complete=final_backend,baselineObligations=len(baseline_tests),missingBaselineObligations=missing,results=[{'test':n,'status':v} for n,v in sorted(backend_tap.items())],log=str(root/'backend.log')))
currentrole=tap(log(root/'role28-current.log'));current={n for n,v in currentrole.items() if v=='PASS'}|{n for n in names if n.startswith(('QD','Scale ','Normal ','Growth ','Three-player ','Deep normal ','Deep engineer ','Deep medium ','Play #31'))}
engineer=markers(backend,'DEEP_ENGINEER_EVIDENCE');medium=markers(backend,'DEEP_MEDIUM_EVIDENCE');norm=markers(backend,'DEEP_NORMAL_EVIDENCE')
eng_names=[f'Deep engineer #10: first-night trap on {r}, typed inspection, private RNG and durable replay' for r in [25,74,5]];med_names=[f'Deep medium #26: closed death, revival, repeated elimination, PH-01 {str(x).lower()}' for x in [False,True]]
eng_ok=set(eng_names)<=names and {x['target'] for x in engineer if all(x[k] for k in ['privacy','replay','restart'])}=={5,25,74} and bp('browser_s15_deep_engineer_e2e')
med_ok=set(med_names)<=names and {x['mediumKilled'] for x in medium if all(x[k] for k in ['completed','privacy','replay','restart'])}=={False,True} and bp('browser_s15_deep_medium_e2e')
added=([10] if eng_ok else [])+([26] if med_ok else []);base_ids=read('reports/S15_GROWTH_CHARACTER_ID_DELTA.json')['afterIds'];ids=sorted(set(base_ids+added));assert len(base_ids)==base['R'] and not set(added)&set(base_ids)
out('CHARACTER_ID_DELTA',dict(version=version,baselineIds=base_ids,addedIds=added,removedIds=[],afterIds=ids,scope='Restricted current-rule runtime only; no FULL or competitive permission',evidence={'10':{'scope':[5,10,25,74],'ruleProvenance':['character.json#10','SK-05','Q13-06','VH08','VH84'],'runtime':engineer,'browser':bp('browser_s15_deep_engineer_e2e'),'testPath':'tests/sprint15-deep-engineer.test.mjs'},'26':{'scope':[8,25,26],'ruleProvenance':['character.json#26','VH73','VH76','PH-01','VH03'],'runtime':medium,'browser':bp('browser_s15_deep_medium_e2e'),'testPath':'tests/sprint15-deep-medium.test.mjs'}}))
reg=read('data/rules/s15_growth_atomic_branch_registry.json');prev=read('reports/S15_GROWTH_ATOMIC_COVERAGE.json');oldbr={b['branchId']:b for b in prev['branches']};reg['auditedRoleIds']=sorted(set(reg['auditedRoleIds']+[10,26]));reg['unresolvedRoleIds']=sorted(set(range(1,98))-set(reg['auditedRoleIds']));reg['inventoryDelta']=dict(addedRoleIds=[10,26],source='data/character.json; 118 decision records; effective v1.3.3',note='Audit is not implementation. Resource/exception classes are constraints, not separately counted skills.')
def branch(cid,skill,bid,trigger,pre,target,effect,resource,duration,exceptions,deps,prov,path,tests=(),browser=None,remaining=''):
 return dict(characterId=cid,skillId=skill,branchId=bid,trigger=trigger,preconditions=pre,targetConstraints=target,effect=effect,resource=resource,duration=duration,exceptions=exceptions,interactionDependencies=deps,ruleProvenance=prov,implementationPath=path,requiredPassTests=list(tests),**({'requiredBrowser':browser} if browser else {}),remainingInteractions=remaining,implementationStatus='IMPLEMENTED_RESTRICTED' if tests else 'NOT_EXECUTED')
for bid,effect,test in [('AURA','Invert #25 true aura Thiện/Ác',eng_names[0]),('ROLE','Server RNG draws false exact role from locked deck excluding true',eng_names[1])]:
 reg['branches'].append(branch(10,'official.10.trap','WV-A10-TRAP-'+bid,'NIGHT_COLLECT','living engineer, first night only, no duplicate target','one other living seer',effect,'2 per game per source; first-night only proven','first-night resolution; lifetime unresolved','VH84 #5 immune; no actual role mutation',['IN','BL','RNG'],['character.json#10','SK-05','Q13-06','VH84','VH08'],'backend/src/official/engineer-trap.ts',[test,eng_names[2]],'browser_s15_deep_engineer_e2e','Complete match resource limit, cross-night lifetime, other targets; #25 unknown-aura reversal not in current deck.'))
for bid,effect in [('PROTECTION','Protection reverses into death'),('POISON','Poison reverses into no death'),('RESCUE','Rescue reverses into death')]:reg['branches'].append(branch(10,'official.10.trap','WV-A10-TRAP-'+bid,'night skill resolution','valid trap on skill user','source-specific actor and target',effect,'2 per game; unique targets','not certified','Preserve source damage/chain dependencies',['AT','DF','RESCUE','DEATH'],['character.json#10'],None,remaining='Adapter missing; order/attack/protection and death chain not yet verified.'))
reg['branches'] += [branch(26,'official.26.revive','WV-A26-REVIVE','night collection; commit at NIGHT_FINALIZE','alive when submitting; one charge','previously eliminated participant, excluding IDs 46/47/53','restore original life identity, faction, resources; public minimal PLAYER_REVIVED','1 per game','same-night finalize','VH73 any faction/time; VH76 exclusions; PH-01 accepted actor death',['REVIVAL','DEATH','VICTORY','REPLAY'],['character.json#26','VH73','VH76','PH-01','VH03'],'backend/src/official/revival.ts',med_names,'browser_s15_deep_medium_e2e','Test domain only [8,25,26]; no anonymous chat; other factions and three excluded roles not verified end-to-end.'),branch(26,'official.26.anonymous-chat','WV-A26-ANONYMOUS-CHAT','night','living medium','dead participant','anonymous 1–1 chat','per source','night','medium knows identity, dead player does not',['CH','PRIVACY'],['character.json#26','VH77'],None,remaining='Private asymmetric channel not implemented.')]
reg['verifiedDenominator']=len(reg['branches']);reg['globalDenominatorCertified']=False;out('ATOMIC_BRANCH_REGISTRY',reg)
branches=[]
for b in reg['branches']:
 b=copy.deepcopy(b);req=b.get('requiredPassTests',[]);b['passedTests']=[n for n in req if n in names|current];b['executedTested']=bool(req) and len(b['passedTests'])==len(req) and (not b.get('requiredBrowser') or bp(b['requiredBrowser']));b['historicalEvidenceRetained']=bool(oldbr.get(b['branchId'],{}).get('executedTested') or oldbr.get(b['branchId'],{}).get('historicalEvidenceRetained'));b['scope']='Restricted runtime, not global/full';branches.append(b)
s_fresh=sum(b['executedTested'] for b in branches);s_cum=sum(b['executedTested'] or b['historicalEvidenceRetained'] for b in branches)
out('ATOMIC_COVERAGE',dict(version=version,auditedRoleIds=reg['auditedRoleIds'],unresolvedRoleIds=reg['unresolvedRoleIds'],verifiedDenominator=len(branches),executedTested=s_fresh,cumulativePass=s_cum,globalDenominatorCertified=False,branches=branches,inventoryDelta=reg['inventoryDelta']))
full=read('reports/S15_GROWTH_FULL_ROLE_CERTIFICATES.json');f=full['historicalCertificatesPreserved'][0];f['missingFreshTests']=[t for t in f['requiredTests'] if t not in current];f['missingFreshBrowser']=[n for n in ['browser_s15_approved_revenge_e2e','browser_s15_approved_pin_e2e'] if not bp(n)];f['freshRevalidated']=not f['missingFreshTests'] and not f['missingFreshBrowser'];f['freshEvidenceVersion']=version;f['freshEvidence']=[str(root/'role28-current.log'),str(root/'backend.log'),prefix+'BROWSER_RESULTS.json'];f['status']='REVALIDATED_ON_CURRENT_SOURCE' if f['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE';
if f['freshRevalidated']:f['revalidatedOn']=version
full['freshRevalidatedCount']=int(f['freshRevalidated']);out('FULL_ROLE_CERTIFICATES',full)
cert=read('reports/S15_GROWTH_BRANCH_COMPLETE_MATRIX.json');cert['freshEvidenceVersion']=version
for c in cert['qaCertificates']+cert['playableCertificates']+cert['newCertificates']:
 needed=c['requiredTests']+c.get('sharedAcceptanceTests',[]);c['missingFreshTests']=[t for t in needed if t not in current];bs=([c['browserSuite']] if c.get('browserSuite') else ['browser_s15_approved_'+n+'_e2e' if n in ['village','knight'] else n for n in c['browserEvidence']]);c['missingFreshBrowser']=[n for n in bs if not bp(n)];c['freshRevalidated']=not c['missingFreshTests'] and not c['missingFreshBrowser'];c['status']='REVALIDATED_ON_CURRENT_SOURCE' if c['freshRevalidated'] else 'HISTORICAL_CERTIFICATE_RETAINED_CURRENT_RETEST_INCOMPLETE';
 if c['freshRevalidated']:c['revalidatedOn']=version
out('BRANCH_COMPLETE_MATRIX',cert)
configurations={'s15-deep-leader':[25,48,74],'s15-deep-leader-snow':[9,25,48,74],'s15-deep-knight-snow':[8,9],'s15-deep-knight-snow-aura':[8,9,25],'s15-deep-knight-snow-role':[8,9,74],'s15-deep-knight-snow-dual':[8,9,25,74]};deck_records=[]
for deck,dids in configurations.items():
 ev=[x for x in norm if x['deck']==deck];backend_ok={x['side'] for x in ev if all(x[k] for k in ['privacy','replay','restart'])}=={'village','enemy'} and f'Deep normal {deck}: both factions, real protection, chat, private observations, SQLite restart and replay' in names;suite='browser_s15_deep_normal_'+deck.removeprefix('s15-deep-').replace('-','_')+'_e2e.py';deck_records.append(dict(deck=deck,characterIds=dids,backend=backend_ok,browser=bp(suite),browserSuite=suite,evidence=ev,mode='NORMAL_GAMEPLAY',fullBranchCertificate=False,alreadyCountedInA=','.join(map(str,sorted(dids))) in old['completedDecks']))
assert all(d['alreadyCountedInA'] for d in deck_records)
new_normal=sum(d['backend'] and d['browser'] for d in deck_records);enabled=base['normalDecks']+len(deck_records);out('NORMAL_DECKS',dict(version=version,enabledRegistry=enabled,newBackendVerified=sum(d['backend'] for d in deck_records),newBrowserAndBackendVerified=new_normal,records=deck_records))
completed=set(old['completedDecks']);newA=[]
if med_ok:
 key='8,25,26';assert key not in completed;completed.add(key);newA.append(key)
assert len(old['completedDecks'])==base['A']
stats=dict(R=len(ids),F=base['F'],A=len(completed),B=base['B'],qaC=base['qaC'],playableC=base['playableC'],S_auditedRoles=len(reg['auditedRoleIds']),S_pass=s_cum,S_total=len(branches),normalDecks=base['normalDecks']+new_normal)
fresh=dict(F=int(f['freshRevalidated']),qaC=sum(c['freshRevalidated'] for c in cert['qaCertificates']),playableC=sum(c['freshRevalidated'] for c in cert['playableCertificates']+cert['newCertificates']),S_pass=s_fresh,newNormalDecksWithBrowserAndBackend=new_normal,newCharacterIds=added,newCompletedDecks=newA)
out('METRICS',dict(version=version,ruleVersion=rule,sourceFingerprint=fingerprint,baseline=base,cumulative=stats,delta={k:stats[k]-base[k] for k in stats},fresh=fresh,enabledNormalRegistry=enabled,newMatchDecks=newA,newVotingDecks=[],completedDecks=sorted(completed),browser=browser['manifest'],matrix=browser['matrix'],note='Historical achievements retained; only new verified browser+backend additions increase cumulative R/A/Normal. S records restricted branch proof; no whole-roster coverage.'))
# 97-role factory triage: based on unchanged source/registry, not generated abilities.
roles=read('data/rule-intelligence-s15/character_readiness_97.json');assert len(roles)==97 and len({r['characterId'] for r in roles})==97
factory=[]
for r in roles:
 cid=r['characterId'];br=[b for b in branches if b['characterId']==cid];factory.append(dict(id=cid,name=r['officialName'],mechanismTags=sorted(set(r.get('missingSharedMechanisms',[])+r.get('statusEffects',[]))),source=r['source'],executable=cid in ids,full=cid==28,branches=[b['branchId'] for b in br],remaining=[b['remainingInteractions'] for b in br if b.get('remainingInteractions')],newEffectMapping=({10:'engineer',26:'revival'}.get(cid)),ruleAuditFlags=r.get('genuineUnresolvedRule',[])))
out('CHARACTER_FACTORY',dict(scope='All 97 original roles grouped for reuse; no claim of generated executable adapters.',roles=factory))
out('ACCEPTANCE',dict(version=version,ruleVersion=rule,competitiveProduction='NO_GO',sourceIntegrity='PASS' if 'OK: 97 official characters, 118 decisions, 207 inherited test specs' in log(root/'source-integrity.log') else 'UNVERIFIED',backendGate='PASS_MONOLITHIC' if final_backend else 'INCOMPLETE_OR_FAIL',backend=summary,browser=browser['manifest'],matrix=browser['matrix'],newCurrentRoleProof={'10':eng_ok,'26':med_ok},newNormalDecksWithBoth=new_normal,fullCurrentRevalidated=f['freshRevalidated'],qaCurrentRevalidated=fresh['qaC'],playableCurrentRevalidated=fresh['playableC'],postgreSQLLive='PENDING',multiWolfConsensus='PROPOSED_ONLY_UNCHANGED',qualityScope='WIP. Full manifest not accepted unless all obligations pass. No new FULL/Branch Complete certificate.'))
print(json.dumps({'version':version,'metrics':stats,'fresh':fresh,'backend':summary,'backendGate':final_backend,'browser':browser['manifest'],'matrix':browser['matrix'],'sourceFingerprint':fingerprint},ensure_ascii=False,indent=2))
