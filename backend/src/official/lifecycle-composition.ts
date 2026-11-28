/** Admission is deliberately separate from runtime. Each module describes the
 * interaction families supported by the existing LIFE-02 resolver, not FULL
 * certification. Unknown modules fail closed. No enumeration of exact decks.
 * Profile is persisted per match; historical V1–V3 matches keep their gates. */
export const LIFE_MODULES = Object.freeze({
 8: ['lethal-root','solo-victory'],
 9: ['consumable-night-shield'],
 25: ['aura-inspection'],
 27: ['couple-link','couple-victory','group-acl'],
 29: ['preliminary-rescue','witch-poison'],
 31: ['night-guard'],
 51: ['prolonged-life'],
 64: ['stable-death-observation'],
 74: ['exact-inspection'],
 97: ['seed','hibernation','delayed-revival'],
} as const);
export type LifeModuleId=keyof typeof LIFE_MODULES;
export type LifeCapability=(typeof LIFE_MODULES)[LifeModuleId][number];
export const LIFE_COMPOSITION_VERSION='LIFE-MODULES-1' as const;
export function lifecycleCapabilities(ids:readonly number[]):ReadonlySet<LifeCapability>{
 return new Set(ids.flatMap(id=>Object.hasOwn(LIFE_MODULES,id)?[...LIFE_MODULES[id as LifeModuleId]]:[]));
}
export function lifecycleComposition(ids:readonly number[]):boolean {
 const roles=new Set(ids);
 if(roles.size!==ids.length||ids.length<3||!roles.has(8)||ids.some(id=>!Object.hasOwn(LIFE_MODULES,id)))return false;
 // #8 is the only admitted independent attacker. At least one actual village
 // participant is required. Exact-role projection supports the converted Cupid
 // as a named, non-registry villager without exposing the original role ID.
 if(!ids.some(id=>[9,25,29,31,51,64,74,97].includes(id)))return false;
 return true;
}
/** Development-normal scope: only guard, lone attacker and read-only
 * investigators/observer. No new rule promotion or competitive admission.
 * Rollback closes new admission; a persisted match retains its rule profile. */
export const LIFE_DEV_SCOPE='LIFE-MODULES-1-GUARD-OBSERVATION' as const;
export const lifeDevelopmentEnabled=()=>process.env.WV_LIFE_MODULES_DEV_NORMAL==='1'&&process.env.NODE_ENV!=='production'&&process.env.WV_ARCHIVED_RULE_REGRESSION!=='1';
export function lifeDevelopmentComposition(ids:readonly number[]):boolean{
 return lifecycleComposition(ids)&&ids.includes(31)&&ids.some(id=>id===25||id===74)&&ids.every(id=>[8,25,31,64,74].includes(id));
}
export function lifeDevelopmentKey(ids:readonly number[]):string{return `dev-life-modules:${[...ids].sort((a,b)=>a-b).join(',')}`;}
export function listLifeDevelopmentCompositions(){
 if(!lifeDevelopmentEnabled())return [];
 const optional=[25,64,74];return Array.from({length:2**optional.length},(_,mask)=>[8,31,...optional.filter((_,i)=>mask&(1<<i))].sort((a,b)=>a-b)).filter(lifeDevelopmentComposition).map(ids=>({key:lifeDevelopmentKey(ids),characterIds:ids,developmentScope:LIFE_DEV_SCOPE}));
}
