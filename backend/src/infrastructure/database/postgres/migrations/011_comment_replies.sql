-- Up Migration
ALTER TABLE comments ADD COLUMN parent_id UUID REFERENCES comments(id) ON DELETE SET NULL;
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Down Migration
DROP INDEX idx_comments_parent;
ALTER TABLE comments DROP COLUMN parent_id;
