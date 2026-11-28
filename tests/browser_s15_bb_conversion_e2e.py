"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys
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
   exile=roles[93];assert exile.locator('#wv-bb-submit').count()==0
   assert exile.evaluate('WolvesLive.game.players.find(p=>p.self).self.currentFaction')=='phe3'
   resolve('DAY_DISCUSS')
   host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click()
   for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"')
   p=roles[74];target=roles[94].evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target);p.get_by_role('button',name='Gửi / đổi phiếu').click();p.wait_for_function('(id)=>!WolvesLive.working && WolvesLive.game.voting.ownBallot?.targetId===id',arg=target);host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu chờ xét').click()
   for p in roles.values():p.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT"&&WolvesLive.game.round===2')
   exile.wait_for_function('WolvesLive.game.players.find(p=>p.self).self.currentFaction==="soi"&&WolvesLive.game.bbPack?.maxTargets===2')
   for p in roles.values():assert p.evaluate('WolvesLive.game.qaRepresentativeOrder===undefined&&WolvesLive.game.qaRepresentativeTape===undefined')
   host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()');exile.wait_for_function('WolvesLive.game.bbPack.waitingForResponses===true')
   exile.wait_for_function('!WolvesLive.working');first=roles[74].evaluate('WolvesLive.profile.id');second=roles[84].evaluate('WolvesLive.profile.id');exile.locator('#wv-bb-first').select_option(first);exile.locator('#wv-bb-second').select_option(second);exile.locator('#wv-bb-submit').click();exile.wait_for_function('!WolvesLive.working&&WolvesLive.game.bbPack.latestValidTargets.length===2')
   exile.evaluate('WolvesLive.disconnect();WolvesLive.connect()');exile.wait_for_function('WolvesLive.connectionState==="online"&&WolvesLive.game.bbPack.latestValidTargets.length===2')
   resolve('GAME_COMPLETED');eid=exile.evaluate('WolvesLive.profile.id')
   for p in roles.values():
    assert p.evaluate('WolvesLive.game.winnerIds')==[eid];p.locator('.wv-winners').wait_for();assert p.evaluate('!WolvesLive.events.some(e=>e.eventType==="STATE_COMMITTED"||e.eventType==="BB_QA_PACK_LOCK_ATTEMPT")')
   for r in (74,84,94):assert roles[r].evaluate('WolvesLive.game.players.find(p=>p.self).self.life')=='DEAD_FINAL'
  try:
   scenario('bb-live-conversion',[74,84,93,94],case)
   assert not be.LOGS,be.LOGS[:10]
   print('BB_REPRESENTATIVE_CONVERSION_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
