"""Chromium + REAL backend: certified #33 vote coercion, server-private tally,
multiple independent accounts and replay. This is NOT vote-to-elimination GO."""
import pathlib,sys,uuid
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  contexts=[]
  try:
   pages=[]
   for label in ('Alice','Bob','Cora'):
    context,page=be.page_setup(browser);contexts.append(context);pages.append(page)
    be.register(page,'S09'+label)
   pa,pb,pc=pages
   pa.evaluate("openVillagePanel('create','well')")
   pa.locator('#wv-room-name').fill('S09 Sói Lừa Gạt · kiểm phiếu')
   pa.locator('#wv-capacity').fill('3')
   pa.locator('.village-create-form button[type=submit]').click()
   pa.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   roomid=pa.evaluate('WolvesLive.room.id')
   for p in (pb,pc):p.evaluate('(id)=>WolvesLive.openRoom(id)',roomid)
   pa.wait_for_function('WolvesLive.room?.members?.length===3',timeout=15000)
   pa.evaluate('WolvesLive.roomLock(true)')
   pa.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=15000)
   pa.evaluate("openVillagePanel('live-room','directory')")
   pa.wait_for_selector('#wv-test-deck',timeout=12000)
   pa.locator('#wv-test-deck').select_option('vote-control')
   pa.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   pa.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=17000)
   for p in (pb,pc):p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=17000)
   byrole={}
   for p in pages:
    role=p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId')
    byrole[role]=p
    assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length')==1
   assert set(byrole)=={25,33,74}
   print('S09_BROWSER_PASS: approved three-player closed deck, server assigned roles and ACL')
   pa.evaluate('WolvesLive.resolve()')
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=18000)
   pa.evaluate('WolvesLive.openVote()')
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"',timeout=18000)
   wolf=byrole[33];target=byrole[25]
   assert wolf.evaluate('WolvesLive.game.capabilities.find(x=>x.skillId==="official.33.force-vote")?.available')
   target_id=target.evaluate('WolvesLive.profile.id')
   wolf.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target_id)
   assert wolf.locator('#wv-skill-submit').count()==1
   wolf.evaluate('WolvesLive.submitSkill()')
   wolf.wait_for_function('WolvesLive.feedback.size>0',timeout=17000)
   assert not wolf.evaluate('WolvesLive.game.completed')
   print('S09_BROWSER_PASS: wolf UI submitted official coercion; no early public result')
   pa.evaluate('WolvesLive.resolve()')
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"',timeout=17000)
   assert not wolf.evaluate('WolvesLive.game.capabilities.find(x=>x.skillId==="official.33.force-vote")?.available')
   # Each browser sends its own real vote; target is deliberately different from the wolf's choice.
   voter_targets={33:byrole[74],25:byrole[33],74:byrole[33]}
   for role,p in byrole.items():
    chosen=voter_targets[role].evaluate('WolvesLive.profile.id')
    p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',chosen)
    p.evaluate('WolvesLive.submitVote()')
    p.wait_for_function('WolvesLive.game.voting?.ownBallot!==undefined',timeout=17000)
   pa.evaluate('WolvesLive.closeVote()')
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_RESOLVE"',timeout=16000)
   for p in pages:
    projection=p.evaluate('WolvesLive.game')
    assert projection['completed'] is False
    assert projection['voting']['outcome']=='ADJUDICATION_UNRESOLVED'
    assert 'directives' not in str(projection) and 'effectiveCounts' not in str(projection)
   byrole[25].evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   byrole[25].wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
   assert byrole[25].evaluate('WolvesLive.game.phase')=='DAY_RESOLVE'
   assert not be.LOGS,be.LOGS[:5]
   # Visual evidence of actual UI after backend-committed vote lock; not a design preview.
   pa.screenshot(path=str(pathlib.Path(__file__).resolve().parents[1]/'reports'/'s09_voting_browser_real.png'),full_page=True)
   print('S09_BROWSER_PASS: 3 real ballots, server locks votes, ACL and reconnect; no fabricated hanging/winner')
  finally:
   for p in pages if 'pages' in locals() else []:
    try:p.evaluate('WolvesLive.disconnect()')
    except Exception:pass
   for ctx in contexts:
    be.close_context(ctx)
   browser.close();be.bridge.shutdown()

if __name__=='__main__':
 try:run()
 except Exception as e:
  import traceback;traceback.print_exc();print('S09_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:6]);sys.exit(1)
