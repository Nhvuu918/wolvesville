"""Four real human contexts, normal flags off, no role forcing."""
import pathlib,sys,requests,json
import browser_s25_visual_e2e as visual
from browser_s25_visual_e2e import shot,ROOT
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run(side):
 h=requests.get(be.BASE+'/health',timeout=5).json();assert h['normalGameplay'] and not h['officialRuleTestMode'] and not h['gameIntegrationTestMode']
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(4):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'MirrorRoom'+str(i));p.emulate_media(reduced_motion='reduce');p.wait_for_function('WolvesLive.normalMode && WolvesLive.connectionState==="online"')
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('Bốn người');host.locator('#wv-capacity').fill('4');host.get_by_role('button',name='Tạo phòng',exact=True).click();host.wait_for_function('WolvesLive.room?.members.length===1');rid=host.evaluate('WolvesLive.room.id')
   for p in pages[1:]:p.evaluate('(id)=>WolvesLive.openRoom(id)',rid)
   for p in pages:p.wait_for_function('WolvesLive.room?.members.length===4 && WolvesLive.room.members.every(m=>m.online)')
   host.get_by_role('button',name='Khóa danh sách').click();host.locator('#wv-normal-deck').select_option('s26-mirror-guard')
   for p in pages:p.wait_for_function('WolvesLive.room.normalDeck==="s26-mirror-guard" && !WolvesLive.working')
   assert host.locator('#wv-normal-start').is_disabled();assert 'sẵn sàng' in host.locator('#wv-start-reason').inner_text()
   for p in pages:
    p.locator('#wv-ready').click();p.wait_for_function('WolvesLive.room.members.find(m=>m.id===WolvesLive.profile.id).ready && !WolvesLive.working')
    pid=p.evaluate('WolvesLive.profile.id')
    for q in pages:q.wait_for_function('(id)=>WolvesLive.room.members.find(m=>m.id===id).ready',arg=pid)
   host.locator('#wv-normal-start').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.mode==="NORMAL_GAMEPLAY" && WolvesLive.game.ruleVersion==="wolvesville-official-v1.3.3" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert set(roles)=={25,31,35,74};w,a,m,g=roles[35],roles[25],roles[74],roles[31]
   for p in pages:assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length===1 && WolvesLive.game.roleComposition.length===4')
   def action(p,t,second=None):
    target=t.evaluate('WolvesLive.profile.id');p.wait_for_function('!WolvesLive.working');p.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target)
    if second:p.locator('#wv-second-target').select_option(second.evaluate('WolvesLive.profile.id'))
    before=p.evaluate('WolvesLive.feedback.size');p.locator('#wv-skill-submit').click();p.wait_for_function(f'!WolvesLive.working&&WolvesLive.feedback.size>{before}')
   def phase(name):
    for p in pages:p.wait_for_function('(ph)=>WolvesLive.game.phase===ph&&!WolvesLive.working',arg=name)
   def night():
    host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click();phase('DAY_DISCUSS')
   def day():
    host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();phase('DAY_VOTE_COLLECT');host.get_by_role('button',name='Khóa phiếu và xét kết quả').click();phase('NIGHT_COLLECT')
   def captured(p,name):
    shot(p,'s26-polish',name,'self #'+str(p.evaluate('WolvesLive.game.players.find(x=>x.self).self.currentCharacterId')))
   def banner(p):
    assert p.locator('.phase-sky-banner').evaluate('(e)=>e.scrollWidth<=e.clientWidth+1 && e.scrollHeight<=e.clientHeight+1'),p.locator('.phase-sky-banner').inner_text()
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
   if side=='wolf':
    action(a,w);action(m,w);action(g,a);action(w,m);night();a.wait_for_function('WolvesLive.events.filter(e=>e.eventType==="SEER_AURA_OBSERVED").at(-1)?.payload.verdict==="Ác"');day();action(a,w);action(w,g);host.get_by_role('button',name='Kết thúc lượt đêm',exact=True).click();
    for p in pages:
     p.wait_for_function('WolvesLive.game.completed&&!WolvesLive.working');assert p.evaluate('WolvesLive.game.winnerIds')==[w.evaluate('WolvesLive.profile.id')];assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
    a.wait_for_function('WolvesLive.events.filter(e=>e.eventType==="SEER_AURA_OBSERVED").length===2 && WolvesLive.events.filter(e=>e.eventType==="SEER_AURA_OBSERVED").at(-1)?.payload.verdict==="Ác"');assert not be.LOGS,be.LOGS;print('S26_MIRROR_NORMAL_BROWSER_PASS wolf',flush=True);return
   a.set_viewport_size({'width':390,'height':844});banner(a);captured(a,'mobile-night')
   action(m,w);action(g,a);action(w,m);night()
   m.wait_for_function('WolvesLive.events.some(e=>e.eventType==="ROLE_OBSERVED"&&e.payload.characterId===35)');assert not a.evaluate('WolvesLive.events.some(e=>e.eventType==="ROLE_OBSERVED")');banner(a);captured(a,'mobile-day');a.set_viewport_size({'width':1366,'height':768})
   day();action(g,g);action(w,g);night();assert not g.evaluate('(id)=>WolvesLive.game.players.find(p=>p.playerId===id).publicReportedDead',g.evaluate('WolvesLive.profile.id'));day()
   target=w.evaluate('WolvesLive.profile.id');a.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target)
   for theme in ['basiclight','cream','sage']:
    a.evaluate('(t)=>setWolvesTheme(t)',theme);a.wait_for_function('(t)=>document.body.dataset.theme===t',arg=theme)
    vals=a.locator('.arena-seat').evaluate_all("els=>{function L(c){const a=c.match(/[\\d.]+/g).slice(0,3).map(x=>{const t=Number(x)/255;return t<=.04045?t/12.92:((t+.055)/1.055)**2.4});return .2126*a[0]+.7152*a[1]+.0722*a[2]}return els.map(e=>{let f=getComputedStyle(e.querySelector('.arena-seat-name')).color,b=getComputedStyle(e).backgroundColor,l=[L(f),L(b)].sort((a,b)=>b-a);return {foreground:f,background:b,ratio:(l[0]+.05)/(l[1]+.05),dead:e.classList.contains('wv-eliminated-seat'),selected:e.getAttribute('aria-pressed')}})}")
    print('S26_CONTRAST',theme,json.dumps(vals),flush=True);assert all(v['ratio']>=4.5 for v in vals),vals;captured(a,theme+'-hud')
   a.evaluate("setWolvesTheme('moon')")
   action(a,w);night();a.wait_for_function('WolvesLive.events.filter(e=>e.eventType==="SEER_AURA_OBSERVED").at(-1)?.payload.verdict==="Thiện"');captured(a,'mirror-first-aura');assert not w.evaluate('WolvesLive.events.some(e=>e.eventType==="SEER_AURA_OBSERVED")');day();action(a,w);night();a.wait_for_function('WolvesLive.events.filter(e=>e.eventType==="SEER_AURA_OBSERVED").at(-1)?.payload.verdict==="Ác"');captured(a,'mirror-second-aura');host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click();phase('DAY_VOTE_COLLECT');a.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target);a.get_by_role('button',name='Gửi / đổi phiếu').click();a.wait_for_function('(id)=>!WolvesLive.working&&WolvesLive.game.voting.ownBallot?.targetId===id',arg=target);host.get_by_role('button',name='Khóa phiếu và xét kết quả').click()
   for p in pages:
    p.wait_for_function('WolvesLive.game.completed&&!WolvesLive.working');assert set(p.evaluate('WolvesLive.game.winnerIds'))=={q.evaluate('WolvesLive.profile.id') for q in [a,g,m]};assert p.evaluate('!WolvesLive.notice.includes("Phiếu của bạn đã được ghi nhận")');assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   captured(a,'endgame');a.get_by_role('button',name='Kiểm tra Replay',exact=True).click();a.wait_for_function('WolvesLive.notice.includes("Lịch sử ván chơi đã được đồng bộ")');captured(a,'replay');a.evaluate('WolvesLive.disconnect();WolvesLive.connect()');a.wait_for_function('WolvesLive.connectionState==="online"&&WolvesLive.game.completed');assert not be.LOGS,be.LOGS
   for entry in visual.shots:entry['scenario']='normal mirror [25,31,35,74]'
   (ROOT/'s26-mirror-captures.json').write_text(json.dumps(visual.shots,ensure_ascii=False,indent=2))
   print('S26_MIRROR_NORMAL_BROWSER_PASS',flush=True)
  finally:
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run(sys.argv[1])
