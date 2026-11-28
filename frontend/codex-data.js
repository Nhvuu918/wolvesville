/* One validated character catalogue for all Codex views. */
(() => {
'use strict';
/** Official Codex presentation. Character data is NEVER modified; no rule inference. */
const CODEX_EXPECTED_CHARACTER_IDS = 97;
const OFFICIAL_TEAMS = Object.freeze({dan:'Dân Làng',soi:'Phe Sói',phe3:'Phe Ba'});

/** Validate all 97 original character records before permitting player display. */
function validateOfficialCharacters(data) {
  if (!Array.isArray(data) || data.length !== CODEX_EXPECTED_CHARACTER_IDS) {
    throw new Error('Danh mục nhân vật chưa đủ 97 nhân vật chính thức.');
  }
  const ids = new Set(), names = new Set();
  for (const c of data) {
    if (!c || !Number.isInteger(c.id) || c.id < 1 || c.id > 97 || ids.has(c.id))
      throw new Error('Danh mục nhân vật có mã không hợp lệ hoặc bị trùng.');
    if (typeof c.name !== 'string' || !c.name.trim() ||
        typeof c.desc !== 'string' || !c.desc.trim() ||
        typeof c.team !== 'string' || !Object.hasOwn(OFFICIAL_TEAMS,c.team) ||
        typeof c.teamName !== 'string' || typeof c.aura !== 'string')
      throw new Error('Có nhân vật thiếu thông tin gốc bắt buộc.');
    if (names.has(c.name.trim().toLocaleLowerCase('vi')))
      throw new Error('Có tên nhân vật bị trùng trong danh mục chính thức.');
    names.add(c.name.trim().toLocaleLowerCase('vi'));
    ids.add(c.id);
  }
  for (let id=1; id<=97; id++) if (!ids.has(id))
    throw new Error('Danh mục nhân vật bị thiếu mã chính thức.');
  return data.slice().sort((a,b)=>a.id-b.id);
}

/** Only a presentation adapter: no gameplay eligibility or skill implementation claims. */
function toCodexViewModel(character) {
  return {
    internalId: character.id,
    displayName: character.name,
    factionKey: character.team,
    factionLabel: character.teamName || OFFICIAL_TEAMS[character.team],
    aura: character.aura,
    abilityDescription: character.desc,
    portraitUrl: `assets/portraits/${character.id}.svg`,
  };
}

function normalizeVietnamese(value) {
  return String(value ?? '').normalize('NFD').replace(/\p{M}/gu,'').replace(/[đĐ]/g, x=>x==='đ'?'d':'D').toLocaleLowerCase('vi').trim();
}

function filterOfficialCharacters(characters,{query='',team='all',favorites=[],sort='id'}={}) {
  const normalized=normalizeVietnamese(query);
  const favoritesSet=new Set(favorites);
  const list=characters.filter(c=>
    (team==='all'||(team==='fav'?favoritesSet.has(c.id):c.team===team)) &&
    (!normalized||normalizeVietnamese(c.name).includes(normalized))
  );
  return list.sort(sort==='name'
    ?(a,b)=>a.name.localeCompare(b.name,'vi')||(a.id-b.id)
    :(a,b)=>a.id-b.id);
}

function countLabel(filtered,total) {
  return filtered===total ? `${total} nhân vật` : `Đang hiển thị ${filtered} / ${total} nhân vật`;
}

window.WolvesCodexData=Object.freeze({validateOfficialCharacters,toCodexViewModel,normalizeVietnamese,filterOfficialCharacters,countLabel,CODEX_EXPECTED_CHARACTER_IDS,OFFICIAL_TEAMS});
})();
