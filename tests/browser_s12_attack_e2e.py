"""Three real browser sessions and real backend, no synthetic game state."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  args={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():args['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**args)
  contexts=[];pages=[]
  try:
   for i in range(3):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'S12Player'+str(i))
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('S12 Snow');host.locator('#wv-capacity').fill('3');host.locator('.village-create-form button[type=submit]').click();host.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   rid=host.evaluate('WolvesLive.room.id')
   for i,p in enumerate(pages[1:],2):
    p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}',timeout=12000)
   host.wait_for_function('WolvesLive.room?.members?.length===3');host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"');host.evaluate("openVillagePanel('live-room','directory')");host.locator('#wv-test-deck').select_option('knight-snow');host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=16000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert sorted(roles)==[8,9,25]
   k,s,t=roles[8],roles[9],roles[25];tid=t.evaluate('WolvesLive.profile.id');sid=s.evaluate('WolvesLive.profile.id');kid=k.evaluate('WolvesLive.profile.id')
   def skill(p,target):
    p.wait_for_function('WolvesLive.localSeatToId?.length===3 && !WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target);p.evaluate('WolvesLive.submitSkill()');p.wait_for_function('!WolvesLive.working && WolvesLive.feedback.size>0',timeout=15000)
   def resolve():
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.resolve()')
    for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=16000)
   def vote(target=None):
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.openVote()')
    for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"',timeout=16000)
    if target:
     k.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target);k.get_by_role('button',name='Gửi / đổi phiếu').click();k.wait_for_function('(id)=>WolvesLive.game.voting?.ownBallot?.targetId===id',arg=target,timeout=15000)
    host.wait_for_function('!WolvesLive.working');host.evaluate('WolvesLive.closeVote()')
   skill(s,tid);skill(k,tid);resolve()
   for p in pages:assert p.evaluate('WolvesLive.game.players.every(x=>!x.publicReportedDead)')
   vote();
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && WolvesLive.game.round===2',timeout=16000)
   skill(k,sid);resolve();vote(tid)
   for p in pages:
    p.wait_for_function('WolvesLive.game?.completed===true',timeout=16000);assert p.evaluate('WolvesLive.game.winnerIds')==[kid];assert p.evaluate('WolvesLive.game.players.filter(x=>x.publicReportedDead).length')==2;assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length')==1
    es=p.evaluate('async()=> (await WolvesLive.request(`/api/games/${WolvesLive.gameId}/events`)).events');assert not any(e['eventType']=='OFFICIAL_ATTACK_BLOCKED' for e in es)
    assert p.evaluate('async()=> (await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   t.evaluate('WolvesLive.disconnect();WolvesLive.connect()');t.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed',timeout=15000)
   assert not be.LOGS,be.LOGS[:5]
   print('S12_BROWSER_PASS [8,9,25] shield, zero vote, night kill, hanging, winner, replay, privacy, reconnect')
  finally:
   for p in pages:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
