-- Run once with foreign keys disabled, inside a transaction; check all FKs before commit.
ALTER TABLE lobby_rooms ADD COLUMN normal_deck TEXT;
ALTER TABLE lobby_members ADD COLUMN ready INTEGER NOT NULL DEFAULT 0 CHECK(ready IN (0,1));
CREATE TABLE game_sessions_v007 (
 game_id TEXT PRIMARY KEY,room_id TEXT NOT NULL UNIQUE REFERENCES lobby_rooms(room_id),
 host_id TEXT NOT NULL REFERENCES user_accounts(id),request_key TEXT NOT NULL,start_fingerprint TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode IN ('INTEGRATION_TEST','NORMAL_GAMEPLAY')),phase TEXT NOT NULL,revision INTEGER NOT NULL,
 rule_version TEXT NOT NULL,seed_commitment TEXT NOT NULL,kernel_archive BLOB NOT NULL,assigned_at INTEGER NOT NULL,
 rule_pack TEXT NOT NULL DEFAULT 'FIXTURE'
);
INSERT INTO game_sessions_v007(game_id,room_id,host_id,request_key,start_fingerprint,mode,phase,revision,rule_version,seed_commitment,kernel_archive,assigned_at,rule_pack)
 SELECT game_id,room_id,host_id,request_key,start_fingerprint,mode,phase,revision,rule_version,seed_commitment,kernel_archive,assigned_at,rule_pack FROM game_sessions;
DROP TABLE game_sessions;
ALTER TABLE game_sessions_v007 RENAME TO game_sessions;
