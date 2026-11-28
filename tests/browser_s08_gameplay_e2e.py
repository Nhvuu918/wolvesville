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
   a=be.register(pa,'S08Alice');b=be.register(pb,'S08Bob')
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
   pa.locator('#wv-test-deck').select_option('knight-jester')
   pa.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   pa.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=16000)
   pb.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT"',timeout=16000)
   gid=pa.evaluate('WolvesLive.gameId')
   rolea=pa.evaluate('WolvesLive.game.players.find(p=>p.playerId===WolvesLive.profile.id).self.currentCharacterId')
   roleb=pb.evaluate('WolvesLive.game.players.find(p=>p.playerId===WolvesLive.profile.id).self.currentCharacterId')
   assert sorted([rolea,roleb])==[8,28]
   knight=pa if rolea==8 else pb
   jester=pb if rolea==8 else pa
   assert knight.evaluate('WolvesLive.game.capabilities.some(x=>x.skillId==="official.8.night-kill"&&x.available)')
   assert not jester.evaluate('WolvesLive.game.players.some(p=>p.playerId!==WolvesLive.profile.id && p.self)')
   print('S08_GAMEPLAY_BROWSER_PASS: two official roles server-assigned, private projections, real skill capability')
   # game.created arrives before loadGame finishes rendering the stage on
   # the second browser. Wait for ACTUAL player-facing seating, not just data.
   knight.wait_for_function('page==="ingame" && WolvesLive.localSeatToId?.length===2 && document.querySelectorAll(".arena-seat").length===2',timeout=16000)
   victim=jester.evaluate('WolvesLive.profile.id')
   target_index=knight.evaluate('(id)=>WolvesLive.localSeatToId.indexOf(id)',victim)
   assert target_index>=0
   knight.locator('.arena-seat').nth(target_index).click()
   knight.wait_for_function('(id)=>WolvesLive.selectedTarget===id',arg=victim,timeout=10000)
   knight.evaluate('WolvesLive.submitSkill()')
   knight.wait_for_function('Array.from(WolvesLive.feedback.values()).length>0',timeout=16000)
   assert not knight.evaluate('WolvesLive.game.completed')
   print('S08_GAMEPLAY_BROWSER_PASS: action accepted but not shown as resolved or winner')
   pa.evaluate('WolvesLive.resolve()')
   pa.wait_for_function('WolvesLive.game?.completed === true',timeout=16000)
   pb.wait_for_function('WolvesLive.game?.completed === true',timeout=16000)
   assert pa.evaluate('WolvesLive.game.phase')=='GAME_COMPLETED'
   assert pb.evaluate('WolvesLive.game.phase')=='GAME_COMPLETED'
   winner=knight.evaluate('WolvesLive.profile.id')
   assert knight.evaluate('WolvesLive.game.winnerIds')[0]==winner
   assert jester.evaluate('WolvesLive.game.winnerIds')[0]==winner
   knight.wait_for_selector('.wv-match-result',timeout=10000)
   jester.wait_for_selector('.wv-match-result',timeout=10000)
   assert 'chiến thắng' in knight.locator('.wv-match-result').inner_text().lower()
   assert 'VÁN CHƠI ĐÃ KẾT THÚC' in knight.locator('.phase-sky-banner').inner_text()
   assert '#' not in knight.locator('.hud-slot.active-role strong').inner_text()
   assert not knight.locator('.day-discussion-panel').count()
   knight.screenshot(path=str(pathlib.Path(__file__).resolve().parent.parent/'reports'/'s08_knight_jester_endgame.png'),full_page=True)
   assert 'người chiến thắng' in jester.locator('.wv-match-result').inner_text().lower()
   jester.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   jester.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed',timeout=15000)
   assert not be.LOGS,be.LOGS[:5]
   print('S08_GAMEPLAY_BROWSER_PASS: certified elimination and winner after commit; UI, WS, reconnect, winner ACL')
   pa.evaluate('WolvesLive.disconnect()')
   pb.evaluate('WolvesLive.disconnect()')
   pa.wait_for_timeout(180)
  finally:
   be.close_context(ca);be.close_context(cb);browser.close();be.bridge.shutdown()

if __name__=='__main__':
 try:run()
 except Exception as e:
  import traceback;traceback.print_exc();print('S08_GAMEPLAY_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:8]);sys.exit(1)
