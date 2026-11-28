"""Sprint 13: real 3-browser, real backend skill choice and private shield adjudication."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(3):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S13Role'+str(i))
   host=pages[0];host.evaluate("openVillagePanel('create','well')")
   host.locator('#wv-room-name').fill('S13 skill integration');host.locator('#wv-capacity').fill('3')
   host.locator('.village-create-form button[type=submit]').click()
   host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   roomid=host.evaluate('WolvesLive.room.id')
   for i,p in enumerate(pages[1:],2):
    p.evaluate('(id)=>WolvesLive.openRoom(id)',roomid)
    p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
   host.wait_for_function('WolvesLive.room?.members?.length===3')
   host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"')
   host.evaluate("openVillagePanel('live-room','directory')")
   host.locator('#wv-test-deck').select_option('s13-antidote')
   host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages}
   assert sorted(roles)==[8,16,25]
   witch,knight,seer=roles[16],roles[8],roles[25]
   victim=seer.evaluate('WolvesLive.profile.id')
   witch.wait_for_selector('#wv-skill-choice')
   choices=witch.locator('#wv-skill-choice option').all_text_contents()
   assert len(choices)==2,choices
   witch.locator('#wv-skill-choice').select_option('official.16.antidote')
   assert witch.evaluate('WolvesLive.selectedSkill')=='official.16.antidote'
   for p in (witch,knight):
    p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',victim)
    p.evaluate('WolvesLive.submitSkill()')
    p.wait_for_function('!WolvesLive.working && WolvesLive.feedback.size===1',timeout=18000)
   host.wait_for_function('!WolvesLive.working')
   host.evaluate('WolvesLive.resolve()')
   for p in pages:
    p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=18000)
    assert p.evaluate('WolvesLive.game.players.every(x=>!x.publicReportedDead)')
    e=p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/events`)).events')
    assert not any(event['eventType'] in ('OFFICIAL_ATTACK_BLOCKED','S13_OFFICIAL_EFFECT_APPLIED') for event in e)
    assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   assert not be.LOGS,be.LOGS[:5]
   print('S13_BROWSER_PASS role selection, two available skill choices, shielded attack, private ACL, replay')
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
