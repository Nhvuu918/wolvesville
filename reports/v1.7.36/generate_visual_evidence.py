from pathlib import Path as P
import json,hashlib,base64,html,zipfile,shutil
from PIL import Image,ImageOps,ImageDraw
r=P('reports/v1.7.36'); ss=r/'screenshots'; out=P('/mnt/data'); pre='Wolvesville_v1.7.36_'; d=json.loads((ss/'s26-mirror-captures.json').read_text()); matrix=json.loads((r/'browser-mirror/matrix.json').read_text()); fp=matrix['sourceFingerprint']; assert any(x['suite']=='browser_s26_mirror_normal_e2e.py' and x['status']=='PASS' for x in matrix['runs']); assert len(d)==9
names={'mobile-night':'Mobile_Night','mobile-day':'Mobile_Day','basiclight-hud':'Basic_Light','cream-hud':'Cream','sage-hud':'Sage','mirror-first-aura':'First_Aura','mirror-second-aura':'Second_Aura','endgame':'Endgame','replay':'Replay'}
for e in d:
 p=ss/e['file']; assert p.is_file(); e['sourceFingerprint']=fp; e['sha256']=hashlib.sha256(p.read_bytes()).hexdigest(); e['actualDimensions']=list(Image.open(p).size); e['acceptance']='PASS_ON_CURRENT_FINGERPRINT'; key=names.get(e['screen']);
 if key:shutil.copyfile(p,out/(pre+key+'.png'))
print('screens', [e['screen'] for e in d]);
# Compare the phase banner crop, not equivalent entire game states (old 2 seats vs new 4).
old=out/'Wolvesville_v1.7.35_Mobile.png'; new=out/(pre+'Mobile_Night.png'); compare=out/(pre+'Banner_Before_After.png')
if old.exists() and new.exists():
 a,b=(Image.open(p).convert('RGB').crop((0,0,390,160)) for p in (old,new)); c=Image.new('RGB',(816,200),'#141922'); draw=ImageDraw.Draw(c); draw.text((12,9),'v1.7.35 | historical capture',fill='white');draw.text((414,9),'v1.7.36 | current capture',fill='white');c.paste(a,(8,33));c.paste(b,(418,33));c.save(compare);shutil.copyfile(compare,ss/'s26-banner-before-after.png')
manifest={'sourceFingerprint':fp,'scope':'Sequential S26 normal browser acceptance; nine current screenshots. Comparison historical only, not current acceptance.','captures':d}
(ss/'S26_SCREENSHOT_MANIFEST.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n'); cards=[]
for e in d:
 p=ss/e['file']; cards.append('<figure><h2>'+html.escape(e['screen'])+'</h2><p>'+html.escape(f"{e['viewport']['width']} × {e['viewport']['height']} · {e['mode']} · {e['viewer']}")+'</p><img alt="'+html.escape(e['screen'])+'" src="data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()+'"></figure>')
if compare.exists():cards.insert(0,'<figure><h2>Mobile banner — before/after (historical/current)</h2><p>Crop of real screenshots, different match configurations.</p><img alt="Banner comparison" src="data:image/png;base64,'+base64.b64encode(compare.read_bytes()).decode()+'"></figure>')
gallery='<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wolvesville v1.7.36 | Visual acceptance</title><style>body{font:16px system-ui;background:#111722;color:#f3f4f6;margin:24px auto;max-width:1250px;padding:0 20px}figure{background:#1c2430;border:1px solid #394151;margin:20px 0;padding:20px;border-radius:12px}img{max-width:100%;height:auto;display:block;margin:auto}p{line-height:1.6;color:#cbd5e1}code{overflow-wrap:anywhere}</style><h1>Wolvesville v1.7.36 — Real browser screenshots</h1><p>Normal Gameplay [25,31,35,74] · ruleset v1.3.3 · Browser bridge to actual backend · No fixture or mockup for current screenshots.</p><p>Fingerprint <code>'+fp+'</code></p><p>Scope: phase banner, three light-theme seat surfaces, investigation, terminal vote notice and replay. Broader accessibility and HUD remain partial.</p>'+''.join(cards)+'</html>'
htmlpath=out/(pre+'Visual_Acceptance_Report.html');htmlpath.write_text(gallery);shutil.copyfile(htmlpath,r/'VISUAL_ACCEPTANCE_REPORT.html')
zpath=out/(pre+'Screenshot_Evidence.zip');
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED) as z:
 for e in d:z.write(ss/e['file'],e['file'])
 z.write(ss/'S26_SCREENSHOT_MANIFEST.json','S26_SCREENSHOT_MANIFEST.json');z.write(htmlpath,'VISUAL_ACCEPTANCE_REPORT.html')
 if compare.exists():z.write(compare,'s26-banner-before-after.png')
with zipfile.ZipFile(zpath) as z:assert z.testzip() is None
print('VISUAL_ZIP',zpath.stat().st_size,hashlib.sha256(zpath.read_bytes()).hexdigest())
