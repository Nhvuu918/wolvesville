// Local demo is not candidate QA. Environment flags take precedence over .env.
if(process.env.NODE_ENV==='production')throw new Error('Demo is disabled in production');
Object.assign(process.env,{WV_ENABLE_DEMO_AUTH:'1',WV_OFFICIAL_RULE_TEST_MODE:'0',WV_INTEGRATION_TEST_MODE:'0',WV_OWNER_BB_LIVE_QA:'0',WV_OWNER_CULT_QA:'0',WV_RC01_LIFE02_QA:'0',WV_FULL50_QA:'0',WV_ARCHIVED_RULE_REGRESSION:'0',HOST:'127.0.0.1'});
await import('./serve-03.mjs');
