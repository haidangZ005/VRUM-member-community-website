-- Up Migration
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(40) NOT NULL CHECK (type IN ('POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE', 'CONTENT_MODERATED', 'SYSTEM')),
  entity_type VARCHAR(20),
  entity_id UUID,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key VARCHAR(255) UNIQUE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient_created ON notifications(recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications(recipient_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE notification_preferences (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(40) NOT NULL CHECK (type IN ('POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE')),
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, type)
);

-- Down Migration
DROP TABLE notification_preferences;
DROP TABLE notifications;
