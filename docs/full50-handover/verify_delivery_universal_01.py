"""Verify FULL50-UNIVERSAL-01 payload and runtime fingerprint. Does not grant certificates."""
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[2]; report=root/'reports/FULL50-UNIVERSAL-01'; m=json.loads((report/'delivery-payload-sha256.json').read_text())
for p,v in m['files'].items():assert hashlib.sha256((root/p).read_bytes()).hexdigest()==v,p
h=hashlib.sha256()
def walk(p):
 if p.is_dir():
  for q in sorted(p.iterdir(),key=lambda x:x.name):
   if q.name not in ['__pycache__','node_modules','dist','.git','.DS_Store']:walk(q)
 elif p.suffix!='.pyc':h.update((p.relative_to(root).as_posix()+'\0').encode());h.update(hashlib.sha256(p.read_bytes()).digest())
for p in ['backend','shared','frontend','data','tests','scripts','package.json','tsconfig.json','reports/RC-01/BROWSER_MANIFEST.json']:walk(root/p)
assert h.hexdigest()==m['sourceFingerprint']
assert m['sourceFingerprint']==json.loads((report/'acceptance.json').read_text())['sourceFingerprint']
print('PASS payload',len(m['files']),'fingerprint',h.hexdigest())
