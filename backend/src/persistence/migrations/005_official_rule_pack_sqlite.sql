-- Sprint 02C: one-time additive rule-pack migration, invoked after checking table_info.
ALTER TABLE game_sessions ADD COLUMN rule_pack TEXT NOT NULL DEFAULT 'FIXTURE';
