"""Development Normal through real UI, no QA, no role fixture. One compositional
scenario with guard/inspection/bell, actual hanging, reconnect and replay."""
import os,pathlib,sys,requests
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
   def action(p,t,second=None):
    target=t.evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target)
    if second:p.locator('#wv-second-target').select_option(second.evaluate('WolvesLive.profile.id'))
    before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working&&WolvesLive.feedback.size>{before}')
   def advance(phase):
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
    for p in pages:p.wait_for_function(f'WolvesLive.game.phase==="{phase}"',timeout=18000)
   def vote(target=None,voter=None):
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click()
    if target:
     voter.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT" && !WolvesLive.working');tid=target.evaluate('WolvesLive.profile.id');voter.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);voter.get_by_role('button',name='Gửi / đổi phiếu').click();voter.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=tid)
    host.locator('.wv2-voting').wait_for();host.screenshot(path=str(shots/'voting.png'));host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click()
   action(b,a,g);action(g,a);action(a,k);action(k,a);g.screenshot(path=str(shots/'normal-guard-action.png'));advance('DAY_DISCUSS');g.screenshot(path=str(shots/'normal-day.png'));g.get_by_role('button',name='Nhật ký',exact=True).click();g.locator('#wv2-dialog .wv2-journal-group article').first.wait_for();assert g.locator('#wv2-dialog').inner_text().find('Đêm')>=0;g.screenshot(path=str(shots/'journal.png'));g.locator('#wv2-dialog button').click()
   assert a.evaluate('WolvesLive.game.players.find(x=>x.self).self.life==="ALIVE"');assert not b.evaluate('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED")')
   a.wait_for_function('WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');assert not k.evaluate('WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');b.screenshot(path=str(shots/'normal-guard-no-bell.png'))
   print('E2E_STAGE guard-prevention',flush=True);vote()
   for p in pages:p.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"')
   action(k,a);advance('DAY_DISCUSS');a.wait_for_function('WolvesLive.game.players.find(x=>x.self).self.life==="DEAD_FINAL"');b.wait_for_function('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED"&&e.payload.roleName==="Bảo Vệ")');assert not g.evaluate('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED")');b.screenshot(path=str(shots/'normal-bell-private.png'))
   print('E2E_STAGE bell-real-death',flush=True);vote(k,g)
   for p in pages:
    p.wait_for_function('WolvesLive.game.completed===true',timeout=18000);assert set(p.evaluate('WolvesLive.game.winnerIds'))=={q.evaluate('WolvesLive.profile.id') for q in [a,g,b]};assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   g.screenshot(path=str(shots/'normal-endgame.png'));b.evaluate('WolvesLive.disconnect();WolvesLive.connect()');b.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed');assert not be.LOGS,be.LOGS
   career=g.evaluate('async()=> (await WolvesLive.request("/api/social/career?scope=DEVELOPMENT")).career');assert career['matches']==1 and career['wins']==1 and career['roles'][0]['characterId']==31,career;assert g.evaluate('async()=> (await WolvesLive.request("/api/social/career")).career.matches')==0;assert len(career['topPairs'])==3;g.evaluate("go('career')");g.locator('#wvi-career-scope').select_option('DEVELOPMENT');g.get_by_role('button',name='Áp dụng').click();g.wait_for_function('document.querySelector(".wv2-metrics strong")?.textContent==="1"');g.screenshot(path=str(shots/'career.png'));g.set_viewport_size({'width':390,'height':844});g.screenshot(path=str(shots/'career-mobile.png'));g.evaluate("go('ingame')");g.locator('.wv2-stage').wait_for();g.screenshot(path=str(shots/'game-mobile.png'));print('IMMERSIVE02_BROWSER_PASS',flush=True)
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
