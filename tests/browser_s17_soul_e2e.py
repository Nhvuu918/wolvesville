"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys,faulthandler
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 faulthandler.dump_traceback_later(60,repeat=False)
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  def scenario(deck,expected,fn):
   contexts=[];pages=[]
   try:
    for i in range(len(expected)):
     c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S15'+deck.replace('-','')+str(i))
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
     print('E2E_STAGE action',role,skill,target,flush=True)
     p.wait_for_function('!WolvesLive.working')
     if skill and p.locator('#wv-skill-choice').count():p.locator('#wv-skill-choice').select_option(skill)
     p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid)
     p.wait_for_function('(id)=>WolvesLive.selectedTarget===id',arg=pid)
     if second is not None:p.locator('#wv-second-target').select_option(roles[second].evaluate('WolvesLive.profile.id'))
     before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working && WolvesLive.feedback.size>{before}',timeout=15000)
    def resolve(phase):
     print('E2E_STAGE resolve',phase,flush=True)
     host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()')
     for p in pages:p.wait_for_function(f'WolvesLive.game?.phase==="{phase}"',timeout=18000)
    print('SCENARIO_READY',deck,flush=True);fn(roles,action,resolve,host);print('SCENARIO_ACTIONS_PASS',deck,flush=True)
    for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   finally:
    print('E2E_STAGE cleanup',flush=True);be.close_contexts(contexts);print('E2E_STAGE cleanup-complete',flush=True)
  def ballot(roles,host,actor,target):
   host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.openVote()')
   for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"')
   p=roles[actor];tid=roles[target].evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);p.get_by_role('button',name='Gửi / đổi phiếu').click();p.wait_for_function('(id)=>!WolvesLive.working && WolvesLive.game.voting.ownBallot?.targetId===id',arg=tid);host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.closeVote()')
  def winners(roles,expected):
   ids=[roles[r].evaluate('WolvesLive.profile.id') for r in expected]
   for p in roles.values():
    p.wait_for_function('WolvesLive.game.completed===true');assert sorted(p.evaluate('WolvesLive.game.winnerIds'))==sorted(ids);assert p.locator('.wv-winners').count()==1
  def case(roles,action,resolve,host):
   soul=roles[23];sid=soul.evaluate('WolvesLive.profile.id')
   action(36,23,'official.36.fireball');resolve('DAY_DISCUSS')
   assert soul.evaluate('WolvesLive.game.players.find(p=>p.self).self.life==="PENDING_REVIVAL"')
   def day():
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.openVote()')
    for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"')
    assert soul.evaluate('WolvesLive.game.voting.canVote===false')
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.closeVote()')
    for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"')
   day()
   assert soul.evaluate('WolvesLive.game.players.find(p=>p.self).self.life==="ALIVE"')
   for role,p in roles.items():
    assert p.evaluate('(id)=>WolvesLive.game.players.find(x=>x.playerId===id).publicReportedDead',sid)
    events=p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/events`)).events')
    assert any(e['eventType']=='SOUL_SECRET_REVIVED' for e in events)==(role==23)
   action(36,8,'official.36.shield');action(23,8,'official.23.shoot');resolve('DAY_DISCUSS');day()
   action(23,8,'official.23.shoot');resolve('GAME_COMPLETED');winners(roles,[23,25,36])
  try:
   scenario('s17-soul-lifecycle',[8,23,25,36],case)
   assert not be.LOGS,be.LOGS[:10];print('S17_SOUL_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown();faulthandler.cancel_dump_traceback_later()
if __name__=='__main__':run()
