"""S06 real UI E2E: two Chromium contexts + third actual HTTP account;
Night -> Day -> Vote -> official Peace Wolf #79 cancel -> next Night. No mocks.
Uses existing sandbox HTTP/WS bridge only where Chromium loopback is blocked.
"""
import pathlib,sys,uuid,requests
from playwright.sync_api import sync_playwright
import browser_e2e as be

def api(method,path,token=None,body=None):
 r=requests.request(method,be.BASE+path,headers={**({'Authorization':'Bearer '+token} if token else {}),'Content-Type':'application/json'},json=body,timeout=15)
 data=r.json()
 if r.status_code>=400:raise AssertionError((r.status_code,data))
 return data

def extra_user():
 username='s06third'+uuid.uuid4().hex[:14];password='S06BrowserTestSecure!'
 api('POST','/api/auth/register',body={'username':username,'password':password})
 return api('POST','/api/auth/login',body={'username':username,'password':password})

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  ca,pa=be.page_setup(browser);cb,pb=be.page_setup(browser)
  try:
   alice=be.register(pa,'S06Alice');bob=be.register(pb,'S06Bob');third=extra_user()
   pa.evaluate("openVillagePanel('create','well')")
   pa.locator('#wv-room-name').fill('Sprint 06 Chu ky Ngay Dem')
   pa.locator('#wv-capacity').fill('3')
   pa.locator('.village-create-form button[type=submit]').click()
   pa.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   roomid=pa.evaluate('WolvesLive.room.id')
   pb.evaluate('(id)=>WolvesLive.openRoom(id)',roomid)
   pb.wait_for_function('WolvesLive.room?.members?.length===2',timeout=12000)
   api('POST',f'/api/rooms/{roomid}/join',third['token'],{})
   pa.wait_for_function('WolvesLive.room?.members?.length===3',timeout=12000)
   pa.evaluate('WolvesLive.roomLock(true)');pa.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=12000)
   pa.evaluate("openVillagePanel('live-room','directory')")
   pa.wait_for_selector('#wv-test-deck',timeout=10000)
   pa.locator('#wv-test-deck').select_option('peace')
   pa.get_by_role('button',name='Bắt đầu lượt chơi thử').click()
   pa.wait_for_function('WolvesLive.game!==null&&page==="ingame"',timeout=16000)
   pb.wait_for_function('WolvesLive.game!==null',timeout=16000)
   gid=pa.evaluate('WolvesLive.gameId')
   participants=[(alice,pa.evaluate('WolvesLive.token'),pa),(bob,pb.evaluate('WolvesLive.token'),pb),(third['profile'],third['token'],None)]
   byrole={}
   for profile,token,page in participants:
    snap=api('GET',f'/api/games/{gid}',token)['game']
    who=next(p for p in snap['players'] if p['playerId']==profile['id'])
    byrole[who['self']['currentCharacterId']]=(profile,token,page)
    assert len([p for p in snap['players'] if 'self' in p])==1
   assert set(byrole)=={25,74,79}
   print('S06_BROWSER_PASS: UI room host selected official 3-seat peace-wolf deck; private role projections')
   pa.evaluate('WolvesLive.resolve()')
   pa.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=16000)
   pb.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=16000)
   pa.evaluate('WolvesLive.openVote()')
   pa.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"',timeout=16000)
   pb.wait_for_function('WolvesLive.game.phase==="DAY_VOTE_COLLECT"',timeout=16000)
   print('S06_BROWSER_PASS: night resolution -> dawn -> vote intake, two realtime clients')
   # One regular private ballot, must never be projected to the other player.
   candidate=byrole[25][0]['id']
   voter=byrole[74]
   if voter[2] is not None:
    voter[2].evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',candidate)
    voter[2].evaluate('WolvesLive.submitVote()')
    voter[2].wait_for_function('WolvesLive.game.voting?.ownBallot!==undefined',timeout=12000)
   else:
    api('POST',f'/api/games/{gid}/votes',voter[1],{'targetId':candidate,'ballotId':'s06-browser-vote-01','idempotencyKey':'s06-browser-votekey'})
   wolf=byrole[79];target=byrole[25][0]['id']
   if wolf[2] is not None:
    wolf[2].evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target)
    wolf[2].evaluate('WolvesLive.submitSkill()')
    wolf[2].wait_for_function('WolvesLive.feedback.size>0',timeout=12000)
    assert 'Bạn đã soi thấy' not in wolf[2].locator('#wv-feedback').inner_text()
   else:
    api('POST',f'/api/games/{gid}/actions',wolf[1],{'actionId':'s06-browser-action-79','idempotencyKey':'s06-browser-idem-79','skillId':'official.79.cancel-vote-reveal','targetIds':[target]})
   assert api('GET',f'/api/games/{gid}',byrole[25][1])['game']['voting'].get('ownBallot') is None
   print('S06_BROWSER_PASS: server accepted private ballot and official #79 skill; no early disclosure')
   pa.evaluate('WolvesLive.resolve()')
   pa.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT" && WolvesLive.game.round===2',timeout=16000)
   pb.wait_for_function('WolvesLive.game.phase==="NIGHT_COLLECT" && WolvesLive.game.round===2',timeout=16000)
   for role in (25,74,79):
    profile,token,page=byrole[role]
    events=api('GET',f'/api/games/{gid}/events',token)['events']
    assert any(e['eventType']=='VOTING_CANCELLED' for e in events)
    assert any(e['eventType']=='ROLE_OBSERVED' for e in events)==(role==79)
   assert api('GET',f'/api/games/{gid}/replay',alice['token'] if 'token' in alice else pa.evaluate('WolvesLive.token'))['replay']['verified']
   pa.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   pa.wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
   assert pa.evaluate('WolvesLive.game.round')==2
   pa.evaluate("go('roles')")
   pa.wait_for_function('document.getElementById("codexCount")?.textContent==="97 nhân vật"',timeout=15000)
   assert not be.LOGS,be.LOGS[:5]
   print('S06_BROWSER_PASS: PH-02 cancels vote, returns to next night; replay, privacy, reconnect, Codex intact')
  finally:
   be.bridge.shutdown();be.close_context(ca);be.close_context(cb);browser.close()

if __name__=='__main__':
 try:run()
 except Exception as e:
  print('S06_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:6]);sys.exit(1)
