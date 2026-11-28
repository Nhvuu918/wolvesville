/* ==========================================================================
   MA SÓI NHẬP VAI — Sân Khấu Cổ Tích Đen (app.js)
   1. Dữ liệu 97 Thân Phận (Nhóm ID 01–52, Nhóm ID 53–97)
   ========================================================================== */
// The former 100-role prototype array was removed. Only the validated
// official /character.json response may populate this registry.
const ROLES = [];
let codexLoadStatus = 'loading'; // loading | ready | error
let codexLoadMessage = '';
const codexCountBadge = () => codexLoadStatus === 'ready' ? `${ROLES.length} vai` : (codexLoadStatus === 'error' ? 'Lỗi dữ liệu' : 'Đang tải');


/* ==========================================================================
   2. Quản lý Trạng thái (State Management) & Dữ liệu Mẫu (Seed Data)
   ========================================================================== */
const STORAGE_KEY = 'wolvesville_dark_fairytale_v3';
const AUTH_KEY = 'wolvesville_demo_accounts_v2';
const SESSION_KEY = 'wolvesville_demo_session_v2';

const DEFAULT_PLAYERS = [
  { id: 9001, name: 'Luna Moon' },
  { id: 9002, name: 'Bá Tước Đêm' },
  { id: 9003, name: 'Thợ Săn Sương Mù' },
  { id: 9004, name: 'Cô Bé Khăn Đỏ' },
  { id: 9005, name: 'Hắc Pháp Sư' },
  { id: 9006, name: 'Kỵ Sĩ Trăng Bạc' },
  { id: 9007, name: 'Nữ Tu Ánh Sao' },
  { id: 9008, name: 'Kẻ Gác Đêm' }
];

const DEFAULT_ROOMS = [
  {
    id: 1001,
    name: 'Dinh Thự Đồi Trăng',
    size: 12,
    status: 'waiting',
    playerIds: [9001, 9002, 9003, 9004, 9005, 9006, 9007, 9008],
    roleIds: [1, 2, 3, 5, 6, 7, 28, 32, 34, 35]
  },
  {
    id: 1002,
    name: 'Quán Trọ Nhung Đỏ',
    size: 16,
    status: 'playing',
    playerIds: [9001, 9003, 9005, 9007, 9002, 9004],
    roleIds: [1, 28, 30, 32, 34, 36]
  },
  {
    id: 1003,
    name: 'Tháp Canh Sương Mù',
    size: 9,
    status: 'waiting',
    playerIds: [9002, 9004, 9006, 9008],
    roleIds: [3, 27, 28, 31, 34]
  }
];

const DEFAULT_SCORES = {
  9001: 2450,
  9002: 2180,
  9003: 1960,
  9004: 1840,
  9005: 1720,
  9006: 1610,
  9007: 1540,
  9008: 1490
};

const DEFAULT_HISTORY = [
  {
    id: 101,
    date: '22/11/2026, 22:15',
    roomId: 1001,
    roomName: 'Dinh Thự Đồi Trăng',
    winner: 'Phe Dân Làng',
    winnerTeam: 'dan',
    scoreText: '3 : 1',
    nights: 3,
    mvpName: 'Luna Moon',
    enemyLeader: 'Bá Tước Đêm',
    rewardCoins: '+12 /H',
    rewardPoints: '+95 /H',
    logSummary: [
      'Đêm 1: Tiên Tri soi trúng Sói Đạo Tặc (#9002); Bảo Vệ che chở thành công cho Phù Thủy.',
      'Ngày 2: Hội đồng làng bỏ phiếu treo cổ Sói Tiên Tri (#9005) với 6/8 phiếu thuận.',
      'Đêm 3: Xạ Thủ kết liễu Sói Kỹ Sư, mang về chiến thắng áp đảo cho Liên Minh Dân Làng.'
    ],
    result: [
      { playerId: 9001, name: 'Luna Moon', roleId: 28, role: 'Tiên Tri', team: 'dan', stars: 5, survived: true },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 34, role: 'Bảo Vệ', team: 'dan', stars: 4, survived: true },
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 32, role: 'Phù Thủy', team: 'dan', stars: 5, survived: true },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 5, role: 'Thẩm Phán Linh Hồn', team: 'dan', stars: 4, survived: true },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 35, role: 'Xạ Thủ', team: 'dan', stars: 4, survived: false },
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 1, role: 'Sói Đạo Tặc', team: 'soi', stars: 5, survived: false },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 3, role: 'Sói Tiên Tri', team: 'soi', stars: 4, survived: false },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 10, role: 'Sói Kỹ Sư', team: 'soi', stars: 4, survived: false },
      { playerId: 9009, name: 'Ảo Ảnh Sương', roleId: 6, role: 'Đạo Diễn Tử Thần', team: 'phe3', stars: 3, survived: false },
      { playerId: 9010, name: 'Kẻ Đóng Thế', roleId: 7, role: 'Diễn Viên Sát Nhân', team: 'phe3', stars: 3, survived: false }
    ]
  },
  {
    id: 102,
    date: '22/11/2026, 21:40',
    roomId: 1002,
    roomName: 'Quán Trọ Nhung Đỏ',
    winner: 'Phe Sói',
    winnerTeam: 'soi',
    scoreText: '2 : 1',
    nights: 4,
    mvpName: 'Bá Tước Đêm',
    enemyLeader: 'Luna Moon',
    rewardCoins: '+9 /H',
    rewardPoints: '+80 /H',
    logSummary: [
      'Đêm 1: Sói Lừa Gạt tung ảo ảnh đánh lừa Tiên Tri, khiến buổi bỏ phiếu sáng hôm sau đi chệch hướng.',
      'Đêm 2: Sói Khát Máu kích hoạt cơn cuồng nộ cắn gục cả Bảo Vệ lẫn Quản Ngục.',
      'Ngày 4: Bầy Sói kiểm soát hoàn toàn số phiếu tại Quán Trọ Nhung Đỏ.'
    ],
    result: [
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 36, role: 'Sói Lừa Gạt', team: 'soi', stars: 5, survived: true },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 24, role: 'Sói Khát Máu', team: 'soi', stars: 5, survived: true },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 38, role: 'Sói Gương', team: 'soi', stars: 4, survived: true },
      { playerId: 9011, name: 'Bóng Đêm Đỏ', roleId: 46, role: 'Sói Bắn Tỉa', team: 'soi', stars: 4, survived: false },
      { playerId: 9012, name: 'Sói Thủ Lĩnh', roleId: 51, role: 'Sói Thủ Lĩnh', team: 'soi', stars: 5, survived: true },
      { playerId: 9001, name: 'Luna Moon', roleId: 2, role: 'Dorothy', team: 'dan', stars: 5, survived: false },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 27, role: 'Quản Ngục', team: 'dan', stars: 4, survived: false },
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 9, role: 'Thiên Sứ Tuyết', team: 'dan', stars: 4, survived: false },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 18, role: 'Nữ Tu Huyết Thệ', team: 'dan', stars: 4, survived: false },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 29, role: 'Thầy Đồng', team: 'dan', stars: 3, survived: false }
    ]
  },
  {
    id: 103,
    date: '22/11/2026, 20:55',
    roomId: 1003,
    roomName: 'Tháp Canh Sương Mù',
    winner: 'Phe Dân Làng',
    winnerTeam: 'dan',
    scoreText: '3 : 0',
    nights: 2,
    mvpName: 'Cô Bé Khăn Đỏ',
    enemyLeader: 'Hắc Pháp Sư',
    rewardCoins: '+7 /H',
    rewardPoints: '+85 /H',
    logSummary: [
      'Đêm 1: Phù Thủy Cấm Kỵ gieo độc khóa toàn bộ kỹ năng của Sói Biến Hình và Kỵ Sĩ Không Đầu.',
      'Ngày 2: Thẩm Phán Linh Hồn đặt bàn cân lông vũ chỉ điểm chính xác 2 kẻ ác liên tiếp.'
    ],
    result: [
      { playerId: 9004, name: 'Cô Bé Khăn Đỏ', roleId: 17, role: 'Phù Thủy Cấm Kỵ', team: 'dan', stars: 5, survived: true },
      { playerId: 9001, name: 'Luna Moon', roleId: 5, role: 'Thẩm Phán Linh Hồn', team: 'dan', stars: 5, survived: true },
      { playerId: 9003, name: 'Thợ Săn Sương Mù', roleId: 11, role: 'Thợ Rèn Cơ Khí', team: 'dan', stars: 4, survived: true },
      { playerId: 9007, name: 'Nữ Tu Ánh Sao', roleId: 39, role: 'Pháp Sư', team: 'dan', stars: 4, survived: true },
      { playerId: 9008, name: 'Kẻ Gác Đêm', roleId: 26, role: 'Xạ Thủ Linh Hồn', team: 'dan', stars: 4, survived: true },
      { playerId: 9005, name: 'Hắc Pháp Sư', roleId: 20, role: 'Sói Biến Hình', team: 'soi', stars: 4, survived: false },
      { playerId: 9002, name: 'Bá Tước Đêm', roleId: 22, role: 'Sói Kí Sinh', team: 'soi', stars: 4, survived: false },
      { playerId: 9006, name: 'Kỵ Sĩ Trăng Bạc', roleId: 8, role: 'Kỵ Sĩ Không Đầu', team: 'phe3', stars: 4, survived: false },
      { playerId: 9009, name: 'Búp Bê Cổ', roleId: 19, role: 'Búp Bê Ma Ám', team: 'phe3', stars: 3, survived: false },
      { playerId: 9010, name: 'Kẻ Mặc Cả', roleId: 21, role: 'Kẻ Mặc Cả Bóng Tối', team: 'phe3', stars: 3, survived: false }
    ]
  }
];

function loadState() {
  let raw = null;
  try {
    raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    raw = null;
  }
  const s = raw && typeof raw === 'object' ? raw : {};
  if (!Array.isArray(s.players) || !s.players.length) s.players = [...DEFAULT_PLAYERS];
  if (!Array.isArray(s.rooms) || !s.rooms.length) s.rooms = JSON.parse(JSON.stringify(DEFAULT_ROOMS));
  if (!Array.isArray(s.history) || s.history.length <= 1) s.history = JSON.parse(JSON.stringify(DEFAULT_HISTORY));
  if (!Array.isArray(s.favs)) s.favs = [1, 2, 5, 28, 32];
  if (!s.scores || typeof s.scores !== 'object') s.scores = { ...DEFAULT_SCORES };
  if (!s.activeRoom || !s.rooms.some(r => r.id === s.activeRoom)) {
    s.activeRoom = s.rooms[0]?.id || 1001;
  }
  s.rooms.forEach(r => {
    if (!Array.isArray(r.playerIds)) r.playerIds = s.players.slice(0, 6).map(p => p.id);
    if (!Array.isArray(r.roleIds)) r.roleIds = [1, 2, 3, 28, 32, 34];
    if (!r.status) r.status = 'waiting';
  });
  if (typeof s.bgmVolume !== 'number') s.bgmVolume = 45;
  if (typeof s.sfxVolume !== 'number') s.sfxVolume = 65;
  if (typeof s.particlesEnabled !== 'boolean') s.particlesEnabled = true;
  return s;
}

let state = loadState();
let page = 'rooms';       // 'rooms' (World Map Lobby) | 'ingame' (In-Game Stage) | 'roles' (Codex) | 'overview' | 'profile' | 'history' | 'ranking' | 'settings'
let filter = 'all';       // 'all' | 'dan' | 'soi' | 'phe3' | 'fav'
let query = '';
let sort = 'id';          // 'id' | 'name'
let selected = ROLES[0];
let searchComposing = false;

const $ = id => document.getElementById(id);
const save = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {}
};
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));
const portrait = c => {const id=typeof c==='object'?c.id:c;return ROLES.some(r=>r.id===Number(id))?`assets/illustrated/${id}.svg`:`assets/portraits/${id}.svg`;};
const teamLabel = c => c.team === 'soi' ? 'Phe Sói' : c.team === 'dan' ? 'Dân Làng' : 'Phe Ba';

function getActiveRoom() {
  let room = state.rooms.find(r => r.id === state.activeRoom);
  if (!room && state.rooms.length) {
    room = state.rooms[0];
    state.activeRoom = room.id;
  }
  return room;
}

/* ==========================================================================
   3. Hệ thống Âm thanh Phản hồi kiểu Game (BGM, Hover Tick, Select Chime, Typewriter)
   ========================================================================== */
let audioCtx = null;
let bgmPlaying = false;
let bgmManuallySet = false;
let bgmTimer = null;
let bgmStep = 0;

// Giai điệu hộp nhạc / piano cổ tích đen (D minor / A minor Waltz arpeggio)
const MUSIC_BOX_NOTES = [
  293.66, 349.23, 440.00, 587.33, 523.25, 440.00,
  261.63, 329.63, 440.00, 523.25, 493.88, 392.00,
  233.08, 293.66, 349.23, 466.16, 440.00, 349.23,
  220.00, 277.18, 329.63, 440.00, 329.63, 277.18
];

function ensureAudioCtx() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
      audioCtx.addEventListener('statechange', syncVillageEffects);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playMusicBoxNote(freq) {
  if (!bgmPlaying || state.bgmVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const overtone = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  overtone.type = 'triangle';
  overtone.frequency.setValueAtTime(freq * 2, now);

  const vol = (state.bgmVolume / 100) * 0.08;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

  const overtoneGain = ctx.createGain();
  overtoneGain.gain.setValueAtTime(vol * 0.25, now);
  overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  osc.connect(gain);
  overtone.connect(overtoneGain);
  overtoneGain.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  overtone.start(now);
  osc.stop(now + 1.5);
  overtone.stop(now + 0.5);
}

function toggleBGM(forceState) {
  if (typeof forceState !== 'boolean') bgmManuallySet = true;
  const next = typeof forceState === 'boolean' ? forceState : !bgmPlaying;
  if (next === bgmPlaying) return;
  bgmPlaying = next;
  const btn = $('bgmToggleBtn');
  if (bgmPlaying) {
    ensureAudioCtx();
    if (btn) {
      btn.classList.add('playing');
      btn.setAttribute('aria-pressed', 'true');
      $('bgmLabel').textContent = 'Nhạc sảnh: Bật';
    }
    playMusicBoxNote(MUSIC_BOX_NOTES[bgmStep % MUSIC_BOX_NOTES.length]);
    bgmStep++;
    clearInterval(bgmTimer);
    bgmTimer = setInterval(() => {
      playMusicBoxNote(MUSIC_BOX_NOTES[bgmStep % MUSIC_BOX_NOTES.length]);
      bgmStep++;
    }, 520);
  } else {
    clearInterval(bgmTimer);
    bgmTimer = null;
    if (btn) {
      btn.classList.remove('playing');
      btn.setAttribute('aria-pressed', 'false');
      $('bgmLabel').textContent = 'Nhạc sảnh: Tắt';
    }
  }
  syncVillageEffects();
  if (page === 'settings') settings();
}

// Tiếng tick / chuông nhỏ khi hover qua mục menu (hover.mp3)
function playHoverSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(740, now);
  osc.frequency.exponentialRampToValueAtTime(980, now + 0.045);
  const vol = (state.sfxVolume / 100) * 0.045;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0005, vol), now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.065);
}

// Tiếng chốt khóa / trống trầm khi bấm chọn (select.mp3)
function playSelectSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const sub = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.14);

  sub.type = 'sine';
  sub.frequency.setValueAtTime(146.83, now);
  sub.frequency.exponentialRampToValueAtTime(98.0, now + 0.18);

  const vol = (state.sfxVolume / 100) * 0.08;
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);

  osc.connect(gain);
  sub.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  sub.start(now);
  osc.stop(now + 0.27);
  sub.stop(now + 0.27);
}


// Wheel of Fate uses the same audio context and SFX volume as the game.
// The returned cancellation handle affects only this short personal sound.
function playFateSfx(kind, onEnded) {
  if (state.sfxVolume <= 0) return null;
  const ctx = ensureAudioCtx(); if (!ctx) return null;
  const now = ctx.currentTime, osc = ctx.createOscillator(), gain = ctx.createGain();
  const tick = kind === 'tick', result = kind === 'result';
  const duration = tick ? .045 : result ? .24 : .16;
  osc.type = tick ? 'sine' : 'triangle';
  osc.frequency.setValueAtTime(tick ? 1040 : result ? 659.25 : 293.66, now);
  osc.frequency.exponentialRampToValueAtTime(tick ? 690 : result ? 987.77 : 523.25, now + duration * .75);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(Math.max(.0002, state.sfxVolume / 100 * (tick ? .025 : .055)), now + .006);
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.onended = () => { osc.disconnect(); gain.disconnect(); onEnded?.(); };
  osc.start(now); osc.stop(now + duration + .005);
  return () => { try { gain.gain.cancelScheduledValues(ctx.currentTime); gain.gain.setValueAtTime(0, ctx.currentTime); osc.stop(); } catch {} };
}

function playCurtainSfx() {
  if (state.sfxVolume <= 0) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  const chords = [293.66, 349.23, 440.00, 587.33];
  chords.forEach((f, idx) => {
    setTimeout(() => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      const vol = (state.sfxVolume / 100) * 0.09;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, vol), now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.95);
    }, idx * 110);
  });
}

/* ==========================================================================
   4. Chuyển cảnh có nhịp điệu (Fade to Black 0.4s Scene Transition)
   ========================================================================== */
function runSceneTransition(actionFn) {
  const overlay = $('sceneTransition');
  if (!overlay || window.WolvesVisual?.reduced?.() || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    overlay?.classList.remove('active');
    actionFn();
    return;
  }
  overlay.classList.add('active');
  setTimeout(() => {
    actionFn();
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 180);
  }, 360);
}

/* ==========================================================================
   5. ① MÀN HÌNH KHỞI ĐỘNG (TITLE SCREEN — Hollow Knight & Elise Inspired)
   ========================================================================== */
let titleScreenOpen = true;
let titleTransitionPending = false;
let syncTitleParticles = () => {};

function enterNight() {
  if (!titleTransitionPending && titleScreenOpen) enterGamePage('rooms');
}

function openLandingAuth() {
  if (titleTransitionPending || !titleScreenOpen) return;
  showAuth('login');
  $('titleScreen').inert = true;
  $('authUser').focus();
}

function closeLandingAuth() {
  $('authScreen').hidden = true;
  $('titleScreen').inert = false;
  $('landingLogin').focus();
}

function enterGamePage(targetPage) {
  if (titleTransitionPending || !titleScreenOpen) return;
  titleTransitionPending = true;
  if (!bgmPlaying && !bgmManuallySet && state.bgmVolume > 0) toggleBGM(true);
  playSelectSfx();

  runSceneTransition(() => {
    titleScreenOpen = false;
    const title = $('titleScreen');
    title.hidden = true;
    title.inert = false;
    $('appShell').inert = false;
    syncTitleParticles();
    page = targetPage;
    render();
    window.scrollTo({ top: 0, behavior: 'instant' });
    $('content').focus({ preventScroll: true });
    titleTransitionPending = false;
  });
}

function openTitleScreen() {
  if (titleTransitionPending || titleScreenOpen) return;
  titleTransitionPending = true;
  playSelectSfx();

  runSceneTransition(() => {
    titleScreenOpen = true;
    $('appShell').inert = true;
    const title = $('titleScreen');
    title.hidden = false;
    title.scrollTop = 0;
    title.querySelectorAll('details[open]').forEach(details => { details.open = false; });
    syncTitleParticles();
    syncVillageEffects();
    $('landingEnter').focus({ preventScroll: true });
    titleTransitionPending = false;
  });
}

/* Canvas Hạt ánh sáng / Đom đóm bay chậm trên Title Screen */
function initParticleCanvas() {
  const canvas = $('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let w = canvas.width = canvas.clientWidth;
  let h = canvas.height = canvas.clientHeight;
  let frame = null;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let heroVisible = true;

  const particles = Array.from({ length: 56 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: 1.2 + Math.random() * 2.8,
    vx: (Math.random() - 0.5) * 0.28,
    vy: -0.18 - Math.random() * 0.42,
    alpha: 0.2 + Math.random() * 0.65,
    phase: Math.random() * Math.PI * 2,
    gold: Math.random() > 0.42
  }));

  function draw() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.phase += 0.022;
      if (p.y < -12) {
        p.y = h + 12;
        p.x = Math.random() * w;
      }
      if (p.x < -12) p.x = w + 12;
      if (p.x > w + 12) p.x = -12;

      const a = p.alpha * (0.65 + 0.35 * Math.sin(p.phase));
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3.4);
      if (p.gold) {
        grad.addColorStop(0, `rgba(243, 211, 139, ${a})`);
        grad.addColorStop(1, 'rgba(243, 211, 139, 0)');
      } else {
        grad.addColorStop(0, `rgba(244, 238, 250, ${a})`);
        grad.addColorStop(1, 'rgba(169, 123, 255, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
      ctx.fill();
    }
    frame = requestAnimationFrame(draw);
  }

  syncTitleParticles = () => {
    const shouldDraw = titleScreenOpen && heroVisible && state.particlesEnabled &&
      !document.hidden && !reducedMotion.matches;
    if (!shouldDraw) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      ctx.clearRect(0, 0, w, h);
      return;
    }
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width !== w || height !== h) {
      w = canvas.width = width;
      h = canvas.height = height;
      for (const particle of particles) {
        particle.x = Math.random() * w;
        particle.y = Math.random() * h;
      }
    }
    if (frame === null) frame = requestAnimationFrame(draw);
  };

  new IntersectionObserver(([entry]) => {
    heroVisible = entry.isIntersecting;
    syncTitleParticles();
  }, { root: $('titleScreen') }).observe(canvas);
  window.addEventListener('resize', syncTitleParticles);
  document.addEventListener('visibilitychange', syncTitleParticles);
  reducedMotion.addEventListener('change', syncTitleParticles);
  syncTitleParticles();
}

/* Điều khiển Bàn phím chuẩn Game (↑, ↓, Enter, Esc) */
function initKeyboardNavigation() {
  window.addEventListener('keydown', e => {
    const tag = document.activeElement?.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

    // Phím ← / → để xoay Vòng Tròn Thẻ Bài khi đang ở Bách khoa Thân phận
    if (!titleScreenOpen && !isTyping && page === 'roles' && codexViewMode === 'wheel') {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        spinCodexWheel(1);
        return;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        spinCodexWheel(-1);
        return;
      }
    }

    // Phím Esc: Đóng modal hoặc quay về Màn hình Title Screen
    if (e.key === 'Escape' && titleScreenOpen && !$('authScreen').hidden) {
      closeLandingAuth();
      return;
    }
    if (e.key === 'Escape' && (!isTyping || (page === 'rooms' && villagePanel))) {
      if (!$('authScreen')?.hidden) {
        $('authScreen').hidden = true;
        return;
      }
      if ($('rolePickerOverlay')) {
        closeRolePicker();
        return;
      }
      if (!$('stageCurtainOverlay')?.hidden) {
        closeStageShow();
        return;
      }
      if (page === 'rooms' && villagePanel) {
        closeVillagePanel();
        return;
      }
      if (!titleScreenOpen) {
        openTitleScreen();
      }
    }
  });
}

/* ==========================================================================
   6. Cổng Đăng nhập / Cổng vào làng (Auth Gate)
   ========================================================================== */
let authTab = 'login';

function demoAccounts() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY)) || [];
  } catch {
    return [];
  }
}

function ensureDemoAccountSeed() {
  // Legacy prototype hook. Demo identity is created exclusively by the backend.
  // Do not seed localStorage users or embed public demo credentials.
}

function currentAccount() {
  const sid = localStorage.getItem(SESSION_KEY);
  if (!sid) return null;
  return demoAccounts().find(a => String(a.id) === sid) || null;
}

function authMode(mode) {
  authTab = mode;
  const reg = mode === 'register';
  $('tabLogin').classList.toggle('active', !reg);
  $('tabRegister').classList.toggle('active', reg);
  $('authNameField').style.display = reg ? 'grid' : 'none';
  $('authConfirmField').style.display = reg ? 'grid' : 'none';
  $('authConfirm').required = reg;
  $('authName').required = reg;
  $('authTitle').textContent = reg ? 'Đăng ký cư dân mới' : 'Đăng nhập vào làng';
  $('authDesc').textContent = reg
    ? 'Khởi tạo danh tính của bạn trước khi bước qua khung cửa vòm Gothic.'
    : 'Bước qua cổng sương mù để tiếp tục ván diễn của bạn.';
  $('authSubmit').textContent = reg ? 'Đăng ký & Vào làng →' : 'Đăng nhập vào làng →';
  $('authError').textContent = '';
  $('authPass').autocomplete = reg ? 'new-password' : 'current-password';
}

function showAuth(mode = 'login') {
  playSelectSfx();
  $('authScreen').hidden = false;
  $('chat')?.classList.remove('open');
  $('authPass').value = '';
  $('authConfirm').value = '';
  authMode(mode);
}

function showRegister() {
  showAuth('register');
}

function submitAuth(e) {
  e.preventDefault();
  const user = $('authUser').value.trim();
  const pass = $('authPass').value;
  const name = $('authName').value.trim();
  const accounts = demoAccounts();
  const err = $('authError');
  err.textContent = '';

  if (!/^[a-zA-Z0-9_.]{3,30}$/.test(user)) {
    err.textContent = 'Tên đăng nhập gồm 3–30 ký tự: chữ, số, dấu chấm hoặc gạch dưới.';
    return;
  }
  if (pass.length < 6) {
    err.textContent = 'Mật khẩu cần ít nhất 6 ký tự.';
    return;
  }

  if (authTab === 'register') {
    if (!name) {
      err.textContent = 'Vui lòng nhập tên hiển thị trong làng.';
      return;
    }
    if (pass !== $('authConfirm').value) {
      err.textContent = 'Mật khẩu xác nhận không trùng khớp.';
      return;
    }
    if (accounts.some(a => a.user.toLowerCase() === user.toLowerCase())) {
      err.textContent = 'Tên đăng nhập này đã có người sử dụng.';
      return;
    }
    const id = Math.max(9001, ...accounts.map(a => a.id)) + 1;
    const newAcc = {
      id,
      user,
      name,
      pass,
      avatarId: (id % 52) + 1,
      bio: 'Cư dân mới của Sân Khấu Cổ Tích Đen.',
      location: 'Rừng Đêm Mờ Sương',
      joined: 'Tháng 11/2026'
    };
    accounts.push(newAcc);
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
    localStorage.setItem(SESSION_KEY, String(id));
    if (!state.players.some(p => p.id === id)) {
      state.players.push({ id, name });
      state.scores[id] = 1500;
      save();
    }
  } else {
    const found = accounts.find(a => a.user.toLowerCase() === user.toLowerCase() && a.pass === pass);
    if (!found) {
      err.textContent = 'Sai tên đăng nhập hoặc mật khẩu. Bạn có thể bấm "Trải nghiệm tài khoản mẫu" bên dưới!';
      return;
    }
    localStorage.setItem(SESSION_KEY, String(found.id));
  }

  playSelectSfx();
  $('authScreen').hidden = true;
  if (titleScreenOpen) {
    enterGamePage('rooms');
  } else {
    updateTopbarAccount();
    render();
  }
}

function guestAccess() {
  playSelectSfx();
  localStorage.removeItem(SESSION_KEY);
  $('authScreen').hidden = true;
  if (titleScreenOpen) {
    enterGamePage('rooms');
  } else {
    updateTopbarAccount();
    render();
  }
}

function useDemoAccount() {
  // The live integration module replaces this handler after app.js loads.
  // Fail closed if the backend adapter is unavailable.
  const e = $('authError');
  if (e) e.textContent = 'Chức năng Demo đang kết nối với máy chủ.';
}

function logoutDemo() {
  localStorage.removeItem(SESSION_KEY);
  updateTopbarAccount();
  showAuth('login');
}

/* ==========================================================================
   7. Khung điều hướng chung (App Shell — Sidebar & Topbar)
   ========================================================================== */
const NAV_GROUPS = [
  {
    group: 'Sân khấu & Thế giới',
    items: [
      { key: 'rooms', icon: '🗺️', label: 'Sảnh làng', badge: () => `${window.WolvesLive?.rooms?.length??state.rooms.length} phòng` },
      { key: 'ingame', icon: '⚔️', label: 'Trong trận', badge: () => window.WolvesLive?.game ? 'Đang chơi' : '' },
      { key: 'roles', icon: '🎭', label: 'Bách khoa', badge: codexCountBadge },
      { key: 'overview', icon: '🏰', label: 'Khám phá', badge: () => '' , unavailable: true }
    ]
  },
  {
    group: 'Cá nhân & Cộng đồng',
    items: [
      { key: 'profile', icon: '👤', label: 'Hồ sơ', badge: () => '' },
      { key: 'friends', icon: '♧', label: 'Bạn bè', badge: () => '' },
      { key: 'feed', icon: '✎', label: 'Bảng tin', badge: () => '' },
      { key: 'notifications', icon: '◉', label: 'Thông báo', badge: () => window.WolvesImmersive?.unread || '' },
      { key: 'assistant', icon: '✦', label: 'Người Giữ Luật', badge: () => '' },
      { key: 'career', icon: '✦', label: 'Sự nghiệp', badge: () => '' },
      { key: 'history', icon: '📜', label: 'Lịch sử đấu', badge: () => '' },
      { key: 'ranking', icon: '🏆', label: 'Bảng xếp hạng', badge: () => '', unavailable: true }
    ]
  },
  {
    group: 'Hệ thống',
    items: [
      { key: 'settings', icon: '⚙️', label: 'Cài đặt', badge: () => '' }
    ]
  }
];

const PAGE_META = {
  rooms:    { group: 'Thế giới', title: 'Sảnh làng' },
  ingame:   { group: 'Trong trận', title: 'Trong trận' },
  roles:    { group: 'Bách khoa', title: 'Bách khoa nhân vật' },
  overview: { group: 'Khám phá', title: 'Khám phá' },
  profile:  { group: 'Cá nhân & Cộng đồng', title: 'Thành tích & Hồ sơ cá nhân' },
  friends: {group:'Cộng đồng',title:'Bạn bè'}, feed:{group:'Cộng đồng',title:'Bảng tin'}, notifications:{group:'Cộng đồng',title:'Thông báo'}, assistant:{group:'Thư viện',title:'Người Giữ Luật'},
  career: {group:'Cá nhân & Cộng đồng',title:'Sự nghiệp'},
  history:  { group: 'Cá nhân & Cộng đồng', title: 'Lịch sử ván diễn' },
  ranking:  { group: 'Cá nhân & Cộng đồng', title: 'Bảng xếp hạng' },
  settings: { group: 'Hệ thống', title: 'Cài đặt' }
};

function toggleMobileSidebar(force) {
  const sb = $('appSidebar');
  if (!sb) return;
  if (typeof force === 'boolean') {
    sb.classList.toggle('mobile-open', force);
  } else {
    sb.classList.toggle('mobile-open');
  }
}

function go(targetPage) {
  playSelectSfx();
  toggleMobileSidebar(false);
  if (page !== targetPage) {
    runSceneTransition(() => {
      if (page === 'rooms') {
        villagePanel = null;
        villageReturnPin = null;
      }
      page = targetPage;
      render();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  } else {
    render();
  }
}

function renderSidebar() {
  const navContainer = $('nav');
  if (!navContainer) return;

  navContainer.innerHTML = NAV_GROUPS.map(g => `
    <div class="nav-group">
      <div class="nav-group-label">${esc(g.group)}</div>
      <div class="nav-list">
        ${g.items.filter(it => !(window.WolvesLive && it.unavailable)).map(it => {
          const b = it.badge();
          return `
            <button
              type="button"
              class="nav-btn ${page === it.key ? 'active' : ''}"
              onmouseenter="playHoverSfx()"
              onclick="go('${it.key}')"
            >
              <span class="nav-btn-left">
                <span class="nav-icon">${it.icon}</span>
                <span>${esc(it.label)}</span>
              </span>
              ${b ? `<span class="nav-badge">${esc(b)}</span>` : ''}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('') + `
    <div class="nav-group" style="margin-top:auto;padding-top:10px;border-top:1px solid var(--line)">
      <div class="nav-group-label">Khác</div>
      <button type="button" class="nav-btn" onmouseenter="playHoverSfx()" onclick="openTitleScreen()">
        <span class="nav-btn-left">
          <span class="nav-icon">🎬</span>
          <span>Về màn hình chào</span>
        </span>
      </button>
      <button type="button" class="nav-btn" onmouseenter="playHoverSfx()" onclick="showAuth('login')">
        <span class="nav-btn-left">
          <span class="nav-icon">🚪</span>
          <span>Đổi tài khoản</span>
        </span>
      </button>
    </div>
  `;
}

function updateTopbarAccount() {
  const acc = currentAccount();
  const bar = $('accountStrip');
  if (!bar) return;

  if (acc) {
    const avatarSrc = portrait(acc.avatarId || 2);
    bar.innerHTML = `
      <button type="button" class="account-pill" onclick="go('profile')" title="Xem Hồ sơ cá nhân">
        <img class="account-chibi" src="${avatarSrc}" alt="${esc(acc.name)}">
        <div class="account-meta">
          <strong>${esc(acc.name)}</strong>
          
        </div>
      </button>
      <button type="button" class="btn-secondary wvi-bell" onclick="go('notifications')" aria-label="Thông báo">Thông báo <span id="wvi-unread" hidden></span></button>
      <button type="button" class="btn-secondary" onclick="logoutDemo()" title="Đăng xuất và mở Cổng vào làng">Đăng xuất</button>
    `;
  } else {
    bar.innerHTML = `
      <span class="muted" style="font-size:12.5px">Khách lữ hành</span>
      <button type="button" class="btn-secondary" onclick="showAuth('login')">🚪 Đăng nhập</button>
      <button type="button" class="btn-gold" onclick="useDemoAccount()">🌙 Tài khoản mẫu</button>
    `;
  }
}

function updateBreadcrumb() {
  const meta = PAGE_META[page] || PAGE_META.rooms;
  const bc = $('breadcrumb');
  if (!bc) return;
  bc.innerHTML = `
    <span class="breadcrumb-root">🌙 Wolvesville</span>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-root">${esc(meta.group)}</span>
    <span class="breadcrumb-sep">/</span>
    <span class="breadcrumb-current">${esc(page === 'roles' && codexLoadStatus === 'ready' ? 'Bách khoa nhân vật' : meta.title)}</span>
  `;
}

function render() {
  document.body?.classList?.toggle('in-game-active', page === 'ingame');
  renderSidebar();
  updateBreadcrumb();
  updateTopbarAccount();
  const views = { rooms, ingame, roles, overview, profile, history, ranking, settings, ...Object.fromEntries(['friends','feed','notifications','assistant','history','career'].map(k=>[k,()=>window.WolvesImmersive?.render(k)])) };
  (views[page] || rooms)();
  syncVillageEffects();
  window.WolvesImmersive?.badge();
}

/* ==========================================================================
   8. ② SẢNH CHỜ DẠNG BẢN ĐỒ LÀNG (WORLD MAP LOBBY — Cảm hứng Ảnh 4)
   ========================================================================== */
const VILLAGE_ROOM_SITES = [
  { x: 49, y: 29, icon: '♜', name: 'Dinh Thự Đồi Trăng' },
  { x: 23, y: 40, icon: '♨', name: 'Quán Trọ Nhung Đỏ' },
  { x: 74, y: 40, icon: '♖', name: 'Tháp Canh Sương Mù' }
];

let villagePanel = null;
let villageReturnPin = null;
// Stable slot allocation: a room retains its marker position across server reorders
// and status/revision updates. Only map-visible rooms take a slot; the directory
// remains the complete authoritative, scrollable list.
const villageRoomSlots = new Map();
function assignVillageSlots(onlineRooms) {
  const ids = new Set(onlineRooms.map(r => r.id));
  for (const id of villageRoomSlots.keys()) if (!ids.has(id)) villageRoomSlots.delete(id);
  const occupied = new Set(villageRoomSlots.values());
  for (const room of onlineRooms) {
    if (villageRoomSlots.has(room.id)) continue;
    const free = VILLAGE_ROOM_SITES.findIndex((_, index) => !occupied.has(index));
    if (free < 0) break;
    villageRoomSlots.set(room.id, free);
    occupied.add(free);
  }
  return VILLAGE_ROOM_SITES.map((_, slot) => onlineRooms.find(r => villageRoomSlots.get(r.id) === slot) || null);
}


// A WebSocket/HTTP update must not replace a marker between pointerdown and
// pointerup: the browser would deliver click to the underlying map instead.
// Defer only network-driven re-renders until the native click finishes.
let villageGestureActive = false;
let villageGestureRefreshPending = false;
let villageGestureReleaseTimer = null;
let villagePointerStart = null;
window.WolvesLobbyGesture = {
  deferRefresh() {
    if (!villageGestureActive) return false;
    villageGestureRefreshPending = true;
    return true;
  }
};
function endVillageGesture() {
  if (!villageGestureActive) return;
  clearTimeout(villageGestureReleaseTimer);
  villageGestureReleaseTimer = setTimeout(() => {
    villageGestureActive = false;
    if (villageGestureRefreshPending && page === 'rooms') {
      villageGestureRefreshPending = false;
      rooms();
    } else villageGestureRefreshPending = false;
  }, 0);
}
document.addEventListener('pointerdown', event => {
  const pin = event.target.closest?.('.world-map-stage .map-hotspot');
  if (pin && event.isPrimary && event.button === 0) {
    clearTimeout(villageGestureReleaseTimer);
    villageGestureActive = true;
    villagePointerStart = {id: pin.dataset.roomId || null, pointerId:event.pointerId, x:event.clientX, y:event.clientY};
  }
}, {capture:true});
document.addEventListener('pointerup', event => {
  const start = villagePointerStart;
  villagePointerStart = null;
  if (start?.id && start.pointerId === event.pointerId &&
      Math.hypot(event.clientX-start.x,event.clientY-start.y) <= 14) {
    // Browser SVG compositing can retarget pointerup/click to the map even
    // when the button occupied the point on pointerdown and afterwards.
    // Activate from captured, trusted gesture; never auto-join a room.
    window.WolvesLive?.previewRoom(start.id);
  }
  endVillageGesture();
}, {capture:true});
document.addEventListener('pointercancel', () => {
  villagePointerStart = null;
  endVillageGesture();
}, {capture:true});
document.addEventListener('keydown', event => {
  if ((event.key === 'Enter' || event.key === ' ') && event.target.closest?.('.world-map-stage .map-hotspot')) {
    villageGestureActive = true;
  }
}, {capture:true});
document.addEventListener('keyup', endVillageGesture, {capture:true});

let villageAudioUnlocked = false;
let villageAmbience = null;
let villageWindBuffer = null;

function villageAmbienceLevel() {
  if (page !== 'rooms' || titleScreenOpen || document.hidden ||
      !$('stageCurtainOverlay')?.hidden || !villageAudioUnlocked || !bgmPlaying) return 0;
  return 0.14 * Math.min(100, Math.max(0, Number(state.bgmVolume) || 0)) / 100;
}

function syncVillageEffects() {
  const visible = page === 'rooms' && !titleScreenOpen && !document.hidden && $('stageCurtainOverlay')?.hidden;
  document.body.classList.toggle('village-fx-live', Boolean(visible));

  const level = villageAmbienceLevel();
  if (!level || audioCtx?.state !== 'running') {
    if (villageAmbience) {
      const { source, filter, gain } = villageAmbience;
      source.stop();
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      villageAmbience = null;
    }
    return;
  }

  const now = audioCtx.currentTime;
  if (!villageAmbience) {
    if (!villageWindBuffer) {
      // Low-rate noise is sufficient for a quiet, low-pass wind layer.
      villageWindBuffer = audioCtx.createBuffer(1, 32000, 8000);
      const samples = villageWindBuffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) {
        const gust = 0.65 + 0.3 * Math.sin(2 * Math.PI * i / samples.length);
        samples[i] = (Math.random() * 2 - 1) * gust;
      }
    }

    const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();
    source.buffer = villageWindBuffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 420;
    filter.Q.value = 0.5;
    gain.gain.setValueAtTime(0, now);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start();
    villageAmbience = { source, filter, gain };
  }

  const volume = villageAmbience.gain.gain;
  volume.cancelScheduledValues(now);
  volume.setTargetAtTime(level, now, 0.12);
}

function unlockVillageAudio(event) {
  if (!event.isTrusted) return;
  if (villageAudioUnlocked && audioCtx?.state === 'running') return;
  villageAudioUnlocked = true;
  if (villageAmbienceLevel() && audioCtx?.state !== 'running') ensureAudioCtx();
  syncVillageEffects();
}

function villagePin(key, x, y, icon, label, detail, action, status = '', roomId = null) {
  const expanded = villagePanel?.key === key;
  return `
    <button id="villagePin-${esc(key)}" class="map-hotspot${roomId ? ' map-room-marker' : ''}${expanded ? ' active' : ''}" type="button"${roomId ? ` data-room-id="${esc(roomId)}"` : ''}
      style="--pin-x:${x}%;--pin-y:${y}%" ${action.startsWith('go(') ? '' : `aria-haspopup="dialog" aria-expanded="${expanded}"`}
      onclick="${action}">
      <span class="village-pin-icon ${status}" aria-hidden="true">${icon}</span>
      <span class="hotspot-info">
        <strong>${esc(label)}</strong>
        <small>${esc(detail)}</small>
      </span>
    </button>
  `;
}

function villageRoomStatus(room) {
  return room.status === 'playing' ? 'Đang diễn ra' : 'Đang chờ';
}

function rooms() {
  const content = $('content');
  const oldDrawer = $('villageDrawer');
  const drawerScroll = $('villageDrawerBody')?.scrollTop ?? 0;
  const restoreDrawerFocus = oldDrawer?.contains(document.activeElement);
  // World map uses the same server room list as the live directory.
  // Never project prototype DEFAULT_ROOMS onto a multiplayer room pin.
  const multiplayer = window.WolvesLive;
  const onlineRooms = multiplayer?.profile ? multiplayer.rooms : [];
  const orderedRooms = [...onlineRooms].sort((a,b) => String(a.name).localeCompare(String(b.name),'vi') || String(a.id).localeCompare(String(b.id)));
  const visibleRooms = assignVillageSlots(orderedRooms);
  const roomPins = VILLAGE_ROOM_SITES.map(({ x, y, icon, name }, index) => {
    const room = visibleRooms[index];
    if (!room) return villagePin(`site-${index}`, x, y, icon, name, 'Tạo phòng mới', `openVillagePanel('create', 'site-${index}')`);
    const status = window.WolvesPlayerUX?.roomStatus(room.status) || 'Đang chờ';
    return villagePin(`room-${room.id}`, x, y, icon, room.name,
      `${room.occupied}/${room.capacity} người · ${status}`,
      `if(event.detail===0)WolvesLive.previewRoom('${String(room.id).replace(/[^a-zA-Z0-9_-]/g,'')}')`, room.status === 'IN_GAME' ? 'playing' : 'waiting', room.id);
  }).join('');
  content.innerHTML = `
    <section class="world-map-card" aria-labelledby="villageMapTitle">
      <div class="world-map-stage">
        ${villageMapArt()}
        ${villageMapEffects()}
        <header class="world-map-header">
          <h2 id="villageMapTitle">Làng Sương Mù</h2>
          <p>${multiplayer?.profile ? 'Chọn phòng trên bản đồ hoặc mở Cổng Làng để xem tất cả phòng đang có.' : 'Đăng nhập để vào phòng và gặp những cư dân khác.'}</p>
          ${multiplayer?.notice ? `<p class="wv-map-notice" role="status">${esc(multiplayer.notice)}</p>` : ''}
        </header>
        ${roomPins}
        ${villagePin('well', 49, 50, '✦', 'Giếng Làng Trung Tâm', 'Tạo phòng mới', "openVillagePanel('create', 'well')")}
        ${villagePin('archive', 23, 69, '◇', 'Bia Đá Biên Niên Sử', 'Lịch sử trận · Sắp ra mắt', "openVillagePanel('archive', 'archive')")}
        ${villagePin('library', 74, 69, '▤', 'Thư Viện Cổ Tích', 'Bách khoa vai', "go('roles')")}
        ${villagePin('directory', 49, 86, '☷', 'Cổng Làng', `${onlineRooms.length} phòng đang có`, "openVillagePanel('directory', 'directory')")}
      </div>
    </section>
    ${renderVillagePanel(!oldDrawer)}
  `;
  const drawer = $('villageDrawerBody');
  if (drawer) drawer.scrollTop = drawerScroll;
  if (restoreDrawerFocus) $('villagePanelTitle')?.focus({ preventScroll: true });
}

function openVillagePanel(kind, pin = kind) {
  playSelectSfx();
  villageReturnPin = pin;
  villagePanel = { kind, key: pin };
  rooms();
  $('villagePanelTitle')?.focus({ preventScroll: true });
}

function closeVillagePanel() {
  const pin = villageReturnPin;
  villagePanel = null;
  villageReturnPin = null;
  rooms();
  ($(`villagePin-${pin}`) || $('villagePin-directory'))?.focus({ preventScroll: true });
}

function selectActiveRoom(roomId, pin = 'directory') {
  if (!state.rooms.some(room => room.id === roomId)) return;
  state.activeRoom = roomId;
  save();
  openVillagePanel('room', pin);
}

function keepVillagePanelFocus(event) {
  if (event.key !== 'Tab' || $('rolePickerOverlay') || !$('stageCurtainOverlay')?.hidden) return;
  const controls = [...event.currentTarget.querySelectorAll('button:not([disabled]), input:not([disabled])')];
  const first = controls[0];
  const last = controls.at(-1);
  const focused = document.activeElement;
  if ((event.shiftKey && (focused === first || !controls.includes(focused))) ||
      (!event.shiftKey && focused === last)) {
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus();
  }
}

function renderVillagePanel(entering) {
  if (!villagePanel) return '';
  const activeRoom = getActiveRoom();
  let title;
  let body;

  switch (villagePanel.kind) {
    case 'create':
      title = 'Mở phòng tại Giếng Làng';
      body = `
        <form class="village-create-form" novalidate onsubmit="event.preventDefault();createRoom()">
          <label for="newRoomName">Tên phòng</label>
          <input id="newRoomName" class="input-field" placeholder="Ví dụ: Lầu Chuông Đêm">
          <label for="newRoomSize">Giới hạn người chơi</label>
          <input id="newRoomSize" class="input-field" type="number" min="1" max="100" step="1" value="12">
          <button type="submit" class="btn-gold">Tạo phòng</button>
        </form>
      `;
      break;
    case 'room':
      if (activeRoom) {
        title = activeRoom.name;
        body = renderVillageRoom(activeRoom);
        break;
      }
      // Without an active room, show the village directory.
    case 'directory':
      title = 'Danh sách phòng đấu';
      body = `
        <div class="room-cards-list">
          ${state.rooms.map(room => `
            <button type="button" class="room-item-card village-room-link" onclick="selectActiveRoom(${room.id})">
              <span class="room-item-top">
                <span class="room-code">#${room.id}</span>
                <span class="room-status ${room.status === 'playing' ? 'playing' : 'waiting'}">${villageRoomStatus(room)}</span>
              </span>
              <strong>${esc(room.name)}</strong>
              <span class="muted">${room.playerIds.length}/${room.size} người · ${room.roleIds.length} vai</span>
            </button>
          `).join('') || '<p class="empty">Chưa có phòng đấu.</p>'}
        </div>
        <button type="button" class="btn-gold" onclick="openVillagePanel('create', 'well')">Tạo phòng mới</button>
      `;
      break;
    case 'archive':
      title = 'Bia Đá Biên Niên Sử';
      body = `
        <p class="muted">${state.history.length} trận đã lưu</p>
        <div class="row">
          <button type="button" class="btn-gold" onclick="go('history')">Lịch sử đấu</button>
          <button type="button" class="btn-secondary" onclick="go('ranking')">Bảng xếp hạng</button>
        </div>
      `;
      break;
  }

  return `
    <div class="village-scrim" onclick="if(event.target===this)closeVillagePanel()">
      <section id="villageDrawer" class="village-drawer${entering ? ' entering' : ''}" role="dialog" aria-modal="true" aria-labelledby="villagePanelTitle" onkeydown="keepVillagePanelFocus(event)">
        <header class="village-drawer-header">
          <h2 id="villagePanelTitle" tabindex="-1">${esc(title)}</h2>
          <button type="button" class="btn-secondary" onclick="closeVillagePanel()" aria-label="Đóng bảng địa điểm">✕</button>
        </header>
        <div class="village-drawer-body" id="villageDrawerBody">${body}</div>
      </section>
    </div>
  `;
}

function renderVillageRoom(activeRoom) {
  const roomPlayers = activeRoom.playerIds.map(id => state.players.find(player => player.id === id)).filter(Boolean);
  const roomRoles = activeRoom.roleIds.map((id, index) => ({
    role: ROLES.find(item => item.id === id), index
  })).filter(entry => entry.role);
  const playerCount = roomPlayers.length;
  const roleCount = roomRoles.length;
  const progressPct = playerCount ? Math.min(100, Math.round(roleCount / playerCount * 100)) : 0;

  return `
    <div class="village-room-summary">
      <span class="room-code">#${activeRoom.id}</span>
      <span class="room-status ${activeRoom.status === 'playing' ? 'playing' : 'waiting'}">${villageRoomStatus(activeRoom)}</span>
      <button type="button" class="btn-secondary" onclick="deleteRoom(${activeRoom.id})">Xóa phòng</button>
    </div>
    <div class="section-header">
            <div class="row" style="margin:0">
              <label style="font-size:12.5px" class="muted">
                Giới hạn (1–100):
                <input
                  type="number"
                  min="1"
                  max="100"
                  value="${activeRoom.size}"
                  class="input-field"
                  style="width:76px;min-height:34px;padding:4px 8px;margin-left:4px"
                  onchange="updateRoomLimit(${activeRoom.id}, this.value)"
                >
              </label>
              <button type="button" class="btn-secondary" onclick="toggleRoomStatus(${activeRoom.id})">
                ${activeRoom.status === 'playing' ? '🔄 Chuyển về Đang chờ' : '🔥 Đánh dấu Đang diễn ra'}
              </button>
            </div>
          </div>

          <div class="staging-columns">
            <!-- Khối 1: Danh sách người chơi trong phòng -->
            <div class="staging-box">
              <div class="staging-box-head">
                <h4>👥 Người chơi trong phòng (${playerCount} / ${activeRoom.size})</h4>
                <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="fillSamplePlayers()">
                  + Điền nhanh người mẫu
                </button>
              </div>

              <div class="row" style="margin:0">
                <input
                  id="stagingPlayerName"
                  class="input-field"
                  style="flex:1;min-width:130px"
                  placeholder="Nhập tên người chơi mới..."
                  onkeydown="if(event.key==='Enter')addPlayerToRoom()"
                >
                <button type="button" class="btn-gold" onclick="addPlayerToRoom()">+ Thêm (#ID)</button>
              </div>

              <div class="player-chip-list">
                ${roomPlayers.map(p => `
                  <span class="player-pill">
                    <b>#${p.id}</b>
                    <span>${esc(p.name)}</span>
                    <button type="button" class="pill-remove" onclick="removePlayerFromRoom(${p.id})" title="Rời phòng">✕</button>
                  </span>
                `).join('') || '<p class="muted" style="font-size:12.5px">Chưa có người chơi trong phòng này.</p>'}
              </div>
            </div>

            <!-- Khối 2: Bộ vai của phòng -->
            <div class="staging-box">
              <div class="staging-box-head">
                <h4>🎭 Bộ vai của phòng (${roleCount} / ${playerCount} người)</h4>
                <div class="row" style="margin:0">
                  <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="autoBalanceDeck()">
                    ✨ Gợi ý cân bằng
                  </button>
                  <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="clearRoomDeck()">
                    Xóa bộ vai
                  </button>
                </div>
              </div>

              <button id="villageRolePickerButton" type="button" class="btn-gold" style="width:100%" onclick="openRolePicker()">
                ⌕ Mở bảng chọn nhanh nhân vật (+ Thêm vai)
              </button>

              <div class="deck-pill-list">
                ${roomRoles.map(({ role: r, index: idx }) => `
                  <span class="deck-pill">
                    <img src="${portrait(r)}" alt="" style="width:22px;height:22px;border-radius:6px">
                    <span class="role-id-badge">#${String(r.id).padStart(2, '0')}</span>
                    <span>${esc(r.name)}</span>
                    <button type="button" class="pill-remove" onclick="removeRoleFromRoom(${idx})" title="Bỏ vai này">✕</button>
                  </span>
                `).join('') || '<p class="muted" style="font-size:12.5px">Chưa chọn vai nào. Hãy mở bảng chọn nhanh nhân vật!</p>'}
              </div>
            </div>
          </div>

          <!-- Thanh trạng thái & Nút chính dưới cùng -->
          <div class="stage-launch-bar">
            <div style="flex:1;min-width:240px">
              <strong style="color:var(--gold);font-size:15px">
                🎬 Sẵn sàng kéo rèm: ${roleCount} vai đã chọn / ${playerCount} người chơi
              </strong>
              <div class="muted" style="font-size:12.5px;margin-top:2px">
                ${
                  playerCount === 0
                    ? 'Hãy thêm ít nhất 1 người chơi vào phòng để bắt đầu.'
                    : roleCount < playerCount
                      ? `Cần thêm ít nhất ${playerCount - roleCount} vai nữa để đủ chia cho ${playerCount} người chơi.`
                      : 'Bộ vai đã đủ! Bấm "Bắt đầu ván diễn →" để kéo rèm hoặc vào thẳng Sân Khấu Trong Trận.'
                }
              </div>
              <div class="stage-progress-track">
                <div class="stage-progress-fill" style="width:${progressPct}%"></div>
              </div>
            </div>

            <div class="row" style="margin:0">
              <button type="button" class="btn-crimson" onclick="go('ingame')">
                ⚔️ Vào sân khấu phòng
              </button>
              <button type="button" class="btn-gold btn-start-show" onclick="startStageShow()">
                🎭 Bắt đầu ván diễn →
              </button>
            </div>
          </div>
  `;
}

function villageMapEffects() {
  const houses = [[592, 187], [255, 300], [866, 274], [894, 495], [522, 504], [687, 506]];
  const lamps = [[472, 356], [716, 342], [572, 266], [602, 457], [397, 517], [782, 514], [1014, 312], [559, 609]];
  const fireflies = [[162, 456], [365, 282], [523, 396], [674, 329], [780, 425], [967, 519],
    [207, 616], [417, 575], [577, 486], [712, 606], [916, 382], [1011, 212]];
  return `
    <svg class="village-fx" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="villageFxLight">
          <stop stop-color="#ffe7b7" stop-opacity=".78"/>
          <stop offset=".38" stop-color="#ffc477" stop-opacity=".46"/>
          <stop offset="1" stop-color="#e59b57" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="villageFxFog">
          <stop stop-color="#ded8f5" stop-opacity=".41"/>
          <stop offset=".48" stop-color="#c8c0e7" stop-opacity=".24"/>
          <stop offset="1" stop-color="#bcb6da" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <g fill="url(#villageFxLight)">
        <g class="village-fx-house">
          ${houses.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="46" ry="26"/>`).join('')}
        </g>
        <g class="village-fx-lamp">
          ${lamps.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="31"/>`).join('')}
        </g>
      </g>
      <g fill="url(#villageFxFog)">
        <g class="village-fx-fog"><ellipse cx="193" cy="164" rx="190" ry="49"/><ellipse cx="792" cy="605" rx="214" ry="49"/></g>
        <g class="village-fx-fog village-fx-fog-reverse"><ellipse cx="1014" cy="131" rx="198" ry="43"/><ellipse cx="255" cy="650" rx="205" ry="54"/></g>
      </g>
      <g fill="none" stroke="#afc6dc" stroke-width="1.8" stroke-linecap="round">
        <path class="village-fx-ripples" d="M18 568q32-9 64 0m-43 45q28-8 53 1m1041-217q24-7 48 0m-71 75q37-8 74 0m-87 85q29-6 56 0m-91 138q28-7 56 0"/>
        <path class="village-fx-ripples village-fx-ripples-delayed" d="M16 656q26-6 50 0m1080-395q19-4 33 0m-76 261q31-5 66 0m-56 96q25-6 51 0"/>
      </g>
      <g fill="#ffe4a4">
        ${fireflies.map(([x, y], index) => `
          <g class="village-fx-firefly" style="--flight-delay:-${index}s;--flight-time:${9 + index % 4}s;--flight-x:${index % 2 ? -16 : 19}px">
            <circle cx="${x}" cy="${y}" r="10" fill="url(#villageFxLight)"/>
            <circle cx="${x}" cy="${y}" r="2"/>
          </g>
        `).join('')}
      </g>
    </svg>
  `;
}

function villageMapArt() {
  return `
    <svg class="world-map-svg" viewBox="0 0 1200 780" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="villageLand" cy=".45" r=".7">
          <stop stop-color="#42464a"/><stop offset=".65" stop-color="#282c3d"/><stop offset="1" stop-color="#131526"/>
        </radialGradient>
        <linearGradient id="villageWater" x2="1" y2="1">
          <stop stop-color="#182b40"/><stop offset=".55" stop-color="#385261"/><stop offset="1" stop-color="#1a3046"/>
        </linearGradient>
        <radialGradient id="villageLight">
          <stop stop-color="#f8ae6a" stop-opacity=".44"/><stop offset="1" stop-color="#f8ae6a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="villageMist">
          <stop stop-color="#b9b7db" stop-opacity=".36"/><stop offset="1" stop-color="#b9b7db" stop-opacity="0"/>
        </radialGradient>
        <pattern id="villagePaper" width="22" height="19" patternUnits="userSpaceOnUse">
          <path d="m2 5 2-1m7 9 1-1m6-9 2 1m-4 11 2-1" stroke="#e5c0a6" stroke-opacity=".12" stroke-linecap="round"/>
        </pattern>
        <g id="villageTree">
          <ellipse cx="5" cy="44" rx="22" ry="8" fill="#121827" opacity=".7"/>
          <path d="M0 0 15 22l-7-1 13 15-6-1 10 10-23-3v7h-5v-7l-21 2 10-10-5 1 12-14-6 1Z" fill="currentColor"/>
          <path d="M0 5v36l-18 2 10-11-4 1 12-15-7 3Z" fill="#bbb5ba" opacity=".14"/>
        </g>
        <g id="villagePane">
          <path d="M0 11V5a5 5 0 0 1 10 0v6Z" fill="#ffe0a1"/>
          <path d="M5 1v10M1 6h8" stroke="#985a48" stroke-width="1"/>
        </g>
        <g id="villageCottage">
          <ellipse cx="39" cy="54" rx="48" ry="20" fill="#171624" opacity=".75"/>
          <ellipse cx="41" cy="38" rx="58" ry="48" fill="url(#villageLight)"/>
          <path d="M4 23 33 9l41 13v30L33 69 4 55Z" fill="#66505a"/>
          <path d="M33 33 74 22v30L33 69Z" fill="#493b4d"/>
          <path d="m-4 26 27-29 40-10 18 40-39 12Z" fill="currentColor" stroke="#c69692" stroke-opacity=".42" stroke-width="1.4"/>
          <path d="M23-3 42 39m-36-15 27 8m-19-17 13 4m23-17 16-5m-11 20 16-5m-11 20 15-5" fill="none" stroke="#eed1ab" stroke-opacity=".24" stroke-width="1.5"/>
          <path d="M44 65V53q5-8 11-2v9" fill="#201c2c"/>
          <use href="#villagePane" x="13" y="35"/><use href="#villagePane" x="59" y="39"/>
        </g>
        <g id="villageSpire">
          <ellipse cx="22" cy="84" rx="36" ry="15" fill="#191926" opacity=".7"/>
          <path d="M5 35 22 27l19 9v44L22 90 5 81Z" fill="#726171"/>
          <path d="M22 41 41 36v44l-19 10Z" fill="#51475c"/>
          <path d="M-3 36 22-14l27 50-27 11Z" fill="currentColor" stroke="#c69692" stroke-opacity=".55"/>
          <path d="M22-14v-13l14 5-14 4m0 7v50m-16 25 33-9" fill="none" stroke="#c39581" stroke-opacity=".7"/>
          <use href="#villagePane" x="27" y="50"/><use href="#villagePane" x="10" y="56"/>
        </g>
        <g id="villageLamp">
          <circle r="23" cy="1" fill="url(#villageLight)"/>
          <path d="M0 5v16m-6-17 6-7 6 7" fill="none" stroke="#2b2334" stroke-width="2"/>
          <path d="M-4 0h8l-1 7h-6Z" fill="#ffd295"/>
        </g>
        <path id="villageRoads" d="M600 735q-30-66-23-150t20-205q12-63-4-190M596 380q-93-14-152-38T288 320Q161 333 84 413m512-33q126-30 197-76t226-6l122 40M582 510q-149-35-245 21l-108 69M580 511q119 24 211-1l104-26m-301-284q-126-38-208 4t-121 93m327-95q120-41 214-11"/>
      </defs>

      <rect width="1200" height="780" fill="url(#villageLand)"/>
      <path d="M0 106Q194 29 339 110t253-8q182-74 362-58t246 27v169q-121-132-257-101t-290 49q-117 4-260-37T0 240Z" fill="#555167" opacity=".32"/>
      <path d="M0 203Q190 111 350 158t264-7q190-63 369-50t217 49M0 239q180-115 350-54t264-20q190-54 366-35t220 48M0 284q151-102 315-76" fill="none" stroke="#b9a3aa" stroke-opacity=".2" stroke-width="2"/>
      <ellipse cx="593" cy="189" rx="181" ry="114" fill="#706167" opacity=".35"/>
      <ellipse cx="593" cy="187" rx="158" ry="91" fill="none" stroke="#c2a191" stroke-opacity=".19" stroke-width="2"/>
      <ellipse cx="597" cy="376" rx="104" ry="80" fill="#977e73" opacity=".24"/>
      <ellipse cx="597" cy="376" rx="86" ry="63" fill="none" stroke="#c4a18d" stroke-opacity=".28" stroke-width="2"/>

      <path d="M1200 135q-143 58-133 184t-49 196q-35 61-15 128t-54 137h251Z" fill="#211f31" stroke="#98829a" stroke-opacity=".3" stroke-width="4"/>
      <path d="M1200 154q-117 58-109 169t-56 207q-28 54-11 118t-52 132h228Z" fill="url(#villageWater)"/>
      <path d="M1150 241q-55 63-46 108t-25 111m65-95q-6 57-44 103t-25 109m17 59q15 58-32 110m100-249q-61 82-35 181" fill="none" stroke="#9ea9bb" stroke-opacity=".31" stroke-width="2"/>
      <path d="M0 504q108-18 144 48t-20 128q-23 34 30 100H0Z" fill="url(#villageWater)" stroke="#938596" stroke-opacity=".34" stroke-width="3"/>

      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <use href="#villageRoads" stroke="#262435" stroke-width="37"/>
        <use href="#villageRoads" stroke="#867071" stroke-width="24"/>
        <use href="#villageRoads" stroke="#bea08c" stroke-opacity=".46" stroke-width="2" stroke-dasharray="3 13"/>
      </g>
      <path d="m1039 292 100 31-8 27-99-29Z" fill="#67505b" stroke="#bb9383" stroke-width="2"/>
      <path d="m1051 296-7 28m22-24-7 28m23-23-8 28m24-23-8 28m24-23-8 28m22-23-8 28" stroke="#c29284" stroke-opacity=".55" stroke-width="2"/>
      <rect width="1200" height="780" fill="url(#villagePaper)"/>

      <g color="#303448">
        <use href="#villageTree" x="132" y="121"/><use href="#villageTree" x="169" y="110"/><use href="#villageTree" x="195" y="132"/><use href="#villageTree" x="227" y="114"/>
        <use href="#villageTree" x="330" y="76"/><use href="#villageTree" x="359" y="68"/><use href="#villageTree" x="390" y="76"/>
        <use href="#villageTree" x="793" y="59"/><use href="#villageTree" x="836" y="78"/><use href="#villageTree" x="868" y="63"/><use href="#villageTree" x="896" y="79"/>
        <use href="#villageTree" x="991" y="155"/><use href="#villageTree" x="1021" y="173"/><use href="#villageTree" x="1040" y="146"/>
      </g>
      <g color="#273744">
        <use href="#villageTree" x="78" y="402"/><use href="#villageTree" x="115" y="414"/><use href="#villageTree" x="153" y="447"/><use href="#villageTree" x="182" y="427"/>
        <use href="#villageTree" x="399" y="395"/><use href="#villageTree" x="429" y="409"/><use href="#villageTree" x="461" y="395"/>
        <use href="#villageTree" x="700" y="372"/><use href="#villageTree" x="728" y="396"/><use href="#villageTree" x="755" y="379"/>
        <use href="#villageTree" x="952" y="395"/><use href="#villageTree" x="971" y="426"/><use href="#villageTree" x="1005" y="394"/>
        <use href="#villageTree" x="352" y="622"/><use href="#villageTree" x="392" y="639"/><use href="#villageTree" x="429" y="616"/><use href="#villageTree" x="453" y="642"/>
        <use href="#villageTree" x="694" y="650"/><use href="#villageTree" x="726" y="664"/><use href="#villageTree" x="753" y="632"/>
        <use href="#villageTree" x="932" y="603"/><use href="#villageTree" x="959" y="621"/><use href="#villageTree" x="978" y="589"/>
      </g>

      <g color="#4e3e5d">
        <use href="#villageCottage" transform="translate(453 159) scale(.59)"/><use href="#villageCottage" transform="translate(686 147) scale(.63)"/>
        <use href="#villageCottage" transform="translate(499 263) scale(.61)"/><use href="#villageCottage" transform="translate(671 263) scale(.55)"/>
        <use href="#villageCottage" transform="translate(127 316) scale(.8)"/><use href="#villageCottage" transform="translate(171 271) scale(.71)"/>
        <use href="#villageCottage" transform="translate(341 264) scale(.74)"/><use href="#villageCottage" transform="translate(378 305) scale(.64)"/>
        <use href="#villageCottage" transform="translate(763 246) scale(.74)"/><use href="#villageCottage" transform="translate(940 269) scale(.72)"/>
        <use href="#villageCottage" transform="translate(437 474) scale(.7)"/><use href="#villageCottage" transform="translate(493 448) scale(.66)"/>
        <use href="#villageCottage" transform="translate(645 470) scale(.74)"/><use href="#villageCottage" transform="translate(713 459) scale(.68)"/>
      </g>

      <g color="#57405b">
        <ellipse cx="587" cy="181" rx="116" ry="74" fill="url(#villageLight)"/>
        <path d="m520 168 70-35 69 25v48l-70 29-69-26Z" fill="#716474" stroke="#a08b91" stroke-width="2"/>
        <path d="m540 166 45-60 54 50-50 24Z" fill="#5c3b58" stroke="#bd9290" stroke-width="2"/>
        <use href="#villageSpire" transform="translate(523 107) scale(.89)"/><use href="#villageSpire" transform="translate(625 102) scale(.91)"/>
        <use href="#villageSpire" transform="translate(569 78) scale(1.13)"/>
        <use href="#villagePane" x="551" y="183"/><use href="#villagePane" x="576" y="192"/><use href="#villagePane" x="612" y="182"/>
      </g>
      <use href="#villageCottage" color="#874757" transform="translate(218 239) scale(1.45)"/>
      <use href="#villageCottage" color="#6f4357" transform="translate(282 277) scale(.87)"/>
      <use href="#villageSpire" color="#604a70" transform="translate(837 178) scale(1.47)"/>
      <use href="#villageCottage" color="#53425d" transform="translate(887 252) scale(.86)"/>

      <g transform="translate(593 354)">
        <circle r="51" fill="url(#villageLight)"/>
        <ellipse cy="32" rx="43" ry="14" fill="#272531"/>
        <path d="M-31 8v19q30 24 61 0V8" fill="#797184" stroke="#be9d9c" stroke-width="2"/>
        <ellipse cy="8" rx="31" ry="12" fill="#323949" stroke="#c6aaa5" stroke-width="3"/>
        <path d="M-24 4v-28m49 27v-27M-36-22l14-21 41-2 19 25Z" stroke="#b08888" stroke-width="3" fill="#5f3e5b"/>
      </g>

      <g transform="translate(284 506)">
        <ellipse cy="16" rx="65" ry="48" fill="url(#villageLight)"/>
        <path d="m-41 39 23-12 43 8-20 12Z" fill="#797481" stroke="#a68c92" stroke-width="2"/>
        <path d="M-25 33v-54l17-24 30 19v63Z" fill="#6b647c" stroke="#b0929c" stroke-width="2"/>
        <path d="m-4-17 6 10-6 10-6-10Zm-9 28 20 3m-20 6 15 2" fill="none" stroke="#e6b883" stroke-width="2"/>
      </g>
      <use href="#villageCottage" color="#785061" transform="translate(838 438) scale(1.32)"/>
      <use href="#villageSpire" color="#60445d" transform="translate(909 421) scale(.59)"/>
      <g>
        <use href="#villageLamp" x="472" y="356"/><use href="#villageLamp" x="716" y="342"/>
        <use href="#villageLamp" x="572" y="266"/><use href="#villageLamp" x="602" y="457"/>
        <use href="#villageLamp" x="397" y="517"/><use href="#villageLamp" x="782" y="514"/>
        <use href="#villageLamp" x="1014" y="312"/><use href="#villageLamp" x="559" y="609"/>
      </g>
      <g fill="url(#villageMist)">
        <ellipse cx="144" cy="155" rx="223" ry="64"/><ellipse cx="979" cy="108" rx="267" ry="66"/>
        <ellipse cx="201" cy="649" rx="234" ry="59"/><ellipse cx="1055" cy="592" rx="261" ry="62"/>
      </g>
      <path d="M45 40h1110v700H45Zm12 12v676h1086V52Z" fill="#c6a688" fill-opacity=".16" fill-rule="evenodd"/>
      <g transform="translate(1034 106)" stroke="#c9ab8a" fill="none" opacity=".62">
        <circle r="24"/><path d="M0-35 7-7 34 0 7 7 0 35-7 7-34 0-7-7Z"/><path d="M0-35 7-7 0 0Z" fill="#d8b691"/>
      </g>
    </svg>
  `;
}

/* ==========================================================================
   9. ③ MÀN HÌNH TRONG TRẬN (IN-GAME STAGE — Cảm hứng Ảnh 5)
   HUD góc trên trái + Sân khấu Rừng đêm/Bình minh + Hộp thoại Typewriter ở đáy
   ========================================================================== */
let stageState = {
  phase: 'night',      // 'night' | 'day'
  dayNumber: 1,
  myRoleId: 28,        // Tiên Tri mặc định (có thể đổi trực tiếp)
  targetPlayerId: 9002,
  charges: { skill: 2, shield: 1, potion: 1 },
  hp: 4,
  maxHp: 5,
  votes: {
    9002: 2,
    9005: 1
  },
  dayChatMessages: [
    { author: '#9001 Luna Moon (Tiên Tri)', time: '09:15', text: 'Đêm qua mình đã soi #9002 Bá Tước Đêm ra hào quang Ác! Mọi người tập trung vote #9002 nhé!', me: true },
    { author: '#9002 Bá Tước Đêm', time: '09:18', text: 'Khoan vội! Đêm qua có Sói Ảo Ảnh hoặc Sói Lừa Gạt làm nhiễu kết quả soi đó, mình là Dân mà!' },
    { author: '#9003 Thợ Săn Sương Mù (Bảo Vệ)', time: '09:22', text: 'Đêm qua mình đã bật khiên bảo vệ cho #9001 Luna Moon. Mình tin Tiên Tri, mình bỏ phiếu #9002!' },
    { author: '⚖️ Hội Đồng Làng', time: '09:25', text: 'Thợ Săn Sương Mù (#9003) và Cô Bé Khăn Đỏ (#9004) đã bỏ phiếu treo cổ Bá Tước Đêm (#9002).', systemVote: true }
  ],
  seatStatuses: {
    9001: ['🛡️ Có khiên'],
    9002: ['🎯 Bị tình nghi'],
    9003: [],
    9004: ['🛡️ Có khiên'],
    9005: ['⛓️ Bị xích'],
    9006: [],
    9007: ['🔮 Đã soi: Thiện'],
    9008: ['💀 Đã ngã xuống']
  },
  speaker: 'Quản Trò Bóng Đêm',
  speakerImg: 'assets/redhood.png',
  dialogue: 'Đêm thứ nhất buông xuống Làng Sương Mù... Ánh trăng lưỡi liềm treo trên đỉnh lâu đài cổ. Hãy chọn một người chơi trên sân khấu để thi triển kỹ năng đêm!'
};

function runTypewriter(text) {
  // Sprint 03: all dialogue is available immediately. No character timer or click-sound.
  const el = $('stageTypewriterText');
  if (el) el.textContent = String(text ?? '');
}

function ingame() {
  const room = getActiveRoom();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const roomPlayers = (room ? room.playerIds : DEFAULT_PLAYERS.map(p => p.id))
    .map(pid => state.players.find(p => p.id === pid))
    .filter(Boolean);
  const targetPlayer = state.players.find(p => p.id === stageState.targetPlayerId) || roomPlayers[0];
  const isNight = stageState.phase === 'night';
  const totalVotes = Object.values(stageState.votes || {}).reduce((a, b) => a + b, 0);

  const heartsHtml = Array.from({ length: stageState.maxHp }, (_, idx) =>
    idx < stageState.hp ? '❤️' : '🖤'
  ).join(' ');

  $('content').innerHTML = `
    <section class="ingame-stage-wrap ${isNight ? 'night-phase' : 'day-phase'}">
      <!-- Biểu ngữ Pha duy nhất ở chính giữa đỉnh màn hình (Không lặp lại ở HUD dưới) -->
      <div class="phase-sky-banner">
        ${isNight
          ? `🌙 PHA BAN ĐÊM (ĐÊM THỨ ${stageState.dayNumber}) — CẢ LÀNG NHẮM MẮT · KẺ ĐÊM THỨC GIẤC`
          : `☀️ PHA BAN NGÀY (NGÀY THỨ ${stageState.dayNumber}) — BÌNH MINH THẢO LUẬN & BỎ PHIẾU TREO CỔ (${totalVotes} PHIẾU)`}
      </div>

      <!-- Bối cảnh Sân Khấu Tràn Màn Hình SVG: Phân biệt rõ Ban Đêm ↔ Ban Ngày -->
      <svg class="ingame-backdrop-svg" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="nightMoonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFF5D6" stop-opacity="0.65"/>
            <stop offset="45%" stop-color="#F3D38B" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#2A1B47" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="daySunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#FFFDF0" stop-opacity="0.95"/>
            <stop offset="35%" stop-color="#FDE08D" stop-opacity="0.55"/>
            <stop offset="100%" stop-color="#F6AD55" stop-opacity="0"/>
          </radialGradient>
        </defs>

        ${isNight ? `
          <!-- BẦU TRỜI BAN ĐÊM -->
          <g fill="#F4EEFA" opacity="0.8">
            <circle cx="120" cy="85" r="1.8"/><circle cx="260" cy="140" r="1.4"/><circle cx="390" cy="65" r="2.2"/>
            <circle cx="520" cy="110" r="1.5"/><circle cx="880" cy="70" r="2"/><circle cx="1050" cy="120" r="1.6"/>
            <circle cx="1240" cy="80" r="2.2"/><circle cx="1350" cy="160" r="1.5"/><circle cx="190" cy="220" r="1.5"/>
          </g>
          <circle cx="720" cy="210" r="185" fill="url(#nightMoonHalo)"/>
          <path d="M735 125 A76 76 0 1 0 735 265 A58 58 0 1 1 735 125 Z" fill="#F3D38B"/>
          <path d="M0 440 Q220 360 460 415 T940 400 T1440 430 L1440 800 L0 800 Z" fill="#16132B" opacity="0.82"/>
          <path d="M0 530 Q360 450 720 510 T1440 495 L1440 800 L0 800 Z" fill="#100D22"/>
        ` : `
          <!-- BẦU TRỜI BAN NGÀY -->
          <circle cx="720" cy="215" r="240" fill="url(#daySunHalo)"/>
          <g stroke="#FFF9DB" stroke-width="28" stroke-opacity="0.18" stroke-linecap="round">
            <line x1="720" y1="215" x2="220" y2="60"/>
            <line x1="720" y1="215" x2="360" y2="20"/>
            <line x1="720" y1="215" x2="1080" y2="20"/>
            <line x1="720" y1="215" x2="1220" y2="60"/>
            <line x1="720" y1="215" x2="180" y2="280"/>
            <line x1="720" y1="215" x2="1260" y2="280"/>
          </g>
          <circle cx="720" cy="215" r="68" fill="#FFFBEB"/>
          <g fill="#FFFFFF" opacity="0.72">
            <ellipse cx="290" cy="180" rx="95" ry="28"/>
            <ellipse cx="330" cy="168" rx="65" ry="24"/>
            <ellipse cx="1110" cy="165" rx="105" ry="30"/>
            <ellipse cx="1065" cy="152" rx="70" ry="24"/>
          </g>
          <path d="M0 450 Q260 365 540 420 T1060 405 T1440 435 L1440 800 L0 800 Z" fill="#4A7C59" opacity="0.88"/>
          <path d="M0 545 Q380 465 740 525 T1440 510 L1440 800 L0 800 Z" fill="#2F523B"/>
        `}

        <!-- Tòa Lâu Đài Cổ Tích Gothic bên phải -->
        <g transform="translate(1060, 210)">
          <rect x="75" y="110" width="130" height="290" rx="4" fill="${isNight ? '#131126' : '#4A435A'}"/>
          <path d="M45 112 Q140 5 235 112 Z" fill="${isNight ? '#241D3D' : '#6C5B7B'}"/>
          <rect x="5" y="210" width="105" height="190" rx="4" fill="${isNight ? '#181530' : '#574F68'}"/>
          <path d="M-12 212 Q57 120 126 212 Z" fill="${isNight ? '#2C234A' : '#7B688A'}"/>
          <rect x="180" y="235" width="95" height="165" rx="4" fill="${isNight ? '#181530' : '#574F68'}"/>
          <path d="M165 237 Q227 160 290 237 Z" fill="${isNight ? '#2C234A' : '#7B688A'}"/>
          <circle cx="57" cy="252" r="16" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
          <rect x="126" y="155" width="28" height="44" rx="14" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
          <rect x="215" y="272" width="24" height="36" rx="12" fill="${isNight ? '#F3D38B' : '#BEE3F8'}"/>
        </g>

        <!-- Rừng cây cổ tích bên trái & Đèn lồng -->
        <g fill="${isNight ? '#0C0A18' : '#263E2E'}">
          <path d="M110 640 Q135 460 105 340 Q60 270 20 235 Q85 260 125 320 Q155 240 215 195 Q165 260 148 345 Q205 305 275 305 Q205 330 155 405 L162 640 Z"/>
          <path d="M390 640 Q410 500 385 390 Q340 320 300 290 Q355 312 395 365 Q428 295 485 260 Q438 318 415 395 L425 640 Z"/>
        </g>
        <line x1="230" y1="312" x2="230" y2="365" stroke="#5A4878" stroke-width="2"/>
        <rect x="221" y="365" width="18" height="24" rx="5" fill="${isNight ? '#F3D38B' : '#CBD5E0'}"/>
        ${isNight ? '<circle cx="230" cy="377" r="28" fill="url(#nightMoonHalo)"/>' : ''}

        <path d="M0 615 Q720 575 1440 615 L1440 800 L0 800 Z" fill="${isNight ? '#090814' : '#1E2D24'}"/>
      </svg>

      <!-- 1. Góc trên bên trái & phải (HUD tinh gọn, không còn nút/nhãn trùng lặp) -->
      <header class="ingame-hud-top">
        <div class="hud-left-cluster">
          <div class="hud-hearts" title="Sinh mệnh & Tinh thần hiện tại">
            <span>${heartsHtml}</span>
            <span class="muted" style="font-size:12.5px;letter-spacing:0;margin-left:8px">
              Phòng #${room?.id || 1001} · ${esc(room?.name || 'Dinh Thự Đồi Trăng')}
            </span>
          </div>

          <div class="hud-slots-row">
            <div class="hud-slot active-role" title="Thân phận đang nhập vai">
              <img src="${portrait(myRole)}" alt="${esc(myRole.name)}">
              <div>
                <strong style="color:var(--gold)">#${String(myRole.id).padStart(2, '0')} ${esc(myRole.name)}</strong>
                <span class="muted" style="font-size:11px;display:block">${teamLabel(myRole)} · Hào quang: ${esc(myRole.aura)}</span>
              </div>
            </div>

            <div class="hud-slot">
              <span>🔮 Kỹ năng:</span>
              <b style="color:var(--gold)">${stageState.charges.skill}</b>
            </div>
            <div class="hud-slot">
              <span>🛡️ Khiên:</span>
              <b style="color:var(--gold)">${stageState.charges.shield}</b>
            </div>
            <div class="hud-slot">
              <span>🧪 Đạo cụ:</span>
              <b style="color:var(--gold)">${stageState.charges.potion}</b>
            </div>
          </div>
        </div>

        <div class="hud-right-cluster">
          <select
            class="input-field"
            style="min-height:36px;padding:5px 10px;font-size:12.5px"
            aria-label="Đổi vai nhập vai thử nghiệm"
            onchange="changeMyStageRole(Number(this.value))"
          >
            ${ROLES.slice(0, 52).map(r => `
              <option value="${r.id}" ${r.id === myRole.id ? 'selected' : ''}>
                Hóa thân: #${String(r.id).padStart(2, '0')} ${esc(r.name)}
              </option>
            `).join('')}
          </select>
          <button type="button" class="btn-gold" style="padding:7px 14px;font-size:12.5px" onclick="toggleStagePhase()">
            ${isNight ? '☀️ Sang Ban Ngày (Thảo luận & Vote)' : '🌙 Sang Ban Đêm (Hành động)'}
          </button>
          <button type="button" class="btn-secondary" style="padding:7px 12px;font-size:12.5px" onclick="go('rooms')">
            🗺️ Rời trận
          </button>
        </div>
      </header>

      <!-- 2. Trung tâm sân khấu: Ban đêm chỉ hiện Vòng người chơi | Ban ngày mở thêm Khung Chat Thảo Luận & Vote -->
      <div class="ingame-arena ${!isNight ? 'day-split-layout' : ''}">
        <div class="arena-players-grid">
          ${roomPlayers.map((p, idx) => {
            const isTarget = p.id === stageState.targetPlayerId;
            const badges = stageState.seatStatuses[p.id] || [];
            const isDead = badges.some(b => b.includes('💀'));
            const voteCount = stageState.votes?.[p.id] || 0;
            const avatarRoleId = (room?.roleIds?.[idx % (room?.roleIds?.length || 1)]) || ((idx % 52) + 1);
            return `
              <div
                class="arena-seat ${isTarget ? 'targeted' : ''} ${isDead ? 'dead' : ''}"
                onmouseenter="playHoverSfx()"
                onclick="selectStageTarget(${p.id})"
              >
                ${!isNight && voteCount > 0 ? `<span class="vote-tally-pill">⚖️ ${voteCount} phiếu</span>` : ''}
                <img class="arena-seat-avatar" src="${stageState.liveServerBoard?'assets/anonymous-player.svg':portrait(avatarRoleId)}" alt="${esc(p.name)}">
                <span class="role-id-badge">#${p.id}</span>
                <div class="arena-seat-name">${esc(p.name)}</div>
                <div class="arena-seat-badges">
                  ${isTarget ? '<span class="seat-badge" style="color:var(--gold);border-color:var(--border-gold-hover)">🎯 Đang chọn</span>' : ''}
                  ${badges.map(b => `<span class="seat-badge">${esc(b)}</span>`).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        ${!isNight ? `
          <!-- KHUNG CHAT HỘI ĐỒNG LÀNG BAN NGÀY: Thảo luận & Bỏ phiếu trực tiếp -->
          <aside class="day-discussion-panel" aria-label="Khung chat thảo luận và bỏ phiếu ban ngày">
            <div class="day-chat-header">
              <strong>💬 Hội Đồng Làng · Thảo Luận & Vote</strong>
              <span class="nav-badge">${stageState.dayChatMessages.length} tin nhắn</span>
            </div>

            <div class="day-chat-messages" id="dayChatMessagesBox">
              ${stageState.dayChatMessages.map(m => `
                <div class="day-chat-msg ${m.me ? 'me' : ''} ${m.systemVote ? 'vote-system' : ''}">
                  <div class="day-chat-author">
                    <span>${esc(m.author)}</span>
                    <small style="opacity:0.75">${esc(m.time || 'Ban ngày')}</small>
                  </div>
                  <div>${esc(m.text)}</div>
                </div>
              `).join('')}
            </div>

            <!-- Thanh câu thoại báo cáo nhanh 1 chạm -->
            <div class="day-quick-phrases">
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('seer')">
                🔮 Báo kết quả soi #${targetPlayer?.id || 9002}
              </button>
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('vote')">
                ⚖️ Kêu gọi vote #${targetPlayer?.id || 9002}
              </button>
              <button type="button" class="day-quick-btn" onclick="sendDayQuickPhrase('defend')">
                🛡️ Tôi thuộc Phe Dân Làng!
              </button>
            </div>

            <form class="day-chat-form" onsubmit="sendDayChatMessage(event)">
              <input
                id="dayChatInput"
                placeholder="Nhập lời thảo luận hoặc biện hộ trước làng..."
                autocomplete="off"
              >
              <button type="submit" class="btn-gold" style="padding:6px 12px;font-size:12px">Gửi ➤</button>
            </form>
          </aside>
        ` : ''}
      </div>

      <!-- 3. Đáy màn hình: Hộp thoại theo ngữ cảnh (Ban Đêm = Kỹ năng | Ban Ngày = Bỏ phiếu, không trùng nút chuyển pha) -->
      <footer class="ingame-dialogue-bar">
        <div class="dialogue-portrait-box">
          <img src="${esc(stageState.speakerImg)}" alt="${esc(stageState.speaker)}">
        </div>

        <div class="dialogue-text-area">
          <span class="dialogue-speaker">
            ${esc(stageState.speaker)} · Mục tiêu đang chọn: ${targetPlayer ? `${targetPlayer.name} (#${targetPlayer.id})` : 'Chưa chọn'}
          </span>
          <p class="dialogue-typewriter" id="stageTypewriterText"></p>
        </div>

        <div class="dialogue-choices">
          ${isNight ? `
            <button type="button" class="dialogue-choice-btn primary-choice" onmouseenter="playHoverSfx()" onclick="stageActionUseSkill()">
              ✦ DÙNG KỸ NĂNG ĐÊM
            </button>
            <button type="button" class="dialogue-choice-btn" onmouseenter="playHoverSfx()" onclick="stageActionToggleBadge()">
              🛡️ GẮN KHIÊN / XÍCH
            </button>
          ` : `
            <button type="button" class="dialogue-choice-btn primary-choice" onmouseenter="playHoverSfx()" onclick="stageActionVote()">
              ⚖️ BỎ PHIẾU TREO CỔ (#${targetPlayer?.id || 9002})
            </button>
            <button type="button" class="dialogue-choice-btn" onmouseenter="playHoverSfx()" onclick="executeDayVoteVerdict()">
              🔥 CHỐT PHIẾU XỬ QUYẾT
            </button>
          `}
        </div>
      </footer>
    </section>
  `;

  runTypewriter(stageState.dialogue);
  const chatBox = $('dayChatMessagesBox');
  if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
}

function selectStageTarget(playerId) {
  playSelectSfx();
  stageState.targetPlayerId = playerId;
  const target = state.players.find(p => p.id === playerId);
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.speaker = `${myRole.name} (#${String(myRole.id).padStart(2, '0')})`;
  stageState.speakerImg = portrait(myRole);
  stageState.dialogue = stageState.phase === 'night'
    ? `Đang chọn ${target?.name || 'người chơi'} (#${playerId}). Nhấn [ ✦ DÙNG KỸ NĂNG ĐÊM ] để thi triển năng lực của ${myRole.name}.`
    : `Đang chỉ định ${target?.name || 'người chơi'} (#${playerId}). Bạn có thể thảo luận ở khung Chat bên phải hoặc nhấn [ ⚖️ BỎ PHIẾU TREO CỔ ].`;
  ingame();
}

function changeMyStageRole(roleId) {
  playSelectSfx();
  const r = ROLES.find(x => x.id === roleId) || ROLES[0];
  stageState.myRoleId = r.id;
  stageState.charges = { skill: 2, shield: 1, potion: 1 };
  stageState.speaker = `${r.name} (${teamLabel(r)})`;
  stageState.speakerImg = portrait(r);
  stageState.dialogue = `Bạn đã hóa thân thành ${r.name}: "${r.desc.split(/\n/)[0]}"`;
  ingame();
}

function stageActionUseSkill() {
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  if (stageState.charges.skill <= 0) {
    stageState.speaker = 'Quản Trò Bóng Đêm';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `Kỹ năng của ${myRole.name} đã hết lượt sử dụng trong đêm nay! Hãy bấm nút "☀️ Sang Ban Ngày" trên góc phải để bước vào phiên thảo luận.`;
    runTypewriter(stageState.dialogue);
    return;
  }
  stageState.charges.skill = Math.max(0, stageState.charges.skill - 1);
  const pid = stageState.targetPlayerId;
  stageState.seatStatuses[pid] = stageState.seatStatuses[pid] || [];
  const tag = myRole.team === 'soi' ? '🐺 Bị Sói nhắm' : myRole.team === 'dan' ? '✨ Được kiểm tra/hộ vệ' : '🔮 Dính ấn Phe Ba';
  if (!stageState.seatStatuses[pid].includes(tag)) {
    stageState.seatStatuses[pid].push(tag);
  }
  stageState.speaker = myRole.name;
  stageState.speakerImg = portrait(myRole);
  stageState.dialogue = `[KỸ NĂNG ĐÊM] ${myRole.name} đã thi triển năng lực lên ${target?.name || 'mục tiêu'} (#${pid})! Kết quả đã được ghi nhận.`;
  ingame();
}

function stageActionVote() {
  playSelectSfx();
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  const pid = stageState.targetPlayerId;
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.votes[pid] = (stageState.votes[pid] || 0) + 1;

  stageState.dayChatMessages.push({
    author: '⚖️ Hội Đồng Làng',
    time: 'Vừa xong',
    text: `Luna Moon (${myRole.name}) đã bỏ 1 phiếu treo cổ ${target?.name || 'người chơi'} (#${pid}) → Tổng: ${stageState.votes[pid]} phiếu.`,
    systemVote: true
  });

  stageState.speaker = 'Hội Đồng Làng Sương Mù';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `[BỎ PHIẾU PHÁN XÉT] Bạn đã bỏ phiếu treo cổ ${target?.name || 'người chơi'} (#${pid}) — hiện có ${stageState.votes[pid]} phiếu!`;
  ingame();
}

function executeDayVoteVerdict() {
  playCurtainSfx();
  const entries = Object.entries(stageState.votes || {});
  if (!entries.length) {
    stageState.dialogue = 'Chưa có lá phiếu nào được bỏ trong ngày hôm nay!';
    runTypewriter(stageState.dialogue);
    return;
  }
  entries.sort((a, b) => b[1] - a[1]);
  const [topIdStr, topVotes] = entries[0];
  const topId = Number(topIdStr);
  const topPlayer = state.players.find(p => p.id === topId);
  stageState.seatStatuses[topId] = ['💀 Bị treo cổ (' + topVotes + ' phiếu)'];

  stageState.dayChatMessages.push({
    author: '🔥 Phán Quyết Quảng Trường',
    time: 'Kết thúc ngày',
    text: `Với ${topVotes} phiếu bầu cao nhất, ${topPlayer?.name || 'người chơi'} (#${topId}) đã bị xử quyết trên giàn treo cổ!`,
    systemVote: true
  });

  stageState.speaker = 'Phán Quyết Hội Đồng';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `[XỬ QUYẾT HOÀN TẤT] ${topPlayer?.name || 'Người chơi'} (#${topId}) đã bị treo cổ với ${topVotes} phiếu bầu! Hãy bấm "🌙 Sang Ban Đêm" ở góc trên phải để bước sang đêm kế tiếp.`;
  ingame();
}

function sendDayChatMessage(e) {
  e.preventDefault();
  const input = $('dayChatInput');
  const text = input?.value.trim();
  if (!text) return;
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  stageState.dayChatMessages.push({
    author: `#9001 Luna Moon (${myRole.name})`,
    time: 'Vừa xong',
    text,
    me: true
  });
  input.value = '';
  ingame();
}

function sendDayQuickPhrase(type) {
  playSelectSfx();
  const myRole = ROLES.find(r => r.id === stageState.myRoleId) || ROLES[0];
  const target = state.players.find(p => p.id === stageState.targetPlayerId);
  const tName = `${target?.name || 'mục tiêu'} (#${stageState.targetPlayerId})`;
  let text = '';
  if (type === 'seer') {
    text = `Đêm qua mình dùng kỹ năng kiểm tra ${tName} và phát hiện dấu hiệu đáng ngờ, mọi người chú ý!`;
  } else if (type === 'vote') {
    text = `Mình đề nghị cả làng dồn phiếu treo cổ ${tName} ngay trong hôm nay!`;
  } else {
    text = `Mình giữ vai ${myRole.name} thuộc ${teamLabel(myRole)}, đừng treo cổ nhầm mình nhé!`;
  }
  stageState.dayChatMessages.push({
    author: `#9001 Luna Moon (${myRole.name})`,
    time: 'Vừa xong',
    text,
    me: true
  });
  ingame();
}

function stageActionToggleBadge() {
  playSelectSfx();
  const pid = stageState.targetPlayerId;
  const target = state.players.find(p => p.id === pid);
  const cur = stageState.seatStatuses[pid] || [];
  if (cur.includes('🛡️ Có khiên')) {
    stageState.seatStatuses[pid] = ['⛓️ Bị xích'];
  } else if (cur.includes('⛓️ Bị xích')) {
    stageState.seatStatuses[pid] = ['💀 Đã ngã xuống'];
  } else {
    stageState.seatStatuses[pid] = ['🛡️ Có khiên'];
  }
  stageState.speaker = 'Quản Trò Bóng Đêm';
  stageState.speakerImg = 'assets/redhood.png';
  stageState.dialogue = `Đã cập nhật trạng thái trên sân khấu của ${target?.name || 'người chơi'} (#${pid}) thành: ${stageState.seatStatuses[pid].join(', ')}.`;
  ingame();
}

function toggleStagePhase() {
  playCurtainSfx();
  if (stageState.phase === 'night') {
    stageState.phase = 'day';
    stageState.speaker = 'Bình Minh Làng Sương Mù';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `☀️ Ngày thứ ${stageState.dayNumber} bắt đầu! Khung Chat Hội Đồng Làng đã mở bên phải — hãy thảo luận cùng các người chơi và nhấn [ ⚖️ BỎ PHIẾU TREO CỔ ]!`;
  } else {
    stageState.phase = 'night';
    stageState.dayNumber += 1;
    stageState.charges.skill = Math.min(3, stageState.charges.skill + 1);
    stageState.speaker = 'Đêm Định Mệnh';
    stageState.speakerImg = 'assets/redhood.png';
    stageState.dialogue = `🌙 Đêm thứ ${stageState.dayNumber} buông xuống! Tiếng hộp nhạc vang lên từ khu rừng cổ tích. Hãy chọn mục tiêu và nhấn [ ✦ DÙNG KỸ NĂNG ĐÊM ].`;
  }
  ingame();
}

/* ==========================================================================
   10. Trang Tổng quan / Sảnh chính (Overview Hub)
   ========================================================================== */
function getPlayerRankInfo() {
  const acc = currentAccount();
  const ranked = [...state.players].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0));
  if (!acc) {
    const top = ranked[0];
    return {
      points: top ? (state.scores[top.id] || 2450) : 2450,
      rank: '#1 (Mẫu)',
      sub: 'Đăng nhập để lưu hạng cá nhân'
    };
  }
  const idx = ranked.findIndex(p => p.id === acc.id);
  const pts = state.scores[acc.id] ?? 2450;
  return {
    points: pts,
    rank: idx >= 0 ? `#${idx + 1}` : '#1',
    sub: `${acc.name} (#${acc.id})`
  };
}

function overview() {
  const rankInfo = getPlayerRankInfo();
  const waitingRooms = state.rooms.filter(r => r.status === 'waiting').length;

  $('content').innerHTML = `
    <section class="hero-stage">
      <div class="hero-copy">
        <div class="hero-kicker">☾ MA SÓI NHẬP VAI — Sân Khấu Cổ Tích Đen</div>
        <h1>Mỗi đêm là một bí mật mới</h1>
        <p>
          Khi bức rèm nhung đỏ rượu hé mở, ánh trăng bạc chiếu rọi xuống khu rừng sương mù.
          Khám phá Bản đồ Làng về đêm, tra cứu 52 vai chuẩn cùng 100 thân phận mở rộng và bước lên Sân khấu Trong trận.
        </p>
        <div class="hero-actions">
          <button type="button" class="btn-gold" onclick="go('rooms')">🗺️ Vào Bản Đồ Làng (Sảnh Đấu)</button>
          <button type="button" class="btn-crimson" onclick="go('ingame')">⚔️ Sân Khấu Trong Trận</button>
          <button type="button" class="btn-secondary" onclick="go('roles')">🎭 Bách Khoa Thân Phận</button>
          <button type="button" class="btn-secondary" onclick="openTitleScreen()">🎬 Màn hình chào</button>
        </div>
      </div>
      <div class="hero-artwork" aria-hidden="true">
        <svg class="hero-curtain-svg" viewBox="0 0 360 220" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="heroMoon" cx="50%" cy="38%" r="55%">
              <stop offset="0%" stop-color="#FFF4D4"/>
              <stop offset="35%" stop-color="#F3D38B" stop-opacity="0.85"/>
              <stop offset="100%" stop-color="#2A1B47" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="heroCurtain" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stop-color="#4A1120"/>
              <stop offset="50%" stop-color="#7A2438"/>
              <stop offset="100%" stop-color="#9E304A"/>
            </linearGradient>
          </defs>
          <rect x="12" y="10" width="336" height="200" rx="18" fill="#120E24" stroke="#463766" stroke-width="2"/>
          <circle cx="180" cy="92" r="78" fill="url(#heroMoon)"/>
          <circle cx="180" cy="84" r="34" fill="#F4EEFA"/>
          <circle cx="192" cy="76" r="28" fill="#22183C" opacity="0.22"/>
          <path d="M162 175 L168 122 L180 102 L192 122 L198 175 Z" fill="#0E0C1D"/>
          <path d="M55 198 Q85 135 65 80 Q95 125 110 198 Z" fill="#0B0917"/>
          <path d="M305 198 Q275 135 295 80 Q265 125 250 198 Z" fill="#0B0917"/>
          <path d="M14 185 Q110 158 180 176 T346 180 L346 208 L14 208 Z" fill="#0E0C1D"/>
          <path d="M14 12 H112 Q86 95 58 148 Q42 178 14 208 Z" fill="url(#heroCurtain)" stroke="#8B6B5C" stroke-opacity="0.4" stroke-width="1"/>
          <path d="M346 12 H248 Q274 95 302 148 Q318 178 346 208 Z" fill="url(#heroCurtain)" stroke="#8B6B5C" stroke-opacity="0.4" stroke-width="1"/>
          <circle cx="62" cy="142" r="5" fill="#F3D38B"/>
          <circle cx="298" cy="142" r="5" fill="#F3D38B"/>
        </svg>
      </div>
    </section>

    <section class="metrics-grid" aria-label="Chỉ số nhanh">
      <div class="metric-card">
        <div class="metric-label"><span>Tổng số thân phận</span><span>🎭</span></div>
        <div class="metric-value">52 / 100</div>
        <div class="metric-sub">Nhóm ID 01–52 & 97 vai toàn bộ</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Số phòng đang mở</span><span>🗺️</span></div>
        <div class="metric-value">${state.rooms.length} phòng</div>
        <div class="metric-sub">${waitingRooms} phòng đang chờ trên Bản đồ Làng</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Số trận đã lưu</span><span>📜</span></div>
        <div class="metric-value">${state.history.length} trận</div>
        <div class="metric-sub">Biên niên sử ván diễn trên thiết bị</div>
      </div>
      <div class="metric-card">
        <div class="metric-label"><span>Điểm / Hạng hiện tại</span><span>🏆</span></div>
        <div class="metric-value">${rankInfo.points} · ${rankInfo.rank}</div>
        <div class="metric-sub">${esc(rankInfo.sub)}</div>
      </div>
    </section>

    <section class="shortcuts-grid" aria-label="Lối tắt trải nghiệm">
      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 01 · Bách khoa thân phận</span>
        <h3>🎭 Bách khoa nhân vật</h3>
        <p>
          Khám phá những vai trò của ngôi làng và tìm nhân vật bạn yêu thích.
        </p>
        <button type="button" class="btn-gold" onclick="go('roles')">Mở Kho Thân Phận →</button>
      </article>

      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 02 · Bản đồ làng & chia vai</span>
        <h3>🗺️ Bản đồ Làng & Phòng đấu</h3>
        <p>
          Khám phá ngôi làng về đêm, chọn công trình đại diện cho phòng chơi (1–100 người), gắn #ID, chọn bộ vai và kéo rèm bắt đầu ván diễn.
        </p>
        <button type="button" class="btn-gold" onclick="go('rooms')">Mở Bản Đồ Làng →</button>
      </article>

      <article class="shortcut-card">
        <span class="shortcut-step">Màn hình 03 · Sân khấu nhập vai</span>
        <h3>⚔️ Sân khấu Trong trận (In-Game)</h3>
        <p>
          Trải nghiệm HUD góc trên trái, vòng tròn người chơi quanh lâu đài trăng lưỡi liềm và hộp thoại Quản trò hiển thị văn bản tức thì ở đáy màn hình.
        </p>
        <button type="button" class="btn-crimson" onclick="go('ingame')">Vào Sân Khấu Trong Trận →</button>
      </article>
    </section>
  `;
}

/* ==========================================================================
   11. ④ Kho Thân Phận (Role Encyclopedia / Codex)
   ========================================================================== */
function getFilteredRoles() {
  if (codexLoadStatus !== 'ready' || !window.WolvesCodexData) return [];
  return window.WolvesCodexData.filterOfficialCharacters(ROLES, {
    query, team:filter, favorites:state.favs, sort
  });
}

function codexPortraitOnError() {
  return "this.onerror=null;this.src='assets/portraits/placeholder.svg'";
}

function renderRoleListItems(list) {
  if (!list.length) return '<div class="codex-empty">Không tìm thấy nhân vật phù hợp. Hãy thử từ khóa hoặc bộ lọc khác.</div>';
  return list.map(c => `
    <button type="button" class="codex-grid-card ${selected?.id === c.id ? 'is-selected' : ''}"
      aria-label="Xem nhân vật ${esc(c.name)}" aria-pressed="${selected?.id === c.id}"
      onclick="chooseRole(${c.id})">
      <img src="${portrait(c)}" onerror="${codexPortraitOnError()}" alt="${esc(c.name)}" loading="lazy" decoding="async">
      <span class="codex-card-copy"><strong>${esc(c.name)}</strong><small>${esc(teamLabel(c))}</small></span>
    </button>
  `).join('');
}

let codexViewMode = 'wheel'; // 'wheel' | 'grid'
let wheelAnimId = null;
let wheelAnimOffset = 0;

function setCodexViewMode(mode) {
  if (!['wheel','grid'].includes(mode)) return;
  playSelectSfx();
  codexViewMode = mode;
  roles();
}

function roles() {
  const host=$('content');
  if (codexLoadStatus !== 'ready') {
    host.innerHTML = `<section class="panel codex-status" role="status">
      <h2>📜 Bách khoa thân phận</h2><p>${codexLoadStatus === 'error' ? esc(codexLoadMessage || 'Không tải được danh sách nhân vật chính thức.') : 'Đang tải danh mục nhân vật…'}</p>
      ${codexLoadStatus === 'error' ? '<button class="btn-gold" onclick="WolvesLive.reloadCodex()">Thử tải lại</button>' : ''}
      </section>`;
    return;
  }
  const list=getFilteredRoles();
  if(!list.some(c=>c.id===selected?.id)) selected=list[0]||null;
  const countText=window.WolvesCodexData.countLabel(list.length,ROLES.length);
  host.innerHTML = `
    <section class="role-toolbar codex-toolbar">
      <div class="role-toolbar-top">
        <div class="role-search-wrap">
          <label class="codex-search-label" for="roleSearchInput">Khám phá các thân phận</label>
          <input class="search" id="roleSearchInput" type="search"
            placeholder="⌕ Tìm tên nhân vật (có dấu hoặc không dấu)…" value="${esc(query)}"
            oninput="setRoleQuery(this.value,this.selectionStart)"
            oncompositionstart="searchComposing=true"
            oncompositionend="searchComposing=false;setRoleQuery(this.value,this.selectionStart)">
        </div>
        <div class="deck-scope-toggle" role="group" aria-label="Chế độ xem nhân vật">
          <button type="button" class="${codexViewMode==='wheel'?'active':''}" aria-pressed="${codexViewMode==='wheel'}" onclick="setCodexViewMode('wheel')">🎡 Vòng thẻ bài</button>
          <button type="button" class="${codexViewMode==='grid'?'active':''}" aria-pressed="${codexViewMode==='grid'}" onclick="setCodexViewMode('grid')">▦ Lưới nhân vật</button>
        </div>
      </div>
      <div class="role-toolbar-filters">
        <div class="filter-chips" role="group" aria-label="Lọc theo phe">
          ${[['all','✦ Tất cả'],['dan','🌿 Dân Làng'],['soi','🐺 Phe Sói'],['phe3','🔮 Phe Ba'],['fav','★ Yêu thích']].map(([k,label])=>`<button type="button" class="chip ${filter===k?'active':''}" aria-pressed="${filter===k}" onclick="setRoleFilter('${k}')">${label}</button>`).join('')}
          <button type="button" class="chip codex-clear" onclick="resetCodexFilters()">Xóa lọc</button>
        </div>
        <label class="codex-sort-label" for="roleSortSelect">Sắp xếp
          <select id="roleSortSelect" class="input-field" onchange="sort=this.value;roles()">
            <option value="id" ${sort==='id'?'selected':''}>Thứ tự bộ vai</option>
            <option value="name" ${sort==='name'?'selected':''}>Tên A → Z</option>
          </select>
        </label>
      </div>
      <p class="codex-count" id="codexCount" role="status" aria-live="polite">${esc(countText)}</p>
    </section>
    ${codexViewMode === 'wheel' && list.length ? `
      <!-- Sân khấu vòng xoay Tarot gốc, chỉ dựng tối đa 12 thẻ quanh tâm -->
      <section class="codex-wheel-stage">
        <!-- Minh họa SVG Đôi Bàn Tay Định Mệnh & Dây Xích Trăng Khuyết (Smooth Dark Fairytale Vector Art) -->
        <svg class="codex-hands-backdrop" viewBox="0 0 1280 540" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="altarGlow" cx="50%" cy="46%" r="44%">
              <stop offset="0%" stop-color="#7A2438" stop-opacity="0.38"/>
              <stop offset="52%" stop-color="#2A1B47" stop-opacity="0.24"/>
              <stop offset="100%" stop-color="#0E0C1D" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="handFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#352B52"/>
              <stop offset="60%" stop-color="#221B3A"/>
              <stop offset="100%" stop-color="#141026"/>
            </linearGradient>
          </defs>
          <circle cx="640" cy="245" r="340" fill="url(#altarGlow)"/>
          <!-- Vòng quỹ đạo ma thuật mảnh -->
          <ellipse cx="640" cy="242" rx="385" ry="155" fill="none" stroke="rgba(243,211,139,0.18)" stroke-width="1.5" stroke-dasharray="6 6"/>
          <ellipse cx="640" cy="242" rx="320" ry="122" fill="none" stroke="rgba(169,123,255,0.14)" stroke-width="1"/>

          <!-- Bàn Tay Định Mệnh Bên Trái & Dây Xích Mặt Trăng (Mượt mà, không răng cưa pixel) -->
          <g stroke="rgba(243,211,139,0.42)" stroke-width="1.8" fill="url(#handFill)">
            <path d="M-20 220 C45 160, 115 118, 175 112 C215 108, 255 155, 298 188 C260 192, 222 170, 195 158 C235 208, 295 268, 345 305 C292 308, 232 268, 182 228 C205 278, 238 325, 262 365 C215 352, 168 302, 134 258 C138 302, 152 342, 164 374 C124 352, 92 304, 65 265 L-20 295 Z"/>
            <!-- Dây xích bạc & Mặt dây chuyền Ngôi Sao / Trăng Khuyết -->
            <path d="M198 135 Q192 265 196 395" fill="none" stroke="#F3D38B" stroke-width="2.5" stroke-dasharray="5 5"/>
            <circle cx="196" cy="418" r="20" fill="#18152C" stroke="#F3D38B" stroke-width="2"/>
            <text x="196" y="424" text-anchor="middle" fill="#F3D38B" font-size="16" stroke="none">✦</text>
          </g>

          <!-- Bàn Tay Định Mệnh Bên Phải & Quyển Trục Cổ Tích -->
          <g transform="translate(1280, 0) scale(-1, 1)" stroke="rgba(243,211,139,0.42)" stroke-width="1.8" fill="url(#handFill)">
            <path d="M-20 220 C45 160, 115 118, 175 112 C215 108, 255 155, 298 188 C260 192, 222 170, 195 158 C235 208, 295 268, 345 305 C292 308, 232 268, 182 228 C205 278, 238 325, 262 365 C215 352, 168 302, 134 258 C138 302, 152 342, 164 374 C124 352, 92 304, 65 265 L-20 295 Z"/>
            <!-- Trượng / Quyển trục cổ tích -->
            <rect x="176" y="128" width="24" height="235" rx="12" transform="rotate(14 188 245)" fill="#18152C" stroke="#F3D38B" stroke-width="2"/>
          </g>
        </svg>

        <!-- Thanh tiêu đề nhỏ trên đỉnh Vòng xoay -->
        <div class="codex-wheel-top">
          <div>
            <strong style="color:var(--gold);font-family:var(--card-serif-font);font-size:18px">
              🎡 Vòng Tròn Thẻ Bài Định Mệnh
            </strong>
            <span class="muted" style="font-size:12.5px;margin-left:10px">
              Nhấp vào lá bài bất kỳ, lăn chuột hoặc dùng nút ⟲ / ⟳ để xoay vòng tròn
            </span>
          </div>
          <span class="nav-badge">${esc(countText)}</span>
        </div>

        <!-- Vùng Quỹ Đạo Xoay 3D của các lá bài Tarot -->
        <div class="codex-wheel-arena" id="codexWheelArena">
          <!-- Tâm Bàn Cân / Gương Linh Hồn ở giữa vòng bài -->
          <div class="codex-wheel-altar">
            <div class="altar-counters">
              <div><strong id="altarTotalCount">${list.length}</strong><span>Thẻ bài</span></div>
              <div><strong id="altarFavCount">${state.favs.length}</strong><span>Yêu thích</span></div>
            </div>
            <div class="altar-disc">
              <strong id="altarRoleTitle">${esc(selected?.name||'')}</strong>
              <small id="altarRoleSub">${selected?esc(teamLabel(selected)):''}</small>
            </div>
          </div>

          <!-- Các lá bài trên vòng tròn -->
          <div id="codexWheelCardsContainer" style="position:absolute;inset:0"></div>
        </div>

        <!-- Cụm nút xoay vòng tròn & Thao tác nhanh dưới chân Vòng bài -->
        <div class="codex-wheel-bottom">
          <div class="wheel-spin-controls">
            <button type="button" class="wheel-spin-btn" onmouseenter="playHoverSfx()" onclick="spinCodexWheel(-1)">
              ⟲ Xoay Trái
            </button>
            <button type="button" class="btn-secondary" id="wheelFavBtn" onclick="toggleFav(selected.id)">
              ${selected && state.favs.includes(selected.id) ? '★ Đã yêu thích' : '☆ Yêu thích'}
            </button>
            <button type="button" class="wheel-spin-btn" onmouseenter="playHoverSfx()" onclick="spinCodexWheel(1)">
              Xoay Phải ⟳
            </button>
          </div>
        </div>
      </section>

      <!-- Khung Chi Tiết Thân Phận Đang Chọn ở ngay bên dưới Vòng Tròn -->
      <section class="panel role-detail-panel" id="detail" style="height:auto"></section>
    ` : `
      <!-- CHẾ ĐỘ 2: lưới hình ảnh, giữ Dark Fantasy và mở chi tiết khi chọn -->
      <section class="codex-grid-stage" aria-label="Danh sách nhân vật">
        <div class="codex-grid" id="roleList">${renderRoleListItems(list)}</div>
      </section>
      <section class="panel role-detail-panel codex-detail" id="detail"></section>
    `}
  `;

  renderRoleDetail();
  if (codexViewMode === 'wheel' && list.length) initCodexWheel(list);
}

function initCodexWheel(list) {
  const arena = $('codexWheelArena');
  if (!arena) return;
  drawCodexWheelCards(list, 0);

  let wheelCooldown = false;
  arena.tabIndex=0;
  arena.setAttribute('aria-label','Vòng xoay thẻ bài; dùng phím mũi tên trái hoặc phải để đổi nhân vật');
  arena.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();spinCodexWheel(e.key==='ArrowRight'?1:-1);}});
  arena.addEventListener('wheel', e => {
    e.preventDefault();
    if (wheelCooldown) return;
    wheelCooldown = true;
    const dir = (e.deltaY || e.deltaX) > 0 ? 1 : -1;
    spinCodexWheel(dir);
    setTimeout(() => { wheelCooldown = false; }, 140);
  }, { passive: false });
}

function drawCodexWheelCards(list, animSlotShift = 0) {
  const container = $('codexWheelCardsContainer');
  if (!container) return;
  if (!list.length) {
    container.innerHTML = '<div class="empty">Không tìm thấy thẻ bài phù hợp.</div>';
    return;
  }

  const selIdx = Math.max(0, list.findIndex(c => c.id === selected.id));
  const visibleCount = Math.min(12, list.length);
  const half = Math.floor(visibleCount / 2);

  // Tạo hoặc cập nhật các thẻ bài trên quỹ đạo hình elip
  const slots = [];
  for (let k = 0; k < visibleCount; k++) {
    const rel = k - half; // rel = 0 là vị trí chính diện 6 giờ (bottom-front)
    const roleIdx = ((selIdx + rel) % list.length + list.length) % list.length;
    const role = list[roleIdx];
    slots.push({ k, rel, role });
  }

  // Nếu số lượng DOM node chưa khớp thì khởi tạo
  if (container.children.length !== visibleCount) {
    container.innerHTML = slots.map(s => `
      <div class="wheel-tarot-card" data-slot="${s.k}">
        <div class="wheel-card-top">
          <span class="w-team"></span>
        </div>
        <img class="wheel-card-art" src="" alt="">
        <div class="wheel-card-name"></div>
      </div>
    `).join('');
  }

  slots.forEach(s => {
    const el = container.children[s.k];
    if (!el) return;
    const effectiveRel = s.rel + animSlotShift;
    // Góc theta: rel = 0 nằm ở đáy chính diện (Math.PI / 2 = 90 độ)
    const theta = Math.PI / 2 + (effectiveRel / visibleCount) * Math.PI * 2;
    const xPct = 50 + 30.5 * Math.cos(theta);
    const yPct = 46 + 34.5 * Math.sin(theta);
    const depth = (Math.sin(theta) + 1) / 2; // 0 ở đỉnh xa (12h), 1 ở đáy gần (6h)
    const scale = 0.62 + 0.58 * Math.pow(depth, 1.4);
    const zIdx = Math.round(10 + depth * 40);
    const opacity = 0.42 + 0.58 * depth;

    el.className = `wheel-tarot-card team-${s.role.team} ${s.rel === 0 && Math.abs(animSlotShift) < 0.25 ? 'active-front' : ''}`;
    el.style.left = `${xPct}%`;
    el.style.top = `${yPct}%`;
    el.style.transform = `translate(-50%, -50%) scale(${scale.toFixed(3)})`;
    el.style.zIndex = String(zIdx);
    el.style.opacity = opacity.toFixed(2);
    el.onclick = () => {
      if (s.rel === 0) return;
      spinCodexWheel(s.rel);
    };

    const teamSpan = el.querySelector('.w-team');
    const imgEl = el.querySelector('.wheel-card-art');
    const nameEl = el.querySelector('.wheel-card-name');
    if (teamSpan) teamSpan.textContent = s.role.team === 'soi' ? '🐺' : s.role.team === 'dan' ? '🌿' : '🔮';
    if (imgEl && !imgEl.src.endsWith(portrait(s.role))) {
      imgEl.src = portrait(s.role);
      imgEl.alt = s.role.name;
      imgEl.onerror = () => { imgEl.onerror=null; imgEl.src='assets/portraits/placeholder.svg'; };
    }
    if (nameEl) nameEl.textContent = s.role.name;
  });

  // Cập nhật thông tin trên Bàn Cân ở tâm vòng tròn & Nút hành động dưới chân vòng
  const titleEl = $('altarRoleTitle');
  const subEl = $('altarRoleSub');
  const totalEl = $('altarTotalCount');
  const favBtnEl = $('wheelFavBtn');
  if (titleEl) titleEl.textContent = selected?.name || '';
  if (subEl) subEl.textContent = selected ? teamLabel(selected) : '';
  if (totalEl) totalEl.textContent = String(list.length);
  if (favBtnEl) favBtnEl.textContent = state.favs.includes(selected.id) ? '★ Đã yêu thích' : '☆ Yêu thích';
}

function spinCodexWheel(stepDelta) {
  const list = getFilteredRoles();
  if (!list.length) return;
  playHoverSfx();
  const curIdx = Math.max(0, list.findIndex(c => c.id === selected.id));
  const nextIdx = ((curIdx + stepDelta) % list.length + list.length) % list.length;
  selected = list[nextIdx];

  // Nội suy quỹ đạo tròn 60fps bằng requestAnimationFrame để các lá bài lướt theo đường cong elip
  cancelAnimationFrame(wheelAnimId);
  wheelAnimOffset = stepDelta;
  const startTime = performance.now();
  const duration = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 360;

  function step(now) {
    const t = duration ? Math.min(1, (now - startTime) / duration) : 1;
    const ease = 1 - Math.pow(1 - t, 3);
    const currentShift = stepDelta * (1 - ease);
    // Tắt CSS transition trong lúc rAF đang vẽ đường cong lượng giác
    const container = $('codexWheelCardsContainer');
    if (container) {
      Array.from(container.children).forEach(ch => { ch.style.transition = 'none'; });
    }
    drawCodexWheelCards(list, currentShift);
    if (t < 1) {
      wheelAnimId = requestAnimationFrame(step);
    } else {
      drawCodexWheelCards(list, 0);
    }
  }
  wheelAnimId = requestAnimationFrame(step);
  renderRoleDetail();
}

function setRoleFilter(v) {
  if (!['all','dan','soi','phe3','fav'].includes(v)) return;
  playSelectSfx(); filter=v; roles();
}
function resetCodexFilters() {
  filter='all'; query=''; sort='id'; roles();
}
function setRoleQuery(value, caret) {
  query=value;
  if (searchComposing) return;
  roles();
  const input=$('roleSearchInput');
  if(input){input.focus({preventScroll:true});if(Number.isInteger(caret))try{input.setSelectionRange(caret,caret);}catch{}}
}
function chooseRole(id) {
  const list=getFilteredRoles();
  const found=list.find(c=>c.id===id);
  if(!found)return;
  playSelectSfx();selected=found;
  if(codexViewMode==='wheel'){drawCodexWheelCards(list,0);renderRoleDetail();}
  else {const el=$('roleList');if(el)el.innerHTML=renderRoleListItems(list);renderRoleDetail();}
}
function renderRoleDetail() {
  const container=$('detail');
  if(!container)return;
  const c=selected;
  if(!c){container.innerHTML='<div class="codex-empty">Hãy chọn một nhân vật để xem chi tiết.</div>';return;}
  const model=window.WolvesCodexData.toCodexViewModel(c);
  const isFav=state.favs.includes(c.id);
  container.innerHTML=`
    <div class="role-hero-card codex-detail-hero">
      <img class="role-hero-portrait" src="${esc(portrait(c))}" onerror="${codexPortraitOnError()}" alt="${esc(model.displayName)}">
      <div class="role-hero-meta">
        <div class="role-tags"><span class="tag ${esc(model.factionKey)}">${esc(model.factionLabel)}</span>${model.aura?.trim()?`<span class="tag">Hào quang: ${esc(model.aura)}</span>`:''}</div>
        <h2>${esc(model.displayName)}</h2>
        <div class="role-hero-actions"><button type="button" class="${isFav?'btn-gold':'btn-secondary'}" onclick="toggleFav(${c.id})">${isFav?'★ Đã yêu thích':'☆ Yêu thích'}</button></div>
      </div>
    </div>
    ${model.abilityDescription?.trim()?`<div class="detail-block codex-ability"><h3>📜 Năng lực</h3><p>${esc(model.abilityDescription)}</p></div>`:''}
  `;
}

function toggleFav(roleId) {
  playSelectSfx();
  const id = roleId || selected.id;
  if (state.favs.includes(id)) {
    state.favs = state.favs.filter(x => x !== id);
  } else {
    state.favs.push(id);
  }
  save();window.WolvesWorkspace?.savePreferences();
  if (page === 'roles') roles();
  if (page === 'profile') profile();
}

function addRoleToActiveRoom(roleId) {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.push(roleId);
  save();
  if (page === 'roles') renderRoleDetail();
  if (page === 'rooms') rooms();
}

function initRoleDivider() {
  const layout = $('roleLayout');
  const bar = $('roleDivider');
  if (!layout || !bar) return;
  const saved = Number(localStorage.getItem('wolvesville_role_column_pct'));
  const clamp = n => Math.max(24, Math.min(62, n));
  if (saved >= 24 && saved <= 62) layout.style.setProperty('--role-left', saved + '%');

  let dragging = false;
  const update = x => {
    const r = layout.getBoundingClientRect();
    const pct = clamp(((x - r.left) / r.width) * 100);
    layout.style.setProperty('--role-left', pct + '%');
    return pct;
  };
  bar.addEventListener('pointerdown', e => {
    if (window.innerWidth <= 1120) return;
    dragging = true;
    bar.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  bar.addEventListener('pointermove', e => {
    if (dragging) update(e.clientX);
  });
  const end = e => {
    if (!dragging) return;
    dragging = false;
    localStorage.setItem('wolvesville_role_column_pct', String(update(e.clientX)));
  };
  bar.addEventListener('pointerup', end);
  bar.addEventListener('pointercancel', end);
  bar.addEventListener('dblclick', () => {
    layout.style.setProperty('--role-left', '36%');
    localStorage.removeItem('wolvesville_role_column_pct');
  });
}

/* ==========================================================================
   12. Thao tác Phòng chơi & Modal Bảng chọn nhanh nhân vật
   ========================================================================== */
function createRoom() {
  playSelectSfx();
  const nameInput = $('newRoomName');
  const sizeInput = $('newRoomSize');
  const name = (nameInput?.value.trim()) || `Lầu Chuông Đêm #${state.rooms.length + 1}`;
  const size = Number(sizeInput?.value || 12);
  if (!Number.isInteger(size) || size < 1 || size > 100) {
    alert('Vui lòng nhập giới hạn số người chơi từ 1 đến 100.');
    sizeInput?.focus();
    return;
  }
  const newId = Math.max(1000, ...state.rooms.map(r => r.id)) + 1;
  const newRoom = {
    id: newId,
    name,
    size,
    status: 'waiting',
    playerIds: state.players.slice(0, Math.min(size, 6)).map(p => p.id),
    roleIds: [1, 3, 28, 32, 34, 35].slice(0, Math.min(size, 6))
  };
  state.rooms.unshift(newRoom);
  state.activeRoom = newId;
  save();
  const pinned = [...state.rooms].sort((first, second) => first.id - second.id)
    .slice(0, VILLAGE_ROOM_SITES.length).some(room => room.id === newId);
  openVillagePanel('room', pinned ? 'room-' + newId : 'directory');
}

function deleteRoom(roomId) {
  if (!confirm(`Xóa phòng #${roomId} khỏi Sảnh đấu?`)) return;
  state.rooms = state.rooms.filter(r => r.id !== roomId);
  if (state.activeRoom === roomId) {
    state.activeRoom = state.rooms[0]?.id || null;
  }
  save();
  openVillagePanel('directory');
}

function updateRoomLimit(roomId, val) {
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  const n = Number(val);
  if (!Number.isInteger(n) || n < 1 || n > 100) {
    alert('Giới hạn phòng phải là số nguyên từ 1 đến 100.');
    rooms();
    return;
  }
  room.size = n;
  save();
  rooms();
}

function toggleRoomStatus(roomId) {
  playSelectSfx();
  const room = state.rooms.find(r => r.id === roomId);
  if (!room) return;
  room.status = room.status === 'playing' ? 'waiting' : 'playing';
  save();
  rooms();
}

function addPlayerToRoom() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  const input = $('stagingPlayerName');
  const name = input?.value.trim();
  if (!name) return;
  if (room.playerIds.length >= room.size) {
    alert(`Phòng #${room.id} đã đạt giới hạn ${room.size} người chơi. Hãy tăng giới hạn phòng nếu muốn thêm!`);
    return;
  }
  const newId = Math.max(9000, ...state.players.map(p => p.id)) + 1;
  state.players.push({ id: newId, name });
  state.scores[newId] = 1500;
  room.playerIds.push(newId);
  save();
  rooms();
}

function removePlayerFromRoom(playerId) {
  const room = getActiveRoom();
  if (!room) return;
  room.playerIds = room.playerIds.filter(id => id !== playerId);
  save();
  rooms();
}

function fillSamplePlayers() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  DEFAULT_PLAYERS.forEach(dp => {
    if (!state.players.some(p => p.id === dp.id)) {
      state.players.push({ ...dp });
      state.scores[dp.id] = DEFAULT_SCORES[dp.id] || 1500;
    }
    if (room.playerIds.length < room.size && !room.playerIds.includes(dp.id)) {
      room.playerIds.push(dp.id);
    }
  });
  save();
  rooms();
}

function removeRoleFromRoom(idx) {
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.splice(idx, 1);
  save();
  rooms();
}

function clearRoomDeck() {
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds = [];
  save();
  rooms();
}

function autoBalanceDeck() {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  const targetCount = Math.max(6, room.playerIds.length || 8);
  const preset = [28, 34, 32, 1, 3, 6, 7, 35, 5, 27, 36, 30, 2, 9, 10, 33];
  room.roleIds = [];
  for (let i = 0; i < targetCount; i++) {
    room.roleIds.push(preset[i % preset.length]);
  }
  save();
  rooms();
}

let rolePickerQuery = '';
let rolePickerTeam = 'all';
let rolePickerScope = '52';
let rolePickerComposing = false;

function openRolePicker() {
  playSelectSfx();
  if ($('rolePickerOverlay')) return;
  rolePickerQuery = '';
  rolePickerTeam = 'all';
  rolePickerScope = '52';

  const overlay = document.createElement('div');
  overlay.id = 'rolePickerOverlay';
  overlay.className = 'role-picker-overlay';
  overlay.innerHTML = `
    <div class="role-picker-modal" role="dialog" aria-modal="true" aria-labelledby="pickerTitle">
      <div class="role-picker-header">
        <h3 id="pickerTitle">🎭 Bảng chọn nhanh nhân vật cho phòng #${getActiveRoom()?.id || ''}</h3>
        <button type="button" class="btn-secondary" onclick="closeRolePicker()">✕ Đóng</button>
      </div>
      <div class="role-picker-controls">
        <input
          id="pickerSearch"
          class="input-field"
          type="search"
          autocomplete="off"
          placeholder="Tìm theo tên vai, #ID hoặc kỹ năng..."
          oninput="pickerSearchChanged(this.value)"
          oncompositionstart="rolePickerComposing=true"
          oncompositionend="rolePickerComposing=false;pickerSearchChanged(this.value)"
        >
        <select id="pickerScope" class="input-field" onchange="rolePickerScope=this.value;renderPickerItems()">
          <option value="52">✦ Nhóm ID 01–52</option>
          <option value="all">📚 Toàn bộ 97 vai</option>
        </select>
        <select id="pickerTeam" class="input-field" onchange="rolePickerTeam=this.value;renderPickerItems()">
          <option value="all">Tất cả phe</option>
          <option value="dan">🌿 Dân Làng</option>
          <option value="soi">🐺 Phe Sói</option>
          <option value="phe3">🔮 Phe Ba</option>
        </select>
      </div>
      <div class="role-picker-results" id="pickerResults"></div>
      <div class="role-picker-footer">
        <span class="muted" id="pickerSelectedCount"></span>
        <button type="button" class="btn-gold" onclick="closeRolePicker()">Hoàn tất chọn vai</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeRolePicker();
  });
  document.body.append(overlay);
  renderPickerItems();
  $('pickerSearch')?.focus();
}

function closeRolePicker() {
  $('rolePickerOverlay')?.remove();
  if (page === 'rooms') {
    rooms();
    $('villageRolePickerButton')?.focus({ preventScroll: true });
  }
  if (page === 'roles') renderRoleDetail();
}

function pickerSearchChanged(v) {
  rolePickerQuery = v;
  if (!rolePickerComposing) renderPickerItems();
}

function renderPickerItems() {
  const results = $('pickerResults');
  if (!results) return;
  const room = getActiveRoom();
  const normalize = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLocaleLowerCase('vi');
  const q = normalize(rolePickerQuery.trim());

  const matches = ROLES.filter(c => {
    if (rolePickerScope === '52' && c.id > 52) return false;
    if (rolePickerTeam !== 'all' && c.team !== rolePickerTeam) return false;
    if (!q) return true;
    return normalize(`#${c.id} ${c.name} ${c.desc}`).includes(q);
  });

  results.innerHTML = matches.map(c => {
    const count = room ? room.roleIds.filter(id => id === c.id).length : 0;
    return `
      <div class="role-picker-item">
        <img src="${portrait(c)}" alt="${esc(c.name)}">
        <div class="info">
          <strong><span style="color:var(--gold)">#${String(c.id).padStart(2, '0')}</span> ${esc(c.name)}</strong>
          <small>${teamLabel(c)} · Hào quang: ${esc(c.aura)} ${c.id <= 52 ? '· Nhóm ID 01–52' : ''}</small>
        </div>
        <button type="button" class="btn-gold" style="padding:7px 12px" onclick="addPickerRole(${c.id})">
          + Thêm ${count ? `(${count})` : ''}
        </button>
      </div>
    `;
  }).join('') || '<div class="empty">Không tìm thấy nhân vật phù hợp.</div>';

  const label = $('pickerSelectedCount');
  if (label && room) {
    label.textContent = `Đã chọn ${room.roleIds.length} vai / ${room.playerIds.length} người chơi trong phòng #${room.id}`;
  }
}

function addPickerRole(roleId) {
  playSelectSfx();
  const room = getActiveRoom();
  if (!room) return;
  room.roleIds.push(roleId);
  save();
  renderPickerItems();
}

/* ==========================================================================
   13. Hiệu ứng Kéo Rèm Nhung & Bắt Đầu Ván Diễn (Stage Curtain Transition)
   ========================================================================== */
function startStageShow() {
  const room = getActiveRoom();
  if (!room) return;
  const roomPlayers = room.playerIds.map(pid => state.players.find(p => p.id === pid)).filter(Boolean);
  if (!roomPlayers.length) {
    alert('Phòng chưa có người chơi nào. Hãy thêm người chơi trước khi kéo rèm!');
    return;
  }
  if (room.roleIds.length < roomPlayers.length) {
    alert(`Số vai đã chọn (${room.roleIds.length}) đang ít hơn số người chơi (${roomPlayers.length}). Hãy bấm "Gợi ý cân bằng" hoặc thêm vai vào phòng!`);
    return;
  }

  const pool = [...room.roleIds].sort(() => Math.random() - 0.5);
  const assignments = roomPlayers.map((p, idx) => {
    const roleObj = ROLES.find(r => r.id === pool[idx]) || ROLES[0];
    return {
      playerId: p.id,
      name: p.name,
      roleId: roleObj.id,
      role: roleObj.name,
      team: roleObj.team,
      aura: roleObj.aura
    };
  });

  if (assignments[0]) {
    stageState.myRoleId = assignments[0].roleId;
  }

  room.status = 'playing';
  state.history.unshift({
    date: new Date().toLocaleString('vi-VN'),
    roomId: room.id,
    roomName: room.name,
    winner: 'Đang diễn ra trên sân khấu',
    result: assignments
  });
  save();

  playCurtainSfx();
  const overlay = $('stageCurtainOverlay');
  const body = $('stagePlayBody');
  const title = $('stagePlayTitle');
  if (!overlay || !body) return;

  if (title) {
    title.textContent = `🎭 Sân Khấu Đêm: ${room.name} (#${room.id})`;
  }

  body.innerHTML = `
    <p class="muted" style="margin:0">
      Rèm nhung đã khép lại và mở ra đêm đầu tiên! Dưới đây là bảng phân vai bí mật cho <b>${assignments.length} người chơi</b>:
    </p>
    <div class="stage-cards-grid">
      ${assignments.map(a => `
        <div class="stage-deal-card" onclick="closeStageShowAndInspect(${a.roleId})">
          <img src="${portrait(a.roleId)}" alt="${esc(a.role)}">
          <div>
            <small class="muted">#${a.playerId} · ${esc(a.name)}</small>
            <strong style="display:block;color:var(--gold);font-size:15.5px">${esc(a.role)}</strong>
            <span class="tag ${a.team}" style="margin-top:4px">${a.team === 'soi' ? 'Phe Sói' : a.team === 'dan' ? 'Dân Làng' : 'Phe Ba'}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="row" style="justify-content:flex-end;margin-top:8px">
      <button type="button" class="btn-secondary" onclick="closeStageShow('history')">📜 Xem Lịch sử đấu</button>
      <button type="button" class="btn-gold" onclick="closeStageShow('ingame')">⚔️ Bước vào Sân Khấu Trong Trận →</button>
    </div>
  `;

  overlay.hidden = false;
  syncVillageEffects();
  requestAnimationFrame(() => {
    overlay.classList.add('active', 'closing');
    setTimeout(() => {
      overlay.classList.add('show-stage');
    }, 680);
  });
}

function closeStageShow(targetPage) {
  const overlay = $('stageCurtainOverlay');
  if (!overlay) return;
  overlay.classList.remove('show-stage', 'closing');
  setTimeout(() => {
    overlay.classList.remove('active');
    overlay.hidden = true;
    if (targetPage) go(targetPage);
    else syncVillageEffects();
  }, 550);
}

function closeStageShowAndInspect(roleId) {
  const found = ROLES.find(r => r.id === roleId);
  if (found) selected = found;
  closeStageShow('roles');
}

/* ==========================================================================
   14. Cá nhân & Cộng đồng (Hồ sơ cá nhân, Lịch sử đấu, Bảng xếp hạng)
   ========================================================================== */
function profile() {
  const a = currentAccount();
  if (!a) {
    $('content').innerHTML = `
      <section class="section" style="text-align:center;padding:48px 24px">
        <div style="font-size:58px">🌙</div>
        <h2 style="color:var(--gold);margin:8px 0">Hồ Sơ Cư Dân Sân Khấu Cổ Tích Đen</h2>
        <p class="muted" style="max-width:520px;margin:0 auto 20px">
          Đăng nhập hoặc chọn Tài khoản mẫu Luna Moon (#9001) để mở khóa hồ sơ cá nhân, biểu đồ hoạt động 7 ngày, tỷ lệ thắng theo phe và huy hiệu.
        </p>
        <div class="row" style="justify-content:center">
          <button type="button" class="btn-gold" onclick="useDemoAccount()">🌙 Trải nghiệm tài khoản mẫu (Luna Moon)</button>
          <button type="button" class="btn-secondary" onclick="showAuth('login')">🚪 Mở Cổng Đăng Nhập</button>
        </div>
      </section>
    `;
    return;
  }

  const demo = a.isDemo === true;
  const stats = demo
    ? { matches: 128, wins: 76, losses: 52, streak: 5, points: state.scores[a.id] || 2450, rank: 1, days: [4, 7, 5, 9, 6, 10, 8], teams: [48, 34, 18] }
    : { matches: Math.max(1, state.history.length), wins: 1, losses: 0, streak: 1, points: state.scores[a.id] || 1500, rank: 2, days: [1, 2, 1, 3, 2, 4, 3], teams: [50, 30, 20] };
  const rate = stats.matches ? Math.round((stats.wins / stats.matches) * 100) : 0;

  const bars = stats.days.map((v, i) => `
    <div class="barcol">
      <div class="bartrack"><div class="barfill" style="height:${(v / 10) * 100}%"></div></div>
      <span class="muted" style="font-size:11px">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}</span>
    </div>
  `).join('');

  const circle = `conic-gradient(#174B44 0 ${stats.teams[0]}%, #7A2438 ${stats.teams[0]}% ${stats.teams[0] + stats.teams[1]}%, #5B388C ${stats.teams[0] + stats.teams[1]}% 100%)`;

  $('content').innerHTML = `
    <section class="social-cover">
      <div class="cover-banner">☾ ✦ 🐺 ✦ ☽</div>
      <div class="social-identity">
        <img class="social-avatar" src="${portrait(a.avatarId || 2)}" alt="${esc(a.name)}">
        <div>
          <h2>${esc(a.name)}</h2>
          <p>@${esc(a.user)} · Mã định danh <b style="color:var(--gold)">#${a.id}</b> · <span style="color:#6EE7B7">● Đang trực tuyến tại Sảnh</span></p>
        </div>
        <button type="button" class="btn-secondary" style="margin-left:auto" onclick="editProfile()">✎ Chỉnh sửa hồ sơ</button>
      </div>
    </section>

    <div class="profile-grid">
      <div class="profile-side">
        <section class="section">
          <h3>✦ Danh tính cư dân</h3>
          <p>${esc(a.bio || 'Chưa có lời giới thiệu.')}</p>
          <p class="muted">📍 ${esc(a.location || 'Làng Trăng Tím')}</p>
          <p class="muted">📅 Gia nhập: ${esc(a.joined || 'Tháng 11/2026')}</p>
          <p class="muted">🪪 ID cố định: <b style="color:var(--gold)">#${a.id}</b></p>
        </section>

        <section class="section">
          <h3>★ Thân phận yêu thích (${state.favs.length})</h3>
          <div class="fav-row">
            ${state.favs.slice(0, 6).map(id => {
              const c = ROLES.find(x => x.id === id);
              return c ? `
                <button type="button" class="fav-card" onclick="selected=ROLES.find(x=>x.id===${c.id});go('roles')">
                  <img src="${portrait(c)}" alt="${esc(c.name)}">
                  <span>${esc(c.name)}</span>
                </button>
              ` : '';
            }).join('') || '<p class="muted">Chưa đánh dấu vai yêu thích nào.</p>'}
          </div>
        </section>

        <section class="section">
          <h3>🏅 Huy hiệu Thành tích (Achievements)</h3>
          <div class="badge-grid">
            <span class="achievement">🌕 Kẻ Lữ Hành Đêm</span>
            <span class="achievement">🎭 Bậc Thầy Hóa Thân</span>
            <span class="achievement">🕯️ Chủ Phòng Uy Tín</span>
            <span class="achievement">🔮 Thấu Thị Hào Quang</span>
          </div>
        </section>
      </div>

      <div class="profile-main">
        <div class="profile-kpis">
          <div class="kpi"><span>🎮 Tổng số ván</span><b>${stats.matches}</b></div>
          <div class="kpi"><span>🏆 Chiến thắng</span><b>${stats.wins}</b></div>
          <div class="kpi"><span>📈 Tỷ lệ thắng</span><b>${rate}%</b></div>
          <div class="kpi"><span>⭐ Điểm / Hạng</span><b>${stats.points} (#${stats.rank})</b></div>
        </div>

        <div class="chart-grid">
          <section class="section">
            <h3>📊 Nhịp độ ván diễn 7 ngày</h3>
            <p class="muted" style="font-size:12px">Số ván tham gia theo từng đêm trong tuần</p>
            <div class="bars">${bars}</div>
          </section>

          <section class="section">
            <h3>◉ Tỷ lệ hóa thân theo Phe</h3>
            <div class="donut-wrap">
              <div class="donut" style="background:${circle}">
                <div>${stats.matches}<small style="font-size:11px;color:var(--muted)">ván</small></div>
              </div>
              <div style="display:grid;gap:8px;font-size:12.5px">
                <span>🌿 Dân Làng: <b>${stats.teams[0]}%</b></span>
                <span>🐺 Phe Sói: <b>${stats.teams[1]}%</b></span>
                <span>🔮 Phe Ba: <b>${stats.teams[2]}%</b></span>
              </div>
            </div>
          </section>
        </div>

        <section class="section">
          <h3>📜 Hoạt động gần đây</h3>
          ${state.history.slice(0, 4).map(h => `
            <div style="padding:10px 0;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div>
                <strong style="color:var(--gold)">🎭 ${esc(h.roomName || 'Phòng đấu')} ${h.roomId ? `(#${h.roomId})` : ''}</strong>
                <div class="muted" style="font-size:12px">${h.result.length} người chơi · ${esc(h.date)}</div>
              </div>
              <button type="button" class="btn-secondary" style="padding:5px 10px;font-size:12px" onclick="go('history')">Chi tiết</button>
            </div>
          `).join('') || '<p class="muted">Chưa có hoạt động nào.</p>'}
        </section>
      </div>
    </div>
  `;
}

function editProfile() {
  const a = currentAccount();
  if (!a) return showAuth('login');
  const name = prompt('Tên hiển thị:', a.name);
  if (name === null || !name.trim()) return;
  const bio = prompt('Lời giới thiệu:', a.bio || '');
  if (bio === null) return;
  const location = prompt('Địa điểm trong làng:', a.location || '');
  if (location === null) return;

  const accounts = demoAccounts();
  const target = accounts.find(x => x.id === a.id);
  if (target) {
    target.name = name.trim().slice(0, 40);
    target.bio = bio.trim().slice(0, 220);
    target.location = location.trim().slice(0, 80);
    localStorage.setItem(AUTH_KEY, JSON.stringify(accounts));
  }
  const p = state.players.find(x => x.id === a.id);
  if (p) {
    p.name = name.trim().slice(0, 40);
    save();
  }
  updateTopbarAccount();
  profile();
}

let selectedBattleIdx = 0;
let openBattleStatsIdx = null;
let historyTeamFilter = 'all'; // 'all' | 'dan' | 'soi' | 'phe3'

function normalizeBattleRecord(h, idx) {
  const rawList = Array.isArray(h.result) ? h.result : [];
  const enriched = rawList.map((item, i) => {
    const roleObj = ROLES.find(r => r.id === item.roleId || r.name === item.role) || ROLES[(i * 3) % 52];
    return {
      playerId: item.playerId || (9001 + i),
      name: item.name || `Cư dân #${i + 1}`,
      roleId: roleObj.id,
      role: roleObj.name,
      team: item.team || roleObj.team,
      stars: item.stars || (4 + (i % 2)),
      survived: typeof item.survived === 'boolean' ? item.survived : (i < Math.ceil(rawList.length / 2))
    };
  });

  const winTeam = h.winnerTeam || (
    /sói/i.test(h.winner || '') ? 'soi' : /ba/i.test(h.winner || '') ? 'phe3' : 'dan'
  );

  let winners = enriched.filter(u => u.team === winTeam);
  let losers = enriched.filter(u => u.team !== winTeam);
  if (!winners.length) {
    const half = Math.ceil(enriched.length / 2);
    winners = enriched.slice(0, half);
    losers = enriched.slice(half);
  }
  if (!losers.length) {
    // Bổ sung đội đối đầu mẫu nếu bản ghi cũ chỉ có 1 phe
    losers = [1, 3, 6, 7, 10].map((rid, k) => {
      const rObj = ROLES.find(r => r.id === rid) || ROLES[0];
      return {
        playerId: 9010 + k,
        name: ['Bá Tước Đêm', 'Hắc Pháp Sư', 'Ảo Ảnh Sương', 'Kẻ Đóng Thế', 'Kỵ Sĩ Đêm'][k],
        roleId: rObj.id,
        role: rObj.name,
        team: rObj.team,
        stars: 4,
        survived: false
      };
    });
  }

  const winFactionName = winTeam === 'soi' ? 'Bầy Sói Ác Ma' : winTeam === 'phe3' ? 'Liên Minh Phe Ba' : 'Liên Minh Dân Làng';
  const loseFactionName = winTeam === 'dan' ? 'Bầy Sói & Phe Ba' : 'Hội Đồng Dân Làng';

  return {
    idx,
    date: h.date || '22/11/2026, 21:30',
    roomId: h.roomId || h.room || (1001 + idx),
    roomName: h.roomName || 'Dinh Thự Đồi Trăng',
    winTeam,
    winFactionName,
    loseFactionName,
    mvpName: h.mvpName || winners[0]?.name || 'Luna Moon',
    enemyLeader: h.enemyLeader || losers[0]?.name || 'Mastermind',
    scoreText: h.scoreText || `${winners.filter(x => x.survived).length || winners.length} : ${losers.filter(x => x.survived).length}`,
    rewardCoins: h.rewardCoins || `+${7 + (idx % 5) * 2} /H`,
    rewardPoints: h.rewardPoints || `+${80 + (idx % 4) * 15} /H`,
    logSummary: Array.isArray(h.logSummary) && h.logSummary.length ? h.logSummary : [
      `Đêm 1: Các thân phận tại ${h.roomName || 'Làng Sương Mù'} bí mật kích hoạt năng lực đầu tiên.`,
      `Ngày 2: Cuộc tranh luận nảy lửa tại quảng trường định đoạt cục diện giữa ${winFactionName} và ${loseFactionName}.`,
      `Kết cục: ${winFactionName} giành chiến thắng chung cuộc với đội hình ${winners.length} thành viên.`
    ],
    winners,
    losers
  };
}

function history() {
  const allBattles = state.history.map((h, i) => normalizeBattleRecord(h, i));
  const filteredBattles = allBattles.filter(b =>
    historyTeamFilter === 'all' ? true : b.winTeam === historyTeamFilter
  );

  if (selectedBattleIdx >= allBattles.length) selectedBattleIdx = 0;
  const activeBattle = allBattles[selectedBattleIdx] || allBattles[0];

  const danWins = allBattles.filter(b => b.winTeam === 'dan').length;
  const soiWins = allBattles.filter(b => b.winTeam === 'soi').length;

  $('content').innerHTML = `
    <div class="history-desktop-wrap">
      <!-- BANNER VICT✦RY TINH GỌN, CÂN ĐỐI (Đã đổi ngôi sao 4 cánh sang chữ O và lược bỏ mọi thông tin thừa) -->
      <section class="victory-banner-clean">
        <div class="victory-silhouette-wrap">
          <svg class="victory-silhouette-svg" viewBox="0 0 760 220" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="amberBacklight" cx="50%" cy="68%" r="58%">
                <stop offset="0%" stop-color="#FFF3C4"/>
                <stop offset="38%" stop-color="#E6A145"/>
                <stop offset="75%" stop-color="#5E2929"/>
                <stop offset="100%" stop-color="#1A0E1C"/>
              </radialGradient>
            </defs>
            <rect width="760" height="220" fill="url(#amberBacklight)"/>
            <!-- Khung vòm giáo đường Gothic -->
            <g stroke="#3A1D1E" stroke-width="5" fill="none" opacity="0.45">
              <path d="M120 220 V30 Q380 -20 640 30 V220"/>
              <path d="M220 220 V15 M540 220 V15 M380 120 V0"/>
              <path d="M220 82 Q380 18 540 82"/>
            </g>
            <!-- Tia sáng chiến thắng tỏa từ tâm -->
            <g stroke="#FFF6D6" stroke-width="18" stroke-opacity="0.16">
              <line x1="380" y1="155" x2="110" y2="8"/>
              <line x1="380" y1="155" x2="260" y2="0"/>
              <line x1="380" y1="155" x2="500" y2="0"/>
              <line x1="380" y1="155" x2="650" y2="8"/>
            </g>

            <!-- Bóng đổ (Silhouette) Đội Quân Cổ Tích & Kỵ Sĩ Trung Tâm -->
            <g fill="#23120E" transform="translate(60, -28)">
              <line x1="295" y1="22" x2="352" y2="155" stroke="#23120E" stroke-width="4.5"/>
              <path d="M298 26 Q215 14 155 42 Q95 66 48 49 Q105 94 175 78 Q238 62 310 70 Z"/>
              <path d="M115 245 L138 168 L112 142 L145 122 L152 88 L174 110 L195 92 L198 124 L228 145 L212 245 Z"/>
              <line x1="35" y1="220" x2="215" y2="148" stroke="#23120E" stroke-width="5"/>
              <path d="M245 245 Q255 186 292 160 L278 118 L266 96 L288 92 L298 66 L318 88 L334 65 L336 96 L354 116 L342 154 Q372 130 392 94 Q414 82 436 96 Q442 115 426 135 Q412 152 422 182 L456 214 L442 224 L408 196 L392 245 Z"/>
              <path d="M448 245 L465 162 L445 118 L485 104 L515 128 L552 122 L532 155 L568 175 L545 245 Z"/>
              <path d="M518 66 Q565 112 528 168" fill="none" stroke="#23120E" stroke-width="3.5"/>
              <line x1="485" y1="122" x2="565" y2="104" stroke="#23120E" stroke-width="3"/>
              <path d="M-60 228 Q160 206 320 220 T700 224 L700 250 L-60 250 Z" fill="#120B18"/>
            </g>
          </svg>
        </div>

        <!-- Tiêu đề VICT✦RY (Ngôi sao 4 cánh nằm đúng vị trí chữ O) -->
        <div class="victory-title-lockup">
          <h2 class="victory-word">VICT<span class="victory-star-o">✦</span>RY</h2>
        </div>

        <!-- Bảng Tỷ Số Final Score & 2 Huy hiệu Champion gọn gàng -->
        <div class="victory-scoreboard">
          <div class="champion-crest">
            <div class="crest-emblem">👑</div>
            <strong>${esc(activeBattle?.mvpName || 'Luna Moon')}</strong>
            <small>${esc(activeBattle?.winFactionName || 'Liên Minh Dân Làng')}</small>
          </div>

          <div class="final-score-center">
            <span>Final Score</span>
            <strong>${danWins} : ${soiWins}</strong>
          </div>

          <div class="champion-crest">
            <div class="crest-emblem" style="border-color:#8A7BA8">⚔️</div>
            <strong style="color:#D6CBE8">${esc(activeBattle?.enemyLeader || 'Bá Tước Đêm')}</strong>
            <small>${esc(activeBattle?.loseFactionName || 'Bầy Sói & Phe Ba')}</small>
          </div>
        </div>

        <!-- Thanh công cụ gọn dưới chân Banner: Bên trái là Cộng điểm, bên phải là Bộ lọc nhanh -->
        <div class="victory-bottom-toolbar">
          <div class="victory-rewards-inline">
            <span>
              🪙 <span class="reward-gain">${esc(activeBattle?.rewardCoins || '+12 /H')} <span class="reward-up-arrow">▲</span></span>
            </span>
            <span>
              Point Accumulation: <span class="reward-gain">${esc(activeBattle?.rewardPoints || '+95 /H')} <span class="reward-up-arrow">▲</span></span>
            </span>
          </div>

          <div class="row" style="margin:0;gap:8px">
            ${[
              ['all', `Tất cả (${allBattles.length})`],
              ['dan', '🌿 Dân Làng'],
              ['soi', '🐺 Phe Sói'],
              ['phe3', '🔮 Phe Ba']
            ].map(([k, label]) => `
              <button
                type="button"
                class="chip ${historyTeamFilter === k ? 'active' : ''}"
                style="padding:6px 11px;font-size:12px"
                onclick="historyTeamFilter='${k}';playSelectSfx();history()"
              >${label}</button>
            `).join('')}
            <button type="button" class="btn-gold" style="padding:6px 12px;font-size:12px" onclick="simulateNewBattleRecord()">
              + Thêm Battle
            </button>
          </div>
        </div>
      </section>

      <!-- TẦNG DƯỚI: DANH SÁCH CÁC TRẬN ĐẤU ĐỐI KHÁNG (Battle 1, Battle 2, Battle 3... Widescreen) -->
      <section class="battle-list-container">
        ${filteredBattles.map((b, displayIdx) => {
          const isSelected = b.idx === selectedBattleIdx;
          const isDrawerOpen = openBattleStatsIdx === b.idx;
          const winCaptain = b.winners[0];
          const loseCaptain = b.losers[0];

          return `
            <article
              class="battle-vs-card ${isSelected ? 'selected-battle' : ''}"
              onclick="selectHistoryBattle(${b.idx})"
            >
              <!-- Thanh Header của từng Battle -->
              <header class="battle-bar-header">
                <div class="row" style="margin:0;gap:8px">
                  <span class="room-code">Phòng #${b.roomId}</span>
                  <strong style="color:var(--text)">${esc(b.roomName)}</strong>
                  <span class="muted" style="font-size:12px">· ${esc(b.date)}</span>
                </div>

                <div class="battle-title-center">
                  <span>✦ Battle ${displayIdx + 1} ✦</span>
                </div>

                <div class="row" style="margin:0;gap:8px">
                  <button
                    type="button"
                    class="btn-secondary"
                    style="padding:4px 10px;font-size:12px"
                    onclick="event.stopPropagation();toggleBattleStatsDrawer(${b.idx})"
                  >
                    📊 ${isDrawerOpen ? 'Ẩn diễn biến' : 'Xem diễn biến đêm'}
                  </button>
                  <button
                    type="button"
                    class="btn-secondary"
                    style="padding:4px 9px;font-size:12px"
                    onclick="event.stopPropagation();deleteHistory(${b.idx})"
                    title="Xóa Battle này"
                  >✕</button>
                </div>
              </header>

              <!-- Hàng Đối Kháng Ngang: Phe Thắng (W) ◄── VS ──► Phe Bại (L) -->
              <div class="battle-matchup-grid">
                <!-- BÊN TRÁI: PHE CHIẾN THẮNG (W) -->
                <div class="battle-team-side winner-side">
                  <div class="team-captain-strip">
                    <div class="captain-badge">
                      <div class="captain-avatar-ring">
                        <img src="${portrait(winCaptain?.roleId || 28)}" alt="">
                        <span class="captain-lvl">#${winCaptain?.playerId || 9001}</span>
                      </div>
                      <div class="captain-meta">
                        <strong>${esc(b.mvpName)}</strong>
                        <small>${esc(b.winFactionName)} · ${b.winners.length} thành viên</small>
                      </div>
                    </div>
                    <div class="wl-ribbon win" title="Victory / Chiến thắng">W</div>
                  </div>

                  <!-- Dàn 5 thẻ nhân vật vuông Phe Thắng (Sáng rực rỡ) -->
                  <div class="team-units-row">
                    ${b.winners.slice(0, 5).map(u => `
                      <div
                        class="battle-unit-card ${u.survived ? '' : 'fallen-unit'}"
                        onclick="event.stopPropagation();inspectRoleFromHistory(${u.roleId})"
                        title="#${u.playerId} ${esc(u.name)} — Vai: ${esc(u.role)} (Nhấp để xem kỹ năng)"
                      >
                        <div class="unit-top-bar">
                          <span class="unit-faction-dot">${u.team === 'soi' ? '🐺' : u.team === 'dan' ? '🌿' : '🔮'}</span>
                          <span>#${u.playerId}</span>
                        </div>
                        <img class="unit-portrait-img" src="${portrait(u.roleId)}" alt="${esc(u.role)}">
                        <span class="unit-name-label">${esc(u.role)}</span>
                        <span class="unit-player-sub">${esc(u.name)}</span>
                        <span class="unit-stars">${'★'.repeat(u.stars)}${'☆'.repeat(Math.max(0, 5 - u.stars))}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- CHÍNH GIỮA: NÚT BIỂU ĐỒ HÌNH THOI (◇ 📊) & CHỮ VS VÀNG KIM -->
                <div class="vs-center-column">
                  <button
                    type="button"
                    class="vs-stats-diamond"
                    onclick="event.stopPropagation();toggleBattleStatsDrawer(${b.idx})"
                    title="Xem biểu đồ & nhật ký diễn biến trận này"
                  >
                    <span>📊</span>
                  </button>
                  <div class="vs-gold-letters">VS</div>
                </div>

                <!-- BÊN PHẢI: PHE THẤT BẠI (L) -->
                <div class="battle-team-side loser-side">
                  <div class="team-captain-strip">
                    <div class="captain-badge">
                      <div class="captain-avatar-ring">
                        <img src="${portrait(loseCaptain?.roleId || 1)}" alt="">
                        <span class="captain-lvl">#${loseCaptain?.playerId || 9002}</span>
                      </div>
                      <div class="captain-meta">
                        <strong>${esc(b.enemyLeader)}</strong>
                        <small>${esc(b.loseFactionName)} · ${b.losers.length} thành viên</small>
                      </div>
                    </div>
                    <div class="wl-ribbon lose" title="Defeat / Thất bại">L</div>
                  </div>

                  <!-- Dàn 5 thẻ nhân vật vuông Phe Bại (Trắng đen trầm như ảnh mẫu, hover sáng màu) -->
                  <div class="team-units-row">
                    ${b.losers.slice(0, 5).map(u => `
                      <div
                        class="battle-unit-card"
                        onclick="event.stopPropagation();inspectRoleFromHistory(${u.roleId})"
                        title="#${u.playerId} ${esc(u.name)} — Vai: ${esc(u.role)} (Nhấp để xem kỹ năng)"
                      >
                        <div class="unit-top-bar">
                          <span class="unit-faction-dot">${u.team === 'soi' ? '🐺' : u.team === 'dan' ? '🌿' : '🔮'}</span>
                          <span>#${u.playerId}</span>
                        </div>
                        <img class="unit-portrait-img" src="${portrait(u.roleId)}" alt="${esc(u.role)}">
                        <span class="unit-name-label">${esc(u.role)}</span>
                        <span class="unit-player-sub">${esc(u.name)}</span>
                        <span class="unit-stars">${'★'.repeat(u.stars)}${'☆'.repeat(Math.max(0, 5 - u.stars))}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              </div>

              <!-- Ngăn kéo Diễn biến chi tiết từng Đêm (Mở khi bấm nút hình thoi ◇ 📊) -->
              ${isDrawerOpen ? `
                <div class="battle-detail-drawer">
                  ${b.logSummary.map((line, stepIdx) => `
                    <div class="fact-box">
                      <span>Hồi ${stepIdx + 1} · Biên niên sử</span>
                      <strong style="color:var(--text);font-weight:500;line-height:1.5">${esc(line)}</strong>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </article>
          `;
        }).join('') || '<div class="empty">Không có trận đấu nào khớp với bộ lọc hiện tại.</div>'}
      </section>
    </div>
  `;
}

function selectHistoryBattle(idx) {
  playHoverSfx();
  selectedBattleIdx = idx;
  history();
}

function toggleBattleStatsDrawer(idx) {
  playSelectSfx();
  selectedBattleIdx = idx;
  openBattleStatsIdx = openBattleStatsIdx === idx ? null : idx;
  history();
}

function inspectRoleFromHistory(roleId) {
  const found = ROLES.find(r => r.id === roleId);
  if (found) selected = found;
  go('roles');
}

function simulateNewBattleRecord() {
  playSelectSfx();
  const winTeams = ['dan', 'soi', 'phe3'];
  const pickedTeam = winTeams[state.history.length % winTeams.length];
  const shuffled = [...ROLES.slice(0, 52)].sort(() => Math.random() - 0.5);
  const winners = shuffled.filter(r => r.team === pickedTeam).slice(0, 5);
  const losers = shuffled.filter(r => r.team !== pickedTeam).slice(0, 5);

  const result = [
    ...winners.map((r, i) => ({
      playerId: 9001 + i,
      name: DEFAULT_PLAYERS[i % DEFAULT_PLAYERS.length].name,
      roleId: r.id,
      role: r.name,
      team: r.team,
      stars: 5 - (i % 2),
      survived: i < 4
    })),
    ...losers.map((r, i) => ({
      playerId: 9006 + i,
      name: DEFAULT_PLAYERS[(i + 3) % DEFAULT_PLAYERS.length].name,
      roleId: r.id,
      role: r.name,
      team: r.team,
      stars: 4,
      survived: false
    }))
  ];

  state.history.unshift({
    id: 100 + state.history.length + 1,
    date: new Date().toLocaleString('vi-VN'),
    roomId: 1001 + (state.history.length % 3),
    roomName: ['Dinh Thự Đồi Trăng', 'Quán Trọ Nhung Đỏ', 'Tháp Canh Sương Mù'][state.history.length % 3],
    winner: pickedTeam === 'soi' ? 'Phe Sói' : pickedTeam === 'phe3' ? 'Phe Ba' : 'Phe Dân Làng',
    winnerTeam: pickedTeam,
    scoreText: '4 : 1',
    mvpName: result[0]?.name || 'Luna Moon',
    enemyLeader: result[5]?.name || 'Bá Tước Đêm',
    rewardCoins: '+11 /H',
    rewardPoints: '+90 /H',
    result
  });
  selectedBattleIdx = 0;
  save();
  history();
}

function deleteHistory(idx) {
  state.history.splice(idx, 1);
  save();
  history();
}

function ranking() {
  const ranked = [...state.players].sort((a, b) => (state.scores[b.id] || 0) - (state.scores[a.id] || 0));
  $('content').innerHTML = `
    <section class="section">
      <div class="section-header">
        <h3>🏆 Bảng xếp hạng Cư dân Làng Trăng</h3>
        <span class="muted" style="font-size:12.5px">Có thể cộng/trừ điểm trực tiếp sau mỗi ván diễn</span>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Mã #ID</th>
              <th>Người chơi</th>
              <th>Điểm danh vọng</th>
              <th>Điều chỉnh nhanh</th>
            </tr>
          </thead>
          <tbody>
            ${ranked.map((p, i) => `
              <tr>
                <td><b style="color:var(--gold)">${['🥇 #1', '🥈 #2', '🥉 #3'][i] || '#' + (i + 1)}</b></td>
                <td><span class="room-code">#${p.id}</span></td>
                <td><strong>${esc(p.name)}</strong></td>
                <td><b style="color:var(--gold);font-size:15px">${state.scores[p.id] || 0}</b></td>
                <td>
                  <button type="button" class="btn-secondary" style="padding:4px 10px" onclick="adjustScore(${p.id}, 25)">+25</button>
                  <button type="button" class="btn-secondary" style="padding:4px 10px" onclick="adjustScore(${p.id}, -25)">−25</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function adjustScore(playerId, delta) {
  state.scores[playerId] = Math.max(0, (state.scores[playerId] || 0) + delta);
  save();
  ranking();
}

/* ==========================================================================
   15. Hệ thống: Cài đặt (OPTIONS — Âm lượng, Tốc độ hiệu ứng, Hạt nền, Theme)
   ========================================================================== */
const THEME_OPTIONS = [
  ['moon', '🌙 Cổ tích đen (Chuẩn báo cáo #0E0C1D)'],
  ['gothic', '🦇 Gothic Đỏ Rượu'],
  ['classic', '🕯️ Cổ điển Charcoal'],
  ['basicdark', '🌑 Basic Tối dịu mắt'],
  ['basiclight', '☁️ Basic Sáng (Ban ngày)'],
  ['cream', '☕ Kem ấm (Giấy cổ tích)'],
  ['sage', '🌿 Xanh Sage dịu nhẹ'],
  ['europe', '🏰 Trung cổ châu Âu'],
  ['eastasia', '🏯 Trung cổ Đông Á'],
  ['jade', '🍃 Ngọc bích'],
  ['sakura', '🌸 Sakura Đêm'],
  ['loli', '🎀 Loli Fantasy'],
  ['frost', '❄️ Băng nguyệt'],
  ['bloodmoon', '🩸 Trăng máu'],
  ['forest', '🌲 Rừng cổ tích'],
  ['royal', '👑 Hoàng gia']
];

function settings() {
  const curTheme = document.body.dataset.theme || 'moon';
  $('content').innerHTML = `
    <div class="settings-grid">
      <section class="section">
        <h3>🎵 Âm thanh</h3>
        <p class="muted" style="font-size:13px">
          Điều chỉnh âm lượng nhạc nền hộp nhạc sảnh chờ, tiếng tick khi di chuyển con trỏ menu và tiếng chốt khóa khi chọn.
        </p>
        <div class="slider-row">
          <label for="bgmVolRange">Nhạc nền: <b id="bgmVolVal" style="color:var(--gold)">${state.bgmVolume}%</b></label>
          <input
            id="bgmVolRange"
            type="range"
            min="0"
            max="100"
            value="${state.bgmVolume}"
            oninput="state.bgmVolume=Number(this.value);$('bgmVolVal').textContent=this.value+'%';save();syncVillageEffects()"
          >
        </div>
        <div class="slider-row">
          <label for="sfxVolRange">Hiệu ứng âm thanh: <b id="sfxVolVal" style="color:var(--gold)">${state.sfxVolume}%</b></label>
          <input
            id="sfxVolRange"
            type="range"
            min="0"
            max="100"
            value="${state.sfxVolume}"
            oninput="state.sfxVolume=Number(this.value);$('sfxVolVal').textContent=this.value+'%';save()"
          >
        </div>
        <div class="row">
          <button type="button" class="btn-gold" onclick="toggleBGM()">
            ${bgmPlaying ? '⏸ Tắt nhạc hộp nhạc' : '▶ Bật nhạc hộp nhạc'}
          </button>
          <button type="button" class="btn-secondary" onclick="playSelectSfx()">
            🔔 Nghe thử
          </button>
        </div>
      </section>

      <section class="section">
        <h3>✨ Ánh sáng và hiệu ứng</h3>
        <label class="wv-motion-setting"><input type="checkbox" ${window.WolvesVisual?.reduced()?'checked':''} onchange="WolvesVisual.setReduced(this.checked)"> Giảm chuyển động giao diện</label>
        <p class="muted" style="font-size:13px">
          Tùy chỉnh hạt bụi sáng trên màn hình Khởi động. Toàn bộ nội dung chữ hiển thị tức thì.
        </p>
        <div class="row" style="margin:12px 0">
          <button
            type="button"
            class="${state.particlesEnabled ? 'btn-gold' : 'btn-secondary'}"
            onclick="state.particlesEnabled=!state.particlesEnabled;save();settings()"
          >
            ${state.particlesEnabled ? '✦ Hạt đom đóm nền: ĐANG BẬT' : '○ Hạt đom đóm nền: ĐANG TẮT'}
          </button>
        </div>

      </section>

      <section class="section">
        <h3>🎨 Màu sắc giao diện</h3>
        <div class="row">
          <button type="button" class="btn-gold" onclick="setWolvesTheme('moon')">🌙 Tối Cổ Tích Đen</button>
          <button type="button" class="btn-secondary" onclick="setWolvesTheme('basiclight')">☀️ Chế độ Sáng</button>
          <button type="button" class="btn-secondary" onclick="setWolvesTheme('cream')">📜 Giấy Kem Ấm</button>
        </div>
        <div style="margin-top:12px">
          <select
            id="settingsThemeSelect"
            class="input-field"
            style="width:100%"
            onchange="setWolvesTheme(this.value)"
          >
            ${THEME_OPTIONS.map(([val, label]) => `
              <option value="${val}" ${curTheme === val ? 'selected' : ''}>${esc(label)}</option>
            `).join('')}
          </select>
        </div>
      </section>

      <section class="section">
        <h3>🔒 Dữ liệu tài khoản</h3>
        <p class="muted">Hồ sơ, phòng và ván chơi được lưu an toàn trên máy chủ. Cài đặt âm thanh và giao diện chỉ có tác dụng trên thiết bị này.</p>
        <button type="button" class="btn-secondary" onclick="go('profile')">Xem hồ sơ của tôi</button>
      </section>
    </div>
  `;
}

function exportData() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));
  a.download = 'wolvesville-stage-data.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function importData(input) {
  const f = input.files?.[0];
  if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const parsed = JSON.parse(r.result);
      if (!Array.isArray(parsed.players) || !Array.isArray(parsed.rooms)) throw new Error('Invalid format');
      state = parsed;
      save();
      render();
      alert('Đã nhập dữ liệu thành công!');
    } catch {
      alert('Tệp JSON không đúng định dạng dữ liệu Wolvesville.');
    }
  };
  r.readAsText(f);
}

function resetData() {
  if (!confirm('Khôi phục toàn bộ dữ liệu phòng đấu, người chơi và lịch sử về mặc định?')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  save();
  render();
}

/* ==========================================================================
   16. Trợ lý Cô Bé Quàng Khăn Đỏ & Theme Studio
   ========================================================================== */
function setWolvesTheme(name) {
  const allowed = THEME_OPTIONS.map(x => x[0]);
  if (!allowed.includes(name)) name = 'moon';
  document.body.dataset.theme = name;
  const sel = $('themeSelect');
  if (sel) sel.value = name;
  const sel2 = $('settingsThemeSelect');
  if (sel2) sel2.value = name;
  try {
    localStorage.setItem('wolvesville_theme_v2', name);
  } catch (e) {}
  window.WolvesWorkspace?.savePreferences();
}

function addMessage(text, me = false) {
  const d = document.createElement('div');
  d.className = 'bubble' + (me ? ' me' : '');
  d.textContent = text;
  const box = $('messages');
  if (!box) return;
  box.append(d);
  box.scrollTop = box.scrollHeight;
}

function respondBot(q) {
  const s = q.toLocaleLowerCase('vi');
  const foundRole = ROLES.find(c => s.includes(c.name.toLocaleLowerCase('vi')) || s === `#${c.id}`);
  if (foundRole) {
    return `🎭 #${String(foundRole.id).padStart(2, '0')} ${foundRole.name} (${teamLabel(foundRole)} · Hào quang: ${foundRole.aura})\n\n${foundRole.desc}`;
  }
  if (/bản đồ|làng|phòng/.test(s)) {
    return 'Tại mục "Bản đồ Làng (Sảnh)", mỗi công trình phát sáng trên đồi đại diện cho một phòng chơi hoặc khu chức năng. Bạn chỉ cần nhấp vào công trình để cấu hình phòng hoặc vào trận!';
  }
  if (/trong trận|sân khấu|hud|hộp thoại/.test(s)) {
    return 'Mục "Sân khấu Trong trận" tái hiện HUD góc trên trái (tim máu, thẻ vai, lượt kỹ năng), vòng người chơi ở giữa và hộp thoại Quản trò hiển thị văn bản tức thì ở đáy màn hình!';
  }
  return 'Xin chào lữ khách! Bạn có thể gõ tên bất kỳ nhân vật nào trong 97 vai (vd: "Sói Đạo Tặc", "Dorothy", "Tiên Tri") để mình trích xuất nguyên văn kỹ năng cho bạn.';
}

function askRole(roleId) {
  const c = ROLES.find(r => r.id === roleId) || selected;
  const chat = $('chat');
  if (chat) {
    chat.classList.add('open');
    placeChat();
  }
  addMessage(`Giải thích kỹ năng của #${String(c.id).padStart(2, '0')} ${c.name}`, true);
  addMessage(respondBot(c.name));
}

function placeChat() {
  const botEl = $('bot');
  const c = $('chat');
  if (!botEl || !c) return;
  const b = botEl.getBoundingClientRect();
  const w = Math.min(365, innerWidth - 24);
  const h = Math.min(460, innerHeight - 110);
  let left = b.left - w - 12;
  if (left < 8) left = Math.min(innerWidth - w - 8, b.right + 12);
  const top = Math.min(innerHeight - h - 8, Math.max(8, b.top - h + 65));
  c.style.left = left + 'px';
  c.style.top = top + 'px';
}

function initFloatingBot() {
  const bot = $('bot');
  if (!bot) return;
  let drag = null, botX = 0, botY = 0;
  const EDGE = 12;
  const clamp = (x, y) => [
    Math.max(EDGE, Math.min(innerWidth - bot.offsetWidth - EDGE, x)),
    Math.max(EDGE, Math.min(innerHeight - bot.offsetHeight - EDGE, y))
  ];
  const position = (x, y) => {
    [botX, botY] = clamp(x, y);
    bot.style.left = botX + 'px';
    bot.style.top = botY + 'px';
  };
  const snapToEdge = () => {
    const maxX = innerWidth - bot.offsetWidth - EDGE;
    const maxY = innerHeight - bot.offsetHeight - EDGE;
    const distances = [
      { d: botX, x: EDGE, y: botY },
      { d: maxX - botX, x: maxX, y: botY },
      { d: botY, x: botX, y: EDGE },
      { d: maxY - botY, x: botX, y: maxY }
    ];
    distances.sort((a, b) => a.d - b.d);
    position(distances[0].x, distances[0].y);
    if ($('chat')?.classList.contains('open')) placeChat();
  };

  requestAnimationFrame(() => position(innerWidth - bot.offsetWidth - EDGE, innerHeight - bot.offsetHeight - 80));

  bot.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = { id: e.pointerId, startX: e.clientX, startY: e.clientY, x: botX, y: botY, moved: false };
    bot.setPointerCapture(e.pointerId);
    bot.classList.add('dragging');
  });
  bot.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.hypot(dx, dy) > 7) drag.moved = true;
    if (drag.moved) position(drag.x + dx, drag.y + dy);
  });
  bot.addEventListener('pointerup', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    bot.classList.remove('dragging');
    if (moved) {
      snapToEdge();
    } else {
      $('chat')?.classList.toggle('open');
      if ($('chat')?.classList.contains('open')) placeChat();
    }
  });
  window.addEventListener('resize', () => {
    position(botX, botY);
    snapToEdge();
  });

  $('closechat')?.addEventListener('click', () => $('chat')?.classList.remove('open'));
  $('chatForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('question');
    const q = input?.value.trim();
    if (!q) return;
    addMessage(q, true);
    input.value = '';
    addMessage(respondBot(q));
  });
}

function initSidebarResize() {
  const bar = $('sidebarResize');
  if (!bar) return;
  const root = document.documentElement;
  const storageKey = 'wolvesville_sidebar_width';
  const clamp = v => Math.min(320, Math.max(200, v));
  try {
    const n = Number(localStorage.getItem(storageKey));
    if (Number.isFinite(n) && n >= 200 && n <= 320) root.style.setProperty('--wv-sidebar-width', n + 'px');
  } catch (e) {}

  let active = false, startX = 0, startWidth = 232, pointerId = null;
  const apply = w => {
    const n = clamp(w);
    root.style.setProperty('--wv-sidebar-width', n + 'px');
    return n;
  };
  bar.addEventListener('pointerdown', e => {
    if (e.button !== 0 || matchMedia('(max-width:780px)').matches) return;
    active = true;
    pointerId = e.pointerId;
    startX = e.clientX;
    startWidth = document.querySelector('.sidebar').getBoundingClientRect().width;
    bar.setPointerCapture(e.pointerId);
    bar.classList.add('resizing');
    e.preventDefault();
  });
  bar.addEventListener('pointermove', e => {
    if (active && e.pointerId === pointerId) apply(startWidth + e.clientX - startX);
  });
  const finish = e => {
    if (!active || e.pointerId !== pointerId) return;
    active = false;
    bar.classList.remove('resizing');
    try {
      localStorage.setItem(storageKey, String(Math.round(document.querySelector('.sidebar').getBoundingClientRect().width)));
    } catch (e) {}
  };
  bar.addEventListener('pointerup', finish);
  bar.addEventListener('pointercancel', finish);
  bar.addEventListener('dblclick', () => {
    root.style.setProperty('--wv-sidebar-width', '232px');
    try { localStorage.removeItem(storageKey); } catch (e) {}
  });
}

/* ==========================================================================
   17. Khởi tạo Ứng dụng (Bootstrapping)
   ========================================================================== */
function initStoryCharacter() {
  const art = $('landingStory')?.querySelector('.landing-story-art');
  if (!art || !('IntersectionObserver' in window)) return;

  let visible = false;
  const sync = () => art.classList.toggle('is-animating', visible && !document.hidden);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    sync();
  }).observe(art);
  document.addEventListener('visibilitychange', sync);
}

document.addEventListener('DOMContentLoaded', () => {
  initStoryCharacter();
  document.addEventListener('click', unlockVillageAudio, { capture: true });
  document.addEventListener('visibilitychange', syncVillageEffects);
  // Demo users are never authenticated against the live backend.
  let savedTheme = 'moon';
  try {
    savedTheme = localStorage.getItem('wolvesville_theme_v2') || 'moon';
  } catch (e) {}
  setWolvesTheme(savedTheme);

  // Login is server authoritative; do not auto-login with a local demo account.
  localStorage.removeItem(SESSION_KEY);

  $('appShell').inert = true;
  initParticleCanvas();
  initKeyboardNavigation();
  initSidebarResize();
  initFloatingBot();
  if (window.WolvesLive?.enabled) { state.rooms = []; state.players = []; state.history = []; }
  render();
});
