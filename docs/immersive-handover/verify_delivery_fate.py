"""Verify this integrated delivery, without editing any source."""
import json,hashlib,sys
from pathlib import Path
root=Path(__file__).resolve().parents[2]
m=json.loads((root/'reports/WHEEL-OF-FATE/delivery-payload-sha256.json').read_text())
errors=[]
for name,expected in m['files'].items():
 p=root/name
 if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=expected:errors.append(name)
if errors:print('FAIL',*errors,sep='\n');sys.exit(1)
print('PASS',len(m['files']),'payload hashes',m['sourceFingerprint'])
