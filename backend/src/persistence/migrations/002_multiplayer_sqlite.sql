PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS user_accounts(
 id TEXT PRIMARY KEY, public_id TEXT NOT NULL UNIQUE, username TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL, password_hash TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_sessions(
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
 expires_at INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_session_user ON auth_sessions(user_id);
CREATE TABLE IF NOT EXISTS lobby_rooms(
 room_id TEXT PRIMARY KEY, room_name TEXT NOT NULL,
 host_id TEXT NOT NULL REFERENCES user_accounts(id), capacity INTEGER NOT NULL CHECK(capacity BETWEEN 1 AND 100),
 status TEXT NOT NULL DEFAULT 'WAITING' CHECK(status IN ('WAITING','LOCKED','IN_GAME','CLOSED')),
 revision INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lobby_members(
 room_id TEXT NOT NULL REFERENCES lobby_rooms(room_id) ON DELETE CASCADE,
 user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
 joined_at INTEGER NOT NULL, PRIMARY KEY(room_id,user_id)
);
CREATE INDEX IF NOT EXISTS idx_member_user ON lobby_members(user_id);
CREATE TABLE IF NOT EXISTS room_game_links(
 room_id TEXT NOT NULL REFERENCES lobby_rooms(room_id), game_id TEXT NOT NULL UNIQUE,
 rule_version TEXT NOT NULL, assigned_at INTEGER NOT NULL, PRIMARY KEY(room_id,game_id)
);
