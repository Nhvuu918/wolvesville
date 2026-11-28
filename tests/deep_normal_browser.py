"""Shared real-browser journey for registry-driven normal decks."""
import pathlib,sys,requests
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(deck,ids,side):
 h=requests.get(be.BASE+'/health',timeout=5).json();assert h['normalGameplay'] and not h['officialRuleTestMode'] and not h['gameIntegrationTestMode']
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(len(ids)):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'DeepRoom'+str(i));p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Deep normal');host.locator('#wv-capacity').fill(str(len(ids)));host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   for p in pages:p.wait_for_function(f'WolvesLive.room?.members.length==={len(ids)} && WolvesLive.room.members.every(m=>m.online)')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option(deck)
   for p in pages:p.wait_for_function('(deck)=>WolvesLive.room.normalDeck===deck && !WolvesLive.working',arg=deck)
   assert host.locator('#wv-normal-start').is_disabled()
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working');pid=p.evaluate('WolvesLive.profile.id')
    for q in pages:q.wait_for_function('(id)=>WolvesLive.room.members.find(m=>m.id===id).ready',arg=pid)
   host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.ruleVersion==="wolvesville-official-v1.3.3" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert set(roles)==set(ids);enemy=48 if 48 in ids else 8;villagers=[r for r in ids if r!=enemy]
   def pid(r):return roles[r].evaluate('WolvesLive.profile.id')
   def action(r,t,second=None):
    p=roles[r];p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid(t))
    if second is not None:p.locator('#wv-second-target').select_option(pid(second))
    before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working&&WolvesLive.feedback.size>{before}')
   def advance():
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
    for p in pages:p.wait_for_function('WolvesLive.game.phase!=="NIGHT_COLLECT" || WolvesLive.game.completed')
   def vote(target=None):
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click()
    for p in pages:p.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"')
    if target is not None:
     p=roles[villagers[0]];p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid(target));p.get_by_role('button',name='Gửi / đổi phiếu').click();p.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=pid(target))
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click()
    for p in pages:p.wait_for_function('WolvesLive.game.phase!=="DAY_VOTE_COLLECT" || WolvesLive.game.completed')
   for p in pages:assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length===1')
   for r in [25,74]:
    if r in ids:action(r,enemy)
   if 9 in ids:action(9,9);action(enemy,9)
   advance();assert host.evaluate('WolvesLive.game.players.every(p=>!p.publicReportedDead)')
   for r,event in [(25,'SEER_AURA_OBSERVED'),(74,'ROLE_OBSERVED')]:
    if r not in ids:continue
    roles[r].wait_for_function('(t)=>WolvesLive.events.some(e=>e.eventType===t)',arg=event)
    for q in pages:
     if q!=roles[r]:assert not q.evaluate('(t)=>WolvesLive.events.some(e=>e.eventType===t)',event)
   p=roles[villagers[0]];p.locator('#wv-chat-input').fill('Deep normal chat');p.locator('#wv-chat-submit').click();roles[enemy].locator('.wv-chat-history').get_by_text('Deep normal chat',exact=False).wait_for(timeout=15000)
   vote(enemy if side=='village' else None)
   if side=='enemy':
    for _ in range(4):
     if host.evaluate('WolvesLive.game.completed'):break
     live=[r for r in villagers if not host.evaluate('(id)=>WolvesLive.game.players.find(p=>p.playerId===id).publicReportedDead',pid(r))]
     action(enemy,live[0],live[1] if enemy==48 and len(live)>1 else None);advance()
     if not host.evaluate('WolvesLive.game.completed'):vote()
   winners={pid(r) for r in (villagers if side=='village' else [enemy])}
   for p in pages:
    p.wait_for_function('WolvesLive.game.completed===true',timeout=18000);assert set(p.evaluate('WolvesLive.game.winnerIds'))==winners;assert p.locator('.wv-winners').count()==1;assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   pages[-1].evaluate('WolvesLive.disconnect();WolvesLive.connect()');pages[-1].wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed');assert not be.LOGS,be.LOGS
   print('DEEP_NORMAL_BROWSER_PASS',deck,side,flush=True)
  finally:
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
