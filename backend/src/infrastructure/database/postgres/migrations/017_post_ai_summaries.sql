-- Up Migration
CREATE TABLE post_ai_summaries (
  post_id UUID PRIMARY KEY REFERENCES posts(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  source_version CHAR(64) NOT NULL,
  model VARCHAR(100) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE post_ai_summaries;
