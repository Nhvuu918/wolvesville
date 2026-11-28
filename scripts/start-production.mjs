import {resolve} from 'node:path';
import {productionConfig} from './production-config.mjs';
import {pgDiagnostic} from './local-env.mjs';
import {PostgresMultiplayerStore} from '../dist/backend/src/multiplayer/pg-store.js';
import {createMultiplayerServer} from '../dist/backend/src/multiplayer/server.js';
let config;try{config=productionConfig();}catch(e){console.error(e.message);process.exit(1);}
let store;try{store=await PostgresMultiplayerStore.connect(config.databaseUrl);await store.healthCheck();}catch(e){console.error(pgDiagnostic(e));await store?.close().catch(()=>{});process.exit(1);}
const app=createMultiplayerServer(store,{staticDir:resolve('frontend'),allowedOrigins:config.origins,demoAuthEnabled:false,integrationTestMode:false,officialRuleTestMode:false,publicOrdinaryVote:process.env.WV_PUBLIC_ORDINARY_VOTE!=='0'});
try{await app.start(config.port,config.host);}catch{console.error('Cloud startup failed');await app.close().catch(()=>{});process.exit(1);}
console.log('Wolvesville CLOUD_STAGING listening on port '+config.port+'; competitive disabled');
let closing=false;for(const signal of ['SIGINT','SIGTERM'])process.on(signal,async()=>{if(closing)return;closing=true;await app.close();process.exit(0);});
