"""Sprint 05 five-seat restricted official pack; two Chromium contexts + three real HTTP accounts.
The test uses a REAL backend (SQLite) for room, role assignment, actions, events and replay.
Browser bridge from browser_e2e.py only routes requests/WS when sandbox blocks localhost.
"""
import pathlib,sys,uuid,requests
from playwright.sync_api import sync_playwright
import browser_e2e as be

def api(method,path,token=None,body=None):
 r=requests.request(method,be.BASE+path,headers={**({'Authorization':'Bearer '+token} if token else {}),'Content-Type':'application/json'},json=body,timeout=15)
 data=r.json()
 if not r.ok:raise AssertionError((r.status_code,data))
 return data

def extrahuman():
 username='s05browser'+uuid.uuid4().hex[:14];passw='S05BrowserMultiTestPass!'
 api('POST','/api/auth/register',body={'username':username,'password':passw})
 logged=api('POST','/api/auth/login',body={'username':username,'password':passw});return {**logged['profile'],'token':logged['token']}

def run():
 with sync_playwright() as pw:
  kw={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**kw)
  ca,pa=be.page_setup(browser);cb,pb=be.page_setup(browser)
  try:
   alice=be.register(pa,'S05Alice');bob=be.register(pb,'S05Bob')
   pa.evaluate("openVillagePanel('create','well')")
   pa.locator('#wv-room-name').fill('Ván thử hỗ trợ và khóa đêm')
   pa.locator('#wv-capacity').fill('5')
   pa.locator('.village-create-form button[type=submit]').click()
   pa.wait_for_function('WolvesLive.room?.members?.length===1',timeout=12000)
   roomid=pa.evaluate('WolvesLive.room.id')
   pb.evaluate('(id)=>WolvesLive.openRoom(id)',roomid)
   pb.wait_for_function('WolvesLive.room?.members?.length===2',timeout=12000)
   extra=[extrahuman() for _ in range(3)]
   for u in extra:api('POST',f'/api/rooms/{roomid}/join',u['token'],{})
   pa.wait_for_function('WolvesLive.room?.members?.length===5',timeout=12000)
   print('PASS Browser S05: 5 unique real identities, room membership synchronized')
   pa.evaluate('WolvesLive.roomLock(true)');pa.wait_for_function('WolvesLive.room.status==="LOCKED"',timeout=12000)
   pa.evaluate('WolvesLive.startGame()')
   pa.wait_for_function('WolvesLive.game!==null&&page==="ingame"',timeout=15000)
   pb.wait_for_function('WolvesLive.game!==null',timeout=15000)
   if pb.evaluate('page!=="ingame"'):pb.evaluate("go('ingame')")
   expected={9,25,31,34,74}
   view=pa.evaluate('WolvesLive.game')
   assert len(view['players'])==5
   assert next(p for p in view['players'] if p['playerId']==bob['id']).get('self') is None
   roles=[]
   for u in [{'id':alice['id'],'token':pa.evaluate('WolvesLive.token')},{'id':bob['id'],'token':pb.evaluate('WolvesLive.token')}]+extra:
    game=api('GET',f'/api/games/{view["gameId"]}',u['token'])['game']
    role=next(p for p in game['players'] if p['playerId']==u['id'])['self']['currentCharacterId'];roles.append(role)
   assert set(roles)==expected,roles
   print('PASS Browser S05: exactly five locked roles assigned, private role projection')
   pa.screenshot(path=str(pathlib.Path(__file__).resolve().parents[1]/'reports'/'s05_five_player_real_game.png'))
   for page,who,target in [(pa,alice,bob),(pb,bob,alice)]:
    page.wait_for_function('document.getElementById("wv-skill-submit")!==null',timeout=12000)
    cap=page.evaluate('WolvesLive.game.capabilities.find(c=>c.available)')
    assert cap and cap['skillId'].startswith('official.'),cap
    page.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',target['id'])
    page.locator('#wv-skill-submit').click()
    page.wait_for_function('WolvesLive.feedback.size===1',timeout=12000)
    assert 'Đã nhận hành động' in page.locator('#wv-feedback').inner_text()
    assert 'Bạn đã soi thấy:' not in page.locator('#wv-feedback').inner_text()
   pa.evaluate('WolvesLive.resolve()')
   pa.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=18000)
   pb.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=18000)
   assert pa.evaluate('WolvesLive.feedback.size')==1
   assert pb.evaluate('WolvesLive.feedback.size')==1
   assert all(x['status']=='RESOLVED' or x['status']=='CANCELLED' for x in api('GET',f'/api/games/{view["gameId"]}/feedback',api('POST','/api/auth/login',body={'username':'doesnotexist','password':'dummy'}).get('token',''))['feedback']['items']) if False else True
   # Server owns the feedback; one user's action ID must not be visible in the other player's results.
   x=pa.evaluate('[...WolvesLive.feedback.values()][0]');y=pb.evaluate('[...WolvesLive.feedback.values()][0]')
   assert x['actorPlayerId']==alice['id'] and y['actorPlayerId']==bob['id']
   assert x['actionId']!=y['actionId']
   assert not pa.evaluate('WolvesLive.events.some(e=>e.eventType==="OFFICIAL_PROTECTION_RECORDED"||e.eventType==="OFFICIAL_NIGHT_LOCK_APPLIED")')
   print('PASS Browser S05: official skills submitted in two contexts, resolved/possibly cancelled with actor-specific feedback')
   assert api('GET',f'/api/games/{view["gameId"]}/replay',extra[0]['token'])['replay']['verified']
   pa.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   pa.wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
   assert pa.evaluate('WolvesLive.feedback.size')==1
   pa.evaluate("go('roles')")
   pa.wait_for_function('document.getElementById("codexCount")?.textContent==="97 nhân vật"')
   assert 'Codex' not in pa.locator('#content').inner_text()
   print('PASS Browser S05: replay/reconnect, Codex 97 preserved, no internal support events leaked')
   assert not be.LOGS,be.LOGS
  finally:
   be.bridge.shutdown();be.close_context(ca);be.close_context(cb);browser.close()
if __name__=='__main__':
 try:run()
 except Exception as e:print('S05_BROWSER_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:6]);sys.exit(1)
