"""Native HTTP/WS E2E, independent registered browser contexts. No mocks."""
import pathlib,os,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be
OUT=pathlib.Path(os.getenv('WV_IMMERSIVE_EVIDENCE','reports/IMMERSIVE-01/browser'));OUT.mkdir(parents=True,exist_ok=True)
def open_view(p,name):
 p.evaluate('(name)=>go(name)',name);p.wait_for_function('(name)=>page===name && document.querySelector("#wvi-body")?.getAttribute("aria-busy")==="false"',arg=name,timeout=18000)
def main():
 print("Transport:","native" if be.DIRECT else "repository HTTP/WS bridge",flush=True)
 with sync_playwright() as pw:
  browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if sys.platform.startswith('linux') else None,args=['--no-sandbox'])
  ca,a=be.page_setup(browser);cb,b=be.page_setup(browser)
  try:
   pa=be.register(a,'MoonAlice');pb=be.register(b,'MoonBob')
   for p in (a,b):p.wait_for_function('WolvesLive.connectionState==="online"')
   open_view(a,'profile');a.locator('[name=bio]').fill('Người kể chuyện của làng.');a.locator('[name=status]').fill('Đang đợi trăng lên');a.locator('[name=avatar]').select_option('64');a.get_by_role('button',name='Lưu hồ sơ').click();a.wait_for_function('document.querySelector("#wvi-message")?.textContent.includes("Đã lưu")');a.wait_for_timeout(750);a.screenshot(path=str(OUT/'profile.png'),full_page=True)
   open_view(a,'friends');a.locator('[name=q]').fill(pb['publicId']);a.get_by_role('button',name='Tìm kiếm',exact=True).click();a.get_by_role('button',name='Kết bạn',exact=True).click();a.wait_for_function('document.querySelector("#wvi-message")?.textContent.includes("Đã cập nhật")');b.wait_for_function('WolvesImmersive.unread===1',timeout=12000);open_view(b,'notifications');b.get_by_text('Lời mời kết bạn',exact=True).wait_for();b.wait_for_timeout(750);b.screenshot(path=str(OUT/'notifications.png'),full_page=True);open_view(b,'friends');b.get_by_role('button',name='Chấp nhận').click();b.get_by_text('Bạn bè · 1',exact=True).wait_for();b.wait_for_timeout(750);b.screenshot(path=str(OUT/'friends.png'),full_page=True)
   open_view(a,'feed');a.locator('form[data-form=post] textarea').fill('Đêm nay gặp nhau tại làng Sương Mù.');a.get_by_role('button',name='Đăng bài').click();a.get_by_text('Đêm nay gặp nhau tại làng Sương Mù.',exact=True).wait_for();open_view(b,'feed');b.get_by_role('button',name='Thích · 0').click();b.get_by_role('button',name='Bỏ thích · 1').wait_for();b.locator('form[data-form=comment] input').fill('Hẹn gặp bạn!');b.get_by_role('button',name='Gửi',exact=True).click();b.get_by_text('Hẹn gặp bạn!',exact=True).wait_for();b.wait_for_timeout(750);b.screenshot(path=str(OUT/'feed.png'),full_page=True)
   open_view(a,'assistant');a.locator('#wvi-question').fill('Người Rung Chuông hoạt động thế nào?');a.get_by_role('button',name='Tra cứu nguồn').click();a.get_by_text('CH-64 · Người Rung Chuông',exact=True).wait_for();a.wait_for_timeout(750);a.screenshot(path=str(OUT/'rule-lookup.png'),full_page=True)
   if be.DIRECT:a.reload(wait_until='domcontentloaded')
   else:
    token=a.evaluate('WolvesLive.token');be.close_context(ca);ca,a=be.page_setup(browser,seed={'wv_s03_session_token':token})
   a.wait_for_function('WolvesLive.profile!==null && !titleScreenOpen');open_view(a,'profile');a.locator('.wvi-body-text').filter(has_text='Người kể chuyện của làng.').wait_for();a.set_viewport_size({'width':390,'height':844});a.wait_for_timeout(750);a.screenshot(path=str(OUT/'mobile-profile.png'),full_page=True);assert a.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   print('PASS browser: account, profile persistence, request realtime, accept, feed, like/comment, source lookup, refresh, mobile width')
  finally:be.close_contexts([ca,cb]);be.bridge.shutdown();browser.close()
if __name__=='__main__':main()
