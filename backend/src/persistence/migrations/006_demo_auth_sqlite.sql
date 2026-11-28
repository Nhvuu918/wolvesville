-- Additive Sprint03 hotfix: anonymous-per-session development demo identities.
-- No modification to existing accounts, games, rooms or historical migrations.
CREATE TABLE IF NOT EXISTS demo_account_meta(
 user_id TEXT PRIMARY KEY REFERENCES user_accounts(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_demo_account_expiry ON demo_account_meta(expires_at);
