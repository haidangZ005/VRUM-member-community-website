const pool = require('../connection');
const Category = require('../../../../domain/entities/Category');

function mapCategory(row) {
  if (!row) return null;
  return new Category({
    id: row.id,
    name: row.name,
    description: row.description,
    avatarUrl: row.avatar_url ?? row.avatarUrl ?? null,
    ownerId: row.owner_id ?? row.ownerId,
    joinedByCurrentUser: row.joined_by_current_user ?? row.joinedByCurrentUser,
    favoriteByCurrentUser: row.favorite_by_current_user ?? row.favoriteByCurrentUser,
    mutedByCurrentUser: row.muted_by_current_user ?? row.mutedByCurrentUser,
    createdAt: row.created_at ?? row.createdAt,
    updatedAt: row.updated_at ?? row.updatedAt,
  });
}

class PostgresCategoryRepository {
  async findById(id, viewerId = null) {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.description, c.avatar_url, c.owner_id AS "ownerId", c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              (cm.user_id IS NOT NULL) AS "joinedByCurrentUser", COALESCE(cm.is_favorite, FALSE) AS "favoriteByCurrentUser",
              (mc.user_id IS NOT NULL) AS "mutedByCurrentUser"
       FROM categories c
       LEFT JOIN community_memberships cm ON cm.category_id = c.id AND cm.user_id = $2::uuid
       LEFT JOIN muted_communities mc ON mc.category_id = c.id AND mc.user_id = $2::uuid
       WHERE c.id = $1`,
      [id, viewerId],
    );
    return mapCategory(rows[0]);
  }

  async list({ search = '', limit = null, ownerId = null, viewerId = null, joinedOnly = false, favoritesOnly = false } = {}) {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.description, c.avatar_url, c.owner_id AS "ownerId", c.created_at AS "createdAt", c.updated_at AS "updatedAt",
              (cm.user_id IS NOT NULL) AS "joinedByCurrentUser", COALESCE(cm.is_favorite, FALSE) AS "favoriteByCurrentUser",
              (mc.user_id IS NOT NULL) AS "mutedByCurrentUser"
       FROM categories c
       LEFT JOIN community_memberships cm ON cm.category_id = c.id AND cm.user_id = $5::uuid
       LEFT JOIN muted_communities mc ON mc.category_id = c.id AND mc.user_id = $5::uuid
       WHERE ($1 = '' OR c.name ILIKE $2)
         AND ($4::uuid IS NULL OR c.owner_id = $4)
         AND ($6::boolean = FALSE OR cm.user_id IS NOT NULL)
         AND ($7::boolean = FALSE OR cm.is_favorite = TRUE)
       ORDER BY COALESCE(cm.is_favorite, FALSE) DESC, c.name ASC
       LIMIT $3`,
      [search, `%${search}%`, limit, ownerId, viewerId, joinedOnly, favoritesOnly],
    );
    return rows.map(mapCategory);
  }

  async findByName(name) {
    const { rows } = await pool.query('SELECT * FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
    return mapCategory(rows[0]);
  }

  async create(category) {
    const { rows } = await pool.query(
      `WITH created AS (
         INSERT INTO categories (name, description, owner_id, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *
       ), joined AS (
         INSERT INTO community_memberships (user_id, category_id)
         SELECT owner_id, id FROM created WHERE owner_id IS NOT NULL
       )
       SELECT * FROM created`,
      [category.name, category.description, category.ownerId, category.avatarUrl],
    );
    return this.findById(rows[0].id, category.ownerId);
  }

  async update(id, category) {
    const { rows } = await pool.query(
      'UPDATE categories SET name = $2, description = $3, avatar_url = $4 WHERE id = $1 RETURNING *',
      [id, category.name, category.description, category.avatarUrl],
    );
    return mapCategory(rows[0]);
  }

  async remove(id) {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
  }

  async join(categoryId, userId) {
    await pool.query(
      'INSERT INTO community_memberships (user_id, category_id) VALUES ($1, $2) ON CONFLICT (user_id, category_id) DO NOTHING',
      [userId, categoryId],
    );
    return this.findById(categoryId, userId);
  }

  async leave(categoryId, userId) {
    await pool.query('DELETE FROM community_memberships WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
    return this.findById(categoryId, userId);
  }

  async setFavorite(categoryId, userId, favorite) {
    if (favorite) {
      await pool.query(
        `INSERT INTO community_memberships (user_id, category_id, is_favorite) VALUES ($1, $2, TRUE)
         ON CONFLICT (user_id, category_id) DO UPDATE SET is_favorite = TRUE`,
        [userId, categoryId],
      );
    } else {
      await pool.query('UPDATE community_memberships SET is_favorite = FALSE WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
    }
    return this.findById(categoryId, userId);
  }

  async setMuted(categoryId, userId, muted) {
    if (muted) {
      await pool.query('INSERT INTO muted_communities (user_id, category_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, categoryId]);
    } else {
      await pool.query('DELETE FROM muted_communities WHERE user_id = $1 AND category_id = $2', [userId, categoryId]);
    }
    return this.findById(categoryId, userId);
  }

  async listRecommended(userId, limit = 5) {
    const { rows } = await pool.query(
      `SELECT c.id, c.name, c.description, c.avatar_url, c.owner_id AS "ownerId",
        c.created_at AS "createdAt", c.updated_at AS "updatedAt",
        FALSE AS "joinedByCurrentUser", FALSE AS "favoriteByCurrentUser", FALSE AS "mutedByCurrentUser"
       FROM categories c
       WHERE NOT EXISTS (
         SELECT 1 FROM community_memberships cm WHERE cm.category_id = c.id AND cm.user_id = $1
       ) AND NOT EXISTS (
         SELECT 1 FROM muted_communities mc WHERE mc.category_id = c.id AND mc.user_id = $1
       ) AND NOT EXISTS (
         SELECT 1 FROM not_interested_posts rf
         WHERE rf.category_id = c.id AND rf.user_id = $1
       )
       ORDER BY CASE WHEN EXISTS (
         SELECT 1 FROM posts interacted
         WHERE interacted.category_id = c.id AND (
           EXISTS (SELECT 1 FROM post_votes pv WHERE pv.post_id = interacted.id AND pv.user_id = $1)
           OR EXISTS (SELECT 1 FROM comments cm WHERE cm.post_id = interacted.id AND cm.author_id = $1)
           OR EXISTS (SELECT 1 FROM post_views viewed WHERE viewed.post_id = interacted.id AND viewed.user_id = $1)
         )
       ) THEN 1 ELSE 0 END DESC, (
         SELECT COUNT(*) FROM posts p WHERE p.category_id = c.id AND p.status = 'published'
           AND p.created_at > now() - interval '30 days'
       ) * 2 + (
         SELECT COUNT(*) FROM comments cm JOIN posts cp ON cp.id = cm.post_id
         WHERE cp.category_id = c.id AND cm.status = 'visible' AND cm.created_at > now() - interval '30 days'
       ) + (
         SELECT COALESCE(SUM(pv.value), 0) FROM post_votes pv JOIN posts vp ON vp.id = pv.post_id
         WHERE vp.category_id = c.id AND pv.updated_at > now() - interval '30 days'
       ) DESC, c.name ASC
       LIMIT $2`,
      [userId, limit],
    );
    return rows.map(mapCategory);
  }

  async count() {
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM categories');
    return rows[0].count;
  }
}

module.exports = PostgresCategoryRepository;
