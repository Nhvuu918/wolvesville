"""Matched-state before/after evidence, using the verified v1.7.34 backend/frontend.
No baseline screenshot is counted as v1.7.35 acceptance.
"""
import fcntl,os,pathlib,tempfile,subprocess,socket,time,sys,json,hashlib,requests,zipfile
from playwright.sync_api import sync_playwright
from PIL import Image,ImageDraw,ImageFont
ROOT=pathlib.Path(__file__).resolve().parents[2];R=ROOT/'reports/v1.7.35';BASE=pathlib.Path(os.environ.get('WV_COMPARISON_BASE','/tmp/wv34'));ZIP=pathlib.Path(os.environ.get('WV_COMPARISON_ZIP','/mnt/data/Wolvesville_v1.7.34_Full_Role_Factory_Full_Source.zip'));OUT=R/'before-after';OUT.mkdir(exist_ok=True)
with zipfile.ZipFile(ZIP) as z:
 ns=[n for n in z.namelist() if n.startswith(('backend/','shared/','frontend/','data/','tests/','scripts/')) or n in ('package.json','tsconfig.json','reports/v1.7.34/BROWSER_MANIFEST.json')];assert hashlib.sha256(ZIP.read_bytes()).hexdigest()=='2b77938cea4b53c8bb37ae46eeee62a51166134bb4e8355457222c2afa5f72d6';assert all((BASE/n).read_bytes()==z.read(n) for n in ns)
basefp=json.loads((BASE/'reports/v1.7.34/acceptance.json').read_text())['sourceFingerprint'];newfp=json.loads((R/'browser-visual/matrix.json').read_text())['sourceFingerprint'];print('BASELINE_SOURCE_MATCH',len(ns),basefp,flush=True)
with open('/tmp/wolvesville-browser-admission-'+str(os.getuid())+'.lock','a+') as lease:
 fcntl.flock(lease,fcntl.LOCK_EX)
 with tempfile.TemporaryDirectory(prefix='wv34-comparison-') as td:
  sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close();base=f'http://127.0.0.1:{port}';env={**os.environ,'DB_PROVIDER':'sqlite','HOST':'127.0.0.1','PORT':str(port),'WV_LOBBY_DB':td+'/test.sqlite','WV_OFFICIAL_RULE_TEST_MODE':'0','WV_INTEGRATION_TEST_MODE':'0','WV_OWNER_BB_LIVE_QA':'0','WV_OWNER_DC_QA':'0','WV_E2E_SERVER':base,'WV_E2E_DIRECT':'0'};env.pop('WV_ARCHIVED_RULE_REGRESSION',None);os.environ.update(env)
  subprocess.run(['npm','run','build'],cwd=BASE,check=True,stdout=subprocess.DEVNULL)
  with open(R/'comparison-server.log','w') as log:
   server=subprocess.Popen(['node','scripts/serve-03.mjs'],cwd=BASE,env=env,stdout=log,stderr=subprocess.STDOUT)
   try:
    for _ in range(100):
     try:
      h=requests.get(base+'/health',timeout=1).json();assert h['normalGameplay'] and not h['officialRuleTestMode'];break
     except requests.RequestException:time.sleep(.1)
    else:raise RuntimeError('Server not healthy')
    sys.path.insert(0,str(BASE/'tests'));import browser_e2e as be
    pairs=[];current={'lobby':'02-lobby/village-lobby.png','room':'03-room/configuration.png','codex':'04-codex/wheel.png','night':'05-night-gameplay/night.png','night-action':'05-night-gameplay/selected-target.png','day':'06-day-gameplay/day-private-result.png','voting':'08-voting/voting.png'}
    def snap(p,n,viewer):
     p.wait_for_function('!document.getElementById("sceneTransition")?.classList.contains("active")');p.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width>0&&i.loading!=="lazy").map(i=>i.decode().catch(()=>{})))}');f=OUT/(n+'-v1.7.34.png');p.screenshot(path=str(f),animations='disabled');pairs.append(dict(screen=n,before=f.name,after='../screenshots/'+current[n],viewport=p.viewport_size,viewer=viewer,beforeFingerprint=basefp,afterFingerprint=newfp,beforeSha256=hashlib.sha256(f.read_bytes()).hexdigest(),afterSha256=hashlib.sha256((R/'screenshots'/current[n]).read_bytes()).hexdigest(),mode='NORMAL_GAMEPLAY',note='Equivalent phase/viewport; independent server-assigned roles, not identical RNG or pixel-regression test.'));(OUT/'manifest.json').write_text(json.dumps(pairs,indent=2));print('BASELINE_CAPTURE',n,flush=True)
    with sync_playwright() as pw:
     browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);contexts=[]
     try:
      for n in ('Linh','Minh'):
       c,p=be.page_setup(browser);contexts.append(c);p.emulate_media(reduced_motion='reduce');p.set_viewport_size({'width':1366,'height':768});be.register(p,n);p.wait_for_function('WolvesLive.connectionState==="online"')
      host,guest=[c.pages[0] for c in contexts];snap(host,'lobby','authenticated');host.evaluate("go('roles')");host.wait_for_function('page==="roles"&&ROLES.length===97');host.evaluate('chooseRole(25)');snap(host,'codex','authenticated');host.evaluate("go('rooms')");host.wait_for_function('page==="rooms"');host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Làng Ánh Trăng');host.locator('#wv-capacity').fill('2');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id');guest.evaluate('(id)=>WolvesLive.openRoom(id)',rid);guest.wait_for_function('WolvesLive.room?.members.length===2');host.wait_for_function('WolvesLive.room?.members.length===2');host.get_by_role('button',name='Khóa danh sách').click();guest.wait_for_function('WolvesLive.room.status==="LOCKED"');host.locator('#wv-normal-deck').select_option('knight');host.wait_for_function('WolvesLive.room.normalDeck==="knight"&&!WolvesLive.working');guest.wait_for_function('WolvesLive.room.normalDeck==="knight"');snap(host,'room','host');guest.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.some(m=>m.id!==WolvesLive.profile.id&&m.ready)');host.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.every(m=>m.ready)&&!WolvesLive.working');host.locator('#wv-normal-start').click()
      for p in (host,guest):p.wait_for_function('page==="ingame"&&WolvesLive.game?.mode==="NORMAL_GAMEPLAY"')
      roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in (host,guest)};seer=roles[25];knight=roles[8];snap(seer,'night','self #25');tid=knight.evaluate('WolvesLive.profile.id');seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);seer.locator('#wv-skill-submit').scroll_into_view_if_needed();snap(seer,'night-action','self #25');seer.locator('#wv-skill-submit').click();seer.wait_for_function('!WolvesLive.working&&WolvesLive.feedback.size>0');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click();seer.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"&&WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');snap(seer,'day','self #25');seer.locator('#wv-chat-input').fill('Chúng ta cùng thảo luận nhé.');seer.locator('#wv-chat-submit').click();knight.locator('.wv-chat-history').get_by_text('Chúng ta cùng thảo luận nhé.',exact=False).wait_for();host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();seer.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"&&!WolvesLive.working');seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);seer.get_by_role('button',name='Gửi / đổi phiếu').scroll_into_view_if_needed();snap(seer,'voting','self #25');assert not be.LOGS,be.LOGS;print('BASELINE_COMPARISON_PASS',flush=True)
     finally:be.close_contexts(contexts);browser.close();be.bridge.shutdown()
   finally:server.terminate();server.wait(timeout=5)
# Contact sheet only, original before/after PNGs remain separate and unaltered.
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18);canvas=Image.new('RGB',(1380,len(pairs)*420+45),'#151321');d=ImageDraw.Draw(canvas);d.text((14,10),'v1.7.34  BEFORE',fill='#f7dba0',font=font);d.text((700,10),'v1.7.35  AFTER',fill='#f7dba0',font=font)
for i,p in enumerate(pairs):
 y=44+i*420;d.text((14,y),p['screen'],fill='#d9cde5',font=font);a=Image.open(OUT/p['before']).convert('RGB');b=Image.open(OUT/p['after']).convert('RGB');a.thumbnail((680,382));b.thumbnail((680,382));canvas.paste(a,(8,y+27));canvas.paste(b,(692,y+27))
canvas.save(OUT/'BEFORE_AFTER_CONTACT_SHEET.png')
