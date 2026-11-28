"""Real Chromium three-player UI + backend, #5 soul judgment vs #76 nightmare.
No design preview, no fabricated elimination/winner, no unapproved policy.
"""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  contexts=[];pages=[]
  try:
   for name in ('Cora','Dax','Evan'):
    context,page=be.page_setup(browser);contexts.append(context);pages.append(page)
    be.register(page,'S10'+name)
   host=pages[0]
   host.evaluate("openVillagePanel('create','well')")
   host.locator('#wv-room-name').fill('Sprint 10 · Cân Phán Quyết')
   host.locator('#wv-capacity').fill('3')
   host.locator('.village-create-form button[type=submit]').click()
   host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   room_id=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',room_id)
   host.wait_for_function('WolvesLive.room?.members?.length===3',timeout=17000)
   host.evaluate('WolvesLive.roomLock(true)')
   host.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=12000)
   host.evaluate("openVillagePanel('live-room','directory')")
   host.wait_for_selector('#wv-test-deck')
   host.locator('#wv-test-deck').select_option('nightmare-judgment')
   host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=20000)
   by_role={}
   for p in pages:
    role=p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId')
    by_role[role]=p
    assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length')==1
   assert set(by_role)=={5,25,76}
   print('S10_BROWSER_PASS: 3 distinct accounts, certified deck, role assignment ACL')
   for p in pages:
    p.evaluate("go('ingame')")
    p.wait_for_function('WolvesLive.localSeatToId.length===3',timeout=12000)
   def choose(actor,target):
    tid=target.evaluate('WolvesLive.profile.id')
    actor.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid)
    actor.evaluate('WolvesLive.refreshUI()')
    actor.wait_for_selector('#wv-skill-submit',timeout=10000)
    actor.evaluate('WolvesLive.submitSkill()')
    actor.wait_for_function('WolvesLive.feedback.size>0',timeout=16000)
   choose(by_role[25],by_role[76])
   choose(by_role[5],by_role[76])
   choose(by_role[76],by_role[25])
   host.evaluate('WolvesLive.resolve()')
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=18000)
   by_role[5].evaluate('WolvesLive.loadFeedback()')
   by_role[5].wait_for_function('[...WolvesLive.feedback.values()].some(x=>x.resultType==="AURA_INFORMATION")',timeout=15000)
   assert by_role[5].locator('#wv-feedback').get_by_text('Cân Phán Quyết xác nhận: Ác').count()>=1
   by_role[25].evaluate('WolvesLive.loadFeedback()')
   by_role[25].wait_for_function('[...WolvesLive.feedback.values()].some(x=>x.resolutionStatus==="CANCELLED")',timeout=15000)
   by_role[25].evaluate('WolvesLive.loadEvents()')
   by_role[25].wait_for_function('WolvesLive.events.some(x=>x.eventType==="SKILL_LOCK_NOTICE")',timeout=15000)
   by_role[76].evaluate('WolvesLive.loadEvents()')
   by_role[76].wait_for_function('Array.isArray(WolvesLive.events)',timeout=10000)
   assert not by_role[76].evaluate('JSON.stringify(WolvesLive.events).includes("SOUL_JUDGMENT_OBSERVED")')
   assert not by_role[76].evaluate('JSON.stringify(WolvesLive.game).includes("verdict")')
   assert by_role[25].evaluate('WolvesLive.game.completed') is False
   by_role[5].evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   by_role[5].wait_for_function('WolvesLive.connectionState==="online"',timeout=17000)
   by_role[5].evaluate('WolvesLive.loadFeedback()')
   by_role[5].wait_for_function('[...WolvesLive.feedback.values()].some(x=>x.resultType==="AURA_INFORMATION")',timeout=12000)
   assert not be.LOGS,be.LOGS[:5]
   by_role[5].screenshot(path=str(pathlib.Path(__file__).resolve().parents[1]/'reports'/'s10_judgment_real_browser.png'),full_page=True)
   print('S10_BROWSER_PASS: private verdict, night lock cancellation/notice, reconnect, real UI, no invented death')
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:
    be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':
 try:run()
 except Exception as e:
  import traceback;traceback.print_exc();print('S10_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:6]);sys.exit(1)
