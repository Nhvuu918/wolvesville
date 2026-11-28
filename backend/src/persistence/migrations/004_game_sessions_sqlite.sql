-- Additive migration, never replaces Sprint 02A schema. One active test game/room.
CREATE TABLE IF NOT EXISTS game_sessions (
 game_id TEXT PRIMARY KEY,room_id TEXT NOT NULL UNIQUE REFERENCES lobby_rooms(room_id),
 host_id TEXT NOT NULL REFERENCES user_accounts(id),request_key TEXT NOT NULL,start_fingerprint TEXT NOT NULL,
 mode TEXT NOT NULL CHECK(mode='INTEGRATION_TEST'),phase TEXT NOT NULL,revision INTEGER NOT NULL,
 rule_version TEXT NOT NULL,seed_commitment TEXT NOT NULL,kernel_archive BLOB NOT NULL,assigned_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS game_participants (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),player_id TEXT NOT NULL REFERENCES user_accounts(id),
 initial_character_id INTEGER NOT NULL,current_character_id INTEGER NOT NULL,initial_faction TEXT NOT NULL,current_faction TEXT NOT NULL,
 PRIMARY KEY(game_id,player_id),UNIQUE(game_id,initial_character_id)
);
CREATE TABLE IF NOT EXISTS game_assignment_draws (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),draw_index INTEGER NOT NULL,
 domain_json TEXT NOT NULL,result TEXT NOT NULL,reason TEXT NOT NULL,player_id TEXT NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
CREATE TABLE IF NOT EXISTS game_events (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),seq INTEGER NOT NULL,body_json TEXT NOT NULL,
 PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS game_snapshots (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),revision INTEGER NOT NULL,state_hash TEXT NOT NULL,
 PRIMARY KEY(game_id,revision)
);
CREATE TABLE IF NOT EXISTS game_actions (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),action_id TEXT NOT NULL,
 player_id TEXT NOT NULL,idempotency_key TEXT NOT NULL,status TEXT NOT NULL,
 PRIMARY KEY(game_id,action_id),UNIQUE(game_id,player_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS game_random_draws (
 game_id TEXT NOT NULL REFERENCES game_sessions(game_id),draw_index INTEGER NOT NULL,body_json TEXT NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
