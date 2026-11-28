/** Exercise the actual integration adapter with a controlled asynchronous read.
 * Browser journey remains separate; these tests do not certify live gameplay. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../frontend/integration.js',import.meta.url),'utf8');
function adapter(){
 const ctx={window:{WolvesPlayerUX:{errorMessage:e=>e.message}},sessionStorage:{getItem:()=>null,setItem(){}},document:{addEventListener(){}},titleScreenOpen:false,page:'rooms',render(){},go(where){ctx.page=where;},enterGamePage(where){ctx.page=where;},console};
 vm.runInNewContext(source,ctx);const live=ctx.window.WolvesLive;live.profile={id:'seer'};live.refreshUI=()=>{};live.renderGame=()=>{};return {ctx,live};
}
const view=(phase,revision)=>({gameId:'game',revision,phase,round:1,players:[{playerId:'seer'},{playerId:'knight'}]});
test('S19 handoff: accepted snapshot maps seats before auxiliary reads or first paint',()=>{
 const {live}=adapter();live.applyGame(view('DAY_DISCUSS',1));live.applyGame(view('DAY_VOTE_COLLECT',2));
 assert.equal(live.localSeatToId[1],'knight');live.chooseTarget(11001);assert.equal(live.selectedTarget,'knight');
 assert.equal(live.applyGame(view('DAY_DISCUSS',1)),false);assert.equal(live.selectedTarget,'knight');
});
test('S19 handoff: authenticated game navigation precedes delayed feedback',async()=>{
 const {ctx,live}=adapter();let release,entered;const pending=new Promise(r=>release=r),started=new Promise(r=>entered=r);live.request=async()=>({game:view('DAY_DISCUSS',1)});live.loadFeedback=()=>{entered();return pending;};live.loadEvents=async()=>{};
 const result=live.loadGame('game');try{await started;assert.equal(ctx.page,'ingame');assert.equal(live.localSeatToId[1],'knight');}finally{release();await result;}
});
