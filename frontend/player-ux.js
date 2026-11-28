/** Wolvesville player-facing wording. No rule computation or fabricated result. */
(() => {
  'use strict';
  const messages = Object.freeze({
    INVALID_CREDENTIALS:'Tên đăng nhập hoặc mật khẩu không đúng.',
    BAD_CREDENTIALS:'Tên đăng nhập hoặc mật khẩu không đúng.',
    AUTH_FAILED:'Tên đăng nhập hoặc mật khẩu không đúng.',
    UNAUTHENTICATED:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    UNAUTHORIZED:'Bạn cần đăng nhập lại để tiếp tục.',
    FORBIDDEN:'Bạn không có quyền thực hiện thao tác này.',
    NOT_MEMBER:'Bạn chưa tham gia phòng này.',
    NOT_HOST:'Chỉ chủ phòng được thực hiện thao tác này.',
    ROOM_FULL:'Phòng đã đủ người. Hãy chọn phòng khác.',
    ROOM_LOCKED:'Phòng đã khóa, bạn không thể tham gia lúc này.',
    ALREADY_JOINED:'Bạn đã tham gia phòng.',
    NOT_FOUND:'Không tìm thấy dữ liệu. Hãy thử làm mới.',
    REVISION_MISMATCH:'Trạng thái trận đã thay đổi. Vui lòng thử lại.',
    STALE_REVISION:'Trạng thái trận đã thay đổi. Vui lòng thử lại.',
    RULE_UNRESOLVED:'Hành động này hiện chưa được hỗ trợ.',
    PENDING_ACTIONS:'Vẫn còn hành động đang chờ xử lý. Hãy xử lý lượt trước khi khóa phiếu.',
    RULE_CONFLICT:'Hành động này hiện chưa được hỗ trợ.',
    WRONG_PHASE:'Chưa đến thời điểm sử dụng hành động này.',
    OUT_OF_PHASE:'Chưa đến lượt thực hiện hành động này.',
    PHASE_CLOSED:'Lượt hành động đã kết thúc.',
    REVISION_CONFLICT:'Trạng thái trận đã thay đổi. Vui lòng thử lại.',
    IDEMPOTENCY_CONFLICT:'Hành động đã được gửi trước đó. Hãy làm mới trạng thái.',
    TARGET_INVALID:'Không thể chọn người chơi này làm mục tiêu.',
    SKILL_LOCKED:'Kỹ năng này đang bị khóa.',
    RESOURCE_INSUFFICIENT:'Bạn không đủ lượt sử dụng kỹ năng.',
    NO_GAME:'Bạn chưa vào ván chơi. Hãy chọn một phòng trước.',
    NO_ROLE_CHANGE:'Không thể tự đổi nhân vật trong trận.',
    NO_PHASE_CHANGE:'Vui lòng chờ lượt chơi được chuyển tự động.',
    INVALID_ROOM_INPUT:'Hãy nhập tên phòng và sức chứa từ 1 đến 100.',
    INTERNAL_ERROR:'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.',
    RATE_LIMITED:'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
    INVALID_SESSION:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    DEMO_EXPIRED:'Phiên trải nghiệm đã hết hạn. Bạn có thể bắt đầu trải nghiệm mới.',
    DISCONNECTED:'Đã mất kết nối với làng. Hãy đợi một chút rồi thử lại.',
    UNKNOWN_SKILL:'Kỹ năng này hiện chưa được hỗ trợ.',
    SKILL_NOT_ALLOWED:'Nhân vật hiện không thể dùng kỹ năng này.',
    NOT_AUTHORIZED:'Bạn không có quyền thực hiện thao tác này.',
    GAME_UNAVAILABLE:'Ván chơi hiện không khả dụng.',
    ALREADY_STARTED:'Ván chơi đã bắt đầu.',
    CONFIGURATION_INVALID:'Cấu hình phòng chưa hợp lệ để bắt đầu.',
    ROOM_NOT_READY:'Mọi người phải xác nhận sẵn sàng trước khi bắt đầu.',
    ROOM_OFFLINE:'Tất cả người chơi cần kết nối trước khi bắt đầu.',
    ROOM_NOT_CONFIGURED:'Chủ phòng cần khóa danh sách và chọn bộ vai.',
    INVALID_ROLES:'Bộ vai chưa được hỗ trợ trong cấu hình phòng này.',
    HOST_ONLINE:'Chủ phòng hiện tại vẫn đang kết nối.',
    ROOM_NOT_LOCKED:'Chủ phòng cần khóa phòng trước khi bắt đầu.',
    INVALID_AUTH:'Tên đăng nhập hoặc mật khẩu không đúng.',
    ACCOUNT_EXISTS:'Tên đăng nhập đã được sử dụng.',
    USERNAME_TAKEN:'Tên đăng nhập đã được sử dụng.',
    INVALID_USERNAME:'Tên đăng nhập không hợp lệ.',
    INVALID_PASSWORD:'Mật khẩu chưa đáp ứng yêu cầu.',
    HTTP_429:'Bạn thao tác quá nhanh. Vui lòng thử lại sau.',
    HTTP_503:'Máy chủ đang bảo trì. Vui lòng thử lại sau.',
    INVALID_TARGET:'Không thể chọn người chơi này làm mục tiêu.',
    DEMO_DISABLED:'Máy chủ chưa bật chế độ trải nghiệm.',
    DEMO_RATE_LIMITED:'Quá nhiều lượt truy cập thử. Vui lòng thử lại sau.',
    DEMO_FORBIDDEN_ORIGIN:'Không thể tạo phiên trải nghiệm từ địa chỉ này.',
    NETWORK_ERROR:'Không thể kết nối máy chủ. Hãy kiểm tra mạng và thử lại.',
    TIMEOUT:'Máy chủ phản hồi chậm. Hãy làm mới trạng thái trước khi thử lại.',
    HTTP_409:'Trạng thái đã thay đổi. Hãy làm mới và thử lại.',
    HTTP_401:'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    HTTP_403:'Bạn không có quyền thực hiện thao tác này.',
    HTTP_500:'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
  });
  const phaseLabels=Object.freeze({
    ROOM_READY:'Chờ bắt đầu',GAME_PREPARING:'Đang chuẩn bị',ROLE_ASSIGNED:'Đã nhận vai',
    NIGHT_COLLECT:'Đêm · Chọn hành động', NIGHT_RESOLVE:'Đêm · Đang phân giải', WITCH_WINDOW:'Đêm · Lượt Phù Thủy',
    DAY_DISCUSS:'Ngày · Thảo luận', DAY_VOTE_COLLECT:'Ngày · Ghi nhận phiếu', DAY_RESOLVE:'Ngày · Đang chờ quy tắc kiểm phiếu',
    DAY_DISCUSSION:'Ngày · Thảo luận',DAY_VOTE:'Ngày · Bỏ phiếu',
    GAME_COMPLETED:'Ván đấu đã kết thúc', COMPLETED:'Ván đấu đã kết thúc'
  });
  const roomLabels=Object.freeze({WAITING:'Đang mở',LOCKED:'Đã khóa',IN_GAME:'Đang chơi',COMPLETED:'Đã kết thúc'});
  const actionLabels=Object.freeze({SUBMITTED:'Đang gửi hành động…',ACCEPTED:'Đã nhận hành động',
    PENDING_RESOLUTION:'Đang chờ kết quả',RESOLVED:'Đã xử lý',CANCELLED:'Đã hủy',
    REJECTED:'Không thể thực hiện',RULE_UNRESOLVED:'Chưa hỗ trợ'});
  function errorMessage(error){
    const code=typeof error==='string'?error:error?.code;
    if(code&&Object.hasOwn(messages,code))return messages[code];
    return 'Không thể hoàn tất thao tác. Hãy kiểm tra trạng thái và thử lại.';
  }
  window.WolvesPlayerUX=Object.freeze({errorMessage,
    roomStatus:s=>roomLabels[s]||'Chưa rõ trạng thái',
    phase:s=>phaseLabels[s]||'Đang cập nhật',
    actionStatus:s=>actionLabels[s]||'Đang cập nhật',
    supportedPage:new Set(['rooms','ingame','roles','profile','settings'])
  });
})();

/** v1.7.35: adapted from Sprint07 Event-to-Animation contract.
 * Presentation only. No gameplay calculation; receive authorized snapshots and
 * events already filtered by server. Hydration/reconnect never plays old events.
 */
(() => {
  'use strict';
  const eventLabels=Object.freeze({ROLE_OBSERVED:'Có kết quả điều tra riêng',SEER_AURA_OBSERVED:'Có kết quả hào quang riêng',VOTING_CANCELLED:'Lượt biểu quyết đã bị hủy',PLAYER_ELIMINATED:'Hội đồng đã ghi nhận một người bị loại',PLAYER_REVIVED:'Một người chơi đã hồi sinh'});
  function describeTransition(previous,next,viewerId){
    if(!next?.gameId)return null;
    if(previous?.gameId!==next.gameId){return next.players?.some(p=>p.playerId===viewerId&&p.self)?{kind:'role',text:'Bạn đã nhận vai — xem thẻ riêng của bạn'}:null;}
    if(next.completed&&!previous.completed)return {kind:'end',text:'Ván đấu đã kết thúc — kết quả từ máy chủ'};
    if(previous.phase!==next.phase||previous.round!==next.round){
      if(next.phase==='DAY_VOTE_COLLECT')return {kind:'vote',text:'Hội đồng mở lượt biểu quyết'};
      if(next.phase==='DAY_DISCUSS')return {kind:'day',text:`Bình minh · Ngày ${next.round}`};
      if(next.phase==='NIGHT_COLLECT')return {kind:'night',text:`Màn đêm · Đêm ${next.round}`};
    }
    return null;
  }
  let motion=false;try{motion=localStorage.getItem('wv_visual_reduce')==='1';}catch{}
  const reduced=()=>motion||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function setReduced(value){motion=!!value;document.body?.classList.toggle('wv-visual-reduced',motion);try{localStorage.setItem('wv_visual_reduce',motion?'1':'0');}catch{}}
  function cue(kind){
    // Use existing sound preferences and only an already user-unlocked audio context.
    try{if(typeof audioCtx==='undefined'||audioCtx?.state!=='running'||!state.sfxVolume)return;
      const now=audioCtx.currentTime,osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='sine';osc.frequency.setValueAtTime(kind==='ready'?659:kind==='end'?523:kind==='night'?220:392,now);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,state.sfxVolume/100*.035),now+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+.25);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+.26);
    }catch{/* unavailable sound cannot change state */}
  }
  let timer=0,lastGame=null;const seen=new Set();
  function clear(){clearTimeout(timer);document.getElementById('wv-visual-toast')?.remove();}
  function show(kind,text){clear();const el=document.createElement('div');el.id='wv-visual-toast';el.className='wv-visual-toast';el.setAttribute('role','status');el.dataset.kind=kind;el.textContent=text;if(reduced())el.classList.add('wv-visual-no-motion');document.body.append(el);cue(kind);timer=setTimeout(()=>el.remove(),2400);}
  function snapshot(previous,next,viewerId,animate){if(lastGame!==next?.gameId){lastGame=next?.gameId;seen.clear();clear();}if(!animate){clear();return;}const item=describeTransition(previous,next,viewerId);if(item)show(item.kind,item.text);}
  function events(gameId,previous,all,animate){if(gameId!==lastGame)return;const old=new Set(previous.map(e=>e.eventId));let latest=null;for(const e of all){if(!e.eventId||seen.has(e.eventId))continue;seen.add(e.eventId);if(animate&&previous.length&&!old.has(e.eventId)&&Object.hasOwn(eventLabels,e.eventType))latest=e;}if(latest)show('event',eventLabels[latest.eventType]);}
  if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',()=>setReduced(motion),{once:true});
  window.WolvesVisual=Object.freeze({describeTransition,eventLabels,snapshot,events,clear,reduced,setReduced,cue});
})();
