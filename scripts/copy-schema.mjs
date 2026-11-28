import {copyFileSync,mkdirSync} from 'node:fs';
mkdirSync('dist/backend/src/persistence',{recursive:true});
copyFileSync('backend/src/persistence/schema.sql','dist/backend/src/persistence/schema.sql');
mkdirSync('dist/backend/src/persistence/migrations',{recursive:true});
copyFileSync('backend/src/persistence/migrations/002_multiplayer_sqlite.sql','dist/backend/src/persistence/migrations/002_multiplayer_sqlite.sql');

copyFileSync('backend/src/persistence/migrations/004_game_sessions_sqlite.sql','dist/backend/src/persistence/migrations/004_game_sessions_sqlite.sql');
copyFileSync('backend/src/persistence/migrations/005_official_rule_pack_sqlite.sql','dist/backend/src/persistence/migrations/005_official_rule_pack_sqlite.sql');
copyFileSync('backend/src/persistence/migrations/005_official_rule_pack_postgresql.sql','dist/backend/src/persistence/migrations/005_official_rule_pack_postgresql.sql');
copyFileSync('backend/src/persistence/migrations/006_demo_auth_sqlite.sql','dist/backend/src/persistence/migrations/006_demo_auth_sqlite.sql');
copyFileSync('backend/src/persistence/migrations/006_demo_auth_postgresql.sql','dist/backend/src/persistence/migrations/006_demo_auth_postgresql.sql');
for(const name of ['007_normal_gameplay_sqlite.sql','007_normal_gameplay_postgresql.sql','008_normal_coordination_sqlite.sql','008_normal_coordination_postgresql.sql'])copyFileSync('backend/src/persistence/migrations/'+name,'dist/backend/src/persistence/migrations/'+name);

copyFileSync('backend/src/persistence/migrations/009_social_sqlite.sql','dist/backend/src/persistence/migrations/009_social_sqlite.sql');

copyFileSync('backend/src/persistence/migrations/010_social_post_media_sqlite.sql','dist/backend/src/persistence/migrations/010_social_post_media_sqlite.sql');

copyFileSync('backend/src/persistence/migrations/011_progression_sqlite.sql','dist/backend/src/persistence/migrations/011_progression_sqlite.sql');
for(const db of ['sqlite','postgresql'])copyFileSync(`backend/src/persistence/migrations/012_account_workspace_${db}.sql`,`dist/backend/src/persistence/migrations/012_account_workspace_${db}.sql`);
