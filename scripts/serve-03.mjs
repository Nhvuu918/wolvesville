import {resolve} from 'node:path';
import {startupConfig,pgDiagnostic} from './local-env.mjs';
import {SqliteMultiplayerStore} from '../dist/backend/src/multiplayer/sqlite-store.js';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
let config;
try { config=startupConfig(); }
catch(error){console.error(`Lỗi cấu hình: ${error.message}`);process.exit(1);}
if(process.env.WV_OWNER_BB_LIVE_QA==='1'&&(process.env.NODE_ENV==='production'||process.env.WV_OFFICIAL_RULE_TEST_MODE!=='1'||!['127.0.0.1','localhost','::1'].includes(config.host)||config.provider!=='sqlite')){console.error('B/B QA requires loopback SQLite and official test mode; never production');process.exit(1);}
const isPg=config.provider==='postgres';
let store;
try{store=isPg?await PostgresMultiplayerStore.connect(config.databaseUrl):new SqliteMultiplayerStore(process.env.WV_LOBBY_DB??'./local/sprint03.sqlite');}
catch(error){console.error(isPg?pgDiagnostic(error):`Không thể mở SQLite: ${error.message}`);process.exit(1);}

const server=createMultiplayerServer(store,{integrationTestMode:process.env.WV_INTEGRATION_TEST_MODE==='1',officialRuleTestMode:process.env.WV_OFFICIAL_RULE_TEST_MODE==='1'&&process.env.NODE_ENV!=='production',publicOrdinaryVote:process.env.WV_PUBLIC_ORDINARY_VOTE!=='0',staticDir:resolve('frontend'),demoAuthEnabled:process.env.WV_ENABLE_DEMO_AUTH==='1',allowedOrigins:(process.env.ALLOWED_ORIGINS??'').split(',').filter(Boolean)});
let port;
try {
  port=await server.start(config.port,config.host);
} catch(error) {
  if (error?.code==='EADDRINUSE') {
    console.error(`Cổng ${process.env.PORT??3212} đang được sử dụng. Kiểm tra bằng: lsof -nP -iTCP:${process.env.PORT??3212} -sTCP:LISTEN ; hoặc chọn PORT khác trong .env. Không tự đóng tiến trình.`);
    process.exitCode=1;
  } else {console.error(error);process.exitCode=1;}
  await server.close().catch(()=>{});
  if (process.exitCode) process.exit(process.exitCode);
}
console.log(`Wolvesville Sprint07 http://127.0.0.1:${port} | ${isPg?'PostgreSQL':'SQLite'} | officialTest=${process.env.WV_OFFICIAL_RULE_TEST_MODE==='1'} | competitive=DISABLED`);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>void server.close().then(()=>process.exit(0)));
