const Post = require('../../../../domain/entities/Post');
const pool = require('../connection');

function mapPost(row) {
  if (!row) return null;
  return new Post({
    id: row.id,
    authorId: row.author_id,
    categoryId: row.category_id,
    title: row.title,
    content: row.content,
    images: row.images,
    status: row.status,
    author: row.author_username ? {
      id: row.author_id,
      username: row.author_username,
      fullName: row.author_full_name,
      avatarUrl: row.author_avatar_url,
    } : null,
    category: row.category_id ? { id: row.category_id, name: row.category_name } : null,
    score: row.score,
    commentCount: row.comment_count,
    viewerVote: row.viewer_vote,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

const baseSelect = `
  SELECT p.*, u.username AS author_username, u.full_name AS author_full_name,
    u.avatar_url AS author_avatar_url, c.name AS category_name,
    (SELECT COALESCE(SUM(v.value), 0)::int FROM post_votes v WHERE v.post_id = p.id) AS score,
    (SELECT COUNT(*)::int FROM comments cm WHERE cm.post_id = p.id AND cm.status = 'visible') AS comment_count,
    COALESCE((SELECT mine.value FROM post_votes mine WHERE mine.post_id = p.id AND mine.user_id = $1), 0)::int AS viewer_vote
  FROM posts p
  JOIN users u ON u.id = p.author_id
  LEFT JOIN categories c ON c.id = p.category_id`;

class PostgresPostRepository {
  async create(post) {
    const { rows } = await pool.query(
      `INSERT INTO posts (author_id, category_id, title, content, images)
       VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING id`,
      [post.authorId, post.categoryId, post.title, post.content, JSON.stringify(post.images || [])],
    );
    return this.findById(rows[0].id, post.authorId);
  }

  async list({ page, limit, categoryId, viewerId, sort = 'latest' }) {
    const offset = (page - 1) * limit;
    const params = [viewerId, categoryId, limit, offset];
    const orderBy = sort === 'popular' ? 'score DESC, comment_count DESC, p.created_at DESC' : 'p.created_at DESC';
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `${baseSelect}
         WHERE p.status = 'published' AND ($2::uuid IS NULL OR p.category_id = $2)
         ORDER BY ${orderBy} LIMIT $3 OFFSET $4`,
        params,
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM posts
         WHERE status = 'published' AND ($1::uuid IS NULL OR category_id = $1)`,
        [categoryId],
      ),
    ]);
    return { items: itemsResult.rows.map(mapPost), total: countResult.rows[0].total };
  }

  async findById(id, viewerId = null) {
    const { rows } = await pool.query(`${baseSelect} WHERE p.id = $2`, [viewerId, id]);
    return mapPost(rows[0]);
  }

  async update(id, changes, viewerId = null) {
    await pool.query(
      `UPDATE posts SET title = COALESCE($2, title), content = COALESCE($3, content),
       category_id = CASE WHEN $4 THEN $5::uuid ELSE category_id END, images = COALESCE($6::jsonb, images) WHERE id = $1`,
      [id, changes.title, changes.content, Object.prototype.hasOwnProperty.call(changes, 'categoryId'), changes.categoryId, changes.images === undefined ? null : JSON.stringify(changes.images)],
    );
    return this.findById(id, viewerId);
  }

  async remove(id) {
    await pool.query("UPDATE posts SET status = 'removed' WHERE id = $1", [id]);
  }

  async listAll({ page, limit, search, status }) {
    const offset = (page - 1) * limit;
    const pattern = `%${search}%`;
    const [itemsResult, countResult] = await Promise.all([
      pool.query(
        `${baseSelect}
         WHERE ($2 = '' OR p.title ILIKE $3 OR p.content ILIKE $3 OR u.username ILIKE $3)
         AND ($4::post_status IS NULL OR p.status = $4)
         ORDER BY p.created_at DESC LIMIT $5 OFFSET $6`,
        [null, search, pattern, status, limit, offset],
      ),
      pool.query(
        `SELECT COUNT(*)::int AS total FROM posts p JOIN users u ON u.id = p.author_id
         WHERE ($1 = '' OR p.title ILIKE $2 OR p.content ILIKE $2 OR u.username ILIKE $2)
         AND ($3::post_status IS NULL OR p.status = $3)`,
        [search, pattern, status],
      ),
    ]);
    return { items: itemsResult.rows.map(mapPost), total: countResult.rows[0].total };
  }

  async countByStatus() {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'published')::int AS published,
       COUNT(*) FILTER (WHERE status = 'removed')::int AS removed FROM posts`,
    );
    return rows[0];
  }
}

module.exports = PostgresPostRepository;
