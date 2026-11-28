-- Sprint 02A PostgreSQL lobby/auth storage. Sprint 01 Kernel remains SQLite
-- until EngineRepository async migration is tested; do not split a game commit.
CREATE TABLE IF NOT EXISTS wv_accounts (
 id UUID PRIMARY KEY, public_id VARCHAR(24) NOT NULL UNIQUE,
 username VARCHAR(32) NOT NULL UNIQUE,display_name VARCHAR(48) NOT NULL,
 password_hash VARCHAR(256) NOT NULL,created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS wv_sessions (
 token_hash CHAR(64) PRIMARY KEY,
 user_id UUID NOT NULL REFERENCES wv_accounts(id) ON DELETE CASCADE,
 expires_at BIGINT NOT NULL,revoked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_wv_sessions_user ON wv_sessions(user_id);
CREATE TABLE IF NOT EXISTS wv_rooms (
 room_id UUID PRIMARY KEY,room_name VARCHAR(72) NOT NULL,
 host_id UUID NOT NULL REFERENCES wv_accounts(id),
 capacity INTEGER NOT NULL CHECK(capacity BETWEEN 1 AND 100),
 status VARCHAR(16) NOT NULL DEFAULT 'WAITING' CHECK(status IN ('WAITING','LOCKED','IN_GAME','CLOSED')),
 revision BIGINT NOT NULL DEFAULT 0,created_at BIGINT NOT NULL
);
CREATE TABLE IF NOT EXISTS wv_members (
 room_id UUID NOT NULL REFERENCES wv_rooms(room_id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES wv_accounts(id) ON DELETE CASCADE,
 joined_at BIGINT NOT NULL,PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_wv_members_user ON wv_members(user_id);
CREATE TABLE IF NOT EXISTS wv_room_game_links (
 room_id UUID NOT NULL REFERENCES wv_rooms(room_id),game_id UUID NOT NULL UNIQUE,
 rule_version VARCHAR(128) NOT NULL,assigned_at BIGINT NOT NULL,
 PRIMARY KEY(room_id,game_id)
);
