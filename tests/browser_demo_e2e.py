"""Browser E2E: click the approved Demo CTA against the actual Sprint03 backend.
If Chromium loopback is blocked in a sandbox, the existing Python HTTP/WS transport
bridge carries real requests to a live backend. It does not fabricate responses.
"""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

ROOT=pathlib.Path(__file__).resolve().parents[1]
def run():
 with sync_playwright() as pw:
  launch={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():launch['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**launch)
  c1,p1=be.page_setup(browser);c2,p2=be.page_setup(browser)
  try:
   for pg in (p1,p2):
    pg.evaluate("showAuth('login')")
    button=pg.locator('#wv-demo-button')
    assert button.count()==1 and button.is_visible()
    button.click()
    pg.wait_for_function('WolvesLive.profile!==null && WolvesLive.profile.isDemo===true',timeout=15000)
    pg.wait_for_function('page==="rooms" && !titleScreenOpen',timeout=15000)
   a=p1.evaluate('WolvesLive.profile');b=p2.evaluate('WolvesLive.profile')
   assert a['id']!=b['id'] and a['publicId']!=b['publicId']
   assert a['publicId'].startswith('WV-') and b['publicId'].startswith('WV-')
   assert p1.evaluate('WolvesLive.token')!=p2.evaluate('WolvesLive.token')
   print('PASS Browser: two real Demo CTA clicks create distinct backend accounts and Lobby sessions')
   p1.evaluate("openVillagePanel('create','well')")
   p1.locator('#wv-room-name').fill('Trăng Bạc Demo')
   p1.locator('#wv-capacity').fill('2')
   p1.get_by_role('button',name='Tạo phòng',exact=True).click()
   p1.wait_for_function('WolvesLive.room!==null',timeout=10000)
   room=p1.evaluate('WolvesLive.room.id')
   p2.evaluate('(id)=>WolvesLive.openRoom(id)',room)
   p2.wait_for_function('WolvesLive.room && WolvesLive.room.members.length===2',timeout=12000)
   p1.wait_for_function('WolvesLive.room && WolvesLive.room.members.length===2',timeout=12000)
   print('PASS Browser: two independent demo sessions create/join same room through real backend')
   p1.wait_for_function('WolvesLive.ws?.readyState===1',timeout=15000)
   p2.wait_for_function('WolvesLive.ws?.readyState===1',timeout=15000)
   assert p1.evaluate('WolvesLive.room.hostId')==a['id']
   print('PASS Browser: authenticated WebSocket connectivity and server-authorized room membership')
   seed=p1.evaluate('Object.fromEntries(["wv_s03_session_token","wv_s03_session_navigation"].map(k=>[k,sessionStorage.getItem(k)]))')
   c3,p3=be.page_setup(browser,seed)
   try:
    p3.wait_for_function('WolvesLive.profile!==null',timeout=15000)
    assert p3.evaluate('WolvesLive.profile.id')==a['id']
    assert p3.evaluate('WolvesLive.profile.isDemo') is True
    print('PASS Browser: fresh document reconnects an existing Demo session without shared credentials')
   finally:be.close_context(c3)
   p2.evaluate('WolvesLive.logout()')
   p2.wait_for_function('WolvesLive.profile===null',timeout=10000)
   assert p1.evaluate('WolvesLive.profile!==null')
   assert p2.evaluate('sessionStorage.getItem("wv_s03_session_token")') is None
   print('PASS Browser: logout removes only the current demo session')
   p1.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   p1.wait_for_function('WolvesLive.ws?.readyState===1',timeout=10000)
   print('PASS Browser: demo WebSocket reconnect')
   p1.screenshot(path=str(ROOT/'reports'/'demo_auth_browser.png'))
   assert not be.LOGS,be.LOGS
  finally:
   be.bridge.shutdown();be.close_context(c1);be.close_context(c2);browser.close()
if __name__=='__main__':
 try:run()
 except Exception as ex:
  print('DEMO_BROWSER_E2E_FAILED',repr(ex));sys.exit(1)
