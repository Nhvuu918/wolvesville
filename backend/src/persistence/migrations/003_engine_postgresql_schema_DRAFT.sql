-- SCHEMA DRAFT ONLY: NOT CONNECTED TO ENGINE IN SPRINT 02A.
-- Future migration must port the synchronous Sprint 01 EngineRepository
-- contract to an async transactional repository before activating PG game state.
CREATE TABLE IF NOT EXISTS wv_engine_games (
 game_id UUID PRIMARY KEY,room_id UUID NOT NULL,ruleset_version VARCHAR(128) NOT NULL,
 initial_json JSONB NOT NULL,current_json JSONB NOT NULL,
 revision BIGINT NOT NULL DEFAULT 0,last_seq BIGINT NOT NULL DEFAULT 0,
 last_hash VARCHAR(128) NOT NULL DEFAULT 'GENESIS',created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS wv_engine_participants (
 game_id UUID NOT NULL REFERENCES wv_engine_games(game_id) ON DELETE CASCADE,
 player_id UUID NOT NULL,initial_character_id INTEGER NOT NULL,
 initial_faction VARCHAR(32) NOT NULL,
 PRIMARY KEY(game_id,player_id),UNIQUE(game_id,initial_character_id)
);
CREATE TABLE IF NOT EXISTS wv_engine_actions (
 game_id UUID NOT NULL REFERENCES wv_engine_games(game_id) ON DELETE CASCADE,
 action_id UUID NOT NULL,player_id UUID NOT NULL,idempotency_key TEXT NOT NULL,
 fingerprint CHAR(64) NOT NULL,body_json JSONB NOT NULL,status VARCHAR(32) NOT NULL,
 cost_name VARCHAR(128),cost_amount INTEGER NOT NULL DEFAULT 0,
 accepted_seq BIGINT,resolved_seq BIGINT,
 PRIMARY KEY(game_id,action_id),UNIQUE(game_id,player_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS wv_engine_events (
 game_id UUID NOT NULL REFERENCES wv_engine_games(game_id) ON DELETE CASCADE,
 seq BIGINT NOT NULL,event_id UUID NOT NULL UNIQUE,event_json JSONB NOT NULL,
 hash VARCHAR(128) NOT NULL,PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS wv_engine_snapshots (
 game_id UUID NOT NULL REFERENCES wv_engine_games(game_id) ON DELETE CASCADE,
 seq BIGINT NOT NULL,state_json JSONB NOT NULL,state_hash CHAR(64) NOT NULL,
 PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS wv_engine_random_draws (
 game_id UUID NOT NULL REFERENCES wv_engine_games(game_id) ON DELETE CASCADE,
 draw_index BIGINT NOT NULL,record_json JSONB NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
CREATE TABLE IF NOT EXISTS wv_engine_rule_versions (
 rule_version VARCHAR(128) PRIMARY KEY,registry_hash CHAR(64) NOT NULL,created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS wv_engine_audit_failures (
 id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 game_id UUID NOT NULL,action_id UUID,error_code VARCHAR(128) NOT NULL,
 message TEXT NOT NULL,timestamp BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wv_engine_actions_status ON wv_engine_actions(game_id,status);
