/** Shared single-layer resolver. The caller supplies the source-backed layer
 * domain and consumption policy; no generic priority between shields is invented. */
import type {GameState,Participant} from '../../../shared/contracts/index.js';
import {KernelError} from '../common/errors.js';
type Layer=Participant['effects'][number];
export function selectSingleDefense(layers:readonly Layer[],allowed:(layer:Layer)=>boolean,reason:string):Layer|undefined{
 if(layers.length>1||layers.some(layer=>!allowed(layer)))throw new KernelError('RULE_UNRESOLVED',reason);
 return layers[0];
}
export function consumeDefense(target:Participant,layer:Layer,consumable:boolean):string{
 if(!target.effects.some(x=>x.id===layer.id))throw new KernelError('RULE_UNRESOLVED','Protection layer is no longer active');
 if(consumable)target.effects=target.effects.filter(e=>e.id!==layer.id);
 return layer.id;
}

/** GD-DEFENSE-STACK-01: composed LIFE-02 only. A renewable night guard
 * prevents the hit before a finite snow layer is consumed. A snow layer
 * persists after its provider dies, expires after its second night, and
 * is spent exactly once. Both apply to eligible night death-follow as
 * well as direct lethal roots, never to day hanging. */
import {activeGuardProtection,SNOW_LAYER} from './support-rules.js';
export function resolveComposedNightDefense(s:GameState,target:Participant):'GUARD'|'SNOW'|undefined{
 if(!['NIGHT_RESOLVE','WITCH_WINDOW'].includes(s.phase))return;
 if(activeGuardProtection(s,target.playerId))return 'GUARD';
 const layers=target.effects.filter(e=>e.kind===SNOW_LAYER&&Number(e.payload?.startedAtRound)<=s.round&&(e.expiresAtRound??-1)>=s.round);
 const layer=selectSingleDefense(layers,e=>Number.isSafeInteger(e.payload?.startedAtRound)&&e.expiresAtRound===Number(e.payload?.startedAtRound)+1&&s.participants.some(p=>p.playerId===e.sourceId&&p.currentCharacterId===9),'Invalid composed snow layer');
 if(layer){consumeDefense(target,layer,true);return 'SNOW';}
}
