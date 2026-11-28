"""Five real human contexts, normal flags off, no role forcing."""
import pathlib,sys,requests,faulthandler,time
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(side):
 faulthandler.dump_traceback_later(60,repeat=False)
 print("E2E_STAGE",side,"setup",flush=True)
 h=requests.get(be.BASE+'/health',timeout=5).json();assert h['normalGameplay'] and not h['officialRuleTestMode'] and not h['gameIntegrationTestMode']
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(5):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'RescueRoom'+str(i));p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host=pages[0];pages[2].set_viewport_size({'width':390,'height':844});host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Năm người');host.locator('#wv-capacity').fill('5');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   for p in pages:p.wait_for_function('WolvesLive.room?.members.length===5 && WolvesLive.room.members.every(m=>m.online)')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option('s15-growth-guard-rescue')
   for p in pages:p.wait_for_function('WolvesLive.room.normalDeck==="s15-growth-guard-rescue" && !WolvesLive.working')
   assert host.locator('#wv-normal-start').is_disabled();assert 'sẵn sàng' in host.locator('#wv-start-reason').inner_text()
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
    pid=p.evaluate('WolvesLive.profile.id')
    for q in pages:q.wait_for_function('(id)=>WolvesLive.room.members.find(m=>m.id===id).ready',arg=pid)
   host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.ruleVersion==="wolvesville-official-v1.3.3" && page==="ingame"',timeout=18000)
   print("E2E_STAGE",side,"night",flush=True)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert set(roles)=={31,25,48,74,87};w,a,m,g,d=roles[48],roles[25],roles[74],roles[31],roles[87]
   for p in pages:assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length===1 && WolvesLive.game.roleComposition.length===5')
   def action(p,t,second=None):
    target=t.evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target)
    if second:p.locator('#wv-second-target').select_option(second.evaluate('WolvesLive.profile.id'))
    before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working&&WolvesLive.feedback.size>{before}')
   if side=='village':action(g,g)
   action(a,w);action(m,w);action(w,g,m);host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click()
   print("E2E_STAGE",side,"rescue",flush=True)
   for p in pages:p.wait_for_function('WolvesLive.game.phase==="WITCH_WINDOW"')
   expected={m.evaluate('WolvesLive.profile.id')} if side=='village' else {g.evaluate('WolvesLive.profile.id'),m.evaluate('WolvesLive.profile.id')}
   assert set(d.evaluate('WolvesLive.game.capabilities.find(x=>x.skillId==="official.87.rescue").eligibleTargetIds'))==expected
   for p in [w,a,m,g]:assert not p.evaluate('WolvesLive.game.capabilities.some(x=>x.skillId==="official.87.rescue")')
   if side=='village':action(d,m)
   host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt cứu người',exact=True).click()
   for p in pages:p.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"')
   for p in [g,m]:assert d.evaluate('(id)=>WolvesLive.game.players.find(p=>p.playerId===id).publicReportedDead',p.evaluate('WolvesLive.profile.id'))==(side=='wolf')
   for p,event in [(a,'SEER_AURA_OBSERVED'),(m,'ROLE_OBSERVED')]:
    p.wait_for_function('(t)=>WolvesLive.events.some(e=>e.eventType===t)',arg=event)
    for q in pages:
     if q!=p:assert not q.evaluate('(t)=>WolvesLive.events.some(e=>e.eventType===t)',event)
   print('E2E_STAGE',side,'day-vote',flush=True)
   a.locator('#wv-chat-input').fill('Năm người cùng chơi');a.locator('#wv-chat-submit').click();w.locator('.wv-chat-history').get_by_text('Năm người cùng chơi',exact=False).wait_for(timeout=15000)
   host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();voter,target=(a,w) if side=='village' else (w,a);voter.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT" && !WolvesLive.working');tid=target.evaluate('WolvesLive.profile.id');voter.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',tid);voter.get_by_role('button',name='Gửi / đổi phiếu').click();voter.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=tid);host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click()
   winners={p.evaluate('WolvesLive.profile.id') for p in ([a,g,m,d] if side=='village' else [w])}
   for p in pages:
    p.wait_for_function('WolvesLive.game.completed===true',timeout=18000);assert set(p.evaluate('WolvesLive.game.winnerIds'))==winners;assert p.locator('.wv-winners').count()==1;assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   pages[2].evaluate('WolvesLive.disconnect();WolvesLive.connect()');pages[2].wait_for_function('WolvesLive.connectionState==="online" && WolvesLive.game.completed');assert not be.LOGS,be.LOGS
   print('GROWTH_NORMAL_GUARD_RESCUE_BROWSER_PASS',side,flush=True)
  finally:
   print("E2E_STAGE",side,"cleanup",flush=True)
   be.close_contexts(contexts)
   browser.close();be.bridge.shutdown();print("E2E_STAGE",side,"cleanup-complete",flush=True)
   faulthandler.cancel_dump_traceback_later()
if __name__=='__main__':run(sys.argv[1])
