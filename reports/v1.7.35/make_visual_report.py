from pathlib import Path
import json,hashlib,base64,html,io,zipfile,shutil
from PIL import Image,ImageDraw,ImageFont
root=Path('reports/v1.7.35'); shots=root/'screenshots'; out=Path('/mnt/data')
mat=json.loads((root/'browser-visual/matrix.json').read_text()); fp=mat['sourceFingerprint']
assert all(next(r for r in mat['runs'] if r['suite']==n and r['version']=='1.3.3')['status']=='PASS' for n in ('browser_s25_visual_e2e.py','browser_s25_themes_e2e.py'))
rows={}
for name in ('journey-captures.json','theme-captures.json'):
 for row in json.loads((shots/name).read_text()):
  path=shots/row['file'];assert path.exists()
  row.update(sourceFingerprint=fp,transport='Chromium / Playwright / existing HTTP-WS transport bridge to actual local backend',sha256=hashlib.sha256(path.read_bytes()).hexdigest(),result='CAPTURED_ON_PASSING_SUITE')
  if row['screen']=='character-detail':row.update(result='CAPTURED_GRID_WITH_ROLE_SELECTED_DETAIL_NOT_VISIBLE',note='Chi tiết ở dưới vùng nhìn; chưa có ảnh riêng của nội dung chi tiết.')
  if row['screen']=='night-390x844':row.update(note='Banner pha bị cắt ở mobile; nút thao tác chính vẫn thấy. Responsive PARTIAL.')
  if row['screen']=='private-role':row.update(note='Thẻ vai riêng trong HUD; không phải ảnh modal reveal riêng.')
  rows[row['file']]=row
rows=list(rows.values()); assert len(rows)==len(list(shots.rglob('*.png')))==51
manifest={'sourceFingerprint':fp,'ruleset':'wolvesville-official-v1.3.3','originalPNGCount':len(rows),'captureSuites':{'browser_s25_visual_e2e.py':'PASS','browser_s25_themes_e2e.py':'PASS'},'screenshots':rows,'limitations':['Native Chromium loopback navigation blocked by environment; real backend used through project bridge.','No new live cult recruitment/group chat or new FULL role.','No before/after matched run.','No separate profile/history screenshot or full replay timeline; screenshot verifies replay receipt.','16 theme Codex previews only, no full per-theme all-screen acceptance.','Mobile phase banner clips; overall responsive partial.','Contrast audit, keyboard traversal and acoustic testing not completed.']}
(shots/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
# Contact sheet of existing actual screenshots, not a generated mockup.
canvas=Image.new('RGB',(1600,1008),'#12111e');draw=ImageDraw.Draw(canvas)
for i,row in enumerate([r for r in rows if r['file'].startswith('12-themes/')]):
 im=Image.open(shots/row['file']).convert('RGB');im.thumbnail((386,217));x=(i%4)*400+7;y=(i//4)*252+5;canvas.paste(im,(x,y+23));draw.text((x,y),row['screen'],font=font,fill='#f2e4c4')
canvas.save(root/'THEME_CONTACT_SHEET.png')
css='''body{margin:0;background:#141222;color:#e9e5ef;font:16px/1.55 system-ui,sans-serif}header,main{max-width:1220px;margin:auto;padding:26px}h1,h2{color:#f1ce87}h1{font-size:32px}p{color:#c7bed3}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(310px,1fr));gap:16px}figure{margin:0;background:#201c32;border:1px solid #413953;border-radius:10px;padding:12px;break-inside:avoid}img{width:100%;height:auto;border-radius:6px;display:block}figcaption{margin-top:10px}small{color:#b6abc3}code{overflow-wrap:anywhere}a{color:#eac584}details{padding:10px 0}'''
labels={'01-landing-auth':'Màn hình chào và xác thực','02-lobby':'Sảnh làng','03-room':'Tạo phòng và phòng chờ','04-codex':'Bách khoa','05-night-gameplay':'Đêm và kỹ năng','06-day-gameplay':'Ngày và kết quả riêng','07-chat':'Chat công khai','08-voting':'Biểu quyết','09-endgame':'Kết quả trận','10-replay':'Replay / reconnect','11-responsive':'Responsive','12-themes':'16 theme — xem trước Codex'}
parts=['<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wolvesville v1.7.35 — Visual Acceptance</title><style>'+css+'</style><header><h1>Wolvesville v1.7.35 — ảnh sản phẩm thực tế</h1><p>51 PNG nguyên bản; 2 suite visual PASS. Không phải mockup. Chromium chạy frontend thực; HTTP/WebSocket qua bridge hiện hữu tới backend local thật do loopback native bị chặn.</p><p>Fingerprint: <code>'+fp+'</code></p><p>F = 1/97; visual acceptance còn PARTIAL. Gallery hiển thị ảnh thu nhỏ; PNG nguyên bản trong Screenshot Pack.</p><details open><summary>Giới hạn nghiệm thu</summary><ul>'+''.join('<li>'+html.escape(x)+'</li>' for x in manifest['limitations'])+'</ul></details></header><main>']
for folder,label in labels.items():
 parts.append('<h2>'+html.escape(label)+'</h2><div class="grid">')
 for row in rows:
  if not row['file'].startswith(folder+'/'):continue
  im=Image.open(shots/row['file']).convert('RGB');im.thumbnail((900,900));b=io.BytesIO();im.save(b,'JPEG',quality=88,optimize=True);data=base64.b64encode(b.getvalue()).decode()
  v=row['viewport'];parts.append(f'<figure><img loading="lazy" alt="{html.escape(row["screen"])}" src="data:image/jpeg;base64,{data}"><figcaption><strong>{html.escape(row["screen"])}</strong><br><small>{v["width"]} × {v["height"]} · {html.escape(row["viewer"])} · {html.escape(row["mode"])}<br>{html.escape(row.get("note", "Ảnh chụp từ phiên đang chạy."))}</small></figcaption></figure>')
 parts.append('</div>')
parts.append('</main></html>');gallery=root/'VISUAL_ACCEPTANCE_REPORT.html';gallery.write_text(''.join(parts))
shutil.copy2(gallery,out/'Wolvesville_v1.7.35_Visual_Acceptance_Report.html')
shutil.copy2(root/'THEME_CONTACT_SHEET.png',out/'Wolvesville_v1.7.35_Theme_Contact_Sheet.png')
for label,src in [('Title','01-landing-auth/title.png'),('Lobby','02-lobby/village-lobby.png'),('Room','03-room/configuration.png'),('Codex','04-codex/wheel.png'),('Night','05-night-gameplay/selected-target.png'),('Day','06-day-gameplay/day-private-result.png'),('Voting','08-voting/voting.png'),('Endgame','09-endgame/victory.png'),('Mobile','11-responsive/night-390x844.png')]:
 shutil.copy2(shots/src,out/f'Wolvesville_v1.7.35_{label}.png')
zipname=out/'Wolvesville_v1.7.35_Actual_Product_Screenshots.zip'
with zipfile.ZipFile(zipname,'w',zipfile.ZIP_DEFLATED) as z:
 for row in rows:z.write(shots/row['file'],'screenshots/'+row['file'])
 z.write(shots/'manifest.json','screenshots/manifest.json');z.write(gallery,'VISUAL_ACCEPTANCE_REPORT.html');z.write(root/'THEME_CONTACT_SHEET.png','THEME_CONTACT_SHEET.png')
with zipfile.ZipFile(zipname) as z:assert z.testzip() is None
print('VISUAL_EVIDENCE',len(rows),fp,'ZIP',hashlib.sha256(zipname.read_bytes()).hexdigest(),zipname.stat().st_size)
