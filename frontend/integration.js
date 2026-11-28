/** Wolvesville Sprint 03: approved original UI + live server data adapter.
 * No client-side game adjudication or fabricated skill result. */
(() => {
  'use strict';
  const original = {ingame:window.ingame, renderVillagePanel:window.renderVillagePanel, profile:window.profile, go:window.go};
  const TOKEN_KEY='wv_s03_session_token';
  const HINT_KEY='wv_s03_session_navigation'; // Login convenience only; NEVER used as game-state source of truth.
  const ux=window.WolvesPlayerUX;
  const errorText=error=>ux.errorMessage(error);
  const encode=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rname=(characterId)=>live.characters.find(c=>c.id===characterId)?.name||'Đang tải tên nhân vật';
  function updatePhaseClock(){const clock=document.querySelector('.wv3-clock');if(!clock)return;const start=Number(clock.dataset.startedAt);if(!start)return;const secs=Math.max(0,Math.floor((Date.now()+Number(clock.dataset.serverOffset)-start)/1000));clock.textContent='Đã qua '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+' · chờ điều phối';}
  setInterval(updatePhaseClock,1000);
  const allowedPage=new Set(['rooms','ingame','roles','profile','settings','friends','feed','notifications','assistant','history','career']);
  const live={enabled:true,token:sessionStorage.getItem(TOKEN_KEY),profile:null,rooms:[],room:null,game:null,gameId:null,
    ws:null,attempt:0,reconnectTimer:null,feedback:new Map(),events:[],renderedEventIds:new Set(),lastRevision:-1,
    characters:[],previewRoomId:null,localSeatToId:[],selectedTarget:null,secondTarget:null,chatDraft:'',chatSending:false,chatNotice:'',chatRetry:null,chatSeenCount:0,chatUnread:0,chatLastCount:0,actionRetry:null,wheelNode:null,compositionNode:null,chatNode:null,mediumChatNode:null,mediumChatDraft:'',mediumChatTarget:null,mediumChatNotice:'',mediumChatSending:false,mediumChatRetry:null,eventsRevision:-1,working:false,loading:false,notice:'',gameCreated:false,
    startKeys:new Map(),normalMode:false,normalDecks:[],selectedSkill:null,deckChoice:'reactive',lifeModuleSelection:'',liveSince:0,connectionState:'offline',lastSyncAt:0,requestCounter:0,roomsRequestSeq:0,
    async request(path,method='GET',body){
      // Same-origin API; no blind retries for writes that could already have committed.
      let resp;
      try { resp=await fetch(path,{method,headers:{'Content-Type':'application/json',...(this.token?{Authorization:`Bearer ${this.token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(15000)}); }
      catch (cause) {const er=new Error('Không thể kết nối máy chủ.');er.code=cause?.name==='TimeoutError'?'TIMEOUT':'NETWORK_ERROR';throw er;}
      const data=await resp.json().catch(()=>({}));
      if(!resp.ok){const er=new Error(errorText({code:data.error?.code||`HTTP_${resp.status}`}));er.code=data.error?.code||`HTTP_${resp.status}`;if(resp.status===401){this.expire();showAuth('login');}throw er;}
      return data;
    },
    persistHint(){sessionStorage.setItem(HINT_KEY,JSON.stringify({roomId:this.room?.id??null,gameId:this.gameId}));},
    expire(){window.WolvesWorkspace?.clear();window.WolvesFate?.forgetUser(this.profile?.id);document.getElementById('wv2-dialog')?.remove();this.groupChatNode?.remove();this.groupChatNode=null;this.groupChatSession=null;this.token=null;this.profile=null;sessionStorage.removeItem(TOKEN_KEY);sessionStorage.removeItem(HINT_KEY);this.disconnect();},
    displayError(e){this.notice=errorText(e);this.refreshUI(true);this.updateConnectionBanner();},
    async startDemo(){
      if(this.loading)return;
      const btn=document.getElementById('wv-demo-button');
      const err=document.getElementById('authError');
      if(err)err.textContent='';
      this.loading=true;
      if(btn){btn.disabled=true;btn.textContent='Đang kết nối trải nghiệm…';}
      try{
       const data=await this.request('/api/auth/demo','POST',{});
       this.token=data.token;this.profile=data.profile;
       sessionStorage.setItem(TOKEN_KEY,data.token);
       document.getElementById('authScreen').hidden=true;
       this.notice='';this.connect();await this.refreshRooms();
       if(titleScreenOpen)enterGamePage('rooms');else {page='rooms';render();}
       updateTopbarAccount();
      }catch(e){
       const messages={DEMO_DISABLED:'Máy chủ chưa bật chế độ trải nghiệm Demo.',DEMO_RATE_LIMITED:'Đã tạo quá nhiều phiên Demo. Vui lòng thử lại sau.',
        DEMO_FORBIDDEN_ORIGIN:'Yêu cầu Demo không hợp lệ.',NETWORK_ERROR:'Không kết nối được máy chủ.'};
       if(err)err.textContent=messages[e.code]||'Không thể tạo phiên Demo. Vui lòng kiểm tra kết nối và thử lại.';
      }finally{this.loading=false;if(btn){btn.disabled=false;btn.textContent='Trải nghiệm tài khoản mẫu';}}
    },
    async submitAuth(event){
      event.preventDefault();const user=$('authUser').value.trim(),pass=$('authPass').value;
      const err=$('authError');err.textContent='';
      if(pass.length<10){err.textContent='Mật khẩu cần có ít nhất 10 ký tự.';return;}
      if(authTab==='register'&&pass!==$('authConfirm').value){err.textContent='Mật khẩu xác nhận không khớp.';return;}
      const btn=$('authSubmit');btn.disabled=true;
      try{
        if(authTab==='register')await this.request('/api/auth/register','POST',{username:user,password:pass,displayName:$('authName').value.trim()||user});
        const data=await this.request('/api/auth/login','POST',{username:user,password:pass});
        this.token=data.token;this.profile=data.profile;sessionStorage.setItem(TOKEN_KEY,data.token);
        $('authScreen').hidden=true;this.notice='';this.connect();await this.refreshRooms();
        if(titleScreenOpen)enterGamePage('rooms');else {page='rooms';render();}
      }catch(e){err.textContent=errorText(e);}finally{btn.disabled=false;}
    },
    async reloadCodex(){
      codexLoadStatus='loading';codexLoadMessage='';
      try{
        const module=window.WolvesCodexData;
        if(!module)throw new Error('Không tải được thành phần Bách khoa.');
        const response=await fetch('/character.json',{cache:'no-store'});
        if(!response.ok)throw new Error('Không thể tải danh mục nhân vật từ máy chủ.');
        const raw=await response.json();
        // Owner-approved effective description; immutable original catalogue is retained.
        const official=module.validateOfficialCharacters(raw).map(c=>c.id===25?{...c,desc:'Mỗi đêm bạn có thể soi hào quang (Thiện, Ác hoặc Không xác định) của một người chơi khác; không biết nhân vật cụ thể.'}:c);
        window.WolvesCodexData=module;
        ROLES.splice(0,ROLES.length,...official);
        this.characters=official;
        selected=ROLES.find(c=>c.id===selected?.id)||ROLES[0];
        codexLoadStatus='ready';codexLoadMessage='';
      }catch(error){
        ROLES.length=0;this.characters=[];selected=null;
        codexLoadStatus='error';codexLoadMessage=error.message||'Không tải được nguồn nhân vật chính thức.';
      }
      if(page==='roles')render();else{renderSidebar();updateBreadcrumb();}
      return codexLoadStatus==='ready';
    },
    async restore(){
      const logo=document.querySelector('.demo-account-box');if(logo)logo.hidden=false;
      const foot=document.querySelector('.auth-foot');if(foot)foot.textContent='Tài khoản được xác thực qua Wolvesville Backend. Chưa mở Competitive.';
      $('authPass').minLength=10;$('authPass').placeholder='Mật khẩu (tối thiểu 10 ký tự)';
      $('authUser').pattern='[a-zA-Z0-9_]{3,32}';
      try{const h=await this.request('/health');this.bbLiveQa=!!h.bbLiveQa;this.cultQa=!!h.cultQa;this.life02Qa=!!h.life02Qa;this.full50Qa=!!h.full50Qa;this.normalMode=!!h.normalGameplay&&!h.officialRuleTestMode;this.normalDecks=Array.isArray(h.normalDecks)?h.normalDecks:[];}catch{}
      await this.reloadCodex();
      if(this.token){try{this.profile=(await this.request('/api/auth/me')).profile;if($('authScreen'))$('authScreen').hidden=true;await this.refreshRooms();this.connect();
        let hint=null;try{hint=JSON.parse(sessionStorage.getItem(HINT_KEY)||'null');}catch{}
        if(hint?.roomId){try{this.room=(await this.request(`/api/rooms/${hint.roomId}`)).room;this.sendWs({type:'subscribe',roomId:hint.roomId});}catch{this.room=null;}}
        if(hint?.gameId){try{await this.loadGame(hint.gameId);}catch{this.game=null;this.gameId=null;this.persistHint();}}
      }catch{this.expire();}}
      if(this.profile){
        if($('authScreen'))$('authScreen').hidden=true;
        if(titleScreenOpen)enterGamePage(this.game?'ingame':'rooms');
        else {page=this.game?'ingame':'rooms';render();}
      } else {state.rooms=[];state.players=[];state.history=[];render();}
      this.updateConnectionBanner();
    },
    updateConnectionBanner(){
      const bar=document.getElementById('wv-connection-status');
      if(!bar)return;
      const shown=Boolean(this.profile)&&(this.connectionState!=='online');
      bar.hidden=!shown;
      if(shown){bar.textContent=this.connectionState==='connecting'?'Đang kết nối lại với làng…':'Mất kết nối trực tiếp. Trạng thái có thể đã thay đổi; hãy chờ kết nối lại.';}
    },
    async resyncAfterReconnect(){
      if(!this.token||!this.profile)return;
      try{
        await this.refreshRooms(false);
        if(this.room){try{const id=this.room.id,r=(await this.request(`/api/rooms/${id}`)).room;if(this.room?.id===id&&r.revision>=this.room.revision){this.room=r;if(r.gameId&&!this.gameId&&(page==='rooms'||page==='ingame'))await this.loadGame(r.gameId);}}catch(e){if(['NOT_MEMBER','ROOM_NOT_FOUND','HTTP_403','HTTP_404'].includes(e.code))this.room=null;else throw e;}}
        if(this.gameId){const gid=this.gameId;const game=(await this.request(`/api/games/${gid}`)).game;if(this.gameId!==gid)return;this.applyGame(game);await this.loadFeedback();if(this.gameId!==gid)return;await this.loadEvents();}
        this.lastSyncAt=Date.now();this.visualSynced=true;this.refreshUI();
      }catch(e){this.connectionState='offline';this.updateConnectionBanner();}
    },
    connect(){if(!this.token||this.ws&&(this.ws.readyState===0||this.ws.readyState===1))return;
      this.visualSynced=false;this.connectionState='connecting';this.updateConnectionBanner();
      const url=location.origin.replace(/^http/,'ws')+'/ws';const ws=new WebSocket(url);this.ws=ws;
      ws.addEventListener('open',()=>{this.attempt=0;ws.send(JSON.stringify({type:'auth',token:this.token}));});
      ws.addEventListener('message',e=>{if(this.ws!==ws)return;let m;try{m=JSON.parse(e.data);}catch{return;}this.onMessage(m);});
      ws.addEventListener('close',()=>{if(this.ws!==ws)return;this.ws=null;this.connectionState='offline';this.updateConnectionBanner();
        if(this.token){const delay=Math.min(8000,300*(2**Math.min(this.attempt++,5)));this.reconnectTimer=setTimeout(()=>this.connect(),delay);}
      });
    },
    disconnect(){this.visualSynced=false;window.WolvesVisual?.clear();clearTimeout(this.reconnectTimer);this.ws?.close();this.ws=null;this.connectionState='offline';this.updateConnectionBanner();},
    sendWs(message){if(this.ws?.readyState===1)this.ws.send(JSON.stringify(message));},
    onMessage(m){
      if(m.type==='auth.ok'){void window.WolvesWorkspace?.restorePrefs();window.WolvesWorkspace?.scheduleAlerts();this.connectionState='online';this.updateConnectionBanner();if(this.room)this.sendWs({type:'subscribe',roomId:this.room.id});if(this.gameId)this.sendWs({type:'game.subscribe',gameId:this.gameId});void this.resyncAfterReconnect();
        // Resilience fallback for a missed room WS notification: refresh only an
        // authenticated active room, compare revisions, never overwrite forms.
        if(!this.roomSyncTimer)this.roomSyncTimer=setInterval(()=>{
          if(!this.profile||!this.room||this.working||this.connectionState!=='online')return;
          const roomId=this.room.id;this.request(`/api/rooms/${roomId}`).then(({room})=>{
            if(this.room?.id===roomId&&room.revision>=this.room.revision){if(room.revision>this.room.revision||((this.normalMode||this.game?.mode==='NORMAL_GAMEPLAY')&&room.members?.some(m=>m.online!==this.room.members?.find(x=>x.id===m.id)?.online))){this.room=room;this.refreshUI();}if(room.gameId&&!this.gameId&&(page==='rooms'||page==='ingame'))void this.loadGame(room.gameId).catch(e=>this.displayError(e));}
          }).catch(()=>{});
        },2200);return;}
      if(m.type==='account.room_changed'){window.WolvesWorkspace?.scheduleAlerts();return;}
      if(m.type==='social.updated'){window.WolvesWorkspace?.scheduleAlerts();window.WolvesImmersive?.refreshNotifications();return;}
      if(m.type==='room.updated'||m.type==='room.snapshot'){window.WolvesWorkspace?.scheduleAlerts();
        if(this.room?.id===m.room?.id){
          if(!Number.isInteger(this.room.revision)||!Number.isInteger(m.room.revision)||m.room.revision>=this.room.revision){
            this.room=m.room;this.refreshUI();
          }
        }
        this.refreshRooms(false).then(()=>{if(page==='rooms'&&villagePanel?.kind==='directory')this.refreshUI();}).catch(()=>{});return;
      }
      if(m.type==='room.access_revoked'){if(this.room?.id===m.roomId){this.room=null;this.persistHint();this.notice='Bạn không còn ở trong phòng này.';}this.refreshUI();return;}
      if(m.type==='game.access_revoked'){
        if(m.gameId===this.gameId){this.game=null;this.gameId=null;this.feedback.clear();this.events=[];this.wheelNode=null;this.compositionNode=null;this.chatNode=null;this.mediumChatNode=null;this.mediumChatDraft='';this.mediumChatTarget=null;this.mediumChatRetry=null;this.mediumChatNotice='';this.lastRevision=-1;this.persistHint();this.notice='Bạn không còn quyền xem ván này.';page='rooms';render();}
        return;
      }
      if(m.type==='game.created'){window.WolvesWorkspace?.scheduleAlerts();
        if(this.room?.id===m.roomId&&(page==='rooms'||page==='ingame')){this.loadGame(m.gameId).catch(e=>this.displayError(e));}
        return;
      }
      if(m.type==='game.snapshot'||m.type==='game.state_updated'){window.WolvesWorkspace?.scheduleAlerts();
        if(this.gameId===m.game?.gameId&&this.applyGame(m.game))this.refreshUI();
        return;
      }
      if(m.type==='game.skill_feedback'){
        if(m.feedback?.gameId===this.gameId)this.acceptFeedback(m.feedback);return;
      }
      if(m.type==='game.events'){
        if(m.gameId===this.gameId&&(!Number.isInteger(m.revision)||m.revision>=this.lastRevision)){
          this.mergeEvents(m.events,m.revision);this.refreshUI();
        }return;
      }
      if(m.type==='game.action_accepted'){
        if(m.action?.gameId===this.gameId&&!this.game?.completed){this.notice='Đã nhận hành động. Kết quả sẽ có sau khi lượt được xử lý.';this.loadFeedback().catch(()=>{});this.refreshUI();}return;
      }
      if(m.type==='error')this.displayError({code:m.error?.code,message:m.error?.message});
    },
    applyGame(view){
      if(!view||!Number.isInteger(view.revision))return false;
      if(this.game?.gameId===view.gameId&&view.revision<this.lastRevision)return false;
      const changed=this.game?.gameId!==view.gameId;
      if(!changed&&view.revision===this.lastRevision&&JSON.stringify(view)===JSON.stringify(this.game))return false;
      if(changed){window.WolvesFate?.close();document.getElementById('wv2-dialog')?.remove();this.feedback.clear();this.events=[];this.eventsRevision=-1;this.lastRevision=-1;this.chatDraft='';this.chatNotice='';this.chatRetry=null;this.chatSeenCount=0;this.chatUnread=0;this.chatLastCount=0;this.actionRetry=null;this.wheelNode=null;this.compositionNode=null;this.chatNode=null;this.mediumChatNode=null;this.mediumChatDraft='';this.mediumChatTarget=null;this.mediumChatRetry=null;this.mediumChatNotice='';this.groupChatNode?.remove();this.groupChatNode=null;this.groupChatSession=null;this.groupDrafts=new Map();this.groupRead=new Map();}
      if(changed||this.game?.phase!==view.phase||this.game?.round!==view.round){this.selectedTarget=null;this.secondTarget=null;this.selectedSkill=null;this.actionRetry=null;}
      const previous=this.game;this.game=view;this.gameId=view.gameId;this.lastRevision=view.revision;
      window.WolvesVisual?.snapshot(previous,view,this.profile?.id,!!this.visualSynced&&this.connectionState==='online');
      if(view.hostProgress?.allReceived){const key=`wv4-ready:${this.profile?.id}:${view.hostProgress.phaseId}`;try{const seen=sessionStorage.getItem(key);sessionStorage.setItem(key,'1');if(!seen&&previous?.gameId===view.gameId&&previous.hostProgress?.phaseId===view.hostProgress.phaseId&&!previous.hostProgress?.allReceived&&this.visualSynced&&this.connectionState==='online')window.WolvesVisual?.cue('ready');}catch{}}

      // Seat IDs belong to the authorized projection, not the DOM paint cycle.
      // A returning client can receive DAY_VOTE_COLLECT before its first render.
      this.localSeatToId=(view.players||[]).map(p=>p.playerId);
      if(this.selectedTarget&&!this.localSeatToId.includes(this.selectedTarget))this.selectedTarget=null;
      if(this.secondTarget&&!this.localSeatToId.includes(this.secondTarget))this.secondTarget=null;
      // WV-BR-2026-1125-01: the terminal projection is authoritative by
      // itself. REST/reconnect callers may await unrelated feedback/events;
      // do not expose completed state while leaving the active board stale.
      if(view.completed){if(changed||!previous?.completed)this.notice='Ván chơi đã kết thúc. Kết quả được xác nhận bởi máy chủ.';this.refreshUI();}
      return true;
    },
    mergeEvents(events,revision){
      if(Number.isInteger(revision)&&revision<this.eventsRevision)return;
      if(Number.isInteger(revision))this.eventsRevision=revision;
      // Event ACL is immutable at commit. Merge authorized events by identity,
      // so a late HTTP response cannot erase a newer chat/result event.
      const all=new Map(this.events.map(e=>[e.eventId,e]));
      for(const e of events||[])if(typeof e?.eventType==='string'&&e.eventId)all.set(e.eventId,e);
      const previous=this.events;this.events=[...all.values()].sort((a,b)=>a.seq-b.seq);
      window.WolvesVisual?.events(this.gameId,previous,this.events,!!this.visualSynced&&this.connectionState==='online');
    },
    acceptFeedback(list){
      if(!list||list.gameId!==this.gameId||list.schemaVersion!==1)return;
      const rank={ACCEPTED:1,PENDING_RESOLUTION:1,REJECTED:2,RULE_UNRESOLVED:2,CANCELLED:3,RESOLVED:3};
      let changed=false;for(const item of list.items||[]){
        if(item.actorPlayerId!==this.profile?.id||!item.audience?.includes(this.profile.id))continue;
        const old=this.feedback.get(item.actionId);
        if(old){const before=rank[old.resolutionStatus]||0,after=rank[item.resolutionStatus]||0;if(before>after||(before===after&&(old.eventRevision??0)>(item.eventRevision??0))||JSON.stringify(old)===JSON.stringify(item))continue;}
        this.feedback.set(item.actionId,item);changed=true;
      }
      if(changed)this.refreshUI();
    },
    async loadFeedback(){if(!this.gameId||!this.profile)return;this.acceptFeedback((await this.request(`/api/games/${this.gameId}/feedback`)).feedback);},
    async loadGame(gameId){
      const view=(await this.request(`/api/games/${gameId}`)).game;
      const changed=this.gameId!==gameId;if(changed){window.WolvesFate?.close();document.getElementById('wv2-dialog')?.remove();this.feedback.clear();this.events=[];this.lastRevision=-1;}
      this.applyGame(view);this.persistHint();this.sendWs({type:'game.subscribe',gameId});
      // Publish the authorized game board before unrelated history reads finish.
      // Their failure must not erase an already accepted game snapshot.
      if(titleScreenOpen)enterGamePage('ingame');else if(page!=='ingame')go('ingame');else render();
      const results=await Promise.allSettled([this.loadFeedback(),this.loadEvents()]);
      if(this.gameId!==gameId)return;
      if(results.some(r=>r.status==='rejected'))this.notice='Chưa tải đủ nhật ký hoặc phản hồi kỹ năng; trạng thái ván đã được đồng bộ.';
      this.refreshUI();
    },
    async loadEvents(){if(!this.gameId)return;const gid=this.gameId;const data=await this.request(`/api/games/${gid}/events`);if(gid!==this.gameId)return;this.mergeEvents(data.events);this.refreshUI();},
    async refreshRooms(draw=true){
      if(!this.profile)return;
      const requestSeq=++this.roomsRequestSeq;
      const incoming=(await this.request('/api/rooms')).rooms||[];
      if(requestSeq!==this.roomsRequestSeq)return;
      const changed=JSON.stringify(this.rooms)!==JSON.stringify(incoming);
      this.rooms=incoming;
      if(draw&&(changed||!document.getElementById('villageMapTitle'))){this.refreshUI();renderSidebar();}
    },
    async refreshVisibleLobby(){
      if(!this.profile||document.hidden||page!=='rooms'||(villagePanel&&villagePanel.kind!=='directory'))return;
      try{await this.refreshRooms(true);}catch(e){this.notice=errorText(e);this.refreshUI();}
    },
    refreshUI(force=false){if(!this.profile||titleScreenOpen||document.getElementById('authScreen')?.hidden===false)return;
      // A background WebSocket resync must never replace a live creation form
      // between typing and click. Preserve its DOM, focus and submit handler.
      if(!force&&page==='rooms'&&villagePanel?.kind==='create'&&document.getElementById('wv-room-name'))return;
      if(page==='ingame'&&this.game)window.ingame();else if(page==='rooms'){if(!window.WolvesLobbyGesture?.deferRefresh())rooms();}else if(page==='profile'&&!window.WolvesImmersive)window.profile();
    },
    renderPanel(entering){
      if(!villagePanel)return '';
      const kind=villagePanel.kind;
      let title='Sảnh trực tuyến',body='';
      if(!this.profile){body='<p class="muted">Đăng nhập để xem phòng và tạo trận.</p><button class="btn-gold" onclick="showAuth(\'login\')">Đăng nhập</button>';}
      else if(kind==='create'){
        title='Mở phòng mới';body=`<form onsubmit="WolvesLive.createRoom(event)" class="village-create-form"><label for="wv-room-name">Tên phòng</label><input id="wv-room-name" class="input-field" required maxlength="72" placeholder="Lầu Chuông Đêm"><label for="wv-capacity">Sức chứa (1–100)</label><input id="wv-capacity" class="input-field" type="number" min="1" max="100" value="2" required><button class="btn-gold" type="submit">Tạo phòng</button></form><button class="btn-secondary" onclick="WolvesWorkspace.openDeck()">Bộ vai của tôi / Tùy chỉnh</button>`;
      } else if(kind==='preview-room'){
        const r=this.rooms.find(item=>item.id===this.previewRoomId);
        const alreadyMember=this.room?.id===r?.id;
        title=r?.name||'Phòng không còn khả dụng';
        if(!r) body='<p role="status" class="muted">Phòng này không còn trong danh sách. Hãy chọn phòng khác.</p><button class="btn-secondary" onclick="WolvesLive.showDirectory()">Danh sách phòng</button>';
        else {
          const status=ux.roomStatus(r.status);
          const available=r.status==='WAITING'&&r.occupied<r.capacity;
          const reason=r.status==='LOCKED'?'Phòng đã khóa, chưa thể tham gia.':r.status==='IN_GAME'?'Ván chơi đã bắt đầu.':r.occupied>=r.capacity?'Phòng đã đủ người. Hãy chọn phòng khác.':'Bạn có thể tham gia phòng này.';
          body=`<div class="village-room-preview" data-preview-room="${encode(r.id)}">
            <p class="muted">${encode(status)} · ${r.occupied}/${r.capacity} người chơi</p>
            <p role="status">${encode(alreadyMember?'Bạn đang ở trong phòng này.':reason)}</p>
            <div class="row" style="gap:10px;flex-wrap:wrap">
              <button id="wv-preview-join" class="btn-gold" type="button" ${!alreadyMember&&!available?'disabled':''} onclick="WolvesLive.openRoom('${encode(r.id)}')">${alreadyMember?'Mở phòng của tôi':'Tham gia phòng'}</button>
              <button class="btn-secondary" type="button" onclick="WolvesLive.showDirectory()">Danh sách phòng</button>
            </div></div>`;
        }
      } else if(kind==='live-room'){
        const r=this.room;title=r?.name||'Phòng đã đóng';const host=r?.hostId===this.profile.id;
        body=r&&this.normalMode?this.normalRoomPanel(r,host):r?`<p class="muted">${encode(ux.roomStatus(r.status))} · ${r.members.length}/${r.capacity} người chơi</p>
        <div class="player-chip-list">${r.members.map(m=>`<span class="player-pill">${encode(m.displayName)}${m.id===r.hostId?' 👑 Chủ phòng':''}</span>`).join('')}</div>
        <div class="row" style="margin-top:16px;flex-wrap:wrap">
         ${host&&r.status==='WAITING'?`<button class="btn-gold" onclick="WolvesLive.roomLock(true)">Khóa danh sách</button>`:''}
         ${host&&r.status==='LOCKED'?`<button class="btn-secondary" onclick="WolvesLive.roomLock(false)">Mở khóa</button>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===2?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive" ${!['knight','knight-jester'].includes(this.deckChoice)?'selected':''}>Điều tra vai</option><option value="knight" ${this.deckChoice==='knight'?'selected':''}>Kỵ Sĩ Không Đầu · Tiên Tri</option><option value="knight-jester" ${this.deckChoice==='knight-jester'?'selected':''}>Kỵ Sĩ Không Đầu · Thằng Ngố</option><option value="s13-stone" ${this.deckChoice==='s13-stone'?'selected':''}>Ná Thủ · Chấn thương</option><option value="s14-gun" ${this.deckChoice==='s14-gun'?'selected':''}>Xạ Thủ · Bắn</option><option value="s14-fire" ${this.deckChoice==='s14-fire'?'selected':''}>Pháp Sư · Cầu lửa</option><option value="s14-sword" ${this.deckChoice==='s14-sword'?'selected':''}>Thợ Rèn · Kiếm</option><option value="s14-meteor" ${this.deckChoice==='s14-meteor'?'selected':''}>Nhà Thiên Văn Học · Mưa sao băng</option><option value="s14-silence" ${this.deckChoice==='s14-silence'?'selected':''}>Phù Thủy Câm · Chat</option><option value="s15-sniper" ${this.deckChoice==='s15-sniper'?'selected':''}>Sói Bắn Tỉa · Bắn</option><option value="s14-numb" ${this.deckChoice==='s14-numb'?'selected':''}>Sói Gây Tê · Chat</option><option value="s15-deep-snow-two" ${this.deckChoice==='s15-deep-snow-two'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết</option><option value="s15-witch" ${this.deckChoice==='s15-witch'?'selected':''}>Phù Thủy · Bình độc</option><option value="s15-mystic-knight" ${this.deckChoice==='s15-mystic-knight'?'selected':''}>Kỵ Sĩ · Tiên Tri Huyền Bí</option><option value="s15-cupid-kill" ${this.deckChoice==='s15-cupid-kill'?'selected':''}>Thần Tình Yêu Hắc Ám · Một mục tiêu</option></select>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===3?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive" ${this.deckChoice==='reactive'?'selected':''}>Sói Gai Độc · Điều tra</option><option value="s15-growth-dog-thief">Kẻ Trộm Chó · Tiên Tri · Sói Ác Mộng</option><option value="s15-approved-leader" ${this.deckChoice==='s15-approved-leader'?'selected':''}>Sói Thủ Lĩnh · Hai Tiên Tri</option><option value="knight-snow" ${this.deckChoice==='knight-snow'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Tiên Tri</option><option value="knight-three" ${this.deckChoice==='knight-three'?'selected':''}>Kỵ Sĩ · Tiên Tri · Thằng Ngố</option><option value="knight-snow-jester" ${this.deckChoice==='knight-snow-jester'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Thằng Ngố</option><option value="peace" ${this.deckChoice==='peace'?'selected':''}>Sói Hòa Bình · Biểu quyết</option><option value="vote-control" ${this.deckChoice==='vote-control'?'selected':''}>Sói Lừa Gạt · Điều khiển phiếu</option><option value="judgment" ${this.deckChoice==='judgment'?'selected':''}>Thẩm Phán Linh Hồn · Cân Phán Quyết</option><option value="judgment-thorn" ${this.deckChoice==='judgment-thorn'?'selected':''}>Thẩm Phán · Sói Gai Độc</option><option value="nightmare" ${this.deckChoice==='nightmare'?'selected':''}>Sói Ác Mộng · Điều tra</option><option value="nightmare-judgment" ${this.deckChoice==='nightmare-judgment'?'selected':''}>Sói Ác Mộng · Cân Phán Quyết</option><option value="s13-maintenance" ${this.deckChoice==='s13-maintenance'?'selected':''}>Thợ Rèn Cơ Khí · Bảo trì</option><option value="s13-antidote" ${this.deckChoice==='s13-antidote'?'selected':''}>Phù Thủy Cấm Kỵ · Thuốc giải</option><option value="s13-poison" ${this.deckChoice==='s13-poison'?'selected':''}>Phù Thủy Cấm Kỵ · Độc trì hoãn</option><option value="s13-prison" ${this.deckChoice==='s13-prison'?'selected':''}>Quản Ngục · Giam giữ</option><option value="s13-guard" ${this.deckChoice==='s13-guard'?'selected':''}>Người Gác Đêm · Bảo vệ</option><option value="s13-smith" ${this.deckChoice==='s13-smith'?'selected':''}>Thợ Rèn · Khiên</option><option value="s13-judgment" ${this.deckChoice==='s13-judgment'?'selected':''}>Nữ Tu Huyết Thệ · Phán xét</option><option value="s14-dog" ${this.deckChoice==='s14-dog'?'selected':''}>Chó Canh Gác · Chống sát thủ</option><option value="s14-soul" ${this.deckChoice==='s14-soul'?'selected':''}>Xạ Thủ Linh Hồn · Khiên</option><option value="s14-fire-shield" ${this.deckChoice==='s14-fire-shield'?'selected':''}>Pháp Sư · Khiên và cầu lửa</option><option value="s14-gun-shield" ${this.deckChoice==='s14-gun-shield'?'selected':''}>Xạ Thủ · Khiên và đạn</option><option value="s14-meteor-shield" ${this.deckChoice==='s14-meteor-shield'?'selected':''}>Mưa sao băng · Khiên</option><option value="s14-judgment" ${this.deckChoice==='s14-judgment'?'selected':''}>Nữ Tu · Phán xét Dân</option><option value="s15-sniper-shield" ${this.deckChoice==='s15-sniper-shield'?'selected':''}>Sói Bắn Tỉa · Khiên linh hồn</option><option value="s15-mage-shield" ${this.deckChoice==='s15-mage-shield'?'selected':''}>Pháp Sư · Khiên hộ vệ</option><option value="s15-violin-knight" ${this.deckChoice==='s15-violin-knight'?'selected':''}>Nghệ Sĩ Vĩ Cầm · Khác phe</option><option value="s15-violin-gun" ${this.deckChoice==='s15-violin-gun'?'selected':''}>Nghệ Sĩ Vĩ Cầm · Cùng phe</option><option value="s15-knight-mystic-jester" ${this.deckChoice==='s15-knight-mystic-jester'?'selected':''}>Kỵ Sĩ · Thằng Ngố · Tiên Tri Huyền Bí</option><option value="s15-knight-dual-seer" ${this.deckChoice==='s15-knight-dual-seer'?'selected':''}>Kỵ Sĩ · Hai Tiên Tri</option><option value="s15-aura-curse" ${this.deckChoice==='s15-aura-curse'?'selected':''}>Sói Pháp Sư · Yểm hào quang</option><option value="s15-aura-illusion" ${this.deckChoice==='s15-aura-illusion'?'selected':''}>Sói Ảo Ảnh · Nhiễu hào quang</option><option value="s15-reveal" ${this.deckChoice==='s15-reveal'?'selected':''}>Người Canh Gác · Công khai vai</option><option value="s15-sedative" ${this.deckChoice==='s15-sedative'?'selected':''}>Dược Sĩ · Thuốc mê và biểu quyết</option><option value="s15-guard-watch" ${this.deckChoice==='s15-guard-watch'?'selected':''}>Người Gác Đêm · Quan sát phòng vệ</option><option value="s14-young" ${this.deckChoice==='s14-young'?'selected':''}>Sói Trẻ · Chết theo</option><option value="s14-hunter" ${this.deckChoice==='s14-hunter'?'selected':''}>Thợ Săn · Chết theo</option><option value="s15-final-hunter-jester" ${this.deckChoice==='s15-final-hunter-jester'?'selected':''}>Thợ Săn · Kỵ Sĩ · Thằng Ngố</option><option value="s15-final-hunter-seer" ${this.deckChoice==='s15-final-hunter-seer'?'selected':''}>Thợ Săn · Tiên Tri · Thằng Ngố</option><option value="s15-break-swap" ${this.deckChoice==='s15-break-swap'?'selected':''}>Ảo Thuật Gia · Tiên Tri · Thằng Ngố</option><option value="s15-break-contract" ${this.deckChoice==='s15-break-contract'?'selected':''}>Kẻ Mặc Cả Bóng Tối · Tiên Tri · Thằng Ngố</option><option value="s15-break-stone-jester" ${this.deckChoice==='s15-break-stone-jester'?'selected':''}>Sói Thạch · Tiên Tri · Thằng Ngố</option><option value="s15-break-stone-knight" ${this.deckChoice==='s15-break-stone-knight'?'selected':''}>Sói Thạch · Kỵ Sĩ · Tiên Tri</option><option value="s15-deep-jester-peace" ${this.deckChoice==='s15-deep-jester-peace'?'selected':''}>Thằng Ngố · Sói Hòa Bình · Tiên Tri</option><option value="s15-break-pair-jester" ${this.deckChoice==='s15-break-pair-jester'?'selected':''}>Thần Tình Yêu Hắc Ám · Tiên Tri · Thằng Ngố</option><option value="s15-deep-pair" ${this.deckChoice==='s15-deep-pair'?'selected':''}>Thần Tình Yêu Hắc Ám · Hai Tiên Tri</option><option value="s15-deep-demon" ${this.deckChoice==='s15-deep-demon'?'selected':''}>Thám Tử Ác Ma · Tiên Tri · Thằng Ngố</option><option value="s15-deep-flag" ${this.deckChoice==='s15-deep-flag'?'selected':''}>Kỵ Sĩ · Tiên Tri · Người Gắn Cờ</option><option value="s15-deep-hypnosis" ${this.deckChoice==='s15-deep-hypnosis'?'selected':''}>Kỵ Sĩ · Tiên Tri · Thầy Thôi Miên</option><option value="s15-deep-rescue" ${this.deckChoice==='s15-deep-rescue'?'selected':''}>Kỵ Sĩ · Tiên Tri · Phù Thủy (cứu)</option><option value="s15-witch-shield" ${this.deckChoice==='s15-witch-shield'?'selected':''}>Phù Thủy · Khiên thợ rèn</option><option value="s15-exile" ${this.deckChoice==='s15-exile'?'selected':''}>Sói Lưu Đày · Kẻ Giải Nguyền · Tiên Tri</option><option value="s15-snow-mystic" ${this.deckChoice==='s15-snow-mystic'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Tiên Tri Huyền Bí</option><option value="s15-demon" ${this.deckChoice==='s15-demon'?'selected':''}>Thám Tử Ác Ma · Hai Tiên Tri</option><option value="s15-portrait" ${this.deckChoice==='s15-portrait'?'selected':''}>Sát Nhân Ảnh Thuật · Hào quang</option><option value="s15-trap" ${this.deckChoice==='s15-trap'?'selected':''}>Thợ Săn Quái Thú · Phản sát</option><option value="s15-deep-medium">Kỵ Sĩ · Tiên Tri · Thầy Đồng</option><option value="s15-break-medium-mystic">Kỵ Sĩ · Tiên Tri Huyền Bí · Thầy Đồng</option></select>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===4?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive">Kỵ Sĩ · Thiên Sứ Tuyết · Tiên Tri · Thằng Ngố</option>${this.cultQa?'<option value="s27-cult">QA candidate — Giáo Chủ · Hai Tiên Tri · Phù Thủy Câm</option>':''}${this.bbLiveQa?'<option value="bb-live-trap">QA B/B — Bẫy nhiều đêm</option><option value="bb-live-witch">QA B/B — Bẫy và hai bình Phù Thủy</option><option value="bb-live-revival">QA B/B — Bẫy và hồi sinh Thầy Đồng</option><option value="bb-live-retaliation">QA B/B — Sói đơn độc và bẫy phản sát</option><option value="bb-live-conversion">QA B/B — Sói Lưu Đày chuyển phe</option>':''}<option value="s17-soul-lifecycle" ${this.deckChoice==='s17-soul-lifecycle'?'selected':''}>QA #23 — Kỵ Sĩ · Xạ Thủ Linh Hồn · Tiên Tri · Pháp Sư</option><option value="s22-jester-revival" ${this.deckChoice==='s22-jester-revival'?'selected':''}>QA — Thầy Đồng · Thằng Ngố · Kỵ Sĩ · Tiên Tri</option><option value="s22-dual-swap" ${this.deckChoice==='s22-dual-swap'?'selected':''}>QA — Ảo Thuật Gia · Hai Tiên Tri · Thằng Ngố</option><option value="s15-deep-engineer">Sói Kỹ Sư · Tiên Tri · Tiên Tri Huyền Bí · Thẩm Phán Linh Hồn</option><option value="s15-play-guard" ${this.deckChoice==='s15-play-guard'?'selected':''}>Sói Thủ Lĩnh · Bảo Vệ · Hai Tiên Tri</option><option value="s15-scale-leader-snow" ${this.deckChoice==='s15-scale-leader-snow'?'selected':''}>Sói Thủ Lĩnh · Thiên Sứ Tuyết · Hai Tiên Tri</option><option value="s15-scale-bell" ${this.deckChoice==='s15-scale-bell'?'selected':''}>Người Rung Chuông · Sói Thủ Lĩnh · Hai Tiên Tri</option><option value="s15-final-pack" ${this.deckChoice==='s15-final-pack'?'selected':''}>Sói Lưu Đày · Kẻ Giải Nguyền · Tiên Tri Huyền Bí · Phù Thủy Câm</option><option value="s15-approved-revenge" ${this.deckChoice==='s15-approved-revenge'?'selected':''}>Sói Lừa Gạt · Thằng Ngố · Hai Tiên Tri</option><option value="s15-final-revenge" ${this.deckChoice==='s15-final-revenge'?'selected':''}>Sói Lừa Gạt · Hai Tiên Tri · Phù Thủy Câm</option><option value="s15-closure-hunter-snow" ${this.deckChoice==='s15-closure-hunter-snow'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Thằng Ngố · Thợ Săn</option><option value="s15-closure-revenge-hunter" ${this.deckChoice==='s15-closure-revenge-hunter'?'selected':''}>Sói Lừa Gạt · Hai Tiên Tri · Thợ Săn</option><option value="s15-final-hunter-four" ${this.deckChoice==='s15-final-hunter-four'?'selected':''}>Thợ Săn · Kỵ Sĩ · Tiên Tri · Thằng Ngố</option><option value="s15-break-exile" ${this.deckChoice==='s15-break-exile'?'selected':''}>Kỵ Sĩ · Tiên Tri · Sói Lưu Đày · Kẻ Giải Nguyền</option><option value="s15-break-stone-four" ${this.deckChoice==='s15-break-stone-four'?'selected':''}>Kỵ Sĩ · Tiên Tri · Thằng Ngố · Sói Thạch</option><option value="s15-wolf-seer" ${this.deckChoice==='s15-wolf-seer'?'selected':''}>Sói Tiên Tri · Sói Ảo Ảnh · Hai Tiên Tri</option><option value="s15-deep-flag-four" ${this.deckChoice==='s15-deep-flag-four'?'selected':''}>Kỵ Sĩ · Hai Tiên Tri · Người Gắn Cờ</option><option value="s15-four-jester" ${this.deckChoice==='s15-four-jester'?'selected':''}>Kỵ Sĩ · Hai Tiên Tri · Thằng Ngố</option><option value="s15-four-snow" ${this.deckChoice==='s15-four-snow'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Hai Tiên Tri</option><option value="s15-four-snow-jester" ${this.deckChoice==='s15-four-snow-jester'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Thằng Ngố · Tiên Tri Huyền Bí</option></select>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===5?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive">Điều tra và phòng vệ</option>${this.cultQa?'<option value="s27-cult-jester">QA candidate — Giáo phái và Thằng Ngố</option>':''}${this.life02Qa?'<option value="rc01-life02">QA RC-01 — Chuông, Cupid và Hạt giống</option>':''}${this.bbLiveQa?'<option value="bb-live-pack">QA B/B — Hai Sói và Thiên Sứ Tuyết</option><option value="bb-live-guard">QA B/B — Bẫy và Bảo Vệ</option>':''}<option value="s15-scale-leader-rescue" ${this.deckChoice==='s15-scale-leader-rescue'?'selected':''}>Sói Thủ Lĩnh · Thiên Sứ Tuyết · Hai Tiên Tri · Dược Sĩ</option><option value="s15-final-pack-rescue" ${this.deckChoice==='s15-final-pack-rescue'?'selected':''}>Sói Lưu Đày · Kẻ Giải Nguyền · Tiên Tri Huyền Bí · Phù Thủy Câm · Dược Sĩ</option><option value="s15-deep-five" ${this.deckChoice==='s15-deep-five'?'selected':''}>Kỵ Sĩ · Thiên Sứ Tuyết · Hai Tiên Tri · Thằng Ngố</option></select>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===6&&(this.bbLiveQa||this.full50Qa)?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive">Chọn bộ vai</option>${this.bbLiveQa?'<option value="bb-live-mixed">QA B/B — Bầy Sói sau chuyển phe</option>':''}${this.full50Qa?'<option value="full50-life02-witch">QA FULL-50 — Chuông, Cupid, Hạt giống và Phù Thủy</option>':''}</select>`:''}
         ${host&&r.status==='LOCKED'&&r.members.length===7&&this.full50Qa&&this.life02Qa?`<label for="wv-test-deck">Bộ nhân vật thử nghiệm</label><select class="input-field" id="wv-test-deck" onchange="WolvesLive.deckChoice=this.value"><option value="reactive">Chọn bộ vai</option><option value="full50-life02-guard">QA FULL-50 — Chuông, Cupid, Hạt giống, Phù Thủy và Bảo Vệ</option></select>`:''}
         ${host&&r.status==='LOCKED'&&this.full50Qa&&this.life02Qa&&r.members.length>=3&&r.members.length<=7?`<label for="wv-life-module-ids">QA cơ chế dùng chung — nhập ID vai</label><input class="input-field" id="wv-life-module-ids" value="${encode(this.lifeModuleSelection||'')}" placeholder="Ví dụ: 8,25,31,64" onchange="WolvesLive.lifeModuleSelection=this.value"><button class="btn-secondary" id="wv-life-module-start" onclick="WolvesLive.startLifeModules()">Thử đội hình theo module</button><p class="muted">Hỗ trợ #8, #9, #25, #27, #29, #31, #51, #64, #74, #97; cần #8, đủ người, không trùng ID. Chỉ QA nội bộ.</p>`:''}
         ${host&&r.status==='LOCKED'?`<button class="btn-gold" ${([2,3,4,5].includes(r.members.length)||r.members.length===6&&(this.bbLiveQa||this.full50Qa)||r.members.length===7&&this.full50Qa&&this.life02Qa)?'':'disabled title="Ván thử hỗ trợ cấu hình 2, 3, 4 hoặc 5 người"'} onclick="WolvesLive.startGame()">Bắt đầu lượt chơi thử</button>`:''}
         ${!this.gameId&&r.status!=='IN_GAME'?`<button class="btn-secondary" onclick="WolvesLive.leaveRoom()">Rời phòng</button>`:''}
         ${this.gameId?`<button class="btn-gold" onclick="go('ingame')">Trở lại ván chơi</button>`:''}
        </div><p class="muted">Chế độ thử nghiệm hỗ trợ 2, 3, 4 hoặc 5 người theo bộ vai đã kiểm chứng. Chưa tính điểm cạnh tranh; kết quả trận chỉ áp dụng cho các bộ vai đã có luật xác minh.</p>`:'';
      } else {
        title=kind==='archive'?'Biên niên sử':'Danh sách phòng';
        body=kind==='archive'?'<p class="muted">Lịch sử thắng thua sẽ xuất hiện khi chế độ trận đấu đầy đủ được mở. Hiện bạn có thể xem thông báo trong ván thử nghiệm của mình.</p>':
         `<div class="room-cards-list" id="wv-live-room-list">${this.rooms.map(r=>{const available=r.status==='WAITING'&&r.occupied<r.capacity||this.room?.id===r.id;
           return `<button class="room-item-card village-room-link" onclick="WolvesLive.previewRoom('${encode(r.id)}')"><span class="room-item-top"><span class="room-status">${encode(ux.roomStatus(r.status))}</span></span><strong>${encode(r.name)}</strong><span class="muted">${r.occupied}/${r.capacity} người · ${available?'Có thể vào':'Chưa thể tham gia'}</span></button>`;}).join('')||'<p class="muted">Chưa có phòng trên server.</p>'}</div><button class="btn-gold" onclick="openVillagePanel('create','well')">Tạo phòng mới</button><button class="btn-secondary" onclick="WolvesLive.refreshRooms()">Làm mới</button>`;
      }
      return `<div class="village-scrim" onclick="if(event.target===this)closeVillagePanel()"><section id="villageDrawer" class="village-drawer${entering?' entering':''}" role="dialog" aria-modal="true" aria-labelledby="villagePanelTitle" onkeydown="keepVillagePanelFocus(event)"><header class="village-drawer-header"><h2 id="villagePanelTitle" tabindex="-1">${encode(title)}</h2><button class="btn-secondary" onclick="closeVillagePanel()">✕</button></header><div id="villageDrawerBody" class="village-drawer-body">${this.notice?`<p role="alert" class="muted">${encode(this.notice)}</p>`:''}${body}</div></section></div>`;
    },
    async createRoom(e){e.preventDefault();if(this.working)return;
      const name=$('wv-room-name')?.value.trim(),capacity=Number($('wv-capacity')?.value);
      if(!name||!Number.isInteger(capacity)||capacity<1||capacity>100){this.displayError({code:'INVALID_ROOM_INPUT'});return;}
      this.working=true;const submit=e.submitter;if(submit)submit.disabled=true;
      try{const data=await this.request('/api/rooms','POST',{name,capacity});this.room=data.room;this.persistHint();await this.refreshRooms(false);this.sendWs({type:'subscribe',roomId:this.room.id});this.notice='Phòng đã được tạo. Mời bạn bè cùng tham gia.';openVillagePanel('live-room','well');}
      catch(ex){this.displayError(ex);}finally{this.working=false;if(submit)submit.disabled=false;}
    },
    async previewRoom(id){
      if(!this.profile)return;
      // Preview only; never mutates Room Membership. Current list may be stale;
      // refresh from the authorized server directory before displaying status.
      this.previewRoomId=id;
      this.notice='';
      const prior=JSON.stringify(this.rooms.find(r=>r.id===id)??null);
      openVillagePanel('preview-room',`room-${id}`);
      try {
        await this.refreshRooms(false);
        // Avoid replacing an unchanged modal DOM while the user taps/focuses a
        // room button; this detached computed-style/hitbox during a pending fetch.
        const latest=JSON.stringify(this.rooms.find(r=>r.id===id)??null);
        if(this.previewRoomId===id&&villagePanel?.kind==='preview-room' &&
           (prior!==latest || !document.getElementById('wv-preview-join')))this.refreshUI();
      } catch(e){this.displayError(e);} 
    },
    showDirectory(){this.previewRoomId=null;openVillagePanel('directory','directory');},
    async openRoom(id){
      if(this.working)return;
      this.working=true;
      const submit=$('wv-preview-join');if(submit){submit.disabled=true;submit.setAttribute('aria-busy','true');}
      try{
        let r;
        try{r=(await this.request(`/api/rooms/${id}`)).room;}
        catch(e){if(e.code!=='NOT_MEMBER')throw e;r=(await this.request(`/api/rooms/${id}/join`,'POST',{})).room;}
        this.room=r;this.previewRoomId=null;this.persistHint();this.sendWs({type:'subscribe',roomId:id});this.notice='';
        await this.refreshRooms(false);openVillagePanel('live-room','directory');
      }catch(e){this.displayError(e);await this.refreshRooms(false).catch(()=>{});if(villagePanel?.kind==='preview-room')this.refreshUI();}
      finally{this.working=false;if(submit?.isConnected){submit.removeAttribute('aria-busy');submit.disabled=false;}}
    },
    normalRoomPanel(r,host){const own=r.members.find(m=>m.id===this.profile.id),decks=this.normalDecks.filter(d=>d.characterIds.length===r.members.length),chosen=decks.find(d=>d.key===r.normalDeck),ready=r.members.every(m=>m.ready),online=r.members.every(m=>m.online),supported=decks.length>0;
      const deckLabel=d=>(d.developmentScope?'Bộ vai thử nghiệm (không tính thành tích) — ':'')+d.characterIds.map(id=>this.characters.find(c=>c.id===id)?.name||'Nhân vật').join(' · ');
      const reason=r.status==='WAITING'?'Chủ phòng cần khóa danh sách.':!supported?'Chưa có bộ vai chơi thường cho số người hiện tại.':!chosen?'Chủ phòng cần chọn bộ vai.':!ready?'Đang chờ mọi người xác nhận sẵn sàng.':!online?'Đang chờ tất cả người chơi kết nối.':this.working?'Đang xử lý yêu cầu…':'Đủ điều kiện bắt đầu.';
      return `<div class="wv2-lobby-progress"><span class="${r.members.length===r.capacity?'done':''}">1 · Thành viên ${r.members.length}/${r.capacity}</span><span class="${r.status==='LOCKED'?'done':''}">2 · Khóa danh sách</span><span class="${chosen?'done':''}">3 · Bộ vai</span><span class="${ready?'done':''}">4 · Ready ${r.members.filter(m=>m.ready).length}/${r.members.length}</span></div>${r.members.length===r.capacity&&r.status==='WAITING'?'<p class="wv2-lobby-banner">Phòng đã đủ người. Chủ phòng khóa danh sách để chọn bộ vai và xác nhận sẵn sàng.</p>':''}<p class="muted">${encode(ux.roomStatus(r.status))} · ${r.members.length}/${r.capacity} người chơi · Chơi thường</p><div class="player-chip-list">${r.members.map(m=>`<span class="player-pill">${encode(m.displayName)}${m.id===r.hostId?' 👑':''} · ${m.ready?'Sẵn sàng':'Chưa sẵn sàng'} · ${m.online?'Trực tuyến':'Mất kết nối'}</span>`).join('')}</div>
      <div class="row" style="flex-wrap:wrap;margin-top:16px">${host&&r.status==='WAITING'?'<button class="btn-gold" onclick="WolvesLive.roomLock(true)">Khóa danh sách</button>':''}${host&&r.status==='LOCKED'?'<button class="btn-secondary" onclick="WolvesLive.roomLock(false)">Mở khóa</button>':''}</div>
      ${host&&r.status!=='IN_GAME'?'<button class="btn-secondary" onclick="WolvesWorkspace.openDeck()">✦ Tùy chỉnh bộ vai / Bộ vai của tôi</button>':''}${r.status==='LOCKED'&&supported?`<p>${chosen?encode(deckLabel(chosen)):'Chờ chủ phòng chọn bộ vai'}</p>${host?`<label for="wv-normal-deck">Bộ nhân vật</label><select id="wv-normal-deck" class="input-field" ${this.working?'disabled':''} onchange="WolvesLive.configureNormal(this.value)"><option value="" disabled ${!chosen?'selected':''}>Chọn bộ vai</option>${decks.map(d=>`<option value="${encode(d.key)}" ${chosen?.key===d.key?'selected':''}>${encode(deckLabel(d))}</option>`).join('')}</select>`:''}${chosen?`<button class="btn-secondary" id="wv-ready" ${this.working?'disabled':''} onclick="WolvesLive.readyNormal(${!own?.ready})">${own?.ready?'Hủy sẵn sàng':'Sẵn sàng'}</button>`:''}${host?`<button class="btn-gold" id="wv-normal-start" aria-describedby="wv-start-reason" ${!chosen||!ready||!online||this.working?'disabled':''} onclick="WolvesLive.startGame()">Bắt đầu trận</button>`:''}`:''}
      ${r.status!=='IN_GAME'?`<p class="muted" id="wv-start-reason" role="status" aria-live="polite">${encode(reason)}</p><button class="btn-secondary" onclick="WolvesLive.leaveRoom()">Rời phòng</button>`:`<button class="btn-gold" onclick="go('ingame')">Trở lại ván chơi</button>`}<p class="muted">Chơi thường chỉ mở các bộ vai có trong danh sách máy chủ. Không có xếp hạng.</p>`;},
    async claimCoordinator(){if(!this.gameId||!this.room||this.working)return;this.working=true;try{const latest=(await this.request(`/api/rooms/${this.room.id}`)).room;await this.request(`/api/games/${this.gameId}/claim-coordinator`,'POST',{expectedRoomRevision:latest.revision});this.room=(await this.request(`/api/rooms/${this.room.id}`)).room;this.notice='Bạn đã tiếp nhận quyền điều phối.';await this.loadGame(this.gameId);}catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async configureNormal(deck){if(!this.room||this.working||!deck)return;this.working=true;try{this.room=(await this.request(`/api/rooms/${this.room.id}/configure`,'POST',{deck})).room;this.notice='Bộ vai đã khóa; mọi người cần xác nhận lại.';}catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async readyNormal(ready){if(!this.room||this.working)return;this.working=true;try{this.room=(await this.request(`/api/rooms/${this.room.id}/ready`,'POST',{ready,expectedRevision:this.room.revision})).room;this.notice=ready?'Đã sẵn sàng.':'Đã hủy sẵn sàng.';}catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async roomLock(locked){try{this.room=(await this.request(`/api/rooms/${this.room.id}/${locked?'lock':'unlock'}`,'POST',{})).room;this.notice=locked?'Danh sách đã khóa.':'Phòng đã mở để đón thêm người chơi.';openVillagePanel('live-room','directory');}catch(e){this.displayError(e);}},
    async leaveRoom(){try{await this.request(`/api/rooms/${this.room.id}/leave`,'POST',{});this.sendWs({type:'unsubscribe',roomId:this.room.id});this.room=null;this.game=null;this.gameId=null;this.persistHint();await this.refreshRooms(false);openVillagePanel('directory','directory');}catch(e){this.displayError(e);}},
    async startLifeModules(){if(!this.room||this.working||!this.full50Qa||!this.life02Qa||this.normalMode)return;this.working=true;try{const raw=document.getElementById('wv-life-module-ids')?.value??this.lifeModuleSelection;this.lifeModuleSelection=raw;const characterIds=raw.split(',').map(x=>Number(x.trim()));if(characterIds.length!==this.room.members.length||characterIds.some(x=>!Number.isInteger(x)))throw new Error('Nhập đúng số ID nhân vật, phân cách bằng dấu phẩy.');const id=this.room.id,key=this.startKeys.get(id)||`wv-${crypto.randomUUID()}`;this.startKeys.set(id,key);const data=await this.request(`/api/rooms/${id}/games/start`,'POST',{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds,life02Composition:true,idempotencyKey:key});await this.loadGame(data.game.gameId);}catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async startGame(){if(!this.room||this.working)return;this.working=true;try{
      const id=this.room.id, key=this.startKeys.get(id)||`wv-${crypto.randomUUID()}`;this.startKeys.set(id,key);
      if(this.normalMode){const characterIds=this.normalDecks.find(d=>d.key===this.room.normalDeck&&d.characterIds.length===this.room.members.length)?.characterIds;if(!characterIds)throw new Error('Chọn bộ vai trước khi bắt đầu.');const data=await this.request(`/api/rooms/${id}/games/start`,'POST',{mode:'NORMAL_GAMEPLAY',rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds,idempotencyKey:key});await this.loadGame(data.game.gameId);return;}
      const decks={2:[25,74],3:[20,25,74],5:[9,25,31,34,74]};
      let characterIds=this.full50Qa&&this.life02Qa&&this.room.members.length===7&&this.deckChoice==='full50-life02-guard'?[8,25,27,29,31,64,97]:this.full50Qa&&this.room.members.length===6&&this.deckChoice==='full50-life02-witch'?[8,25,27,29,64,97]:this.life02Qa&&this.room.members.length===5&&this.deckChoice==='rc01-life02'?[8,25,27,64,97]:this.cultQa&&this.room.members.length===4&&this.deckChoice==='s27-cult'?[25,74,84,90]:this.cultQa&&this.room.members.length===5&&this.deckChoice==='s27-cult-jester'?[25,28,74,84,90]:this.room.members.length===2&&this.deckChoice==='knight'?[8,25]:this.room.members.length===2&&this.deckChoice==='knight-jester'?[8,28]:this.room.members.length===3&&this.deckChoice==='knight-snow'?[8,9,25]:this.room.members.length===3&&this.deckChoice==='knight-three'?[8,25,28]:this.room.members.length===3&&this.deckChoice==='knight-snow-jester'?[8,9,28]:this.room.members.length===4?[8,9,25,28]:this.room.members.length===3&&this.deckChoice==='peace'?[25,74,79]:this.room.members.length===3&&this.deckChoice==='vote-control'?[25,33,74]:this.room.members.length===3&&this.deckChoice==='judgment'?[5,25,74]:this.room.members.length===3&&this.deckChoice==='judgment-thorn'?[5,20,25]:this.room.members.length===3&&this.deckChoice==='nightmare'?[25,74,76]:this.room.members.length===3&&this.deckChoice==='nightmare-judgment'?[5,25,76]:decks[this.room.members.length];const s13Decks={'s22-jester-revival':[8,25,26,28],'s22-dual-swap':[25,28,37,74],'s15-growth-dog-thief':[25,39,76],'s15-play-guard':[25,31,48,74],'s15-scale-leader-snow':[9,25,48,74],'s15-scale-leader-rescue':[9,25,48,74,87],'s15-scale-bell':[25,48,64,74],'s15-approved-leader':[25,48,74],'s15-approved-revenge':[25,28,33,74],'s15-closure-hunter-snow':[8,9,28,88],'s15-closure-revenge-hunter':[25,33,74,88],'s15-final-pack':[74,84,93,94],'s15-final-pack-rescue':[74,84,87,93,94],'s15-final-revenge':[25,33,74,84],'s15-final-hunter-jester':[8,28,88],'s15-final-hunter-seer':[25,28,88],'s15-final-hunter-four':[8,25,28,88],'s15-break-swap':[25,28,37],'s15-break-contract':[19,25,28],'s15-break-stone-jester':[25,28,55],'s15-break-stone-knight':[8,25,55],'s15-break-stone-four':[8,25,28,55],'s15-break-exile':[8,25,93,94],'s15-deep-snow-two':[8,9],'s15-deep-five':[8,9,25,28,74],'s15-deep-jester-peace':[25,28,79],'s15-deep-pair':[15,25,74],'s15-break-pair-jester':[15,25,28],'s15-deep-demon':[25,28,58],'s15-deep-flag':[8,25,63],'s15-deep-flag-four':[8,25,63,74],'s15-deep-hypnosis':[8,25,85],'s15-deep-rescue':[8,25,29],'s15-witch':[25,29],'s15-cupid-kill':[15,25],'s15-demon':[25,58,74],'s15-portrait':[25,71,84],'s15-trap':[8,25,77],'s15-witch-shield':[25,29,67],'s15-mystic-knight':[8,74],'s15-exile':[25,93,94],'s15-wolf-seer':[3,25,49,74],'s15-snow-mystic':[8,9,74],'s15-four-jester':[8,25,28,74],'s15-four-snow':[8,9,25,74],'s15-four-snow-jester':[8,9,28,74],'s15-knight-mystic-jester':[8,28,74],'s15-knight-dual-seer':[8,25,74],'s15-aura-curse':[25,72,84],'s15-aura-illusion':[25,49,84],'s15-violin-knight':[8,25,80],'s15-violin-gun':[25,32,80],'s15-reveal':[25,54,74],'s15-sedative':[25,74,87],'s15-sniper':[25,43],'s15-sniper-shield':[23,25,43],'s15-mage-shield':[8,25,36],'s15-guard-watch':[25,66,67],'s13-maintenance':[11,25,76],'s13-antidote':[8,16,25],'s13-poison':[16,25,76],
       's13-prison':[8,24,25],'s13-guard':[8,25,66],'s13-smith':[8,25,67],
       's13-stone':[25,59],'s13-judgment':[17,25,76],'s14-gun':[25,32],'s14-fire':[25,36],'s14-sword':[25,67],'s14-meteor':[25,78],'s14-silence':[25,84],'s14-numb':[25,50],'s14-dog':[8,25,52],'s14-soul':[8,23,25],'s14-fire-shield':[23,25,36],'s14-gun-shield':[23,25,32],'s14-meteor-shield':[23,25,78],'s14-judgment':[17,25,74],'s14-young':[8,25,68],'s14-hunter':[8,25,88]};
      if(Object.hasOwn(s13Decks,this.deckChoice))characterIds=s13Decks[this.deckChoice];
      if(this.room.members.length===4&&this.deckChoice==='s17-soul-lifecycle')characterIds=[8,23,25,36];
      if(this.room.members.length===3&&this.deckChoice==='s15-deep-medium')characterIds=[8,25,26];
      if(this.room.members.length===3&&this.deckChoice==='s15-break-medium-mystic')characterIds=[8,26,74];
      if(this.room.members.length===4&&this.deckChoice==='s15-deep-engineer')characterIds=[5,10,25,74];
      const qaProfile=this.bbLiveQa?(['bb-live-trap','bb-live-guard','bb-live-witch','bb-live-revival'].includes(this.deckChoice)?'owner-bb-live-trap-qa-v1':['bb-live-pack','bb-live-retaliation','bb-live-conversion','bb-live-mixed'].includes(this.deckChoice)?'owner-bb-live-pack-qa-v1':undefined):undefined;
      if(qaProfile==='owner-bb-live-trap-qa-v1')characterIds=this.deckChoice==='bb-live-guard'?[5,10,25,31,74]:this.deckChoice==='bb-live-witch'?[8,10,25,29]:this.deckChoice==='bb-live-revival'?[8,10,25,26]:[5,10,25,74];if(qaProfile==='owner-bb-live-pack-qa-v1')characterIds=this.deckChoice==='bb-live-mixed'?[48,74,77,84,93,94]:this.deckChoice==='bb-live-conversion'?[74,84,93,94]:this.deckChoice==='bb-live-retaliation'?[25,48,74,77]:[9,25,48,74,76];
      if(!characterIds||characterIds.length!==this.room.members.length)throw new Error('Số người chưa phù hợp với bộ vai chơi thử.');
      const data=await this.request(`/api/rooms/${id}/games/start`,'POST',{rulePack:'OFFICIAL_ROLE_INSPECTION_V1',characterIds,idempotencyKey:key,...(qaProfile?{qaProfile}:{})});
      await this.loadGame(data.game.gameId);
    }catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    renderGame(){
      const priorStage=$('content')?.querySelector('.ingame-stage-wrap');const scroll=priorStage?.scrollTop||0;const active=document.activeElement;const focusId=active?.id;const focusInStage=priorStage?.contains(active);const caret=focusInStage&&active?.tagName==='INPUT'?[active.selectionStart,active.selectionEnd]:null;
      if(!this.game){$('content').innerHTML='<section class="section"><h2>Chưa có trận trên server</h2><p class="muted">Tham gia một phòng và bắt đầu ván thử nghiệm chính thức.</p><button class="btn-gold" onclick="go(\'rooms\')">Đến Sảnh</button></section>';return;}
      const players=this.game.players||[],room=this.room||{name:'Trận Wolvesville',id:this.game.roomId,members:[]};
      const me=players.find(p=>p.playerId===this.profile.id)?.self;
      const availableSkills=(this.game.capabilities||[]).filter(s=>s.available);
      const availableSkill=availableSkills.find(s=>s.skillId===this.selectedSkill)||availableSkills[0];
      if(!me){$('content').textContent='Không có quyền xem phiên này';return;}
      const saved={rooms:state.rooms,players:state.players,activeRoom:state.activeRoom};
      const fakeRoomId=7001;this.localSeatToId=players.map(p=>p.playerId);
      const virtPlayers=players.map((p,i)=>({id:11000+i,name:room.members?.find(m=>m.id===p.playerId)?.displayName||`Người chơi ${i+1}`}));
      const virtRoom={id:fakeRoomId,name:room.name,size:players.length,playerIds:virtPlayers.map(p=>p.id),roleIds:players.map(()=>0),status:'playing'};
      state.rooms=[virtRoom];state.players=virtPlayers;state.activeRoom=fakeRoomId;
      stageState.phase=this.game.completed?'night':this.game.phase.startsWith('NIGHT')?'night':'day';stageState.dayNumber=this.game.round;
      stageState.myRoleId=me.currentCharacterId;stageState.charges={skill:0,shield:0,potion:0};
      stageState.hp=0;stageState.maxHp=0;stageState.votes={};stageState.seatStatuses={};stageState.dayChatMessages=[];
      const selectedIdx=this.localSeatToId.indexOf(this.selectedTarget);
      stageState.targetPlayerId=selectedIdx<0?null:11000+selectedIdx;stageState.speaker=me.roleNameOverride||rname(me.currentCharacterId);stageState.speakerImg=portrait(me.currentCharacterId);
      stageState.dialogue=this.game.completed?'Ván đấu đã kết thúc. Kết quả đã được xác nhận bởi máy chủ.':`${this.game.mode==='NORMAL_GAMEPLAY'?'Chơi thường':'Chế độ chơi thử'} · ${ux.phase(this.game.phase)} · Lượt ${this.game.round}. Chọn mục tiêu và gửi kỹ năng khi đến lượt. Kết quả chỉ có sau khi lượt được xử lý.`;
      stageState.liveServerBoard=true;try{original.ingame();}finally{stageState.liveServerBoard=false;}
      state.rooms=saved.rooms;state.players=saved.players;state.activeRoom=saved.activeRoom;
      // Replace demo-only controls and role imagery BEFORE the browser paints the stage.
      $('content').querySelectorAll('.arena-seat-avatar').forEach(im=>{im.src='assets/anonymous-player.svg';im.alt='Người chơi (vai bí mật)';});
      $('content').querySelectorAll('.arena-seat').forEach((seat,i)=>{
        const member=room.members?.find(m=>m.id===players[i]?.playerId);
        const label=seat.querySelector('.arena-seat-name');if(label){label.title=member?.displayName||label.textContent;}
        const presence=document.createElement('span');presence.className='wvi-seat-presence';presence.textContent=member?.online?'● Online':'○ Mất kết nối';seat.append(presence);
        if(players[i]?.publicReportedDead){seat.classList.add('wv-eliminated-seat');seat.setAttribute('aria-label',(member?.displayName||`Ghế ${i+1}`)+' — Đã bị loại');}
        seat.id=`wv-seat-${i}`;seat.setAttribute('role','button');seat.tabIndex=0;seat.setAttribute('aria-disabled',String(this.working||this.game.completed));seat.setAttribute('aria-pressed',String(this.selectedTarget===players[i]?.playerId));seat.setAttribute('aria-label',(member?.displayName||`Người chơi ${i+1}`)+(players[i]?.publicReportedDead?' — Đã bị loại':''));seat.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();this.chooseTarget(11000+i);}};
        const badge=seat.querySelector('.role-id-badge');if(badge)badge.textContent=`Ghế ${i+1}`+(players[i]?.publicReportedDead?' · Đã loại':'');
      });
      const targetPlayerId=this.localSeatToId[selectedIdx];
      const targetMember=room.members?.find(m=>m.id===targetPlayerId);
      const dialogueLabel=$('content').querySelector('.dialogue-speaker');
      if(this.game.completed){const banner=$('content').querySelector('.phase-sky-banner');if(banner)banner.textContent='✦ VÁN CHƠI ĐÃ KẾT THÚC — KẾT QUẢ ĐÃ ĐƯỢC XÁC NHẬN';}
      const officialRoleName=$('content').querySelector('.hud-slot.active-role strong');if(officialRoleName)officialRoleName.textContent=me.roleNameOverride||rname(me.currentCharacterId);
      const ownInfo=$('content').querySelector('.hud-slot.active-role .muted');if(ownInfo)ownInfo.textContent=`Vai của bạn · ${({soi:'Phe Sói · ',dan:'Phe Dân Làng · ',phe3:'Phe Ba · ',cult:'Giáo phái · '})[me.currentFaction]||''}${me.life==='PROLONGED'?'Được kéo dài sự sống':me.life==='ALIVE'?'Đang sống':me.life==='HIBERNATING'?'Đang ngủ đông':'Đã bị loại'}`;
      if(dialogueLabel)dialogueLabel.textContent=this.game.completed?`${me.roleNameOverride||rname(me.currentCharacterId)} · Ván đã kết thúc`:`${me.roleNameOverride||rname(me.currentCharacterId)} · ${targetMember?'Đang chọn: '+targetMember.displayName:'Hãy chọn một người chơi'}`;
      if(this.game.completed&&!this.notice){this.notice='Ván chơi đã kết thúc. Kết quả được xác nhận bởi máy chủ.';}
      const hearts=$('content').querySelector('.hud-hearts');if(hearts)hearts.textContent=`${room.name} · Lượt ${this.game.round}`;
      $('content').querySelectorAll('.hud-slot:not(.active-role)').forEach(el=>el.remove());
      const selfSlot=$('content').querySelector('.hud-slot.active-role');if(selfSlot){selfSlot.classList.add('wv-self-card');const im=selfSlot.querySelector('img');if(im){im.src=portrait(me.currentCharacterId);im.alt=me.roleNameOverride||rname(me.currentCharacterId);}}
      const hud=$('content').querySelector('.hud-right-cluster');if(hud)hud.innerHTML=`<span class="wv-phase-label">${encode(ux.phase(this.game.phase))}</span><span class="wv-live-indicator" role="status">${this.connectionState==='online'?'● Đã kết nối':'○ Đang kết nối lại'}</span>${!this.game.completed&&room.hostId===this.profile.id&&['NIGHT_COLLECT','WITCH_WINDOW'].includes(this.game.phase)?`<button type="button" class="btn-gold" onclick="WolvesLive.resolve()">${this.game.phase==='WITCH_WINDOW'?(this.game.roleComposition?.some(c=>c.name==='Dược Sĩ')?'Kết thúc lượt cứu người':'Kết thúc lượt Phù Thủy'):(this.game.mode==='NORMAL_GAMEPLAY'?'Kết thúc lượt đêm':'Kết thúc lượt đêm thử nghiệm')}</button>`:''}${(!this.game.qaProfile||this.game.voting?.officialPolicy)&&room.hostId===this.profile.id&&this.game.phase==='DAY_DISCUSS'?'<button type="button" class="btn-secondary" onclick="WolvesLive.openVote()">Mở lượt ghi nhận phiếu</button>':''}${room.hostId===this.profile.id&&this.game.phase==='DAY_DISCUSS'&&this.game.canQaResolveDaySkill?'<button type="button" class="btn-secondary" onclick="WolvesLive.resolve()">Xử lý kỹ năng ban ngày</button>':''}${room.hostId===this.profile.id&&this.game.phase==='DAY_DISCUSS'&&this.game.canQaAdvanceDay?'<button type="button" class="btn-secondary" onclick="WolvesLive.resolve()">Chốt ngày (chế độ QA)</button>':''}${room.hostId===this.profile.id&&this.game.phase==='DAY_VOTE_COLLECT'?(this.game.mode==='NORMAL_GAMEPLAY'?'<button type="button" class="btn-gold" onclick="WolvesLive.closeVote()">Khóa phiếu và xét kết quả</button>':'<button type="button" class="btn-gold" onclick="WolvesLive.resolve()">Xử lý lượt biểu quyết</button><button type="button" class="btn-secondary" onclick="WolvesLive.closeVote()">Khóa phiếu chờ xét</button>'):''}${this.game.mode==='NORMAL_GAMEPLAY'&&!this.game.completed&&room.hostId!==this.profile.id&&room.members?.find(m=>m.id===room.hostId)?.online===false?'<button class="btn-secondary" onclick="WolvesLive.claimCoordinator()">Tiếp nhận điều phối</button>':''}<button type="button" class="btn-secondary" onclick="go('rooms')">Sảnh</button>`;
      const gameMeta=document.createElement('div');gameMeta.className='wvi-game-meta';gameMeta.textContent=`${this.game.ruleVersion||'Ruleset'} · ${players.filter(p=>!p.publicReportedDead).length}/${players.length} còn sống công khai · ${this.game.gameId.slice(0,8)}`;hud?.insertAdjacentElement('afterend',gameMeta);
      const choices=$('content').querySelector('.dialogue-choices');
      if(choices)choices.innerHTML=this.game.completed?`<section class="wv-match-result" role="status" aria-live="polite"><h3>Ván chơi đã kết thúc</h3><p>${this.game.winnerIds?.includes(this.profile.id)?'Bạn đã chiến thắng!':(this.game.winnerIds?.length?'Bạn không thuộc danh sách người thắng.':'Ván đấu kết thúc; chưa có người thắng được công bố.')}</p><p class="wv-winners">Người chiến thắng: ${encode((this.game.winnerIds||[]).map(id=>room.members?.find(m=>m.id===id)?.displayName||'Người chơi').join(', '))}</p><div class="row"><button class="btn-gold" onclick="go('rooms')">Trở về Sảnh</button><button class="btn-secondary" onclick="WolvesLive.verifyReplay()">Kiểm tra Replay</button></div></section>`:availableSkill?`${availableSkills.length>1?`<label for="wv-skill-choice">Chọn kỹ năng</label><select id="wv-skill-choice" class="input-field" onchange="WolvesLive.selectedSkill=this.value;WolvesLive.secondTarget=null;WolvesLive.renderGame()">${availableSkills.map(s=>`<option value="${encode(s.skillId)}" ${s.skillId===availableSkill.skillId?'selected':''}>${encode(s.label)}</option>`).join('')}</select>`:''}${Number.isInteger(availableSkill.remainingUses)?`<p class="muted">Lượt còn lại: ${availableSkill.remainingUses}</p>`:''}${availableSkill.maxTargets===2?`<label for="wv-second-target">${availableSkill.secondTargetDead?'Người chết đêm trước (bắt buộc)':availableSkill.minTargets===2?'Mục tiêu thứ hai (bắt buộc)':'Mục tiêu thứ hai (không bắt buộc)'}</label><select id="wv-second-target" class="input-field" onchange="WolvesLive.secondTarget=this.value||null;WolvesLive.renderGame()"><option value="">Không chọn</option>${players.filter(p=>(availableSkill.secondTargetDead?p.publicReportedDead:!p.publicReportedDead)&&(availableSkill.targetPolicy?.allowSelf||p.playerId!==this.profile.id)&&p.playerId!==this.selectedTarget&&(!availableSkill.eligibleTargetIds||availableSkill.eligibleTargetIds.includes(p.playerId))).map(p=>`<option value="${encode(p.playerId)}" ${p.playerId===this.secondTarget?'selected':''}>${encode(room.members?.find(m=>m.id===p.playerId)?.displayName||'Người chơi')}</option>`).join('')}</select>`:''}<button class="dialogue-choice-btn primary-choice" id="wv-skill-submit" onclick="WolvesLive.submitSkill()">${this.working?'Đang gửi / xử lý…':`✦ ${encode(availableSkill.label)}${availableSkill.targetPolicy?.max===0?'':' người đã chọn'}`}</button>`:
        '<span class="muted" role="status">Hiện tại bạn không có kỹ năng khả dụng. Hãy chờ lượt tiếp theo.</span>';
      if(['BLOCKED_BY_RULE','PENDING_EFFECT'].includes(this.game.resolutionStatus)){const waiting=document.createElement('p');waiting.setAttribute('role','status');waiting.textContent=this.game.resolutionStatus==='BLOCKED_BY_RULE'?'Ván đang chờ xác nhận quy tắc kết thúc.':'Ván đang chờ xử lý hiệu ứng còn lại.';hud?.insertAdjacentElement('afterend',waiting);}
      const vo=this.game.voting||{};if(vo.officialPolicy&&vo.outcome&&vo.status==='RESOLVED'){const info=document.createElement('p');info.className='wv-vote-result';info.setAttribute('role','status');info.textContent=vo.outcome==='NO_HANGING_TIE'?'Hòa phiếu — không ai bị treo.':vo.outcome==='NO_HANGING_ZERO'?'Không có phiếu hợp lệ — không ai bị treo.':vo.outcome==='NO_HANGING_IMMUNE'?'Biểu quyết đã phân giải — không ai bị loại.':this.game.phase==='DAY_RESOLVE'?'Đã treo cổ; kết quả thắng đang chờ quy tắc bổ sung.':'Biểu quyết đã phân giải, người bị treo đã bị loại.';hud?.insertAdjacentElement('afterend',info);}
      const day=$('content').querySelector('.day-discussion-panel');if(day){
       const vote=this.game.voting||{};const isCollect=this.game.phase==='DAY_VOTE_COLLECT';
       day.innerHTML=`<div class="day-chat-header"><strong>💬 Hội Đồng Làng</strong></div>${isCollect?
        `<p>Đã ghi nhận ${Number(vote.submittedCount||0)} phiếu. ${vote.officialPolicy?'Bạn có thể đổi phiếu trước khi khóa.':'Mỗi người chỉ gửi một lần; kết quả treo cổ chưa được hỗ trợ.'}</p><p>${vote.ownBallot?'Bạn đã gửi phiếu. Đang chờ chủ phòng khóa lượt.':'Chọn người chơi trên sân khấu, rồi nhấn Gửi phiếu.'}</p>${vote.officialPolicy&&!vote.canVote?'Bạn không còn quyền bỏ phiếu.':vote.officialPolicy?'<button type="button" class="btn-gold" onclick="WolvesLive.submitVote()">Gửi / đổi phiếu</button><button type="button" class="btn-secondary" onclick="WolvesLive.submitVote(true)">Phiếu trắng</button>':vote.ownBallot?'':'<button type="button" class="btn-gold" onclick="WolvesLive.submitVote()">Gửi phiếu</button>'}`:
        vote.outcome==='NO_HANGING_TIE'?'<p>Không có ai bị treo cổ vì số phiếu cao nhất bằng nhau.</p>':vote.outcome==='NO_HANGING_ZERO'?'<p>Không có phiếu hợp lệ cho ứng viên. Không ai bị treo.</p>':vote.outcome==='NO_HANGING_IMMUNE'?'<p>Biểu quyết đã phân giải; không ai bị loại.</p>':vote.outcome==='HANGING_COMPLETED'?'<p>Hội đồng đã hoàn tất biểu quyết và treo cổ.</p>':this.game.phase==='DAY_RESOLVE'?'<p>Phiếu đã được khóa và lưu an toàn. Kết quả treo cổ chưa thể xác định theo luật được xác nhận.</p>':
        vote.outcome==='CANCELLED_NO_ELIMINATION'?'<p>Hội đồng đã hủy lượt bỏ phiếu. Không ai bị loại trong lượt bị hủy này.</p>':
        (this.game.mode==='NORMAL_GAMEPLAY'?'<p>Đang thảo luận. Người điều phối mở lượt ghi nhận phiếu, sau đó khóa phiếu để máy chủ xét kết quả.</p>':'<p>Đang thảo luận. Chủ phòng có thể mở lượt ghi nhận phiếu khi đến giờ. Kết quả treo cổ chưa được hỗ trợ.</p>')}`;
      }
      const arena=$('content').querySelector('.ingame-arena');
      // Use a normal-flow support column at night AND day; no feedback overlay
      // covering seats or controls. Vote panel remains in its original location.
      let side=day;
      if(!side&&arena){side=document.createElement('aside');side.className='wv-match-side';arena.append(side);}
      if(side){side.classList.add('wv-match-side');arena.classList.add('day-split-layout');
        this.renderMatchExtras(side,me,room);
      }
      const results=document.createElement('section');results.id='wv-feedback';results.className='wv-feedback-panel';results.setAttribute('aria-label','Kết quả kỹ năng từ server');
      if(side)side.insertBefore(results,side.querySelector('.wv-role-composition')||null);else $('content').querySelector('.ingame-dialogue-bar')?.insertAdjacentElement('beforebegin',results);
      if(this.game.qaProfile){const panel=document.createElement('section');panel.className='wv-feedback-panel';panel.id='wv-bb-qa';const pack=this.game.bbPack;const trap=this.game.bbTrap;const names=id=>room.members?.find(m=>m.id===id)?.displayName||'Người chơi';const draftKey=`${this.gameId}:${this.game.round}`;if(this.bbDraft?.key!==draftKey)this.bbDraft={key:draftKey,first:'',second:''};const opts=(ids,selected)=>ids.map(id=>`<option value="${encode(id)}" ${id===selected?'selected':''}>${encode(names(id))}</option>`).join('');panel.innerHTML=`<h3>QA B/B — Chưa phát hành luật mới</h3><p class="muted">${this.game.qaProfile.includes('pack')?(this.game.roleComposition||[]).some(c=>c.name==='Sói Lưu Đày')?'Phạm vi: biểu quyết và chuyển phe Sói Lưu Đày, thứ tự đại diện ngẫu nhiên của toàn bộ người chơi.':(this.game.roleComposition||[]).some(c=>c.name==='Thợ Săn Quái Thú')?'Phạm vi: Sói Thủ Lĩnh duy nhất có thể cắn hai mục tiêu, bẫy phản sát; chưa mở biểu quyết ban ngày.':'Phạm vi: đồng thuận và che chở; kỹ năng riêng khác và biểu quyết ban ngày chưa mở.':(this.game.roleComposition||[]).some(c=>c.name==='Phù Thủy')?'Phạm vi: hai bình Phù Thủy; có thể chốt bình cứu trước, sau đó mở lượt độc. Đặt bẫy đêm 1, dùng bình từ đêm 2; chưa hỗ trợ hồi sinh hoặc các nhóm vai khác.':'Phạm vi: đặt bẫy và điều tra. Trong bộ có Bảo Vệ, QA giới hạn đặt bẫy đêm 1 và bảo vệ từ đêm 2; không có lượt cứu người.'}</p>${this.game.qaBbPolicyVersion&&this.game.phase==='WITCH_WINDOW'&&this.game.roleComposition?.some(c=>c.name==='Phù Thủy')&&room.hostId===this.profile.id&&!this.game.qaNightWindow?'<button id="wv-bb-open-poison" class="btn-secondary" onclick="WolvesLive.resolve(true)">Chốt bình cứu, mở lượt độc</button>':''}${this.game.qaNightWindow==='WITCH_POISON'?'<p id="wv-bb-night-window" role="status">Lượt bình độc — bình cứu đã khóa.</p>':''}${pack?`<p id="wv-bb-status" role="status">${pack.waitingForResponses?'Đang chờ phản hồi đủ điều kiện.':'Chọn mục tiêu riêng.'} ${Number.isInteger(pack.pendingParticipantCount)?`Còn ${pack.pendingParticipantCount} phản hồi. `:''}${pack.targetReceiptOnly?'Yêu cầu gần nhất của bạn (chưa xác nhận hợp lệ)':'Lựa chọn của bạn'}: ${encode((pack.latestSubmittedTargets||pack.latestValidTargets||[]).map(names).join(', ')||'Chưa có')}</p><label>Mục tiêu 1 <select id="wv-bb-first" class="input-field" onchange="WolvesLive.bbDraft.first=this.value"><option value="">Không chọn</option>${opts(pack.eligibleTargetIds,this.bbDraft.first)}</select></label><label>Mục tiêu 2 <select id="wv-bb-second" class="input-field" ${pack.maxTargets<2?'disabled':''} onchange="WolvesLive.bbDraft.second=this.value"><option value="">Không chọn</option>${opts(pack.eligibleTargetIds,this.bbDraft.second)}</select></label><button id="wv-bb-submit" class="btn-gold" ${this.working?'disabled':''} onclick="WolvesLive.submitBbPack()">Gửi / đổi lựa chọn</button>`:''}${trap?`<p id="wv-bb-trap-status">Bẫy đã đặt: ${trap.placed}/2 · Đang chờ: ${encode(trap.activeTargets.map(names).join(', ')||'Không có')}</p>`:''}`;if(side)side.prepend(panel);else $('content').append(panel);}
      this.renderFeedback();
      this.arrangeLiveStage(me,room,availableSkill);
      window.WolvesFate?.mount();
      const submit=$('wv-skill-submit');const valid=this.validTarget(availableSkill,this.selectedTarget);
      if(submit){submit.disabled=this.working||!valid||(availableSkill.minTargets===2&&!this.secondTarget);submit.title=!valid?'Chọn mục tiêu hợp lệ trước khi gửi':'';}
      if(choices&&availableSkill&&!valid){const hint=document.createElement('p');hint.className='muted';hint.textContent='Chọn một mục tiêu hợp lệ trên sân khấu.';choices.prepend(hint);}
      for(const btn of $('content').querySelectorAll('.hud-right-cluster button:not(:last-child),.day-discussion-panel button[onclick^="WolvesLive.submitVote"]')){if(this.working)btn.disabled=true;}
      const voteBtn=$('content').querySelector('button[onclick="WolvesLive.submitVote()"]');if(voteBtn&&!this.selectedTarget)voteBtn.disabled=true;
      const currentStage=$('content').querySelector('.ingame-stage-wrap');if(currentStage)currentStage.scrollTop=scroll;
      if(focusInStage&&focusId){const el=$(focusId);if(el&&!el.disabled&&document.activeElement!==el){el.focus({preventScroll:true});if(caret&&el.tagName==='INPUT'&&caret[0]!==null)el.setSelectionRange(...caret);}}
    },
    arrangeLiveStage(me,room,skill){
      const stage=$('content').querySelector('.ingame-stage-wrap'),arena=stage?.querySelector('.ingame-arena'),seats=arena?.querySelector('.arena-players-grid'),side=arena?.querySelector('.wv-match-side'),footer=stage?.querySelector('.ingame-dialogue-bar'),hud=stage?.querySelector('.ingame-hud-top');if(!stage||!arena||!seats||!side||!footer||!hud)return;
      stage.classList.add('wv2-stage');const banner=stage.querySelector('.phase-sky-banner');if(banner)banner.textContent=this.game.completed?'✦ VÁN ĐÃ KẾT THÚC':`${this.game.phase.startsWith('NIGHT')||this.game.phase==='WITCH_WINDOW'?'☾ ĐÊM':'☀ NGÀY'} ${this.game.round} · ${ux.phase(this.game.phase)}`;
      const meta=stage.querySelector('.wvi-game-meta');if(meta)meta.textContent=`${this.game.ruleVersion} · ${this.game.players.filter(p=>!p.publicReportedDead).length}/${this.game.players.length} còn sống công khai · Match ${this.game.gameId.slice(0,8)} · ${this.game.phaseTiming?.deadlineAt?'Deadline server':'Pha chờ điều phối'}`;
      const role=stage.querySelector('.hud-slot.active-role');const left=document.createElement('aside');left.className='wv2-role';const own=this.characters.find(c=>c.id===me.currentCharacterId);left.innerHTML=`<div class="wv2-overline">THÂN PHẬN CỦA BẠN</div><img class="wv2-role-art" src="${portrait(me.currentCharacterId)}" alt=""><details><summary>Mô tả kỹ năng gốc</summary><p>${encode(own?.desc||'Không có mô tả cho vai hiện tại.')}</p></details><div class="wv2-overline">TÀI NGUYÊN</div><p>${Object.entries(me.resources||{}).map(([k,v])=>`${encode(k)}: ${encode(v)}`).join(' · ')||'Không có tài nguyên được công bố'}</p>`;if(role)left.querySelector('.wv2-role-art').after(role);arena.prepend(left);
      const center=document.createElement('section');center.className='wv2-council';const title=document.createElement('header');title.className='wv2-arena-title';title.innerHTML=`<div><span class="wv2-overline">LÀNG SƯƠNG MÙ</span><h2>Hội đồng làng</h2></div><span>${this.game.players.length} ghế</span>`;center.append(title,seats);arena.insertBefore(center,side);
      for(const [i,seat] of [...seats.children].entries()){const pid=this.game.players[i]?.playerId;const allowed=this.game.phase==='DAY_VOTE_COLLECT'?false:skill?this.validTarget(skill,pid):false;seat.classList.toggle('wv2-eligible',allowed);if(allowed)seat.querySelector('.arena-seat-badges')?.insertAdjacentHTML('beforeend','<span class="wv2-target-label">Có thể chọn</span>');}
      if(this.game.phase==='DAY_VOTE_COLLECT'){const v=this.game.voting||{},count=Number(v.submittedCount||0),max=this.game.players.length;const panel=document.createElement('section');panel.className='wv2-voting';panel.innerHTML=`<span class="wv2-overline">BIỂU QUYẾT TRỰC TIẾP</span><h3>${count} phiếu đã tiếp nhận</h3><progress value="${count}" max="${max}" aria-label="Phiếu đã nhận trên tổng số ghế"></progress><p>So với ${max} ghế (không phải số người đủ quyền vote). Trọng số và tác động bí mật không công khai.</p><p>Phiếu của bạn: ${v.ownBallot?encode(room.members?.find(m=>m.id===v.ownBallot.targetId)?.displayName||'Phiếu trắng / mục tiêu không hiển thị'):'Chưa gửi'}</p>`;const pv=this.game.publicVoting;if(pv){const names=id=>room.members?.find(m=>m.id===id)?.displayName||'Người chơi';panel.insertAdjacentHTML('beforeend',`<h4>Lựa chọn công khai · ${pv.totalDeclared}</h4><div class="wv3-tally">${pv.targets.map(t=>`<div class="wv3-tally-row ${v.ownBallot?.targetId===t.playerId?'own':''}"><span>${encode(names(t.playerId))}</span><progress max="${Math.max(1,pv.totalDeclared)}" value="${t.count}" aria-label="${encode(names(t.playerId))}"></progress><strong>${t.count}</strong></div>`).join('')}</div><small>Phiếu trắng: ${pv.blankCount} · Không phải kết quả xét treo.</small>`);}center.append(panel);}
      const timing=this.game.phaseTiming;if(timing){const clock=document.createElement('span');clock.className='wv3-clock';clock.setAttribute('role','status');clock.dataset.startedAt=String(timing.startedAt??'');clock.dataset.serverOffset=String(timing.serverTime-Date.now());clock.textContent='Pha đang chờ điều phối';hud.append(clock);updatePhaseClock();}if(this.game.hostProgress){const hostInfo=document.createElement('p');hostInfo.className='wv3-host';hostInfo.textContent=this.game.completed?'Quản trò · Phiên đã kết thúc':this.game.hostProgress.status==='RESOLUTION_CHECKPOINT'?'Quản trò · Đang ở checkpoint phân giải':'Quản trò · Chờ điều phối theo luật';center.append(hostInfo);}const top=document.createElement('div');top.className='wv2-tools';top.innerHTML=`<button class="btn-secondary" onclick="WolvesLive.openJournal()">Nhật ký</button><button class="btn-secondary" onclick="WolvesLive.openMatchCodex()">Nhân vật trong ván</button><button class="btn-secondary" onclick="go('notifications')">Thông báo</button>`;hud.append(top);
      const choices=footer.querySelector('.dialogue-choices');if(choices&&skill&&!this.game.completed){const status=document.createElement('p');status.className='wv2-action-status';status.textContent=this.working?'Đang gửi yêu cầu…':`Chọn ${skill.minTargets??skill.targetPolicy?.min??1}–${skill.maxTargets??skill.targetPolicy?.max??1} mục tiêu · Chỉ server xác nhận kết quả`;choices.prepend(status);}
      const flowBanner=document.createElement('section');flowBanner.className='wv4-flow-banner';flowBanner.setAttribute('role','status');const hp=this.game.hostProgress;const ownFeedback=[...this.feedback.values()].filter(f=>['ACCEPTED','PENDING_RESOLUTION'].includes(f.resolutionStatus));const voted=this.game.phase==='DAY_VOTE_COLLECT'&&this.game.voting?.ownBallot;
      if(hp?.command){flowBanner.classList.add('wv4-moderator');flowBanner.innerHTML=`<small>✦ ĐIỀU PHỐI HỘI ĐỒNG</small><h2>${hp.allReceived?'TẤT CẢ ĐÃ XÁC NHẬN!':'ĐANG CHỜ QUẢN TRÒ'}</h2><p>${hp.allReceived?'Hệ thống đã tiếp nhận đầy đủ các yêu cầu khả dụng trong phạm vi này. Vui lòng xác nhận để tiếp tục.':'Bạn có quyền điều phối bước hiện tại. Kiểm tra diễn biến trước khi tiếp tục.'}</p><button type="button" class="btn-gold wv4-confirm" ${this.working?'disabled':''}>${this.working?'Đang gửi…':'XÁC NHẬN VÀ TIẾP TỤC'}</button>`;const command=hp.command,phaseId=hp.phaseId,revision=this.game.revision,gid=this.gameId;flowBanner.querySelector('button').onclick=()=>this.confirmCurrentStep(gid,command,phaseId,revision);}
      else {flowBanner.innerHTML=`<small>✦ DIỄN BIẾN TRẬN</small><h2>${this.game.completed?'VÁN ĐẤU ĐÃ KẾT THÚC':ownFeedback.length||voted?'LỰA CHỌN ĐÃ ĐƯỢC TIẾP NHẬN':skill?.available?'ĐẾN LƯỢT CỦA BẠN':this.game.phase==='DAY_VOTE_COLLECT'?'HỘI ĐỒNG BIỂU QUYẾT':this.game.phase==='DAY_DISCUSS'?'BÌNH MINH TẠI LÀNG SƯƠNG MÙ':'ĐANG CHỜ DIỄN BIẾN'}</h2><p>${ownFeedback.length||voted?'Hãy chờ quản trò điều phối. Tiếp nhận không đồng nghĩa kỹ năng thành công.':skill?.available?'Chọn mục tiêu và xác nhận hành động.':'Kết quả được hiển thị theo quyền của bạn.'}</p>`;}
      center.prepend(flowBanner);
      if(this.game.completed){const reward=document.createElement('section');reward.className='wv4-flow-banner';reward.id='wv4-end-reward';const key=this.profile.id+':'+this.gameId;const draw=p=>{if(!reward.isConnected)return;const rows=p.history.filter(r=>r.source_game===this.gameId);reward.innerHTML=`<h3>✦ Phần thưởng sự nghiệp</h3><p>${rows.length?`+${rows.reduce((n,r)=>n+Number(r.amount),0)} XP · Cấp ${p.level}`:'Ván này chưa đủ điều kiện tính điểm sự nghiệp.'}</p>${rows.map(r=>`<p>${encode(r.reason)} · +${Number(r.amount)} XP</p>`).join('')}<button class="btn-secondary" onclick="go('career')">Xem Sự nghiệp</button>`;};center.append(reward);if(this.progressionCache?.key===key&&this.progressionCache.value)queueMicrotask(()=>draw(this.progressionCache.value));else{reward.textContent='Đang kiểm tra phần thưởng đã lưu…';if(this.progressionCache?.key!==key)this.progressionCache={key,promise:this.request('/api/social/progression').then(r=>r.progression)};const cache=this.progressionCache;cache.promise.then(p=>{cache.value=p;draw(p);}).catch(()=>{if(reward.isConnected)reward.textContent='Chưa thể kiểm tra phần thưởng. Xem lại trong Sự nghiệp.';});}}

      center.append(footer); // Action controls remain bound to the original authenticated handlers.
    },
    async confirmCurrentStep(gid,command,phaseId,revision){if(this.working||gid!==this.gameId||this.game.hostProgress?.phaseId!==phaseId||this.game.revision!==revision)return;this.working=true;this.refreshUI();try{const current=(await this.request(`/api/games/${gid}`)).game;if(current.hostProgress?.phaseId!==phaseId||current.hostProgress?.command!==command)throw {code:'OUT_OF_PHASE',message:'Bước điều phối đã thay đổi; vui lòng kiểm tra lại.'};await this.request(`/api/games/${gid}/${command}`,'POST',{phaseId,expectedRevision:current.revision});await this.loadGame(gid);this.notice='Phiên hành động đã được máy chủ xử lý.';}catch(e){this.displayError(e);await this.loadGame(gid);}finally{this.working=false;this.refreshUI();}},
    async openJournal(){const gid=this.gameId;if(!gid)return;const dialog=this.makeStageDialog('Nhật ký cá nhân');const content=dialog.querySelector('.wv2-dialog-body');content.textContent='Đang tải từ sổ sự kiện…';try{const {journal}=await this.request(`/api/games/${gid}/journal`);if(!dialog.isConnected||gid!==this.gameId)return;const names=id=>this.room?.members?.find(m=>m.id===id)?.displayName||'Người chơi';const groups=new Map();for(const e of journal.entries){const key=`${e.round} · ${ux.phase(e.phase)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(e);}content.innerHTML=[...groups].map(([k,rows])=>`<section class="wv2-journal-group"><h3>${encode(k)}</h3>${rows.map(e=>`<article><strong>${encode(e.characterId?rname(e.characterId):'Vai lịch sử chưa xác định')} · ${encode(e.skillId)}</strong><p>${encode(e.targetIds.map(names).join(', ')||'Không cần mục tiêu')} · ${encode(ux.actionStatus(e.feedback?.resolutionStatus||e.status))}</p><small>${encode(new Date(e.submittedAt).toLocaleString('vi-VN'))}</small>${e.feedback?.resultType==='ROLE_INFORMATION'?`<p>Kết quả riêng: ${encode(e.feedback.resultPayload.roleName||rname(e.feedback.resultPayload.characterId))}</p>`:e.feedback?.resultType==='AURA_INFORMATION'?`<p>Kết quả riêng: ${encode(e.feedback.resultPayload.verdict)}</p>`:''}</article>`).join('')}</section>`).join('')||'<p>Chưa có hành động của bạn.</p>';if(journal.votes?.length)content.insertAdjacentHTML('beforeend',`<h3>Phiếu của tôi</h3>${journal.votes.map(v=>`<p>Ngày ${v.round} · ${encode(v.targetId?names(v.targetId):'Phiếu trắng')} · Đã tiếp nhận · ${encode(new Date(v.submittedAt).toLocaleString('vi-VN'))}</p>`).join('')}`);if(journal.privateResults?.length)content.insertAdjacentHTML('beforeend',`<h3>Kết quả riêng bổ sung</h3>${journal.privateResults.map(r=>`<article class="wv4-result-card"><strong>${encode(r.period)} ${r.round} · ${encode(r.label)}</strong><p>${encode(names(r.targetId))} · ${encode(r.result)}</p></article>`).join('')}`);if(journal.summaries?.length)content.insertAdjacentHTML('beforeend',`<h3>Tổng kết ngày và đêm</h3>${journal.summaries.map(x=>`<details class="wv2-journal-group" open><summary>${x.period==='Đêm'?'Bình minh tại Làng Sương Mù':'Phán quyết của Hội đồng'} · ${encode(x.period)} ${x.round}</summary>${x.events.map(e=>`<p>${encode(e.type==='DEATH'?'Công bố loại: '+names(e.playerId):e.type==='REVIVAL'?'Công bố hồi sinh: '+names(e.playerId):e.type==='VOTE'?'Kết quả biểu quyết: '+({HANG:'Có người bị loại',NO_HANG:'Không có người bị loại',TIE:'Hòa phiếu',CANCELLED_NO_ELIMINATION:'Hủy biểu quyết, không loại người'}[e.outcome]||e.outcome):'Kết thúc ván')}</p>`).join('')||'<p>Không có sự kiện công khai thuộc nhóm này.</p>'}</details>`).join('')}`);const publicLog=(journal.publicEvents||this.events).filter(e=>['PHASE_CHANGED','PLAYER_ELIMINATED','PLAYER_REVIVED','OFFICIAL_VOTE_RESULT','MATCH_COMPLETED'].includes(e.eventType));content.insertAdjacentHTML('beforeend',`<h3>Diễn biến được phép xem</h3>${publicLog.map(e=>`<p>${encode(e.eventType==='PHASE_CHANGED'?ux.phase(e.payload.phase)+' · '+e.payload.round:e.eventType==='PLAYER_ELIMINATED'?'Công bố loại: '+names(e.payload.playerId):e.eventType==='PLAYER_REVIVED'?'Công bố hồi sinh: '+names(e.payload.playerId):e.eventType==='MATCH_COMPLETED'?'Kết thúc ván':'Kết quả biểu quyết: '+e.payload.outcome)}</p>`).join('')}`);}catch{content.textContent='Không thể tải nhật ký. Hãy đóng và thử lại.';}},
    makeStageDialog(title){document.getElementById('wv2-dialog')?.remove();const d=document.createElement('dialog');d.id='wv2-dialog';d.className='wv2-dialog';d.innerHTML=`<header><h2>${encode(title)}</h2><button class="btn-secondary" aria-label="Đóng" type="button">Đóng</button></header><div class="wv2-dialog-body"></div>`;d.querySelector('button').onclick=()=>d.close();d.onclose=()=>d.remove();document.body.append(d);d.showModal();return d;},
    openMatchCodex(){const d=this.makeStageDialog('Nhân vật trong ván');const list=this.game?.roleComposition||[];d.querySelector('.wv2-dialog-body').innerHTML='<p>Bộ vai ban đầu được server cho phép công khai; không chỉ định ai giữ vai nào.</p>'+list.map(c=>`<article class="wv2-codex-row"><img loading="lazy" src="${portrait(this.characters.find(x=>x.name===c.name)?.id||0)}" alt=""><div><h3>${encode(c.name)} ×${c.count}</h3><p>${encode(this.characters.find(x=>x.name===c.name)?.desc||'Chưa có mô tả')}</p></div></article>`).join('');},
    validTarget(cap,id){
      if(!cap)return false;if(cap.targetPolicy?.max===0)return true;if(!id)return false;const p=this.game?.players?.find(x=>x.playerId===id);if(!p||(p.publicReportedDead&&!(cap.targetPolicy?.aliveOnly===false&&cap.eligibleTargetIds?.includes(id)))||cap.eligibleTargetIds&&!cap.eligibleTargetIds.includes(id))return false;
      return cap.targetPolicy?.allowSelf!==false||id!==this.profile.id;
    },
    renderMatchExtras(side,me,room){
      const composition=this.game.roleComposition||[];
      if(composition.length){
       if(!this.compositionNode){const panel=document.createElement('details');panel.className='wv-role-composition';panel.id='wv-role-composition';panel.open=true;
        panel.innerHTML=`<summary>DANH SÁCH NHÂN VẬT TRONG VÁN · ${composition.reduce((n,c)=>n+c.count,0)}</summary><p class="muted">Bộ vai ban đầu, không phải danh sách phân vai theo người.</p><div class="wv-composition-list">${composition.map(c=>{const info=this.characters.find(x=>x.name===c.name);return `<details class="wv-composition-role"><summary><img src="${portrait(this.characters.find(x=>x.name===c.name)?.id||0)}" alt=""><span>${encode(c.name)} · ×${c.count}</span></summary><p>${encode(info?.desc||'Xem thêm trong Bách khoa nhân vật.')}</p></details>`;}).join('')}</div>`;this.compositionNode=panel;}
       side.append(this.compositionNode);
       if(!this.wheelNode){const panel=document.createElement('details');panel.id='wv-role-wheel';panel.className='wv-role-wheel';panel.open=true;
        const expanded=composition.flatMap(c=>Array.from({length:c.count},()=>c));const idx=expanded.findIndex(c=>c.name===rname(me.initialCharacterId));const angle=idx<0?0:360-(idx+.5)*360/expanded.length;
        const colors=['#71567f','#a67d48','#3b6661','#813d51','#435579'];const gradient=expanded.map((c,i)=>`${colors[i%colors.length]} ${i*360/expanded.length}deg ${(i+1)*360/expanded.length}deg`).join(',');
        panel.innerHTML=`<summary>Vòng xoay nhận vai · Vai của bạn</summary><div class="wv-wheel-visual"><span class="wv-wheel-pointer" aria-hidden="true">▼</span><div class="wv-wheel-disc" aria-hidden="true" style="--wv-wheel-turn:${1440+angle}deg;background:conic-gradient(${gradient})">${expanded.map((c,i)=>`<img src="${portrait(this.characters.find(x=>x.name===c.name)?.id||0)}" alt="" style="--wv-segment:${(i+.5)*360/expanded.length}deg">`).join('')}</div><img class="wv-wheel-center" src="${portrait(me.initialCharacterId)}" alt=""></div><p class="wv-wheel-motion" aria-live="polite"></p><p class="wv-wheel-result" role="status">Vai được máy chủ phân: <strong>${encode(rname(me.initialCharacterId))}</strong></p><button type="button" class="btn-secondary" onclick="WolvesLive.replayWheel()">Xem lại vòng xoay</button>`;
        this.wheelNode=panel;const animationKey=`wv_visual_wheel:${this.gameId}`;let first=false;try{first=!sessionStorage.getItem(animationKey);sessionStorage.setItem(animationKey,'1');}catch{}if(first&&this.visualSynced)requestAnimationFrame(()=>{if(this.wheelNode===panel)this.replayWheel();});else panel.querySelector('.wv-wheel-motion').textContent='Đã nhận vai.';
       }side.append(this.wheelNode);
      }
      if(!this.chatNode){const chat=document.createElement('section');chat.className='wv-public-chat';chat.id='wv-in-match-chat';chat.setAttribute('aria-label','Chat công khai');chat.innerHTML='<h3>Khung chat trong trận</h3><button type="button" class="btn-secondary wv-chat-unread" hidden>0 tin nhắn mới · Xem ngay</button><p class="wv-chat-state" role="status"></p><div class="wv-chat-history" role="log" aria-live="polite"></div><form onsubmit="WolvesLive.sendChat(event)"><label for="wv-chat-input">Tin nhắn công khai</label><input id="wv-chat-input" class="input-field" maxlength="500" required autocomplete="off" oninput="WolvesLive.chatDraft=this.value"><button id="wv-chat-submit" type="submit" class="btn-secondary">Gửi tin nhắn</button></form><p class="wv-chat-notice" role="status" aria-live="polite"></p>';this.chatNode=chat;const history=chat.querySelector('.wv-chat-history');const unread=chat.querySelector('.wv-chat-unread');const markRead=()=>{this.chatSeenCount=this.chatLastCount;this.chatUnread=0;unread.hidden=true;};history.addEventListener('scroll',()=>{if(history.scrollHeight-history.scrollTop-history.clientHeight<30)markRead();});unread.addEventListener('click',()=>{history.scrollTop=history.scrollHeight;markRead();});}
      const chat=this.chatNode;side.prepend(chat);
      this.renderMediumChat(side,room);
      this.renderSystemGroupChat(side,room);
      const messages=this.events.filter(e=>e.eventType==='GAME_PUBLIC_CHAT');const history=chat.querySelector('.wv-chat-history');const markup=messages.map(e=>`<p><strong>${encode(room.members?.find(m=>m.id===e.actorId)?.displayName||'Người chơi')}</strong>: ${encode(e.payload.text)}</p>`).join('');
      if(history.innerHTML!==markup){const atEnd=history.scrollHeight-history.scrollTop-history.clientHeight<30;const oldCount=this.chatLastCount;this.chatLastCount=messages.length;const incoming=messages.slice(oldCount).filter(e=>e.actorId!==this.profile.id).length;const previousTop=history.scrollTop;history.innerHTML=markup;if(atEnd){history.scrollTop=history.scrollHeight;this.chatSeenCount=messages.length;this.chatUnread=0;}else{history.scrollTop=previousTop;this.chatUnread+=incoming;}}const unread=chat.querySelector('.wv-chat-unread');unread.hidden=this.chatUnread===0;unread.textContent=`${this.chatUnread} tin nhắn mới · Xem ngay`;
      const can=!!this.game.chat?.canSend;chat.querySelector('.wv-chat-state').textContent=this.game.chat?.muted?'Bạn đang bị câm trong chat công khai.':!this.game.chat?.enabled?'Chat chưa được hỗ trợ cho bộ vai này.':can?'Chat công khai đang mở.':'Chat chưa mở. Chỉ gửi trong giai đoạn thảo luận ban ngày.';
      const input=chat.querySelector('input');if(input.value!==this.chatDraft)input.value=this.chatDraft;input.disabled=!can||this.chatSending;
      const button=chat.querySelector('#wv-chat-submit');button.disabled=!can||this.chatSending;button.textContent=this.chatSending?'Đang gửi…':'Gửi tin nhắn';chat.querySelector('.wv-chat-notice').textContent=this.chatNotice;
    },
    renderSystemGroupChat(side,room){
      const groups=this.game?.groupChat||[];
      if(!groups.length){this.groupChatNode?.remove();this.groupChatNode=null;this.groupChatSession=null;return;}
      if(!this.groupChatSession||this.groupChatSession.gameId!==this.gameId||!groups.some(g=>g.id===this.groupChatSession.groupId))this.groupChatSession={gameId:this.gameId,groupId:groups[0].id,draft:'',retry:null,sending:false,notice:''};
      if(!this.groupChatNode){const panel=document.createElement('section');panel.id='wv-system-group-chat';panel.className='wv-public-chat';panel.setAttribute('aria-label','Chat nhóm chức năng');panel.innerHTML='<h3>Chat nhóm chức năng</h3><label for="wv-group-select">Kênh được cấp quyền</label><select id="wv-group-select" class="input-field"></select><p class="wv-group-state" role="status"></p><div class="wv-group-history wv-chat-history" role="log" aria-live="polite"></div><form><label for="wv-group-input">Tin nhắn nhóm</label><input id="wv-group-input" class="input-field" maxlength="500" required autocomplete="off"><button type="submit" class="btn-secondary">Gửi nhóm</button></form><p class="wv-group-notice" role="status"></p>';this.groupChatNode=panel;
        panel.querySelector('select').addEventListener('change',e=>{if(this.game?.groupChat?.some(g=>g.id===e.target.value)){if(this.groupChatSession?.sending)return;this.groupDrafts??=new Map();this.groupDrafts.set(this.groupChatSession.groupId,this.groupChatSession.draft);this.groupChatSession={gameId:this.gameId,groupId:e.target.value,draft:this.groupDrafts.get(e.target.value)||'',retry:null,sending:false,notice:''};this.refreshUI();}});
        panel.querySelector('input').addEventListener('input',e=>{if(this.groupChatSession)this.groupChatSession.draft=e.target.value;});panel.querySelector('form').addEventListener('submit',e=>this.sendSystemGroupChat(e));}
      const panel=this.groupChatNode,session=this.groupChatSession,group=groups.find(g=>g.id===session.groupId);side.prepend(panel);
      this.groupRead??=new Map();const visibleGroupEvents=this.events.filter(e=>e.eventType==='GAME_GROUP_CHAT');const unread=g=>visibleGroupEvents.filter(e=>e.payload.groupId===g.id&&e.actorId!==this.profile.id&&e.seq>(this.groupRead.get(g.id)||0)).length;const select=panel.querySelector('select'),opts=groups.map((g,i)=>`<option value="${encode(g.id)}">${g.kind==='CULT_DAY'?'Giáo phái':g.kind==='CUPID_PAIR'?'Cặp đôi Cupid':'Nhóm chức năng'} ${i+1}${g.id!==group.id&&unread(g)?' · '+unread(g)+' mới':''}</option>`).join('');if(select.innerHTML!==opts)select.innerHTML=opts;select.value=group.id;select.disabled=session.sending;this.groupRead.set(group.id,Math.max(0,...visibleGroupEvents.filter(e=>e.payload.groupId===group.id).map(e=>e.seq)));
      const history=panel.querySelector('.wv-group-history'),markup=this.events.filter(e=>e.eventType==='GAME_GROUP_CHAT'&&e.payload.groupId===group.id).map(e=>`<p><strong>${encode(room.members?.find(m=>m.id===e.actorId)?.displayName||'Người chơi')}</strong>: ${encode(e.payload.text)}</p>`).join('');if(history.innerHTML!==markup){history.innerHTML=markup;history.scrollTop=history.scrollHeight;}
      panel.querySelector('.wv-group-state').textContent=group.canSend?'Kênh riêng đang mở · '+(this.game.phase.startsWith('NIGHT')?'Ban đêm':'Ban ngày'):'Kênh nhóm chưa mở.';const input=panel.querySelector('input');if(input.value!==session.draft)input.value=session.draft;input.disabled=!group.canSend||session.sending;panel.querySelector('button').disabled=!group.canSend||session.sending;panel.querySelector('.wv-group-notice').textContent=session.notice;
    },
    async sendSystemGroupChat(event){event.preventDefault();const session=this.groupChatSession;if(!session||session.sending||!session.draft.trim()||!this.game?.groupChat?.some(g=>g.id===session.groupId&&g.canSend))return;
      const text=session.draft.trim(),gid=session.gameId;if(session.retry?.text!==text)session.retry={text,key:crypto.randomUUID()};session.sending=true;session.notice='Đang gửi…';this.refreshUI();
      try{await this.request(`/api/games/${gid}/chat`,'POST',{channel:'GROUP',groupId:session.groupId,text,messageId:session.retry.key});if(this.groupChatSession!==session||this.gameId!==gid)return;if(session.draft.trim()===text)session.draft='';session.retry=null;session.notice='Đã gửi nhóm.';await this.loadEvents();}catch(e){if(this.groupChatSession===session)session.notice=errorText(e);}finally{session.sending=false;if(this.groupChatSession===session)this.refreshUI();}},
    renderMediumChat(side,room){
      const channel=this.game?.mediumChat;
      if(!channel){this.mediumChatNode?.remove();this.mediumChatDraft='';this.mediumChatTarget=null;this.mediumChatRetry=null;this.mediumChatNotice='';return;}
      if(!this.mediumChatNode){const panel=document.createElement('section');panel.id='wv-medium-chat';panel.className='wv-public-chat';panel.setAttribute('aria-label','Kênh Thầy Đồng ẩn danh');panel.innerHTML='<h3>Trò chuyện với người chết</h3><p class="wv-medium-chat-state" role="status"></p><label for="wv-medium-chat-target">Người trò chuyện</label><select id="wv-medium-chat-target" class="input-field"></select><div class="wv-medium-chat-history wv-chat-history" role="log" aria-live="polite"></div><form><label for="wv-medium-chat-input">Tin nhắn riêng</label><input id="wv-medium-chat-input" class="input-field" maxlength="500" required autocomplete="off"><button id="wv-medium-chat-submit" type="submit" class="btn-secondary">Gửi riêng</button></form><p class="wv-medium-chat-notice" role="status"></p>';this.mediumChatNode=panel;
        panel.querySelector('select').addEventListener('change',e=>{this.mediumChatTarget=e.target.value;this.mediumChatDraft='';this.mediumChatRetry=null;this.refreshUI();});panel.querySelector('input').addEventListener('input',e=>this.mediumChatDraft=e.target.value);panel.querySelector('form').addEventListener('submit',e=>this.sendMediumChat(e));}
      const panel=this.mediumChatNode;const mediumLabel=channel.roleLabel||'Thầy Đồng';panel.setAttribute('aria-label',`Kênh ${mediumLabel} ẩn danh`);side.prepend(panel);const select=panel.querySelector('select');const medium=channel.kind==='MEDIUM';select.hidden=!medium;panel.querySelector('label[for="wv-medium-chat-target"]').hidden=!medium;
      if(medium){const targets=channel.targets||[];if(!targets.some(t=>t.playerId===this.mediumChatTarget))this.mediumChatTarget=targets[0]?.playerId??null;const markup=targets.map(t=>`<option value="${encode(t.playerId)}">${encode(room.members?.find(m=>m.id===t.playerId)?.displayName||'Người đã chết')}</option>`).join('');if(select.innerHTML!==markup)select.innerHTML=markup;select.value=this.mediumChatTarget||'';}
      const chosen=medium?channel.targets.find(t=>t.playerId===this.mediumChatTarget):null;const session=medium?chosen?.sessionId:channel.sessionId;
      panel.querySelector('.wv-medium-chat-state').textContent=medium?'Chỉ bạn và người chết được chọn có thể đọc kênh.':`Bạn đang trò chuyện ẩn danh với ${mediumLabel}.`;
      const history=panel.querySelector('.wv-medium-chat-history');const markup=this.events.filter(e=>e.eventType==='MEDIUM_CHAT_MESSAGE'&&e.payload.sessionId===session).map(e=>`<p><strong>${encode(e.payload.own?'Bạn':medium?(room.members?.find(m=>m.id===e.payload.deadPlayerId)?.displayName||'Người đã chết'):mediumLabel)}</strong>: ${encode(e.payload.text)}</p>`).join('');if(history.innerHTML!==markup){history.innerHTML=markup;history.scrollTop=history.scrollHeight;}
      const input=panel.querySelector('input');if(input.value!==this.mediumChatDraft)input.value=this.mediumChatDraft;input.disabled=this.mediumChatSending;panel.querySelector('button').disabled=this.mediumChatSending||(medium&&!chosen);panel.querySelector('.wv-medium-chat-notice').textContent=this.mediumChatNotice;
    },
    async sendMediumChat(event){event.preventDefault();const channel=this.game?.mediumChat;if(!channel||this.mediumChatSending||!this.mediumChatDraft.trim())return;const text=this.mediumChatDraft.trim(),gid=this.gameId;const address=channel.kind==='MEDIUM'?{targetId:this.mediumChatTarget}:{sessionId:channel.sessionId};const fingerprint=JSON.stringify([gid,this.game.round,text,address]);if(this.mediumChatRetry?.fingerprint!==fingerprint)this.mediumChatRetry={fingerprint,key:crypto.randomUUID()};this.mediumChatSending=true;this.mediumChatNotice='Đang gửi…';this.refreshUI();try{await this.request(`/api/games/${gid}/chat`,'POST',{channel:'MEDIUM',text,messageId:this.mediumChatRetry.key,...address});if(gid!==this.gameId)return;this.mediumChatDraft='';this.mediumChatRetry=null;this.mediumChatNotice='Đã gửi riêng.';await this.loadGame(gid);await this.loadEvents();}catch(e){if(gid===this.gameId)this.mediumChatNotice=errorText(e);}finally{this.mediumChatSending=false;this.refreshUI();}},
    replayWheel(){const panel=this.wheelNode,disc=panel?.querySelector('.wv-wheel-disc'),status=panel?.querySelector('.wv-wheel-motion');if(!disc||!status)return;disc.classList.remove('wv-spin');if(window.WolvesVisual?.reduced()||matchMedia('(prefers-reduced-motion: reduce)').matches){status.textContent='Đã nhận vai.';return;}status.textContent='Đang quay minh họa…';disc.onanimationend=()=>{status.textContent='Đã nhận vai.';disc.classList.remove('wv-spin');};void disc.offsetWidth;disc.classList.add('wv-spin');},
    chooseTarget(numeric){if(this.game?.completed||this.working)return;const index=numeric-11000;const p=this.localSeatToId[index];if(!p)return;this.selectedTarget=p;if(this.secondTarget===p)this.secondTarget=null;this.renderGame();},
    async submitSkill(){const view=this.game,me=view?.players?.find(p=>p.playerId===this.profile.id)?.self;
      if(!me||this.working)return;const cap=this.game.capabilities?.filter(c=>c.available)||[];const skill=(cap.find(c=>c.skillId===this.selectedSkill)||cap[0])?.skillId;
      if(!skill){this.displayError({message:'Vai này chưa có kỹ năng được bật trong test pack.'});return;}
      if(!['NIGHT_COLLECT','WITCH_WINDOW','DAY_VOTE_COLLECT','DAY_DISCUSS','DAY_RESOLVE'].includes(view.phase)){this.displayError({message:'Chưa đến pha sử dụng kỹ năng.'});return;}
      if(!this.validTarget(cap.find(c=>c.skillId===skill),this.selectedTarget)){this.displayError({message:'Chọn một mục tiêu hợp lệ.'});return;}
      if(cap.find(c=>c.skillId===skill)?.minTargets===2&&!this.secondTarget){this.displayError({message:'Chọn đủ hai mục tiêu.'});return;}
      this.working=true;this.notice='Đang gửi hành động…';this.refreshUI();try{
        const targetIds=cap.find(c=>c.skillId===skill)?.targetPolicy?.max===0?[]:[this.selectedTarget,...(cap.find(c=>c.skillId===skill)?.maxTargets===2&&this.secondTarget&&this.secondTarget!==this.selectedTarget?[this.secondTarget]:[])];
        const fingerprint=JSON.stringify([view.gameId,view.round,view.phase,skill,targetIds]);
        if(this.actionRetry?.fingerprint!==fingerprint)this.actionRetry={fingerprint,actionId:`action-${crypto.randomUUID()}`,idempotencyKey:`idem-${crypto.randomUUID()}`};
        const {actionId,idempotencyKey}=this.actionRetry;const payload={actionId,idempotencyKey,skillId:skill,targetIds,expectedRevision:view.revision};
        let response;
        try{response=await this.request(`/api/games/${this.gameId}/actions`,'POST',payload);}
        catch(e){
          // A stale revision is a confirmed pre-commit rejection. Refresh once and
          // retry the SAME action/key (server idempotency), never a new action.
          if(e.code!=='REVISION_CONFLICT')throw e;
          const latest=(await this.request(`/api/games/${this.gameId}`)).game;
          this.applyGame(latest);
          if(latest.phase!==view.phase||latest.round!==view.round||!latest.capabilities?.some(c=>c.skillId===skill&&c.available))throw e;
          payload.expectedRevision=latest.revision;
          response=await this.request(`/api/games/${this.gameId}/actions`,'POST',payload);
        }
        const a=response.action;this.actionRetry=null;
        if(a?.status==='ACCEPTED'||a?.status==='RESOLVED'){this.notice=a.status==='RESOLVED'?'Đã xử lý hành động.':'Đã nhận hành động. Kết quả sẽ có sau khi lượt được xử lý.';this.applyGame((await this.request(`/api/games/${this.gameId}`)).game);await this.loadFeedback();}
      }catch(e){if(!['TIMEOUT','NETWORK_ERROR'].includes(e.code))this.actionRetry=null;this.displayError(e);}finally{this.working=false;this.refreshUI();}
    },
    async submitBbPack(){if(this.working||!this.game?.bbPack)return;const targets=[$('wv-bb-first')?.value,$('wv-bb-second')?.value].filter(Boolean);if(new Set(targets).size!==targets.length){this.displayError({message:'Chọn hai mục tiêu khác nhau.'});return;}const fingerprint=JSON.stringify([this.gameId,this.game.round,targets]);if(this.bbRetry?.fingerprint!==fingerprint)this.bbRetry={fingerprint,key:crypto.randomUUID()};const key=this.bbRetry.key;this.working=true;try{const payload={key,targets,expectedRevision:this.game.bbPack.revision};try{await this.request(`/api/games/${this.gameId}/bb-pack`,'POST',payload);}catch(e){if(e.code!=='REVISION_CONFLICT')throw e;const latest=(await this.request(`/api/games/${this.gameId}`)).game;this.applyGame(latest);if(!latest.bbPack)throw e;payload.expectedRevision=latest.bbPack.revision;await this.request(`/api/games/${this.gameId}/bb-pack`,'POST',payload);}this.bbRetry=null;this.bbDraft={key:`${this.gameId}:${this.game.round}`,first:'',second:''};await this.loadGame(this.gameId);this.notice=this.game?.bbPack?.targetReceiptOnly?'Đã nhận yêu cầu riêng; server kiểm tra quyền mục tiêu khi phân giải.':'Đã ghi nhận lựa chọn riêng.';}catch(e){if(!['TIMEOUT','NETWORK_ERROR'].includes(e.code))this.bbRetry=null;this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async sendChat(event){event?.preventDefault();if(this.chatSending||!this.game?.chat?.canSend||!this.chatDraft.trim())return;
      const text=this.chatDraft.trim(),gid=this.gameId;const key=this.chatRetry?.text===text&&this.chatRetry?.gid===gid?this.chatRetry.key:crypto.randomUUID();this.chatRetry={text,gid,key};
      this.chatSending=true;this.chatNotice='Đang gửi tin nhắn…';this.refreshUI();
      try{await this.request(`/api/games/${gid}/chat`,'POST',{text,messageId:key});if(gid!==this.gameId)return;if(this.chatDraft.trim()===text)this.chatDraft='';this.chatRetry=null;this.chatNotice='Đã gửi tin nhắn.';await this.loadEvents();}
      catch(e){if(gid===this.gameId)this.chatNotice=e.code==='UNAUTHORIZED'?'Bạn không có quyền gửi tin nhắn lúc này.':e.code==='RESOURCE_INSUFFICIENT'?'Bạn gửi quá nhanh. Hãy thử lại sau.':errorText(e);}
      finally{this.chatSending=false;this.refreshUI();}},
    async openVote(){if(this.working||!this.game||this.game.phase!=='DAY_DISCUSS')return;
      this.working=true;this.notice='Đang xử lý yêu cầu…';this.refreshUI();try{const current=(await this.request(`/api/games/${this.gameId}`)).game;
       const v=await this.request(`/api/games/${this.gameId}/voting-open`,'POST',{expectedRevision:current.revision});
       await this.loadGame(this.gameId);if(this.game?.phase==='DAY_VOTE_COLLECT')this.notice='Đã mở lượt ghi nhận phiếu. Chưa có kết quả loại người chơi.';
      }catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async submitVote(blank=false){if(this.working||!this.game||this.game.phase!=='DAY_VOTE_COLLECT')return;
      if(!blank&&!this.selectedTarget){this.displayError({code:'TARGET_INVALID'});return;}
      const voteRound=this.game.round;this.working=true;this.notice='Đang gửi phiếu…';this.refreshUI();try{const ballotId=`ballot-${crypto.randomUUID()}`;const idempotencyKey=`vote-${crypto.randomUUID()}`;
       const payload={ballotId,idempotencyKey,targetId:blank?'':this.selectedTarget,expectedRevision:this.game.revision};
       try{await this.request(`/api/games/${this.gameId}/votes`,'POST',payload);}
       catch(e){if(e.code!=='REVISION_CONFLICT')throw e;const round=voteRound;
        const current=(await this.request(`/api/games/${this.gameId}`)).game;this.applyGame(current);
        if(current.phase!=='DAY_VOTE_COLLECT'||current.round!==round||current.voting?.canVote===false)throw e;
        payload.expectedRevision=current.revision;
        await this.request(`/api/games/${this.gameId}/votes`,'POST',payload);}
       await this.loadGame(this.gameId);if(this.game?.phase==='DAY_VOTE_COLLECT'&&this.game.round===voteRound)this.notice='Phiếu của bạn đã được ghi nhận. Chưa có kết quả biểu quyết.';
      }catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async closeVote(){if(this.working||!this.game||this.game.phase!=='DAY_VOTE_COLLECT')return;
      this.working=true;this.notice='Đang xử lý yêu cầu…';this.refreshUI();try{const current=(await this.request(`/api/games/${this.gameId}`)).game;
       await this.request(`/api/games/${this.gameId}/voting-close`,'POST',{expectedRevision:current.revision});
       await this.loadGame(this.gameId);if(!this.game.completed)this.notice=this.game.voting?.officialPolicy?'Đã khóa và phân giải phiếu.':'Đã khóa phiếu. Luật xác định người bị treo còn thiếu; không tự loại người chơi.';
      }catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    async resolve(bbOpenPoisonWindow=false){if(this.working||!this.game)return;const previousPhase=this.game.phase;this.working=true;this.notice='Đang xử lý lượt…';this.refreshUI();try{this.applyGame((await this.request(`/api/games/${this.gameId}`)).game);const data=await this.request(`/api/games/${this.gameId}/${this.game.mode==='NORMAL_GAMEPLAY'?'advance-night':'resolve'}`,'POST',{expectedRevision:this.game.revision,...(bbOpenPoisonWindow?{bbOpenPoisonWindow:true}:{})});await this.loadGame(this.gameId);this.notice=data.resolution.packStatus==='WAITING_FOR_RESPONSES'?'Còn thành viên chưa phản hồi; lượt đêm tiếp tục mở.':previousPhase==='DAY_VOTE_COLLECT'?
        (this.game?.phase==='NIGHT_COLLECT'?'Biểu quyết đã được hủy theo kỹ năng hợp lệ. Đêm mới bắt đầu.':
         `Đã xử lý ${data.resolution.resolved} kỹ năng trong ngày. Lượt bỏ phiếu vẫn đang mở.`):
        (Number.isInteger(data.resolution.resolved)?`Đã xử lý lượt đêm. ${data.resolution.resolved} hành động đã được giải quyết.`:'Đã xử lý lượt đêm.');}catch(e){this.displayError(e);}finally{this.working=false;this.refreshUI();}},
    renderFeedback(){const box=$('wv-feedback');if(!box)return;const room=this.room||{members:[]};
      const ordered=[...this.feedback.values()].sort((a,b)=>(a.eventRevision??0)-(b.eventRevision??0)||a.actionId.localeCompare(b.actionId));
      box.innerHTML=`<h3>✦ Trung tâm kết quả kỹ năng</h3>${this.notice?`<p role="status" aria-live="polite">${encode(this.notice)}</p>`:''}
      ${ordered.length?ordered.map(f=>{
        const shown=f.resolutionStatus==='RESOLVED'&&f.resultType==='ROLE_INFORMATION'&&f.resultPayload&&(Number.isInteger(f.resultPayload.characterId)||f.resultPayload.roleName==='Dân thường');
        const judged=f.resolutionStatus==='RESOLVED'&&f.resultType==='AURA_INFORMATION'&&['Thiện','Ác','Không xác định'].includes(f.resultPayload?.verdict);
        const message=shown?`${f.resultPayload.context==='SHIELD_SUCCESS'?'Khiên hộ vệ thành công. Vai trò mục tiêu':'Bạn đã soi thấy'}: ${encode(f.resultPayload.roleName||rname(f.resultPayload.characterId))}.`:judged?`${f.resultPayload.context==='SEER_AURA'?'Bạn đã soi thấy hào quang':'Cân Phán Quyết xác nhận'}: ${encode(f.resultPayload.verdict)}.`:
         f.resolutionStatus==='RESOLVED'?'Lượt kỹ năng đã được xử lý.':
         f.resolutionStatus==='CANCELLED'?'Hành động này đã bị hủy.':
         f.resolutionStatus==='RULE_UNRESOLVED'?'Hành động này hiện chưa được hỗ trợ.':
         f.resolutionStatus==='REJECTED'?'Hành động không hợp lệ.':
         f.resolutionStatus==='PENDING_RESOLUTION'||f.resolutionStatus==='ACCEPTED'?'Đã nhận hành động. Hãy chờ lượt được xử lý.':'Đang cập nhật kết quả.';
        return `<article class="wv-feedback-item wv4-result-card" data-action-id="${encode(f.actionId)}"><small>${encode(ux.actionStatus(f.resolutionStatus))} · ${encode(f.skillId)}</small><p>${message}</p>${f.resolvedAt?`<small>${encode(new Date(f.resolvedAt).toLocaleString('vi-VN'))}</small>`:''}${(shown||judged)?`<p class="wv-inspection-target">Mục tiêu: ${encode(room.members?.find(m=>m.id===f.resultPayload.targetId)?.displayName||'Người chơi')} · Kết quả riêng tư</p>`:''}</article>`;
       }).join(''):'<p class="muted">Chưa có hành động. Kết quả sẽ được giữ tại đây sau khi lượt kết thúc.</p>'}
       <button type="button" class="btn-secondary" onclick="WolvesLive.loadEvents()">Làm mới diễn biến</button>
       <div class="wv-game-events" aria-label="Diễn biến được phép xem">${this.events.filter(e=>['PHASE_CHANGED','ROLE_OBSERVED','SEER_AURA_OBSERVED','SKILL_LOCK_NOTICE','VOTE_OUTCOME_CONFIRMED','PLAYER_ELIMINATED','PLAYER_REVIVED','SOUL_SECRET_REVIVED','MATCH_COMPLETED','S13_DAY_JUDGMENT_REVEALED','PUBLIC_CHAT_MUTED','S14_STONE_ROLE_REVEALED','S15_GUARD_OBSERVED','S15_PUBLIC_ROLE_REVEALED','S15_VIOLIN_RESULT','S15_DEMON_FACTION','S15_DEEP_WITCH_PRELIMINARY','S15_FINAL_PHARMACIST_PRELIMINARY','S15_FINAL_REVENGE_AVAILABLE','S15_DEEP_RESCUE_APPLIED','S15_BREAK_STONE_SPENT','S15_BREAK_ALIGNMENT_CHANGED','S15_BREAK_BALLOT_OFFER','S15_BREAK_BALLOT_RESPONSE','S15_BREAK_BALLOT_SETTLED','S15_SCALE_BELL_OBSERVED','S15_GROWTH_DOG_THIEF_MISS','CULT_RECRUITED','CULT_RECRUITMENT_RESOLVED','CULT_SACRIFICE_RESOLVED','RC01_CUPID_JOINED','RC01_CUPID_PARTNER','RC01_CUPID_VILLAGER','RC01_SEED_PLANTED'].includes(e.eventType)).map(e=>`<p${['S15_DEEP_WITCH_PRELIMINARY','S15_FINAL_PHARMACIST_PRELIMINARY'].includes(e.eventType)?` data-night="${encode(String(e.payload.round))}"`:''}>${e.eventType==='RC01_CUPID_JOINED'?'Bạn thuộc nhóm Cupid.':e.eventType==='RC01_CUPID_PARTNER'?`Vai của người ghép đôi: ${encode(rname(e.payload.characterId))}`:e.eventType==='RC01_CUPID_VILLAGER'?'Bạn trở thành Dân thường.':e.eventType==='RC01_SEED_PLANTED'?'Đã đặt hạt giống.':e.eventType==='S15_GROWTH_DOG_THIEF_MISS'?'Bắt nhầm người; mất Exciter trong đêm tiếp theo.':e.eventType==='S15_SCALE_BELL_OBSERVED'?`Chuông báo: ${encode(room.members?.find(m=>m.id===e.targetId)?.displayName||'Người chơi')} — ${encode(e.payload.roleName)}.`:e.eventType==='S15_FINAL_REVENGE_AVAILABLE'?'Bạn có quyền báo thù hoặc bỏ qua trước khi xét thắng.':(e.eventType==='S15_DEEP_WITCH_PRELIMINARY'||e.eventType==='S15_FINAL_PHARMACIST_PRELIMINARY')?`Người dự kiến chết đêm này: ${(e.payload.playerIds||[]).map(id=>encode(room.members?.find(m=>m.id===id)?.displayName||'Người chơi')).join(', ')||'Không có'}.`:e.eventType==='S15_BREAK_BALLOT_OFFER'?`Giao kèo ẩn danh: ngày mai bỏ phiếu cho ${encode(room.members?.find(m=>m.id===e.payload.targetId)?.displayName||'Người chơi')} để được miễn treo cổ. Chọn đồng ý hoặc từ chối trong danh sách kỹ năng.`:e.eventType==='S15_BREAK_BALLOT_SETTLED'?(e.payload.status==='FULFILLED'?'Giao kèo đã được thực hiện đúng.':'Giao kèo đã bị phá vỡ.'):e.eventType==='S15_BREAK_BALLOT_RESPONSE'?(e.payload.status==='ACCEPTED'?'Giao kèo đã được chấp nhận.':'Giao kèo bị từ chối.'):e.eventType==='S15_BREAK_STONE_SPENT'?'Bạn đã cứu thành công; trở thành Sói thường.':e.eventType==='S15_BREAK_ALIGNMENT_CHANGED'?'Phong ấn đã vỡ. Bạn gia nhập phe Sói.':e.eventType==='S15_DEEP_RESCUE_APPLIED'?'Bình cứu đã được sử dụng.':e.eventType==='S15_DEMON_FACTION'?`Hai người cùng phe: ${encode(({dan:'Dân làng',soi:'Sói',phe3:'Phe thứ ba'})[e.payload.faction]||'Không xác định')}.`:e.eventType==='S15_VIOLIN_RESULT'?`Đối chiếu phe: ${encode(e.payload.result)}.`:e.eventType==='S15_PUBLIC_ROLE_REVEALED'?`${encode(room.members?.find(m=>m.id===e.payload?.playerId)?.displayName||'Một người chơi')} là ${encode(e.payload.roleName)}.`:e.eventType==='S15_GUARD_OBSERVED'?`Người được bảo vệ: ${(e.payload?.playerIds||[]).map(id=>encode(room.members?.find(m=>m.id===id)?.displayName||'Một người chơi')).join(', ')}.`:e.eventType==='PHASE_CHANGED'?'Trận chuyển sang giai đoạn tiếp theo.':e.eventType==='VOTE_OUTCOME_CONFIRMED'?'Lượt bỏ phiếu đã bị hủy; không ai bị treo.':e.eventType==='SKILL_LOCK_NOTICE'?'Đêm nay bạn không thể sử dụng kỹ năng.':e.eventType==='S14_STONE_ROLE_REVEALED'?`${encode(room.members?.find(m=>m.id===e.payload?.playerId)?.displayName||'Một người chơi')} là Ná Thủ.`:e.eventType==='PUBLIC_CHAT_MUTED'?`${encode(room.members?.find(m=>m.id===e.payload?.playerId)?.displayName||'Một người chơi')} bị câm.`:e.eventType==='S13_DAY_JUDGMENT_REVEALED'?`Nữ Tu Huyết Thệ công khai phán xét ${encode(room.members?.find(m=>m.id===e.targetId)?.displayName||'một người chơi')}: ${encode(e.payload?.revealedRole||'không xác định')}.`:e.eventType==='PLAYER_ELIMINATED'?'Một người chơi đã bị loại.':e.eventType==='CULT_RECRUITED'?'Bạn đã gia nhập giáo phái.':e.eventType==='CULT_RECRUITMENT_RESOLVED'?(e.payload?.success?'Tuyển mộ thành công.':'Tuyển mộ thất bại.'):e.eventType==='CULT_SACRIFICE_RESOLVED'?(e.payload?.success?'Hiến tế thành công.':'Hiến tế thất bại.'):e.eventType==='SOUL_SECRET_REVIVED'?'Bạn đã bí mật hồi sinh với hai viên đạn. Không còn quyền bỏ phiếu.':e.eventType==='PLAYER_REVIVED'?`${encode(room.members?.find(m=>m.id===e.payload?.playerId)?.displayName||'Người chơi')} đã hồi sinh.`:e.eventType==='MATCH_COMPLETED'?'Ván chơi đã kết thúc.':'Có kết quả soi đã được ghi nhận.'}</p>`).join('')}</div>`;
    },
    async verifyReplay(){try{const r=(await this.request(`/api/games/${this.gameId}/replay`)).replay;this.notice=r.verified?'Lịch sử ván chơi đã được đồng bộ.':'Không thể kiểm tra lịch sử lúc này.';this.refreshUI();}catch(e){this.displayError(e);}},
    renderProfile(){const p=this.profile;$('content').innerHTML=`<section class="section"><h2>Hồ sơ cư dân</h2><p><strong>${encode(p?.displayName)}</strong></p><p>Mã người chơi: ${encode(p?.publicId)}</p><p class="muted">Điểm và bảng xếp hạng sẽ xuất hiện khi chế độ chơi đầy đủ ra mắt.</p>${this.notice?`<p role="status" class="wv-inline-notice">${encode(this.notice)}</p>`:''}<form onsubmit="WolvesLive.updateProfile(event)"><label for="wv-profile-name">Tên hiển thị</label><input class="input-field" id="wv-profile-name" maxlength="48" value="${encode(p?.displayName)}"><button class="btn-gold" type="submit">Cập nhật hồ sơ</button></form></section>`;},
    async updateProfile(e){e.preventDefault();if(this.working)return;this.working=true;try{this.profile=(await this.request('/api/profile/me','PATCH',{displayName:$('wv-profile-name').value})).profile;this.notice='Đã cập nhật hồ sơ.';this.renderProfile();updateTopbarAccount();}catch(ex){this.displayError(ex);}finally{this.working=false;}},
    async logout(){window.WolvesFate?.close();try{await this.request('/api/auth/logout','POST',{});}catch{}this.expire();this.game=null;this.gameId=null;this.room=null;this.feedback.clear();this.events=[];this.wheelNode=null;this.compositionNode=null;this.chatNode=null;this.mediumChatNode=null;this.mediumChatDraft='';this.mediumChatTarget=null;this.mediumChatRetry=null;this.mediumChatNotice='';this.chatDraft='';this.rooms=[];this.notice='';state.rooms=[];state.players=[];state.history=[];showAuth('login');updateTopbarAccount();},
  };
  window.WolvesLive=live;
  // Preserve the original artwork, map and stage; replace only fake data/actions.
  window.currentAccount=()=>live.profile?{id:live.profile.publicId,name:live.profile.displayName,avatarId:2}:null;
  window.submitAuth=e=>live.submitAuth(e);
  window.useDemoAccount=()=>live.startDemo();
  window.guestAccess=()=>{if(titleScreenOpen)closeLandingAuth();enterGamePage('roles');};
  window.logoutDemo=()=>live.logout();
  window.renderVillagePanel=entering=>live.renderPanel(entering);
  window.ingame=()=>live.renderGame();
  window.selectStageTarget=numeric=>live.chooseTarget(numeric);
  window.stageActionUseSkill=()=>live.submitSkill();
  window.changeMyStageRole=()=>live.displayError({code:'NO_ROLE_CHANGE'});
  window.toggleStagePhase=()=>live.displayError({code:'NO_PHASE_CHANGE'});
  window.profile=()=>window.WolvesImmersive?window.WolvesImmersive.render('profile'):live.renderProfile();
  window.go=target=>{if(!allowedPage.has(target)){live.notice='Mục này chưa mở. Bạn có thể vào Sảnh làng hoặc khám phá Bách khoa nhân vật.';live.refreshUI();return;}
    if(target==='ingame'&&!live.game){live.displayError({code:'NO_GAME'});return;}
    if(!live.profile&&target!=='roles'&&target!=='settings'){showAuth('login');return;}
    if(target!=='ingame'){window.WolvesFate?.close();document.getElementById('wv2-dialog')?.remove();}
    original.go(target);window.WolvesWorkspace?.scheduleAlerts();
  };
  window.enterNight=()=>{if(!live.profile){showAuth('login');return;}enterGamePage('rooms');};
  window.enterGamePage=(function(old){return function(where){if(!live.profile&&where!=='roles'){showAuth('login');return;}return old(where);};})(window.enterGamePage);
  document.addEventListener('DOMContentLoaded',()=>{
    const content=$('content');if(content){const banner=document.createElement('div');banner.id='wv-connection-status';banner.className='wv-connection-banner';banner.hidden=true;banner.setAttribute('role','status');banner.setAttribute('aria-live','polite');content.parentNode.insertBefore(banner,content);}
    state.rooms=[];state.players=[];state.history=[];
    live.restore();
    // Directory updates while visible, never disrupts room-creation or game controls.
    setInterval(()=>{void live.refreshVisibleLobby();},18000);
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)void live.refreshVisibleLobby();});
  });
})();
