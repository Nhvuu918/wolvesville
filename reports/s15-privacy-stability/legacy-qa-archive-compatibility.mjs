// Run after building both v1.7.22 baseline and v1.7.24; arg is baseline root.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {withKernel as current} from '../../dist/backend/src/game/archive.js';
process.env.WV_OWNER_BB_LIVE_QA='1';delete process.env.WV_ARCHIVED_RULE_REGRESSION;
const {withKernel:old}=await import(pathToFileURL(resolve(process.argv[2],'dist/backend/src/game/archive.js')).href);
const gameId='legacy-qa-rep-compat',people=[9,25,48,74,76].map(characterId=>({playerId:String(characterId),characterId}));
const a=old(undefined,false,e=>{e.createGame('legacy-qa-room',people,{gameId,seed:'legacy-qa-compat-seed',qaProfile:'owner-bb-live-pack-qa-v1'});e.transition(gameId,'ROLE_ASSIGNED');e.transition(gameId,'NIGHT_COLLECT');e.submitLivePack(gameId,'48',{key:'legacy-key-48',expectedRevision:0,targets:['25']});assert.equal(e.lockLivePack(gameId),'WAITING_FOR_RESPONSES');return {gameId};},true);
const legacy=process.argv[3]==='legacy';assert.equal(a.state.qaRepresentativePolicy,legacy?undefined:'BB-REP-NEW-01-B');assert.equal(a.state.qaRepresentativeOrder.length,legacy?2:5);assert(a.replay.verified);
const b=current(a.archive,false,e=>{assert.deepEqual(e.getInternalState(gameId),a.state);return {gameId};},true);assert(b.replay.verified);assert.deepEqual(b.state,a.state);
const c=current(b.archive,false,e=>{e.submitLivePack(gameId,'76',{key:'legacy-key-76',expectedRevision:1,targets:['25']});assert.equal(e.lockLivePack(gameId),'UNANIMOUS');e.transition(gameId,'NIGHT_RESOLVE');e.resolve(gameId);e.transition(gameId,'NIGHT_FINALIZE');e.completeVerifiedKnightSolo(gameId);return {gameId};},true);
assert.equal(c.state.qaPack.final.representativeId,a.state.qaRepresentativeOrder.find(id=>['48','76'].includes(id)));assert.deepEqual(c.state.qaRepresentativeOrder,a.state.qaRepresentativeOrder);assert.equal(c.state.qaRepresentativePolicy,a.state.qaRepresentativePolicy);assert(c.replay.verified);assert.equal(c.state.completed,true);console.log('LEGACY_QA_ARCHIVE_COMPATIBILITY PASS: previous order, open selection, v1.7.25 resolution, same representative and replay');
