"""Actual normal gameplay and PNGs, not synthetic state."""
import json,pathlib,sys,requests
from playwright.sync_api import sync_playwright
import browser_e2e as be
REPO=pathlib.Path(__file__).resolve().parents[1]
ROOT=REPO/'reports'/('v'+json.loads((REPO/'package.json').read_text())['version'])/'screenshots'
SIZES=[(1920,1080),(1366,768),(768,1024),(390,844)]
shots=[]
def shot(p,folder,name,viewer='public'):
 p.wait_for_function('!document.getElementById("sceneTransition")?.classList.contains("active")');
 path=ROOT/folder/(name+'.png');path.parent.mkdir(parents=True,exist_ok=True)
 p.evaluate('async()=>{await document.fonts.ready;await Promise.all([...document.images].filter(i=>i.getBoundingClientRect().width>0&&i.loading!=="lazy").map(i=>i.decode().catch(()=>{}))) }')
 p.screenshot(path=str(path),animations='disabled',timeout=10000)
 v=p.viewport_size
 overflow=p.evaluate('Math.max(0,document.documentElement.scrollWidth-innerWidth)')
 missing=p.evaluate('[...document.images].filter(i=>i.complete&&!i.naturalWidth&&i.getBoundingClientRect().width>0).map(i=>i.getAttribute("src"))')
 shots.append(dict(screen=name,file=str(path.relative_to(ROOT)),viewport=v,viewer=viewer,ruleset='wolvesville-official-v1.3.3',mode='NORMAL_GAMEPLAY' if folder not in ('01-landing-auth','04-codex','12-themes') else 'OUT_OF_GAME',scenario='real normal knight/aura match' if folder!='12-themes' else 'theme preview',horizontalOverflow=overflow,brokenVisibleImages=missing,result='CAPTURED'))
 (ROOT/('theme-captures.json' if sys.argv[-1]=='themes' else 'journey-captures.json')).write_text(json.dumps(shots,indent=2,ensure_ascii=False))
 print('ACTUAL_SCREENSHOT',name,v,overflow,missing,flush=True)
def responsive(p,name,viewer):
 for w,h in SIZES:
  p.set_viewport_size({'width':w,'height':h});shot(p,'11-responsive',f'{name}-{w}x{h}',viewer)
 p.set_viewport_size({'width':1366,'height':768})
def main(case):
 health=requests.get(be.BASE+'/health',timeout=5).json();assert health['normalGameplay'] and not health['officialRuleTestMode'] and not health['gameIntegrationTestMode']
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox']);contexts=[]
  try:
   c,p=be.page_setup(browser);contexts.append(c);p.emulate_media(reduced_motion='reduce');p.set_viewport_size({'width':1366,'height':768})
   shot(p,'01-landing-auth','title');p.evaluate("showAuth('login')");shot(p,'01-landing-auth','login');p.evaluate("showAuth('register')");shot(p,'01-landing-auth','register')
   be.register(p,'Linh');p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   if case=='themes':
    p.evaluate("go('roles')");p.wait_for_function('page==="roles"&&ROLES.length===97');p.evaluate('chooseRole(25)');shot(p,'04-codex','wheel','authenticated');p.evaluate("setCodexViewMode('grid')");shot(p,'04-codex','grid','authenticated');p.evaluate('chooseRole(74)');shot(p,'04-codex','character-detail','authenticated')
    for theme in p.evaluate('THEME_OPTIONS.map(x=>x[0])'):
     p.evaluate('(t)=>setWolvesTheme(t)',theme);assert p.evaluate('document.body.dataset.theme')==theme;shot(p,'12-themes',theme,'authenticated')
    assert not be.LOGS,be.LOGS;print('S25_THEME_PREVIEWS_PASS',flush=True);return
   host=p;responsive(host,'lobby','authenticated');shot(host,'02-lobby','village-lobby','authenticated')
   c,g=be.page_setup(browser);contexts.append(c);g.emulate_media(reduced_motion='reduce');be.register(g,'Minh');g.wait_for_function('WolvesLive.connectionState==="online"')
   host.evaluate("openVillagePanel('create','well')");shot(host,'03-room','create-room','host');host.locator('#wv-room-name').fill('Làng Ánh Trăng');host.locator('#wv-capacity').fill('2');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   g.evaluate('(id)=>WolvesLive.openRoom(id)',rid);g.wait_for_function('WolvesLive.room?.members.length===2');host.wait_for_function('WolvesLive.room?.members.length===2');responsive(host,'room','host');shot(host,'03-room','waiting-room','host')
   host.get_by_role('button',name='Khóa danh sách').click();g.wait_for_function('WolvesLive.room.status==="LOCKED"');host.locator('#wv-normal-deck').select_option('knight');host.wait_for_function('WolvesLive.room.normalDeck==="knight"&&!WolvesLive.working');g.wait_for_function('WolvesLive.room.normalDeck==="knight"');shot(host,'03-room','configuration','host');g.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.some(m=>m.id!==WolvesLive.profile.id&&m.ready)');host.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.every(m=>m.ready)&&!WolvesLive.working');host.locator('#wv-normal-start').click()
   for x in (host,g):x.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY"&&page==="ingame"',timeout=18000);assert x.evaluate('WolvesLive.game.players.every(x=>x.playerId===WolvesLive.profile.id?!!x.self:!x.self)')
   roles={x.evaluate('WolvesLive.game.players.find(y=>y.playerId===WolvesLive.profile.id).self.currentCharacterId'):x for x in (host,g)};assert set(roles)=={8,25};seer=roles[25];knight=roles[8];seer.set_viewport_size({'width':1366,'height':768});shot(seer,'05-night-gameplay','private-role','self #25');responsive(seer,'night','self #25');shot(seer,'05-night-gameplay','night','self #25')
   tid=knight.evaluate('WolvesLive.profile.id');seer.wait_for_function('!WolvesLive.working');seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);seer.locator('#wv-skill-submit').scroll_into_view_if_needed();shot(seer,'05-night-gameplay','selected-target','self #25');seer.locator('#wv-skill-submit').click();seer.wait_for_function('!WolvesLive.working&&WolvesLive.feedback.size>0');shot(seer,'05-night-gameplay','submitted','self #25')
   host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
   for x in (host,g):x.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"')
   seer.wait_for_function('WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');assert not knight.evaluate('WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');shot(seer,'06-day-gameplay','day-private-result','self #25');seer.locator('#wv-chat-input').fill('Chúng ta cùng thảo luận nhé.');seer.locator('#wv-chat-submit').click();knight.locator('.wv-chat-history').get_by_text('Chúng ta cùng thảo luận nhé.',exact=False).wait_for(timeout=12000);seer.locator('#wv-chat-input').scroll_into_view_if_needed();shot(seer,'07-chat','public-chat','self #25')
   host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();seer.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"&&!WolvesLive.working');seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);seer.get_by_role('button',name='Gửi / đổi phiếu').scroll_into_view_if_needed();shot(seer,'08-voting','voting','self #25');seer.get_by_role('button',name='Gửi / đổi phiếu').click();seer.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=tid);shot(seer,'08-voting','vote-recorded','self #25');host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click()
   for x in (host,g):x.wait_for_function('WolvesLive.game.completed===true',timeout=18000);assert x.evaluate('WolvesLive.game.winnerIds')==[seer.evaluate('WolvesLive.profile.id')]
   seer.locator('.wv-winners').scroll_into_view_if_needed();shot(seer,'09-endgame','victory','self #25');knight.locator('.wv-winners').scroll_into_view_if_needed();shot(knight,'09-endgame','defeat','self #8');assert seer.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified');seer.get_by_role('button',name='Kiểm tra Replay',exact=True).click();seer.wait_for_function('WolvesLive.notice.includes("Lịch sử ván chơi đã được đồng bộ")');shot(seer,'10-replay','replay-verified','self #25');seer.evaluate('WolvesLive.disconnect();WolvesLive.connect()');seer.wait_for_function('WolvesLive.connectionState==="online"&&WolvesLive.game.completed');shot(seer,'10-replay','reconnect','self #25');seer.get_by_role('button',name='Trở về Sảnh',exact=True).click();seer.wait_for_function('page==="rooms"');shot(seer,'02-lobby','return-to-lobby','authenticated');assert not be.LOGS,be.LOGS;print('S25_NORMAL_VISUAL_JOURNEY_PASS',flush=True)
  finally:
   be.close_contexts(contexts);browser.close();be.bridge.shutdown()
if __name__=='__main__':main(sys.argv[-1] if sys.argv[-1] in ('journey','themes') else 'journey')
