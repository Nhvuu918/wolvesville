"""Development Normal through real UI, no QA, no role fixture. One compositional
scenario with guard/inspection/bell, actual hanging, reconnect and replay."""
import os,pathlib,sys,requests,time,json,math,base64,io
from PIL import Image
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 h=requests.get(be.BASE+'/health',timeout=5).json();assert h['normalGameplay'] and not h['officialRuleTestMode'] and not h['gameIntegrationTestMode'] and not h['life02Qa']
 assert len([d for d in h['normalDecks'] if d.get('developmentScope')])==6
 shots=pathlib.Path(os.environ['WV_SCREENSHOT_DIR']);shots.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(4):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'Dev'+str(i));p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Universal Engine');host.locator('#wv-capacity').fill('4');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   for p in pages:p.wait_for_function('WolvesLive.room?.members.length===4 && WolvesLive.room.members.every(m=>m.online)')
   for p in pages:
    p.wait_for_function('async()=> (await WolvesLive.request("/api/social/notifications")).notifications.some(n=>n.kind==="room_full")')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option('dev-life-modules:8,25,31,64')
   for p in pages:p.wait_for_function('WolvesLive.room.normalDeck==="dev-life-modules:8,25,31,64" && !WolvesLive.working')
   assert host.locator('#wv-normal-start').is_disabled();host.screenshot(path=str(shots/'normal-config.png'))
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
    pid=p.evaluate('WolvesLive.profile.id')
    for q in pages:q.wait_for_function('(id)=>WolvesLive.room.members.find(m=>m.id===id).ready',arg=pid)
   host.wait_for_function('async()=> (await WolvesLive.request("/api/social/notifications")).notifications.some(n=>n.kind==="room_ready")');host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.developmentScope==="LIFE-MODULES-1-GUARD-OBSERVATION" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert set(roles)=={8,25,31,64};k,a,g,b=[roles[r] for r in [8,25,31,64]]
   for p in pages:assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length===1 && !WolvesLive.game.canQaAdvanceDay && !WolvesLive.game.canQaResolveDaySkill')
   print('E2E_STAGE real-normal-assignment',flush=True)
   # Upload one test account's actual avatar via existing authenticated media API.
   image=io.BytesIO();Image.new('RGB',(96,96),(154,116,65)).save(image,'PNG');a.evaluate('(data)=>WolvesLive.request("/api/social/media","POST",{slot:"avatar",mime:"image/png",data})',base64.b64encode(image.getvalue()).decode())
   capture=pathlib.Path(os.environ.get('WV_FATE_CAPTURE_DIR','/tmp/wvf-capture'));capture.mkdir(parents=True,exist_ok=True);recorded=[];cdp=g.context.new_cdp_session(g)
   def screencast(event):
    file=capture/f'capture-{len(recorded):05d}.jpg';file.write_bytes(base64.b64decode(event['data']));recorded.append({'file':file.name,'timestamp':event['metadata']['timestamp']});cdp.send('Page.screencastFrameAck',{'sessionId':event['sessionId']})
   cdp.on('Page.screencastFrame',screencast);cdp.send('Page.startScreencast',{'format':'jpeg','quality':75,'maxWidth':1024,'maxHeight':700,'everyNthFrame':1})
   for p in pages:
    p.locator('#wv-fate-open').click();assert p.locator('#wv-fate-count').inner_text()=='3/3 mục đang chọn';assert p.locator('#wv-fate-list input:checked').count()==3
    assert p.evaluate('!Array.from(document.querySelectorAll("#wv-fate-list input")).some(e=>e.dataset.entry===WolvesLive.profile.id)');p.locator('#wv-fate-close').click()
   g.screenshot(path=str(shots/'game-hud.png'));g.locator('#wv-fate-open').click();g.wait_for_function('Array.from(document.querySelectorAll("#wv-fate-disc image")).some(e=>e.getAttribute("visibility")==="visible")');g.screenshot(path=str(shots/'default.png'));g.locator('#wv-fate-list input').first.uncheck();g.locator('#wv-fate-custom').fill('Bỏ qua lượt');g.locator('#wv-fate-add button').click();assert g.locator('#wv-fate-count').inner_text()=='3/4 mục đang chọn';g.locator('#wv-fate-custom').fill('Bỏ qua lượt');g.locator('#wv-fate-add button').click();assert g.locator('#wv-fate-count').inner_text()=='3/4 mục đang chọn';g.locator('#wv-fate-search').fill('Bỏ qua');assert g.locator('#wv-fate-list input').count()==1;g.locator('#wv-fate-search').fill('');g.screenshot(path=str(shots/'custom.png'));g.locator('#wv-fate-close').click();g.locator('#wv-fate-open').click();assert g.locator('#wv-fate-count').inner_text()=='3/4 mục đang chọn';g.locator('#wv-fate-none').click();assert g.locator('#wv-fate-spin').is_disabled();g.locator('#wv-fate-all').click();assert g.locator('#wv-fate-count').inner_text()=='4/4 mục đang chọn';g.locator('#wv-fate-reset').click();assert g.locator('#wv-fate-count').inner_text()=='3/3 mục đang chọn';print('FATE customization PASS',flush=True)
   before=g.evaluate('({rev:WolvesLive.game.revision,feedback:WolvesLive.feedback.size,target:WolvesLive.selectedTarget})');other=a.evaluate('WolvesLive.game.revision');g.evaluate("""()=>{const original=window.playFateSfx;window.__fateAudio=[];window.playFateSfx=(kind,ended)=>{window.__fateAudio.push(kind);return original(kind,ended);};state.sfxVolume=35;}""");g.locator('#wv-fate-mute').uncheck();pointer=g.locator('#wv-fate-pointer').evaluate('(e)=>Array.from([e.getCTM().a,e.getCTM().b,e.getCTM().c,e.getCTM().d,e.getCTM().e,e.getCTM().f])');g.locator('#wv-fate-spin').click();assert g.locator('#wv-fate-spin').is_disabled();assert g.locator('#wv-fate-custom').is_disabled();frames=[];samples=[];t0=time.monotonic()
   while time.monotonic()-t0<8:
    elapsed=time.monotonic()-t0;angle=g.locator('#wv-fate-disc').evaluate('(e)=>e.style.transform');assert g.locator('#wv-fate-pointer').evaluate('(e)=>[e.getCTM().a,e.getCTM().b,e.getCTM().c,e.getCTM().d,e.getCTM().e,e.getCTM().f]')==pointer;samples.append({'elapsed':elapsed,'angle':angle,'discMatrix':g.locator('#wv-fate-disc').evaluate('(e)=>[e.getCTM().a,e.getCTM().b,e.getCTM().c,e.getCTM().d]')});path=shots/f'frame-{len(frames):03d}.png';g.locator('#wv-fate').screenshot(path=str(path),animations='allow',timeout=5000);frames.append((path.name,elapsed))
    if not g.locator('#wv-fate-spin').is_disabled():break
   assert len(set(s['angle'] for s in samples))>=5,samples;assert not g.locator('#wv-fate-spin').is_disabled();assert g.locator('#wv-fate-disc .wv-fate-winner').count()==1;assert g.locator('#wv-fate-result').inner_text()!='Chưa có kết quả.';assert g.evaluate('({rev:WolvesLive.game.revision,feedback:WolvesLive.feedback.size,target:WolvesLive.selectedTarget})')==before;assert a.evaluate('WolvesLive.game.revision')==other;assert a.locator('#wv-fate').count()==0
   assert g.evaluate('(()=>{const angle=parseFloat(document.querySelector("#wv-fate-disc").style.transform.slice(7));const seg=[...document.querySelectorAll("#wv-fate-disc [data-entry]")];const i=Math.floor(((360-angle%360)%360)/(360/seg.length));return seg[i].classList.contains("wv-fate-winner")})()');g.screenshot(path=str(shots/'result.png'));(shots/'animation.json').write_text(json.dumps({'samples':samples,'frames':frames,'pointerCTM':pointer},indent=2));assert g.evaluate('__fateAudio[0]==="start" && __fateAudio.includes("tick") && __fateAudio.at(-1)==="result"');g.wait_for_timeout(900);cdp.send('Page.stopScreencast');(capture/'capture.json').write_text(json.dumps(recorded,indent=2));cdp.detach();print('FATE animation, audio invocation, privacy PASS; screencast frames='+str(len(recorded)),flush=True)
   g.locator('#wv-fate-remove').click();assert g.locator('#wv-fate-count').inner_text()=='2/3 mục đang chọn';g.locator('#wv-fate-close').click();g.set_viewport_size({'width':390,'height':844});g.locator('#wv-fate-open').click();g.screenshot(path=str(shots/'mobile.png'));assert g.evaluate('document.querySelector("#wv-fate").getBoundingClientRect().width<=innerWidth');g.locator('#wv-fate-close').click();g.set_viewport_size({'width':1440,'height':900});g.evaluate("setWolvesTheme('basiclight')");g.locator('#wv-fate-open').click();g.screenshot(path=str(shots/'light.png'));g.locator('#wv-fate-close').click();g.evaluate("setWolvesTheme('moon')")
   g.locator('#wv-fate-open').click();themes=g.evaluate('THEME_OPTIONS.map(x=>x[0])');assert len(themes)==16
   for theme in themes:
    g.evaluate('(t)=>setWolvesTheme(t)',theme);assert g.evaluate('document.querySelector("#wv-fate").getBoundingClientRect().width<=innerWidth && document.querySelector("#wv-fate-spin").getBoundingClientRect().width>0')
   g.evaluate("setWolvesTheme('moon')");g.locator('#wv-fate-mute').check();count=g.evaluate('__fateAudio.length');g.locator('#wv-fate-spin').click();g.wait_for_timeout(450);g.locator('#wv-fate-close').click();g.wait_for_timeout(350);assert g.evaluate('__fateAudio.length')==count;assert g.locator('#wv-fate').count()==0
   g.locator('#wv-fate-open').click();assert g.locator('#wv-fate-count').inner_text()=='2/3 mục đang chọn';g.locator('#wv-fate-close').click();print('FATE all 16 themes layout, mute, cancellation PASS',flush=True)
   host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
   for p in pages:p.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=18000)
   g.locator('#wv-fate-open').click();assert g.locator('#wv-fate-count').inner_text()=='2/3 mục đang chọn';g.locator('#wv-fate-close').click();host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click()
   for p in pages:p.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"')
   g.locator('#wv-fate-open').click();g.locator('#wv-fate-mode-valid').click();g.emulate_media(reduced_motion='reduce');g.locator('#wv-fate-spin').click();g.wait_for_function('!document.querySelector("#wv-fate-spin").disabled');assert g.locator('#wv-fate-apply').is_enabled();g.screenshot(path=str(shots/'valid-vote.png'));g.locator('#wv-fate-apply').click();assert g.evaluate('!!WolvesLive.selectedTarget && !WolvesLive.game.voting.ownBallot');g.screenshot(path=str(shots/'action-selection.png'));g.get_by_role('button',name='Gửi / đổi phiếu').click();g.wait_for_function('!!WolvesLive.game.voting.ownBallot');print('FATE_BROWSER_PASS',flush=True);assert not be.LOGS,be.LOGS
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
