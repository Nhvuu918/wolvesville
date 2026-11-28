"""Run from clean extracted root: verify all payload hashes and acceptance."""
import json,hashlib,pathlib,subprocess,sys
p=pathlib.Path('reports/RC-01/delivery-payload-sha256.json');data=json.loads(p.read_text())
for f,h in data['files'].items():assert hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()==h,f
print('PASS payload',len(data['files']))
subprocess.run([sys.executable,'reports/RC-01/build_acceptance.py','--verify'],check=True)
