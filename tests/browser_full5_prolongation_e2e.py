"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys,os
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  def scenario(deck,expected,fn):
   contexts=[];pages=[]
   try:
    for i in range(len(expected)):
     c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'RC01'+deck.replace('-','')+str(i))
    host=pages[0];host.evaluate("openVillagePanel('create','well')")
    host.locator('#wv-room-name').fill('S15 gameplay');host.locator('#wv-capacity').fill(str(len(expected)));host.locator('.village-create-form button[type=submit]').click()
    host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000);rid=host.evaluate('WolvesLive.room.id')
    for i,p in enumerate(pages[1:],2):
     p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
    host.wait_for_function(f'WolvesLive.room?.members?.length==={len(expected)}',timeout=12000)
    host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"')
    host.evaluate("openVillagePanel('live-room','directory')");host.locator('#wv-life-module-ids').fill(','.join(map(str,expected)));host.locator('#wv-life-module-start').click()
    for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=18000)
    roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert sorted(roles)==sorted(expected),roles
    def action(role,target,skill=None,second=None):
     p=roles[role];pid=roles[target].evaluate('WolvesLive.profile.id')
     if skill and p.locator('#wv-skill-choice').count():p.locator('#wv-skill-choice').select_option(skill)
     p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid)
     if second is not None:p.locator('#wv-second-target').select_option(roles[second].evaluate('WolvesLive.profile.id'))
     before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working && WolvesLive.feedback.size>{before}',timeout=15000)
    def resolve(phase):
     host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()')
     for p in pages:p.wait_for_function(f'WolvesLive.game?.phase==="{phase}"',timeout=18000)
    print('SCENARIO_READY',deck,flush=True);fn(roles,action,resolve,host);print('SCENARIO_ACTIONS_PASS',deck,flush=True)
    for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   finally:
    for p in pages:
     try:p.evaluate('WolvesLive.disconnect()')
     except Exception:pass
    for c in contexts:be.close_context(c)
  def case(roles,action,resolve,host):
   shots=pathlib.Path(os.environ['WV_SCREENSHOT_DIR']);shots.mkdir(parents=True,exist_ok=True)
   a,f,b=roles[25],roles[51],roles[64]
   action(51,25,skill='official.51.ferry');action(97,25);action(64,25,second=51);action(8,25);resolve('DAY_DISCUSS')
   a.wait_for_function('WolvesLive.game.players.find(x=>x.self).self.life==="PROLONGED" && WolvesLive.game.chat.canSend')
   assert not b.evaluate('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED")')
   a.locator('.hud-slot.active-role .muted').filter(has_text='Được kéo dài sự sống').wait_for();a.screenshot(path=str(shots/'ferry-prolonged.png'))
   host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.openVote()');host.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT" && !WolvesLive.working');a.wait_for_function('WolvesLive.game.voting.canVote');a.screenshot(path=str(shots/'ferry-voting.png'));host.evaluate('WolvesLive.closeVote()')
   for q in roles.values():q.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"')
   a.wait_for_function('WolvesLive.game.players.find(x=>x.self).self.life==="HIBERNATING"');a.screenshot(path=str(shots/'ferry-seed-expiry.png'))
   assert not b.evaluate('WolvesLive.events.some(e=>e.eventType==="S15_SCALE_BELL_OBSERVED")')
   resolve('DAY_DISCUSS');a.wait_for_function('WolvesLive.game.players.find(x=>x.self).self.life==="ALIVE"')
  try:
   scenario('full5-ferry',[8,25,51,64,97],case)
   assert not be.LOGS,be.LOGS[:10];print('FULL5_FERRY_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
