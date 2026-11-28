import {life02Domain,life02RescueDomain,full50Lifecycle,SEED_SKILL,CUPID_SKILL,seedReady,seedTargets,seedRemaining,cupidReady,prolongDomain,prolongReady,prolongRemaining,prolongTargets,PROLONG_SKILL} from './life02.js';
import {cultDeck,CULT_RECRUIT,CULT_SACRIFICE} from './cult-recruitment.js';
import {mirrorDeck,MIRROR_BITE} from './mirror-investigation.js';
import {soulDeck,soulStage,SOUL_SHOT,SOUL_AMMO} from './soul-shooter.js';
import {MEDIUM_REVIVE,mediumReady,revivalDeck,eligibleRevivalTargets,REVIVE_USED} from './revival.js';
import {ENGINEER_TRAP,engineerReady,engineerDeck} from './engineer-trap.js';
import {DOG_THIEF_SKILL,dogThiefReady} from './dog-thief.js';
import {PACK_BITE,LEADER_BITE,isPackBiteSkill,isApprovedLeaderDeck,PHARMACIST_RESCUE,isFinalPackDeck,packReady,pharmacistWindow} from './final-pack.js';
import {BELL_SKILL,bellReady} from './bell-rules.js';
import {canRevenge,REVENGE_SKILL,REVENGE_SKIP} from './post-hanging-revenge.js';
import {SWAP_SKILL} from './swap-rules.js';
import {CONTRACT_SKILL,contractOfferReady,contractResponseReady} from './ballot-contract.js';
import {STONE_SKILL,stoneReady,EXILE_DOLL_SKILL,isBreakExileDeck} from './breakthrough-rules.js';
import type {GameState} from '../../../shared/contracts/index.js';
import {participant} from '../engine/state.js';
import {isAuraSeer,INSPECTION_SKILLS} from './inspection-rules.js';
import {PEACE_SKILL,PEACE_USED} from './peace-rules.js';
import {SUPPORT_SKILLS,hasActiveNightWalkLock,protectionSelection} from './support-rules.js';
import {hasActiveSoiGaiDocInjury} from './reactive-rules.js';
import {KNIGHT_SKILL} from './solo-rules.js';
import {VOTE_CONTROL_SKILL,VOTE_CONTROL_USED} from './vote-control-rules.js';
import {JUDGMENT_SKILL,JUDGMENT_USED} from './judgment-rules.js';
import {NIGHTMARE_SKILL,NIGHTMARE_USED,hasActiveNightmareLock} from './nightmare-rules.js';
import {S13_SKILLS,isS13Deck,s13UseCount,isS13SkillBlocked,isS13Maintenance,S14_ATTACKS,s14AttackAvailable,s14NumbReady,s15RevealReady,s15ViolinReady,isS15AuraDeck,s15GuardShotReady} from './s13-mechanics.js';
import {isDeepPairDeck,cupidEligible} from './deep-links.js';
import {REDIRECT_SKILLS,redirectReady,redirectEligible,redirectUses} from './deep-redirect.js';
import {isDeepRescueDeck,pendingVictims,canWitchActWhilePending,WITCH_RESCUE} from './preliminary-death.js';
export interface AllowedSkillCapability {eligibleTargetIds?:string[];remainingUses?:number;maxTargets?:number;secondTargetDead?:boolean;minTargets?:number;skillId:string;label:string;phase:'NIGHT_COLLECT'|'WITCH_WINDOW'|'DAY_VOTE_COLLECT'|'DAY_DISCUSS'|'DAY_RESOLVE';available:boolean}
const LOOKUP:Record<number,{skillId:string;label:string}>={
  5:{skillId:JUDGMENT_SKILL,label:'Cân Phán Quyết'},
  8:{skillId:KNIGHT_SKILL,label:"Tấn công ban đêm"},
  9:{skillId:SUPPORT_SKILLS[9],label:'Che chở bằng tuyết'},
  25:{skillId:INSPECTION_SKILLS[25],label:'Soi thân phận'},
  31:{skillId:SUPPORT_SKILLS[31],label:'Bảo vệ'},
  33:{skillId:VOTE_CONTROL_SKILL,label:'Điều khiển một phiếu bầu'},
  34:{skillId:SUPPORT_SKILLS[34],label:'Đi lang thang'},
  74:{skillId:INSPECTION_SKILLS[74],label:'Soi thân phận'},
  76:{skillId:NIGHTMARE_SKILL,label:'Ác Mộng: khóa kỹ năng đêm'},
  79:{skillId:PEACE_SKILL,label:'Dừng bỏ phiếu và xem thân phận'}
};
export function ownCapabilities(state:GameState,playerId:string,usedSkills:ReadonlySet<string>=new Set()):AllowedSkillCapability[]{
 const actor=participant(state,playerId),found=LOOKUP[actor.currentCharacterId];
 if(actor.currentCharacterId===51&&prolongDomain(state))return [{skillId:PROLONG_SKILL,label:'Chở người: kéo dài sự sống',phase:'NIGHT_COLLECT',minTargets:1,maxTargets:Math.min(2,prolongRemaining(state,playerId)),remainingUses:prolongRemaining(state,playerId),eligibleTargetIds:prolongTargets(state,playerId),available:!state.completed&&state.phase==='NIGHT_COLLECT'&&prolongReady(state,playerId)&&!usedSkills.has(PROLONG_SKILL)&&!actor.skillLocks.includes('*')&&!actor.skillLocks.includes(PROLONG_SKILL)&&!hasActiveNightmareLock(state,playerId)&&!hasActiveNightWalkLock(state,playerId)&&!isS13SkillBlocked(state,playerId)}];
 if(life02Domain(state)&&[27,97].includes(actor.currentCharacterId)){const seed=actor.currentCharacterId===97,id=seed?SEED_SKILL:CUPID_SKILL;return [{skillId:id,label:seed?'Trồng hạt hồi sinh':'Ghép đôi Cupid',phase:'NIGHT_COLLECT',maxTargets:seed?1:2,minTargets:seed?1:2,...(seed?{remainingUses:seedRemaining(state,playerId),eligibleTargetIds:seedTargets(state,playerId)}:{}),available:!state.completed&&state.phase==='NIGHT_COLLECT'&&(seed?seedReady(state,playerId)&&seedTargets(state,playerId).length>0:cupidReady(state,playerId))&&!usedSkills.has(id)&&!actor.skillLocks.includes('*')&&!actor.skillLocks.includes(id)&&!hasActiveNightmareLock(state,playerId)&&!hasActiveNightWalkLock(state,playerId)&&!isS13SkillBlocked(state,playerId)}];}
 if(actor.currentCharacterId===90&&cultDeck(state))return [{skillId:CULT_RECRUIT,label:'Tuyển mộ',maxTargets:1},{skillId:CULT_SACRIFICE,label:'Hiến tế: tín đồ → mục tiêu',maxTargets:2,minTargets:2}].map(c=>({...c,phase:'NIGHT_COLLECT' as const,available:!state.completed&&state.phase==='NIGHT_COLLECT'&&actor.life==='ALIVE'&&!usedSkills.has(c.skillId)&&!actor.skillLocks.includes('*')&&!actor.skillLocks.includes(c.skillId)&&!isS13SkillBlocked(state,playerId)}));
 if(canRevenge(state,playerId,REVENGE_SKILL))return [{skillId:REVENGE_SKILL,label:'Báo thù',phase:'DAY_RESOLVE',available:true,maxTargets:1},{skillId:REVENGE_SKIP,label:'Bỏ qua báo thù',phase:'DAY_RESOLVE',available:true,maxTargets:0}];
 if(actor.life==='ALIVE'&&contractResponseReady(state,playerId)){
  const base=found?[{...found,label:isAuraSeer(state,found.skillId)?'Soi hào quang':found.label,phase:'NIGHT_COLLECT' as const,available:!usedSkills.has(found.skillId)}]:[];
  return [...base,...[{skillId:CONTRACT_SKILL.accept,label:'Đồng ý giao kèo lá phiếu'},{skillId:CONTRACT_SKILL.decline,label:'Từ chối giao kèo lá phiếu'}].map(c=>({...c,phase:'NIGHT_COLLECT' as const,available:!usedSkills.has(c.skillId),maxTargets:0}))];
 }
 if(actor.currentCharacterId===19)return [{skillId:CONTRACT_SKILL.offer,label:'Giao kèo lá phiếu: người nhận → người phải bỏ phiếu',phase:'NIGHT_COLLECT',maxTargets:2,minTargets:2,available:actor.life==='ALIVE'&&state.phase==='NIGHT_COLLECT'&&contractOfferReady(state,playerId)&&!usedSkills.has(CONTRACT_SKILL.offer)}];
 if(actor.currentCharacterId===10&&engineerDeck(state))return [{skillId:ENGINEER_TRAP,label:'Đặt bẫy kỹ năng',phase:'NIGHT_COLLECT',available:!state.completed&&state.phase==='NIGHT_COLLECT'&&engineerReady(state,playerId)&&!usedSkills.has(ENGINEER_TRAP)&&!actor.skillLocks.includes('*')&&!actor.skillLocks.includes(ENGINEER_TRAP),maxTargets:1,...(state.qaProfile==='owner-bb-live-trap-qa-v1'?{remainingUses:2-actor.effects.filter(e=>e.kind==='S15_ENGINEER_TRAP_USED').length,eligibleTargetIds:state.participants.filter(p=>p.life==='ALIVE'&&p.playerId!==playerId&&!actor.effects.some(e=>e.kind==='S15_ENGINEER_TRAP_USED'&&e.payload?.targetId===p.playerId)).map(p=>p.playerId)}:{})}];
 if(actor.currentCharacterId===26&&revivalDeck(state))return [{skillId:MEDIUM_REVIVE,label:"Hồi sinh người đã chết",phase:"NIGHT_COLLECT",eligibleTargetIds:eligibleRevivalTargets(state,playerId),remainingUses:actor.effects.some(e=>e.kind===REVIVE_USED)?0:1,available:!state.completed&&state.phase==="NIGHT_COLLECT"&&actor.life==="ALIVE"&&mediumReady(state,playerId)&&!usedSkills.has(MEDIUM_REVIVE)&&!actor.skillLocks.includes("*")&&!actor.skillLocks.includes(MEDIUM_REVIVE),maxTargets:1}];
 if(actor.currentCharacterId===23&&soulDeck(state)&&soulStage(actor))return [{skillId:SOUL_SHOT,label:'Bắn linh hồn',phase:'NIGHT_COLLECT',maxTargets:1,remainingUses:actor.resources[SOUL_AMMO]??0,available:!state.completed&&state.phase==='NIGHT_COLLECT'&&actor.life==='ALIVE'&&soulStage(actor)==='REVIVED'&&(actor.resources[SOUL_AMMO]??0)>0&&!usedSkills.has(SOUL_SHOT)&&!actor.skillLocks.includes('*')&&!actor.skillLocks.includes(SOUL_SHOT)&&!isS13SkillBlocked(state,playerId)}];
 if(!found){
  const newCaps:Record<number,Array<{id:string;label:string;max?:number;phase?:'NIGHT_COLLECT'|'WITCH_WINDOW'|'DAY_DISCUSS'|'DAY_VOTE_COLLECT'}>>={
   39:[{id:DOG_THIEF_SKILL,label:'Bắt người bằng Exciter'}],
   64:[{id:BELL_SKILL,label:'Ghim hai người để nhận tin khi một người chết'}],
   37:[{id:SWAP_SKILL,label:'Tráo đổi hai người'}],
   55:[{id:STONE_SKILL,label:'Bảo vệ khỏi treo cổ'}],
   94:isBreakExileDeck(state)?[{id:EXILE_DOLL_SKILL,label:'Chọn hình nhân thế mạng'}]:[],
   63:[{id:REDIRECT_SKILLS.flag,label:'Chuyển hướng (người bảo vệ → người chịu đòn)',max:2}],
   85:[{id:REDIRECT_SKILLS.hypnosis,label:'Thôi miên'}],
   15:[{id:S13_SKILLS.darkCupid,label:isDeepPairDeck(state)?'Kết tơ: một người chết / hai người liên kết':'Kết tơ một mục tiêu (gây chết)'}],
   58:[{id:S13_SKILLS.demon,label:'So sánh hai người'}],
   71:[{id:S13_SKILLS.portrait,label:'Yểm ảo ảnh'}],
   77:[{id:S13_SKILLS.trap,label:'Đặt bẫy bảo vệ'}],
   29:[...((isDeepRescueDeck(state)||life02RescueDomain(state))?[{id:WITCH_RESCUE,label:'Bình cứu',max:1,phase:'WITCH_WINDOW' as const}]:[]),{id:S13_SKILLS.witchPoison,label:'Bình độc',max:1,phase:'WITCH_WINDOW'}],
   35:mirrorDeck(state)?[{id:MIRROR_BITE,label:'Cắn bầy (một mục tiêu)'}]:[],
   48:isApprovedLeaderDeck(state)?[{id:LEADER_BITE,label:'Cắn bầy (tối đa hai mục tiêu)'}]:[],
   93:isFinalPackDeck(state)&&actor.currentFaction==='soi'?[{id:PACK_BITE,label:'Cắn bầy (tối đa hai mục tiêu)'}]:[{id:S13_SKILLS.exile,label:'Phong ấn kỹ năng, chat và phiếu'}],
   11:[{id:S13_SKILLS.maintenance,label:'Bảo trì'}],
   17:[{id:S13_SKILLS.judgment,label:'Thiêng Khí Phán Xét',phase:'DAY_DISCUSS',max:1}],
   16:[{id:S13_SKILLS.poison,label:'Đài phun thuốc độc',max:2},{id:S13_SKILLS.antidote,label:'Bình thuốc giải',max:2}],
   68:[{id:S13_SKILLS.youngMark,label:'Chọn người chết theo'}],
   88:[{id:S13_SKILLS.hunterMark,label:'Ghim mục tiêu'}],
   72:[{id:S13_SKILLS.curse,label:'Yểm hào quang'}],
   49:[{id:S13_SKILLS.illusion,label:'Kích hoạt ảo ảnh',max:2}],
   50:[{id:S13_SKILLS.numb,label:'Gây tê'}],
   80:[{id:S13_SKILLS.violin,label:'Đối chiếu phe'}],
   54:[{id:S13_SKILLS.guardShot,label:'Bắn',max:1,phase:'DAY_DISCUSS'},{id:S13_SKILLS.publicReveal,label:'Công khai vai trò',max:1,phase:'DAY_VOTE_COLLECT'}],
   87:[{id:S13_SKILLS.sedative,label:'Bình thuốc mê',max:1},...(pharmacistWindow(state)?[{id:PHARMACIST_RESCUE,label:'Bình hồi phục',max:1,phase:'WITCH_WINDOW' as const}]:[])],
   84:[{id:S13_SKILLS.silence,label:'Làm câm'}],
   23:[{id:S13_SKILLS.soulShield,label:'Khiên linh hồn',max:1}],
   24:[{id:S13_SKILLS.jail,label:'Giam ngục'}],
   59:[{id:S13_SKILLS.stone,label:'Ném đá',phase:'DAY_DISCUSS'}],
   66:[{id:S13_SKILLS.watch,label:'Bảo vệ ban đêm',max:3}],
   67:[{id:S13_SKILLS.smith,label:'Khiên thợ rèn',max:2},{id:S13_SKILLS.sword,label:'Kiếm thợ rèn',max:1}],
   32:[{id:S13_SKILLS.gun,label:'Bắn',max:3,phase:state.phase==='DAY_DISCUSS'?'DAY_DISCUSS':'NIGHT_COLLECT'}],
   36:[{id:S13_SKILLS.fire,label:'Cầu lửa',max:2},{id:S13_SKILLS.mageShield,label:'Khiên hộ vệ',max:1}],
   43:[{id:S13_SKILLS.sniper,label:'Bắn tỉa',max:2,phase:state.phase==='DAY_DISCUSS'?'DAY_DISCUSS':'NIGHT_COLLECT'}],
   78:[{id:S13_SKILLS.meteor,label:'Mưa sao băng',max:1}],
   52:[{id:S13_SKILLS.dog,label:'Chó chặn sát thủ đơn độc',max:2}]
  };
  if(!isS13Deck(state))return [];
  return (newCaps[actor.currentCharacterId]??[]).map(c=>{
   const phase=c.phase??'NIGHT_COLLECT';const redirect=c.id===REDIRECT_SKILLS.flag||c.id===REDIRECT_SKILLS.hypnosis;const count=c.id===REDIRECT_SKILLS.flag?redirectUses(state,playerId):s13UseCount(state,playerId,c.id);
   return {skillId:c.id,label:c.label,phase,...(c.id===S13_SKILLS.darkCupid&&isDeepPairDeck(state)?{eligibleTargetIds:cupidEligible(state,playerId)}:{}),...(redirect?{eligibleTargetIds:redirectEligible(state,playerId)}:{}),...((c.id===WITCH_RESCUE||c.id===PHARMACIST_RESCUE)?{eligibleTargetIds:state.phase==='WITCH_WINDOW'?pendingVictims(state).map(p=>p.playerId):[]}:{}),...(c.max?{remainingUses:Math.max(0,c.max-count)}:{}),maxTargets:c.id===S13_SKILLS.illusion?0:c.id===S13_SKILLS.darkCupid&&isDeepPairDeck(state)?2:[BELL_SKILL,PACK_BITE,LEADER_BITE,SWAP_SKILL,S13_SKILLS.poison,S13_SKILLS.violin,S13_SKILLS.demon,REDIRECT_SKILLS.flag].some(id=>id===c.id)?2:1,...(c.id===S13_SKILLS.violin?{minTargets:2,secondTargetDead:true}:(c.id===BELL_SKILL||c.id===SWAP_SKILL||c.id===S13_SKILLS.demon||c.id===REDIRECT_SKILLS.flag)?{minTargets:2}:{}),available:!state.completed&&state.phase===phase&&
    (actor.life==='ALIVE'||actor.life==='PROLONGED'||canWitchActWhilePending(state,playerId,c.id))&&!usedSkills.has(c.id)&&(c.id!==DOG_THIEF_SKILL||dogThiefReady(state,playerId))&&(c.id!==BELL_SKILL||bellReady(state,playerId))&&(c.id!==STONE_SKILL||stoneReady(state,playerId))&&((c.id!==WITCH_RESCUE&&c.id!==PHARMACIST_RESCUE)||pendingVictims(state).length>0)&&(!isPackBiteSkill(c.id)||packReady(state,playerId))&&(!redirect||redirectReady(state,playerId))&&
    (c.id===S13_SKILLS.guardShot?s15GuardShotReady(state):c.id===S13_SKILLS.demon||!S14_ATTACKS.includes(c.id)||s14AttackAvailable(state,playerId,c.id))&&(c.id!==S13_SKILLS.publicReveal||s15RevealReady(state))&&(c.id!==S13_SKILLS.violin||s15ViolinReady(state,playerId))&&
    (c.id!==S13_SKILLS.curse||isS15AuraDeck(state,72))&&(c.id!==S13_SKILLS.illusion||isS15AuraDeck(state,49))&&(c.id!==S13_SKILLS.numb||s14NumbReady(state,playerId))&&(c.id!==S13_SKILLS.youngMark||!actor.effects.some(e=>e.kind==='S14_DEATH_MARK'))&&
    (!c.max||count<c.max)&&
    !actor.skillLocks.includes('*')&&!actor.skillLocks.includes(c.id)&&
    !hasActiveSoiGaiDocInjury(state,playerId)&&
    (isS13Maintenance(state,playerId)||(!hasActiveNightWalkLock(state,playerId)&&!hasActiveNightmareLock(state,playerId)))&&
    !isS13SkillBlocked(state,playerId)};
  });
 }
 const phase=[33,79].includes(actor.currentCharacterId)?'DAY_VOTE_COLLECT':'NIGHT_COLLECT';
 const usageExhausted=usedSkills.has(found.skillId)||
  (actor.currentCharacterId===79&&actor.effects.some(e=>e.kind===PEACE_USED))||
  (actor.currentCharacterId===33&&actor.effects.some(e=>e.kind===VOTE_CONTROL_USED))||
  (actor.currentCharacterId===9&&actor.effects.filter(e=>e.kind==='OFFICIAL_9_USED_TARGET').length>=3)||
  (actor.currentCharacterId===5&&actor.effects.filter(e=>e.kind===JUDGMENT_USED).length>=2)||
  (actor.currentCharacterId===76&&actor.effects.filter(e=>e.kind===NIGHTMARE_USED).length>=2);
 const selection=protectionSelection(state,playerId,found.skillId);
 return [{...found,...selection,...((soulDeck(state)||life02Domain(state)&&full50Lifecycle(state))&&found.skillId===KNIGHT_SKILL?{eligibleTargetIds:state.participants.filter(p=>p.playerId!==playerId).map(p=>p.playerId)}:{}),label:isAuraSeer(state,found.skillId)?'Soi hào quang':found.label,phase,available:!state.completed&&!usageExhausted&&(!selection||selection.eligibleTargetIds.length>0)&&state.phase===phase&&
  (actor.life==='ALIVE'||actor.life==='PROLONGED')&&
  !actor.skillLocks.includes('*')&&!actor.skillLocks.includes(found.skillId)&&
  !hasActiveNightWalkLock(state,playerId)&&!hasActiveNightmareLock(state,playerId)&&!hasActiveSoiGaiDocInjury(state,playerId)&&!isS13SkillBlocked(state,playerId)}];
}
