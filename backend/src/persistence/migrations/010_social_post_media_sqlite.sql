-- Additive: image belongs to its post and is served only after the post ACL check.
CREATE TABLE IF NOT EXISTS social_post_media(post_id TEXT PRIMARY KEY REFERENCES social_posts(id) ON DELETE CASCADE,webp TEXT NOT NULL);
