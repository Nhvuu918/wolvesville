import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {resolve} from 'node:path';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';

const read=(path)=>readFileSync(new URL(path,import.meta.url));
const official=JSON.parse(read('../data/character.json').toString('utf8'));
const browserSource=read('../frontend/codex-data.js').toString('utf8');
const app=read('../frontend/app.js').toString('utf8');
const integration=read('../frontend/integration.js').toString('utf8');
const html=read('../frontend/index.html').toString('utf8');
const styles=read('../frontend/codex.css').toString('utf8');
const ctx={window:{}};
runInNewContext(browserSource,ctx);
const C=ctx.window.WolvesCodexData;

// These tests cover presentation only, not official skill execution.
test('Codex: official character.json is byte-identical and contains 97 unique character IDs',()=>{
 assert.equal(createHash('sha256').update(read('../data/character.json')).digest('hex'),'7a9fc87f979198004260115f512cac9b171322a98b264e59dae9fa3b4d29a9c3');
 assert.equal(official.length,97);
 assert.deepEqual(official.map(x=>x.id),Array.from({length:97},(_,i)=>i+1));
 assert.equal(new Set(official.map(x=>x.name)).size,97);
 assert.equal(C.validateOfficialCharacters(official).length,97);
});
test('Codex: rejects incomplete, duplicated, malformed and unauthorized team data instead of showing a false 97',()=>{
 const missing=official.slice(1);assert.throws(()=>C.validateOfficialCharacters(missing),/97/);
 const duplicated=structuredClone(official);duplicated[4].id=duplicated[3].id;assert.throws(()=>C.validateOfficialCharacters(duplicated),/trùng/);
 const invalid=structuredClone(official);invalid[10].team='other';assert.throws(()=>C.validateOfficialCharacters(invalid),/thiếu/);
 const noDesc=structuredClone(official);noDesc[0].desc='';assert.throws(()=>C.validateOfficialCharacters(noDesc),/thiếu/);
});
test('Codex: view model uses official name, faction, aura and description without generated rules',()=>{
 const item=official.find(x=>x.id===74),view=C.toCodexViewModel(item);
 assert.equal(view.internalId,74);
 assert.equal(view.displayName,item.name);
 assert.equal(view.factionLabel,item.teamName);
 assert.equal(view.abilityDescription,item.desc);
 assert.equal(view.portraitUrl,'assets/portraits/74.svg');
 assert.equal(Object.keys(view).length,7);
 assert.equal(Object.hasOwn(view,'skillAdapter'),false);
});
test('Codex: Vietnamese accent-insensitive name search, correct team filtering and predictable sorting',()=>{
 assert.equal(C.filterOfficialCharacters(official).length,97);
 const teams={dan:40,soi:26,phe3:31};
 for(const [key,count] of Object.entries(teams)) assert.equal(C.filterOfficialCharacters(official,{team:key}).length,count,key);
 assert.deepEqual(Array.from(C.filterOfficialCharacters(official,{query:'soi dao tac'}).map(x=>x.id)),[1]);
 assert.deepEqual(Array.from(C.filterOfficialCharacters(official,{query:'SÓI ĐẠO TẶC'}).map(x=>x.id)),[1]);
 assert.equal(C.filterOfficialCharacters(official,{query:'vai-khong-ton-tai'}).length,0);
 assert.deepEqual(Array.from(C.filterOfficialCharacters(official,{team:'fav',favorites:[1,1,74,101]}).map(x=>x.id)),[1,74]);
 const sorted=C.filterOfficialCharacters(official,{sort:'name'});
 assert.equal(sorted.length,97);
 assert.equal(sorted[0].name,[...official].sort((a,b)=>a.name.localeCompare(b.name,'vi')||(a.id-b.id))[0].name);
});
test('Codex: every counter derives from filtered and loaded data',()=>{
 assert.equal(C.countLabel(97,97),'97 nhân vật');
 assert.equal(C.countLabel(1,97),'Đang hiển thị 1 / 97 nhân vật');
 assert.equal(C.countLabel(0,97),'Đang hiển thị 0 / 97 nhân vật');
 assert.doesNotMatch(app,/52\s*\/\s*97/);
 assert.doesNotMatch(app,/Codex\s*52/);
 assert.doesNotMatch(app,/totalInScope\s*=\s*100/);
 assert.match(integration,/validateOfficialCharacters\(raw\)/);
 assert.match(app,/codexCountBadge/);
 assert.match(app,/getFilteredRoles\(\)/);
});
test('Codex: production player detail uses actual ability text and no JSON/raw/debug tags, no ID beside name',()=>{
 const detail=app.split('function renderRoleDetail() {')[1].split('function toggleFav(')[0];
 assert.ok(detail);
 assert.doesNotMatch(detail,/Nguyên bản JSON|#\$\{String\(c\.id\)|role-id-badge|roleExampleText|extractRoleFacts|Rule Adapter/);
 assert.match(detail,/model\.abilityDescription/);
 assert.match(detail,/esc\(model\.displayName\)/);
 const grid=app.split('function renderRoleListItems(list) {')[1].split('let codexViewMode')[0];
 assert.doesNotMatch(grid,/role-id-badge|Hào quang|Nguyên bản JSON|#\$\{String/);
 assert.match(grid,/codex-grid-card/);
});
test('Codex: Wheel keeps no more than 12 cards, Grid is responsive, reduced-motion is supported',()=>{
 assert.match(app,/Math\.min\(12,\s*list\.length\)/);
 assert.match(app,/setCodexViewMode\('grid'\)/);
 assert.match(styles,/grid-template-columns:repeat\(4,/);
 assert.match(styles,/@media\(max-width:720px\)/);
 assert.match(styles, /prefers-reduced-motion:reduce/);
 assert.match(app, /requestAnimationFrame\(step\)/);
 assert.doesNotMatch(app.split('function drawCodexWheelCards(')[1].split('function spinCodexWheel(')[0],/w-id|role-id-badge/);
});
test('Codex: static source and presentation extras are served by same-origin backend, with no arbitrary source access',{timeout:10000},async()=>{
 const server=createMultiplayerServer(new SqliteMultiplayerStore(),{staticDir:resolve('frontend')});
 const port=await server.start();
 try{
  const origin=`http://127.0.0.1:${port}`;
  for(const [path,type] of [['/codex-data.js','text/javascript'],['/codex.css','text/css'],['/character.json','application/json']]){
   const res=await fetch(origin+path);assert.equal(res.status,200,path);assert.ok(res.headers.get('content-type')?.includes(type),path);
  }
  assert.equal((await fetch(origin+'/data/character.json')).status,404);
  const received=await (await fetch(origin+'/character.json')).json();
  assert.equal(C.validateOfficialCharacters(received).length,97);
 }finally{await server.close();}
});
test('Codex: approved visual baseline is preserved as archived references, with presentation additive stylesheet',()=>{
 assert.match(html,/src="codex-data\.js"/);
 assert.match(html,/href="codex\.css"/);
 assert.ok(existsSync(resolve('reference/approved_frontend_original/style.css')));
 assert.ok(existsSync(resolve('frontend/assets/portraits/placeholder.svg')));
 assert.doesNotMatch(browserSource,/fixture\.\*/);
});
