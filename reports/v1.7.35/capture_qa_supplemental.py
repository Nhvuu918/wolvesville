"""Real restricted gameplay and explicitly labelled ACL fixture screenshots, not normal gameplay certification."""
import fcntl,os,pathlib,tempfile,subprocess,socket,time,sys,json,hashlib,requests
ROOT=pathlib.Path(__file__).resolve().parents[2];R=ROOT/'reports/v1.7.35';OUT=R/'screenshots-qa';OUT.mkdir(exist_ok=True)
fp=json.loads((R/'browser-visual/matrix.json').read_text())['sourceFingerprint'];rows=[]
SPECS=[('browser_s23_mute_acl_e2e.py','   p.get_by_text(\'S23 public only\',exact=False).wait_for(timeout=15000)','   capture(p,"mute-public-chat","RESTRICTED_QA_GAMEPLAY","self #33, actual #84 silence")'),('browser_s24_group_transport_e2e.py',"   owner.locator('#wv-system-group-chat').get_by_text('S24 group only',exact=False).wait_for(timeout=15000)","   capture(member,'group-chat-member','TRUSTED_ACL_FIXTURE_ONLY','authorized member');capture(outsider,'group-chat-outsider','TRUSTED_ACL_FIXTURE_ONLY','unauthorized outsider')")]
with open('/tmp/wolvesville-browser-admission-'+str(os.getuid())+'.lock','a+') as lease:
 fcntl.flock(lease,fcntl.LOCK_EX)
 for name,marker,extra in SPECS:
  with tempfile.TemporaryDirectory(prefix='wv35-qa-shot-') as td:
   sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close();base=f'http://127.0.0.1:{port}';env={**os.environ,'DB_PROVIDER':'sqlite','HOST':'127.0.0.1','PORT':str(port),'WV_LOBBY_DB':td+'/test.sqlite','WV_OFFICIAL_RULE_TEST_MODE':'1','WV_INTEGRATION_TEST_MODE':'0','WV_OWNER_BB_LIVE_QA':'0','WV_OWNER_DC_QA':'0','WV_E2E_SERVER':base,'WV_E2E_DIRECT':'0'};env.pop('WV_ARCHIVED_RULE_REGRESSION',None)
   with open(R/('qa-supplemental-'+name+'.server.log'),'w') as log:
    server=subprocess.Popen(['node','scripts/serve-03.mjs'],cwd=ROOT,env=env,stdout=log,stderr=subprocess.STDOUT)
    try:
     for _ in range(100):
      try:
       r=requests.get(base+'/health',timeout=1);r.raise_for_status();break
      except requests.RequestException:time.sleep(.1)
     else:raise RuntimeError('Server not healthy')
     # Execute an external copy with only additional screenshot capture; original test remains immutable.
     src=(ROOT/'tests'/name).read_text();assert marker in src
     header=f'''import sys,json,pathlib,hashlib\nsys.path.insert(0,{str(ROOT/'tests')!r})\nOUT=pathlib.Path({str(OUT)!r})\nFP={fp!r}\ndef capture(p,name,mode,viewer):\n p.emulate_media(reduced_motion='reduce');p.set_viewport_size({{'width':1366,'height':768}});p.locator('#wv-system-group-chat' if name=='group-chat-member' else '#wv-in-match-chat').scroll_into_view_if_needed();p.wait_for_function('!document.getElementById("sceneTransition")?.classList.contains("active")');f=OUT/(name+'.png');p.screenshot(path=str(f),animations='disabled');row=dict(file=f.name,viewport=p.viewport_size,sourceFingerprint=FP,ruleset='wolvesville-official-v1.3.3',mode=mode,viewer=viewer,sha256=hashlib.sha256(f.read_bytes()).hexdigest());(OUT/(name+'.json')).write_text(json.dumps(row,indent=2));print('QA_SCREENSHOT',name,mode,flush=True)\n'''
     path=pathlib.Path(td)/name;path.write_text(header+src.replace(marker,marker+'\n'+extra,1));res=subprocess.run([sys.executable,str(path)],env=env,cwd=ROOT,timeout=65,capture_output=True,text=True);(R/('qa-supplemental-'+name+'.log')).write_text(res.stdout+res.stderr);print(name,'exit',res.returncode,flush=True);assert res.returncode==0
    finally:server.terminate();server.wait(timeout=5)
print('QA_SUPPLEMENTAL_PASS',flush=True)
