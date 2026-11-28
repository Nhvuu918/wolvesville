"""Real SQLite backend: idle socket must deliver game creation and phase revisions.
No mock HTTP or WS; use the same browser transport as inherited suites.
"""
import pathlib,sys,time
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  contexts=[];pages=[]
  try:
   for name in ('IdleHost','IdleGuest'):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,name)
   host,guest=pages
   host.evaluate("openVillagePanel('create','well')")
   host.locator('#wv-room-name').fill('Idle transport regression')
   host.locator('#wv-capacity').fill('2');host.locator('.village-create-form button[type=submit]').click()
   host.wait_for_function('WolvesLive.room?.members?.length===1');rid=host.evaluate('WolvesLive.room.id')
   guest.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   host.wait_for_function('WolvesLive.room?.members?.length===2');guest.wait_for_function('WolvesLive.room?.members?.length===2')
   host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"');guest.wait_for_function('WolvesLive.room.status==="LOCKED"')
   # Exercise the original five-second transport idle timeout, not a synchronization delay.
   guest.wait_for_timeout(6500)
   host.evaluate('WolvesLive.startGame()');host.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=12000)
   game_id=host.evaluate('WolvesLive.gameId')
   server=guest.evaluate('(id)=>WolvesLive.request(`/api/games/${id}`)',game_id)['game']
   print('IDLE_SERVER',server['phase'],server['revision'],'GUEST',guest.evaluate('({phase:WolvesLive.game?.phase??null,revision:WolvesLive.lastRevision,connection:WolvesLive.connectionState})'),flush=True)
   guest.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=12000)
   assert guest.evaluate('WolvesLive.lastRevision')==server['revision']
   host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()')
   host.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"');guest.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"')
   assert host.evaluate('WolvesLive.lastRevision')==guest.evaluate('WolvesLive.lastRevision')
   assert not be.LOGS,be.LOGS
   print('S14_IDLE_TRANSPORT_PASS')
  finally:
   for p in pages:p.evaluate('WolvesLive.disconnect()')
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
