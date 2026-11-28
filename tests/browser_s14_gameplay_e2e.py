"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  def scenario(deck,expected,fn):
   contexts=[];pages=[]
   try:
    for i in range(len(expected)):
     c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S14'+deck.replace('-','')+str(i))
    host=pages[0];host.evaluate("openVillagePanel('create','well')")
    host.locator('#wv-room-name').fill('S14 gameplay');host.locator('#wv-capacity').fill(str(len(expected)));host.locator('.village-create-form button[type=submit]').click()
    host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000);rid=host.evaluate('WolvesLive.room.id')
    for i,p in enumerate(pages[1:],2):
     p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
    host.wait_for_function(f'WolvesLive.room?.members?.length==={len(expected)}',timeout=12000)
    host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"')
    host.evaluate("openVillagePanel('live-room','directory')");host.locator('#wv-test-deck').select_option(deck);host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
    for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=18000)
    roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert sorted(roles)==sorted(expected),roles
    def action(role,target):
     p=roles[role];pid=roles[target].evaluate('WolvesLive.profile.id');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid);p.locator('#wv-skill-submit').click();p.wait_for_function('!WolvesLive.working && WolvesLive.feedback.size>=1',timeout=15000)
    def resolve(phase):
     host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()')
     for p in pages:p.wait_for_function(f'WolvesLive.game?.phase==="{phase}"',timeout=18000)
    fn(roles,action,resolve)
    for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   finally:
    for p in pages:
     try:p.evaluate('WolvesLive.disconnect()')
     except Exception:pass
    for c in contexts:be.close_context(c)
  def chat(roles,action,resolve):
   action(84,25);resolve('DAY_DISCUSS');witch,seer=roles[84],roles[25]
   seer.get_by_text('Bạn đang bị câm trong chat công khai.').wait_for(timeout=12000)
   # Owner-approved S15 UX keeps the composer visible while muted; both controls must remain disabled.
   assert seer.locator('#wv-chat-input').count()==1 and seer.locator('#wv-chat-input').is_disabled()
   assert seer.locator('#wv-chat-submit').count()==1 and seer.locator('#wv-chat-submit').is_disabled()
   witch.locator('#wv-chat-input').fill('Xin chào làng Sprint 14');witch.get_by_role('button',name='Gửi tin nhắn').click()
   seer.get_by_text('Xin chào làng Sprint 14',exact=False).wait_for(timeout=15000)
   assert seer.evaluate('WolvesLive.game.chat.muted && !WolvesLive.game.chat.canSend')
   seer.evaluate('WolvesLive.disconnect();WolvesLive.connect()');seer.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.chat.muted',timeout=15000)
   seer.set_viewport_size({'width':390,'height':844});assert seer.locator('.wv-public-chat').count()==1
  def shield(roles,action,resolve):
   roles[36].get_by_text('Lượt còn lại: 2',exact=True).wait_for(timeout=12000)
   action(23,25);action(36,25);resolve('DAY_DISCUSS')
   for p in roles.values():
    assert p.evaluate('WolvesLive.game.players.every(x=>!x.publicReportedDead)')
    e=p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/events`)).events')
    assert not any(x['eventType'] in ['OFFICIAL_ATTACK_BLOCKED','S13_OFFICIAL_EFFECT_APPLIED'] for x in e)
  def death(roles,action,resolve):
   action(68,25);action(8,68);resolve('GAME_COMPLETED')
   winner=roles[8].evaluate('WolvesLive.profile.id')
   for p in roles.values():assert p.evaluate('WolvesLive.game.winnerIds')==[winner]
  try:
   scenario('s14-silence',[25,84],chat)
   scenario('s14-fire-shield',[23,25,36],shield)
   scenario('s14-young',[8,25,68],death)
   assert not be.LOGS,be.LOGS[:10]
   print('S14_BROWSER_PASS public chat mute, reconnect, mobile viewport, protection, private events, death chain, victory, replay')
  finally:browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
