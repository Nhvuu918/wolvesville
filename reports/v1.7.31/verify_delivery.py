"""Run from clean extracted repository root. No mutation."""
import json,hashlib,pathlib
p=pathlib.Path('reports/v1.7.31/delivery-payload-sha256.json')
m=json.loads(p.read_text())['files']
for name,digest in m.items():
 assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==digest,name
print(f'Payload SHA256: {len(m)}/{len(m)} PASS')
