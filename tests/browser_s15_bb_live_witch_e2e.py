"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(split=False):
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
     p=roles[role];pid=roles[target].evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working')
     if skill and p.locator('#wv-skill-choice').count():p.locator('#wv-skill-choice').select_option(skill)
     p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pid)
     if second is not None:p.locator('#wv-second-target').select_option(roles[second].evaluate('WolvesLive.profile.id'))
     before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').wait_for();p.wait_for_function('!document.querySelector("#wv-skill-submit").disabled');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working && WolvesLive.feedback.size>{before}',timeout=15000)
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
   eng=roles[10];witch=roles[29];victim=roles[25];knight=roles[8]
   def next_night():
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Chốt ngày (chế độ QA)').click()
    for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"')
   action(10,29);resolve('WITCH_WINDOW');resolve('DAY_DISCUSS');assert eng.evaluate('WolvesLive.game.bbTrap.activeTargets.length')==1
   assert not witch.evaluate('WolvesLive.game.bbTrap');next_night()
   action(8,25);resolve('WITCH_WINDOW');witch.locator('.wv-game-events p[data-night="2"]').filter(has_text='Người dự kiến chết đêm này:').wait_for(timeout=12000)
   assert victim.get_by_text('Người dự kiến chết đêm này:',exact=False).count()==0
   if split:
    action(29,25,'official.29.rescue');host.wait_for_function('!WolvesLive.working');host.locator('#wv-bb-open-poison').click()
    for p in roles.values():p.wait_for_function('WolvesLive.game.qaNightWindow==="WITCH_POISON" && !WolvesLive.working')
    assert victim.evaluate('WolvesLive.game.players.find(p=>p.self).self.life')=='ALIVE'
    victim_id=victim.evaluate('WolvesLive.profile.id')
    for p in roles.values():
     assert not p.evaluate('(id)=>WolvesLive.game.players.find(p=>p.playerId===id).publicReportedDead',victim_id)
     assert not p.evaluate('(id)=>WolvesLive.events.some(e=>e.eventType==="PLAYER_ELIMINATED"&&e.payload.playerId===id)',victim_id)
    assert eng.evaluate('WolvesLive.game.bbTrap.activeTargets.length')==1
    assert not witch.evaluate('WolvesLive.game.capabilities.some(c=>c.skillId==="official.29.rescue")')
    witch.evaluate('WolvesLive.disconnect();WolvesLive.connect()');witch.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.qaNightWindow==="WITCH_POISON"')
    action(29,10,'official.29.poison');resolve('DAY_DISCUSS')
   else:
    action(29,10,'official.29.poison');action(29,25,'official.29.rescue');resolve('DAY_DISCUSS')
   assert victim.evaluate('WolvesLive.game.players.find(p=>p.self).self.life')=='DEAD_FINAL'
   assert eng.evaluate('WolvesLive.game.players.find(p=>p.self).self.life')=='ALIVE'
   assert eng.evaluate('WolvesLive.game.bbTrap.activeTargets.length')==0
   assert not knight.evaluate('WolvesLive.events.some(e=>e.eventType==="BB_QA_INVERTED_POTION")')
   witch.evaluate('WolvesLive.disconnect();WolvesLive.connect()');witch.wait_for_function('WolvesLive.connectionState==="online"')
  try:
   scenario('bb-live-witch',[8,10,25,29],case)
   assert not be.LOGS,be.LOGS[:10];print('BB_CROSS_WINDOW_BROWSER_PASS' if split else 'BB_LIVE_WITCH_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
