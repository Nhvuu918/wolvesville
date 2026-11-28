-- Sprint 02C: additive rule-pack discriminator; all legacy sessions default to FIXTURE.
ALTER TABLE wv_game_sessions ADD COLUMN IF NOT EXISTS rule_pack VARCHAR(64) NOT NULL DEFAULT 'FIXTURE';
