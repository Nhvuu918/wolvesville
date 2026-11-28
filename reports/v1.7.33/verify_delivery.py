"""Verify delivered ZIP payload, source preservation and clean extraction; no network."""
import sys,json,zipfile,hashlib,pathlib
P=pathlib.Path; f=P(sys.argv[1]); m='reports/v1.7.33/delivery-payload-sha256.json'; old='reports/v1.7.32/delivery-payload-sha256.json'
with zipfile.ZipFile(f) as z:
 assert z.testzip() is None
 names=z.namelist(); assert len(names)==len(set(names)); assert all(not P(n).is_absolute() and '..' not in P(n).parts for n in names)
 hashes=json.loads(z.read(m))['files']; assert set(names)==set(hashes)|{m}; assert all(hashlib.sha256(z.read(n)).hexdigest()==h for n,h in hashes.items())
 prev=json.loads(z.read(old))['files']; assert set(prev)|{old} <= set(names); preserved=[n for n in prev if n.startswith('reports/') or n.startswith('data/rules/') or n=='data/character.json']; assert all(hashes[n]==prev[n] for n in preserved)
 assert not any(any(part in ('node_modules','dist','local','__pycache__','.env','.git') for part in P(n).parts) or P(n).suffix in ('.db','.sqlite','.sqlite3','.sqlite-wal','.sqlite-shm','.pyc','.tsbuildinfo') for n in names)
 print(json.dumps(dict(crc='PASS',payloadVerified=len(hashes),entries=len(names),inheritedPreserved=len(prev)+1,historicalReportsPreserved=sum(n.startswith('reports/') for n in prev)+1,rulesAndCharactersPreserved=True,zipSha256=hashlib.sha256(f.read_bytes()).hexdigest(),size=f.stat().st_size),indent=2))
 if len(sys.argv)>2:
  dest=P(sys.argv[2]); assert not dest.exists() or not any(dest.iterdir());z.extractall(dest); assert all(hashlib.sha256((dest/n).read_bytes()).hexdigest()==h for n,h in hashes.items());print('CLEAN_EXTRACTION_PAYLOAD PASS')
