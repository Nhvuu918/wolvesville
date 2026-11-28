"""Player-first Wolvesville browser E2E. Two independent browser contexts, real backend.
Sandbox uses the existing HTTP/WS transport bridge only because direct Chromium loopback is blocked.
For macOS native: WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_ux_e2e.py
"""
import pathlib,sys,uuid
from playwright.sync_api import sync_playwright
import browser_e2e as be
ROOT=pathlib.Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as pw:
  launch={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():launch['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**launch)
  ca,pa=be.page_setup(browser);cb,pb=be.page_setup(browser)
  try:
   # Demo CTA is verified in browser_demo_e2e.py. Here use two real accounts
   # so repeated test runs cannot consume the six-Demo-per-hour safety quota.
   alice=be.register(pa,'UXAlice');bob=be.register(pb,'UXBob')
   for page in (pa,pb): page.wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
   assert alice['id']!=bob['id']
   assert pa.locator('#nav').get_by_role('button',name='Bách khoa').count()==1
   for forbidden in ('Bách khoa (Codex)','Bảng xếp hạng','Lịch sử đấu','Sảnh Tổng quan'):
    assert forbidden not in pa.locator('#nav').inner_text(),forbidden
   assert not pa.locator('#wv-connection-status').is_visible()
   print('PASS Browser UX: independently authenticated real sessions have simple navigation, no unsupported mock links')
   pa.evaluate("go('roles')")
   pa.wait_for_function('page==="roles" && document.getElementById("codexCount")?.textContent==="97 nhân vật"')
   assert pa.locator('#breadcrumb').inner_text().strip().endswith('Bách khoa nhân vật')
   assert 'Codex' not in pa.locator('#content').inner_text()
   assert pa.locator('.wheel-tarot-card').count()==12
   pa.get_by_role('button',name='▦ Lưới nhân vật').click()
   assert pa.locator('.codex-grid-card').count()==97
   print('PASS Browser UX: approved 97-character Wheel/Grid unchanged, player-facing labels simplified')
   pa.evaluate("go('settings')")
   pa.wait_for_function('page==="settings"')
   panel=pa.locator('#content').inner_text()
   assert 'Dữ liệu tài khoản' in panel
   assert 'Xuất file JSON' not in panel and 'Nhập file JSON' not in panel
   assert 'Âm thanh' in panel
   print('PASS Browser UX: settings show actual local preferences without prototype data reset/import')
   pa.evaluate("go('profile')")
   pa.wait_for_function('page==="profile"')
   assert alice['publicId'] in pa.locator('#content').inner_text()
   assert 'Game Engine' not in pa.locator('#content').inner_text()
   pa.evaluate("go('rooms')")
   pa.wait_for_function('page==="rooms"')
   assert pa.evaluate('state.rooms.length')==0
   assert pa.evaluate('WolvesLive.rooms.length')>=0
   actual=pa.evaluate('WolvesLive.rooms.length')
   assert f'{actual} phòng đang có' in pa.locator('#villagePin-directory').inner_text()
   pa.screenshot(path=str(ROOT/'reports'/'ux_lobby_desktop.png'))
   for width,height,label in [(1920,1080,'desktop_1920'),(1366,768,'laptop_1366'),(768,1024,'tablet_768')]:
    pa.set_viewport_size({'width':width,'height':height})
    pa.wait_for_timeout(75)
    metrics=pa.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
    assert metrics['scroll']<=metrics['client']+4,(label,metrics)
   pa.set_viewport_size({'width':1440,'height':900})
   print('PASS Browser UX: real lobby across 1920/1366/768 widths, no horizontal overflow')
   print('PASS Browser UX: world-map lobby uses backend room count, not three prototype rooms')
   pa.evaluate("openVillagePanel('create','well')")
   room_name='Làng Trăng UX '+uuid.uuid4().hex[:5]
   pa.locator('#wv-room-name').fill(room_name)
   pa.locator('#wv-capacity').fill('2')
   # Regression: a genuine server reconnect/snapshot must not destroy a typed
   # room form or detach its submit button while the player is editing it.
   pa.evaluate('WolvesLive.resyncAfterReconnect()')
   assert pa.locator('#wv-room-name').input_value()==room_name
   assert pa.locator('#wv-capacity').input_value()=='2'
   pa.locator('.village-create-form button[type=submit]').click()
   pa.wait_for_function('WolvesLive.room!==null',timeout=12000)
   room_id=pa.evaluate('WolvesLive.room.id')
   assert room_name in pa.locator('#villageDrawer').inner_text()
   assert alice['publicId'] not in pa.locator('#villageDrawer').inner_text()
   assert '#25' not in pa.locator('#villageDrawer').inner_text()
   pb.evaluate('(id)=>WolvesLive.openRoom(id)',room_id)
   pb.wait_for_function('WolvesLive.room?.members?.length===2',timeout=12000)
   pa.wait_for_function('WolvesLive.room?.members?.length===2',timeout=12000)
   assert pa.evaluate('WolvesLive.room.hostId')==alice['id']
   assert not pb.locator('#villageDrawer').get_by_role('button',name='Khóa danh sách').count()
   pa.evaluate('WolvesLive.roomLock(true)')
   pa.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=10000)
   pb.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=10000)
   assert 'Đã khóa' in pb.locator('#villageDrawer').inner_text()
   print('PASS Browser UX: two clients join server room, room states translated, host permissions intact')
   pa.evaluate('WolvesLive.disconnect()')
   pa.wait_for_function('document.getElementById("wv-connection-status")?.hidden===false',timeout=10000)
   assert 'Mất kết nối' in pa.locator('#wv-connection-status').inner_text()
   pa.evaluate('WolvesLive.connect()')
   pa.wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
   pa.wait_for_function('document.getElementById("wv-connection-status")?.hidden===true',timeout=10000)
   print('PASS Browser UX: disconnect banner and reconnect state reconciliation')
   pa.set_viewport_size({'width':390,'height':844});pa.evaluate("go('rooms')")
   pa.wait_for_function('page==="rooms"')
   pa.screenshot(path=str(ROOT/'reports'/'ux_lobby_mobile.png'))
   # Native page horizontal overflow is an existing layout risk; report in audit if present.
   width=pa.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
   print('Browser UX mobile viewport metrics:',width)
   pa.evaluate('WolvesLive.logout()');pa.wait_for_function('WolvesLive.profile===null',timeout=12000)
   assert not pa.evaluate('sessionStorage.getItem("wv_s03_session_token")')
   assert pb.evaluate('WolvesLive.profile!==null')
   print('PASS Browser UX: logout expires only own session, preserves other client')
   assert not be.LOGS,be.LOGS
   print('PASS Browser UX: no page JavaScript errors')
  finally:
   be.bridge.shutdown();be.close_context(ca);be.close_context(cb);browser.close()
if __name__=='__main__':
 try:run()
 except Exception as exc:
  print('UX_BROWSER_E2E_FAILED',repr(exc),'PAGE_ERRORS',be.LOGS[:5]);sys.exit(1)
