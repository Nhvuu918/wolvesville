import type {GameState} from '../../../shared/contracts/index.js';
export type CareerFact={gameId:string;at:number;state:GameState;scope:'NORMAL'|'DEVELOPMENT'|'DEMO';resolvedActions:number};
export const badgeProgress=(p:{matches:number;differentFaction:number;sameFactionWins:number;bestDuoStreak:number})=>[
 {id:'DESTINED_SOULMATES',value:p.matches,target:100,unlocked:p.matches>=100},
 {id:'RIVALS',value:p.differentFaction,target:50,unlocked:p.differentFaction>=50},
 {id:'DUO_VICTORY',value:p.sameFactionWins,target:30,unlocked:p.sameFactionWins>=30},
 {id:'ENDLESS_FATE',value:Math.min(p.matches/100,p.differentFaction/60)*100,target:100,unlocked:p.matches>=100&&p.differentFaction>=60},
 {id:'PERFECT_DUO',value:p.bestDuoStreak,target:10,unlocked:p.bestDuoStreak>=10}
];
/** Read-only, rebuildable projection over committed final states; no increments on retry. */
export function careerProjection(me:string,input:CareerFact[],names:Map<string,string>,scope:CareerFact['scope']){
 const facts=[...new Map(input.filter(f=>f.scope===scope&&f.state.completed&&f.state.phase==='GAME_COMPLETED'&&f.state.winnerIds.length&&f.state.participants.some(p=>p.playerId===me)).map(f=>[f.gameId,f])).values()].sort((a,b)=>a.at-b.at||a.gameId.localeCompare(b.gameId));
 const roles=new Map<number,{characterId:number;matches:number;wins:number;survived:number;actions:number;finalRoleChanges:number}>(), factions:Record<string,number>={},activity:Record<string,number>={};
 const pairs=new Map<string,{id:string;name:string;matches:number;sameFaction:number;differentFaction:number;bothWon:number;sameFactionWins:number;duoStreak:number;bestDuoStreak:number;firstAt:number;lastAt:number}>();
 let wins=0,survived=0,streak=0,bestStreak=0;
 for(const f of facts){const own=f.state.participants.find(p=>p.playerId===me)!;const won=f.state.winnerIds.includes(me),alive=['ALIVE','PROLONGED'].includes(own.life);wins+=Number(won);survived+=Number(alive);streak=won?streak+1:0;bestStreak=Math.max(bestStreak,streak);const r=roles.get(own.initialCharacterId)??{characterId:own.initialCharacterId,matches:0,wins:0,survived:0,actions:0,finalRoleChanges:0};r.matches++;r.wins+=Number(won);r.survived+=Number(alive);r.actions+=f.resolvedActions;r.finalRoleChanges+=Number(own.initialCharacterId!==own.currentCharacterId);roles.set(r.characterId,r);factions[own.initialFaction]=(factions[own.initialFaction]??0)+1;const date=new Date(f.at).toISOString().slice(0,10);activity[date]=(activity[date]??0)+1;
 for(const other of f.state.participants){if(other.playerId===me||!names.has(other.playerId))continue;const p=pairs.get(other.playerId)??{id:other.playerId,name:names.get(other.playerId)!,matches:0,sameFaction:0,differentFaction:0,bothWon:0,sameFactionWins:0,duoStreak:0,bestDuoStreak:0,firstAt:f.at,lastAt:f.at};const same=own.initialFaction===other.initialFaction,both=won&&f.state.winnerIds.includes(other.playerId);p.matches++;p.sameFaction+=Number(same);p.differentFaction+=Number(!same);p.bothWon+=Number(both);p.sameFactionWins+=Number(same&&both);p.duoStreak=same&&both?p.duoStreak+1:0;p.bestDuoStreak=Math.max(p.bestDuoStreak,p.duoStreak);p.lastAt=f.at;pairs.set(p.id,p);}
 }
 const allPairs=[...pairs.values()].sort((a,b)=>b.matches-a.matches||b.lastAt-a.lastAt||a.id.localeCompare(b.id));
 return {scope,matches:facts.length,wins,losses:facts.length-wins,survived,streak,bestStreak,roles:[...roles.values()].sort((a,b)=>b.matches-a.matches||a.characterId-b.characterId),factions,activity,topPairs:allPairs.slice(0,5).map(p=>({...p,badges:scope==='NORMAL'?badgeProgress(p):[]})),badges:scope==='NORMAL'?allPairs.flatMap(p=>badgeProgress(p).filter(b=>b.unlocked).map(b=>({id:b.id,partner:p.name}))):[]};
}
