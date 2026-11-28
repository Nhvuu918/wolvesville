"""Positive group chat DOM/transport with a trusted persisted grant fixture.
No mocked network, no fake UI, no claim of actual recruitment or Normal Gameplay.
"""
import json,pathlib,subprocess,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(5):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S24GROUP'+str(i))
   host=pages[0];host.evaluate("openVillagePanel('create','well')")
   host.locator('#wv-room-name').fill('S24 ACL transport fixture');host.locator('#wv-capacity').fill('5');host.locator('.village-create-form button[type=submit]').click()
   host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000);rid=host.evaluate('WolvesLive.room.id')
   for i,p in enumerate(pages[1:],2):
    p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
   host.wait_for_function('WolvesLive.room?.members?.length===5');host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"')
   fixture=subprocess.run(['node','tests/fixtures/s24-group-archive.mjs',rid],capture_output=True,text=True,check=True);gid=json.loads(fixture.stdout.strip())['gameId']
   for p in pages:
    p.evaluate('(id)=>WolvesLive.loadGame(id)',gid);p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS" && page==="ingame"')
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages}
   assert sorted(roles)==[25,28,74,84,90]
   member=roles[25];owner=roles[90];outsider=roles[74]
   member.locator('#wv-system-group-chat').wait_for();owner.locator('#wv-system-group-chat').wait_for();assert outsider.locator('#wv-system-group-chat').count()==0
   assert member.locator('#wv-chat-input').is_disabled();assert member.locator('#wv-group-input').is_enabled()
   member.locator('#wv-group-input').fill('S24 group only');member.locator('#wv-system-group-chat button[type=submit]').click()
   owner.locator('#wv-system-group-chat').get_by_text('S24 group only',exact=False).wait_for(timeout=15000)
   assert member.locator('#wv-in-match-chat').get_by_text('S24 group only',exact=False).count()==0
   assert outsider.evaluate('!WolvesLive.events.some(e=>e.payload?.text==="S24 group only")')
   member.evaluate('WolvesLive.disconnect();WolvesLive.connect()');member.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.groupChat?.[0]?.canSend===true')
   member.locator('#wv-system-group-chat').get_by_text('S24 group only',exact=False).wait_for(timeout=15000)
   for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   assert not be.LOGS,be.LOGS[:10];print('S24_GROUP_TRANSPORT_FIXTURE_BROWSER_PASS',flush=True)
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
