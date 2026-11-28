-- Sprint 01 operational SQLite migration (Node >=22.13)
-- Repository interface remains independent from Engine Service.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS games (
 game_id TEXT PRIMARY KEY, room_id TEXT NOT NULL, ruleset_version TEXT NOT NULL,
 initial_json TEXT NOT NULL, current_json TEXT NOT NULL,
 revision INTEGER NOT NULL DEFAULT 0, last_seq INTEGER NOT NULL DEFAULT 0,
 last_hash TEXT NOT NULL DEFAULT 'GENESIS', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS participants (
 game_id TEXT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
 player_id TEXT NOT NULL, initial_character_id INTEGER NOT NULL,
 initial_faction TEXT NOT NULL, PRIMARY KEY (game_id,player_id),
 UNIQUE (game_id,initial_character_id)
);
CREATE TABLE IF NOT EXISTS actions (
 game_id TEXT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
 action_id TEXT NOT NULL, player_id TEXT NOT NULL,
 idempotency_key TEXT NOT NULL, fingerprint TEXT NOT NULL,
 body_json TEXT NOT NULL, status TEXT NOT NULL,
 cost_name TEXT, cost_amount INTEGER NOT NULL DEFAULT 0,
 accepted_seq INTEGER, resolved_seq INTEGER,
 PRIMARY KEY (game_id,action_id),
 UNIQUE (game_id,player_id,idempotency_key)
);
CREATE TABLE IF NOT EXISTS events (
 game_id TEXT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
 seq INTEGER NOT NULL, event_id TEXT NOT NULL UNIQUE,
 event_json TEXT NOT NULL, hash TEXT NOT NULL, PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS snapshots (
 game_id TEXT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
 seq INTEGER NOT NULL, state_json TEXT NOT NULL, state_hash TEXT NOT NULL,
 PRIMARY KEY(game_id,seq)
);
CREATE TABLE IF NOT EXISTS random_draws (
 game_id TEXT NOT NULL REFERENCES games(game_id) ON DELETE CASCADE,
 draw_index INTEGER NOT NULL, record_json TEXT NOT NULL,
 PRIMARY KEY(game_id,draw_index)
);
CREATE TABLE IF NOT EXISTS rule_versions (
 rule_version TEXT PRIMARY KEY, registry_hash TEXT NOT NULL,
 created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS kernel_audit_failures (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 game_id TEXT NOT NULL, action_id TEXT, error_code TEXT NOT NULL,
 message TEXT NOT NULL, timestamp INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS actions_by_status ON actions(game_id,status);
