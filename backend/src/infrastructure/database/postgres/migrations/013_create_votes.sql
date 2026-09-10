-- Up Migration
CREATE TABLE post_votes (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

INSERT INTO post_votes (post_id, user_id, value, created_at, updated_at)
SELECT post_id, user_id, 1, created_at, created_at FROM likes;

CREATE INDEX idx_post_votes_user ON post_votes(user_id);

CREATE TABLE comment_votes (
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  value SMALLINT NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_votes_user ON comment_votes(user_id);

DROP TABLE likes;

-- Down Migration
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_likes_post_user UNIQUE (post_id, user_id)
);

INSERT INTO likes (post_id, user_id, created_at)
SELECT post_id, user_id, created_at FROM post_votes WHERE value = 1;

CREATE INDEX idx_likes_post ON likes(post_id);
DROP TABLE comment_votes;
DROP TABLE post_votes;
