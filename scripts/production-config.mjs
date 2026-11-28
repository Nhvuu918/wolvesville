/** Cloud staging only. Competitive and QA profiles are intentionally unavailable. */
export function productionConfig(env=process.env){
 if(env.NODE_ENV!=='production')throw new Error('NODE_ENV must be production');
 if(env.WV_DEPLOYMENT_PROFILE!=='CLOUD_STAGING')throw new Error('Set WV_DEPLOYMENT_PROFILE=CLOUD_STAGING; public/competitive release is not certified');
 if(env.DB_PROVIDER!=='postgres')throw new Error('Cloud staging requires DB_PROVIDER=postgres');
 for(const key of ['WV_ENABLE_DEMO_AUTH','WV_INTEGRATION_TEST_MODE','WV_OFFICIAL_RULE_TEST_MODE','WV_OWNER_BB_LIVE_QA','WV_OWNER_CULT_QA','WV_RC01_LIFE02_QA','WV_FULL50_QA','WV_ARCHIVED_RULE_REGRESSION','WV_LIFE_MODULES_DEV_NORMAL'])if(env[key]&&env[key]!=='0')throw new Error(`Forbidden cloud flag: ${key}`);
 let url;try{url=new URL(env.DATABASE_URL??'');}catch{throw new Error('DATABASE_URL missing or invalid');}
 if(!['postgres:','postgresql:'].includes(url.protocol)||!url.hostname||!url.username||!url.password||url.pathname.length<2||/YOUR_PASSWORD|CHANGE_ME|PLACEHOLDER/i.test(env.DATABASE_URL))throw new Error('DATABASE_URL invalid or placeholder');
 const port=Number(env.PORT??3212);if(!Number.isSafeInteger(port)||port<1||port>65535)throw new Error('Invalid PORT');
 if(env.HOST&&env.HOST!=='0.0.0.0')throw new Error('Cloud HOST must be 0.0.0.0');
 const origins=(env.ALLOWED_ORIGINS??'').split(',').map(s=>s.trim()).filter(Boolean);
 for(const origin of origins){let u;try{u=new URL(origin);}catch{throw new Error('Invalid ALLOWED_ORIGINS');}if(u.protocol!=='https:'||u.origin!==origin||u.username||u.password)throw new Error('ALLOWED_ORIGINS must be exact HTTPS origins');}
 return {port,host:'0.0.0.0',databaseUrl:env.DATABASE_URL,origins};
}
