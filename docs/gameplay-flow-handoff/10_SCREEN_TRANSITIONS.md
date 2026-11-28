# Screen Transition Matrix

| Từ | Đến | Trigger | Server kiểm tra | Status |
|---|---|---|---|---|
| Welcome/Login | Lobby | Login/Demo 200/201 | Auth/session | IMPLEMENTED & TESTED |
| Lobby Map | Room preview | Click marker | Room ID có thật trong list | IMPLEMENTED & TESTED |
| Room preview | Room detail | Bấm Tham gia | Capacity/status/ACL | IMPLEMENTED & TESTED |
| Room detail | Game stage | Host khóa và Start | Closed deck, unique roles | IMPLEMENTED & TESTED |
| Night stage | Day stage | Host resolve, Engine commit | Rule Registry, replay | IMPLEMENTED & TESTED |
| Day discussion | Vote intake | Host mở | Host/token/phase | IMPLEMENTED & TESTED |
| Vote intake | Night stage | #79 PH-02 resolved | Host resolve + official adapter | IMPLEMENTED & TESTED |
| Vote intake | Day unresolved | Host khóa vote chưa có PH-02 | Mark CLOSED_UNRESOLVED | PARTIAL |
| Day vote unresolved | Elimination | Missing final vote rules | Fail-closed | BLOCKED BY RULE |
| Elimination | Endgame | Missing death chain/victory closure | Fail-closed | BLOCKED BY RULE |
| Any stage | Same stage on reconnect | WS auth + subscribe | Authorized projection | IMPLEMENTED & TESTED |
| Game stage | Lobby | Người chơi tự điều hướng | Không làm giả hoàn tất trận | IMPLEMENTED & TESTED |
