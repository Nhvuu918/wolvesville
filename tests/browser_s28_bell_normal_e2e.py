"""Four real human contexts, normal flags off, no role forcing."""
import pathlib,sys,requests,os
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(side):
 deck="s28-bell-"+side
 h=requests.get(be.BASE+'/health',timeout=5).json();assert h['normalGameplay'] and not h['officialRuleTestMode'] and not h['gameIntegrationTestMode']
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(4):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'BellRoom'+str(i));p.emulate_media(reduced_motion='reduce');p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Bốn người');host.locator('#wv-capacity').fill('4');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   for p in pages:p.wait_for_function('WolvesLive.room?.members.length===4 && WolvesLive.room.members.every(m=>m.online)')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option(deck)
   for p in pages:p.wait_for_function('(d)=>WolvesLive.room.normalDeck===d && !WolvesLive.working',arg=deck)
   assert host.locator('#wv-normal-start').is_disabled();assert 'sẵn sàng' in host.locator('#wv-start-reason').inner_text()
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
    pid=p.evaluate('WolvesLive.profile.id')
    for q in pages:q.wait_for_function('(id)=>WolvesLive.room.members.find(m=>m.id===id).ready',arg=pid)
   host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.ruleVersion==="wolvesville-official-v1.3.3" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.self).self.currentCharacterId'):p for p in pages}
   assert set(roles)==set({'leader':[25,48,64,74],'linked':[15,25,64,74],'revival':[8,25,26,64]}[side])
   b=roles[64]
   def pid(r):return roles[r].evaluate('WolvesLive.profile.id')
   def action(r,t,second=None):
    p=roles[r];p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid(t))
    if second:p.locator('#wv-second-target').select_option(pid(second))
    before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working&&WolvesLive.feedback.size>{before}')
   def phase(name):
    for p in pages:p.wait_for_function('(ph)=>WolvesLive.game.phase===ph&&!WolvesLive.working',arg=name)
   def night(end='DAY_DISCUSS'):
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click();phase(end)
   def day(target=None,end='NIGHT_COLLECT'):
    host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();phase('DAY_VOTE_COLLECT')
    if target:
     b.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid(target));b.get_by_role('button',name='Gửi / đổi phiếu').click();b.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=pid(target))
    host.get_by_role('button',name='Khóa phiếu và xét kết quả').click();phase(end)
   def observe(n):
    b.wait_for_function('(n)=>WolvesLive.events.filter(e=>e.eventType==="S15_SCALE_BELL_OBSERVED").length===n',arg=n)
    for p in pages:
     if p!=b:assert not p.evaluate('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED")')
   shots=pathlib.Path(os.environ.get('WV_SCREENSHOT_DIR','reports/v1.8.0-development/screenshots'));shots.mkdir(parents=True,exist_ok=True)
   def snap(name):b.wait_for_function('page==="ingame"&&!titleScreenOpen');b.screenshot(path=str(shots/('bell-'+side+'-'+name+'.png')))
   if side=='leader':
    action(64,25,74);snap('pair');action(48,25,74);night('GAME_COMPLETED');observe(2);win=[48]
   elif side=='linked':
    action(64,25,74);snap('pair');action(15,25,74);night();observe(0);day(25);observe(2);snap('observed');night();day(15,'GAME_COMPLETED');win=[25,64,74]
   else:
    action(8,25);night();day();action(26,25);night();day();action(64,25,26);snap('pair');action(8,25);night();observe(1);snap('observed');day(8,'GAME_COMPLETED');win=[25,26,64]
   for p in pages:
    assert set(p.evaluate('WolvesLive.game.winnerIds'))=={pid(r) for r in win};assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   snap('endgame');b.evaluate('WolvesLive.disconnect();WolvesLive.connect()');b.wait_for_function('WolvesLive.connectionState==="online"&&WolvesLive.game.completed');assert not be.LOGS,be.LOGS;print('S28_BELL_NORMAL_BROWSER_PASS',side,flush=True)
  finally:
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run(sys.argv[1])
