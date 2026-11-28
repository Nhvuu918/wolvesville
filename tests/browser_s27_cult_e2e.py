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
     c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S27'+deck.replace('-','')+str(i))
    host=pages[0];host.evaluate("openVillagePanel('create','well')")
    host.locator('#wv-room-name').fill('S15 gameplay');host.locator('#wv-capacity').fill(str(len(expected)));host.locator('.village-create-form button[type=submit]').click()
    host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000);rid=host.evaluate('WolvesLive.room.id')
    for i,p in enumerate(pages[1:],2):
     p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
    host.wait_for_function(f'WolvesLive.room?.members?.length==={len(expected)}',timeout=12000)
    host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"')
    host.evaluate("openVillagePanel('live-room','directory')");host.locator('#wv-test-deck').select_option(deck);host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
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
   shots=pathlib.Path(os.environ.get('WV_SCREENSHOT_DIR','reports/v1.8.0-development/screenshots'));shots.mkdir(parents=True,exist_ok=True)
   def snap(p,n):
    p.wait_for_function('page==="ingame" && !titleScreenOpen');p.screenshot(path=str(shots/(n+'.png')))
   l=roles[90];a=roles[25];m=roles[74];z=roles[84]
   snap(l,'cult-night');action(90,25,'official.90.recruit');action(84,25);resolve('DAY_DISCUSS')
   l.get_by_text('Tuyển mộ thành công.',exact=True).wait_for(timeout=12000);a.get_by_text('Bạn đã gia nhập giáo phái.',exact=True).wait_for(timeout=12000)
   assert a.locator('#wv-chat-input').is_disabled();assert not a.locator('#wv-group-input').is_disabled();assert m.locator('#wv-system-group-chat').count()==0
   a.locator('#wv-group-input').fill('Tín đồ vẫn có quyền chat nhóm');a.locator('#wv-system-group-chat button[type=submit]').click()
   l.get_by_text('Tín đồ vẫn có quyền chat nhóm',exact=False).wait_for(timeout=12000);assert 'Tín đồ vẫn có quyền chat nhóm' not in m.locator('body').inner_text()
   snap(l,'cult-recruit-success');snap(a,'cult-muted-group');snap(m,'cult-outsider')
   a.evaluate('WolvesLive.disconnect();WolvesLive.connect()');a.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.chat.muted && WolvesLive.game.groupChat?.[0]?.canSend',timeout=15000)
   def next_night():
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.openVote()');host.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT" && !WolvesLive.working');host.evaluate('WolvesLive.closeVote()')
    for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"')
   next_night();action(25,90,'official.25.inspect-role');action(90,74,'official.90.recruit');resolve('DAY_DISCUSS');next_night();action(90,84,'official.90.recruit');resolve('GAME_COMPLETED');snap(l,'cult-victory')
   assert l.evaluate('WolvesLive.game.winnerIds.length===4')
  try:
   scenario('s27-cult',[25,74,84,90],case)
   assert not be.LOGS,be.LOGS[:10];print('S27_CULT_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
