/** Explicit demo-account cleanup. Never deletes normal accounts, joined demo accounts or game history. */
import {loadLocalEnv,requireDatabaseUrl} from './local-env.mjs';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
loadLocalEnv();
if(process.env.WV_CONFIRM_DEMO_CLEANUP!=='YES'){
 console.error('Không thay đổi database. Để dọn Demo đã hết hạn và chưa tham gia phòng/ván, đặt WV_CONFIRM_DEMO_CLEANUP=YES.');
 process.exitCode=2;
}else{
 const store=process.env.DB_PROVIDER==='postgres'
  ?await PostgresMultiplayerStore.connect(requireDatabaseUrl())
  :new SqliteMultiplayerStore(process.env.WV_LOBBY_DB??'./local/sprint03.sqlite');
 try{
  const result=await store.cleanupExpiredDemoAccounts(Date.now());
  console.log(`Demo cleanup: deleted=${result.deleted}, retained_for_history=${result.retained}; regular accounts unchanged.`);
 }finally{await store.close();}
}
