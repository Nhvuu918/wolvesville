"""Real Chromium UI + backend integration: verified #8/#28 early-night match.
No fake vote, winner, death or frontend-computed result. Two distinct accounts.
"""
import pathlib,sys,uuid
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  args={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():args['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**args)
  ca,pa=be.page_setup(browser);cb,pb=be.page_setup(browser)
  try:
   a=be.register(pa,'S11SeerAlice');b=be.register(pb,'S11SeerBob')
   pa.evaluate("openVillagePanel('create','well')")
   pa.locator('#wv-room-name').fill('S07 Kỵ Sĩ Không Đầu')
   pa.locator('#wv-capacity').fill('2')
   pa.locator('.village-create-form button[type=submit]').click()
   pa.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   roomid=pa.evaluate('WolvesLive.room.id')
   pb.evaluate('(id)=>WolvesLive.openRoom(id)',roomid)
   pb.wait_for_function('WolvesLive.room?.members?.length===2',timeout=12000)
   pa.evaluate('WolvesLive.roomLock(true)')
   pa.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=12000)
   pa.evaluate("openVillagePanel('live-room','directory')")
   pa.wait_for_selector('#wv-test-deck',timeout=10000)
   pa.locator('#wv-test-deck').select_option('knight')
   pa.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   pa.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=16000)
   pb.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=16000)
   gid=pa.evaluate('WolvesLive.gameId')
   rolea=pa.evaluate('WolvesLive.game.players.find(p=>p.playerId===WolvesLive.profile.id).self.currentCharacterId')
   roleb=pb.evaluate('WolvesLive.game.players.find(p=>p.playerId===WolvesLive.profile.id).self.currentCharacterId')
   assert sorted([rolea,roleb])==[8,25]
   knight=pa if rolea==8 else pb
   jester=pb if rolea==8 else pa
   assert knight.evaluate('WolvesLive.game.capabilities.some(x=>x.skillId==="official.8.night-kill"&&x.available)')
   assert not jester.evaluate('WolvesLive.game.players.some(p=>p.playerId!==WolvesLive.profile.id && p.self)')
   seer=jester
   victim=seer.evaluate('WolvesLive.profile.id')
   knight_id=knight.evaluate('WolvesLive.profile.id')
   seer.wait_for_function('page==="ingame" && WolvesLive.localSeatToId?.length===2',timeout=16000)
   seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',knight_id)
   seer.evaluate('WolvesLive.submitSkill()')
   seer.wait_for_function('WolvesLive.feedback.size>0',timeout=15000)
   pa.evaluate('WolvesLive.resolve()')
   for p in (pa,pb):p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=16000)
   pa.wait_for_function('!WolvesLive.working',timeout=15000)
   pa.evaluate('WolvesLive.openVote()')
   for p in (pa,pb):p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"',timeout=16000)
   knight.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',victim)
   knight.get_by_role('button',name='Gửi / đổi phiếu').click()
   knight.wait_for_function('(id)=>WolvesLive.game.voting?.ownBallot?.targetId===id',arg=victim,timeout=15000)
   pa.wait_for_function('!WolvesLive.working',timeout=15000)
   pa.evaluate('WolvesLive.closeVote()')
   for p in (pa,pb):
    p.wait_for_function('WolvesLive.game?.completed===true',timeout=16000)
    assert p.evaluate('WolvesLive.game.voting.outcome')=='HANGING_COMPLETED'
    assert p.evaluate('WolvesLive.game.winnerIds')==[knight_id]
    assert p.evaluate('WolvesLive.game.players.filter(x=>x.publicReportedDead).length')==1
    p.wait_for_selector('.wv-match-result',timeout=10000)
   seer.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   seer.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed',timeout=15000)
   assert not be.LOGS,be.LOGS[:5]
   knight.screenshot(path=str(pathlib.Path(__file__).resolve().parent.parent/'reports'/'s11_seer_hanging.png'),full_page=True)
   print('S11_BROWSER_PASS: real seer skill, official hanging, knight winner, reconnect')
   pa.evaluate('WolvesLive.disconnect()')
   pb.evaluate('WolvesLive.disconnect()')
   pa.wait_for_timeout(180)
  except Exception:
   for p in (pa,pb):
    try:print('STATE_DIAGNOSTIC',p.evaluate('({phase:WolvesLive.game?.phase,round:WolvesLive.game?.round,voting:WolvesLive.game?.voting,notice:WolvesLive.notice,working:WolvesLive.working})'))
    except Exception:pass
   raise
  finally:
   be.close_context(ca);be.close_context(cb);browser.close();be.bridge.shutdown()

if __name__=='__main__':
 try:run()
 except Exception as e:
  import traceback;traceback.print_exc();print('S11_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:8]);sys.exit(1)
