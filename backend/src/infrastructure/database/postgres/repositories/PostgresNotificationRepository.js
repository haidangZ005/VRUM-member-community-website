const pool = require('../connection');

const preferenceTypes = ['POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE'];

function mapNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    entityType: row.entity_type,
    entityId: row.entity_id,
    payload: row.payload,
    actor: row.actor_id ? { id: row.actor_id, username: row.actor_username, fullName: row.actor_full_name, avatarUrl: row.actor_avatar_url } : null,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

class PostgresNotificationRepository {
  async create(notification, database = pool) {
    if (!notification.recipientId || notification.recipientId === notification.actorId) return null;
    const ordinaryActivity = ['POST_COMMENT', 'COMMENT_REPLY', 'MENTION', 'POST_VOTE_MILESTONE'].includes(notification.type);
    const { rows } = await database.query(
      `INSERT INTO notifications (recipient_id, actor_id, type, entity_type, entity_id, payload, dedupe_key)
       SELECT $1, $2, $3::varchar, $4, $5, $6::jsonb, $7
       WHERE ($3 = 'CONTENT_MODERATED' OR COALESCE((SELECT in_app_enabled FROM notification_preferences WHERE user_id = $1 AND type = $3), TRUE))
         AND (NOT $8::boolean OR $9::uuid IS NULL OR NOT EXISTS (
           SELECT 1 FROM muted_communities WHERE user_id = $1 AND category_id = $9
         ))
       ON CONFLICT (dedupe_key) DO NOTHING RETURNING *`,
      [notification.recipientId, notification.actorId, notification.type, notification.entityType, notification.entityId,
        JSON.stringify(notification.payload || {}), notification.dedupeKey || null, ordinaryActivity, notification.categoryId || null],
    );
    return mapNotification(rows[0]);
  }

  async list(recipientId, { page, limit, unreadOnly }) {
    const offset = (page - 1) * limit;
    const where = 'n.recipient_id = $1 AND (NOT $2::boolean OR n.read_at IS NULL)';
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `SELECT n.*, u.username AS actor_username, u.full_name AS actor_full_name, u.avatar_url AS actor_avatar_url
         FROM notifications n LEFT JOIN users u ON u.id = n.actor_id
         WHERE ${where} ORDER BY n.created_at DESC LIMIT $3 OFFSET $4`,
        [recipientId, unreadOnly, limit, offset],
      ),
      pool.query(`SELECT COUNT(*)::int AS total FROM notifications n WHERE ${where}`, [recipientId, unreadOnly]),
    ]);
    return { items: itemsResult.rows.map(mapNotification), total: countResult.rows[0].total };
  }

  async unreadCount(recipientId) {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM notifications WHERE recipient_id = $1 AND read_at IS NULL', [recipientId]);
    return rows[0].count;
  }

  async markRead(id, recipientId) {
    const { rows } = await pool.query('UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND recipient_id = $2 RETURNING *', [id, recipientId]);
    return mapNotification(rows[0]);
  }

  async markAllRead(recipientId) {
    const { rowCount } = await pool.query('UPDATE notifications SET read_at = now() WHERE recipient_id = $1 AND read_at IS NULL', [recipientId]);
    return rowCount;
  }

  async getPreferences(userId) {
    const { rows } = await pool.query(
      `SELECT types.type, COALESCE(p.in_app_enabled, TRUE) AS "inAppEnabled"
       FROM unnest($2::text[]) AS types(type)
       LEFT JOIN notification_preferences p ON p.user_id = $1 AND p.type = types.type`,
      [userId, preferenceTypes],
    );
    return rows;
  }

  async updatePreferences(userId, preferences) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const preference of preferences) {
        await client.query(
          `INSERT INTO notification_preferences (user_id, type, in_app_enabled) VALUES ($1, $2, $3)
           ON CONFLICT (user_id, type) DO UPDATE SET in_app_enabled = EXCLUDED.in_app_enabled`,
          [userId, preference.type, preference.inAppEnabled],
        );
      }
      await client.query('COMMIT');
      return this.getPreferences(userId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = PostgresNotificationRepository;
