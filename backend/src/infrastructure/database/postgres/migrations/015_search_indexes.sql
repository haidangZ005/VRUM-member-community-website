-- Up Migration
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_posts_search ON posts USING GIN (
  to_tsvector('simple'::regconfig, COALESCE(title, '') || ' ' || COALESCE(content, ''))
);

CREATE INDEX idx_comments_search ON comments USING GIN (
  to_tsvector('simple'::regconfig, COALESCE(content, ''))
);

CREATE INDEX idx_categories_search ON categories USING GIN (
  to_tsvector('simple'::regconfig, COALESCE(name, '') || ' ' || COALESCE(description, ''))
);

CREATE INDEX idx_users_search ON users USING GIN (
  to_tsvector('simple'::regconfig, COALESCE(username, '') || ' ' || COALESCE(full_name, ''))
);

CREATE INDEX idx_categories_name_trgm ON categories USING GIN (name gin_trgm_ops);
CREATE INDEX idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);

-- Down Migration
DROP INDEX idx_users_username_trgm;
DROP INDEX idx_categories_name_trgm;
DROP INDEX idx_users_search;
DROP INDEX idx_categories_search;
DROP INDEX idx_comments_search;
DROP INDEX idx_posts_search;
