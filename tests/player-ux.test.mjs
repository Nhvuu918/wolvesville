import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
const read=(p)=>readFileSync(new URL(p,import.meta.url),'utf8');
const app=read('../frontend/app.js');
const integration=read('../frontend/integration.js');
const html=read('../frontend/index.html');
const css=read('../frontend/player-ux.css');
const context={window:{}};
runInNewContext(read('../frontend/player-ux.js'),context);
const ux=context.window.WolvesPlayerUX;

test('UX: server error codes map to Vietnamese without exposing backend code or arbitrary messages',()=>{
 const labels={INVALID_CREDENTIALS:'Tên đăng nhập hoặc mật khẩu không đúng.',RULE_UNRESOLVED:'Hành động này hiện chưa được hỗ trợ.',
   REVISION_CONFLICT:'Trạng thái trận đã thay đổi. Vui lòng thử lại.',ROOM_FULL:'Phòng đã đủ người. Hãy chọn phòng khác.',
   DEMO_DISABLED:'Máy chủ chưa bật chế độ trải nghiệm.',OUT_OF_PHASE:'Chưa đến lượt thực hiện hành động này.'};
 for(const [code,want] of Object.entries(labels))assert.equal(ux.errorMessage({code,message:'password=secret'}),want);
 assert.doesNotMatch(ux.errorMessage({code:'SOME_NEW_INTERNAL_CODE',message:'SECRET_TOKEN'}),/SECRET_TOKEN|SOME_NEW_INTERNAL_CODE/);
});
test('UX: game and room statuses use player language; unknown states do not print engine enums',()=>{
 assert.equal(ux.phase('NIGHT_COLLECT'),'Đêm · Chọn hành động');
 assert.equal(ux.roomStatus('WAITING'),'Đang mở');
 assert.equal(ux.actionStatus('PENDING_RESOLUTION'),'Đang chờ kết quả');
 assert.equal(ux.actionStatus('RESOLVED'),'Đã xử lý');
 assert.equal(ux.actionStatus('RULE_UNRESOLVED'),'Chưa hỗ trợ');
 assert.equal(ux.phase('NOT_A_REAL_PHASE'),'Đang cập nhật');
});
test('UX: approved Codex is intact while navigation uses only Bách khoa terminology',()=>{
 assert.match(app,/label: 'Bách khoa'/);assert.match(app,/title: 'Bách khoa nhân vật'/);
 assert.doesNotMatch(app,/label: 'Bách khoa \(Codex\)'/);
 assert.doesNotMatch(app,/title: 'Kho Thân Phận \(Codex\)'/);
 assert.match(app,/codexCountBadge/);
 assert.match(app,/window\.WolvesCodexData\.countLabel\(list\.length,ROLES\.length\)/);
});
test('UX: lobby map and directory use same backend room list, not prototype default rooms',()=>{
 const method=app.split('function rooms() {')[1].split('function openVillagePanel(')[0];
 assert.match(method,/multiplayer\.rooms/);
 assert.match(method,/onlineRooms\.length/);
 assert.doesNotMatch(method,/const orderedRooms = \[\.\.\.state\.rooms\]/);
 assert.match(integration,/const incoming=\(await this\.request\('\/api\/rooms'\)\)\.rooms/);
 assert.match(integration,/this\.rooms=incoming/);
 assert.match(integration,/if\(requestSeq!==this\.roomsRequestSeq\)return/);
 assert.match(integration,/this\.request\('\/api\/rooms','POST'/);
});
test('UX: unavailable mock ranking, history and overview are hidden in authenticated main navigation',()=>{
 assert.match(app,/unavailable: true/);
 assert.match(app,/g\.items\.filter\(it => !\(window\.WolvesLive && it\.unavailable\)\)/);
 assert.match(integration,/if\(!allowedPage\.has\(target\)\)/);
 assert.doesNotMatch(integration,/alert\(live\.notice\)/);
});
test('UX: settings do not present local prototype JSON export/import as server account backup',()=>{
 const view=app.split('function settings() {')[1].split('function exportData()')[0];
 assert.doesNotMatch(view,/Xuất file JSON|Nhập file JSON|resetData\(\)/);
 assert.match(view,/Cài đặt âm thanh và giao diện chỉ có tác dụng trên thiết bị này/);
});
test('UX: private results are projected from server, and technical action IDs stay in markup attributes only',()=>{
 const view=integration.split('    renderFeedback(){')[1].split('    async verifyReplay()')[0];
 assert.match(view,/f\.resultPayload\.characterId/);
 assert.match(view,/f\.resolutionStatus==='RESOLVED'/);
 assert.doesNotMatch(view,/\(#\$\{f\.resultPayload\.characterId\}\)|Event #|f\.skillId|f\.eventRevision/);
 assert.match(integration,/item\.actorPlayerId!==this\.profile\?\.id/);
 assert.match(integration,/this\.loadFeedback\(\)/);
});
test('UX: reconnect rehydrates server state and frontend discards stale revisions',()=>{
 assert.match(integration,/async resyncAfterReconnect\(\)/);
 assert.match(integration,/this\.loadFeedback\(\)/);
 assert.match(integration,/if\(this\.game\?\.gameId===view\.gameId&&view\.revision<this\.lastRevision\)return/);
 assert.match(integration,/this\.connectionState='offline'/);
 assert.match(css,/\.wv-connection-banner\[hidden\]/);
});
test('UX: action acceptance is not a resolved result; game text remains instant',()=>{
 const run=app.split('function runTypewriter(text) {')[1].split('function ingame()')[0];
 assert.match(run,/el\.textContent\s*=\s*String\(text\s*\?\?\s*''\)/);
 assert.doesNotMatch(run,/setInterval|setTimeout|slice\(/);
 assert.match(integration,/this\.notice='Đã nhận hành động\. Kết quả sẽ có sau khi lượt được xử lý\.'/);
 assert.match(integration,/f\.resolutionStatus==='PENDING_RESOLUTION'/);
});
test('UX: static backend serves new assets same-origin without exposing arbitrary source',{timeout:12000},async()=>{
 const server=createMultiplayerServer(new SqliteMultiplayerStore(),{staticDir:resolve('frontend')});
 const port=await server.start();
 try{
  const base=`http://127.0.0.1:${port}`;
  for(const [path,type] of [['/player-ux.js','text/javascript'],['/player-ux.css','text/css']]){
   const response=await fetch(base+path);assert.equal(response.status,200,path);assert.match(response.headers.get('content-type')||'',new RegExp(type));
  }
  const bad=await fetch(base+'/backend/src/multiplayer/server.ts');assert.equal(bad.status,404);
  assert.match((await(await fetch(base+'/')).text()),/player-ux\.js/);
 }finally{await server.close();}
});
test('UX: test:03:codex uses separate explicit test paths, not concatenated filenames',()=>{
 const pkg=JSON.parse(read('../package.json'));
 const command=pkg.scripts['test:03:codex'];
 assert.match(command,/tests\/feedback-projector\.test\.mjs\s+tests\/instant-text\.test\.mjs/);
 assert.doesNotMatch(command,/\.mjstests\//);
});
