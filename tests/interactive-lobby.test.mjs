import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../frontend/app.js',import.meta.url),'utf8');
const bridge=readFileSync(new URL('../frontend/integration.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../frontend/player-ux.css',import.meta.url),'utf8');
const first=source.indexOf('const VILLAGE_ROOM_SITES =');
const last=source.indexOf('let villageAudioUnlocked',first);
assert.ok(first>0&&last>first);
function assignment(){
 const ctx={window:{},document:{addEventListener(){}}};
 vm.runInNewContext(source.slice(first,last)+'\nglobalThis.assign = assignVillageSlots; globalThis.slots = villageRoomSlots;',ctx);
 return ctx;
}
const room=(id,status='WAITING')=>({id,name:id,status,occupied:1,capacity:2});
test('LOBBY-01: a room retains its map slot through reorder and status updates',()=>{
 const ctx=assignment();
 const r=[room('room-a'),room('room-b'),room('room-c')];
 assert.deepEqual(Array.from(ctx.assign(r).map(x=>x?.id)),['room-a','room-b','room-c']);
 assert.deepEqual(Array.from(ctx.assign([room('room-c','LOCKED'),room('room-a','IN_GAME'),room('room-b')] ).map(x=>x?.id)),['room-a','room-b','room-c']);
});
test('LOBBY-02: deleting a room releases its slot without repositioning other rooms',()=>{
 const ctx=assignment();ctx.assign([room('a'),room('b'),room('c')]);
 const next=ctx.assign([room('c'),room('b'),room('new')]);
 assert.deepEqual(Array.from(next.map(r=>r?.id)),['new','b','c']);
});
test('LOBBY-03: map capacity is bounded, directory remains the complete room list',()=>{
 const ctx=assignment();const all=Array.from({length:30},(_,i)=>room('r'+i));
 assert.equal(ctx.assign(all).filter(Boolean).length,3);
 assert.match(source,/onlineRooms\.length\} phòng đang có/);
 assert.match(bridge,/this\.rooms\.map\(r=>/);
});
test('LOBBY-04: marker is a button for preview only, with room-bound identity',()=>{
 assert.match(source,/data-room-id/);assert.match(source,/WolvesLive\.previewRoom/);
 assert.match(source,/class="map-hotspot/);
 assert.match(bridge,/async previewRoom\(id\)/);
 assert.match(bridge,/kind==='preview-room'/);
 assert.match(bridge,/Tham gia phòng/);
});
test('LOBBY-05: only explicit join calls membership mutation',()=>{
 const fn=bridge.slice(bridge.indexOf('async previewRoom(id)'),bridge.indexOf('async roomLock(locked)'));
 const preview=fn.slice(0,fn.indexOf('async openRoom(id)'));
 assert.doesNotMatch(preview,/\/join`/);
 assert.match(fn,/\/join`,'POST'/);
 assert.match(fn,/if\(this\.working\)return/);
});
test('LOBBY-06: no decorative descendant intercepts button hitbox and focus is visible',()=>{
 assert.match(css,/\.map-room-marker > \*/);
 assert.match(css,/pointer-events: none/);
 assert.match(css,/\.map-room-marker:focus-visible/);
 assert.match(css,/min-height: 52px/);
});
