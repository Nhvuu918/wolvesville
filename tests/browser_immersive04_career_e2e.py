"""Real official Normal match; no QA or demo credentials. Browser transport bridge allowed."""
import os,pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 shots=pathlib.Path(os.environ['WV_SCREENSHOT_DIR']);shots.mkdir(parents=True,exist_ok=True)
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for name in ['CareerA','CareerB']:
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,name);p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host,guest=pages;host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Career official');host.locator('#wv-capacity').fill('2');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');guest.evaluate('(id)=>WolvesLive.openRoom(id)',host.evaluate('WolvesLive.room.id'))
   for p in pages:p.wait_for_function('WolvesLive.room?.members.length===2 && WolvesLive.room.members.every(m=>m.online)')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option('knight')
   for p in pages:p.wait_for_function('WolvesLive.room.normalDeck==="knight" && !WolvesLive.working')
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
   host.wait_for_function('WolvesLive.room.members.every(m=>m.ready)');host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.self).self.currentCharacterId'):p for p in pages};assert set(roles)=={8,25};k,a=roles[8],roles[25]
   for p,t in [(a,k),(k,a)]:
    p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',t.evaluate('WolvesLive.profile.id'));p.locator('#wv-skill-submit').click();p.wait_for_function('!WolvesLive.working')
   host.wait_for_function('WolvesLive.game.hostProgress?.allReceived===true');host.locator('.wv4-confirm').click()
   for p in pages:p.wait_for_function('WolvesLive.game.completed===true',timeout=18000)
   k.locator('#wv4-end-reward').get_by_text('+460 XP · Cấp 3',exact=True).wait_for();k.screenshot(path=str(shots/'endgame-reward.png'));a.locator('#wv4-end-reward').get_by_text('+200 XP · Cấp 2',exact=True).wait_for();a.screenshot(path=str(shots/'endgame-loser.png'))
   k.evaluate("go('career')");k.locator('#wv4-progression').get_by_text('460 XP',exact=True).wait_for();k.screenshot(path=str(shots/'career-overview.png'));k.locator('.wv4-badge[data-unlocked="true"]').first.scroll_into_view_if_needed();k.screenshot(path=str(shots/'badge-gallery.png'));k.locator('.wv4-badge[data-unlocked="true"]').first.get_by_role('button',name='Ghim huy hiệu').click();k.get_by_role('button',name='Bỏ ghim').first.wait_for();k.get_by_text('✦ Lịch sử XP và lên cấp',exact=True).click();k.locator('.wv4-history').scroll_into_view_if_needed();k.screenshot(path=str(shots/'xp-history.png'));k.set_viewport_size({'width':390,'height':844});k.locator('#wv4-progression').scroll_into_view_if_needed();k.screenshot(path=str(shots/'career-mobile.png'));assert not be.LOGS,be.LOGS;print('IMMERSIVE04_CAREER_BROWSER_PASS',flush=True)
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:c.close()
   browser.close()
if __name__=='__main__':run()
