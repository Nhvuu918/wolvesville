"""Interactive village-map E2E: genuine pointer, keyboard, touch and actual HTTP join.
Two or more independently authenticated clients, REAL server, no mocked API responses.
"""
import pathlib,sys,uuid,os
from playwright.sync_api import sync_playwright
import browser_e2e as be
ROOT=pathlib.Path(__file__).resolve().parents[1]

def new_touch_page(browser):
    if be.DIRECT:
        ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
        page=ctx.new_page();page.on('pageerror',lambda e:be.LOGS.append(str(e)))
        page.goto(be.BASE,wait_until='domcontentloaded');page.wait_for_function('typeof WolvesLive!=="undefined"')
        return ctx,page
    ctx=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True)
    ctx.expose_function('__wv_fetch',be.fetch_bridge);ctx.expose_function('__wv_ws_open',be.bridge.open)
    ctx.expose_function('__wv_ws_send',be.bridge.send);ctx.expose_function('__wv_ws_poll',be.bridge.poll)
    ctx.expose_function('__wv_ws_close',be.bridge.close)
    page=ctx.new_page();page.on('pageerror',lambda e:be.LOGS.append(str(e)))
    page.set_content(be.HTML.replace('<head>','<head><base href="https://wolvesville.codex.test/">',1),wait_until='domcontentloaded')
    for f in ('style.css','integration.css','codex.css','player-ux.css'):
        page.add_style_tag(content=(be.ROOT/f).read_text())
    page.evaluate(be.BRIDGE_JS)
    for f in ('app.js','codex-data.js','player-ux.js','integration.js'):
        page.add_script_tag(content=(be.ROOT/f).read_text())
    page.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
    page.wait_for_function('typeof WolvesLive!=="undefined"')
    return ctx,page

def click_region(page,selector,location):
    obj=page.locator(selector);obj.wait_for(state='visible')
    bb=obj.bounding_box()
    assert bb and bb['width']>=70 and bb['height']>=44,(location,bb)
    if location=='center':x,y=bb['x']+bb['width']/2,bb['y']+bb['height']/2
    elif location=='icon':
        ic=obj.locator('.village-pin-icon').bounding_box();x,y=ic['x']+ic['width']/2,ic['y']+ic['height']/2
    elif location=='label':
        ic=obj.locator('.hotspot-info strong').bounding_box();x,y=ic['x']+ic['width']/2,ic['y']+ic['height']/2
    else:x,y=bb['x']+bb['width']-7,bb['y']+bb['height']-7
    actual=page.evaluate('([x,y])=>document.elementFromPoint(x,y)?.closest("button")?.id',[x,y])
    assert actual==selector.lstrip('#'),(location,actual)
    page.mouse.click(x,y)


def run():
    with sync_playwright() as pw:
        kw={'headless':True,'args':['--no-sandbox']}
        if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():kw['executable_path']='/usr/bin/chromium'
        browser=pw.chromium.launch(**kw)
        ca,pa=be.page_setup(browser);cb,pb=be.page_setup(browser)
        cm=pm=None
        try:
            ua=be.register(pa,'MapHost');ub=be.register(pb,'MapGuest')
            for page in (pa,pb):page.wait_for_function('WolvesLive.connectionState==="online"',timeout=15000)
            pa.evaluate("openVillagePanel('create','well')")
            room_name='Rừng Đêm '+uuid.uuid4().hex[:6]
            pa.locator('#wv-room-name').fill(room_name);pa.locator('#wv-capacity').fill('2')
            pa.locator('.village-create-form button[type=submit]').click()
            pa.wait_for_function('WolvesLive.room!==null',timeout=12000)
            roomid=pa.evaluate('WolvesLive.room.id')
            pb.evaluate('WolvesLive.refreshRooms()')
            selector='#villagePin-room-'+roomid
            pb.locator(selector).wait_for(state='visible',timeout=10000)
            
            for point in ('center','label','icon','blank'):
                pb.evaluate("if(villagePanel)closeVillagePanel()")
                click_region(pb,selector,point)
                pb.wait_for_function('(id)=>villagePanel?.kind==="preview-room"&&WolvesLive.previewRoomId===id',arg=roomid,timeout=4000)
                assert room_name in pb.locator('#villageDrawer').inner_text(),point
                assert pb.evaluate('WolvesLive.room') is None,'Preview unexpectedly joined a room'
                assert pb.locator('#wv-preview-join').is_enabled()
            pb.screenshot(path=str(ROOT/'reports'/'final_lobby_room_preview.png'))
            print('PASS Lobby pointer: center/label/icon/padding each opens correct room details in ONE click without joining')
            pb.evaluate('closeVillagePanel()')
            # use full marker focus: Enter and Space work as native button semantics
            pb.locator(selector).focus();pb.keyboard.press('Enter')
            pb.wait_for_function('villagePanel?.kind==="preview-room"')
            pb.evaluate('closeVillagePanel()')
            pb.locator(selector).focus();pb.keyboard.press('Space')
            pb.wait_for_function('villagePanel?.kind==="preview-room"')
            print('PASS Lobby keyboard: Enter and Space activate the semantic room marker')
            pb.evaluate('closeVillagePanel()')
            bb=pb.locator(selector).bounding_box();pb.mouse.click(bb['x']+bb['width']/2,bb['y']+bb['height']/2,click_count=2)
            assert pb.evaluate('WolvesLive.room') is None
            print('PASS Lobby repeated click: double-activation never changes room membership')
            # Locks visible through real GET, and only a deliberate Join changes membership.
            pa.evaluate('WolvesLive.roomLock(true)')
            pa.wait_for_function('WolvesLive.room?.status==="LOCKED"')
            pb.evaluate('WolvesLive.refreshRooms(false)')
            pb.evaluate('(id)=>WolvesLive.previewRoom(id)',roomid)
            pb.wait_for_function('document.getElementById("wv-preview-join")?.disabled===true')
            assert 'Đã khóa' in pb.locator('#villageDrawer').inner_text()
            pa.evaluate('WolvesLive.roomLock(false)')
            pa.wait_for_function('WolvesLive.room?.status==="WAITING"')
            pb.evaluate('WolvesLive.refreshRooms(false)')
            pb.evaluate('WolvesLive.refreshUI()')
            assert pb.locator('#wv-preview-join').is_enabled()
            print('PASS Lobby locked room: visible but Join disabled; unlock refresh restores action')
            pb.locator('#wv-preview-join').click()
            pb.wait_for_function('WolvesLive.room?.members?.length===2',timeout=15000)
            pa.wait_for_function('WolvesLive.room?.members?.length===2',timeout=15000)
            assert pb.evaluate('WolvesLive.room.id')==roomid
            print('PASS Lobby join: explicit Join mutates backend membership and both WebSocket clients synchronize')
            # third client sees full room; original guests retain rights.
            cm,pm=new_touch_page(browser)
            um=be.register(pm,'MapMobile')
            pm.evaluate('WolvesLive.refreshRooms()')
            mobile=pm.locator(selector);mobile.wait_for(state='visible',timeout=12000)
            mobile.scroll_into_view_if_needed()
            bb=mobile.bounding_box();assert bb and bb['height']>=44
            mobile.tap()
            pm.wait_for_function('villagePanel?.kind==="preview-room"',timeout=7000)
            assert pm.locator('#wv-preview-join').is_disabled()
            assert float(pm.locator('#wv-preview-join').evaluate('(el)=>getComputedStyle(el).opacity'))<.7
            assert pm.evaluate('WolvesLive.room') is None
            size=pm.evaluate('({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth})')
            assert size['scroll']<=size['client']+4,size
            pm.screenshot(path=str(ROOT/'reports'/'final_lobby_mobile_preview.png'))
            print('PASS Lobby mobile tap: one tap opens FULL room, Join disabled, no horizontal overflow')
            # Stable mapping after an update and no wrong target for a marker.
            oldid=pm.evaluate('(id)=>document.querySelector(`[data-room-id="${id}"]`)?.id',roomid)
            pm.evaluate('WolvesLive.refreshRooms()')
            newid=pm.evaluate('(id)=>document.querySelector(`[data-room-id="${id}"]`)?.id',roomid)
            assert oldid==newid==selector[1:]
            assert not be.LOGS,be.LOGS[:4]
            print('PASS Lobby stable marker identity after refresh; no page JavaScript errors')
        finally:
            be.bridge.shutdown()
            for context in (ca,cb,cm):
                if context:be.close_context(context)
            browser.close()

if __name__=='__main__':
    try:run()
    except Exception as e:
        import traceback;traceback.print_exc();print('BROWSER_LOBBY_FAILED',repr(e),'PAGE_ERRORS',be.LOGS[:5]);sys.exit(1)
