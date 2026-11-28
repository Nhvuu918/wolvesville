ALTER TABLE game_sessions ADD COLUMN coordinator_id TEXT REFERENCES user_accounts(id);
CREATE TABLE normal_coordination_log(game_id TEXT NOT NULL REFERENCES game_sessions(game_id),room_revision INTEGER NOT NULL,from_id TEXT NOT NULL REFERENCES user_accounts(id),to_id TEXT NOT NULL REFERENCES user_accounts(id),at_ms INTEGER NOT NULL,PRIMARY KEY(game_id,room_revision));
