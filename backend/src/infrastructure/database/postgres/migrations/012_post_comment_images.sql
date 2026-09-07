-- Up Migration
ALTER TABLE posts ADD COLUMN images JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 4);
ALTER TABLE comments ADD COLUMN images JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(images) = 'array' AND jsonb_array_length(images) <= 4);

-- Down Migration
ALTER TABLE comments DROP COLUMN images;
ALTER TABLE posts DROP COLUMN images;
