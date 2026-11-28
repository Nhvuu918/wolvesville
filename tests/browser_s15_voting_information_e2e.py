"""Real backend, browser and authenticated clients; no fixture state or fake result."""
import pathlib,sys,faulthandler
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 faulthandler.dump_traceback_later(52,repeat=False)
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
    print("VOTING_INFO_READY",deck,flush=True);fn(roles,action,resolve,host);print("VOTING_INFO_ASSERTIONS_PASS",deck,flush=True)
    for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   finally:
    for p in pages:
     try:p.evaluate('WolvesLive.disconnect()')
     except Exception:pass
    for c in contexts:be.close_context(c)
    print("VOTING_INFO_CLEANUP_PASS",deck,flush=True)
  def open_vote(host,roles):
   host.evaluate('WolvesLive.openVote()')
   for p in roles.values():p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"')
  def close_vote(host,roles):
   host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.closeVote()')
   for p in roles.values():p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"')
  def sedative(roles,action,resolve,host):
   action(87,25);resolve('DAY_DISCUSS');roles[25].get_by_text('Bạn đang bị câm trong chat công khai.').wait_for(timeout=12000)
   open_vote(host,roles);assert roles[25].evaluate('WolvesLive.game.voting.canVote===false');assert roles[74].evaluate('WolvesLive.game.voting.canVote===true');assert roles[25].get_by_text('Bạn không còn quyền bỏ phiếu.').count()==1;close_vote(host,roles)
  def reveal(roles,action,resolve,host):
   resolve('DAY_DISCUSS');open_vote(host,roles);assert roles[54].locator('#wv-skill-submit').count()==0;close_vote(host,roles);resolve('DAY_DISCUSS');open_vote(host,roles);action(54,25);resolve('DAY_VOTE_COLLECT')
   for p in roles.values():p.wait_for_function('WolvesLive.events.some(e=>e.eventType==="S15_PUBLIC_ROLE_REVEALED"&&e.payload.roleName==="Tiên Tri")',timeout=12000)
  def violin(roles,action,resolve,host):
   action(8,25);resolve('DAY_DISCUSS');resolve('NIGHT_COLLECT');action(80,8,second=25);resolve('DAY_DISCUSS')
   roles[80].get_by_text('Đối chiếu phe: Không Tiếc Thương.',exact=True).wait_for(timeout=12000)
   assert roles[8].get_by_text('Đối chiếu phe:',exact=False).count()==0
  try:
   scenarios={'sedative':('s15-sedative',[25,74,87],sedative),'reveal':('s15-reveal',[25,54,74],reveal),'violin':('s15-violin-knight',[8,25,80],violin)}
   for name in ([sys.argv[1]] if len(sys.argv)>1 else scenarios):scenario(*scenarios[name])
   assert not be.LOGS,be.LOGS[:10]
   print('S15_BROWSER_PASS')
  finally:browser.close();be.bridge.shutdown();faulthandler.cancel_dump_traceback_later()
if __name__=='__main__':run()
