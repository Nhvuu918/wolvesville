"""Sprint 03 browser DOM E2E against a real local HTTP/WS backend.
This sandbox's Chromium blocks loopback navigation (ERR_BLOCKED_BY_ADMINISTRATOR),
therefore transport is bridged by Python to the *actual* running backend.
On a developer Mac browsers can load http://127.0.0.1:3212 directly.
The bridge does not mock responses or WebSocket events.
"""
import os, pathlib, re, sys, threading, queue, time, uuid, asyncio, weakref, functools, faulthandler
# Diagnostic only: do not change the runner deadline or swallow errors.
faulthandler.enable()
from urllib.parse import urlsplit
import requests, websocket
from playwright.sync_api import sync_playwright
BASE=os.getenv('WV_E2E_SERVER','http://127.0.0.1:3235')
DIRECT=os.getenv('WV_E2E_DIRECT','0')=='1'  # macOS: native HTTP and WebSocket, no transport bridge
ROOT=pathlib.Path(__file__).resolve().parents[1]/'frontend'
LOGS=[]
class Bridge:
 def __init__(self):self.lock=threading.Lock();self.sockets={}
 def open(self,_):
  ident=str(uuid.uuid4());q=queue.Queue();stopping=threading.Event();ended=threading.Event()
  ws=websocket.create_connection(BASE.replace('http:','ws:')+'/ws',origin=BASE,timeout=5)
  # The timeout above bounds the handshake only. A healthy idle socket must
  # not silently lose its reader; shutdown explicitly wakes the blocking recv.
  ws.settimeout(None)
  def reader():
   try:
    while not stopping.is_set():
     frame=ws.recv()
     if not frame:break
     q.put(frame)
   except Exception as e:
    if not stopping.is_set():print('BRIDGE_READER_FAILURE',type(e).__name__,str(e),flush=True)
   finally:ended.set()
  thread=threading.Thread(target=reader,daemon=True)
  with self.lock:self.sockets[ident]=(ws,q,stopping,ended,thread)
  thread.start()
  return ident
 def send(self,ident,payload):
  with self.lock:item=self.sockets.get(ident)
  if not item or item[3].is_set():return False
  try:item[0].send(payload);return True
  except websocket.WebSocketConnectionClosedException:return False
 def poll(self,ident):
  with self.lock:item=self.sockets.get(ident)
  if not item:return {'frames':[],'closed':True}
  result=[]
  while len(result)<50:
   try:result.append(item[1].get_nowait())
   except queue.Empty:break
  return {'frames':result,'closed':item[3].is_set() and item[1].empty()}
 def close(self,ident):
  with self.lock:item=self.sockets.pop(ident,None)
  if item:
   ws,_,stopping,_,thread=item;stopping.set()
   try:ws.abort()
   except OSError:pass # socket already closed by peer
   thread.join(timeout=3);ws.shutdown()
   if thread.is_alive():raise RuntimeError('Bridge reader failed to stop')
 def shutdown(self):
  with self.lock:ids=list(self.sockets)
  for ident in ids:self.close(ident)
bridge=Bridge()
def fetch_bridge(u,options=None):
 options=options or {}
 url=(BASE+u) if u.startswith('/') else u
 r=requests.request(options.get('method','GET'),url,headers=options.get('headers',{}),data=options.get('body'),timeout=12)
 return {'status':r.status_code,'body':r.text,'headers':{'Content-Type':r.headers.get('Content-Type','application/json')}}
HTML=(ROOT/'index.html').read_text()
HTML=re.sub(r'<script src="(?:app|codex-data|player-ux|integration|immersive|fate-wheel)\.js"></script>','',HTML)
HTML=re.sub(r'<link\s+[^>]+>','',HTML)
BRIDGE_JS="""() => {
 const m=()=>{const v=new Map();return {getItem:k=>v.has(k)?v.get(k):null,setItem:(k,s)=>v.set(k,String(s)),removeItem:k=>v.delete(k),clear:()=>v.clear()}};
 if(!crypto.randomUUID)crypto.randomUUID=()=>('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx').replace(/[xy]/g,c=>{const v=crypto.getRandomValues(new Uint8Array(1))[0]&15;return (c==='x'?v:((v&3)|8)).toString(16)});
 Object.defineProperty(window,'localStorage',{configurable:true,value:m()});
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:m()});
 const sockets=new Set(), pending=new Set();let disposing=false;
 const track=p=>{pending.add(p);p.then(()=>pending.delete(p),()=>pending.delete(p));return p};
 window.fetch=async(url,opts={})=>{if(disposing)throw new Error('Browser test context disposing');const v=await track(window.__wv_fetch(String(url),{method:opts.method||'GET',headers:opts.headers||{},body:opts.body}));return new Response(v.body,{status:v.status,headers:v.headers})};
 window.WebSocket=class {
  constructor(url){this.readyState=0;this.handlers=new Map();this.id=null;if(disposing){this.readyState=3;return;}sockets.add(this);
   track(window.__wv_ws_open(String(url))).then(id=>{this.id=id;if(this.readyState===3||disposing){track(window.__wv_ws_close(id));return;}this.readyState=1;this.fire('open',{});this.schedule();
   }).catch(e=>{this.fire('error',{error:e});this.close()});}
  addEventListener(type,fn){if(!this.handlers.has(type))this.handlers.set(type,[]);this.handlers.get(type).push(fn)}
  fire(type,evt){for(const cb of this.handlers.get(type)||[])cb(evt)}
  schedule(){if(this.readyState===1&&!disposing)this.timer=setTimeout(()=>this.poll(),65)}
  async poll(){if(this.readyState!==1||disposing)return;try{const result=await track(window.__wv_ws_poll(this.id));if(this.readyState!==1||disposing)return;for(const data of result.frames)this.fire('message',{data});if(result.closed){this.close();return;}}catch(e){this.fire('error',{error:e});this.close();return;}this.schedule()}
  send(data){if(this.readyState===1&&!disposing)track(window.__wv_ws_send(this.id,data)).then(ok=>{if(!ok)this.close()}).catch(e=>{this.fire('error',{error:e});this.close()})}
  close(){if(this.readyState===3)return;clearTimeout(this.timer);const id=this.id;this.readyState=3;sockets.delete(this);if(id)track(window.__wv_ws_close(id));this.fire('close',{})}
 }
 window.__wv_quiesce=()=>{disposing=true;window.WolvesImmersive?.stop();window.WolvesWorkspace?.stop();const live=window.WolvesLive;if(live){clearInterval(live.roomSyncTimer);clearTimeout(live.reconnectTimer)}for(const ws of [...sockets])clearTimeout(ws.timer);};
 window.__wv_cleanup=async()=>{window.__wv_quiesce();const live=window.WolvesLive;while(pending.size)await Promise.allSettled([...pending]);if(live){live.disconnect();clearTimeout(live.reconnectTimer)}for(const ws of [...sockets])ws.close();while(pending.size)await Promise.allSettled([...pending]);};
}"""
# Browser JS promises may settle before the Playwright BindingCall.resolve channel
# acknowledgement reaches Python. Track the actual binding dispatch task and drain it
# AFTER browser-side disposal, BEFORE closing context. Keep exceptions visible.
_binding_tasks=weakref.WeakKeyDictionary()
def expose_tracked(ctx,name,callback):
 tasks=_binding_tasks.setdefault(ctx,set())
 @functools.wraps(callback)
 async def tracked(*args):
  task=asyncio.current_task(loop=ctx._loop)
  if task is not None:
   tasks.add(task);task.add_done_callback(tasks.discard)
  return await asyncio.to_thread(callback,*args)
 ctx.expose_function(name,tracked)
async def _drain_bindings(tasks):
 while tasks:
  pending=[t for t in tasks if not t.done()]
  if not pending:break
  await asyncio.gather(*pending)

@functools.lru_cache(maxsize=160)
def asset_response(path):
 r=requests.get(BASE+path,timeout=10)
 return r.status_code,r.content,r.headers.get('Content-Type','application/octet-stream')

def page_setup(browser,seed=None,before_live=None):
 if DIRECT:
  ctx=browser.new_context(viewport={'width':1440,'height':900})
  if seed:
   import json
   ctx.add_init_script('for (const [k,v] of Object.entries('+json.dumps(seed)+')) if (v!==null) sessionStorage.setItem(k,v);')
  if before_live:ctx.add_init_script(before_live)
  pg=ctx.new_page();pg.on('pageerror',lambda e:LOGS.append(str(e)))
  pg.goto(BASE,wait_until='domcontentloaded',timeout=20000)
  pg.wait_for_function('typeof window.WolvesLive !== \"undefined\"',timeout=15000)
  return ctx,pg
 ctx=browser.new_context(viewport={'width':1440,'height':900});expose_tracked(ctx,'__wv_fetch',fetch_bridge);expose_tracked(ctx,'__wv_ws_open',bridge.open);expose_tracked(ctx,'__wv_ws_send',bridge.send);expose_tracked(ctx,'__wv_ws_poll',bridge.poll);expose_tracked(ctx,'__wv_ws_close',bridge.close)
 # Bridge mode serves REAL, approved artwork bytes from backend as same-origin asset URLs.
 # No mock images, generated portraits or role data. This avoids broken about:blank relative URLs.
 def route_asset(route):
  u=urlsplit(route.request.url)
  if u.path.startswith('/assets/'):
   try:
    status,body,content_type=asset_response(u.path)
    route.fulfill(status=status,body=body,content_type=content_type)
   except requests.RequestException:route.abort()
  else:route.abort()
 ctx.route('https://wolvesville.codex.test/**',route_asset)
 pg=ctx.new_page();pg.on('pageerror',lambda e:LOGS.append(str(e)))
 pg.set_content(HTML.replace('<head>','<head><base href="https://wolvesville.codex.test/">',1),wait_until='domcontentloaded')
 pg.add_style_tag(content=(ROOT/'style.css').read_text());pg.add_style_tag(content=(ROOT/'integration.css').read_text());pg.add_style_tag(content=(ROOT/'codex.css').read_text());pg.add_style_tag(content=(ROOT/'player-ux.css').read_text());pg.add_style_tag(content=(ROOT/'immersive.css').read_text());pg.add_style_tag(content=(ROOT/'fate-wheel.css').read_text());pg.add_style_tag(content=(ROOT/'workspace.css').read_text())
 pg.evaluate(BRIDGE_JS)
 if seed:pg.evaluate('(data)=>{for(const [k,v] of Object.entries(data))sessionStorage.setItem(k,v)}',seed)
 if before_live:pg.evaluate(before_live)
 pg.add_script_tag(content=(ROOT/'app.js').read_text());pg.add_script_tag(content=(ROOT/'codex-data.js').read_text());pg.add_script_tag(content=(ROOT/'player-ux.js').read_text());pg.add_script_tag(content=(ROOT/'integration.js').read_text());pg.add_script_tag(content=(ROOT/'immersive.js').read_text());pg.add_script_tag(content=(ROOT/'fate-wheel.js').read_text());pg.add_script_tag(content=(ROOT/'workspace.js').read_text())
 pg.evaluate("document.dispatchEvent(new Event('DOMContentLoaded'))")
 pg.wait_for_function('typeof window.WolvesLive !== "undefined"')
 return ctx,pg

async def _drain_context_protocol(owner):
 # Playwright 1.57 may schedule Channel.send for a binding rejection or
 # interception update AFTER the callback returned. These tasks are owned by
 # the context's channel tree, not by the JS pending set. Never await another
 # still-active player's tasks; propagate exceptions instead of ignoring them.
 def belongs(task):
  frame=getattr(task.get_coro(),'cr_frame',None)
  if not frame:return False
  obj=frame.f_locals.get('self');obj=getattr(obj,'_object',obj)
  while obj is not None:
   if obj is owner:return True
   obj=getattr(obj,'_parent',None)
  return False
 while True:
  await asyncio.sleep(0)
  pending=[t for t in asyncio.all_tasks() if t is not asyncio.current_task() and belongs(t) and not t.done()]
  if not pending:return
  await asyncio.gather(*pending)

def close_context(ctx):
 for pg in ctx.pages:
  if not pg.is_closed():pg.evaluate("async()=>{if(window.__wv_cleanup)await window.__wv_cleanup();else if(window.WolvesLive)WolvesLive.disconnect()}")
 # JS bridge pending requests and Playwright asset routes are separate lifecycles.
 # Wait for active route handlers before context disposal; do not suppress errors.
 ctx.unroute_all(behavior='wait')
 tasks=_binding_tasks.get(ctx)
 if tasks:ctx._sync(_drain_bindings(tasks))
 ctx._sync(_drain_context_protocol(ctx._impl_obj))
 ctx.close()

def close_contexts(contexts):
 # Stop polling in *all* player contexts before draining any one of them.
 # This prevents healthy peer polling from continually competing for the
 # shared Playwright dispatcher during sequential disposal.
 for c in contexts:
  for pg in c.pages:
   if not pg.is_closed():pg.evaluate("()=>{if(window.__wv_quiesce)window.__wv_quiesce();else if(window.WolvesLive){clearInterval(WolvesLive.roomSyncTimer);clearTimeout(WolvesLive.reconnectTimer)}}")
 for i,c in enumerate(contexts):
  t=time.monotonic();close_context(c);print('E2E_CONTEXT_CLOSED',i,round(time.monotonic()-t,3),flush=True)

def register(page,prefix):
 username=prefix+uuid.uuid4().hex[:14]
 page.evaluate("showAuth('register')")
 page.locator('#authUser').fill(username)
 page.locator('#authPass').fill('BrowserTestSecure_1234')
 page.locator('#authName').fill(prefix)
 page.locator('#authConfirm').fill('BrowserTestSecure_1234')
 page.locator('#authSubmit').click()
 page.wait_for_function('WolvesLive.profile!==null',timeout=12000)
 page.wait_for_function('page==="rooms" && !titleScreenOpen',timeout=12000)
 return page.evaluate('WolvesLive.profile')

def main():
 with sync_playwright() as pw:
  launch={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():launch['executable_path']='/usr/bin/chromium'
  browser=pw.chromium.launch(**launch)
  c1,p1=page_setup(browser);c2,p2=page_setup(browser)
  try:
   pa=register(p1,'Alice');pb=register(p2,'Bob');print('PASS Browser: two independent accounts authenticate via backend')
   p1.evaluate("openVillagePanel('create','well')");p1.locator('#wv-room-name').fill('S03 Bộ bài chính thức')
   p1.locator('#wv-capacity').fill('2');p1.get_by_role('button',name='Tạo phòng',exact=True).click()
   p1.wait_for_function('WolvesLive.room!==null');id=p1.evaluate('WolvesLive.room.id')
   p2.evaluate('(id)=>WolvesLive.openRoom(id)',id)
   p2.wait_for_function('WolvesLive.room!==null && WolvesLive.room.members.length===2',timeout=12000)
   p1.wait_for_function('WolvesLive.room.members.length===2',timeout=12000)
   print('PASS Browser: Room created and joined by two independently authenticated contexts')
   p1.evaluate('WolvesLive.roomLock(true)')
   p1.wait_for_function('WolvesLive.room.status==="LOCKED"')
   p1.evaluate('WolvesLive.startGame()')
   p1.wait_for_timeout(1200)
   p1.wait_for_function('WolvesLive.game!==null && page==="ingame"',timeout=15000)
   p2.wait_for_function('WolvesLive.game!==null',timeout=15000)
   first=p1.evaluate('WolvesLive.game');second=p2.evaluate('WolvesLive.game')
   assert first['gameId']==second['gameId']
   assert next(x for x in first['players'] if x['playerId']==pb['id']).get('self') is None
   assert next(x for x in second['players'] if x['playerId']==pa['id']).get('self') is None
   assert p1.evaluate('ROLES.length')==97
   assert p1.evaluate('ROLES.find(c=>c.id===74).name')=='Tiên Tri Huyền Bí'
   assert p1.locator('.hud-slot.active-role').inner_text().find('Sát Nhân Ảnh Thuật')==-1
   print('PASS Browser: server game session, private role projections, official 97-role catalog and WebSocket notification')
   p1.evaluate('(id)=>WolvesLive.chooseTarget(11000+WolvesLive.localSeatToId.indexOf(id))',pb['id'])
   p1.locator('#wv-skill-submit').click()
   p1.wait_for_function('WolvesLive.feedback.size===1',timeout=12000)
   assert 'Đã nhận hành động' in p1.locator('#wv-feedback').inner_text()
   assert 'Bạn đã soi thấy' not in p1.locator('#wv-feedback').inner_text()
   assert p2.evaluate('WolvesLive.feedback.size')==0
   print('PASS Browser: accepted skill has pending notification, no premature or cross-client result')
   p1.evaluate('WolvesLive.resolve()')
   p1.wait_for_timeout(800)
   p1.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS" && [...WolvesLive.feedback.values()].some(x=>x.resolutionStatus==="RESOLVED")',timeout=15000)
   p2.wait_for_function('WolvesLive.game.phase==="DAY_DISCUSS"',timeout=15000)
   expected='Bạn đã soi thấy hào quang: Thiện.' if p1.evaluate('WolvesLive.game.players.find(p=>p.self).self.currentCharacterId')==25 else 'Bạn đã soi thấy: Tiên Tri.'
   assert expected in p1.locator('#wv-feedback').inner_text()
   assert p2.evaluate('WolvesLive.feedback.size')==0
   assert p1.evaluate('WolvesLive.events.some(e=>e.eventType===(WolvesLive.game.players.find(p=>p.self).self.currentCharacterId===25?"SEER_AURA_OBSERVED":"ROLE_OBSERVED"))')
   assert not p2.evaluate('WolvesLive.events.some(e=>["ROLE_OBSERVED","SEER_AURA_OBSERVED"].includes(e.eventType))')
   print('PASS Browser: resolved private result only to actor; both clients sync phase')
   p1.evaluate('WolvesLive.disconnect();WolvesLive.connect()')
   p1.wait_for_function('WolvesLive.ws?.readyState===1',timeout=12000)
   p1.wait_for_timeout(500)
   assert p1.evaluate('[...WolvesLive.feedback.values()].filter(x=>x.resolutionStatus==="RESOLVED").length')==1
   expected='Bạn đã soi thấy hào quang: Thiện.' if p1.evaluate('WolvesLive.game.players.find(p=>p.self).self.currentCharacterId')==25 else 'Bạn đã soi thấy: Tiên Tri.'
   assert expected in p1.locator('#wv-feedback').inner_text()
   assert p1.evaluate('document.getElementById("stageTypewriterText").textContent.length')>5
   p1.screenshot(path=str(ROOT.parent/'reports'/'sprint03_browser_game.png'))
   seed=p1.evaluate('Object.fromEntries(["wv_s03_session_token","wv_s03_session_navigation"].map(k=>[k,sessionStorage.getItem(k)]))')
   c3,p3=page_setup(browser,seed)
   p3.wait_for_function('WolvesLive.game!==null && page==="ingame"',timeout=15000)
   assert p3.evaluate('WolvesLive.game.gameId')==first['gameId']
   assert p3.evaluate('[...WolvesLive.feedback.values()].filter(x=>x.resolutionStatus==="RESOLVED").length')==1
   assert expected in p3.locator('#wv-feedback').inner_text()
   close_context(c3)
   print('PASS Browser: fresh document restores authorized game and private result from server')
   print('PASS Browser: reconnect preserves one durable result and complete immediate text')
   print('PAGE ERRORS',LOGS[:4]);assert not LOGS, LOGS
  finally:bridge.shutdown();close_context(c1);close_context(c2);browser.close()
if __name__=='__main__':
 try:main()
 except Exception as e:print('BROWSER_E2E_FAILED',repr(e));sys.exit(1)
