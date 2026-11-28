ALTER TABLE wv_game_sessions ADD COLUMN IF NOT EXISTS coordinator_id UUID REFERENCES wv_accounts(id);
CREATE TABLE IF NOT EXISTS wv_normal_coordination_log(game_id UUID NOT NULL REFERENCES wv_game_sessions(game_id),room_revision BIGINT NOT NULL,from_id UUID NOT NULL REFERENCES wv_accounts(id),to_id UUID NOT NULL REFERENCES wv_accounts(id),at_ms BIGINT NOT NULL,PRIMARY KEY(game_id,room_revision));
