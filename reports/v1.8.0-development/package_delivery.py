from pathlib import Path as P
import json,hashlib,zipfile,os
root=P('reports/v1.8.0-development'); dest=P('/mnt/data/Wolvesville_v1.8.0-development_Character_Completion_Factory_Full_Source.zip'); manifest=root/'delivery-payload-sha256.json'; old=P('/mnt/data/Wolvesville_v1.7.36_Core_Engine_Rescue_Full_Source.zip')
exclude={'node_modules','dist','__pycache__','.git','.DS_Store','.env','.pytest_cache','local'}
files=[]
for d,ds,fs in os.walk('.'):
 ds[:]=sorted(x for x in ds if x not in exclude and not (P(d)/x).is_symlink());
 for name in sorted(fs):
  p=P(d)/name
  if name in exclude or p==manifest or p.suffix in ('.pyc','.sqlite','.db','.sqlite3','.sqlite-wal','.sqlite-shm','.tsbuildinfo') or p.is_symlink():continue
  files.append(p)
files=sorted(files); hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
with zipfile.ZipFile(old) as z:
 assert set(z.namelist())<=set(hashes),set(z.namelist())-set(hashes)
 old_reports=[n for n in z.namelist() if n.startswith('reports/')]; assert all(hashlib.sha256(z.read(n)).hexdigest()==hashes[n] for n in old_reports)
manifest.write_text(json.dumps({'version':'1.8.0-development','algorithm':'sha256','files':hashes},ensure_ascii=False,indent=2)+'\n')
with zipfile.ZipFile(dest,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files+[manifest]:z.write(p,p.as_posix())
with zipfile.ZipFile(dest) as z:
 assert z.testzip() is None
 assert len(z.namelist())==len(hashes)+1
 for p,d in hashes.items():assert hashlib.sha256(z.read(p)).hexdigest()==d,p
print(json.dumps({'zip':str(dest),'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'size':dest.stat().st_size,'entries':len(hashes)+1,'payloadCount':len(hashes),'historicalReports':len(old_reports)},indent=2))
