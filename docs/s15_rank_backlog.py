"""Generate engineering-only backlog from current evidence and inherited audit tags.
No inference of official rules, no new role/branch certification. Run from root.
"""
import json
from pathlib import Path
from collections import defaultdict
root=Path('.'); rows=json.loads((root/'data/rule-intelligence-s15/character_readiness_97.json').read_text()); metrics=json.loads((root/'reports/S15_METRICS.json').read_text()); covered=set(metrics['metricR']['ids'])
labels={'AT':'Attack/protection','DF':'Death/follow-up','RS':'Resources/status','WC':'Win conditions','TR':'Transformation','IN':'Investigation','LK':'Links','TM':'Team mechanics','BL':'Blocking','RV':'Revival','VT':'Voting','CH':'Chat/permissions','RN':'Randomness','NO':'Notification/information','OP':'Ordering/priority','RF':'Redirection/reflection'}
by=defaultdict(set)
for r in rows:
 for tag in r.get('missingSharedMechanisms',[]):by[tag].add(r['characterId'])
items=[]
for tag,ids in by.items():
 new=sorted(ids-covered); partial=sorted(ids&covered); complexity=3 if tag in ('AT','DF','WC','TR','LK','TM','RV','OP','RF') else 2
 risk=3 if tag in ('AT','DF','WC','TR','TM','OP','RF') else 2
 # Provisional ranking: potential affected roles, NOT a promise that completing the tag unlocks them.
 score=3*len(new)+2*len(partial)-5*complexity-3*risk
 items.append({'tag':tag,'label':labels.get(tag,tag),'potentialUnexecutedIds':new,'potentialPartialIds':partial,'engineeringComplexity':complexity,'regressionRisk':risk,'score':score,'officialRuleReadiness':'REQUIRES_BRANCH_REVIEW'})
items.sort(key=lambda x:(-x['score'],x['tag']))
report={'version':metrics['version'],'scope':'Technical planning only. Inherited tags are candidate dependencies, not proof of missing rules or guaranteed unlocks.','scoreFormula':'3*unexecuted + 2*partial - 5*complexity - 3*risk; complexity/risk 1..3 engineering estimates','rankedMechanisms':items,'characters':[{'id':r['characterId'],'name':r['officialName'],'executed':r['characterId'] in covered,'source':r['source'],'sourceDecisions':r.get('relatedConfirmedDecisions',[]),'provisionalAuditGroup':r.get('group'),'candidateDependencies':sorted(set(r.get('missingSharedMechanisms',[]))),'skillAuditIds':r.get('auditSkillIds',[]),'executedSkillIds':r.get('executedSkillIds',[]),'testEvidence':r.get('testEvidence',[]),'remaining':r.get('missingImplementation'),'unreviewedRuleFlags':r.get('genuineUnresolvedRule',[])} for r in rows]}
(root/'reports/S15_ROLE_DEPENDENCY_BACKLOG.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print('S15 backlog',len(rows),'roles',len(items),'mechanism tags; no certified metrics changed')
