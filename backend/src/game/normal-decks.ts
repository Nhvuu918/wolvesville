import {listLifeDevelopmentCompositions} from '../official/lifecycle-composition.js';
/** ROOM-01/02: deployment allowlist, not an assertion that other decks are illegal.
 * Public composition metadata contains no per-player assignments or private state.
 * Keep historical keys stable. Rule version and evidence are recorded in QA reports.
 */
export const NORMAL_DECKS = {
 'knight':[8,25],
 's15-mystic-knight':[8,74],
 's15-knight-dual-seer':[8,25,74],
 's15-play-guard':[25,31,48,74],
 's26-mirror-guard':[25,31,35,74],
 's28-bell-leader':[25,48,64,74],
 's28-bell-linked':[15,25,64,74],
 's28-bell-revival':[8,25,26,64],
 's15-scale-leader-rescue':[9,25,48,74,87],
 's15-growth-guard-rescue':[25,31,48,74,87],
 's15-deep-leader':[25,48,74],
 's15-deep-leader-snow':[9,25,48,74],
 's15-deep-knight-snow':[8,9],
 's15-deep-knight-snow-aura':[8,9,25],
 's15-deep-knight-snow-role':[8,9,74],
 's15-deep-knight-snow-dual':[8,9,25,74],
} as const;
export function normalDeck(key:unknown):readonly number[]|undefined {
 return typeof key==='string'&&Object.hasOwn(NORMAL_DECKS,key)?NORMAL_DECKS[key as keyof typeof NORMAL_DECKS]:listLifeDevelopmentCompositions().find(d=>d.key===key)?.characterIds;
}
export function listNormalDecks(){return [...Object.entries(NORMAL_DECKS).map(([key,ids])=>({key,characterIds:[...ids]})),...listLifeDevelopmentCompositions()];}
export function resolveCustomDeck(ids:unknown){if(!Array.isArray(ids)||ids.length<1||ids.length>100||ids.some(x=>!Number.isInteger(x)||x<1||x>97))return undefined;return listNormalDecks().find(d=>sameDeck(d.characterIds,ids));}
export function sameDeck(a:readonly number[],b:readonly number[]):boolean{const x=[...a].sort((x,y)=>x-y),y=[...b].sort((x,y)=>x-y);return x.length===y.length&&x.every((v,i)=>v===y[i]);}
