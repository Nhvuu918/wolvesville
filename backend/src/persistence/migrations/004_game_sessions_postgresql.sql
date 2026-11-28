-- Sprint 02B additive PostgreSQL migration. Authoritative kernel archive and
-- room transition commit in ONE transaction; relational tables are projections.
CREATE TABLE IF NOT EXISTS wv_game_sessions (
 game_id UUID PRIMARY KEY,room_id UUID NOT NULL UNIQUE REFERENCES wv_rooms(room_id),
 host_id UUID NOT NULL REFERENCES wv_accounts(id),request_key VARCHAR(128) NOT NULL,start_fingerprint CHAR(64) NOT NULL,
 mode VARCHAR(32) NOT NULL CHECK(mode='INTEGRATION_TEST'),
 phase VARCHAR(32) NOT NULL,revision BIGINT NOT NULL,rule_version VARCHAR(128) NOT NULL,
 seed_commitment CHAR(64) NOT NULL,kernel_archive BYTEA NOT NULL,assigned_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS wv_game_participants (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),player_id UUID NOT NULL REFERENCES wv_accounts(id),
 initial_character_id INTEGER NOT NULL,current_character_id INTEGER NOT NULL,initial_faction TEXT NOT NULL,current_faction TEXT NOT NULL,
 PRIMARY KEY(game_id,player_id),UNIQUE(game_id,initial_character_id)
);
CREATE TABLE IF NOT EXISTS wv_game_assignment_draws (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),draw_index INTEGER NOT NULL,
 domain_json JSONB NOT NULL,result TEXT NOT NULL,reason TEXT NOT NULL,player_id UUID NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
CREATE TABLE IF NOT EXISTS wv_game_events (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),seq BIGINT NOT NULL,body_json JSONB NOT NULL,
 PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS wv_game_snapshots (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),revision BIGINT NOT NULL,state_hash CHAR(64) NOT NULL,
 PRIMARY KEY(game_id,revision)
);
CREATE TABLE IF NOT EXISTS wv_game_actions (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),action_id VARCHAR(128) NOT NULL,
 player_id UUID NOT NULL,idempotency_key VARCHAR(128) NOT NULL,status VARCHAR(16) NOT NULL,
 PRIMARY KEY(game_id,action_id),UNIQUE(game_id,player_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS wv_game_random_draws (
 game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),draw_index BIGINT NOT NULL,body_json JSONB NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
CREATE INDEX IF NOT EXISTS idx_wv_game_events_game ON wv_game_events(game_id,seq);
