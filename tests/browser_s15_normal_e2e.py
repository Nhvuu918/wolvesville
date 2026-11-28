"""Normal room UI, actual authentication and actual kernel. QA flag MUST be off."""
import pathlib,sys,requests
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(case):
 health=requests.get(be.BASE+'/health',timeout=5).json()
 assert health['normalGameplay'] and not health['officialRuleTestMode'] and not health['gameIntegrationTestMode'],health
 role=25 if case.startswith('aura') else 74
 deck='knight' if role==25 else 's15-mystic-knight'
 village=case.endswith('village')
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(2):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);
    try:be.register(p,'Normal'+str(i))
    except Exception:
     print('REGISTER_DEBUG',p.locator('#authError').text_content() if p.locator('#authError').count() else p.locator('#authModal').inner_text() if p.locator('#authModal').count() else p.locator('body').inner_text()[:1000],be.LOGS,flush=True);raise
    p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host,guest=pages;guest.set_viewport_size({'width':390,'height':844})
   host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Chơi thường');host.locator('#wv-capacity').fill('2');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   guest.evaluate('(id)=>WolvesLive.openRoom(id)',rid);guest.wait_for_function('WolvesLive.room?.members.length===2');host.wait_for_function('WolvesLive.room?.members.length===2')
   host.get_by_role('button',name='Khóa danh sách').click();guest.wait_for_function('WolvesLive.room.status==="LOCKED"');host.locator('#wv-normal-deck').select_option(deck);host.wait_for_function('(d)=>WolvesLive.room.normalDeck===d && !WolvesLive.working',arg=deck);guest.wait_for_function('(d)=>WolvesLive.room.normalDeck===d',arg=deck)
   assert host.locator('#wv-normal-start').is_disabled();guest.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.some(m=>m.id!==WolvesLive.profile.id&&m.ready)');host.locator('#wv-ready').click();host.wait_for_function('WolvesLive.room.members.every(m=>m.ready)&&!WolvesLive.working');host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.ruleVersion==="wolvesville-official-v1.3.3" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert set(roles)=={8,role};knight,seer=roles[8],roles[role]
   for p in pages:
    assert p.evaluate('stageState.dialogue.includes("Chơi thường")')
    assert p.evaluate('WolvesLive.game.players.every(x=>x.playerId===WolvesLive.profile.id?!!x.self:!x.self)')
    assert p.evaluate('WolvesLive.game.roleComposition.length===2')
   def action(p,t):
    target=t.evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target);p.locator('#wv-skill-submit').click();p.wait_for_function('!WolvesLive.working&&WolvesLive.feedback.size>0')
   action(seer,knight)
   if not village:action(knight,seer)
   # Force the REST completion path, withholding only auxiliary feedback after
   # the actual server commit. No synthetic game or winner data is injected.
   if case=='aura-knight':
    guest.evaluate("""()=>{WolvesLive.disconnect(); const original=WolvesLive.loadFeedback.bind(WolvesLive); window.wvReleaseFeedback=null; WolvesLive.loadFeedback=async()=>{if(WolvesLive.game?.completed)await new Promise(resolve=>window.wvReleaseFeedback=()=>{WolvesLive.loadFeedback=original;resolve();});return original();};}""")
   host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
   if case=='aura-knight':
    host.wait_for_function('WolvesLive.game.completed===true',timeout=18000)
    guest.evaluate('()=>{void WolvesLive.resyncAfterReconnect()}')
    guest.wait_for_function('WolvesLive.game.completed===true && typeof window.wvReleaseFeedback==="function"',timeout=18000)
    try:
     assert guest.locator('.wv-winners').count()==1, 'TERMINAL_REST_RENDER_GAP: completed projection accepted while auxiliary feedback is pending'
    finally:guest.evaluate('window.wvReleaseFeedback()')
    guest.evaluate('WolvesLive.connect()')
   if village:
    for p in pages:p.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"')
    expected='SEER_AURA_OBSERVED' if role==25 else 'ROLE_OBSERVED'
    seer.wait_for_function('(t)=>WolvesLive.events.some(e=>e.eventType===t)',arg=expected);assert not knight.evaluate('(t)=>WolvesLive.events.some(e=>e.eventType===t)',expected)
    seer.locator('#wv-chat-input').fill('Xin chào chơi thường');seer.locator('#wv-chat-submit').click();knight.locator('.wv-chat-history').get_by_text('Xin chào chơi thường',exact=False).wait_for(timeout=15000)
    if 'handoff' in case:
     # Close the real host session; restore its authenticated navigation in a fresh context.
     seed=host.evaluate('Object.fromEntries(["wv_s03_session_token","wv_s03_session_navigation"].map(k=>[k,sessionStorage.getItem(k)]))')
     was_knight=knight==host;be.close_context(contexts.pop(0))
     guest.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.room.hostId)?.online===false')
     guest.get_by_role('button',name='Tiếp nhận điều phối').click();guest.wait_for_function('WolvesLive.room.hostId===WolvesLive.profile.id&&!WolvesLive.working')
     # Reproduce the startup race without changing any actual server payload:
     # hold auxiliary feedback while the fresh authenticated board restores.
     hold="""(()=>{const original=window.fetch.bind(window);window.wvFeedbackHeld=false;let release;const gate=new Promise(r=>release=r);window.wvReleaseHandoffFeedback=release;window.fetch=async(url,opts)=>{if(String(url).includes('/feedback')){window.wvFeedbackHeld=true;await gate;}return original(url,opts);};})()"""
     c,returned=be.page_setup(browser,seed,before_live=hold);contexts.append(c);pages[0]=returned
     returned.wait_for_function('WolvesLive.connectionState==="online"&&WolvesLive.game?.mode==="NORMAL_GAMEPLAY"&&WolvesLive.room.hostId!==WolvesLive.profile.id',timeout=18000)
     try:
      returned.wait_for_function('window.wvFeedbackHeld && page==="ingame" && !titleScreenOpen')
      assert returned.evaluate('WolvesLive.localSeatToId.length===2')
      assert returned.locator('.arena-seat').count()==2
     finally:returned.evaluate('window.wvReleaseHandoffFeedback()')
     if was_knight:knight=returned
     else:seer=returned
     host=guest
    host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();seer.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"');seer.wait_for_function('!WolvesLive.working');tid=knight.evaluate('WolvesLive.profile.id');seer.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);seer.wait_for_function('(id)=>WolvesLive.selectedTarget===id',arg=tid);seer.get_by_role('button',name='Gửi / đổi phiếu').click();seer.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=tid);host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click();winner=seer
   else:winner=knight
   wid=winner.evaluate('WolvesLive.profile.id')
   for p in pages:
    p.wait_for_function('WolvesLive.game.completed===true',timeout=18000);assert p.evaluate('WolvesLive.game.winnerIds')==[wid];assert p.locator('.wv-winners').count()==1
    assert p.locator('.wv-winners').is_visible()
    assert p.locator('.wv-winners').inner_text()== 'Người chiến thắng: '+winner.evaluate('WolvesLive.profile.displayName')
    assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   guest.evaluate('WolvesLive.disconnect();WolvesLive.connect()');guest.wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed');assert guest.locator('.wv-winners').count()==1
   assert not be.LOGS,be.LOGS
   print('NORMAL_GAMEPLAY_PLAYER_JOURNEY_PASS',case,flush=True)
  finally:
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run(sys.argv[1])
