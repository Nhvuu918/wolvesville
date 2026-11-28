"""Owner feedback: real browser clicks, authoritative role wheel, inspection and chat."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw);contexts=[];pages=[]
  try:
   for i in range(3):
    c,p=be.page_setup(browser);contexts.append(c);pages.append(p);be.register(p,'UX15'+str(i))
   host=pages[0];host.evaluate("openVillagePanel('create','well')");host.locator('#wv-room-name').fill('UX thật');host.locator('#wv-capacity').fill('3');host.locator('.village-create-form button[type=submit]').click()
   host.wait_for_function('WolvesLive.room?.members?.length===1');rid=host.evaluate('WolvesLive.room.id')
   for i,p in enumerate(pages[1:],2):
    p.evaluate('(id)=>WolvesLive.openRoom(id)',rid);p.wait_for_function(f'WolvesLive.room?.members?.length==={i}')
   host.wait_for_function('WolvesLive.room?.members?.length===3');host.evaluate('WolvesLive.roomLock(true)');host.wait_for_function('WolvesLive.room.status==="LOCKED"');host.evaluate("openVillagePanel('live-room','directory')");host.locator('#wv-test-deck').select_option('s15-sedative');host.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="NIGHT_COLLECT" && page==="ingame"',timeout=18000)
   roles={p.evaluate('WolvesLive.game.players.find(x=>x.playerId===WolvesLive.profile.id).self.currentCharacterId'):p for p in pages};assert sorted(roles)==[25,74,87]
   names={25:'Tiên Tri',74:'Tiên Tri Huyền Bí',87:'Dược Sĩ'}
   for role,p in roles.items():
    assert p.locator('#wv-role-composition .wv-composition-role').count()==3
    assert p.evaluate('WolvesLive.game.players.filter(x=>x.self).length')==1
    assert p.locator('#wv-role-wheel .wv-wheel-result strong').inner_text()==names[role]
    assert p.locator('#wv-role-wheel .wv-wheel-disc img').count()==3
    assert p.locator('#wv-skill-submit').is_disabled()
    assert p.locator('#wv-chat-input').is_disabled()
    assert p.locator('#wv-chat-submit').is_disabled()
   host.wait_for_function('!WolvesLive.working');assert host.get_by_role('button',name='Kết thúc lượt đêm thử nghiệm').is_enabled()
   seer=roles[25];seer.locator('#wv-role-composition .wv-composition-role summary').first.click();assert seer.locator('#wv-role-composition .wv-composition-role').first.get_attribute('open') is not None
   def choose(p,target,keyboard=False):
    pid=roles[target].evaluate('WolvesLive.profile.id');idx=p.evaluate('(id)=>WolvesLive.localSeatToId.indexOf(id)',pid);seat=p.locator('.arena-seat').nth(idx)
    if keyboard:seat.focus();seat.press('Enter')
    else:seat.click()
    assert p.evaluate('WolvesLive.selectedTarget')==pid
   def act(role,target,keyboard=False):
    p=roles[role];choose(p,target,keyboard);p.locator('#wv-skill-submit').click();p.wait_for_function('!WolvesLive.working && WolvesLive.feedback.size===1',timeout=15000);assert p.locator('#wv-skill-submit').count()==0
   act(25,87,True);act(74,25);act(87,25);print('UX_ACTIONS_PASS',flush=True)
   host.get_by_role('button',name='Kết thúc lượt đêm thử nghiệm').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_DISCUSS"',timeout=16000)
   seer.get_by_text('Bạn đã soi thấy hào quang: Thiện.',exact=True).wait_for(timeout=12000);roles[74].get_by_text('Bạn đã soi thấy: Tiên Tri.',exact=True).wait_for(timeout=12000)
   assert roles[87].get_by_text('Bạn đã soi thấy',exact=False).count()==0
   assert seer.get_by_text('Bạn đã soi thấy: Dược Sĩ.',exact=True).count()==0
   assert seer.evaluate('[...WolvesLive.feedback.values()].every(f=>f.resultType!=="ROLE_INFORMATION" && !Object.hasOwn(f.resultPayload||{},"characterId"))')
   assert seer.locator('#wv-chat-input').is_disabled();assert seer.locator('#wv-chat-submit').is_disabled();assert seer.get_by_text('Bạn đang bị câm trong chat công khai.').count()==1
   sender=roles[74];sender.locator('#wv-chat-input').fill('Xin chào cả làng');sender.locator('#wv-chat-submit').click()
   for p in pages:p.locator('.wv-chat-history').get_by_text('Xin chào cả làng',exact=False).wait_for(timeout=12000)
   assert sender.locator('.wv-chat-history').get_by_text('Xin chào cả làng',exact=False).count()==1
   assert sender.get_by_text('Đã gửi tin nhắn.',exact=True).count()==1
   sender.set_viewport_size({'width':390,'height':844});sender.locator('#wv-chat-input').fill('Tin nhắn mobile');sender.locator('#wv-chat-submit').click();seer.locator('.wv-chat-history').get_by_text('Tin nhắn mobile',exact=False).wait_for(timeout=12000)
   sender.evaluate('WolvesLive.disconnect();WolvesLive.connect()');sender.wait_for_function('WolvesLive.connectionState==="online"');sender.locator('.wv-chat-history').get_by_text('Tin nhắn mobile',exact=False).wait_for(timeout=12000)
   host.wait_for_function('!WolvesLive.working');host.get_by_role('button',name='Mở lượt ghi nhận phiếu').click()
   for p in pages:p.wait_for_function('WolvesLive.game?.phase==="DAY_VOTE_COLLECT"')
   assert seer.get_by_text('Bạn không còn quyền bỏ phiếu.').count()==1
   assert sender.locator('#wv-chat-input').is_disabled()
   choose(sender,87);sender.get_by_role('button',name='Gửi / đổi phiếu').click();sender.wait_for_function('!WolvesLive.working && !!WolvesLive.game.voting?.ownBallot');sender.get_by_role('button',name='Phiếu trắng').click();sender.wait_for_function('!WolvesLive.working && WolvesLive.game.voting?.ownBallot?.targetId===""')
   for p in pages:assert p.evaluate('async()=>(await WolvesLive.request(`/api/games/${WolvesLive.gameId}/replay`)).replay.verified')
   assert not be.LOGS,be.LOGS[:10]
   sender.screenshot(path=str(pathlib.Path(__file__).resolve().parents[1]/'reports'/'s15-ux'/'mobile-gameplay.png'),full_page=True)
   print('S15_UX_BROWSER_PASS authoritative role results, composition, wheel, keyboard, clicks, chat, mute, reconnect, mobile, vote change, replay',flush=True)
  except Exception:
   for i,p in enumerate(pages):
    try:
     print('UX_DIAGNOSTIC',i,p.evaluate('({phase:WolvesLive.game?.phase,revision:WolvesLive.game?.revision,working:WolvesLive.working,notice:WolvesLive.notice,chat:WolvesLive.chatNotice,role:WolvesLive.game?.players?.find(x=>x.self)?.self?.currentCharacterId})'),flush=True);p.screenshot(path=str(pathlib.Path(__file__).resolve().parents[1]/'reports'/'s15-ux'/f'failure-{i}.png'))
    except Exception as ex:print('DIAGNOSTIC_FAILURE',repr(ex),flush=True)
   raise
  finally:
   for c in contexts:be.close_context(c)
   browser.close();be.bridge.shutdown()
if __name__=='__main__':run()
