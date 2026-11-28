"""Browser E2E negative path against a server with WV_ENABLE_DEMO_AUTH=0."""
import pathlib,sys
from playwright.sync_api import sync_playwright
import browser_e2e as be
try:
 with sync_playwright() as pw:
  args={'headless':True,'args':['--no-sandbox']}
  if sys.platform.startswith('linux') and pathlib.Path('/usr/bin/chromium').exists():args['executable_path']='/usr/bin/chromium'
  b=pw.chromium.launch(**args);ctx,p=be.page_setup(b)
  try:
   p.evaluate("showAuth('login')")
   p.locator('#wv-demo-button').click()
   p.wait_for_function("document.getElementById('authError').textContent.includes('chưa bật')",timeout=10000)
   assert p.evaluate('WolvesLive.profile===null')
   assert p.evaluate('WolvesLive.token===null')
   assert not be.LOGS,be.LOGS
   print('PASS Browser: disabled demo shows Vietnamese error, remains on login, creates no local session')
  finally:be.bridge.shutdown();be.close_context(ctx);b.close()
except Exception as ex:
 print('DEMO_DISABLED_BROWSER_FAILED',repr(ex));sys.exit(1)
