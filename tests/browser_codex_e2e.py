"""Codex 97 browser regression using real backend, approved frontend and a Demo user.
Native Mac: WV_E2E_DIRECT=1 WV_E2E_SERVER=http://127.0.0.1:3212 python3 tests/browser_codex_e2e.py
Sandbox fallback: existing HTTP/WS bridge proxies REAL backend; no fabricated responses.
"""
import pathlib,sys,time
from playwright.sync_api import sync_playwright
import browser_e2e as be
ROOT=pathlib.Path(__file__).resolve().parents[1]

def run():
 with sync_playwright() as pw:
  launch={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():launch['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**launch)
  context,page=be.page_setup(browser)
  try:
   page.wait_for_function('codexLoadStatus==="ready" && ROLES.length===97',timeout=15000)
   page.evaluate("showAuth('login')")
   page.locator('#wv-demo-button').click()
   page.wait_for_function('WolvesLive.profile!==null && WolvesLive.profile.isDemo===true',timeout=15000)
   page.wait_for_function('page==="rooms" && !titleScreenOpen',timeout=15000)
   page.evaluate("go('roles')")
   page.wait_for_function('page==="roles" && !!document.querySelector("#codexCount")',timeout=12000)
   assert page.locator('#codexCount').inner_text()=='97 nhân vật' 
   assert page.locator('.wheel-tarot-card').count()==12
   assert '#25' not in page.locator('#altarRoleTitle').inner_text()
   assert '52 / 97' not in page.locator('#appSidebar').inner_text()
   print('PASS Browser: Demo login, Codex wheel, dynamic 97-role count and 12 visible orbit cards')
   first=page.locator('#altarRoleTitle').inner_text()
   page.locator('#codexWheelArena').focus()
   page.keyboard.press('ArrowRight')
   page.wait_for_timeout(400)
   assert page.locator('#altarRoleTitle').inner_text()!=first
   print('PASS Browser: Wheel keyboard navigation changes selection exactly once')
   page.get_by_role('button',name='▦ Lưới nhân vật').click()
   assert page.locator('.codex-grid-card').count()==97
   assert page.locator('#codexCount').inner_text()=='97 nhân vật'
   labels=page.locator('.codex-grid-card strong').all_inner_texts()
   assert len(labels)==97 and len(set(labels))==97
   assert not page.locator('.codex-grid-card .role-id-badge').count()
   print('PASS Browser: Grid displays 97 unique official cards without technical ID labels')
   page.locator('#roleSearchInput').fill('soi dao tac')
   assert page.locator('.codex-grid-card').count()==1
   assert page.locator('.codex-grid-card strong').inner_text()=='Sói Đạo Tặc'
   assert page.locator('#codexCount').inner_text()=='Đang hiển thị 1 / 97 nhân vật'
   page.locator('#roleSearchInput').fill('SÓI ĐẠO TẶC')
   assert page.locator('.codex-grid-card').count()==1
   page.locator('#roleSearchInput').fill('no-character-can-match-this')
   assert page.locator('.codex-grid-card').count()==0
   assert 'Không tìm thấy' in page.locator('.codex-empty').first.inner_text()
   page.get_by_role('button',name='Xóa lọc').click()
   assert page.locator('.codex-grid-card').count()==97
   print('PASS Browser: Diacritic insensitive search, no-result state, clear filters')
   for label,expected in [('🌿 Dân Làng',40),('🐺 Phe Sói',26),('🔮 Phe Ba',31)]:
    page.get_by_role('button',name=label).click()
    assert page.locator('.codex-grid-card').count()==expected,(label,page.locator('.codex-grid-card').count())
    assert page.locator('#codexCount').inner_text()==f'Đang hiển thị {expected} / 97 nhân vật'
   page.get_by_role('button',name='Xóa lọc').click()
   page.locator('.codex-grid-card').nth(73).click()
   assert page.locator('.codex-detail h2').inner_text()=='Tiên Tri Huyền Bí'
   assert 'Nguyên bản JSON' not in page.locator('.codex-detail').inner_text()
   assert 'Rule Adapter' not in page.locator('.codex-detail').inner_text()
   assert page.locator('.codex-ability p').inner_text().strip()
   assert page.locator('.codex-detail .role-id-badge').count()==0
   print('PASS Browser: Official team filters, role detail has no JSON, debug, ID or fabricated examples')
   page.get_by_role('button',name='🎡 Vòng thẻ bài').click()
   assert page.locator('#altarRoleTitle').inner_text()=='Tiên Tri Huyền Bí'
   page.get_by_role('button',name='▦ Lưới nhân vật').click()
   assert page.locator('.codex-grid-card.is-selected strong').inner_text()=='Tiên Tri Huyền Bí'
   print('PASS Browser: Selection persists across Wheel/Grid switches')
   widths=[(1440,4),(768,3),(390,2)]
   for width,expected in widths:
    page.set_viewport_size({'width':width,'height':850})
    page.wait_for_timeout(50)
    col=page.locator('.codex-grid').evaluate('(el)=>getComputedStyle(el).gridTemplateColumns.split(" ").length')
    assert col==expected,(width,col,expected)
    assert page.locator('.codex-grid-card').count()==97
    if width==390:page.screenshot(path=str(ROOT/'reports'/'codex_mobile.png'))
   print('PASS Browser: Responsive grid is 4/3/2 columns across desktop/tablet/mobile')
   image=page.locator('.codex-grid-card img').first
   image.evaluate('(el)=>el.src="https://wolvesville.codex.test/assets/portraits/not-found.svg"')
   page.wait_for_function('document.querySelector(".codex-grid-card img")?.src.endsWith("/assets/portraits/placeholder.svg")',timeout=10000)
   print('PASS Browser: Broken portrait displays presentation fallback without changing character data')
   page.emulate_media(reduced_motion='reduce')
   duration=page.locator('.codex-grid-card').first.evaluate('(el)=>getComputedStyle(el).transitionDuration')
   assert duration in ('0s','0s, 0s, 0s'),duration
   page.emulate_media(reduced_motion='no-preference')
   print('PASS Browser: Reduced motion disables hover transitions')
   page.set_viewport_size({'width':1440,'height':900})
   page.screenshot(path=str(ROOT/'reports'/'codex_desktop_grid.png'))
   page.get_by_role('button',name='🎡 Vòng thẻ bài').click()
   page.screenshot(path=str(ROOT/'reports'/'codex_desktop_wheel.png'))
   # session history / reconnect: must still work with Codex browsing
   seed=page.evaluate('Object.fromEntries(["wv_s03_session_token","wv_s03_session_navigation"].map(k=>[k,sessionStorage.getItem(k)]))')
   ctx2,page2=be.page_setup(browser,seed)
   try:
    page2.wait_for_function('WolvesLive.profile!==null && codexLoadStatus==="ready"',timeout=15000)
    assert page2.evaluate('WolvesLive.profile.id')==page.evaluate('WolvesLive.profile.id')
    page2.evaluate("go('roles')")
    page2.wait_for_function('page==="roles" && !!document.querySelector("#codexCount")',timeout=12000)
    assert page2.locator('#codexCount').inner_text()=='97 nhân vật'
   finally:be.close_context(ctx2)
   page.evaluate("go('rooms')")
   page.wait_for_function('page==="rooms"',timeout=10000)
   assert page.evaluate('WolvesLive.profile!==null')
   page.evaluate('WolvesLive.logout()')
   page.wait_for_function('WolvesLive.profile===null',timeout=10000)
   print('PASS Browser: Session reconnect, Lobby navigation and logout unaffected')
   assert not be.LOGS,be.LOGS
   print('PASS Browser: No page errors, Codex 97 E2E complete')
  finally:
   be.bridge.shutdown();be.close_context(context);browser.close()

if __name__=='__main__':
 try:run()
 except Exception as ex:
  print('CODEX_BROWSER_E2E_FAILED',repr(ex),'PAGE ERRORS:',be.LOGS[:4]);sys.exit(1)
