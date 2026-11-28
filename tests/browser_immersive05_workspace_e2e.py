"""Actual HTTP/WS game, account-level alerts and private saved deck collection."""
import os,pathlib
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 shots=pathlib.Path(os.environ['WV_SCREENSHOT_DIR']);shots.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as pw:
  opts={'headless':True,'args':['--no-sandbox']}
  if pathlib.Path('/usr/bin/chromium').exists():opts['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**opts);contexts=[];pages=[]
  def new():
   c,p=be.page_setup(browser);contexts.append(c);pages.append(p);return p
  def shot(p,n):p.screenshot(path=str(shots/(n+'.png')))
  try:
   host,guest=new(),new();be.register(host,'WorkspaceA');be.register(guest,'WorkspaceB');host.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"');guest.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"');username=host.locator('#authUser').input_value();aid=host.evaluate('WolvesLive.profile.id');bid=guest.evaluate('WolvesLive.profile.id')
   host.evaluate("go('settings')");host.locator('#settingsThemeSelect').select_option('sage');host.wait_for_function('async()=> (await WolvesLive.request("/api/social/preferences")).settings.theme==="sage"');host.evaluate("go('rooms')");host.wait_for_function("page==='rooms'");host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Hội đồng định mệnh');host.locator('#wv-capacity').fill('2');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   host.evaluate('(id)=>WolvesLive.request("/api/social/relationship","POST",{target:id,action:"request"})',bid);guest.evaluate('(id)=>WolvesLive.request("/api/social/relationship","POST",{target:id,action:"accept"})',aid)
   guest.evaluate("go('feed')");guest.wait_for_function("page==='feed'");host.evaluate("go('career')");host.wait_for_function("page==='career'");host.evaluate('([id,r])=>WolvesLive.request("/api/social/invite","POST",{target:id,roomId:r})',[bid,rid]);guest.locator('#wv5-alerts').get_by_text('LỜI MỜI VÀO PHÒNG',exact=True).wait_for();shot(guest,'global-invite-feed');guest.locator('#wv5-alerts').get_by_role('button',name='Chấp nhận',exact=True).click();host.locator('#wv5-alerts').get_by_text('PHÒNG ĐÃ ĐỦ NGƯỜI!',exact=True).wait_for();assert host.evaluate('page')=='career';shot(host,'global-full-career');host.locator('#wv5-alerts').get_by_role('button',name='Quay lại phòng').click();host.get_by_role('button',name='Khóa danh sách').click();host.wait_for_function('WolvesLive.room.status==="LOCKED"');host.get_by_role('button',name='✦ Tùy chỉnh bộ vai / Bộ vai của tôi').click();host.locator('.wv5-deck-dialog').wait_for();host.locator('#wv5-search').fill('Kỵ Sĩ Không Đầu');host.locator('#wv5-library').get_by_role('button',name='Thêm Kỵ Sĩ Không Đầu').click();host.locator('#wv5-search').fill('Tiên Tri');host.locator('#wv5-library').get_by_role('button',name='Thêm Tiên Tri',exact=True).click();host.locator('input[name="name"]').fill('Bộ vai tự dựng');host.locator('.wv5-check').get_by_text('Tổ hợp được hỗ trợ',exact=True).wait_for();shot(host,'custom-deck');host.locator('#wv5-library').get_by_role('button',name='Thêm Tiên Tri',exact=True).click();host.locator('.wv5-check').get_by_text('Bản nháp — chưa thể bắt đầu').wait_for();shot(host,'invalid-deck');host.locator('.wv5-selected').get_by_role('button',name='Giảm Tiên Tri').click();host.locator('.wv5-deck-dialog').get_by_role('button',name='Lưu bộ vai',exact=True).click();host.get_by_text('Đã lưu vào tài khoản.',exact=True).wait_for();shot(host,'saved-deck');host.locator('.wv5-deck-dialog').get_by_role('button',name='Áp dụng vào phòng').click()
   for p in [host,guest]:p.wait_for_function('WolvesLive.room.normalDeck==="knight"');p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
   host.wait_for_function('WolvesLive.room.members.every(m=>m.ready)');host.locator('#wv-normal-start').click()
   for p in [host,guest]:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && page==="ingame"')
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.self).self.currentCharacterId'):p for p in [host,guest]};k,a=roles[8],roles[25]
   for p,t in [(a,k),(k,a)]:
    p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',t.evaluate('WolvesLive.profile.id'));p.locator('#wv-skill-submit').click();p.wait_for_function('!WolvesLive.working')
   host.evaluate("go('career')");host.locator('#wv5-alerts').get_by_text('TẤT CẢ ĐÃ XÁC NHẬN!',exact=True).wait_for();shot(host,'moderator-outside-room');host.locator('#wv5-alerts').get_by_role('button',name='Tiếp tục trận đấu').click();host.locator('.wv4-confirm').wait_for();host.locator('.wv4-confirm').click()
   for p in [host,guest]:p.wait_for_function('WolvesLive.game.completed===true')
   host.evaluate("go('profile')");host.locator('#wv5-profile-career').wait_for();shot(host,'profile-after-match');xp=host.evaluate('async()=> (await WolvesLive.request("/api/social/progression")).progression.totalXp');assert xp in [200,460]
   host.evaluate('WolvesLive.logout()');fresh=new();fresh.evaluate("showAuth('login')");fresh.locator('#authUser').fill(username);fresh.locator('#authPass').fill('BrowserTestSecure_1234');fresh.locator('#authSubmit').click();fresh.wait_for_function('WolvesLive.profile && WolvesLive.connectionState==="online"');fresh.wait_for_function('document.body.dataset.theme==="sage"');assert fresh.evaluate('WolvesLive.profile.id')==aid;assert fresh.evaluate('async()=> (await WolvesLive.request("/api/social/progression")).progression.totalXp')==xp;fresh.evaluate("go('profile')");fresh.locator('#wv5-profile-career').wait_for();fresh.get_by_role('button',name='Bộ vai của tôi',exact=True).click();fresh.locator('#wv5-saved').wait_for();fresh.locator('#wv5-saved').select_option(label='Bộ vai tự dựng · 2 vai');fresh.locator('.wv5-check').get_by_text('Tổ hợp được hỗ trợ').wait_for();shot(fresh,'cross-device-deck');fresh.set_viewport_size({'width':390,'height':844});shot(fresh,'mobile-deck');assert not be.LOGS,be.LOGS;print('IMMERSIVE05_BROWSER_PASS',flush=True)
  finally:
   for p in pages:
    try:p.evaluate('WolvesWorkspace.stop();WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close()
if __name__=='__main__':run()
