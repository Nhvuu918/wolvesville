-- Additive Sprint03 hotfix; independent demo users, no shared credentials.
CREATE TABLE IF NOT EXISTS wv_demo_account_meta(
 user_id UUID PRIMARY KEY REFERENCES wv_accounts(id) ON DELETE CASCADE,
 created_at BIGINT NOT NULL,
 expires_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wv_demo_expiry ON wv_demo_account_meta(expires_at);
